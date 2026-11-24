import type { AppDatabase } from '../connection'

export const migration = {
  id: '003_materials_movements',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        designation TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL DEFAULT 0,
        stock_quantity REAL NOT NULL DEFAULT 0,
        min_threshold REAL NOT NULL DEFAULT 10,
        supplier_id INTEGER,
        supplier_name TEXT,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'كافٍ',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS material_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
        movement_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        origin TEXT,
        destination TEXT,
        user_name TEXT,
        reason TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(code);
      CREATE INDEX IF NOT EXISTS idx_material_movements_mat ON material_movements(material_id);
    `)
  }
}
