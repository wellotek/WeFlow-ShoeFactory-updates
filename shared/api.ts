import type {
  AppSettings,
  Client,
  CompanyProfile,
  CostBreakdown,
  CustomerOrder,
  DashboardStats,
  Delivery,
  LabelPrintItem,
  LabelTemplate,
  LicenseUiState,
  Machine,
  MachineMaintenance,
  MaterialMovement,
  ProductionMaterialNeed,
  ProductionOrder,
  ProductionStage,
  PurchaseOrder,
  QualityInspection,
  RawMaterial,
  ShoeModel,
  ShoeVariant,
  Supplier,
  TechnicalSheet
} from './types'
import type { UpdateSnapshot } from './updates'

export interface WeFlowShoeFactoryApi {
  license: {
    getUiState: () => Promise<LicenseUiState>
    activate: (licenseId: string, activationCode: string) => Promise<LicenseUiState>
  }
  updates: {
    getSnapshot: () => Promise<UpdateSnapshot>
    checkForUpdates: () => Promise<UpdateSnapshot>
    downloadUpdate: () => Promise<UpdateSnapshot>
    quitAndInstall: () => Promise<void>
    onChanged: (callback: (snapshot: UpdateSnapshot) => void) => () => void
  }
  settings: {
    getCompanyProfile: () => Promise<CompanyProfile>
    updateCompanyProfile: (data: Partial<CompanyProfile>) => Promise<CompanyProfile>
    getAppSettings: () => Promise<AppSettings>
    updateAppSettings: (data: Partial<AppSettings>) => Promise<AppSettings>
    pickLogo: () => Promise<string | null>
    clearLogo: () => Promise<boolean>
  }
  backup: {
    create: (targetDir?: string) => Promise<{ success: boolean; filePath: string; sizeBytes: number; createdAt: string }>
    restore: (filePath?: string) => Promise<{ success: boolean; error?: string }>
  }
  models: {
    list: (filters?: { category?: string; gender?: string; search?: string }) => Promise<ShoeModel[]>
    getById: (id: number) => Promise<ShoeModel | null>
    create: (data: Partial<ShoeModel> & { variants?: Partial<ShoeVariant>[] }) => Promise<ShoeModel>
    update: (id: number, data: Partial<ShoeModel> & { variants?: Partial<ShoeVariant>[] }) => Promise<ShoeModel>
    delete: (id: number) => Promise<boolean>
    pickPhoto: () => Promise<string | null>
  }
  materials: {
    list: (filters?: { category?: string; search?: string; lowStockOnly?: boolean }) => Promise<RawMaterial[]>
    getById: (id: number) => Promise<RawMaterial | null>
    create: (data: Partial<RawMaterial>) => Promise<RawMaterial>
    update: (id: number, data: Partial<RawMaterial>) => Promise<RawMaterial>
    delete: (id: number) => Promise<boolean>
    recordMovement: (data: Partial<MaterialMovement>) => Promise<RawMaterial>
    listMovements: (materialId?: number) => Promise<MaterialMovement[]>
  }
  technicalSheets: {
    list: (search?: string) => Promise<TechnicalSheet[]>
    getById: (id: number) => Promise<TechnicalSheet | null>
    getByModelId: (modelId: number) => Promise<TechnicalSheet | null>
    create: (data: Partial<TechnicalSheet> & { items: any[] }) => Promise<TechnicalSheet>
    update: (id: number, data: Partial<TechnicalSheet> & { items: any[] }) => Promise<TechnicalSheet>
    duplicate: (id: number) => Promise<TechnicalSheet>
    delete: (id: number) => Promise<boolean>
  }
  productionOrders: {
    list: (filters?: { status?: string; modelId?: number; search?: string }) => Promise<ProductionOrder[]>
    getById: (id: number) => Promise<ProductionOrder | null>
    create: (data: Partial<ProductionOrder>) => Promise<ProductionOrder>
    update: (id: number, data: Partial<ProductionOrder>) => Promise<ProductionOrder>
    updateStatus: (id: number, status: string) => Promise<ProductionOrder>
    calculateNeeds: (id: number) => Promise<ProductionMaterialNeed[]>
    launch: (id: number) => Promise<ProductionOrder>
    delete: (id: number) => Promise<boolean>
  }
  tracking: {
    listStages: (productionOrderId: number) => Promise<ProductionStage[]>
    updateStage: (
      stageId: number,
      data: {
        completed_quantity?: number
        rejected_quantity?: number
        operator_name?: string
        status?: string
        notes?: string
      }
    ) => Promise<ProductionStage>
    recordConsumption: (productionOrderId: number, materialId: number, quantityConsumed: number, scrapQuantity?: number) => Promise<boolean>
  }
  stock: {
    getOverview: () => Promise<{ rawCount: number; semiFinishedCount: number; finishedCount: number }>
    listFinishedGoods: (filters?: { modelId?: number; color?: string; size?: number }) => Promise<any[]>
    listSemiFinished: () => Promise<any[]>
    adjust: (type: 'raw' | 'finished', id: number, delta: number, reason: string) => Promise<boolean>
  }
  customerOrders: {
    list: (filters?: { status?: string; customerId?: number; search?: string }) => Promise<CustomerOrder[]>
    getById: (id: number) => Promise<CustomerOrder | null>
    create: (data: Partial<CustomerOrder> & { items: any[] }) => Promise<CustomerOrder>
    updateStatus: (id: number, status: string) => Promise<CustomerOrder>
    addPayment: (id: number, amount: number, notes?: string) => Promise<CustomerOrder>
    generateOF: (id: number) => Promise<ProductionOrder[]>
    delete: (id: number) => Promise<boolean>
  }
  quality: {
    list: (filters?: { modelId?: number; severity?: string }) => Promise<QualityInspection[]>
    getById: (id: number) => Promise<QualityInspection | null>
    recordInspection: (data: Partial<QualityInspection>) => Promise<QualityInspection>
  }
  machines: {
    list: (status?: string) => Promise<Machine[]>
    getById: (id: number) => Promise<Machine | null>
    create: (data: Partial<Machine>) => Promise<Machine>
    update: (id: number, data: Partial<Machine>) => Promise<Machine>
    delete: (id: number) => Promise<boolean>
    listMaintenance: (machineId?: number) => Promise<MachineMaintenance[]>
    createMaintenance: (data: Partial<MachineMaintenance>) => Promise<MachineMaintenance>
    updateMaintenance: (id: number, data: Partial<MachineMaintenance>) => Promise<MachineMaintenance>
  }
  clients: {
    list: (search?: string) => Promise<Client[]>
    getById: (id: number) => Promise<Client | null>
    create: (data: Partial<Client>) => Promise<Client>
    update: (id: number, data: Partial<Client>) => Promise<Client>
    delete: (id: number) => Promise<boolean>
  }
  suppliers: {
    list: (search?: string) => Promise<Supplier[]>
    getById: (id: number) => Promise<Supplier | null>
    create: (data: Partial<Supplier>) => Promise<Supplier>
    update: (id: number, data: Partial<Supplier>) => Promise<Supplier>
    delete: (id: number) => Promise<boolean>
  }
  purchases: {
    list: (supplierId?: number) => Promise<PurchaseOrder[]>
    getById: (id: number) => Promise<PurchaseOrder | null>
    create: (data: Partial<PurchaseOrder> & { items: any[] }) => Promise<PurchaseOrder>
    receiveGoods: (purchaseId: number, receivedItems: Array<{ material_id: number; quantity: number }>) => Promise<PurchaseOrder>
    delete: (id: number) => Promise<boolean>
  }
  deliveries: {
    list: (customerId?: number) => Promise<Delivery[]>
    getById: (id: number) => Promise<Delivery | null>
    create: (data: Partial<Delivery> & { items: any[] }) => Promise<Delivery>
    updateStatus: (id: number, status: string) => Promise<Delivery>
  }
  costs: {
    calculateModel: (modelId: number, color?: string, size?: number) => Promise<CostBreakdown>
    getOrderBreakdown: (orderId: number) => Promise<any>
  }
  dashboard: {
    getStats: () => Promise<DashboardStats>
  }
  reports: {
    getProduction: (from?: string, to?: string) => Promise<any>
    getFinancial: (from?: string, to?: string) => Promise<any>
  }
  documents: {
    renderHtml: (payload: { docType: string; id: number; lang?: 'fr' | 'ar'; options?: any }) => Promise<string>
    savePdf: (payload: { docType: string; id: number; lang?: 'fr' | 'ar'; suggestedFilename?: string }) => Promise<{ cancelled: boolean; path?: string }>
    print: (payload: { docType: string; id: number; lang?: 'fr' | 'ar'; format?: string }) => Promise<{ success: boolean }>
  }
  labels: {
    listTemplates: () => Promise<LabelTemplate[]>
    renderHtml: (payload: { templateId: string; item: LabelPrintItem; copies?: number }) => Promise<string>
  }
}

declare global {
  interface Window {
    api: WeFlowShoeFactoryApi
  }
}
