import React, { useState, useEffect } from 'react'
import type { Delivery, CustomerOrder } from '../../shared/types'

export const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    customer_order_id: 0,
    customer_id: 0,
    delivery_date: new Date().toISOString().slice(0, 10),
    driver_name: 'Djamel Transport',
    notes: 'Livraison complète avec facture jointe.'
  })

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const dList = await window.api.deliveries.list()
      const oList = await window.api.customerOrders.list()
      setDeliveries(dList)
      setOrders(oList)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    if (orders.length === 0) {
      alert('Veuillez d’abord avoir des commandes clients enregistrées.')
      return
    }
    const firstOrd = orders[0]
    setFormData({
      customer_order_id: firstOrd.id,
      customer_id: firstOrd.customer_id,
      delivery_date: new Date().toISOString().slice(0, 10),
      driver_name: 'Djamel Transport',
      notes: 'Livraison complète avec facture jointe.'
    })
    setIsModalOpen(true)
  }

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await window.api.deliveries.create({
        customer_order_id: formData.customer_order_id,
        customer_id: formData.customer_id,
        delivery_date: formData.delivery_date,
        driver_name: formData.driver_name,
        notes: formData.notes,
        items: [{ model_id: 1, color: 'Noir', size: 40, quantity: 20 }] as any
      })
      setFeedback({ message: `Bon de livraison ${created.delivery_number} créé avec succès !`, type: 'success' })
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur', type: 'error' })
    }
  }

  const handlePrintBL = async (id: number) => {
    try {
      await window.api.documents.savePdf({
        docType: 'delivery_note',
        id,
        suggestedFilename: `Bon_Livraison_${id}.pdf`
      })
    } catch (err: any) {
      alert('Erreur impression: ' + err.message)
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

      {/* Header and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium text-xs shadow-sm transition flex items-center gap-2"
        >
          <span>+</span>
          <span>إنشاء وصل تسليم جديد (Nouveau Bon de Livraison)</span>
        </button>

        <div className="text-right">
          <span className="text-[11px] text-slate-500">إجمالي وصولات التسليم:</span>
          <span className="block font-mono font-bold text-navy text-sm">
            {deliveries.length} وصولات
          </span>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">العمليات</th>
                <th className="py-3 px-4 text-center">الحالة / Statut</th>
                <th className="py-3 px-4">السائق / الناقل</th>
                <th className="py-3 px-4 text-center">تاريخ التسليم</th>
                <th className="py-3 px-4">الزبون / Client</th>
                <th className="py-3 px-4">رقم وصل التسليم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => handlePrintBL(d.id)}
                      title="Imprimer Bon de Livraison"
                      className="px-3 py-1 bg-navy text-white rounded text-[11px] font-bold hover:bg-navy/90 shadow-sm"
                    >
                      🖨️ طباعة BL
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {d.status === 'Livrée' ? 'تم التسليم' : 'قيد الشحن والتوصيل'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">🚚 {d.driver_name || '—'}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                    {d.delivery_date ? d.delivery_date.slice(0, 10) : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-navy">{d.customer_name}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-navy">{d.delivery_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              إنشاء وصل تسليم جديد / Bon de Livraison
            </h3>
            <form onSubmit={handleCreateDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الطلبية المراد تسليمها</label>
                <select
                  value={formData.customer_order_id}
                  onChange={(e) => {
                    const chosen = orders.find((o) => o.id === Number(e.target.value))
                    setFormData({
                      ...formData,
                      customer_order_id: Number(e.target.value),
                      customer_id: chosen?.customer_id || 0
                    })
                  }}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {o.customer_name} ({o.total_amount.toLocaleString()} DA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ التسليم</label>
                  <input
                    type="date"
                    required
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">السائق أو الناقل</label>
                  <input
                    type="text"
                    required
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات التسليم</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
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
                  تأكيد وإنشاء BL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
