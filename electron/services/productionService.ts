import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { ProductionMaterialNeed, ProductionOrder, ProductionStage } from '@shared/types'
import { technicalSheetService } from './technicalSheetService'

export class ProductionService {
  list(filters?: { status?: string; modelId?: number; search?: string }): ProductionOrder[] {
    assertLicensed()
    const db = getDatabase()
    let sql = `
      SELECT po.*, m.reference as model_reference, m.name as model_name, m.photo_url
      FROM production_orders po
      JOIN shoe_models m ON po.model_id = m.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.status && filters.status !== 'Tous') {
      sql += ' AND po.status = ?'
      params.push(filters.status)
    }
    if (filters?.modelId) {
      sql += ' AND po.model_id = ?'
      params.push(filters.modelId)
    }
    if (filters?.search) {
      sql += ' AND (po.order_number LIKE ? OR m.reference LIKE ? OR m.name LIKE ?)'
      const term = `%${filters.search}%`
      params.push(term, term, term)
    }

    sql += ' ORDER BY po.id DESC'
    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map((r) => this.mapRow(r, db))
  }

  getById(id: number): ProductionOrder | null {
    assertLicensed()
    const db = getDatabase()
    const row = db.prepare(`
      SELECT po.*, m.reference as model_reference, m.name as model_name, m.photo_url
      FROM production_orders po
      JOIN shoe_models m ON po.model_id = m.id
      WHERE po.id = ?
    `).get(id) as any

    if (!row) return null
    return this.mapRow(row, db)
  }

  calculateNeeds(id: number): ProductionMaterialNeed[] {
    assertLicensed()
    const po = this.getById(id)
    if (!po) throw new Error('Ordre de fabrication introuvable')

    const sheet = technicalSheetService.getByModelId(po.model_id)
    if (!sheet || sheet.items.length === 0) {
      return []
    }

    const db = getDatabase()
    const needs: ProductionMaterialNeed[] = []

    for (const item of sheet.items) {
      let totalReq = 0
      const scrapFactor = 1 + (item.scrap_percentage || 0) / 100

      // Calculate consumption across size matrix
      for (const [sizeStr, qty] of Object.entries(po.size_breakdown)) {
        const count = Number(qty) || 0
        if (count <= 0) continue

        let perPair = item.base_quantity
        if (item.size_adjustments && item.size_adjustments[sizeStr] !== undefined) {
          perPair = item.size_adjustments[sizeStr]
        }
        totalReq += perPair * count * scrapFactor
      }

      // Round to 2 decimals
      totalReq = Math.round(totalReq * 100) / 100

      const mat = db.prepare('SELECT stock_quantity, unit_price FROM raw_materials WHERE id = ?').get(item.material_id) as any
      const available = mat ? mat.stock_quantity : 0
      const unitPrice = mat ? mat.unit_price : item.cost_per_unit

      needs.push({
        material_id: item.material_id,
        material_code: item.material_code,
        material_name: item.material_name,
        unit: item.unit,
        quantity_required: totalReq,
        quantity_available: available,
        unit_price: unitPrice,
        total_cost: Math.round(totalReq * unitPrice * 100) / 100,
        is_sufficient: available >= totalReq
      })
    }

    return needs
  }

  create(data: Partial<ProductionOrder>): ProductionOrder {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    if (!data.model_id) throw new Error('Modèle requis')
    const sizeMap = data.size_breakdown || { '40': 100 }
    let totalQty = 0
    for (const q of Object.values(sizeMap)) {
      totalQty += Number(q) || 0
    }

    // Sequence for order number
    const seqRow = db.prepare("SELECT current_number, prefix FROM document_sequences WHERE doc_type = 'production_order'").get() as any
    const nextSeq = (seqRow?.current_number || 15) + 1
    const orderNumber = data.order_number || `${seqRow?.prefix || 'PR-2026-'}${String(nextSeq).padStart(3, '0')}`

    const tx = db.transaction(() => {
      db.prepare("UPDATE document_sequences SET current_number = ? WHERE doc_type = 'production_order'").run(nextSeq)

      const stmt = db.prepare(`
        INSERT INTO production_orders (
          order_number, model_id, color, total_quantity, size_breakdown_json,
          start_date, due_date, manager, priority, status, observations,
          estimated_cost, actual_cost, sale_price, customer_order_id, completion_percentage, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const res = stmt.run(
        orderNumber,
        data.model_id,
        data.color || 'Noir',
        totalQty,
        JSON.stringify(sizeMap),
        data.start_date || now.slice(0, 10),
        data.due_date || now.slice(0, 10),
        data.manager || 'Ahmed Ali (Directeur Production)',
        data.priority || 'Normale',
        data.status || 'Brouillon',
        data.observations || '',
        data.estimated_cost || 0,
        data.actual_cost || 0,
        data.sale_price || 0,
        data.customer_order_id || null,
        0,
        now
      )

      const poId = Number(res.lastInsertRowid)

      // Initialize 7 production stages
      const stagesDef = [
        { num: 1, fr: 'Coupe', ar: 'قص الجلد' },
        { num: 2, fr: 'Piquage', ar: 'الخياطة' },
        { num: 3, fr: 'Assemblage', ar: 'التجميع' },
        { num: 4, fr: 'Montage', ar: 'التركيب' },
        { num: 5, fr: 'Collage', ar: 'اللصق' },
        { num: 6, fr: 'Finition', ar: 'التشطيب' },
        { num: 7, fr: 'Emballage', ar: 'التعبئة والتغليف' }
      ]

      const stageStmt = db.prepare(`
        INSERT INTO production_stages (
          production_order_id, stage_number, stage_name_fr, stage_name_ar,
          planned_quantity, completed_quantity, rejected_quantity, waiting_quantity,
          completion_percent, status
        ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, 0, 'En attente')
      `)

      for (const st of stagesDef) {
        stageStmt.run(poId, st.num, st.fr, st.ar, totalQty, totalQty)
      }

      return poId
    })

    const newPoId = tx()
    return this.getById(newPoId)!
  }

  update(id: number, data: Partial<ProductionOrder>): ProductionOrder {
    assertLicensed()
    const db = getDatabase()
    const current = this.getById(id)
    if (!current) throw new Error('Ordre de fabrication introuvable')

    let totalQty = current.total_quantity
    if (data.size_breakdown) {
      totalQty = 0
      for (const q of Object.values(data.size_breakdown)) {
        totalQty += Number(q) || 0
      }
    }

    db.prepare(`
      UPDATE production_orders SET
        color = ?, total_quantity = ?, size_breakdown_json = ?, start_date = ?,
        due_date = ?, manager = ?, priority = ?, status = ?, observations = ?,
        estimated_cost = ?, sale_price = ?
      WHERE id = ?
    `).run(
      data.color ?? current.color,
      totalQty,
      data.size_breakdown ? JSON.stringify(data.size_breakdown) : JSON.stringify(current.size_breakdown),
      data.start_date ?? current.start_date,
      data.due_date ?? current.due_date,
      data.manager ?? current.manager,
      data.priority ?? current.priority,
      data.status ?? current.status,
      data.observations ?? current.observations,
      data.estimated_cost ?? current.estimated_cost,
      data.sale_price ?? current.sale_price,
      id
    )

    return this.getById(id)!
  }

  updateStatus(id: number, status: string): ProductionOrder {
    assertLicensed()
    const db = getDatabase()
    const po = this.getById(id)
    if (!po) throw new Error('Ordre de fabrication introuvable')

    const completedDate = status === 'Terminé' ? nowIso().slice(0, 10) : po.completed_date || null
    db.prepare('UPDATE production_orders SET status = ?, completed_date = ? WHERE id = ?').run(status, completedDate, id)

    // If order is completed, add finished goods into shoe_variants stock
    if (status === 'Terminé' && po.status !== 'Terminé') {
      this.depositFinishedGoods(po)
    }

    return this.getById(id)!
  }

  depositFinishedGoods(po: ProductionOrder): void {
    const db = getDatabase()
    const tx = db.transaction(() => {
      for (const [sizeStr, qty] of Object.entries(po.size_breakdown)) {
        const sz = Number(sizeStr)
        const count = Number(qty) || 0
        if (count <= 0) continue

        const existingVar = db.prepare('SELECT id, stock_finished FROM shoe_variants WHERE model_id = ? AND color = ? AND size = ?').get(po.model_id, po.color, sz) as any
        if (existingVar) {
          db.prepare('UPDATE shoe_variants SET stock_finished = stock_finished + ? WHERE id = ?').run(count, existingVar.id)
        } else {
          db.prepare(`
            INSERT INTO shoe_variants (model_id, color, size, barcode, sku, stock_finished, stock_reserved)
            VALUES (?, ?, ?, ?, ?, ?, 0)
          `).run(po.model_id, po.color, sz, `613${po.model_id}${sz}`, `${po.model_reference}-${po.color}-${sz}`, count)
        }
      }
    })
    tx()
  }

  launch(id: number): ProductionOrder {
    assertLicensed()
    const po = this.getById(id)
    if (!po) throw new Error('Ordre de fabrication introuvable')
    if (po.status === 'En cours') return po

    const needs = this.calculateNeeds(id)
    const insufficient = needs.filter((n) => !n.is_sufficient)
    if (insufficient.length > 0) {
      const names = insufficient.map((i) => `${i.material_name} (manque ${i.quantity_required - i.quantity_available} ${i.unit})`).join(', ')
      throw new Error(`Impossible de lancer la production : matières insuffisantes en stock : ${names}`)
    }

    const db = getDatabase()
    const now = nowIso()

    const tx = db.transaction(() => {
      // Deduct materials from stock
      for (const need of needs) {
        db.prepare('UPDATE raw_materials SET stock_quantity = stock_quantity - ? WHERE id = ?').run(need.quantity_required, need.material_id)
        db.prepare(`
          INSERT INTO material_movements (material_id, movement_type, quantity, origin, destination, user_name, reason, created_at)
          VALUES (?, 'out', ?, 'Magasin MP', 'Atelier Production', ?, ?, ?)
        `).run(need.material_id, need.quantity_required, po.manager, `Sortie fabrication OF ${po.order_number}`, now)

        db.prepare(`
          INSERT INTO production_material_consumptions (production_order_id, material_id, quantity_consumed, scrap_quantity, cost_applied, recorded_at)
          VALUES (?, ?, ?, 0, ?, ?)
        `).run(id, need.material_id, need.quantity_required, need.total_cost, now)
      }

      // Update status to En cours
      db.prepare("UPDATE production_orders SET status = 'En cours', start_date = ? WHERE id = ?").run(now.slice(0, 10), id)

      // Start stage 1
      db.prepare("UPDATE production_stages SET status = 'En cours', start_date = ? WHERE production_order_id = ? AND stage_number = 1").run(now.slice(0, 10), id)
    })

    tx()
    return this.getById(id)!
  }

  delete(id: number): boolean {
    assertLicensed()
    const db = getDatabase()
    const res = db.prepare('DELETE FROM production_orders WHERE id = ?').run(id)
    return res.changes > 0
  }

  private mapRow(r: any, db: any): ProductionOrder {
    let sizeBreakdown: Record<string, number> = {}
    if (r.size_breakdown_json) {
      try {
        sizeBreakdown = JSON.parse(r.size_breakdown_json)
      } catch {
        // ignore
      }
    }

    const stages = db.prepare('SELECT * FROM production_stages WHERE production_order_id = ? ORDER BY stage_number ASC').all(r.id) as ProductionStage[]

    return {
      id: r.id,
      order_number: r.order_number,
      model_id: r.model_id,
      model_reference: r.model_reference,
      model_name: r.model_name,
      photo_url: r.photo_url,
      color: r.color,
      total_quantity: r.total_quantity,
      size_breakdown: sizeBreakdown,
      start_date: r.start_date,
      due_date: r.due_date,
      completed_date: r.completed_date,
      manager: r.manager,
      priority: r.priority,
      status: r.status,
      observations: r.observations,
      estimated_cost: r.estimated_cost,
      actual_cost: r.actual_cost,
      sale_price: r.sale_price,
      customer_order_id: r.customer_order_id,
      completion_percentage: r.completion_percentage,
      created_at: r.created_at,
      stages
    }
  }
}

export const productionService = new ProductionService()
