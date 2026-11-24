import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import JSZip from 'jszip'
import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { APP_NAME, APP_VERSION } from '@shared/version'

export class BackupService {
  async createBackup(targetDirectory?: string): Promise<{ success: boolean; filePath: string; sizeBytes: number; createdAt: string }> {
    assertLicensed()
    const db = getDatabase()
    const createdAt = new Date().toISOString()
    const dateFormatted = createdAt.replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `weflow-shoefactory-backup-${dateFormatted}.zip`

    const destDir = targetDirectory || path.join(os.homedir(), 'Documents', 'WeFlow-ShoeFactory-Backups')
    fs.mkdirSync(destDir, { recursive: true })
    const finalZipPath = path.join(destDir, fileName)

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weflow-shoe-backup-'))
    const tempDbFile = path.join(tempDir, 'weflow-shoefactory.db')

    try {
      await db.backup(tempDbFile)

      const zip = new JSZip()
      zip.file('data/weflow-shoefactory.db', fs.readFileSync(tempDbFile))
      zip.file(
        'manifest.json',
        JSON.stringify(
          {
            app: APP_NAME,
            product: 'weflow-shoefactory',
            version: APP_VERSION,
            createdAt
          },
          null,
          2
        )
      )

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      fs.writeFileSync(finalZipPath, buffer)

      return {
        success: true,
        filePath: finalZipPath,
        sizeBytes: buffer.byteLength,
        createdAt
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }

  async restoreBackup(zipPath?: string): Promise<{ success: boolean; error?: string }> {
    assertLicensed()
    if (!zipPath || !fs.existsSync(zipPath)) {
      return { success: false, error: 'Fichier de sauvegarde introuvable' }
    }
    try {
      const raw = fs.readFileSync(zipPath)
      const zip = await JSZip.loadAsync(raw)
      const dbEntry = zip.file('data/weflow-shoefactory.db')
      if (!dbEntry) {
        return { success: false, error: 'Archive invalide (base de données introuvable)' }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la restauration' }
    }
  }
}

export const backupService = new BackupService()
