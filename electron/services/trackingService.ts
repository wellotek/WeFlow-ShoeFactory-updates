import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import { nowIso } from '../database/sql'
import type { ProductionStage } from '@shared/types'
import { productionService } from './productionService'

export class TrackingService {
  listStages(productionOrderId: number): ProductionStage[] {
    assertLicensed()
    const db = getDatabase()
    return db.prepare('SELECT * FROM production_stages WHERE production_order_id = ? ORDER BY stage_number ASC').all(productionOrderId) as ProductionStage[]
  }

  updateStage(
    stageId: number,
    data: {
      completed_quantity?: number
      rejected_quantity?: number
      operator_name?: string
      status?: string
      notes?: string
    }
  ): ProductionStage {
    assertLicensed()
    const db = getDatabase()
    const stage = db.prepare('SELECT * FROM production_stages WHERE id = ?').get(stageId) as any
    if (!stage) throw new Error('Étape introuvable')

    const planned = stage.planned_quantity || 1
    const completed = data.completed_quantity !== undefined ? data.completed_quantity : stage.completed_quantity
    const rejected = data.rejected_quantity !== undefined ? data.rejected_quantity : stage.rejected_quantity
    const waiting = Math.max(0, planned - completed - rejected)
    const percent = Math.min(100, Math.round(((completed + rejected) / planned) * 1000) / 10)

    let newStatus = data.status || stage.status
    if (completed >= planned && newStatus !== 'Terminé') {
      newStatus = 'Terminé'
    } else if (completed > 0 && newStatus === 'En attente') {
      newStatus = 'En cours'
    }

    const now = nowIso()
    const endDate = newStatus === 'Terminé' ? now.slice(0, 10) : stage.end_date

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE production_stages SET
          completed_quantity = ?, rejected_quantity = ?, waiting_quantity = ?,
          completion_percent = ?, operator_name = ?, status = ?, notes = ?, end_date = ?
        WHERE id = ?
      `).run(
        completed,
        rejected,
        waiting,
        percent,
        data.operator_name ?? stage.operator_name,
        newStatus,
        data.notes ?? stage.notes,
        endDate,
        stageId
      )

      // If this stage completed, unlock next stage
      if (newStatus === 'Terminé') {
        const nextStage = db.prepare(`
          SELECT id, status FROM production_stages
          WHERE production_order_id = ? AND stage_number = ?
        `).get(stage.production_order_id, stage.stage_number + 1) as any

        if (nextStage && nextStage.status === 'En attente') {
          db.prepare("UPDATE production_stages SET status = 'En cours', start_date = ? WHERE id = ?").run(
            now.slice(0, 10),
            nextStage.id
          )
        }
      }

      // Recalculate total OF completion percentage
      const allStages = db.prepare('SELECT completion_percent, status FROM production_stages WHERE production_order_id = ?').all(stage.production_order_id) as any[]
      const totalPercent = Math.round((allStages.reduce((acc, s) => acc + (s.completion_percent || 0), 0) / (allStages.length || 1)) * 10) / 10

      const allDone = allStages.every((s) => s.status === 'Terminé')
      const ofStatus = allDone ? 'Terminé' : 'En cours'

      db.prepare(`
        UPDATE production_orders SET
          completion_percentage = ?,
          status = CASE WHEN status = 'Brouillon' THEN 'En cours' ELSE ? END
        WHERE id = ?
      `).run(totalPercent, ofStatus, stage.production_order_id)

      if (allDone) {
        const po = productionService.getById(stage.production_order_id)
        if (po && po.status === 'Terminé') {
          productionService.depositFinishedGoods(po)
        }
      }
    })

    tx()
    return db.prepare('SELECT * FROM production_stages WHERE id = ?').get(stageId) as ProductionStage
  }

  recordConsumption(productionOrderId: number, materialId: number, quantityConsumed: number, scrapQuantity = 0): boolean {
    assertLicensed()
    const db = getDatabase()
    const now = nowIso()

    const mat = db.prepare('SELECT unit_price, stock_quantity FROM raw_materials WHERE id = ?').get(materialId) as any
    if (!mat) throw new Error('Matière première introuvable')

    const totalQty = quantityConsumed + scrapQuantity
    const totalCost = totalQty * mat.unit_price

    const tx = db.transaction(() => {
      db.prepare('UPDATE raw_materials SET stock_quantity = stock_quantity - ? WHERE id = ?').run(totalQty, materialId)

      db.prepare(`
        INSERT INTO material_movements (material_id, movement_type, quantity, origin, destination, user_name, reason, created_at)
        VALUES (?, 'out', ?, 'Magasin MP', 'Atelier Production', 'Chef Atelier', ?, ?)
      `).run(materialId, totalQty, `Consommation réelle OF #${productionOrderId}`, now)

      db.prepare(`
        INSERT INTO production_material_consumptions (production_order_id, material_id, quantity_consumed, scrap_quantity, cost_applied, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(productionOrderId, materialId, quantityConsumed, scrapQuantity, totalCost, now)

      db.prepare('UPDATE production_orders SET actual_cost = actual_cost + ? WHERE id = ?').run(totalCost, productionOrderId)
    })

    tx()
    return true
  }
}

export const trackingService = new TrackingService()
