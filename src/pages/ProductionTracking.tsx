import React, { useState, useEffect } from 'react'
import type { ProductionOrder, ProductionStage } from '../../shared/types'

const STAGE_NAMES = [
  { stage_number: 1, name_ar: 'القص', name_fr: 'Coupe' },
  { stage_number: 2, name_ar: 'الخياطة', name_fr: 'Piquage' },
  { stage_number: 3, name_ar: 'التجميع', name_fr: 'Assemblage' },
  { stage_number: 4, name_ar: 'التركيب', name_fr: 'Montage' },
  { stage_number: 5, name_ar: 'اللصق', name_fr: 'Collage' },
  { stage_number: 6, name_ar: 'التشطيب', name_fr: 'Finition' },
  { stage_number: 7, name_ar: 'التعبئة والتغليف', name_fr: 'Emballage' }
]

export const ProductionTracking: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [stagesMap, setStagesMap] = useState<Record<number, ProductionStage[]>>({})

  // Selected stage for updating
  const [activeStage, setActiveStage] = useState<{ stage: ProductionStage; order: ProductionOrder } | null>(null)
  const [updateData, setUpdateData] = useState({
    completed_quantity: 0,
    rejected_quantity: 0,
    operator_name: '',
    status: 'En cours' as 'En attente' | 'En cours' | 'Terminé' | 'Bloqué',
    notes: ''
  })
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const ordList = await window.api.productionOrders.list()
      const activeOrders = ordList.filter((o) => o.status === 'En cours' || o.status === 'Brouillon' || o.status === 'Planifié')
      setOrders(activeOrders)

      // Load stages for each active order
      const map: Record<number, ProductionStage[]> = {}
      for (const ord of activeOrders) {
        const stgs = await window.api.tracking.listStages(ord.id)
        map[ord.id] = stgs
      }
      setStagesMap(map)
    } catch (err: any) {
      console.error('Failed to load tracking data:', err)
      setFeedback({ message: err.message || 'Erreur chargement', type: 'error' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenStageModal = (stage: ProductionStage, order: ProductionOrder) => {
    setActiveStage({ stage, order })
    setUpdateData({
      completed_quantity: stage.completed_quantity || order.total_quantity,
      rejected_quantity: stage.rejected_quantity || 0,
      operator_name: stage.operator_name || 'Ahmed Ali',
      status: stage.status || 'En cours',
      notes: stage.notes || ''
    })
  }

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStage) return
    try {
      await window.api.tracking.updateStage(activeStage.stage.id, {
        completed_quantity: Number(updateData.completed_quantity),
        rejected_quantity: Number(updateData.rejected_quantity),
        operator_name: updateData.operator_name,
        status: updateData.status,
        notes: updateData.notes
      })
      setFeedback({ message: 'Étape mise à jour avec succès !', type: 'success' })
      setActiveStage(null)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur mise à jour', type: 'error' })
    }
  }

  // Calculate top KPIs
  const totalActiveOF = orders.length
  const totalProducedToday = orders.reduce((sum, o) => sum + (o.total_quantity * (o.completion_percentage / 100)), 0)
  const avgCompletion = orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.completion_percentage, 0) / orders.length) : 0

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Top 4 KPI Cards Matching Screenshot 06 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-right">
          <p className="text-xs font-semibold text-slate-500">إجمالي أوامر الإنتاج النشطة</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-navy text-xs bg-navy/10 font-bold px-2 py-0.5 rounded">En cours</span>
            <span className="text-3xl font-extrabold text-navy font-mono">{totalActiveOF}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-right">
          <p className="text-xs font-semibold text-slate-500">أحذية منتجة اليوم</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-emerald-700 text-xs bg-emerald-100 font-bold px-2 py-0.5 rounded">Paires</span>
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">
              {Math.round(totalProducedToday).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-right">
          <p className="text-xs font-semibold text-slate-500">معدل الإنجاز العام</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-blue-700 text-xs bg-blue-100 font-bold px-2 py-0.5 rounded">Moyenne</span>
            <span className="text-3xl font-extrabold text-blue-600 font-mono">{avgCompletion}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-right">
          <p className="text-xs font-semibold text-slate-500">الأعطال والتعطيل</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-rose-700 text-xs bg-rose-100 font-bold px-2 py-0.5 rounded">Alertes</span>
            <span className="text-3xl font-extrabold text-rose-600 font-mono">1</span>
          </div>
        </div>
      </div>

      {/* 7-Stage Kanban Board Matching Screenshot 06 */}
      <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 overflow-x-auto">
        <div className="flex gap-4 min-w-[1250px] items-start">
          {STAGE_NAMES.map((col) => {
            // Find stages matching this step across all active orders
            const matchingStages: { stage: ProductionStage; order: ProductionOrder }[] = []
            for (const ord of orders) {
              const list = stagesMap[ord.id] || []
              const stg = list.find((s) => s.stage_number === col.stage_number)
              if (stg) {
                matchingStages.push({ stage: stg, order: ord })
              }
            }

            return (
              <div
                key={col.stage_number}
                className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
              >
                {/* Column Header */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 text-center">
                  <div className="text-xs font-bold text-navy">
                    {String(col.stage_number).padStart(2, '0')} | {col.name_ar}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {col.name_fr}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-3 min-h-[350px]">
                  {matchingStages.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-slate-300">
                      فارغ
                    </div>
                  ) : (
                    matchingStages.map(({ stage, order }) => {
                      const isComplete = stage.status === 'Terminé'
                      const isInProgress = stage.status === 'En cours'
                      const progressPct = isComplete
                        ? 100
                        : isInProgress
                        ? Math.min(90, Math.round(((stage.completed_quantity || 0) / order.total_quantity) * 100))
                        : 0

                      return (
                        <div
                          key={stage.id}
                          onClick={() => handleOpenStageModal(stage, order)}
                          className="bg-white border border-slate-200 hover:border-navy hover:shadow-md transition-all rounded-lg p-3 cursor-pointer text-right group"
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {stage.status}
                            </span>
                            <span className="font-mono font-bold text-navy group-hover:text-orange transition">
                              {order.order_number}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {order.model_name || order.model_reference}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {order.total_quantity} زوج ({order.color})
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2.5">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                              <span>{progressPct}%</span>
                              <span>تقدم الإنجاز</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isComplete ? 'bg-emerald-500' : isInProgress ? 'bg-orange' : 'bg-slate-300'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Operator */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                            <span className="font-mono text-[10px] text-slate-400">
                              {stage.rejected_quantity ? `هدر: ${stage.rejected_quantity}` : ''}
                            </span>
                            <span className="font-medium text-slate-700 truncate">
                              👤 {stage.operator_name || 'أحمد علي'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage Update Modal */}
      {activeStage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-1">
              تحديث مرحلة الإنتاج / Étape {activeStage.stage.stage_name_fr}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              أمر الإنتاج: {activeStage.order.order_number} | الموديل: {activeStage.order.model_name} ({activeStage.order.total_quantity} زوج)
            </p>

            <form onSubmit={handleSaveStage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">حالة المرحلة</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateData({ ...updateData, status: 'En attente' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      updateData.status === 'En attente'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    في الانتظار
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateData({ ...updateData, status: 'En cours' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      updateData.status === 'En cours'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    قيد العمل
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateData({ ...updateData, status: 'Terminé' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      updateData.status === 'Terminé'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    مكتمل (Terminé)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الكمية المنجزة (زوج)</label>
                  <input
                    type="number"
                    min="0"
                    max={activeStage.order.total_quantity}
                    value={updateData.completed_quantity}
                    onChange={(e) => setUpdateData({ ...updateData, completed_quantity: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الهدر / المرفوض (زوج)</label>
                  <input
                    type="number"
                    min="0"
                    value={updateData.rejected_quantity}
                    onChange={(e) => setUpdateData({ ...updateData, rejected_quantity: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم العامل / المشرف (Opérateur)</label>
                <input
                  type="text"
                  value={updateData.operator_name}
                  onChange={(e) => setUpdateData({ ...updateData, operator_name: e.target.value })}
                  placeholder="Ex: Ahmed Ali"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات المرحلة</label>
                <input
                  type="text"
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  placeholder="Ex: Conforme aux exigences qualité..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setActiveStage(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm"
                >
                  حفظ وتأكيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
