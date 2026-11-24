import type { AppDatabase } from '../connection'

export const migration = {
  id: '007_customer_orders_deliveries',
  up(db: AppDatabase): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        order_date TEXT NOT NULL,
        delivery_date TEXT,
        status TEXT NOT NULL DEFAULT 'Nouvelle',
        total_quantity INTEGER NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        advance_paid REAL NOT NULL DEFAULT 0,
        remaining_balance REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customer_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
        model_id INTEGER NOT NULL REFERENCES shoe_models(id),
        color TEXT NOT NULL,
        size INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        produced_quantity INTEGER NOT NULL DEFAULT 0,
        delivered_quantity INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        delivery_number TEXT UNIQUE NOT NULL,
        customer_order_id INTEGER REFERENCES customer_orders(id) ON DELETE SET NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        delivery_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'En préparation',
        driver_name TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS delivery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
        model_id INTEGER NOT NULL REFERENCES shoe_models(id),
        color TEXT NOT NULL,
        size INTEGER NOT NULL,
        quantity INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_customer_orders_num ON customer_orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_deliveries_num ON deliveries(delivery_number);
    `)
  }
}
