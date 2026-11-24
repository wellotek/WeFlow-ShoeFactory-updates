import type { AppDatabase } from '../connection'

export const migration = {
  id: '008_purchases',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_number TEXT UNIQUE NOT NULL,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
        purchase_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Commandé',
        total_amount REAL NOT NULL DEFAULT 0,
        paid_amount REAL NOT NULL DEFAULT 0,
        remaining_balance REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
        material_id INTEGER NOT NULL REFERENCES raw_materials(id),
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        received_quantity REAL NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_purchases_num ON purchases(purchase_number);
    `)
  }
}
