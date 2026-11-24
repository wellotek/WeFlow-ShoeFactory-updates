import type { AppDatabase } from '../connection'

export const migration = {
  id: '009_quality_machines',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS quality_inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_number TEXT NOT NULL,
        production_order_id INTEGER REFERENCES production_orders(id) ON DELETE SET NULL,
        model_id INTEGER REFERENCES shoe_models(id) ON DELETE SET NULL,
        model_name TEXT NOT NULL,
        size INTEGER,
        quantity_inspected INTEGER NOT NULL,
        quantity_accepted INTEGER NOT NULL,
        quantity_rejected INTEGER NOT NULL,
        defect_cause TEXT,
        severity TEXT NOT NULL DEFAULT 'Moyenne',
        action_taken TEXT NOT NULL DEFAULT 'Rejeté',
        notes TEXT,
        inspector_name TEXT NOT NULL DEFAULT 'Contrôleur Qualité',
        inspection_date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        machine_type TEXT NOT NULL,
        acquisition_date TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        location TEXT,
        next_maintenance_date TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS machine_maintenances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
        maintenance_type TEXT NOT NULL DEFAULT 'Préventive',
        intervention_date TEXT NOT NULL,
        cost REAL NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        technician_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planifiée'
      );

      CREATE INDEX IF NOT EXISTS idx_quality_lot ON quality_inspections(lot_number);
      CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(code);
    `)
  }
}
