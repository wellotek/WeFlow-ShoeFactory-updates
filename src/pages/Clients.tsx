import React, { useState, useEffect } from 'react'
import type { Client } from '../../shared/types'

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const list = await window.api.clients.list(searchTerm)
      setClients(list)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchTerm])

  const handleOpenAdd = () => {
    setEditingClient({
      name: '',
      company: '',
      phone: '0550 00 00 00',
      wilaya: 'Alger',
      address: '',
      balance_due: 0
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditingClient({ ...client })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient || !editingClient.name) return
    try {
      if (editingClient.id) {
        await window.api.clients.update(editingClient.id, editingClient)
        setFeedback({ message: 'Client mis à jour avec succès', type: 'success' })
      } else {
        await window.api.clients.create(editingClient)
        setFeedback({ message: 'Nouveau client ajouté avec succès', type: 'success' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur', type: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return
    try {
      await window.api.clients.delete(id)
      setFeedback({ message: 'Client supprimé', type: 'success' })
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Impossible de supprimer', type: 'error' })
    }
  }

  const totalBalanceDue = clients.reduce((acc, c) => acc + (c.balance_due || 0), 0)

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

      {/* Top Header & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium text-xs shadow-sm transition flex items-center gap-2"
        >
          <span>+</span>
          <span>إضافة زبون جديد (Nouveau Client)</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-500">إجمالي مستحقات الزبائن (Crédits):</span>
            <span className="block font-mono font-bold text-navy text-sm">
              {totalBalanceDue.toLocaleString()} DA
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الولاية..."
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
            />
            <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">العمليات</th>
                <th className="py-3 px-4 text-center">الرصيد المستحق (DA)</th>
                <th className="py-3 px-4">العنوان</th>
                <th className="py-3 px-4 text-center">الولاية</th>
                <th className="py-3 px-4 text-center">الهاتف</th>
                <th className="py-3 px-4">المؤسسة / الشركة</th>
                <th className="py-3 px-4">اسم الزبون</th>
                <th className="py-3 px-4">الرمز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-slate-500 hover:text-navy p-1 rounded hover:bg-slate-100"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-navy">
                    {c.balance_due ? c.balance_due.toLocaleString() : 0} DA
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{c.address || '—'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {c.wilaya || 'Alger'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-600">{c.phone}</td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">{c.company || '—'}</td>
                  <td className="py-2.5 px-4 font-bold text-navy">{c.name}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-500">CLI-{String(c.id).padStart(3, '0')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              {editingClient.id ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الاسم الكامل للزبون</label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المؤسسة أو المحل التجاري</label>
                <input
                  type="text"
                  value={editingClient.company || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                  placeholder="Ex: Établissement El Bahdja"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    required
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الولاية / Wilaya</label>
                  <input
                    type="text"
                    value={editingClient.wilaya}
                    onChange={(e) => setEditingClient({ ...editingClient, wilaya: e.target.value })}
                    placeholder="Ex: Alger, Oran, Sétif..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
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
