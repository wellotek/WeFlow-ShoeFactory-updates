import type { AppDatabase } from '../connection'

export const migration = {
  id: '002_models_variants',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS shoe_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        gender TEXT NOT NULL,
        season TEXT,
        collection TEXT,
        description TEXT,
        photo_url TEXT,
        status TEXT NOT NULL DEFAULT 'Actif',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shoe_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id INTEGER NOT NULL REFERENCES shoe_models(id) ON DELETE CASCADE,
        color TEXT NOT NULL,
        size INTEGER NOT NULL,
        barcode TEXT,
        sku TEXT,
        stock_finished INTEGER NOT NULL DEFAULT 0,
        stock_reserved INTEGER NOT NULL DEFAULT 0,
        UNIQUE(model_id, color, size)
      );

      CREATE INDEX IF NOT EXISTS idx_shoe_models_ref ON shoe_models(reference);
      CREATE INDEX IF NOT EXISTS idx_shoe_variants_lookup ON shoe_variants(model_id, color, size);
    `)
  }
}
