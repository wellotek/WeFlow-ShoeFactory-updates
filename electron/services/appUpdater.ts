import { app, type BrowserWindow } from 'electron'
import electronUpdater, { type UpdateInfo } from 'electron-updater'
import { isNewerVersion, type UpdateSnapshot } from '@shared/updates'
import type { Logger } from '../logger'

function getAutoUpdater() {
  return electronUpdater.autoUpdater
}

export class AppUpdaterService {
  private snapshot: UpdateSnapshot
  private getWindow: () => BrowserWindow | null
  private logger?: Logger
  private initialized = false

  constructor(getWindow: () => BrowserWindow | null, logger?: Logger) {
    this.getWindow = getWindow
    this.logger = logger
    this.snapshot = {
      currentVersion: app.getVersion(),
      availableVersion: null,
      releaseNotes: null,
      phase: 'idle',
      percent: 0,
      error: '',
      packaged: app.isPackaged
    }
  }

  getSnapshot(): UpdateSnapshot {
    return { ...this.snapshot }
  }

  private emit(patch: Partial<UpdateSnapshot>): UpdateSnapshot {
    this.snapshot = { ...this.snapshot, ...patch }
    const win = this.getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('updates:changed', this.snapshot)
    }
    return this.getSnapshot()
  }

  init(): void {
    if (this.initialized) return
    this.initialized = true

    const autoUpdater = getAutoUpdater()
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'wellotek',
      repo: 'WeFlow-ShoeFactory-updates',
      releaseType: 'release'
    })

    autoUpdater.on('checking-for-update', () => {
      this.emit({ phase: 'checking', error: '' })
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      const nextVer = info.version
      if (isNewerVersion(app.getVersion(), nextVer)) {
        this.emit({
          phase: 'available',
          availableVersion: nextVer,
          releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
          percent: 0,
          error: ''
        })
      } else {
        this.emit({ phase: 'idle', availableVersion: null, error: '' })
      }
    })

    autoUpdater.on('update-not-available', () => {
      this.emit({ phase: 'idle', availableVersion: null, percent: 0, error: '' })
    })

    autoUpdater.on('download-progress', (progress) => {
      this.emit({
        phase: 'downloading',
        percent: Math.min(100, Math.max(0, Math.round(progress.percent ?? 0)))
      })
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.emit({
        phase: 'ready',
        availableVersion: info.version,
        percent: 100,
        error: ''
      })
    })

    autoUpdater.on('error', (err) => {
      this.logger?.warn('autoUpdater error', { message: err?.message })
      this.emit({
        phase: 'error',
        error: err?.message || 'Erreur lors de la vérification de mise à jour'
      })
    })
  }

  async checkForUpdates(): Promise<UpdateSnapshot> {
    this.init()
    const autoUpdater = getAutoUpdater()
    try {
      this.emit({ phase: 'checking', error: '' })
      await autoUpdater.checkForUpdates()
    } catch (err: any) {
      this.emit({ phase: 'error', error: err?.message || 'Impossible de joindre le serveur de mise à jour' })
    }
    return this.getSnapshot()
  }

  async downloadUpdate(): Promise<UpdateSnapshot> {
    this.init()
    const autoUpdater = getAutoUpdater()
    try {
      this.emit({ phase: 'downloading', percent: 0, error: '' })
      await autoUpdater.downloadUpdate()
    } catch (err: any) {
      this.emit({ phase: 'error', error: err?.message || 'Erreur de téléchargement' })
    }
    return this.getSnapshot()
  }

  quitAndInstall(): void {
    const autoUpdater = getAutoUpdater()
    autoUpdater.quitAndInstall(false, true)
  }
}
