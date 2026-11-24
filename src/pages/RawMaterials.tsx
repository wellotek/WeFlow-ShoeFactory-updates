import React, { useState, useEffect } from 'react'
import type { RawMaterial, Supplier } from '../../shared/types'

export const RawMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Partial<RawMaterial> | null>(null)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [movementMaterial, setMovementMaterial] = useState<RawMaterial | null>(null)
  const [movementData, setMovementData] = useState({
    movement_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 1,
    unit_price: 0,
    reference_document: '',
    notes: ''
  })

  // Notification
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const matList = await window.api.materials.list()
      const supList = await window.api.suppliers.list()
      setMaterials(matList)
      setSuppliers(supList)
    } catch (err: any) {
      console.error('Failed to load raw materials:', err)
      setFeedback({ message: err.message || 'Erreur de chargement', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.supplier_name && m.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory
    const matchesLowStock = !showLowStockOnly || m.stock_quantity <= m.min_threshold
    return matchesSearch && matchesCategory && matchesLowStock
  })

  const lowStockCount = materials.filter((m) => m.stock_quantity <= m.min_threshold).length
  const totalItemsCount = materials.length
  const activeSuppliersCount = new Set(materials.map((m) => m.supplier_name).filter(Boolean)).size

  const handleOpenAdd = () => {
    const nextCode = `MAT-${String(materials.length + 1).padStart(3, '0')}`
    setEditingMaterial({
      code: nextCode,
      designation: '',
      category: 'Cuirs',
      unit: 'm²',
      stock_quantity: 0,
      min_threshold: 50,
      unit_price: 0,
      supplier_name: suppliers[0]?.name || ''
    })
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = (material: RawMaterial) => {
    setEditingMaterial({ ...material })
    setIsAddEditModalOpen(true)
  }

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaterial || !editingMaterial.designation) return
    try {
      if (editingMaterial.id) {
        await window.api.materials.update(editingMaterial.id, editingMaterial)
        setFeedback({ message: 'Matière première mise à jour avec succès', type: 'success' })
      } else {
        await window.api.materials.create(editingMaterial)
        setFeedback({ message: 'Matière première ajoutée avec succès', type: 'success' })
      }
      setIsAddEditModalOpen(false)
      setEditingMaterial(null)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur de sauvegarde', type: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette matière première ?')) return
    try {
      await window.api.materials.delete(id)
      setFeedback({ message: 'Matière supprimée', type: 'success' })
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Impossible de supprimer', type: 'error' })
    }
  }

  const handleOpenMovement = (material: RawMaterial) => {
    setMovementMaterial(material)
    setMovementData({
      movement_type: 'in',
      quantity: 10,
      unit_price: material.unit_price,
      reference_document: '',
      notes: ''
    })
    setIsMovementModalOpen(true)
  }

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movementMaterial) return
    try {
      await window.api.materials.recordMovement({
        material_id: movementMaterial.id,
        movement_type: movementData.movement_type,
        quantity: Number(movementData.quantity),
        reason: movementData.reference_document || movementData.notes
      })
      setFeedback({ message: 'Mouvement de stock enregistré avec succès', type: 'success' })
      setIsMovementModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur lors du mouvement', type: 'error' })
    }
  }

  const handlePrintStockReport = async () => {
    try {
      await window.api.documents.savePdf({
        docType: 'inventory_report',
        id: 0,
        suggestedFilename: `Etat_Stock_Matieres_${new Date().toISOString().slice(0, 10)}.pdf`
      })
    } catch (err: any) {
      alert('Erreur impression: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Feedback */}
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

      {/* KPI Cards Matching Screenshot 04 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">إجمالي المواد / Total Matières</p>
            <h3 className="text-3xl font-bold text-navy mt-1">{totalItemsCount}</h3>
          </div>
          <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center text-navy text-xl font-bold">
            📦
          </div>
        </div>

        <div
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`cursor-pointer rounded-xl p-5 border transition-all flex items-center justify-between ${
            lowStockCount > 0
              ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/70'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <p className="text-sm font-medium text-rose-700">تنبيهات المخزون / Alertes Stock Bas</p>
            <h3 className="text-3xl font-bold text-rose-600 mt-1">{lowStockCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 text-2xl">
            ⚠️
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">الموردون النشطون / Fournisseurs Actifs</p>
            <h3 className="text-3xl font-bold text-navy mt-1">{activeSuppliersCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl font-bold">
            🏭
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium shadow-sm transition"
          >
            <span>+</span>
            <span>إضافة مادة جديدة (Ajouter M.P.)</span>
          </button>
          <button
            onClick={handlePrintStockReport}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            <span>📄</span>
            <span>Rapport Stock (PDF)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث عن مادة / Rechercher matière, code..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-navy"
          >
            <option value="all">كل الفئات (Toutes)</option>
            <option value="Cuirs">الجلود (Cuirs)</option>
            <option value="Semelles">النعال (Semelles)</option>
            <option value="Fils">الخيوط (Fils)</option>
            <option value="Accessoires">الإكسسوارات (Accessoires)</option>
            <option value="Chimiques">المواد الكيميائية (Chimiques)</option>
            <option value="Emballage">التغليف (Emballage)</option>
          </select>
        </div>
      </div>

      {/* Materials Table Matching Screenshot 04 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center">العمليات / Actions</th>
                <th className="py-3.5 px-4 text-center">الحالة / Statut</th>
                <th className="py-3.5 px-4">المورد / Fournisseur</th>
                <th className="py-3.5 px-4 text-center">الحد الأدنى / Seuil</th>
                <th className="py-3.5 px-4 text-center">الكمية / Quantité</th>
                <th className="py-3.5 px-4 text-center">الوحدة / Unité</th>
                <th className="py-3.5 px-4 text-center">سعر الوحدة / P.U.</th>
                <th className="py-3.5 px-4">الفئة / Catégorie</th>
                <th className="py-3.5 px-4">التسمية / Désignation</th>
                <th className="py-3.5 px-4">الرمز / Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    جاري تحميل المواد الأولية...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    لا توجد مواد تطابق البحث.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isLow = mat.stock_quantity <= mat.min_threshold
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenMovement(mat)}
                            title="Mouvement de Stock"
                            className="p-1.5 text-navy hover:bg-navy/10 rounded transition text-xs font-semibold px-2 border border-slate-200"
                          >
                            ± Stock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(mat)}
                            title="Modifier"
                            className="p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(mat.id)}
                            title="Supprimer"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isLow
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isLow ? 'حرج (Critique)' : 'كافٍ (Optimal)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {mat.supplier_name || '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono">
                        {mat.min_threshold}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-navy font-mono">
                        {mat.stock_quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {mat.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-medium font-mono text-slate-700">
                        {mat.unit_price.toLocaleString()} DA
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-medium">
                          {mat.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy">
                        {mat.designation}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {mat.code}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddEditModalOpen && editingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              {editingMaterial.id ? 'تعديل مادة أولية / Modifier Matière' : 'إضافة مادة أولية جديدة / Nouvelle Matière'}
            </h3>
            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الرمز / Code</label>
                  <input
                    type="text"
                    required
                    value={editingMaterial.code}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, code: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الفئة / Catégorie</label>
                  <select
                    value={editingMaterial.category}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                  >
                    <option value="Cuirs">الجلود (Cuirs)</option>
                    <option value="Semelles">النعال (Semelles)</option>
                    <option value="Fils">الخيوط (Fils)</option>
                    <option value="Accessoires">الإكسسوارات (Accessoires)</option>
                    <option value="Chimiques">المواد الكيميائية (Chimiques)</option>
                    <option value="Emballage">التغليف (Emballage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المادة / Désignation</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.designation}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, designation: e.target.value })}
                  placeholder="Ex: Cuir de vachette noir 1.4mm"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الوحدة / Unité</label>
                  <input
                    type="text"
                    required
                    value={editingMaterial.unit}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, unit: e.target.value })}
                    placeholder="m², paires, bobine, kg..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">سعر الوحدة (DA)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingMaterial.unit_price}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, unit_price: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تنبيه الحد الأدنى</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingMaterial.min_threshold}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, min_threshold: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المورد الافتراضي / Fournisseur</label>
                <select
                  value={editingMaterial.supplier_name || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, supplier_name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                >
                  <option value="">بدون مورد محدد</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>
                      {sup.name} ({sup.wilaya || 'Algérie'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  إلغاء / Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm"
                >
                  حفظ / Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {isMovementModalOpen && movementMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <h3 className="text-xl font-bold text-navy mb-1">
              تسجيل حركة مخزون / Mouvement de Stock
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {movementMaterial.code} — {movementMaterial.designation} (Stock actuel: {movementMaterial.stock_quantity} {movementMaterial.unit})
            </p>
            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">نوع الحركة / Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementData({ ...movementData, movement_type: 'in' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      movementData.movement_type === 'in'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + إدخال (Entrée)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementData({ ...movementData, movement_type: 'out' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      movementData.movement_type === 'out'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    - إخراج (Sortie)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementData({ ...movementData, movement_type: 'adjustment' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      movementData.movement_type === 'adjustment'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    تعديل (Ajustement)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الكمية ({movementMaterial.unit})</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={movementData.quantity}
                    onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">سعر الوحدة (DA)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={movementData.unit_price}
                    onChange={(e) => setMovementData({ ...movementData, unit_price: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المرجع (Bon de livraison, Facture...)</label>
                <input
                  type="text"
                  value={movementData.reference_document}
                  onChange={(e) => setMovementData({ ...movementData, reference_document: e.target.value })}
                  placeholder="Ex: BL-2026-904"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات / Remarques</label>
                <input
                  type="text"
                  value={movementData.notes}
                  onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                  placeholder="Ex: Réception commande fournisseur"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  إلغاء / Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm"
                >
                  تأكيد الحركة / Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
