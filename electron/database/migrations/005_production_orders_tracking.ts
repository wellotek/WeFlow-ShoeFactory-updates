import type { AppDatabase } from '../connection'

export const migration = {
  id: '005_production_orders_tracking',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS production_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        model_id INTEGER NOT NULL REFERENCES shoe_models(id),
        color TEXT NOT NULL,
        total_quantity INTEGER NOT NULL,
        size_breakdown_json TEXT NOT NULL,
        start_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        completed_date TEXT,
        manager TEXT NOT NULL DEFAULT 'Ahmed Ali',
        priority TEXT NOT NULL DEFAULT 'Normale',
        status TEXT NOT NULL DEFAULT 'En cours',
        observations TEXT,
        estimated_cost REAL NOT NULL DEFAULT 0,
        actual_cost REAL NOT NULL DEFAULT 0,
        sale_price REAL NOT NULL DEFAULT 0,
        customer_order_id INTEGER,
        completion_percentage REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS production_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
        stage_number INTEGER NOT NULL,
        stage_name_fr TEXT NOT NULL,
        stage_name_ar TEXT NOT NULL,
        planned_quantity INTEGER NOT NULL,
        completed_quantity INTEGER NOT NULL DEFAULT 0,
        rejected_quantity INTEGER NOT NULL DEFAULT 0,
        waiting_quantity INTEGER NOT NULL DEFAULT 0,
        completion_percent REAL NOT NULL DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        operator_name TEXT,
        status TEXT NOT NULL DEFAULT 'En attente',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS production_material_consumptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
        material_id INTEGER NOT NULL REFERENCES raw_materials(id),
        quantity_consumed REAL NOT NULL,
        scrap_quantity REAL NOT NULL DEFAULT 0,
        cost_applied REAL NOT NULL,
        recorded_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_prod_orders_num ON production_orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_prod_stages_order ON production_stages(production_order_id);
    `)
  }
}
