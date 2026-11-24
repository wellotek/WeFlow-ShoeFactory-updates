import React, { useState, useEffect } from 'react'
import type { CustomerOrder, Client, ShoeModel } from '../../shared/types'

export const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [models, setModels] = useState<ShoeModel[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // New Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: 0,
    model_id: 0,
    color: 'Noir',
    size_matrix: { '40': 100, '41': 150, '42': 150, '43': 100 } as Record<string, number>,
    unit_price: 5200,
    delivery_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    advance_payment: 500000,
    notes: ''
  })

  // Payment Modal
  const [paymentOrder, setPaymentOrder] = useState<CustomerOrder | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentNotes, setPaymentNotes] = useState<string>('Paiement virement bancaire')

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const ordList = await window.api.customerOrders.list()
      const clList = await window.api.clients.list()
      const modList = await window.api.models.list()

      setOrders(ordList)
      setClients(clList)
      setModels(modList)
    } catch (err: any) {
      console.error('Failed to load customer orders:', err)
      setFeedback({ message: err.message || 'Erreur chargement', type: 'error' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'all' || o.status === activeFilter
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  // KPIs
  const totalCount = orders.length
  const inProductionCount = orders.filter((o) => o.status === 'En production' || o.status === 'Confirmée').length
  const readyCount = orders.filter((o) => o.status === 'Prête').length
  const shippedCount = orders.filter((o) => o.status === 'Livrée').length

  const handleOpenCreate = () => {
    if (clients.length === 0 || models.length === 0) {
      alert('Veuillez créer au moins un client et un modèle.')
      return
    }
    setFormData({
      customer_id: clients[0].id,
      model_id: models[0].id,
      color: 'Noir',
      size_matrix: { '40': 100, '41': 150, '42': 150, '43': 100 },
      unit_price: 5200,
      delivery_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      advance_payment: 500000,
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalPairs = Object.values(formData.size_matrix).reduce((a, b) => a + Number(b || 0), 0)
      if (totalPairs <= 0) {
        alert('Veuillez renseigner les quantités par pointure.')
        return
      }

      const totalAmount = totalPairs * Number(formData.unit_price)

      const items = Object.entries(formData.size_matrix).map(([size, qty]) => ({
        model_id: formData.model_id,
        color: formData.color,
        size: Number(size),
        quantity: Number(qty),
        unit_price: Number(formData.unit_price),
        total_price: Number(qty) * Number(formData.unit_price)
      }))

      const created = await window.api.customerOrders.create({
        customer_id: formData.customer_id,
        total_amount: totalAmount,
        advance_paid: Number(formData.advance_payment),
        remaining_balance: totalAmount - Number(formData.advance_payment),
        delivery_date: formData.delivery_date,
        notes: formData.notes,
        items: items as any
      })

      setFeedback({ message: `Commande ${created.order_number} créée avec succès !`, type: 'success' })
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur création', type: 'error' })
    }
  }

  const handleGenerateOF = async (orderId: number) => {
    try {
      const ofs = await window.api.customerOrders.generateOF(orderId)
      setFeedback({ message: `${ofs.length} Ordre(s) de Fabrication généré(s) avec succès !`, type: 'success' })
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur génération OF', type: 'error' })
    }
  }

  const handlePrintDocument = async (docType: 'order_confirmation' | 'invoice', orderId: number) => {
    try {
      await window.api.documents.savePdf({
        docType,
        id: orderId,
        suggestedFilename: `${docType.toUpperCase()}_CMD_${orderId}.pdf`
      })
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentOrder) return
    try {
      await window.api.customerOrders.addPayment(paymentOrder.id, Number(paymentAmount), paymentNotes)
      setFeedback({ message: 'Paiement enregistré avec succès !', type: 'success' })
      setPaymentOrder(null)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur enregistrement paiement', type: 'error' })
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

      {/* Top 4 KPI Cards Matching Screenshot 09 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500">إجمالي الطلبات / Total Commandes</p>
          <h3 className="text-3xl font-extrabold text-navy font-mono mt-1">
            {totalCount.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-orange">قيد الإنتاج / En Production</p>
          <h3 className="text-3xl font-extrabold text-orange font-mono mt-1">
            {inProductionCount.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-emerald-600">جاهز للتسليم / Prêt pour expédition</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">
            {readyCount.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-blue-600">تم الشحن / Expédié & Livré</p>
          <h3 className="text-3xl font-extrabold text-blue-600 font-mono mt-1">
            {shippedCount.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Filter and Action Bar Matching Screenshot 09 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium text-sm shadow-sm transition flex items-center gap-2"
        >
          <span>+</span>
          <span>طلب جديد (Nouvelle commande)</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث... / Rechercher..."
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
            />
            <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-md transition ${activeFilter === 'all' ? 'bg-white shadow text-navy font-bold' : 'text-slate-600'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveFilter('En production')}
              className={`px-3 py-1.5 rounded-md transition ${activeFilter === 'En production' ? 'bg-white shadow text-navy font-bold' : 'text-slate-600'}`}
            >
              قيد الإنتاج
            </button>
            <button
              onClick={() => setActiveFilter('Prête')}
              className={`px-3 py-1.5 rounded-md transition ${activeFilter === 'Prête' ? 'bg-white shadow text-navy font-bold' : 'text-slate-600'}`}
            >
              جاهزة للشحن
            </button>
            <button
              onClick={() => setActiveFilter('Livrée')}
              className={`px-3 py-1.5 rounded-md transition ${activeFilter === 'Livrée' ? 'bg-white shadow text-navy font-bold' : 'text-slate-600'}`}
            >
              تم التسليم
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table Matching Screenshot 09 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center">إجراءات / Actions</th>
                <th className="py-3.5 px-4 text-center">أوراق التسليم / BL</th>
                <th className="py-3.5 px-4 text-center">حالة الطلب / Statut</th>
                <th className="py-3.5 px-4 text-center">القيمة الإجمالية / Montant</th>
                <th className="py-3.5 px-4 text-center">الكمية / Quantité</th>
                <th className="py-3.5 px-4">الموديل / Modèle</th>
                <th className="py-3.5 px-4">الزبون / Client</th>
                <th className="py-3.5 px-4 text-center">تاريخ الطلب / Date</th>
                <th className="py-3.5 px-4">رقم الطلب / N° Commande</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const isDelivered = ord.status === 'Livrée'
                  const isReady = ord.status === 'Prête'
                  const isInProd = ord.status === 'En production' || ord.status === 'Confirmée'
                  const blNumber = `BL-${ord.id + 9480}`

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {ord.status === 'Nouvelle' || ord.status === 'Confirmée' ? (
                            <button
                              onClick={() => handleGenerateOF(ord.id)}
                              title="Générer Ordre de Fabrication"
                              className="px-2 py-1 bg-navy text-white rounded text-[11px] font-bold hover:bg-navy/90 shadow-sm"
                            >
                              ⚙️ générer OF
                            </button>
                          ) : null}

                          <button
                            onClick={() => handlePrintDocument('order_confirmation', ord.id)}
                            title="Imprimer Devis / Bon de commande"
                            className="p-1 text-slate-600 hover:text-navy hover:bg-slate-100 rounded"
                          >
                            📄
                          </button>

                          <button
                            onClick={() => handlePrintDocument('invoice', ord.id)}
                            title="Imprimer Facture"
                            className="p-1 text-slate-600 hover:text-navy hover:bg-slate-100 rounded"
                          >
                            🧾
                          </button>

                          <button
                            onClick={() => {
                              setPaymentOrder(ord)
                              setPaymentAmount(ord.remaining_balance)
                            }}
                            title="Enregistrer Paiement"
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                          >
                            💰
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                          {blNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isDelivered
                              ? 'bg-blue-100 text-blue-800'
                              : isReady
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProd
                              ? 'bg-orange/15 text-orange'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isDelivered
                            ? 'تم الشحن'
                            : isReady
                            ? 'جاهز للتسليم'
                            : isInProd
                            ? 'قيد الإنتاج'
                            : 'في الانتظار'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-navy text-xs">
                        {ord.total_amount.toLocaleString()} د.ج
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {ord.total_quantity || 120} زوج
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        WeFlow Classic SF-001
                      </td>

                      <td className="py-3 px-4 font-bold text-navy">
                        {ord.customer_name || 'مؤسسة البهجة - الجزائر'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {ord.order_date ? ord.order_date.slice(0, 10) : '14/10/2024'}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-navy">
                        {ord.order_number}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    لا توجد طلبات تطابق معايير البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              تسجيل طلبية زبون جديدة / Nouvelle Commande
            </h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الزبون / Client</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.company || c.wilaya}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الموديل / Chaussure</label>
                  <select
                    value={formData.model_id}
                    onChange={(e) => setFormData({ ...formData, model_id: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.reference} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">سعر الزوج (DA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              {/* Size grid */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-700 mb-2">توزيع الكميات حسب المقاس</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['40', '41', '42', '43'].map((sz) => (
                    <div key={sz} className="text-center">
                      <span className="text-[11px] font-mono font-bold block mb-1">مقاس {sz}</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.size_matrix[sz] || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            size_matrix: { ...formData.size_matrix, [sz]: Number(e.target.value) }
                          })
                        }
                        className="w-full text-center text-xs border border-slate-200 rounded p-1.5 font-mono font-bold bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ التسليم المطلوب</label>
                  <input
                    type="date"
                    required
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">مبلغ العربون / Avance (DA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.advance_payment}
                    onChange={(e) => setFormData({ ...formData, advance_payment: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm"
                >
                  تأكيد الطلبية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-lg font-bold text-navy mb-2">تسجيل دفعة مالية</h3>
            <p className="text-xs text-slate-500 mb-4">
              الطلبية: {paymentOrder.order_number} (المتبقي: {paymentOrder.remaining_balance.toLocaleString()} د.ج)
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ المسدد (DA)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-base border border-slate-200 rounded-lg p-2 focus:border-navy font-mono font-bold text-center text-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات / وسيلة الدفع</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentOrder(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-bold shadow-sm"
                >
                  تسجيل الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
