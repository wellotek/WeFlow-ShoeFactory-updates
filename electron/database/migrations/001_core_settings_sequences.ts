import type { AppDatabase } from '../connection'

export const migration = {
  id: '001_core_settings_sequences',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL DEFAULT 'WeFlow ShoeFactory SARL',
        activity TEXT NOT NULL DEFAULT 'Fabrication et Façonnage de Chaussures et Maroquinerie',
        address TEXT NOT NULL DEFAULT 'Zone Industrielle Oued Smar, Lot 45',
        city TEXT NOT NULL DEFAULT 'Alger',
        wilaya TEXT NOT NULL DEFAULT '16 - Alger',
        phone TEXT NOT NULL DEFAULT '0550 12 34 56',
        email TEXT NOT NULL DEFAULT 'contact@weflow-shoes.dz',
        rc TEXT NOT NULL DEFAULT '16/00-1234567B22',
        nif TEXT NOT NULL DEFAULT '002216012345678',
        nis TEXT NOT NULL DEFAULT '0022160100123',
        ai TEXT NOT NULL DEFAULT '16012345678',
        logo_url TEXT
      );

      INSERT OR IGNORE INTO company_profile (id) VALUES (1);

      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        language TEXT NOT NULL DEFAULT 'fr',
        currency TEXT NOT NULL DEFAULT 'DA',
        auto_backup INTEGER NOT NULL DEFAULT 1,
        print_format TEXT NOT NULL DEFAULT 'A4',
        default_margin_percent REAL NOT NULL DEFAULT 35.0,
        theme TEXT NOT NULL DEFAULT 'light'
      );

      INSERT OR IGNORE INTO app_settings (id) VALUES (1);

      CREATE TABLE IF NOT EXISTS document_sequences (
        doc_type TEXT PRIMARY KEY,
        current_number INTEGER NOT NULL DEFAULT 0,
        prefix TEXT NOT NULL
      );

      INSERT OR IGNORE INTO document_sequences (doc_type, current_number, prefix) VALUES
        ('model', 4, 'SF-'),
        ('material', 6, 'MAT-'),
        ('production_order', 15, 'PR-2026-'),
        ('customer_order', 486, 'CMD-2024-'),
        ('delivery', 9485, 'BL-'),
        ('purchase', 10, 'ACH-2024-'),
        ('quality_lot', 2084, 'B-');
    `)
  }
}
