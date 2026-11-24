import type { AppDatabase } from './connection'
import { migrations } from './migrations'
import { nowIso } from './sql'

const LEDGER_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  );
`

export function migrate(db: AppDatabase): string[] {
  db.pragma('foreign_keys = ON')
  db.exec(LEDGER_SQL)
  const appliedRows = db.prepare('SELECT id FROM schema_migrations').all() as Array<{ id: string }>
  const applied = new Set(appliedRows.map((row) => row.id))
  const ran: string[] = []

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue
    const apply = db.transaction(() => {
      migration.up(db)
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(migration.id, nowIso())
    })
    apply()
    ran.push(migration.id)
  }

  return ran
}

export function appliedMigrationIds(db: AppDatabase): string[] {
  const rows = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all() as Array<{ id: string }>
  return rows.map((row) => row.id)
}
