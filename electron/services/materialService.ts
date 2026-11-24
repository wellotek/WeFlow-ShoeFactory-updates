import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { MaterialMovement, RawMaterial } from '@shared/types'

export class MaterialService {
  list(filters?: { category?: string; search?: string; lowStockOnly?: boolean }): RawMaterial[] {
    assertLicensed()
    const db = getDatabase()
    let sql = 'SELECT * FROM raw_materials WHERE 1=1'
    const params: any[] = []

    if (filters?.category) {
      sql += ' AND category = ?'
      params.push(filters.category)
    }
    if (filters?.lowStockOnly) {
      sql += ' AND stock_quantity <= min_threshold'
    }
    if (filters?.search) {
      sql += ' AND (code LIKE ? OR designation LIKE ? OR supplier_name LIKE ?)'
      const term = `%${filters.search}%`
      params.push(term, term, term)
    }

    sql += ' ORDER BY id ASC'
    const rows = db.prepare(sql).all(...params) as any[]

    return rows.map((r) => this.mapRow(r))
  }

  getById(id: number): RawMaterial | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM raw_materials WHERE id = ?').get(id) as any
    if (!row) return null
    return this.mapRow(row)
  }

  create(data: Partial<RawMaterial>): RawMaterial {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    const stock = data.stock_quantity ?? 0
    const minThresh = data.min_threshold ?? 10
    const status = stock <= minThresh ? 'حرج' : 'كافٍ'

    const stmt = db.prepare(`
      INSERT INTO raw_materials (code, designation, category, unit, unit_price, stock_quantity, min_threshold, supplier_id, supplier_name, location, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const res = stmt.run(
      data.code,
      data.designation,
      data.category || 'Consommables',
      data.unit || 'unités',
      data.unit_price ?? 0,
      stock,
      minThresh,
      data.supplier_id || null,
      data.supplier_name || null,
      data.location || null,
      status,
      now
    )

    const matId = Number(res.lastInsertRowid)

    if (stock > 0) {
      db.prepare(`
        INSERT INTO material_movements (material_id, movement_type, quantity, origin, destination, user_name, reason, created_at)
        VALUES (?, 'in', ?, 'Stock Initial', 'Magasin MP', 'Système', 'Initialisation stock', ?)
      `).run(matId, stock, now)
    }

    return this.getById(matId)!
  }

  update(id: number, data: Partial<RawMaterial>): RawMaterial {
    assertLicensed()
    const db = getDatabase()
    const current = this.getById(id)
    if (!current) throw new Error('Matière première introuvable')

    const newStock = data.stock_quantity ?? current.stock_quantity
    const newThreshold = data.min_threshold ?? current.min_threshold
    const status = newStock <= newThreshold ? 'حرج' : 'كافٍ'

    db.prepare(`
      UPDATE raw_materials SET
        code = ?, designation = ?, category = ?, unit = ?, unit_price = ?,
        stock_quantity = ?, min_threshold = ?, supplier_id = ?, supplier_name = ?,
        location = ?, status = ?
      WHERE id = ?
    `).run(
      data.code ?? current.code,
      data.designation ?? current.designation,
      data.category ?? current.category,
      data.unit ?? current.unit,
      data.unit_price ?? current.unit_price,
      newStock,
      newThreshold,
      data.supplier_id !== undefined ? data.supplier_id : current.supplier_id,
      data.supplier_name !== undefined ? data.supplier_name : current.supplier_name,
      data.location !== undefined ? data.location : current.location,
      status,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM raw_materials WHERE id = ?').run(id)
    return res.changes > 0
  }

  recordMovement(data: Partial<MaterialMovement>): RawMaterial {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    if (!data.material_id) throw new Error('ID matière requis')
    const qty = Number(data.quantity)
    if (isNaN(qty) || qty <= 0) throw new Error('Quantité invalide')

    const current = this.getById(data.material_id)
    if (!current) throw new Error('Matière première introuvable')

    let newStock = current.stock_quantity
    if (data.movement_type === 'in') {
      newStock += qty
    } else if (data.movement_type === 'out') {
      if (current.stock_quantity < qty) {
        throw new Error(`Stock insuffisant (${current.stock_quantity} disponible contre ${qty} requis)`)
      }
      newStock -= qty
    } else if (data.movement_type === 'adjustment') {
      newStock = qty
    }

    const newStatus = newStock <= current.min_threshold ? 'حرج' : 'كافٍ'

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO material_movements (material_id, movement_type, quantity, origin, destination, user_name, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.material_id,
        data.movement_type || 'in',
        qty,
        data.origin || 'Fournisseur',
        data.destination || 'Atelier',
        data.user_name || 'Magasinier',
        data.reason || 'Mouvement standard',
        now
      )

      db.prepare('UPDATE raw_materials SET stock_quantity = ?, status = ? WHERE id = ?').run(
        newStock,
        newStatus,
        data.material_id
      )
    })

    tx()
    return this.getById(data.material_id)!
  }

  listMovements(materialId?: number): MaterialMovement[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT m.*, r.code as material_code, r.designation as material_name
      FROM material_movements m
      JOIN raw_materials r ON m.material_id = r.id
    `
    const params: any[] = []
    if (materialId) {
      sql += ' WHERE m.material_id = ?'
      params.push(materialId)
    }
    sql += ' ORDER BY m.id DESC LIMIT 100'

    return db.prepare(sql).all(...params) as MaterialMovement[]
  }

  private mapRow(r: any): RawMaterial {
    return {
      id: r.id,
      code: r.code,
      designation: r.designation,
      category: r.category,
      unit: r.unit,
      unit_price: r.unit_price,
      stock_quantity: r.stock_quantity,
      min_threshold: r.min_threshold,
      supplier_id: r.supplier_id,
      supplier_name: r.supplier_name,
      location: r.location,
      status: r.stock_quantity <= r.min_threshold ? 'حرج' : 'كافٍ',
      created_at: r.created_at
    }
  }
}

export const materialService = new MaterialService()
