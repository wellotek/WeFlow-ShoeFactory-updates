import { migration as m001 } from './001_core_settings_sequences'
import { migration as m002 } from './002_models_variants'
import { migration as m003 } from './003_materials_movements'
import { migration as m004 } from './004_technical_sheets'
import { migration as m005 } from './005_production_orders_tracking'
import { migration as m006 } from './006_customers_suppliers'
import { migration as m007 } from './007_customer_orders_deliveries'
import { migration as m008 } from './008_purchases'
import { migration as m009 } from './009_quality_machines'
import { migration as m010 } from './010_labels'
import { migration as m011 } from './011_seed_shoefactory_data'

export const migrations = [
  m001,
  m002,
  m003,
  m004,
  m005,
  m006,
  m007,
  m008,
  m009,
  m010,
  m011
]
