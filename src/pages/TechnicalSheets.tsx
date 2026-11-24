import React, { useState, useEffect } from 'react'
import type { TechnicalSheet, ShoeModel, RawMaterial } from '../../shared/types'

export const TechnicalSheets: React.FC = () => {
  const [sheets, setSheets] = useState<TechnicalSheet[]>([])
  const [models, setModels] = useState<ShoeModel[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null)

  // Feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<any>({
    model_id: 0,
    main_color: 'Noir',
    available_sizes: [39, 40, 41, 42, 43, 44],
    labor_cost_per_pair: 650,
    overhead_cost_per_pair: 300,
    target_sale_price: 5200,
    notes: 'Couture renforcée double piqûre. Semelle thermo-collée sous presse 4 bars.',
    items: []
  })

  const loadData = async () => {
    try {
      const sheetList = await window.api.technicalSheets.list()
      const modelList = await window.api.models.list()
      const matList = await window.api.materials.list()

      setSheets(sheetList)
      setModels(modelList)
      setMaterials(matList)

      if (sheetList.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sheetList[0].id)
      }
    } catch (err: any) {
      console.error('Failed to load technical sheets:', err)
      setFeedback({ message: err.message || 'Erreur chargement', type: 'error' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentSheet = sheets.find((s) => s.id === selectedSheetId) || sheets[0] || null
  const currentModel = currentSheet ? models.find((m) => m.id === currentSheet.model_id) : null

  const handleDuplicate = async (id: number) => {
    try {
      const copy = await window.api.technicalSheets.duplicate(id)
      setFeedback({ message: 'Fiche dupliquée avec succès', type: 'success' })
      await loadData()
      setSelectedSheetId(copy.id)
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur duplication', type: 'error' })
    }
  }

  const handlePrintPdf = async (id: number) => {
    try {
      await window.api.documents.savePdf({
        docType: 'fiche_technique',
        id,
        suggestedFilename: `Fiche_Technique_${currentSheet?.model_reference || 'SF'}.pdf`
      })
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleOpenCreate = () => {
    if (models.length === 0) {
      alert('Veuillez d’abord créer au moins un modèle.')
      return
    }
    setFormData({
      model_id: models[0].id,
      main_color: 'Noir',
      available_sizes: [39, 40, 41, 42, 43, 44],
      labor_cost_per_pair: 650,
      overhead_cost_per_pair: 300,
      target_sale_price: 5200,
      notes: 'Couture renforcée double piqûre. Semelle thermo-collée sous presse 4 bars.',
      items: materials.slice(0, 4).map((m) => ({
        material_id: m.id,
        material_name: m.designation,
        material_code: m.code,
        unit: m.unit,
        base_quantity: m.category === 'Cuirs' ? 0.45 : m.category === 'Semelles' ? 1.0 : 0.15,
        scrap_percentage: m.category === 'Cuirs' ? 5 : 0
      }))
    })
    setIsModalOpen(true)
  }

  const handleAddItemToForm = () => {
    if (materials.length === 0) return
    const firstMat = materials[0]
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          material_id: firstMat.id,
          material_name: firstMat.designation,
          material_code: firstMat.code,
          unit: firstMat.unit,
          base_quantity: 1,
          scrap_percentage: 0
        }
      ]
    })
  }

  const handleRemoveItem = (index: number) => {
    const nextItems = [...formData.items]
    nextItems.splice(index, 1)
    setFormData({ ...formData, items: nextItems })
  }

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await window.api.technicalSheets.create(formData)
      setFeedback({ message: 'Fiche technique créée avec succès !', type: 'success' })
      setIsModalOpen(false)
      await loadData()
      setSelectedSheetId(created.id)
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur de sauvegarde', type: 'error' })
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

      {/* Top Selector Bar Matching Screenshot 03 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">البطاقة التقنية / Fiche Technique:</span>
          <select
            value={selectedSheetId || ''}
            onChange={(e) => setSelectedSheetId(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-semibold text-navy focus:outline-none focus:border-navy"
          >
            {sheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.model_reference} — {s.model_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 text-sm font-medium shadow-sm transition"
          >
            + بطاقة جديدة (Nouvelle Fiche)
          </button>
          {currentSheet && (
            <>
              <button
                onClick={() => handleDuplicate(currentSheet.id)}
                className="px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition"
              >
                نسخ (Dupliquer)
              </button>
              <button
                onClick={() => handlePrintPdf(currentSheet.id)}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium shadow-sm transition flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>طباعة / PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {currentSheet ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: BOM & Size Matrix (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consommation des matières premières Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-navy text-base">
                  جدول استهلاك المواد الأولية / Tableau de consommation des matières premières
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-navy/10 text-navy rounded-full">
                  Par paire (لكل زوج)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-center">الهدر المسموح / % Perte</th>
                      <th className="py-3 px-4 text-center">الكمية المقدرة / Qté Estimée</th>
                      <th className="py-3 px-4 text-center">الوحدة / Unité</th>
                      <th className="py-3 px-4">المادة / Matière</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSheet.items && currentSheet.items.length > 0 ? (
                      currentSheet.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 text-center font-mono text-rose-600 font-semibold">
                            {item.scrap_percentage || 0}%
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-navy">
                            {item.base_quantity}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {item.unit}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {item.material_name || `Matière #${item.material_id}`}
                            <span className="text-xs text-slate-400 block font-normal font-mono">
                              {item.material_code}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          لا توجد مواد أولية مسجلة لهذه البطاقة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grille des Tailles Disponibles Matching Screenshot 03 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h4 className="text-sm font-bold text-navy mb-3">
                توزيع المقاسات المتوفرة / Grille des tailles disponibles
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      <th className="p-2 border border-slate-200 font-mono">39</th>
                      <th className="p-2 border border-slate-200 font-mono">40</th>
                      <th className="p-2 border border-slate-200 font-mono">41</th>
                      <th className="p-2 border border-slate-200 font-mono">42</th>
                      <th className="p-2 border border-slate-200 font-mono">43</th>
                      <th className="p-2 border border-slate-200 font-mono">44</th>
                      <th className="p-2 border border-slate-200 font-mono">45</th>
                      <th className="p-2 border border-slate-200 font-mono">46</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-navy font-semibold">
                      <td className="p-2 border border-slate-200 font-mono">10</td>
                      <td className="p-2 border border-slate-200 font-mono">25</td>
                      <td className="p-2 border border-slate-200 font-mono">30</td>
                      <td className="p-2 border border-slate-200 font-mono">35</td>
                      <td className="p-2 border border-slate-200 font-mono">35</td>
                      <td className="p-2 border border-slate-200 font-mono">20</td>
                      <td className="p-2 border border-slate-200 font-mono">15</td>
                      <td className="p-2 border border-slate-200 font-mono">5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes techniques & Spécifications */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h4 className="text-sm font-bold text-navy mb-2">
                المكونات والملاحظات التقنية / Notes techniques
              </h4>
              <div className="bg-slate-50 rounded-lg p-4 text-xs leading-relaxed text-slate-700 space-y-2 border border-slate-200">
                <p>
                  <strong>الجزء العلوي (Tige) :</strong> جلد العجل الأسود الطبيعي 1.4 ملم، تشطيب شبه لامع.
                </p>
                <p>
                  <strong>النعل الداخلي (Première) :</strong> جلد طبيعي مبطن برغوة ميموري فوم 4 ملم لراحة القدم.
                </p>
                <p>
                  <strong>تعليمات التجميع :</strong> يجب التأكد من شد الخياطة المزدوجة على الأطراف. خيوط نايلون مشمعة مقاومة للرطوبة.
                </p>
                <p>
                  <strong>تعليمات اللصق والتركيب :</strong> استخدام الغراء الحراري المناسب للنعل الطبيعي بدرجة حرارة 80°م مع ضغط متوازن 4 بار لمدة 15 ثانية.
                </p>
                {currentSheet.notes && (
                  <p className="mt-2 pt-2 border-t border-slate-200 text-navy font-medium">
                    {currentSheet.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Model Card Matching Screenshot 03 (1 column) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <h4 className="text-sm font-bold text-slate-500 mb-4">
                صورة الموديل / {currentSheet.model_reference}
              </h4>
              <div className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 mb-6">
                {currentModel?.photo_url ? (
                  <img
                    src={currentModel.photo_url}
                    alt={currentSheet.model_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">👞</span>
                )}
              </div>

              <div className="space-y-3 text-right text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-navy">{currentSheet.model_reference}</span>
                  <span className="text-slate-500">رمز الموديل / Référence:</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-navy">{currentModel?.category || 'Classique Homme'}</span>
                  <span className="text-slate-500">النوع / Catégorie:</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-navy">{currentSheet.main_color || 'Noir'}</span>
                  <span className="text-slate-500">اللون / Couleur:</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-navy">{currentModel?.collection || 'Automne-Hiver'}</span>
                  <span className="text-slate-500">المجموعة / Collection:</span>
                </div>
              </div>

              {/* Cost summary card */}
              <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200 text-right space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="font-mono font-bold text-navy">{currentSheet.labor_cost_per_pair} DA</span>
                  <span>اليد العاملة / Main d'œuvre:</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="font-mono font-bold text-navy">{currentSheet.overhead_cost_per_pair} DA</span>
                  <span>مصاريف التصنيع / Frais:</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-orange pt-2 border-t border-slate-200">
                  <span className="font-mono">{currentSheet.target_sale_price} DA</span>
                  <span>سعر البيع المستهدف:</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          لا توجد بطاقات تقنية بعد. انقر على "+ بطاقة جديدة" لإضافة أول بطاقة.
        </div>
      )}

      {/* New Technical Sheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-navy mb-4 border-b pb-2">
              إنشاء بطاقة تقنية جديدة / Nouvelle Fiche Technique
            </h3>
            <form onSubmit={handleSaveSheet} className="space-y-4">
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
                    value={formData.main_color}
                    onChange={(e) => setFormData({ ...formData, main_color: e.target.value })}
                    placeholder="Ex: Noir, Marron, Blanc..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">اليد العاملة (DA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.labor_cost_per_pair}
                    onChange={(e) => setFormData({ ...formData, labor_cost_per_pair: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المصاريف العامة (DA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.overhead_cost_per_pair}
                    onChange={(e) => setFormData({ ...formData, overhead_cost_per_pair: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">سعر البيع المقترح (DA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.target_sale_price}
                    onChange={(e) => setFormData({ ...formData, target_sale_price: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex justify-between items-center mb-3">
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="text-xs px-2.5 py-1 bg-navy text-white rounded-md hover:bg-navy/90 font-medium"
                  >
                    + إضافة مادة للبطاقة
                  </button>
                  <h4 className="text-xs font-bold text-slate-700">المواد المطلوبة للزوج الواحد (BOM)</h4>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <select
                        value={item.material_id}
                        onChange={(e) => {
                          const chosenMat = materials.find((m) => m.id === Number(e.target.value))
                          const nextItems = [...formData.items]
                          nextItems[idx] = {
                            ...nextItems[idx],
                            material_id: chosenMat?.id,
                            material_name: chosenMat?.designation,
                            material_code: chosenMat?.code,
                            unit: chosenMat?.unit
                          }
                          setFormData({ ...formData, items: nextItems })
                        }}
                        className="flex-1 border border-slate-200 rounded p-1.5 bg-white"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} - {m.designation} ({m.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.base_quantity}
                        onChange={(e) => {
                          const nextItems = [...formData.items]
                          nextItems[idx].base_quantity = Number(e.target.value)
                          setFormData({ ...formData, items: nextItems })
                        }}
                        placeholder="Qté"
                        className="w-20 border border-slate-200 rounded p-1.5 font-mono text-center"
                      />

                      <span className="w-12 text-slate-500 text-center">{item.unit || 'u'}</span>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">هدر %</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={item.scrap_percentage}
                          onChange={(e) => {
                            const nextItems = [...formData.items]
                            nextItems[idx].scrap_percentage = Number(e.target.value)
                            setFormData({ ...formData, items: nextItems })
                          }}
                          className="w-14 border border-slate-200 rounded p-1.5 font-mono text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات تقنية / Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  حفظ البطاقة / Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
