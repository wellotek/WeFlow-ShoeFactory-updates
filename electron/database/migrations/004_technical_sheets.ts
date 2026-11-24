import type { AppDatabase } from '../connection'

export const migration = {
  id: '004_technical_sheets',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS technical_sheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id INTEGER UNIQUE NOT NULL REFERENCES shoe_models(id) ON DELETE CASCADE,
        description TEXT,
        notes TEXT,
        available_sizes_json TEXT NOT NULL DEFAULT '[38,39,40,41,42,43,44,45]',
        labor_cost_per_pair REAL NOT NULL DEFAULT 650,
        overhead_cost_per_pair REAL NOT NULL DEFAULT 300,
        target_sale_price REAL NOT NULL DEFAULT 5200,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS technical_sheet_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sheet_id INTEGER NOT NULL REFERENCES technical_sheets(id) ON DELETE CASCADE,
        material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
        base_quantity REAL NOT NULL,
        scrap_percentage REAL NOT NULL DEFAULT 5.0,
        size_adjustments_json TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_tech_sheet_model ON technical_sheets(model_id);
      CREATE INDEX IF NOT EXISTS idx_tech_sheet_items_sheet ON technical_sheet_items(sheet_id);
    `)
  }
}
