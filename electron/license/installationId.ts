import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { LicenseOperationError } from './errors'

const FILE_NAME = 'installation.id.enc'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type Cipher = {
  encrypt: (plain: string) => Buffer
  decrypt: (buffer: Buffer) => string
}

export function installationIdPath(userDataDir: string): string {
  return path.join(userDataDir, FILE_NAME)
}

export function readInstallationId(userDataDir: string, cipher: Cipher): string | null {
  const file = installationIdPath(userDataDir)
  if (!fs.existsSync(file)) return null
  try {
    const plain = cipher.decrypt(fs.readFileSync(file)).trim()
    if (!UUID_RE.test(plain)) throw new Error('format')
    return plain
  } catch (error) {
    if (error instanceof LicenseOperationError) throw error
    throw new LicenseOperationError('invalid', 'storage error')
  }
}

export function getOrCreateInstallationId(userDataDir: string, cipher: Cipher): string {
  const existing = readInstallationId(userDataDir, cipher)
  if (existing) return existing
  const id = randomUUID()
  fs.mkdirSync(userDataDir, { recursive: true })
  fs.writeFileSync(installationIdPath(userDataDir), cipher.encrypt(id))
  return id
}
