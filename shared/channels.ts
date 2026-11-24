export const channels = {
  // License & Updates
  licenseGetState: 'license:get-state',
  licenseActivate: 'license:activate',
  updatesStatus: 'updates:status',
  updatesCheck: 'updates:check',
  updatesDownload: 'updates:download',
  updatesInstall: 'updates:install',
  updatesChanged: 'updates:changed',

  // Settings & Backups
  settingsGetCompany: 'settings:get-company',
  settingsUpdateCompany: 'settings:update-company',
  settingsGetApp: 'settings:get-app',
  settingsUpdateApp: 'settings:update-app',
  settingsPickLogo: 'settings:pick-logo',
  settingsClearLogo: 'settings:clear-logo',
  backupCreate: 'backup:create',
  backupRestore: 'backup:restore',

  // Models & Variants
  modelsList: 'models:list',
  modelsGet: 'models:get',
  modelsCreate: 'models:create',
  modelsUpdate: 'models:update',
  modelsDelete: 'models:delete',
  modelsPickPhoto: 'models:pick-photo',

  // Raw Materials & Stocks
  materialsList: 'materials:list',
  materialsGet: 'materials:get',
  materialsCreate: 'materials:create',
  materialsUpdate: 'materials:update',
  materialsDelete: 'materials:delete',
  materialsRecordMovement: 'materials:record-movement',
  materialsListMovements: 'materials:list-movements',

  // Technical Sheets (BOM)
  technicalSheetsList: 'technical-sheets:list',
  technicalSheetsGet: 'technical-sheets:get',
  technicalSheetsGetByModel: 'technical-sheets:get-by-model',
  technicalSheetsCreate: 'technical-sheets:create',
  technicalSheetsUpdate: 'technical-sheets:update',
  technicalSheetsDuplicate: 'technical-sheets:duplicate',
  technicalSheetsDelete: 'technical-sheets:delete',

  // Production Orders (Ordres de fabrication)
  productionOrdersList: 'production-orders:list',
  productionOrdersGet: 'production-orders:get',
  productionOrdersCreate: 'production-orders:create',
  productionOrdersUpdate: 'production-orders:update',
  productionOrdersUpdateStatus: 'production-orders:update-status',
  productionOrdersCalculateNeeds: 'production-orders:calculate-needs',
  productionOrdersLaunch: 'production-orders:launch',
  productionOrdersDelete: 'production-orders:delete',

  // Production Tracking (Stages)
  trackingListStages: 'tracking:list-stages',
  trackingUpdateStage: 'tracking:update-stage',
  trackingRecordConsumption: 'tracking:record-consumption',

  // Stock (Raw, Semi-finished, Finished Goods)
  stockGetOverview: 'stock:get-overview',
  stockListFinishedGoods: 'stock:list-finished-goods',
  stockListSemiFinished: 'stock:list-semi-finished',
  stockAdjust: 'stock:adjust',

  // Customer Orders
  customerOrdersList: 'customer-orders:list',
  customerOrdersGet: 'customer-orders:get',
  customerOrdersCreate: 'customer-orders:create',
  customerOrdersUpdateStatus: 'customer-orders:update-status',
  customerOrdersAddPayment: 'customer-orders:add-payment',
  customerOrdersGenerateOF: 'customer-orders:generate-of',
  customerOrdersDelete: 'customer-orders:delete',

  // Quality Control
  qualityList: 'quality:list',
  qualityGet: 'quality:get',
  qualityRecordInspection: 'quality:record-inspection',

  // Machines & Maintenance
  machinesList: 'machines:list',
  machinesGet: 'machines:get',
  machinesCreate: 'machines:create',
  machinesUpdate: 'machines:update',
  machinesDelete: 'machines:delete',
  maintenanceList: 'maintenance:list',
  maintenanceCreate: 'maintenance:create',
  maintenanceUpdate: 'maintenance:update',

  // Clients & Suppliers
  clientsList: 'clients:list',
  clientsGet: 'clients:get',
  clientsCreate: 'clients:create',
  clientsUpdate: 'clients:update',
  clientsDelete: 'clients:delete',
  suppliersList: 'suppliers:list',
  suppliersGet: 'suppliers:get',
  suppliersCreate: 'suppliers:create',
  suppliersUpdate: 'suppliers:update',
  suppliersDelete: 'suppliers:delete',

  // Purchases
  purchasesList: 'purchases:list',
  purchasesGet: 'purchases:get',
  purchasesCreate: 'purchases:create',
  purchasesReceiveGoods: 'purchases:receive-goods',
  purchasesDelete: 'purchases:delete',

  // Deliveries
  deliveriesList: 'deliveries:list',
  deliveriesGet: 'deliveries:get',
  deliveriesCreate: 'deliveries:create',
  deliveriesUpdateStatus: 'deliveries:update-status',

  // Costs & Calculation
  costsCalculateModel: 'costs:calculate-model',
  costsGetOrderBreakdown: 'costs:get-order-breakdown',

  // Dashboard & Reports
  dashboardGetStats: 'dashboard:get-stats',
  reportsGetProduction: 'reports:get-production',
  reportsGetFinancial: 'reports:get-financial',

  // Printing & PDF Documents & Labels
  documentsRenderHtml: 'documents:render-html',
  documentsSavePdf: 'documents:save-pdf',
  documentsPrint: 'documents:print',
  labelsListTemplates: 'labels:list-templates',
  labelsRenderHtml: 'labels:render-html'
} as const
