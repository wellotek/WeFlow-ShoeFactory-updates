import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { Delivery, DeliveryItem } from '@shared/types'

export class DeliveryService {
  list(customerId?: number): Delivery[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT d.*, c.name as customer_name
      FROM deliveries d
      JOIN customers c ON d.customer_id = c.id
    `
    const params: any[] = []
    if (customerId) {
      sql += ' WHERE d.customer_id = ?'
      params.push(customerId)
    }
    sql += ' ORDER BY d.id DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map((r) => this.mapRow(r, db))
  }

  getById(id: number): Delivery | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare(`
      SELECT d.*, c.name as customer_name
      FROM deliveries d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.id = ?
    `).get(id) as any

    if (!row) return null
    return this.mapRow(row, db)
  }

  create(data: Partial<Delivery> & { items: any[] }): Delivery {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    if (!data.customer_id) throw new Error('Client requis')
    if (!data.items || data.items.length === 0) throw new Error('Articles requis pour la livraison')

    // Strict validation of finished stock availability
    for (const item of data.items) {
      const v = db.prepare('SELECT stock_finished FROM shoe_variants WHERE model_id = ? AND color = ? AND size = ?').get(item.model_id, item.color, item.size) as any
      const available = v ? v.stock_finished : 0
      if (available < item.quantity) {
        throw new Error(`Stock insuffisant pour livrer ${item.quantity} paires (Taille ${item.size}, Couleur ${item.color} - Stock disponible: ${available})`)
      }
    }

    const seqRow = db.prepare("SELECT current_number, prefix FROM document_sequences WHERE doc_type = 'delivery'").get() as any
    const nextSeq = (seqRow?.current_number || 9485) + 1
    const deliveryNumber = data.delivery_number || `${seqRow?.prefix || 'BL-'}${String(nextSeq)}`

    const tx = db.transaction(() => {
      db.prepare("UPDATE document_sequences SET current_number = ? WHERE doc_type = 'delivery'").run(nextSeq)

      const stmt = db.prepare(`
        INSERT INTO deliveries (delivery_number, customer_order_id, customer_id, delivery_date, status, driver_name, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const res = stmt.run(
        deliveryNumber,
        data.customer_order_id || null,
        data.customer_id,
        data.delivery_date || now.slice(0, 10),
        data.status || 'En préparation',
        data.driver_name || 'Chauffeur Usine',
        data.notes || '',
        now
      )

      const delId = Number(res.lastInsertRowid)

      const itemStmt = db.prepare(`
        INSERT INTO delivery_items (delivery_id, model_id, color, size, quantity)
        VALUES (?, ?, ?, ?, ?)
      `)

      for (const it of data.items) {
        const q = Number(it.quantity) || 1
        itemStmt.run(delId, it.model_id, it.color || 'Noir', it.size || 40, q)

        // Deduct from shoe_variants stock_finished
        db.prepare('UPDATE shoe_variants SET stock_finished = stock_finished - ? WHERE model_id = ? AND color = ? AND size = ?').run(
          q,
          it.model_id,
          it.color,
          it.size
        )

        // If part of customer order, update delivered_quantity
        if (data.customer_order_id) {
          db.prepare(`
            UPDATE customer_order_items SET delivered_quantity = delivered_quantity + ?
            WHERE order_id = ? AND model_id = ? AND color = ? AND size = ?
          `).run(q, data.customer_order_id, it.model_id, it.color, it.size)
        }
      }

      if (data.customer_order_id) {
        // Check if customer order is now delivered
        const pendingItems = db.prepare(`
          SELECT SUM(quantity - delivered_quantity) as remaining
          FROM customer_order_items WHERE order_id = ?
        `).get(data.customer_order_id) as any

        if (pendingItems && (pendingItems.remaining === null || pendingItems.remaining <= 0)) {
          db.prepare("UPDATE customer_orders SET status = 'Livrée' WHERE id = ?").run(data.customer_order_id)
        }
      }

      return delId
    })

    const newId = tx()
    return this.getById(newId)!
  }

  updateStatus(id: number, status: string): Delivery {
    assertLicensed()
    const db = getDatabase()
    db.prepare('UPDATE deliveries SET status = ? WHERE id = ?').run(status, id)
    return this.getById(id)!
  }

  private mapRow(r: any, db: any): Delivery {
    const rawItems = db.prepare(`
      SELECT di.*, m.reference as model_reference, m.name as model_name
      FROM delivery_items di
      JOIN shoe_models m ON di.model_id = m.id
      WHERE di.delivery_id = ?
    `).all(r.id) as DeliveryItem[]

    return {
      id: r.id,
      delivery_number: r.delivery_number,
      customer_order_id: r.customer_order_id,
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      delivery_date: r.delivery_date,
      status: r.status,
      driver_name: r.driver_name,
      notes: r.notes,
      items: rawItems,
      created_at: r.created_at
    }
  }
}

export const deliveryService = new DeliveryService()
