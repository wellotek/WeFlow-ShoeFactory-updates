import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

export type AppDatabase = Database.Database

export function databasePath(userDataDir: string): string {
  return path.join(userDataDir, 'data', 'weflow-shoefactory.db')
}

export function openDatabase(dbPath: string): AppDatabase {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  const quickCheck = db.pragma('quick_check', { simple: true })
  if (quickCheck !== 'ok') {
    db.close()
    throw new Error(`SQLite quick_check failed: ${String(quickCheck)}`)
  }
  return db
}

let current: AppDatabase | null = null
let currentPath: string | null = null

export function initDatabase(userDataDir: string): AppDatabase {
  closeDatabase()
  const dbPath = databasePath(userDataDir)
  current = openDatabase(dbPath)
  currentPath = dbPath
  return current
}

export function getDatabase(): AppDatabase {
  if (!current) {
    throw new Error('Database is not initialized')
  }
  return current
}

export function getDatabaseFilePath(): string {
  if (!currentPath) {
    throw new Error('Database is not initialized')
  }
  return currentPath
}

export function setDatabaseForTesting(db: AppDatabase | null): void {
  current = db
  currentPath = db ? ':memory:' : null
}

export function closeDatabase(): void {
  if (!current) return
  try {
    current.pragma('wal_checkpoint(TRUNCATE)')
  } catch {
    // Checkpoint is best-effort before close.
  }
  current.close()
  current = null
  currentPath = null
}
