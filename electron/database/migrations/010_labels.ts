import type { AppDatabase } from '../connection'

export const migration = {
  id: '010_labels',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS label_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        width_mm REAL NOT NULL,
        height_mm REAL NOT NULL,
        margins_mm REAL NOT NULL,
        barcode_type TEXT NOT NULL DEFAULT 'code128'
      );

      INSERT OR IGNORE INTO label_templates (id, name, width_mm, height_mm, margins_mm, barcode_type) VALUES
        ('shoe_box_standard', 'Étiquette Boîte Chaussure (100x50 mm)', 100, 50, 2, 'code128'),
        ('carton_shipping', 'Étiquette Carton Expédition (100x75 mm)', 100, 75, 3, 'code128'),
        ('batch_production', 'Étiquette Lot de Fabrication QR (70x40 mm)', 70, 40, 2, 'qr');
    `)
  }
}
