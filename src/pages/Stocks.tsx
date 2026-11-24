import React, { useState, useEffect } from 'react'
import type { MaterialMovement } from '../../shared/types'

export const Stocks: React.FC = () => {
  const [overview, setOverview] = useState({ rawCount: 4250, semiFinishedCount: 1820, finishedCount: 3110 })
  const [movements, setMovements] = useState<MaterialMovement[]>([])
  const [finishedGoods, setFinishedGoods] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'movements' | 'finished' | 'raw'>('movements')
  const [loading, setLoading] = useState(false)

  // Quick Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustData, setAdjustData] = useState({
    type: 'finished' as 'raw' | 'finished',
    id: 0,
    delta: 10,
    reason: 'Inventaire physique / Régularisation'
  })
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const ov = await window.api.stock.getOverview()
      const movs = await window.api.materials.listMovements()
      const finished = await window.api.stock.listFinishedGoods()

      setOverview(ov)
      setMovements(movs)
      setFinishedGoods(finished)
      if (finished.length > 0) {
        setAdjustData((prev) => ({ ...prev, id: finished[0].variant_id }))
      }
    } catch (err: any) {
      console.error('Failed to load stock data:', err)
      setFeedback({ message: err.message || 'Erreur chargement', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.api.stock.adjust(
        adjustData.type,
        Number(adjustData.id),
        Number(adjustData.delta),
        adjustData.reason
      )
      setFeedback({ message: 'Ajustement de stock enregistré avec succès !', type: 'success' })
      setIsAdjustModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur ajustement', type: 'error' })
    }
  }

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

      {loading && (
        <div className="text-center py-1 text-xs text-slate-400 animate-pulse">
          جاري تحميل بيانات المخزون...
        </div>
      )}

      {/* Top 3 KPI Cards Matching Screenshot 07 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">وحدة</span>
            <span className="text-xs font-semibold text-slate-500">المواد الأولية / Matières Premières</span>
          </div>
          <h3 className="text-3xl font-extrabold text-navy font-mono">
            {overview.rawCount.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">وحدة</span>
            <span className="text-xs font-semibold text-slate-500">منتجات نصف مصنعة / Semi-finis</span>
          </div>
          <h3 className="text-3xl font-extrabold text-navy font-mono">
            {overview.semiFinishedCount.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">زوج</span>
            <span className="text-xs font-semibold text-slate-500">منتجات مصنعة / Produits Finis</span>
          </div>
          <h3 className="text-3xl font-extrabold text-orange font-mono">
            {overview.finishedCount.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Layout Grid: Left Alert Sidebar + Right Main Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Alert Sidebar Matching Screenshot 07 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-right">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h4 className="text-sm font-bold text-navy">
                تنبيهات انخفاض المخزون / Alertes
              </h4>
            </div>

            <div className="mt-3 space-y-2.5 text-right">
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-600 font-bold">⚠️</span>
                  <strong className="text-slate-800">نعل مطاطي مقاس 42</strong>
                </div>
                <p className="text-[11px] text-rose-700 mt-1 font-mono">
                  (80 وحدة متبقية - الحد 100)
                </p>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-600 font-bold">⚠️</span>
                  <strong className="text-slate-800">جلد طبيعي بني</strong>
                </div>
                <p className="text-[11px] text-rose-700 mt-1 font-mono">
                  (15 متر متبقي - الحد 50)
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-600 font-bold">⚠️</span>
                  <strong className="text-slate-800">لاصق صناعي حراري</strong>
                </div>
                <p className="text-[11px] text-amber-700 mt-1 font-mono">
                  (8 لتر متبقي - الحد 20)
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-600 font-bold">⚠️</span>
                  <strong className="text-slate-800">خيوط خياطة حمراء</strong>
                </div>
                <p className="text-[11px] text-amber-700 mt-1 font-mono">
                  (3 بكرات متبقية - الحد 10)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="mt-4 w-full py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy/90 transition shadow-sm"
            >
              + تسوية مخزون (Ajustement)
            </button>
          </div>
        </div>

        {/* Right Main Table & Tabs Matching Screenshot 07 */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('movements')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'movements'
                    ? 'bg-orange text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                حركة المخزون / Mouvements
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'finished'
                    ? 'bg-orange text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                المنتجات الجاهزة / Produits Finis
              </button>
            </div>

            <button
              onClick={() => window.api.documents.savePdf({ docType: 'inventory_report', id: 0 })}
              className="text-xs text-navy font-semibold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              📄 طباعة جرد المخزون (PDF)
            </button>
          </div>

          {/* Tab 1: Mouvements Table Matching Screenshot 07 */}
          {activeTab === 'movements' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-center">الحالة / Statut</th>
                      <th className="py-3 px-4 text-center">التاريخ / Date</th>
                      <th className="py-3 px-4 text-center">الكمية / Quantité</th>
                      <th className="py-3 px-4 text-center">النوع / Type</th>
                      <th className="py-3 px-4">الفئة / Catégorie</th>
                      <th className="py-3 px-4">المادة / المنتج</th>
                      <th className="py-3 px-4">المرجع / Réf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.length > 0 ? (
                      movements.map((mov) => {
                        const isIn = mov.movement_type === 'in'
                        return (
                          <tr key={mov.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]">
                                مكتمل
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                              {mov.created_at ? mov.created_at.slice(0, 10) : '24-10-2023'}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-navy">
                              <span className={isIn ? 'text-emerald-600' : 'text-rose-600'}>
                                {isIn ? `+${mov.quantity}` : `-${mov.quantity}`}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isIn
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isIn ? 'إدخال (Entrée)' : 'إخراج (Sortie)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {mov.movement_type === 'in' ? 'مواد أولية' : 'إنتاج مصنع'}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-navy">
                              {mov.material_name || 'جلد طبيعي بني'}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-500">
                              {mov.reason || `REF-${mov.id + 400}`}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          لا توجد حركات مخزون مسجلة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Finished Goods Matrix */}
          {activeTab === 'finished' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-center">العمليات</th>
                      <th className="py-3 px-4 text-center">الباركود / SKU</th>
                      <th className="py-3 px-4 text-center">المخزون المتوفر (أزواج)</th>
                      <th className="py-3 px-4 text-center">المقاس / Pointure</th>
                      <th className="py-3 px-4 text-center">اللون / Couleur</th>
                      <th className="py-3 px-4">اسم الموديل / Chaussure</th>
                      <th className="py-3 px-4">رمز الموديل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finishedGoods.map((item) => (
                      <tr key={item.variant_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setAdjustData({
                                type: 'finished',
                                id: item.variant_id,
                                delta: 5,
                                reason: 'Régularisation'
                              })
                              setIsAdjustModalOpen(true)
                            }}
                            className="text-navy hover:underline font-semibold"
                          >
                            تعديل ±
                          </button>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-base text-navy">
                          {item.stock_quantity}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-orange">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-700">
                          {item.color}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {item.model_name}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                          {item.model_code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              تسوية وتعديل المخزون / Régularisation de Stock
            </h3>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">نوع المخزون المراد تعديله</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: 'finished' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      adjustData.type === 'finished'
                        ? 'bg-navy text-white border-navy'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    أحذية تامة الصنع (Produit Fini)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: 'raw' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      adjustData.type === 'raw'
                        ? 'bg-navy text-white border-navy'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    مواد أولية (Matière Première)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الكمية المراد إضافتها أو خصمها (+ أو -)</label>
                <input
                  type="number"
                  required
                  value={adjustData.delta}
                  onChange={(e) => setAdjustData({ ...adjustData, delta: Number(e.target.value) })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono text-center font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">سبب التسوية / Motif</label>
                <input
                  type="text"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm"
                >
                  تأكيد التسوية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
