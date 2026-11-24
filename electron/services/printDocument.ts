import { writeFile } from 'node:fs/promises'
import { BrowserWindow, dialog } from 'electron'

export type PageSizeOption = 'A4' | 'A5' | { width: number; height: number }

async function loadHtml(html: string): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  await win.loadURL(url)
  return win
}

export async function printHtml(html: string, pageSize: PageSizeOption = 'A4'): Promise<{ success: boolean }> {
  const win = await loadHtml(html)
  return new Promise<{ success: boolean }>((resolve) => {
    if (win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
      resolve({ success: false })
      return
    }
    win.webContents.print({ silent: false, printBackground: true, pageSize }, (success) => {
      if (!win.isDestroyed()) {
        try {
          win.close()
        } catch {
          // Closed concurrently
        }
      }
      resolve({ success })
    })
  })
}

export async function savePdf(
  html: string,
  suggestedFilename: string,
  pageSize: PageSizeOption = 'A4'
): Promise<{ cancelled: boolean; path?: string }> {
  const picked = await dialog.showSaveDialog({
    title: 'WeFlow ShoeFactory — Enregistrer le document PDF',
    defaultPath: suggestedFilename.endsWith('.pdf') ? suggestedFilename : `${suggestedFilename}.pdf`,
    filters: [{ name: 'Documents PDF', extensions: ['pdf'] }]
  })

  if (picked.canceled || !picked.filePath) return { cancelled: true }

  const win = await loadHtml(html)
  try {
    if (win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
      return { cancelled: true }
    }
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize
    })
    await writeFile(picked.filePath, pdfBuffer)
    return { cancelled: false, path: picked.filePath }
  } finally {
    if (!win.isDestroyed()) {
      try {
        win.close()
      } catch {
        // Closed concurrently
      }
    }
  }
}
