export type LicenseStatus = 'activate' | 'active' | 'grace' | 'expired' | 'blocked'

export type LicenseRecord = {
  v: 1
  license_id: string
  installation_id: string
  status: string
  lastValidatedAt: string
  offlineUntil: string
  product: string
  version: string
  integrity: string
  serverToken?: string
  lifetime?: boolean
  expiresAt?: string
  durationMonths?: number
  activatedAt?: string
}

export type LicenseUiState =
  | { status: 'activate' }
  | {
      status: 'active'
      daysRemaining?: number
      licenseId?: string
      expiresAt?: string
      lifetime?: boolean
      installationId?: string
    }
  | {
      status: 'grace'
      daysRemaining: number
      licenseId: string
      expiresAt?: string
      lifetime?: boolean
      installationId?: string
    }
  | {
      status: 'expired'
      messageKey: string
      licenseId?: string
      installationId?: string
    }
  | {
      status: 'blocked'
      messageKey: string
      licenseId?: string
      installationId?: string
    }

export interface CompanyProfile {
  name: string
  activity: string
  address: string
  city: string
  wilaya: string
  phone: string
  email: string
  rc: string
  nif: string
  nis: string
  ai: string
  logoUrl?: string
}

export interface AppSettings {
  language: 'fr' | 'ar'
  currency: string
  autoBackup: boolean
  printFormat: 'A4' | 'A5'
  defaultMarginPercent: number
  theme: 'light' | 'dark'
}

export interface ShoeModel {
  id: number
  reference: string
  name: string
  category: 'Classique' | 'Sport' | 'Professionnelle' | 'Sécurité' | 'Enfant' | 'Personnalisée'
  gender: 'Homme' | 'Femme' | 'Enfant' | 'Unisexe'
  season?: string
  collection?: string
  description?: string
  photo_url?: string
  status: 'Actif' | 'Inactif'
  created_at: string
  updated_at: string
  variants?: ShoeVariant[]
}

export interface ShoeVariant {
  id: number
  model_id: number
  color: string
  size: number
  barcode?: string
  sku?: string
  stock_finished: number
  stock_reserved: number
}

export interface RawMaterial {
  id: number
  code: string
  designation: string
  category: string
  unit: string
  unit_price: number
  stock_quantity: number
  min_threshold: number
  supplier_id?: number
  supplier_name?: string
  location?: string
  status: 'كافٍ' | 'حرج'
  created_at: string
}

export interface MaterialMovement {
  id: number
  material_id: number
  material_code?: string
  material_name?: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  origin?: string
  destination?: string
  user_name?: string
  reason?: string
  created_at: string
}

export interface TechnicalSheet {
  id: number
  model_id: number
  model_reference: string
  model_name: string
  photo_url?: string
  category?: string
  collection?: string
  main_color?: string
  description?: string
  notes?: string
  available_sizes: number[]
  labor_cost_per_pair: number
  overhead_cost_per_pair: number
  target_sale_price: number
  items: TechnicalSheetItem[]
  created_at: string
  updated_at: string
}

export interface TechnicalSheetItem {
  id: number
  sheet_id: number
  material_id: number
  material_code: string
  material_name: string
  category?: string
  unit: string
  base_quantity: number
  scrap_percentage: number
  cost_per_unit: number
  total_cost: number
  size_adjustments?: Record<string, number>
}

export interface ProductionOrder {
  id: number
  order_number: string
  model_id: number
  model_reference: string
  model_name: string
  photo_url?: string
  color: string
  total_quantity: number
  size_breakdown: Record<string, number>
  start_date: string
  due_date: string
  completed_date?: string
  manager: string
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente'
  status: 'Brouillon' | 'Planifié' | 'En cours' | 'Terminé' | 'Annulé'
  observations?: string
  estimated_cost: number
  actual_cost: number
  sale_price: number
  customer_order_id?: number
  completion_percentage: number
  created_at: string
  stages?: ProductionStage[]
  materials_needed?: ProductionMaterialNeed[]
}

export interface ProductionStage {
  id: number
  production_order_id: number
  stage_number: number
  stage_name_fr: string
  stage_name_ar: string
  planned_quantity: number
  completed_quantity: number
  rejected_quantity: number
  waiting_quantity: number
  completion_percent: number
  start_date?: string
  end_date?: string
  operator_name?: string
  status: 'En attente' | 'En cours' | 'Terminé' | 'Bloqué'
  notes?: string
}

export interface ProductionMaterialNeed {
  material_id: number
  material_code: string
  material_name: string
  unit: string
  quantity_required: number
  quantity_available: number
  unit_price: number
  total_cost: number
  is_sufficient: boolean
}

export interface CustomerOrder {
  id: number
  order_number: string
  customer_id: number
  customer_name: string
  customer_phone?: string
  customer_wilaya?: string
  order_date: string
  delivery_date?: string
  status: 'Nouvelle' | 'Confirmée' | 'En production' | 'Prête' | 'Livrée' | 'Annulée'
  total_quantity: number
  total_amount: number
  discount: number
  advance_paid: number
  remaining_balance: number
  notes?: string
  items: CustomerOrderItem[]
  created_at: string
}

export interface CustomerOrderItem {
  id: number
  order_id: number
  model_id: number
  model_reference: string
  model_name: string
  color: string
  size: number
  quantity: number
  unit_price: number
  total_price: number
  produced_quantity: number
  delivered_quantity: number
}

export interface QualityInspection {
  id: number
  lot_number: string
  production_order_id?: number
  model_id?: number
  model_name: string
  size?: number
  quantity_inspected: number
  quantity_accepted: number
  quantity_rejected: number
  defect_cause?: string
  severity: 'Mineure' | 'Moyenne' | 'Critique'
  action_taken: 'Rejeté' | 'Retouche' | 'Accepté avec concession'
  notes?: string
  inspector_name: string
  inspection_date: string
}

export interface Machine {
  id: number
  code: string
  name: string
  machine_type: string
  acquisition_date?: string
  status: 'Active' | 'Maintenance' | 'Arrêt'
  location?: string
  next_maintenance_date?: string
  notes?: string
  maintenances?: MachineMaintenance[]
}

export interface MachineMaintenance {
  id: number
  machine_id: number
  machine_name?: string
  maintenance_type: 'Préventive' | 'Corrective'
  intervention_date: string
  cost: number
  description: string
  technician_name: string
  status: 'Planifiée' | 'Effectuée'
}

export interface Client {
  id: number
  name: string
  company?: string
  phone: string
  email?: string
  address?: string
  wilaya: string
  notes?: string
  balance_due: number
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  company?: string
  phone: string
  email?: string
  address?: string
  wilaya: string
  provided_products?: string
  balance_due: number
  created_at: string
}

export interface PurchaseOrder {
  id: number
  purchase_number: string
  supplier_id: number
  supplier_name: string
  purchase_date: string
  status: 'Brouillon' | 'Commandé' | 'Partiellement reçu' | 'Reçu' | 'Annulé'
  total_amount: number
  paid_amount: number
  remaining_balance: number
  items: PurchaseOrderItem[]
  created_at: string
}

export interface PurchaseOrderItem {
  id: number
  purchase_id: number
  material_id: number
  material_code?: string
  material_name: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  received_quantity: number
}

export interface Delivery {
  id: number
  delivery_number: string
  customer_order_id?: number
  customer_id: number
  customer_name: string
  delivery_date: string
  status: 'En préparation' | 'En transit' | 'Livrée'
  driver_name?: string
  notes?: string
  items: DeliveryItem[]
  created_at: string
}

export interface DeliveryItem {
  id: number
  delivery_id: number
  model_id: number
  model_reference: string
  model_name: string
  color: string
  size: number
  quantity: number
}

export interface CostBreakdown {
  model_id: number
  model_reference: string
  model_name: string
  color?: string
  size?: number
  raw_materials_cost: number
  soles_cost: number
  accessories_cost: number
  labor_cost: number
  production_expenses: number
  total_unit_cost: number
  sale_price: number
  gross_margin: number
  margin_percentage: number
}

export interface DashboardStats {
  totalModels: number
  totalShoesManufactured: number
  activeProductionPairs: number
  stockHealthPercent: number
  totalOrders: number
  turnoverDA: number
  expensesDA: number
  profitDA: number
  recentOrders: Array<{
    id: number
    order_number: string
    model_name: string
    line: string
    quantity: number
    status: string
  }>
  stockAlerts: number
  activeSuppliers: number
  activeMachines: number
}

export interface LabelTemplate {
  id: string
  name: string
  widthMm: number
  heightMm: number
  marginsMm: number
  barcodeType: 'code128' | 'qr'
}

export interface LabelPrintItem {
  reference: string
  productName: string
  color?: string
  size?: string | number
  lotNumber?: string
  barcodeValue: string
  manufacturingDate?: string
  category?: string
}
