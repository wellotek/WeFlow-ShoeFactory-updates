import fs from 'node:fs'
import path from 'node:path'
import { redact } from './security/redact'

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
}

export function createFileLogger(directory: string): Logger {
  const file = path.join(directory, 'logs', 'weflow-shoefactory.log')
  fs.mkdirSync(path.dirname(file), { recursive: true })

  const write = (level: string, message: string, meta?: Record<string, unknown>) => {
    const safeMeta = meta ? redact(meta) : undefined
    const suffix = safeMeta ? ` ${JSON.stringify(safeMeta)}` : ''
    const line = `${new Date().toISOString()} ${level} ${message}${suffix}\n`
    try {
      fs.appendFileSync(file, line, 'utf8')
    } catch {
      // Logging must never break business operations.
    }
  }

  return {
    info: (message, meta) => write('INFO', message, meta),
    warn: (message, meta) => write('WARN', message, meta),
    error: (message, meta) => write('ERROR', message, meta)
  }
}
