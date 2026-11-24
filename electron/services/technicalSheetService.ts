import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { TechnicalSheet, TechnicalSheetItem } from '@shared/types'

export class TechnicalSheetService {
  list(search?: string): TechnicalSheet[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT ts.*, m.reference as model_reference, m.name as model_name, m.category, m.collection, m.photo_url
      FROM technical_sheets ts
      JOIN shoe_models m ON ts.model_id = m.id
    `
    const params: any[] = []
    if (search) {
      sql += ' WHERE m.reference LIKE ? OR m.name LIKE ?'
      const term = `%${search}%`
      params.push(term, term)
    }
    sql += ' ORDER BY ts.id DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map((r) => this.mapRow(r, db))
  }

  getById(id: number): TechnicalSheet | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare(`
      SELECT ts.*, m.reference as model_reference, m.name as model_name, m.category, m.collection, m.photo_url
      FROM technical_sheets ts
      JOIN shoe_models m ON ts.model_id = m.id
      WHERE ts.id = ?
    `).get(id) as any

    if (!row) return null
    return this.mapRow(row, db)
  }

  getByModelId(modelId: number): TechnicalSheet | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare(`
      SELECT ts.*, m.reference as model_reference, m.name as model_name, m.category, m.collection, m.photo_url
      FROM technical_sheets ts
      JOIN shoe_models m ON ts.model_id = m.id
      WHERE ts.model_id = ?
    `).get(modelId) as any

    if (!row) return null
    return this.mapRow(row, db)
  }

  create(data: Partial<TechnicalSheet> & { items: any[] }): TechnicalSheet {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    if (!data.model_id) throw new Error('Modèle requis')

    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO technical_sheets (model_id, description, notes, available_sizes_json, labor_cost_per_pair, overhead_cost_per_pair, target_sale_price, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const res = stmt.run(
        data.model_id,
        data.description || '',
        data.notes || '',
        JSON.stringify(data.available_sizes || [38, 39, 40, 41, 42, 43, 44, 45]),
        data.labor_cost_per_pair ?? 650,
        data.overhead_cost_per_pair ?? 300,
        data.target_sale_price ?? 5200,
        now,
        now
      )

      const sheetId = Number(res.lastInsertRowid)

      if (data.items && data.items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO technical_sheet_items (sheet_id, material_id, base_quantity, scrap_percentage, size_adjustments_json)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const it of data.items) {
          itemStmt.run(
            sheetId,
            it.material_id,
            it.base_quantity || 1.0,
            it.scrap_percentage ?? 5.0,
            it.size_adjustments ? JSON.stringify(it.size_adjustments) : null
          )
        }
      }

      return sheetId
    })

    const newId = tx()
    return this.getById(newId)!
  }

  update(id: number, data: Partial<TechnicalSheet> & { items: any[] }): TechnicalSheet {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()
    const current = this.getById(id)
    if (!current) throw new Error('Fiche technique introuvable')

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE technical_sheets SET
          description = ?, notes = ?, available_sizes_json = ?, labor_cost_per_pair = ?,
          overhead_cost_per_pair = ?, target_sale_price = ?, updated_at = ?
        WHERE id = ?
      `).run(
        data.description ?? current.description,
        data.notes ?? current.notes,
        JSON.stringify(data.available_sizes ?? current.available_sizes),
        data.labor_cost_per_pair ?? current.labor_cost_per_pair,
        data.overhead_cost_per_pair ?? current.overhead_cost_per_pair,
        data.target_sale_price ?? current.target_sale_price,
        now,
        id
      )

      if (data.items) {
        db.prepare('DELETE FROM technical_sheet_items WHERE sheet_id = ?').run(id)
        const itemStmt = db.prepare(`
          INSERT INTO technical_sheet_items (sheet_id, material_id, base_quantity, scrap_percentage, size_adjustments_json)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const it of data.items) {
          itemStmt.run(
            id,
            it.material_id,
            it.base_quantity || 1.0,
            it.scrap_percentage ?? 5.0,
            it.size_adjustments ? JSON.stringify(it.size_adjustments) : null
          )
        }
      }
    })

    tx()
    return this.getById(id)!
  }

  duplicate(id: number): TechnicalSheet {
    assertLicensed()
    const current = this.getById(id)
    if (!current) throw new Error('Fiche technique introuvable')

    return this.create({
      model_id: current.model_id,
      description: `${current.description} (Copie)`,
      notes: current.notes,
      available_sizes: current.available_sizes,
      labor_cost_per_pair: current.labor_cost_per_pair,
      overhead_cost_per_pair: current.overhead_cost_per_pair,
      target_sale_price: current.target_sale_price,
      items: current.items.map((it) => ({
        material_id: it.material_id,
        base_quantity: it.base_quantity,
        scrap_percentage: it.scrap_percentage,
        size_adjustments: it.size_adjustments
      })) as any
    })
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM technical_sheets WHERE id = ?').run(id)
    return res.changes > 0
  }

  private mapRow(r: any, db: any): TechnicalSheet {
    const rawItems = db.prepare(`
      SELECT ti.*, m.code as material_code, m.designation as material_name, m.category as category, m.unit as unit, m.unit_price as cost_per_unit
      FROM technical_sheet_items ti
      JOIN raw_materials m ON ti.material_id = m.id
      WHERE ti.sheet_id = ?
    `).all(r.id) as any[]

    const items: TechnicalSheetItem[] = rawItems.map((it) => {
      const grossQty = it.base_quantity * (1 + (it.scrap_percentage || 0) / 100)
      const totalCost = grossQty * it.cost_per_unit
      let sizeAdj: Record<string, number> | undefined
      if (it.size_adjustments_json) {
        try {
          sizeAdj = JSON.parse(it.size_adjustments_json)
        } catch {
          // ignore
        }
      }
      return {
        id: it.id,
        sheet_id: it.sheet_id,
        material_id: it.material_id,
        material_code: it.material_code,
        material_name: it.material_name,
        category: it.category,
        unit: it.unit,
        base_quantity: it.base_quantity,
        scrap_percentage: it.scrap_percentage,
        cost_per_unit: it.cost_per_unit,
        total_cost: totalCost,
        size_adjustments: sizeAdj
      }
    })

    let sizes: number[] = [38, 39, 40, 41, 42, 43, 44, 45]
    if (r.available_sizes_json) {
      try {
        sizes = JSON.parse(r.available_sizes_json)
      } catch {
        // ignore
      }
    }

    return {
      id: r.id,
      model_id: r.model_id,
      model_reference: r.model_reference,
      model_name: r.model_name,
      photo_url: r.photo_url,
      category: r.category,
      collection: r.collection,
      description: r.description,
      notes: r.notes,
      available_sizes: sizes,
      labor_cost_per_pair: r.labor_cost_per_pair,
      overhead_cost_per_pair: r.overhead_cost_per_pair,
      target_sale_price: r.target_sale_price,
      items,
      created_at: r.created_at,
      updated_at: r.updated_at
    }
  }
}

export const technicalSheetService = new TechnicalSheetService()
