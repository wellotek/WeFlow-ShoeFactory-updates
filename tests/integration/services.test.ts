import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { migrate } from '../../electron/database/migrate'
import { setDatabaseForTesting } from '../../electron/database/connection'
import { setLicenseServiceForTesting } from '../../electron/license/guard'
import { modelService } from '../../electron/services/modelService'
import { technicalSheetService } from '../../electron/services/technicalSheetService'
import { productionService } from '../../electron/services/productionService'
import { trackingService } from '../../electron/services/trackingService'
import { customerOrderService } from '../../electron/services/customerOrderService'
import { purchaseService } from '../../electron/services/purchaseService'
import { deliveryService } from '../../electron/services/deliveryService'
import { materialService } from '../../electron/services/materialService'
import { qualityService } from '../../electron/services/qualityService'
import { machineService } from '../../electron/services/machineService'

describe('End-to-End Business Services Integration', () => {
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

  it('SCENARIO 1: Full Manufacturing Workflow for a New Shoe Model', () => {
    // 1. Create Model SF-100
    const model = modelService.create({
      reference: 'SF-100',
      name: 'Mocassin Luxe',
      category: 'Classique',
      gender: 'Homme',
      variants: [
        { color: 'Noir', size: 40, stock_finished: 0, stock_reserved: 0 },
        { color: 'Noir', size: 41, stock_finished: 0, stock_reserved: 0 },
        { color: 'Noir', size: 42, stock_finished: 0, stock_reserved: 0 }
      ] as any
    })
    expect(model.id).toBeDefined()
    expect(model.variants?.length).toBe(3)

    // 2. Create Technical Sheet (BOM)
    const sheet = technicalSheetService.create({
      model_id: model.id,
      description: 'Fiche technique Mocassin Luxe',
      labor_cost_per_pair: 700,
      overhead_cost_per_pair: 350,
      target_sale_price: 6000,
      items: [
        { material_id: 1, base_quantity: 0.5, scrap_percentage: 5.0 }, // Cuir
        { material_id: 2, base_quantity: 1.0, scrap_percentage: 0.0 }  // Semelle
      ] as any
    })
    expect(sheet.items.length).toBe(2)

    // 3. Create Production Order for 60 pairs
    const po = productionService.create({
      model_id: model.id,
      color: 'Noir',
      size_breakdown: { '40': 20, '41': 20, '42': 20 },
      priority: 'Haute'
    })
    expect(po.total_quantity).toBe(60)
    expect(po.stages?.length).toBe(7)

    // 4. Calculate Needs & Launch production
    const needs = productionService.calculateNeeds(po.id)
    expect(needs.length).toBe(2)
    expect(needs.every((n) => n.is_sufficient)).toBe(true)

    const launched = productionService.launch(po.id)
    expect(launched.status).toBe('En cours')

    // 5. Track stages
    const stages = trackingService.listStages(po.id)
    expect(stages[0].stage_name_fr).toBe('Coupe')

    // Complete stage 1 (Coupe)
    const s1Updated = trackingService.updateStage(stages[0].id, {
      completed_quantity: 60,
      operator_name: 'Amine Découpeur',
      status: 'Terminé'
    })
    expect(s1Updated.status).toBe('Terminé')
    expect(s1Updated.completion_percent).toBe(100)

    // Next stage (Piquage) automatically activated
    const stagesAfterS1 = trackingService.listStages(po.id)
    expect(stagesAfterS1[1].status).toBe('En cours')

    // Complete remaining stages 2 through 7
    for (let i = 1; i < 7; i++) {
      trackingService.updateStage(stagesAfterS1[i].id, {
        completed_quantity: 60,
        status: 'Terminé'
      })
    }

    // 6. Complete Order -> verify finished products added to stock
    productionService.updateStatus(po.id, 'Terminé')
    const updatedModel = modelService.getById(model.id)!
    const var40 = updatedModel.variants?.find((v) => v.size === 40)
    expect(var40?.stock_finished).toBe(20)
  })

  it('SCENARIO 2: Customer Order to OF Generation and Delivery', () => {
    // 1. Create order
    const order = customerOrderService.create({
      customer_id: 1,
      order_date: '2026-01-15',
      items: [
        { model_id: 1, color: 'Noir', size: 40, quantity: 20, unit_price: 5200 }
      ] as any,
      advance_paid: 20000
    })
    expect(order.order_number).toBeDefined()
    expect(order.total_amount).toBe(104000)
    expect(order.remaining_balance).toBe(84000)

    // 2. Generate OF
    const ofs = customerOrderService.generateOF(order.id)
    expect(ofs.length).toBe(1)
    expect(ofs[0].total_quantity).toBe(20)

    // 3. Deliver from available stock (seeded stock has 35 pairs in size 40)
    const delivery = deliveryService.create({
      customer_id: 1,
      customer_order_id: order.id,
      items: [
        { model_id: 1, color: 'Noir', size: 40, quantity: 20 }
      ] as any
    })
    expect(delivery.delivery_number).toBeDefined()
    expect(delivery.items[0].quantity).toBe(20)

    // 4. Over-delivery attempt must fail
    expect(() => {
      deliveryService.create({
        customer_id: 1,
        items: [
          { model_id: 1, color: 'Noir', size: 40, quantity: 9999 }
        ] as any
      })
    }).toThrow(/Stock insuffisant pour livrer/)
  })

  it('SCENARIO 3: Purchase Order, Goods Reception & Stock Inflow', () => {
    const leatherInitial = materialService.getById(1)!.stock_quantity

    const po = purchaseService.create({
      supplier_id: 1,
      items: [
        { material_id: 1, quantity: 100, unit_price: 2500 }
      ] as any
    })
    expect(po.total_amount).toBe(250000)

    // Receive goods
    const received = purchaseService.receiveGoods(po.id, [
      { material_id: 1, quantity: 100 }
    ])
    expect(received.status).toBe('Reçu')

    const leatherAfter = materialService.getById(1)!.stock_quantity
    expect(leatherAfter).toBe(leatherInitial + 100)
  })

  it('SCENARIO 4: Quality Inspections & Machine Maintenance Logs', () => {
    const inspection = qualityService.recordInspection({
      lot_number: 'B-9999',
      model_name: 'SF-001 Homme Classique',
      size: 42,
      quantity_inspected: 50,
      quantity_accepted: 48,
      quantity_rejected: 2,
      defect_cause: 'Légère rayure sur cuir',
      severity: 'Mineure',
      action_taken: 'Retouche'
    })
    expect(inspection.id).toBeDefined()
    expect(inspection.quantity_rejected).toBe(2)

    const maint = machineService.createMaintenance({
      machine_id: 1,
      maintenance_type: 'Préventive',
      cost: 20000,
      description: 'Changement des lames de découpe CNC',
      technician_name: 'Technicien Ali'
    })
    expect(maint.id).toBeDefined()
    expect(maint.cost).toBe(20000)
  })
})
