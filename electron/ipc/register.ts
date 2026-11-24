import { dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { channels } from '@shared/channels'
import { fail, mapError, ok, type IpcResult } from './errors'
import { isTrustedIpcSender } from './trusted'
import { getLicenseService } from '../license/guard'
import { settingsService } from '../services/settingsService'
import { backupService } from '../services/backupService'
import { modelService } from '../services/modelService'
import { materialService } from '../services/materialService'
import { technicalSheetService } from '../services/technicalSheetService'
import { productionService } from '../services/productionService'
import { trackingService } from '../services/trackingService'
import { stockService } from '../services/stockService'
import { customerOrderService } from '../services/customerOrderService'
import { qualityService } from '../services/qualityService'
import { machineService } from '../services/machineService'
import { clientSupplierService } from '../services/clientSupplierService'
import { purchaseService } from '../services/purchaseService'
import { deliveryService } from '../services/deliveryService'
import { costCalculationService } from '../services/costCalculationService'
import { dashboardReportService } from '../services/dashboardReportService'
import { labelService } from '../services/labelService'
import { documentService } from '../services/documentService'
import { printHtml, savePdf } from '../services/printDocument'
import type { AppUpdaterService } from '../services/appUpdater'
import type { Logger } from '../logger'

function handle<T, R>(channel: string, fn: (payload: T, event: IpcMainInvokeEvent) => Promise<R> | R): void {
  ipcMain.handle(channel, async (event, payload: T): Promise<IpcResult<R>> => {
    if (!isTrustedIpcSender(event)) {
      return fail('UNTRUSTED_SENDER', 'errors.unauthorized')
    }
    try {
      const data = await fn(payload, event)
      return ok(data)
    } catch (error) {
      return { ok: false, error: mapError(error) }
    }
  })
}

export function registerIpc(options: {
  userDataDir: string
  updaterService?: AppUpdaterService
  logger?: Logger
}): void {
  const { updaterService } = options

  // --- LICENSE ---
  handle(channels.licenseGetState, async () => {
    const svc = getLicenseService()
    if (!svc) return { status: 'activate' }
    return svc.getUiState()
  })

  handle(channels.licenseActivate, async (payload: { licenseId: string; activationCode: string }) => {
    const svc = getLicenseService()
    if (!svc) throw new Error('Service de licence non configuré')
    return svc.activate(payload.licenseId, payload.activationCode)
  })

  // --- UPDATES ---
  handle(channels.updatesStatus, () => updaterService?.getSnapshot() || {
    currentVersion: '1.0.0',
    availableVersion: null,
    phase: 'idle',
    percent: 0,
    error: '',
    packaged: false
  })

  handle(channels.updatesCheck, async () => {
    if (!updaterService) throw new Error('Service de mise à jour indisponible')
    return updaterService.checkForUpdates()
  })

  handle(channels.updatesDownload, async () => {
    if (!updaterService) throw new Error('Service de mise à jour indisponible')
    return updaterService.downloadUpdate()
  })

  handle(channels.updatesInstall, () => {
    updaterService?.quitAndInstall()
  })

  // --- SETTINGS ---
  handle(channels.settingsGetCompany, () => settingsService.getCompanyProfile())
  handle(channels.settingsUpdateCompany, (payload: any) => settingsService.updateCompanyProfile(payload))
  handle(channels.settingsGetApp, () => settingsService.getAppSettings())
  handle(channels.settingsUpdateApp, (payload: any) => settingsService.updateAppSettings(payload))

  handle(channels.settingsPickLogo, async () => {
    const res = await dialog.showOpenDialog({
      title: 'Sélectionner le logo',
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    if (res.canceled || !res.filePaths[0]) return null
    const filePath = res.filePaths[0]
    return filePath
  })

  handle(channels.settingsClearLogo, () => {
    settingsService.updateCompanyProfile({ logoUrl: '' })
    return true
  })

  // --- BACKUP ---
  handle(channels.backupCreate, (targetDir?: string) => backupService.createBackup(targetDir))
  handle(channels.backupRestore, (filePath?: string) => backupService.restoreBackup(filePath))

  // --- MODELS ---
  handle(channels.modelsList, (filters?: any) => modelService.list(filters))
  handle(channels.modelsGet, (id: number) => modelService.getById(id))
  handle(channels.modelsCreate, (data: any) => modelService.create(data))
  handle(channels.modelsUpdate, (payload: { id: number; data: any }) => modelService.update(payload.id, payload.data))
  handle(channels.modelsDelete, (id: number) => modelService.delete(id))
  handle(channels.modelsPickPhoto, async () => {
    const res = await dialog.showOpenDialog({
      title: 'Sélectionner la photo du modèle',
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    if (res.canceled || !res.filePaths[0]) return null
    return res.filePaths[0]
  })

  // --- RAW MATERIALS ---
  handle(channels.materialsList, (filters?: any) => materialService.list(filters))
  handle(channels.materialsGet, (id: number) => materialService.getById(id))
  handle(channels.materialsCreate, (data: any) => materialService.create(data))
  handle(channels.materialsUpdate, (payload: { id: number; data: any }) => materialService.update(payload.id, payload.data))
  handle(channels.materialsDelete, (id: number) => materialService.delete(id))
  handle(channels.materialsRecordMovement, (data: any) => materialService.recordMovement(data))
  handle(channels.materialsListMovements, (materialId?: number) => materialService.listMovements(materialId))

  // --- TECHNICAL SHEETS ---
  handle(channels.technicalSheetsList, (search?: string) => technicalSheetService.list(search))
  handle(channels.technicalSheetsGet, (id: number) => technicalSheetService.getById(id))
  handle(channels.technicalSheetsGetByModel, (modelId: number) => technicalSheetService.getByModelId(modelId))
  handle(channels.technicalSheetsCreate, (data: any) => technicalSheetService.create(data))
  handle(channels.technicalSheetsUpdate, (payload: { id: number; data: any }) => technicalSheetService.update(payload.id, payload.data))
  handle(channels.technicalSheetsDuplicate, (id: number) => technicalSheetService.duplicate(id))
  handle(channels.technicalSheetsDelete, (id: number) => technicalSheetService.delete(id))

  // --- PRODUCTION ORDERS ---
  handle(channels.productionOrdersList, (filters?: any) => productionService.list(filters))
  handle(channels.productionOrdersGet, (id: number) => productionService.getById(id))
  handle(channels.productionOrdersCreate, (data: any) => productionService.create(data))
  handle(channels.productionOrdersUpdate, (payload: { id: number; data: any }) => productionService.update(payload.id, payload.data))
  handle(channels.productionOrdersUpdateStatus, (payload: { id: number; status: string }) => productionService.updateStatus(payload.id, payload.status))
  handle(channels.productionOrdersCalculateNeeds, (id: number) => productionService.calculateNeeds(id))
  handle(channels.productionOrdersLaunch, (id: number) => productionService.launch(id))
  handle(channels.productionOrdersDelete, (id: number) => productionService.delete(id))

  // --- PRODUCTION TRACKING ---
  handle(channels.trackingListStages, (orderId: number) => trackingService.listStages(orderId))
  handle(channels.trackingUpdateStage, (payload: { stageId: number; data: any }) => trackingService.updateStage(payload.stageId, payload.data))
  handle(channels.trackingRecordConsumption, (payload: { productionOrderId: number; materialId: number; quantityConsumed: number; scrapQuantity?: number }) =>
    trackingService.recordConsumption(payload.productionOrderId, payload.materialId, payload.quantityConsumed, payload.scrapQuantity)
  )

  // --- STOCKS ---
  handle(channels.stockGetOverview, () => stockService.getOverview())
  handle(channels.stockListFinishedGoods, (filters?: any) => stockService.listFinishedGoods(filters))
  handle(channels.stockListSemiFinished, () => stockService.listSemiFinished())
  handle(channels.stockAdjust, (payload: { type: 'raw' | 'finished'; id: number; delta: number; reason: string }) =>
    stockService.adjust(payload.type, payload.id, payload.delta, payload.reason)
  )

  // --- CUSTOMER ORDERS ---
  handle(channels.customerOrdersList, (filters?: any) => customerOrderService.list(filters))
  handle(channels.customerOrdersGet, (id: number) => customerOrderService.getById(id))
  handle(channels.customerOrdersCreate, (data: any) => customerOrderService.create(data))
  handle(channels.customerOrdersUpdateStatus, (payload: { id: number; status: string }) => customerOrderService.updateStatus(payload.id, payload.status))
  handle(channels.customerOrdersAddPayment, (payload: { id: number; amount: number; notes?: string }) => customerOrderService.addPayment(payload.id, payload.amount, payload.notes))
  handle(channels.customerOrdersGenerateOF, (id: number) => customerOrderService.generateOF(id))
  handle(channels.customerOrdersDelete, (id: number) => customerOrderService.delete(id))

  // --- QUALITY ---
  handle(channels.qualityList, (filters?: any) => qualityService.list(filters))
  handle(channels.qualityGet, (id: number) => qualityService.getById(id))
  handle(channels.qualityRecordInspection, (data: any) => qualityService.recordInspection(data))

  // --- MACHINES & MAINTENANCE ---
  handle(channels.machinesList, (status?: string) => machineService.list(status))
  handle(channels.machinesGet, (id: number) => machineService.getById(id))
  handle(channels.machinesCreate, (data: any) => machineService.create(data))
  handle(channels.machinesUpdate, (payload: { id: number; data: any }) => machineService.update(payload.id, payload.data))
  handle(channels.machinesDelete, (id: number) => machineService.delete(id))
  handle(channels.maintenanceList, (machineId?: number) => machineService.listMaintenance(machineId))
  handle(channels.maintenanceCreate, (data: any) => machineService.createMaintenance(data))
  handle(channels.maintenanceUpdate, (payload: { id: number; data: any }) => machineService.updateMaintenance(payload.id, payload.data))

  // --- CLIENTS & SUPPLIERS ---
  handle(channels.clientsList, (search?: string) => clientSupplierService.listClients(search))
  handle(channels.clientsGet, (id: number) => clientSupplierService.getClientById(id))
  handle(channels.clientsCreate, (data: any) => clientSupplierService.createClient(data))
  handle(channels.clientsUpdate, (payload: { id: number; data: any }) => clientSupplierService.updateClient(payload.id, payload.data))
  handle(channels.clientsDelete, (id: number) => clientSupplierService.deleteClient(id))

  handle(channels.suppliersList, (search?: string) => clientSupplierService.listSuppliers(search))
  handle(channels.suppliersGet, (id: number) => clientSupplierService.getSupplierById(id))
  handle(channels.suppliersCreate, (data: any) => clientSupplierService.createSupplier(data))
  handle(channels.suppliersUpdate, (payload: { id: number; data: any }) => clientSupplierService.updateSupplier(payload.id, payload.data))
  handle(channels.suppliersDelete, (id: number) => clientSupplierService.deleteSupplier(id))

  // --- PURCHASES ---
  handle(channels.purchasesList, (supplierId?: number) => purchaseService.list(supplierId))
  handle(channels.purchasesGet, (id: number) => purchaseService.getById(id))
  handle(channels.purchasesCreate, (data: any) => purchaseService.create(data))
  handle(channels.purchasesReceiveGoods, (payload: { purchaseId: number; receivedItems: Array<{ material_id: number; quantity: number }> }) =>
    purchaseService.receiveGoods(payload.purchaseId, payload.receivedItems)
  )
  handle(channels.purchasesDelete, (id: number) => purchaseService.delete(id))

  // --- DELIVERIES ---
  handle(channels.deliveriesList, (customerId?: number) => deliveryService.list(customerId))
  handle(channels.deliveriesGet, (id: number) => deliveryService.getById(id))
  handle(channels.deliveriesCreate, (data: any) => deliveryService.create(data))
  handle(channels.deliveriesUpdateStatus, (payload: { id: number; status: string }) => deliveryService.updateStatus(payload.id, payload.status))

  // --- COSTS ---
  handle(channels.costsCalculateModel, (payload: { modelId: number; color?: string; size?: number }) =>
    costCalculationService.calculateModel(payload.modelId, payload.color, payload.size)
  )
  handle(channels.costsGetOrderBreakdown, (orderId: number) => costCalculationService.getOrderBreakdown(orderId))

  // --- DASHBOARD & REPORTS ---
  handle(channels.dashboardGetStats, () => dashboardReportService.getStats())
  handle(channels.reportsGetProduction, (payload?: { from?: string; to?: string }) => dashboardReportService.getProductionReport(payload?.from, payload?.to))
  handle(channels.reportsGetFinancial, (payload?: { from?: string; to?: string }) => dashboardReportService.getFinancialReport(payload?.from, payload?.to))

  // --- DOCUMENTS & LABELS ---
  handle(channels.documentsRenderHtml, (payload: { docType: string; id: number; lang?: 'fr' | 'ar' }) =>
    documentService.renderDocumentHtml(payload.docType, payload.id, payload.lang)
  )

  handle(channels.documentsSavePdf, async (payload: { docType: string; id: number; lang?: 'fr' | 'ar'; suggestedFilename?: string }) => {
    const html = documentService.renderDocumentHtml(payload.docType, payload.id, payload.lang)
    const fname = payload.suggestedFilename || `${payload.docType}_${payload.id}`
    return savePdf(html, fname)
  })

  handle(channels.documentsPrint, async (payload: { docType: string; id: number; lang?: 'fr' | 'ar'; format?: any }) => {
    const html = documentService.renderDocumentHtml(payload.docType, payload.id, payload.lang)
    return printHtml(html, payload.format || 'A4')
  })

  handle(channels.labelsListTemplates, () => labelService.listTemplates())

  handle(channels.labelsRenderHtml, (payload: { templateId: string; item: any; copies?: number }) => {
    const templates = labelService.listTemplates()
    const t = templates.find((tmp) => tmp.id === payload.templateId) || templates[0]
    return labelService.renderLabelHtml(t, payload.item, payload.copies || 1)
  })
}
