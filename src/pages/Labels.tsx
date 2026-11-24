import React, { useState, useEffect } from 'react'
import type { ShoeModel } from '../../shared/types'

export const Labels: React.FC = () => {
  const [models, setModels] = useState<ShoeModel[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<'shoe_box' | 'shipping_carton' | 'qr_batch'>('shoe_box')
  const [selectedModelId, setSelectedModelId] = useState<number>(1)
  const [color, setColor] = useState('Noir')
  const [size, setSize] = useState(42)
  const [copies, setCopies] = useState(1)
  const [price, setPrice] = useState(5200)
  const [sku, setSku] = useState('SF-001-NOIR-42')

  useEffect(() => {
    window.api.models.list().then((list) => {
      setModels(list)
      if (list.length > 0) setSelectedModelId(list[0].id)
    })
  }, [])

  const selectedModel = models.find((m) => m.id === selectedModelId)

  const handlePrint = async () => {
    try {
      await window.api.documents.print({
        docType: selectedTemplate === 'shoe_box' ? 'label_shoe_box' : selectedTemplate === 'shipping_carton' ? 'label_carton' : 'label_qr_batch',
        id: selectedModelId,
        format: selectedTemplate === 'shoe_box' ? '100x50mm' : selectedTemplate === 'shipping_carton' ? '100x75mm' : '70x40mm'
      })
    } catch (err: any) {
      alert('Erreur impression étiquette: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-right">
          <h3 className="text-base font-bold text-navy">استوديو طباعة الملصقات والباركود / Studio Étiquettes</h3>
          <p className="text-xs text-slate-500">طباعة ملصقات علب الأحذية، كراتين الشحن، والباركود الحراري</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange/90 shadow-sm transition flex items-center gap-2"
        >
          <span>🏷️</span>
          <span>طباعة الملصقات الآن (Imprimer)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-right">
          <h4 className="text-sm font-bold text-navy mb-2 border-b pb-2">إعدادات الملصق / Configuration</h4>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">نموذج الملصق / Modèle d'étiquette</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as any)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
            >
              <option value="shoe_box">ملصق علبة الحذاء (100x50 مم) - Boîte</option>
              <option value="shipping_carton">ملصق كرتونة الشحن (100x75 مم) - Carton</option>
              <option value="qr_batch">ملصق رمز QR الدفعة (70x40 مم) - Traçabilité</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الموديل / Chaussure</label>
            <select
              value={selectedModelId}
              onChange={(e) => {
                const id = Number(e.target.value)
                setSelectedModelId(id)
                const m = models.find((mod) => mod.id === id)
                if (m) setSku(`${m.reference}-${color.toUpperCase()}-${size}`)
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.reference} — {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">اللون / Couleur</label>
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value)
                  setSku(`${selectedModel?.reference || 'SF'}-${e.target.value.toUpperCase()}-${size}`)
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المقاس / Pointure</label>
              <input
                type="number"
                min="20"
                max="50"
                value={size}
                onChange={(e) => {
                  const s = Number(e.target.value)
                  setSize(s)
                  setSku(`${selectedModel?.reference || 'SF'}-${color.toUpperCase()}-${s}`)
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">السعر المعروض (DA)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">عدد النسخ / Copies</label>
              <input
                type="number"
                min="1"
                max="500"
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الباركود SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
            />
          </div>
        </div>

        {/* Live Label Preview (2 columns) */}
        <div className="lg:col-span-2 bg-slate-100 rounded-xl p-8 border border-slate-200 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-500 mb-4">
            معاينة الملصق المباشرة (Aperçu direct 100x50 mm)
          </span>

          {/* Render Physical Label Style */}
          <div className="w-[420px] bg-white rounded-lg p-5 shadow-lg border border-slate-300 text-slate-800 space-y-3 font-sans">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-[10px] font-bold text-navy uppercase tracking-widest font-mono">
                WeFlow ShoeFactory
              </span>
              <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
                MADE IN ALGERIA 🇩🇿
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-slate-400 font-mono block">MODÈLE</span>
                <strong className="text-base font-extrabold text-navy block">
                  {selectedModel?.name || 'Homme Classique'}
                </strong>
                <span className="text-xs text-slate-600 font-medium">
                  {selectedModel?.reference || 'SF-001'} | {color}
                </span>
              </div>

              <div className="text-center bg-slate-50 border border-slate-200 rounded p-2 min-w-[70px]">
                <span className="text-[9px] text-slate-400 block font-bold">POINTURE</span>
                <span className="text-3xl font-black font-mono text-orange">{size}</span>
              </div>
            </div>

            {/* Barcode visual */}
            <div className="text-center pt-2">
              <div className="h-12 w-full flex items-center justify-center gap-[3px] bg-white px-2">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 4, 1, 2, 3].map((w, idx) => (
                  <div key={idx} className="bg-black h-10" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-widest block font-bold text-slate-700 mt-1">
                {sku}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t text-xs">
              <span className="font-bold font-mono text-navy">{price.toLocaleString()} DA</span>
              <span className="text-[10px] text-slate-500 font-medium">صنع بالجزائر — جودة ممتازة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
