import { getDatabase } from '../database/connection'
import { assertLicensed } from '../license/guard'
import type { CostBreakdown } from '@shared/types'
import { technicalSheetService } from './technicalSheetService'

export class CostCalculationService {
  calculateModel(modelId: number, color = 'Noir', size = 40): CostBreakdown {
    assertLicensed()
    const db = getDatabase()
    const model = db.prepare('SELECT * FROM shoe_models WHERE id = ?').get(modelId) as any
    if (!model) throw new Error('Modèle introuvable')

    const sheet = technicalSheetService.getByModelId(modelId)
    if (!sheet) {
      return {
        model_id: modelId,
        model_reference: model.reference,
        model_name: model.name,
        color,
        size,
        raw_materials_cost: 1150,
        soles_cost: 850,
        accessories_cost: 450,
        labor_cost: 650,
        production_expenses: 300,
        total_unit_cost: 3400,
        sale_price: 5200,
        gross_margin: 1800,
        margin_percentage: 34.6
      }
    }

    let rawMatCost = 0
    let soleCost = 0
    let accCost = 0

    const sizeStr = String(size)
    for (const item of sheet.items) {
      let perPair = item.base_quantity
      if (item.size_adjustments && item.size_adjustments[sizeStr] !== undefined) {
        perPair = item.size_adjustments[sizeStr]
      }
      const grossQty = perPair * (1 + (item.scrap_percentage || 0) / 100)
      const cost = grossQty * item.cost_per_unit

      const catLower = (item.category || '').toLowerCase()
      const nameLower = (item.material_name || '').toLowerCase()

      if (catLower.includes('semelle') || nameLower.includes('semelle')) {
        soleCost += cost
      } else if (
        catLower.includes('accessoire') ||
        catLower.includes('fil') ||
        catLower.includes('lacet') ||
        catLower.includes('doublure') ||
        catLower.includes('colle') ||
        nameLower.includes('lacet') ||
        nameLower.includes('fil') ||
        nameLower.includes('œillet')
      ) {
        accCost += cost
      } else {
        rawMatCost += cost
      }
    }

    // Round components
    rawMatCost = Math.round(rawMatCost)
    soleCost = Math.round(soleCost)
    accCost = Math.round(accCost)

    const labor = Math.round(sheet.labor_cost_per_pair || 650)
    const overhead = Math.round(sheet.overhead_cost_per_pair || 300)
    const totalCost = rawMatCost + soleCost + accCost + labor + overhead
    const salePrice = Math.round(sheet.target_sale_price || 5200)
    const margin = salePrice - totalCost
    const marginPct = totalCost > 0 ? Math.round((margin / salePrice) * 1000) / 10 : 0

    return {
      model_id: modelId,
      model_reference: model.reference,
      model_name: model.name,
      color,
      size,
      raw_materials_cost: rawMatCost,
      soles_cost: soleCost,
      accessories_cost: accCost,
      labor_cost: labor,
      production_expenses: overhead,
      total_unit_cost: totalCost,
      sale_price: salePrice,
      gross_margin: margin,
      margin_percentage: marginPct
    }
  }

  getOrderBreakdown(orderId: number): any {
    assertLicensed()
    const db = getDatabase()
    const po = db.prepare(`
      SELECT po.*, m.reference as model_reference, m.name as model_name
      FROM production_orders po
      JOIN shoe_models m ON po.model_id = m.id
      WHERE po.id = ?
    `).get(orderId) as any

    if (!po) throw new Error('Ordre introuvable')

    const base = this.calculateModel(po.model_id, po.color)
    const qty = po.total_quantity || 1

    return {
      order_number: po.order_number,
      model_reference: po.model_reference,
      model_name: po.model_name,
      total_quantity: qty,
      per_unit: base,
      total_batch: {
        raw_materials: base.raw_materials_cost * qty,
        soles: base.soles_cost * qty,
        accessories: base.accessories_cost * qty,
        labor: base.labor_cost * qty,
        overhead: base.production_expenses * qty,
        total_cost: base.total_unit_cost * qty,
        total_sale: base.sale_price * qty,
        gross_profit: base.gross_margin * qty
      }
    }
  }
}

export const costCalculationService = new CostCalculationService()
