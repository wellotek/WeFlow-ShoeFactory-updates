import { contextBridge, ipcRenderer } from 'electron'
import { channels } from '@shared/channels'
import type { WeFlowShoeFactoryApi } from '@shared/api'
import type { UpdateSnapshot } from '@shared/updates'

const unwrap = async <T>(promise: Promise<any>): Promise<T> => {
  const res = await promise
  if (res && typeof res === 'object' && 'ok' in res) {
    if (res.ok) return res.data as T
    throw new Error(res.error?.detail || res.error?.messageKey || 'Erreur IPC')
  }
  return res as T
}

const api: WeFlowShoeFactoryApi = {
  license: {
    getUiState: () => unwrap(ipcRenderer.invoke(channels.licenseGetState)),
    activate: (licenseId: string, activationCode: string) =>
      unwrap(ipcRenderer.invoke(channels.licenseActivate, { licenseId, activationCode }))
  },

  updates: {
    getSnapshot: () => unwrap(ipcRenderer.invoke(channels.updatesStatus)),
    checkForUpdates: () => unwrap(ipcRenderer.invoke(channels.updatesCheck)),
    downloadUpdate: () => unwrap(ipcRenderer.invoke(channels.updatesDownload)),
    quitAndInstall: () => ipcRenderer.invoke(channels.updatesInstall),
    onChanged: (callback: (snapshot: UpdateSnapshot) => void) => {
      const handler = (_event: any, snap: UpdateSnapshot) => callback(snap)
      ipcRenderer.on(channels.updatesChanged, handler)
      return () => {
        ipcRenderer.removeListener(channels.updatesChanged, handler)
      }
    }
  },

  settings: {
    getCompanyProfile: () => unwrap(ipcRenderer.invoke(channels.settingsGetCompany)),
    updateCompanyProfile: (data) => unwrap(ipcRenderer.invoke(channels.settingsUpdateCompany, data)),
    getAppSettings: () => unwrap(ipcRenderer.invoke(channels.settingsGetApp)),
    updateAppSettings: (data) => unwrap(ipcRenderer.invoke(channels.settingsUpdateApp, data)),
    pickLogo: () => unwrap(ipcRenderer.invoke(channels.settingsPickLogo)),
    clearLogo: () => unwrap(ipcRenderer.invoke(channels.settingsClearLogo))
  },

  backup: {
    create: (targetDir) => unwrap(ipcRenderer.invoke(channels.backupCreate, targetDir)),
    restore: (filePath) => unwrap(ipcRenderer.invoke(channels.backupRestore, filePath))
  },

  models: {
    list: (filters) => unwrap(ipcRenderer.invoke(channels.modelsList, filters)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.modelsGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.modelsCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.modelsUpdate, { id, data })),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.modelsDelete, id)),
    pickPhoto: () => unwrap(ipcRenderer.invoke(channels.modelsPickPhoto))
  },

  materials: {
    list: (filters) => unwrap(ipcRenderer.invoke(channels.materialsList, filters)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.materialsGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.materialsCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.materialsUpdate, { id, data })),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.materialsDelete, id)),
    recordMovement: (data) => unwrap(ipcRenderer.invoke(channels.materialsRecordMovement, data)),
    listMovements: (materialId) => unwrap(ipcRenderer.invoke(channels.materialsListMovements, materialId))
  },

  technicalSheets: {
    list: (search) => unwrap(ipcRenderer.invoke(channels.technicalSheetsList, search)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.technicalSheetsGet, id)),
    getByModelId: (modelId) => unwrap(ipcRenderer.invoke(channels.technicalSheetsGetByModel, modelId)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.technicalSheetsCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.technicalSheetsUpdate, { id, data })),
    duplicate: (id) => unwrap(ipcRenderer.invoke(channels.technicalSheetsDuplicate, id)),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.technicalSheetsDelete, id))
  },

  productionOrders: {
    list: (filters) => unwrap(ipcRenderer.invoke(channels.productionOrdersList, filters)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.productionOrdersGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.productionOrdersCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.productionOrdersUpdate, { id, data })),
    updateStatus: (id, status) => unwrap(ipcRenderer.invoke(channels.productionOrdersUpdateStatus, { id, status })),
    calculateNeeds: (id) => unwrap(ipcRenderer.invoke(channels.productionOrdersCalculateNeeds, id)),
    launch: (id) => unwrap(ipcRenderer.invoke(channels.productionOrdersLaunch, id)),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.productionOrdersDelete, id))
  },

  tracking: {
    listStages: (productionOrderId) => unwrap(ipcRenderer.invoke(channels.trackingListStages, productionOrderId)),
    updateStage: (stageId, data) => unwrap(ipcRenderer.invoke(channels.trackingUpdateStage, { stageId, data })),
    recordConsumption: (productionOrderId, materialId, quantityConsumed, scrapQuantity) =>
      unwrap(ipcRenderer.invoke(channels.trackingRecordConsumption, { productionOrderId, materialId, quantityConsumed, scrapQuantity }))
  },

  stock: {
    getOverview: () => unwrap(ipcRenderer.invoke(channels.stockGetOverview)),
    listFinishedGoods: (filters) => unwrap(ipcRenderer.invoke(channels.stockListFinishedGoods, filters)),
    listSemiFinished: () => unwrap(ipcRenderer.invoke(channels.stockListSemiFinished)),
    adjust: (type, id, delta, reason) => unwrap(ipcRenderer.invoke(channels.stockAdjust, { type, id, delta, reason }))
  },

  customerOrders: {
    list: (filters) => unwrap(ipcRenderer.invoke(channels.customerOrdersList, filters)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.customerOrdersGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.customerOrdersCreate, data)),
    updateStatus: (id, status) => unwrap(ipcRenderer.invoke(channels.customerOrdersUpdateStatus, { id, status })),
    addPayment: (id, amount, notes) => unwrap(ipcRenderer.invoke(channels.customerOrdersAddPayment, { id, amount, notes })),
    generateOF: (id) => unwrap(ipcRenderer.invoke(channels.customerOrdersGenerateOF, id)),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.customerOrdersDelete, id))
  },

  quality: {
    list: (filters) => unwrap(ipcRenderer.invoke(channels.qualityList, filters)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.qualityGet, id)),
    recordInspection: (data) => unwrap(ipcRenderer.invoke(channels.qualityRecordInspection, data))
  },

  machines: {
    list: (status) => unwrap(ipcRenderer.invoke(channels.machinesList, status)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.machinesGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.machinesCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.machinesUpdate, { id, data })),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.machinesDelete, id)),
    listMaintenance: (machineId) => unwrap(ipcRenderer.invoke(channels.maintenanceList, machineId)),
    createMaintenance: (data) => unwrap(ipcRenderer.invoke(channels.maintenanceCreate, data)),
    updateMaintenance: (id, data) => unwrap(ipcRenderer.invoke(channels.maintenanceUpdate, { id, data }))
  },

  clients: {
    list: (search) => unwrap(ipcRenderer.invoke(channels.clientsList, search)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.clientsGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.clientsCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.clientsUpdate, { id, data })),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.clientsDelete, id))
  },

  suppliers: {
    list: (search) => unwrap(ipcRenderer.invoke(channels.suppliersList, search)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.suppliersGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.suppliersCreate, data)),
    update: (id, data) => unwrap(ipcRenderer.invoke(channels.suppliersUpdate, { id, data })),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.suppliersDelete, id))
  },

  purchases: {
    list: (supplierId) => unwrap(ipcRenderer.invoke(channels.purchasesList, supplierId)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.purchasesGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.purchasesCreate, data)),
    receiveGoods: (purchaseId, receivedItems) => unwrap(ipcRenderer.invoke(channels.purchasesReceiveGoods, { purchaseId, receivedItems })),
    delete: (id) => unwrap(ipcRenderer.invoke(channels.purchasesDelete, id))
  },

  deliveries: {
    list: (customerId) => unwrap(ipcRenderer.invoke(channels.deliveriesList, customerId)),
    getById: (id) => unwrap(ipcRenderer.invoke(channels.deliveriesGet, id)),
    create: (data) => unwrap(ipcRenderer.invoke(channels.deliveriesCreate, data)),
    updateStatus: (id, status) => unwrap(ipcRenderer.invoke(channels.deliveriesUpdateStatus, { id, status }))
  },

  costs: {
    calculateModel: (modelId, color, size) => unwrap(ipcRenderer.invoke(channels.costsCalculateModel, { modelId, color, size })),
    getOrderBreakdown: (orderId) => unwrap(ipcRenderer.invoke(channels.costsGetOrderBreakdown, orderId))
  },

  dashboard: {
    getStats: () => unwrap(ipcRenderer.invoke(channels.dashboardGetStats))
  },

  reports: {
    getProduction: (from, to) => unwrap(ipcRenderer.invoke(channels.reportsGetProduction, { from, to })),
    getFinancial: (from, to) => unwrap(ipcRenderer.invoke(channels.reportsGetFinancial, { from, to }))
  },

  documents: {
    renderHtml: (payload) => unwrap(ipcRenderer.invoke(channels.documentsRenderHtml, payload)),
    savePdf: (payload) => unwrap(ipcRenderer.invoke(channels.documentsSavePdf, payload)),
    print: (payload) => unwrap(ipcRenderer.invoke(channels.documentsPrint, payload))
  },

  labels: {
    listTemplates: () => unwrap(ipcRenderer.invoke(channels.labelsListTemplates)),
    renderHtml: (payload) => unwrap(ipcRenderer.invoke(channels.labelsRenderHtml, payload))
  }
}

contextBridge.exposeInMainWorld('api', api)
