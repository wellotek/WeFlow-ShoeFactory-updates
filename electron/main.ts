import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, dialog, Menu, safeStorage } from 'electron'
import { closeDatabase, initDatabase } from './database/connection'
import { migrate } from './database/migrate'
import { registerIpc } from './ipc/register'
import { LicenseOperationError } from './license/errors'
import { setLicenseService } from './license/guard'
import { LicenseService } from './license/service'
import { createFileLogger } from './logger'
import { AppUpdaterService } from './services/appUpdater'

let mainWindow: BrowserWindow | null = null
let logger: ReturnType<typeof createFileLogger> | null = null
let updaterService: AppUpdaterService | null = null
let isBooting = false
let isBooted = false
let isQuitting = false

function electronCipher() {
  return {
    encrypt(plain: string) {
      if (!safeStorage.isEncryptionAvailable()) throw new LicenseOperationError('storage')
      return safeStorage.encryptString(plain)
    },
    decrypt(buffer: Buffer) {
      if (!safeStorage.isEncryptionAvailable()) throw new LicenseOperationError('storage')
      return safeStorage.decryptString(buffer)
    }
  }
}

function windowIcon(): string | undefined {
  const candidates = [
    process.resourcesPath ? join(process.resourcesPath, 'icon.ico') : '',
    join(app.getAppPath(), 'resources', 'icon.ico'),
    join(__dirname, '../../resources/icon.ico')
  ].filter(Boolean)
  return candidates.find((file) => existsSync(file))
}

function createWindow(log?: ReturnType<typeof createFileLogger>): BrowserWindow {
  const icon = windowIcon()
  const win = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#F4F6F8',
    title: 'WeFlow ShoeFactory',
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged
    }
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env.ELECTRON_RENDERER_URL
    if (devUrl && url.startsWith(devUrl)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
  })

  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        win.webContents.toggleDevTools()
        event.preventDefault()
      }
    })
  }

  let shown = false
  let fallbackTimer: NodeJS.Timeout | null = null

  const showWindow = () => {
    if (shown || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) return
    shown = true
    if (fallbackTimer) {
      clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
      log?.info('window shown')
    }
  }

  win.once('ready-to-show', showWindow)
  win.webContents.once('did-finish-load', showWindow)
  fallbackTimer = setTimeout(showWindow, 2500)

  win.on('closed', () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
    if (mainWindow === win) {
      mainWindow = null
    }
    log?.info('window closed')
  })

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return
    log?.warn('renderer load failed', { errorCode, errorDescription, validatedURL })
    if (process.env.ELECTRON_RENDERER_URL && validatedURL.startsWith(process.env.ELECTRON_RENDERER_URL)) {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        void win.loadFile(join(__dirname, '../renderer/index.html'))
      }
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL).catch((err) => {
      log?.error('failed to load dev url, falling back to file', { error: String(err) })
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        void win.loadFile(join(__dirname, '../renderer/index.html'))
      }
    })
  } else {
    if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
      void win.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  return win
}

async function boot(): Promise<void> {
  if (isBooting || isBooted) return
  isBooting = true

  app.setAppUserModelId('com.weflow.shoefactory')
  Menu.setApplicationMenu(null)
  const userDataDir = app.getPath('userData')
  logger = createFileLogger(userDataDir)
  logger.info('WeFlow ShoeFactory starting', { version: app.getVersion() })

  try {
    const db = initDatabase(userDataDir)
    migrate(db)
    logger.info('database migrated and ready')
  } catch (error) {
    logger.error('database init failed', { error: error instanceof Error ? error.message : String(error) })
    dialog.showErrorBox(
      'WeFlow ShoeFactory',
      'La base de données locale ne peut pas être initialisée.\nتعذر فتح قاعدة البيانات المحلية.'
    )
    isBooting = false
    app.quit()
    return
  }

  setLicenseService(
    new LicenseService({
      userDataDir,
      cipher: electronCipher(),
      logger,
      appVersion: app.getVersion()
    })
  )

  updaterService = new AppUpdaterService(() => mainWindow, logger)

  registerIpc({ userDataDir, updaterService, logger })
  mainWindow = createWindow(logger)
  isBooting = false
  isBooted = true

  if (app.isPackaged) {
    setTimeout(() => {
      updaterService?.checkForUpdates().catch((err) => {
        logger?.warn('auto check for updates error', { error: String(err) })
      })
    }, 5000)
  }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    logger?.info('second-instance event')
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    } else if (app.isReady() && !isQuitting && !isBooting) {
      mainWindow = createWindow(logger ?? undefined)
    }
  })

  app.on('activate', () => {
    logger?.info('activate event')
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    } else if (app.isReady() && !isQuitting && !isBooting) {
      mainWindow = createWindow(logger ?? undefined)
    }
  })

  app.whenReady().then(boot).catch((error: unknown) => {
    logger?.error('startup failed', { error: error instanceof Error ? error.message : String(error) })
    dialog.showErrorBox('WeFlow ShoeFactory', error instanceof Error ? error.name : 'startup')
    app.quit()
  })

  app.on('window-all-closed', () => {
    mainWindow = null
    app.quit()
  })

  app.on('before-quit', () => {
    isQuitting = true
    closeDatabase()
  })
}
