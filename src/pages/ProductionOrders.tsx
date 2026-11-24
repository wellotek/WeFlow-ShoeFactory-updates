import React, { useState, useEffect } from 'react'
import type { ProductionOrder, ProductionMaterialNeed, ShoeModel } from '../../shared/types'

export const ProductionOrders: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [models, setModels] = useState<ShoeModel[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [materialNeeds, setMaterialNeeds] = useState<ProductionMaterialNeed[]>([])

  // Feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // New OF Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    model_id: 0,
    color: 'Noir',
    start_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    priority: 'Normale' as 'Basse' | 'Normale' | 'Haute' | 'Urgente',
    observations: '',
    size_breakdown: {
      '38': 20,
      '39': 25,
      '40': 30,
      '41': 25,
      '42': 15,
      '43': 5
    } as Record<string, number>
  })

  const loadData = async () => {
    try {
      const ordList = await window.api.productionOrders.list()
      const modList = await window.api.models.list()

      setOrders(ordList)
      setModels(modList)

      if (ordList.length > 0) {
        const idToSelect = selectedOrderId && ordList.some((o) => o.id === selectedOrderId) ? selectedOrderId : ordList[0].id
        setSelectedOrderId(idToSelect)
        loadNeeds(idToSelect)
      }
    } catch (err: any) {
      console.error('Failed to load production orders:', err)
      setFeedback({ message: err.message || 'Erreur chargement', type: 'error' })
    }
  }

  const loadNeeds = async (orderId: number) => {
    try {
      const needs = await window.api.productionOrders.calculateNeeds(orderId)
      setMaterialNeeds(needs)
    } catch (err) {
      console.error('Failed to calculate needs:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null

  const handleSelectOrder = (id: number) => {
    setSelectedOrderId(id)
    loadNeeds(id)
  }

  const handleLaunchOrder = async (id: number) => {
    try {
      await window.api.productionOrders.launch(id)
      setFeedback({ message: 'Ordre de fabrication lancé en production avec succès !', type: 'success' })
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur au lancement', type: 'error' })
    }
  }

  const handlePrintPdf = async (id: number) => {
    try {
      await window.api.documents.savePdf({
        docType: 'production_order',
        id,
        suggestedFilename: `OF_${currentOrder?.order_number || 'PR'}.pdf`
      })
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleOpenCreate = () => {
    if (models.length === 0) {
      alert('Veuillez créer au moins un modèle.')
      return
    }
    setFormData({
      model_id: models[0].id,
      color: 'Noir',
      start_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      priority: 'Normale',
      observations: '',
      size_breakdown: {
        '38': 20,
        '39': 25,
        '40': 30,
        '41': 25,
        '42': 15,
        '43': 5
      }
    })
    setIsModalOpen(true)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalQuantity = Object.values(formData.size_breakdown).reduce((a, b) => a + Number(b || 0), 0)
      if (totalQuantity <= 0) {
        alert('Veuillez entrer une quantité supérieure à 0.')
        return
      }

      const created = await window.api.productionOrders.create({
        model_id: formData.model_id,
        color: formData.color,
        total_quantity: totalQuantity,
        size_breakdown: formData.size_breakdown,
        start_date: formData.start_date,
        due_date: formData.due_date,
        priority: formData.priority,
        observations: formData.observations
      })

      setFeedback({ message: `OF ${created.order_number} créé avec succès !`, type: 'success' })
      setIsModalOpen(false)
      await loadData()
      setSelectedOrderId(created.id)
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur création OF', type: 'error' })
    }
  }

  // Parse size matrix of current order
  const sizeEntries = currentOrder
    ? Object.entries(
        typeof currentOrder.size_breakdown === 'string'
          ? JSON.parse(currentOrder.size_breakdown)
          : currentOrder.size_breakdown || {}
      ).sort(([a], [b]) => Number(a) - Number(b))
    : []

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

      {/* Selector & Actions Bar Matching Screenshot 05 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">أمر الإنتاج / Ordre de Fab:</span>
          <select
            value={selectedOrderId || ''}
            onChange={(e) => handleSelectOrder(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold text-navy focus:outline-none focus:border-navy"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number} — {o.model_name || 'Modèle'} ({o.total_quantity} paires - {o.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 text-sm font-medium shadow-sm transition"
          >
            + أمر إنتاج جديد (Nouvel OF)
          </button>
          {currentOrder && (
            <>
              {currentOrder.status === 'Brouillon' && (
                <button
                  onClick={() => handleLaunchOrder(currentOrder.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm transition"
                >
                  🚀 إطلاق الإنتاج (Lancer)
                </button>
              )}
              <button
                onClick={() => handlePrintPdf(currentOrder.id)}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm transition flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>طباعة / PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {currentOrder ? (
        <div className="space-y-6">
          {/* Main OF Header Card Matching Screenshot 05 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  {currentOrder.photo_url ? (
                    <img src={currentOrder.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">👟</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-navy">
                      أمر الإنتاج - {currentOrder.order_number}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        currentOrder.status === 'En cours'
                          ? 'bg-blue-100 text-blue-800'
                          : currentOrder.status === 'Terminé'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    الموديل: <strong className="text-slate-800">{currentOrder.model_name || currentOrder.model_reference}</strong> | اللون: <strong className="text-slate-800">{currentOrder.color}</strong> | إجمالي الكمية: <strong className="text-navy font-mono text-sm">{currentOrder.total_quantity} زوج</strong>
                  </p>
                </div>
              </div>

              <div className="text-left font-mono text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p>تاريخ البدء: <strong className="text-navy">{currentOrder.start_date || '—'}</strong></p>
                <p>تاريخ التسليم: <strong className="text-navy">{currentOrder.due_date || '—'}</strong></p>
              </div>
            </div>

            {/* Size Breakdown Matrix Matching Screenshot 05 */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-navy mb-3 text-center">
                توزيع مقاسات الأحذية / Grille des Pointures
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                      <th className="p-2 border border-slate-200">المقاس / Pointure</th>
                      {sizeEntries.map(([size]) => (
                        <th key={size} className="p-2 border border-slate-200 font-mono font-bold text-navy">
                          {size}
                        </th>
                      ))}
                      <th className="p-2 border border-slate-200 bg-slate-200 font-bold">المجموع / Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-navy font-bold text-sm">
                      <td className="p-2.5 border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                        الكمية المطلوبة
                      </td>
                      {sizeEntries.map(([size, qty]) => (
                        <td key={size} className="p-2.5 border border-slate-200 font-mono text-base">
                          {String(qty)}
                        </td>
                      ))}
                      <td className="p-2.5 border border-slate-200 bg-slate-100 font-mono text-base text-orange">
                        {currentOrder.total_quantity}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Progress & Material Allocations Matching Screenshot 05 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold font-mono text-orange">
                  {currentOrder.completion_percentage}% مكتمل
                </span>
                <h4 className="text-base font-bold text-navy">نسبة تقدم الإنتاج / Avancement</h4>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-6 border border-slate-200">
                <div
                  className="h-full bg-orange transition-all duration-500"
                  style={{ width: `${currentOrder.completion_percentage}%` }}
                />
              </div>

              {/* Stage breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-navy">
                    {currentOrder.completion_percentage >= 15 ? '100%' : '0%'}
                  </span>
                  <span className="font-semibold text-slate-700">قص الجلد / Coupe</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-navy">
                    {currentOrder.completion_percentage >= 30 ? '100%' : currentOrder.completion_percentage >= 15 ? '60%' : '0%'}
                  </span>
                  <span className="font-semibold text-slate-700">الخياطة / Piquage</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-navy">
                    {currentOrder.completion_percentage >= 60 ? '100%' : '0%'}
                  </span>
                  <span className="font-semibold text-slate-700">التركيب والتجميع / Montage</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-navy">
                    {currentOrder.completion_percentage === 100 ? '100%' : '0%'}
                  </span>
                  <span className="font-semibold text-slate-700">التشطيب والتغليف / Finition</span>
                </div>
              </div>
            </div>

            {/* Allocations Matières Premières Matching Screenshot 05 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="text-base font-bold text-navy mb-4 text-right">
                مخصصات المواد الأولية / Besoins Matières
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center">الحالة / Statut</th>
                      <th className="py-2.5 px-3 text-center">الكمية المطلوبة</th>
                      <th className="py-2.5 px-3">المادة / Matière</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materialNeeds.length > 0 ? (
                      materialNeeds.map((need, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                need.is_sufficient
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {need.is_sufficient ? '🟢 متوفر (Dispo)' : '🔴 نقص (Manquant)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-navy">
                            {need.quantity_required.toFixed(2)} {need.unit}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {need.material_name}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">
                          لا توجد بطاقة تقنية مرتبطة لحساب الاحتياجات.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          لا توجد أوامر إنتاج. انقر على "+ أمر إنتاج جديد" لإنشاء أول أمر.
        </div>
      )}

      {/* New OF Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              إنشاء أمر إنتاج جديد / Nouvel Ordre de Fabrication
            </h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الموديل / Modèle</label>
                  <select
                    value={formData.model_id}
                    onChange={(e) => setFormData({ ...formData, model_id: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.reference} — {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">اللون / Couleur</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ التسليم المتوقع</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              {/* Pointures Grid */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-700 mb-3 text-right">
                  تحديد الكميات حسب المقاس / Grille des Tailles
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {['38', '39', '40', '41', '42', '43'].map((size) => (
                    <div key={size} className="text-center">
                      <span className="block text-xs font-mono font-bold text-navy mb-1">{size}</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.size_breakdown[size] || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            size_breakdown: {
                              ...formData.size_breakdown,
                              [size]: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full text-center text-sm font-mono border border-slate-200 rounded-lg p-1.5 bg-white font-bold"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-right text-xs text-navy font-bold mt-3">
                  الإجمالي: {Object.values(formData.size_breakdown).reduce((a, b) => a + Number(b || 0), 0)} زوج
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Ex: Priorité haute pour commande gros..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  إلغاء / Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm"
                >
                  إنشاء أمر الإنتاج / Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
