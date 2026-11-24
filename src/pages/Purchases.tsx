import React, { useState, useEffect } from 'react'
import type { PurchaseOrder, Supplier, RawMaterial } from '../../shared/types'

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: 0,
    items: [] as any[]
  })

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const pList = await window.api.purchases.list()
      const sList = await window.api.suppliers.list()
      const mList = await window.api.materials.list()
      setPurchases(pList)
      setSuppliers(sList)
      setMaterials(mList)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    if (suppliers.length === 0 || materials.length === 0) {
      alert('Veuillez d’abord avoir des fournisseurs et matières enregistrés.')
      return
    }
    setFormData({
      supplier_id: suppliers[0].id,
      items: [
        {
          material_id: materials[0].id,
          quantity: 100,
          unit_price: materials[0].unit_price
        }
      ]
    })
    setIsModalOpen(true)
  }

  const handleAddItem = () => {
    if (materials.length === 0) return
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          material_id: materials[0].id,
          quantity: 50,
          unit_price: materials[0].unit_price
        }
      ]
    })
  }

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalAmount = formData.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)
      const created = await window.api.purchases.create({
        supplier_id: formData.supplier_id,
        total_amount: totalAmount,
        paid_amount: 0,
        remaining_balance: totalAmount,
        status: 'Commandé',
        items: formData.items as any
      })
      setFeedback({ message: `Bon d'achat ${created.purchase_number} créé avec succès !`, type: 'success' })
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur', type: 'error' })
    }
  }

  const handleReceiveGoods = async (p: PurchaseOrder) => {
    if (!window.confirm(`Confirmer la réception de la marchandise pour ${p.purchase_number} ? Le stock sera incrémenté automatiquement.`)) return
    try {
      const itemsToReceive = p.items && p.items.length > 0
        ? p.items.map((it: any) => ({ material_id: it.material_id, quantity: it.quantity }))
        : [{ material_id: 1, quantity: 50 }]

      await window.api.purchases.receiveGoods(p.id, itemsToReceive)
      setFeedback({ message: `Marchandise réceptionnée ! Le stock de matières a été mis à jour.`, type: 'success' })
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur lors de la réception', type: 'error' })
    }
  }

  const handlePrintPdf = async (id: number) => {
    try {
      await window.api.documents.savePdf({
        docType: 'purchase_order',
        id,
        suggestedFilename: `Bon_Commande_Achat_${id}.pdf`
      })
    } catch (err: any) {
      alert('Erreur impression: ' + err.message)
    }
  }

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0)

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
          <span>طلب شراء مواد أولية (Nouveau Bon d'Achat)</span>
        </button>

        <div className="text-right">
          <span className="text-[11px] text-slate-500">إجمالي المشتريات / Total Achats:</span>
          <span className="block font-mono font-bold text-navy text-sm">
            {totalPurchasesAmount.toLocaleString()} DA
          </span>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">العمليات</th>
                <th className="py-3 px-4 text-center">الحالة / Statut</th>
                <th className="py-3 px-4 text-center">القيمة الإجمالية (DA)</th>
                <th className="py-3 px-4 text-center">تاريخ الطلب</th>
                <th className="py-3 px-4">المورد / Fournisseur</th>
                <th className="py-3 px-4">رقم الشراء / N° Achat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => {
                const isReceived = p.status === 'Reçu'
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isReceived && (
                          <button
                            onClick={() => handleReceiveGoods(p)}
                            title="Réceptionner Marchandise (Entrée Stock)"
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 shadow-sm"
                          >
                            📦 استلام
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintPdf(p.id)}
                          title="Imprimer Bon de commande fournisseur"
                          className="p-1 text-slate-600 hover:text-navy rounded hover:bg-slate-100"
                        >
                          📄
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isReceived
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReceived ? 'مستلم في المخزن' : 'قيد التوريد'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-navy">
                      {p.total_amount.toLocaleString()} DA
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {p.purchase_date ? p.purchase_date.slice(0, 10) : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-navy">{p.supplier_name}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{p.purchase_number}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              إنشاء أمر شراء مواد أولية / Bon d'Achat
            </h3>
            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المورد / Fournisseur</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.wilaya})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex justify-between items-center mb-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs px-2 py-1 bg-navy text-white rounded font-medium"
                  >
                    + إضافة مادة
                  </button>
                  <span className="text-xs font-bold text-slate-700">المواد المطلوبة</span>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <select
                        value={item.material_id}
                        onChange={(e) => {
                          const chosen = materials.find((m) => m.id === Number(e.target.value))
                          const nxt = [...formData.items]
                          nxt[idx].material_id = chosen?.id
                          nxt[idx].unit_price = chosen?.unit_price || 0
                          setFormData({ ...formData, items: nxt })
                        }}
                        className="flex-1 border border-slate-200 rounded p-1.5 bg-white"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} - {m.designation}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const nxt = [...formData.items]
                          nxt[idx].quantity = Number(e.target.value)
                          setFormData({ ...formData, items: nxt })
                        }}
                        placeholder="Qté"
                        className="w-20 border border-slate-200 rounded p-1.5 font-mono text-center"
                      />

                      <input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => {
                          const nxt = [...formData.items]
                          nxt[idx].unit_price = Number(e.target.value)
                          setFormData({ ...formData, items: nxt })
                        }}
                        placeholder="P.U. DA"
                        className="w-24 border border-slate-200 rounded p-1.5 font-mono text-center"
                      />
                    </div>
                  ))}
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
                  تأكيد أمر الشراء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
