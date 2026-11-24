import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { migrate } from '../../electron/database/migrate'
import { setDatabaseForTesting } from '../../electron/database/connection'

describe('Database & Migrations', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    setDatabaseForTesting(db)
  })

  afterEach(() => {
    db.close()
    setDatabaseForTesting(null)
  })

  it('runs all migrations successfully', () => {
    const ran = migrate(db)
    expect(ran.length).toBeGreaterThanOrEqual(11)
    expect(ran).toContain('001_core_settings_sequences')
    expect(ran).toContain('002_models_variants')
    expect(ran).toContain('003_materials_movements')
    expect(ran).toContain('004_technical_sheets')
    expect(ran).toContain('005_production_orders_tracking')
    expect(ran).toContain('011_seed_shoefactory_data')
  })

  it('contains expected seeded shoe factory models and variants', () => {
    migrate(db)

    const models = db.prepare('SELECT * FROM shoe_models').all() as any[]
    expect(models.length).toBeGreaterThanOrEqual(4)

    const sf001 = models.find((m) => m.reference === 'SF-001')
    expect(sf001).toBeDefined()
    expect(sf001.name).toBe('Homme Classique')

    const variants = db.prepare('SELECT * FROM shoe_variants WHERE model_id = ?').all(sf001.id) as any[]
    expect(variants.length).toBeGreaterThan(0)
    expect(variants.some((v) => v.size === 40 && v.color === 'Noir')).toBe(true)
  })

  it('contains seeded raw materials with correct thresholds', () => {
    migrate(db)

    const materials = db.prepare('SELECT * FROM raw_materials').all() as any[]
    expect(materials.length).toBeGreaterThanOrEqual(6)

    const leather = materials.find((m) => m.code === 'MAT-001')
    expect(leather).toBeDefined()
    expect(leather.unit_price).toBe(2500)
    expect(leather.stock_quantity).toBe(320)
  })
})
