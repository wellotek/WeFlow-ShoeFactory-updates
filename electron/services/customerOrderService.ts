import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { CustomerOrder, CustomerOrderItem, ProductionOrder } from '@shared/types'
import { productionService } from './productionService'

export class CustomerOrderService {
  list(filters?: { status?: string; customerId?: number; search?: string }): CustomerOrder[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT co.*, c.name as customer_name, c.phone as customer_phone, c.wilaya as customer_wilaya
      FROM customer_orders co
      JOIN customers c ON co.customer_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.status && filters.status !== 'Tous') {
      sql += ' AND co.status = ?'
      params.push(filters.status)
    }
    if (filters?.customerId) {
      sql += ' AND co.customer_id = ?'
      params.push(filters.customerId)
    }
    if (filters?.search) {
      sql += ' AND (co.order_number LIKE ? OR c.name LIKE ? OR c.company LIKE ?)'
      const term = `%${filters.search}%`
      params.push(term, term, term)
    }

    sql += ' ORDER BY co.id DESC'
    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map((r) => this.mapRow(r, db))
  }

  getById(id: number): CustomerOrder | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare(`
      SELECT co.*, c.name as customer_name, c.phone as customer_phone, c.wilaya as customer_wilaya
      FROM customer_orders co
      JOIN customers c ON co.customer_id = c.id
      WHERE co.id = ?
    `).get(id) as any

    if (!row) return null
    return this.mapRow(row, db)
  }

  create(data: Partial<CustomerOrder> & { items: any[] }): CustomerOrder {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    if (!data.customer_id) throw new Error('Client requis')
    if (!data.items || data.items.length === 0) throw new Error('Articles requis')

    // Generate sequence number
    const seqRow = db.prepare("SELECT current_number, prefix FROM document_sequences WHERE doc_type = 'customer_order'").get() as any
    const nextSeq = (seqRow?.current_number || 486) + 1
    const orderNumber = data.order_number || `${seqRow?.prefix || 'CMD-2024-'}${String(nextSeq).padStart(4, '0')}`

    let totalQty = 0
    let totalAmt = 0
    for (const it of data.items) {
      const q = Number(it.quantity) || 1
      const p = Number(it.unit_price) || 0
      totalQty += q
      totalAmt += q * p
    }

    const discount = Number(data.discount) || 0
    const netTotal = Math.max(0, totalAmt - discount)
    const advance = Number(data.advance_paid) || 0
    const remaining = Math.max(0, netTotal - advance)

    const tx = db.transaction(() => {
      db.prepare("UPDATE document_sequences SET current_number = ? WHERE doc_type = 'customer_order'").run(nextSeq)

      const stmt = db.prepare(`
        INSERT INTO customer_orders (
          order_number, customer_id, order_date, delivery_date, status,
          total_quantity, total_amount, discount, advance_paid, remaining_balance, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const res = stmt.run(
        orderNumber,
        data.customer_id,
        data.order_date || now.slice(0, 10),
        data.delivery_date || null,
        data.status || 'Nouvelle',
        totalQty,
        netTotal,
        discount,
        advance,
        remaining,
        data.notes || '',
        now
      )

      const orderId = Number(res.lastInsertRowid)

      const itemStmt = db.prepare(`
        INSERT INTO customer_order_items (
          order_id, model_id, color, size, quantity, unit_price, total_price, produced_quantity, delivered_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
      `)

      for (const it of data.items) {
        const q = Number(it.quantity) || 1
        const p = Number(it.unit_price) || 0
        itemStmt.run(orderId, it.model_id, it.color || 'Noir', it.size || 40, q, p, q * p)
      }

      // Update client balance due
      if (remaining > 0) {
        db.prepare('UPDATE customers SET balance_due = balance_due + ? WHERE id = ?').run(remaining, data.customer_id)
      }

      return orderId
    })

    const newId = tx()
    return this.getById(newId)!
  }

  updateStatus(id: number, status: string): CustomerOrder {
    assertLicensed()
    const db = getDatabase()
    db.prepare('UPDATE customer_orders SET status = ? WHERE id = ?').run(status, id)
    return this.getById(id)!
  }

  addPayment(id: number, amount: number, _notes?: string): CustomerOrder {
    assertLicensed()
    const db = getDatabase()
    const current = this.getById(id)
    if (!current) throw new Error('Commande introuvable')

    const newAdvance = current.advance_paid + amount
    const newRemaining = Math.max(0, current.total_amount - newAdvance)

    db.transaction(() => {
      db.prepare('UPDATE customer_orders SET advance_paid = ?, remaining_balance = ? WHERE id = ?').run(
        newAdvance,
        newRemaining,
        id
      )
      db.prepare('UPDATE customers SET balance_due = MAX(0, balance_due - ?) WHERE id = ?').run(
        amount,
        current.customer_id
      )
    })()

    return this.getById(id)!
  }

  generateOF(id: number): ProductionOrder[] {
    assertLicensed()
    const order = this.getById(id)
    if (!order) throw new Error('Commande introuvable')

    // Group items by model and color
    const groups = new Map<string, { model_id: number; color: string; sizeMap: Record<string, number> }>()
    for (const it of order.items) {
      const key = `${it.model_id}-${it.color}`
      if (!groups.has(key)) {
        groups.set(key, { model_id: it.model_id, color: it.color, sizeMap: {} })
      }
      const g = groups.get(key)!
      g.sizeMap[String(it.size)] = (g.sizeMap[String(it.size)] || 0) + it.quantity
    }

    const createdOFs: ProductionOrder[] = []
    for (const g of groups.values()) {
      const newOf = productionService.create({
        model_id: g.model_id,
        color: g.color,
        size_breakdown: g.sizeMap,
        customer_order_id: id,
        priority: 'Haute',
        observations: `Généré automatiquement depuis Commande ${order.order_number}`
      })
      createdOFs.push(newOf)
    }

    this.updateStatus(id, 'En production')
    return createdOFs
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM customer_orders WHERE id = ?').run(id)
    return res.changes > 0
  }

  private mapRow(r: any, db: any): CustomerOrder {
    const rawItems = db.prepare(`
      SELECT coi.*, m.reference as model_reference, m.name as model_name
      FROM customer_order_items coi
      JOIN shoe_models m ON coi.model_id = m.id
      WHERE coi.order_id = ?
    `).all(r.id) as CustomerOrderItem[]

    return {
      id: r.id,
      order_number: r.order_number,
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      customer_wilaya: r.customer_wilaya,
      order_date: r.order_date,
      delivery_date: r.delivery_date,
      status: r.status,
      total_quantity: r.total_quantity,
      total_amount: r.total_amount,
      discount: r.discount,
      advance_paid: r.advance_paid,
      remaining_balance: r.remaining_balance,
      notes: r.notes,
      items: rawItems,
      created_at: r.created_at
    }
  }
}

export const customerOrderService = new CustomerOrderService()
