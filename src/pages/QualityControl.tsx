import React, { useState, useEffect } from 'react'
import type { QualityInspection, ProductionOrder } from '../../shared/types'

export const QualityControl: React.FC = () => {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    lot_number: 'LOT-2026-001',
    production_order_id: 1,
    model_name: 'Homme Classique SF-001',
    inspector_name: 'Karim Hadj',
    quantity_inspected: 20,
    quantity_rejected: 1,
    quantity_accepted: 19,
    defect_cause: 'couture',
    severity: 'Mineure' as 'Mineure' | 'Moyenne' | 'Critique',
    action_taken: 'Accepté avec concession' as 'Rejeté' | 'Retouche' | 'Accepté avec concession',
    notes: 'Points de couture lâches sur le talon gauche corrigés immédiatement.'
  })
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const inspList = await window.api.quality.list()
      const ordList = await window.api.productionOrders.list()
      setInspections(inspList)
      setOrders(ordList)
      if (ordList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          production_order_id: ordList[0].id,
          model_name: ordList[0].model_name
        }))
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.api.quality.recordInspection({
        ...formData,
        inspection_date: new Date().toISOString().slice(0, 10)
      })
      setFeedback({ message: 'Rapport de contrôle qualité enregistré avec succès !', type: 'success' })
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur enregistrement', type: 'error' })
    }
  }

  const handlePrintQualityReport = async () => {
    try {
      await window.api.documents.savePdf({
        docType: 'quality_report',
        id: 0,
        suggestedFilename: `Rapport_Qualite_${new Date().toISOString().slice(0, 10)}.pdf`
      })
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const totalInspections = inspections.length
  const acceptedCount = inspections.filter((i) => i.action_taken === 'Accepté avec concession' || i.quantity_rejected === 0).length
  const passRate = totalInspections > 0 ? Math.round((acceptedCount / totalInspections) * 100) : 98
  const rejectedCount = inspections.filter((i) => i.action_taken === 'Rejeté').length

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

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500">إجمالي الفحوصات / Total Contrôles</p>
          <h3 className="text-3xl font-extrabold text-navy font-mono mt-1">{totalInspections}</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-emerald-600">نسبة المطابقة والجودة / Conformité</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">{passRate}%</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-amber-600">حالات إعادة العمل / Retouches</p>
          <h3 className="text-3xl font-extrabold text-amber-600 font-mono mt-1">
            {inspections.filter((i) => i.action_taken === 'Retouche').length}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-rose-600">الأحذية المرفوضة / Rebuts</p>
          <h3 className="text-3xl font-extrabold text-rose-600 font-mono mt-1">{rejectedCount}</h3>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 shadow-sm transition flex items-center gap-2"
          >
            <span>+</span>
            <span>تسجيل فحص جودة جديد (Nouveau Contrôle)</span>
          </button>
          <button
            onClick={handlePrintQualityReport}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            📄 تصدير تقرير الجودة (PDF)
          </button>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">الإجراء المتخذ / Action</th>
                <th className="py-3 px-4 text-center">الخطورة / Gravité</th>
                <th className="py-3 px-4">نوع العيب / Cause</th>
                <th className="py-3 px-4 text-center">المرفوض</th>
                <th className="py-3 px-4 text-center">العينة / Échantillon</th>
                <th className="py-3 px-4">المراقب / Inspecteur</th>
                <th className="py-3 px-4">رقم الدفعة / Lot</th>
                <th className="py-3 px-4 text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.map((insp) => {
                const isPass = insp.action_taken === 'Accepté avec concession'
                const isRework = insp.action_taken === 'Retouche'
                return (
                  <tr key={insp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRework
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {insp.action_taken}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          insp.severity === 'Critique'
                            ? 'bg-rose-100 text-rose-700'
                            : insp.severity === 'Moyenne'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {insp.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {insp.defect_cause || 'Couture'}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-600">
                      {insp.quantity_rejected}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                      {insp.quantity_inspected} زوج
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      👤 {insp.inspector_name}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-navy">
                      {insp.lot_number}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {insp.inspection_date || '2026-01-15'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              تسجيل فحص مراقبة الجودة / Contrôle Qualité
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">أمر الإنتاج / OF</label>
                  <select
                    value={formData.production_order_id}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      const o = orders.find((ord) => ord.id === id)
                      setFormData({
                        ...formData,
                        production_order_id: id,
                        model_name: o?.model_name || 'SF-001'
                      })
                    }}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} — {o.model_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الدفعة (Lot)</label>
                  <input
                    type="text"
                    required
                    value={formData.lot_number}
                    onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المراقب</label>
                <input
                  type="text"
                  required
                  value={formData.inspector_name}
                  onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">حجم العينة (أزواج)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity_inspected}
                    onChange={(e) => setFormData({ ...formData, quantity_inspected: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">عدد المرفوض</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity_rejected}
                    onChange={(e) => setFormData({ ...formData, quantity_rejected: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">سبب العيب</label>
                  <input
                    type="text"
                    value={formData.defect_cause}
                    onChange={(e) => setFormData({ ...formData, defect_cause: e.target.value })}
                    placeholder="Ex: Couture, Semelle, Cuir..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">درجة الخطورة</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                  >
                    <option value="Mineure">طفيف (Mineure)</option>
                    <option value="Moyenne">متوسط (Moyenne)</option>
                    <option value="Critique">حرج (Critique)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الإجراء المتخذ</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, action_taken: 'Accepté avec concession' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      formData.action_taken === 'Accepté avec concession'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, action_taken: 'Retouche' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      formData.action_taken === 'Retouche'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    إعادة عمل
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, action_taken: 'Rejeté' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      formData.action_taken === 'Rejeté'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    رفض نهائي
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-xs font-bold shadow-sm"
                >
                  حفظ الفحص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
