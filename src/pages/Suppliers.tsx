import React, { useState, useEffect } from 'react'
import type { Supplier } from '../../shared/types'

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const list = await window.api.suppliers.list(searchTerm)
      setSuppliers(list)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchTerm])

  const handleOpenAdd = () => {
    setEditingSupplier({
      name: '',
      company: '',
      phone: '0550 00 00 00',
      wilaya: 'Blida',
      address: '',
      provided_products: 'Cuirs et peausseries',
      balance_due: 0
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier({ ...sup })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSupplier || !editingSupplier.name) return
    try {
      if (editingSupplier.id) {
        await window.api.suppliers.update(editingSupplier.id, editingSupplier)
        setFeedback({ message: 'Fournisseur mis à jour avec succès', type: 'success' })
      } else {
        await window.api.suppliers.create(editingSupplier)
        setFeedback({ message: 'Fournisseur ajouté avec succès', type: 'success' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur', type: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) return
    try {
      await window.api.suppliers.delete(id)
      setFeedback({ message: 'Fournisseur supprimé', type: 'success' })
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Impossible de supprimer', type: 'error' })
    }
  }

  const totalDettes = suppliers.reduce((acc, s) => acc + (s.balance_due || 0), 0)

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
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium text-xs shadow-sm transition flex items-center gap-2"
        >
          <span>+</span>
          <span>إضافة مورد جديد (Nouveau Fournisseur)</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-500">إجمالي مستحقات الموردين (Dettes):</span>
            <span className="block font-mono font-bold text-rose-600 text-sm">
              {totalDettes.toLocaleString()} DA
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو المادة..."
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
            />
            <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">العمليات</th>
                <th className="py-3 px-4 text-center">المستحقات (DA)</th>
                <th className="py-3 px-4">المواد الموردة</th>
                <th className="py-3 px-4 text-center">الولاية</th>
                <th className="py-3 px-4 text-center">الهاتف</th>
                <th className="py-3 px-4">اسم المورد / الشركة</th>
                <th className="py-3 px-4">الرمز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="text-slate-500 hover:text-navy p-1 rounded hover:bg-slate-100"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-600">
                    {s.balance_due ? s.balance_due.toLocaleString() : 0} DA
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">{s.provided_products || '—'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {s.wilaya || 'Algérie'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-600">{s.phone}</td>
                  <td className="py-2.5 px-4 font-bold text-navy">{s.name}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-500">FRN-{String(s.id).padStart(3, '0')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              {editingSupplier.id ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المورد أو الشركة</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المواد أو الخدمات الموردة</label>
                <input
                  type="text"
                  value={editingSupplier.provided_products || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, provided_products: e.target.value })}
                  placeholder="Ex: Cuir véritable, Semelles caoutchouc, Colle..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.phone}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الولاية / Wilaya</label>
                  <input
                    type="text"
                    value={editingSupplier.wilaya}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, wilaya: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
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
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
