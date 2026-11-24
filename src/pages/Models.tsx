import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Eye, Trash2, X, Image as ImageIcon } from 'lucide-react'
import type { ShoeModel } from '@shared/types'

export const Models: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [models, setModels] = useState<ShoeModel[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous')
  const [selectedGender, setSelectedGender] = useState<string>('Tous')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ShoeModel | null>(null)
  const [detailModel, setDetailModel] = useState<ShoeModel | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    category: 'Classique',
    gender: 'Homme',
    season: 'Automne-Hiver',
    collection: '2024-2025',
    description: '',
    status: 'Actif'
  })

  useEffect(() => {
    loadModels()
  }, [selectedCategory, selectedGender, searchTerm])

  const loadModels = async () => {
    try {
      const data = await window.api.models.list({
        category: selectedCategory === 'Tous' ? undefined : selectedCategory,
        gender: selectedGender === 'Tous' ? undefined : selectedGender,
        search: searchTerm || undefined
      })
      setModels(data)
    } catch (err) {
      console.error('Error loading models:', err)
    }
  }

  const handleOpenAdd = () => {
    setEditingModel(null)
    setFormData({
      reference: `SF-${String(models.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'Classique',
      gender: 'Homme',
      season: 'Automne-Hiver',
      collection: '2024-2025',
      description: '',
      status: 'Actif'
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (m: ShoeModel) => {
    setEditingModel(m)
    setFormData({
      reference: m.reference,
      name: m.name,
      category: m.category,
      gender: m.gender,
      season: m.season || '',
      collection: m.collection || '',
      description: m.description || '',
      status: m.status
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingModel) {
        await window.api.models.update(editingModel.id, formData as any)
      } else {
        await window.api.models.create(formData as any)
      }
      setIsModalOpen(false)
      loadModels()
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm(isRtl ? 'هل أنت متأكد من حذف هذا الموديل؟' : 'Supprimer définitivement ce modèle ?')) {
      try {
        await window.api.models.delete(id)
        loadModels()
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la suppression')
      }
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-[#142B45] tracking-tight">{t('models.title')}</h2>
          <p className="text-xs text-slate-500">{t('models.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'بحث عن موديل...' : 'Rechercher un modèle...'}
            className="px-3 py-2 bg-[#F4F6F8] border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#F28A27]"
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#F4F6F8] border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#F28A27]"
          >
            <option value="Tous">{isRtl ? 'الفئة / Catégorie' : 'Toutes Catégories'}</option>
            <option value="Classique">Chaussures Classiques</option>
            <option value="Sport">Chaussures de Sport</option>
            <option value="Professionnelle">Professionnelles</option>
            <option value="Sécurité">Sécurité</option>
            <option value="Enfant">Enfants</option>
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-2 bg-[#F4F6F8] border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#F28A27]"
          >
            <option value="Tous">{isRtl ? 'النوع / Genre' : 'Tous Genres'}</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
            <option value="Enfant">Enfant</option>
            <option value="Unisexe">Unisexe</option>
          </select>

          {/* Add Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F28A27] hover:bg-[#e07a16] text-white text-xs font-bold rounded-xl shadow-md transition-all ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('models.add_model')}</span>
          </button>
        </div>
      </div>

      {/* Models Grid (matching Screenshot 02) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {models.map((m) => {
          const sizesList = m.variants ? Array.from(new Set(m.variants.map((v) => v.size))).sort((a, b) => a - b) : []
          const colorsList = m.variants ? Array.from(new Set(m.variants.map((v) => v.color))) : ['Noir']
          const sizeRangeStr = sizesList.length > 0 ? `${m.gender} ${sizesList[0]}-${sizesList[sizesList.length - 1]}` : `${m.gender} 39-44`

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 flex gap-5">
                {/* Product Image Placeholder or Thumbnail */}
                <div className="w-36 h-36 bg-[#F4F6F8] rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 relative group">
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-mono font-bold">{m.reference}</span>
                  </div>
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {m.reference}
                      </span>
                      <h3 className="text-base font-extrabold text-[#142B45] mt-1 truncate">{m.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{m.category}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-500">المقاسات: </span>
                      <span className="font-bold text-[#142B45]">{sizeRangeStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-500">الألوان: </span>
                      {colorsList.map((col) => (
                        <span key={col} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar (matching Screenshot 02: تعديل / تفاصيل) */}
              <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-2.5 flex items-center justify-end gap-3 text-xs">
                <button
                  onClick={() => setDetailModel(m)}
                  className="flex items-center gap-1 font-bold text-slate-600 hover:text-[#142B45] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('common.details')}</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="flex items-center gap-1 font-bold text-[#F28A27] hover:underline transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('common.edit')}</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#142B45] p-4 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">{editingModel ? 'Modifier le modèle' : t('models.add_model')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('common.reference')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-[#F28A27]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('models.model_name')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#F28A27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('models.category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#F28A27]"
                  >
                    <option value="Classique">Classique</option>
                    <option value="Sport">Sport</option>
                    <option value="Professionnelle">Professionnelle</option>
                    <option value="Sécurité">Sécurité</option>
                    <option value="Enfant">Enfant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('models.gender')}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#F28A27]"
                  >
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Enfant">Enfant</option>
                    <option value="Unisexe">Unisexe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('models.collection')}</label>
                  <input
                    type="text"
                    value={formData.collection}
                    onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('models.season')}</label>
                  <input
                    type="text"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('common.notes')}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F28A27] text-white rounded-lg font-bold hover:bg-[#e07a16]"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {detailModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#142B45] p-4 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold bg-[#F28A27] px-2 py-0.5 rounded text-white mr-2">
                  {detailModel.reference}
                </span>
                <span className="font-bold">{detailModel.name}</span>
              </div>
              <button onClick={() => setDetailModel(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div><strong>Catégorie :</strong> {detailModel.category}</div>
                <div><strong>Genre :</strong> {detailModel.gender}</div>
                <div><strong>Collection :</strong> {detailModel.collection || 'Standard'}</div>
                <div><strong>Saison :</strong> {detailModel.season || '-'}</div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 mb-2">Variantes et Stocks Disponibles :</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-center">
                    <thead className="bg-[#203F60] text-white font-bold">
                      <tr>
                        <th className="py-2">Couleur</th>
                        <th className="py-2">Pointure</th>
                        <th className="py-2">Stock Fini</th>
                        <th className="py-2">Code SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailModel.variants?.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="py-2 font-medium">{v.color}</td>
                          <td className="py-2 font-bold text-[#F28A27]">{v.size}</td>
                          <td className="py-2 font-bold text-slate-800">{v.stock_finished} paires</td>
                          <td className="py-2 font-mono text-[10px] text-slate-500">{v.sku || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDetailModel(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
