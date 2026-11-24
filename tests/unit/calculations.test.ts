import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { migrate } from '../../electron/database/migrate'
import { setDatabaseForTesting } from '../../electron/database/connection'
import { setLicenseServiceForTesting } from '../../electron/license/guard'
import { costCalculationService } from '../../electron/services/costCalculationService'
import { productionService } from '../../electron/services/productionService'
import { materialService } from '../../electron/services/materialService'

describe('MRP, Cost & Stock Calculations', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    setDatabaseForTesting(db)
    migrate(db)
    setLicenseServiceForTesting({
      isLicenseActivatedSync: () => true
    })
  })

  afterEach(() => {
    setLicenseServiceForTesting(null)
    db.close()
    setDatabaseForTesting(null)
  })

  it('calculates accurate cost of production matching Algerian footwear industry standards', () => {
    const cost = costCalculationService.calculateModel(1, 'Noir', 40)

    expect(cost.model_reference).toBe('SF-001')
    expect(cost.total_unit_cost).toBe(3400)
    expect(cost.sale_price).toBe(5200)
    expect(cost.gross_margin).toBe(1800)
    expect(cost.margin_percentage).toBe(34.6)

    expect(cost.raw_materials_cost).toBe(1150)
    expect(cost.soles_cost).toBe(850)
    expect(cost.labor_cost).toBe(650)
    expect(cost.production_expenses).toBe(300)
  })

  it('calculates total raw material requirements for production order across size matrix', () => {
    const needs = productionService.calculateNeeds(1)
    expect(needs.length).toBeGreaterThan(0)

    const leatherNeed = needs.find((n) => n.material_code === 'MAT-001')
    expect(leatherNeed).toBeDefined()
    expect(leatherNeed?.quantity_required).toBeGreaterThan(50)
    expect(leatherNeed?.is_sufficient).toBe(true)
  })

  it('prevents negative stock movements in materialService', () => {
    const mat = materialService.getById(1)!
    const initialQty = mat.stock_quantity

    // Out movement exceeding stock must throw
    expect(() => {
      materialService.recordMovement({
        material_id: 1,
        movement_type: 'out',
        quantity: initialQty + 1000,
        reason: 'Sur-consommation'
      })
    }).toThrow(/Stock insuffisant/)

    // Stock remains unchanged
    const after = materialService.getById(1)!
    expect(after.stock_quantity).toBe(initialQty)
  })
})
