import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { PurchaseOrder, PurchaseOrderItem } from '@shared/types'

export class PurchaseService {
  list(supplierId?: number): PurchaseOrder[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
    `
    const params: any[] = []
    if (supplierId) {
      sql += ' WHERE p.supplier_id = ?'
      params.push(supplierId)
    }
    sql += ' ORDER BY p.id DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map((r) => this.mapRow(r, db))
  }

  getById(id: number): PurchaseOrder | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(id) as any

    if (!row) return null
    return this.mapRow(row, db)
  }

  create(data: Partial<PurchaseOrder> & { items: any[] }): PurchaseOrder {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    if (!data.supplier_id) throw new Error('Fournisseur requis')
    if (!data.items || data.items.length === 0) throw new Error('Articles requis')

    const seqRow = db.prepare("SELECT current_number, prefix FROM document_sequences WHERE doc_type = 'purchase'").get() as any
    const nextSeq = (seqRow?.current_number || 10) + 1
    const purchaseNumber = data.purchase_number || `${seqRow?.prefix || 'ACH-2024-'}${String(nextSeq).padStart(3, '0')}`

    let totalAmt = 0
    for (const it of data.items) {
      const q = Number(it.quantity) || 1
      const p = Number(it.unit_price) || 0
      totalAmt += q * p
    }

    const paid = Number(data.paid_amount) || 0
    const remaining = Math.max(0, totalAmt - paid)

    const tx = db.transaction(() => {
      db.prepare("UPDATE document_sequences SET current_number = ? WHERE doc_type = 'purchase'").run(nextSeq)

      const stmt = db.prepare(`
        INSERT INTO purchases (purchase_number, supplier_id, purchase_date, status, total_amount, paid_amount, remaining_balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const res = stmt.run(
        purchaseNumber,
        data.supplier_id,
        data.purchase_date || now.slice(0, 10),
        data.status || 'Commandé',
        totalAmt,
        paid,
        remaining,
        now
      )

      const purchaseId = Number(res.lastInsertRowid)

      const itemStmt = db.prepare(`
        INSERT INTO purchase_items (purchase_id, material_id, quantity, unit_price, total_price, received_quantity)
        VALUES (?, ?, ?, ?, ?, 0)
      `)

      for (const it of data.items) {
        const q = Number(it.quantity) || 1
        const p = Number(it.unit_price) || 0
        itemStmt.run(purchaseId, it.material_id, q, p, q * p)
      }

      if (remaining > 0) {
        db.prepare('UPDATE suppliers SET balance_due = balance_due + ? WHERE id = ?').run(remaining, data.supplier_id)
      }

      return purchaseId
    })

    const newId = tx()
    return this.getById(newId)!
  }

  receiveGoods(purchaseId: number, receivedItems: Array<{ material_id: number; quantity: number }>): PurchaseOrder {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()
    const po = this.getById(purchaseId)
    if (!po) throw new Error('Achat introuvable')

    const tx = db.transaction(() => {
      for (const item of receivedItems) {
        const qty = Number(item.quantity)
        if (qty <= 0) continue

        // Update purchase_item received quantity
        db.prepare(`
          UPDATE purchase_items SET received_quantity = received_quantity + ?
          WHERE purchase_id = ? AND material_id = ?
        `).run(qty, purchaseId, item.material_id)

        // Increment raw_material stock
        const mat = db.prepare('SELECT stock_quantity, min_threshold FROM raw_materials WHERE id = ?').get(item.material_id) as any
        if (mat) {
          const newStock = mat.stock_quantity + qty
          const status = newStock <= mat.min_threshold ? 'حرج' : 'كافٍ'
          db.prepare('UPDATE raw_materials SET stock_quantity = ?, status = ? WHERE id = ?').run(newStock, status, item.material_id)

          // Record movement
          db.prepare(`
            INSERT INTO material_movements (material_id, movement_type, quantity, origin, destination, user_name, reason, created_at)
            VALUES (?, 'in', ?, ?, 'Magasin MP', 'Réceptionnaire', ?, ?)
          `).run(item.material_id, qty, po.supplier_name, `Réception bon d'achat ${po.purchase_number}`, now)
        }
      }

      // Check if all items fully received
      const updatedPo = this.getById(purchaseId)!
      const allDone = updatedPo.items.every((it) => it.received_quantity >= it.quantity)
      const someDone = updatedPo.items.some((it) => it.received_quantity > 0)
      const newStatus = allDone ? 'Reçu' : someDone ? 'Partiellement reçu' : po.status

      db.prepare('UPDATE purchases SET status = ? WHERE id = ?').run(newStatus, purchaseId)
    })

    tx()
    return this.getById(purchaseId)!
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM purchases WHERE id = ?').run(id)
    return res.changes > 0
  }

  private mapRow(r: any, db: any): PurchaseOrder {
    const rawItems = db.prepare(`
      SELECT pi.*, m.code as material_code, m.designation as material_name, m.unit as unit
      FROM purchase_items pi
      JOIN raw_materials m ON pi.material_id = m.id
      WHERE pi.purchase_id = ?
    `).all(r.id) as PurchaseOrderItem[]

    return {
      id: r.id,
      purchase_number: r.purchase_number,
      supplier_id: r.supplier_id,
      supplier_name: r.supplier_name,
      purchase_date: r.purchase_date,
      status: r.status,
      total_amount: r.total_amount,
      paid_amount: r.paid_amount,
      remaining_balance: r.remaining_balance,
      items: rawItems,
      created_at: r.created_at
    }
  }
}

export const purchaseService = new PurchaseService()
