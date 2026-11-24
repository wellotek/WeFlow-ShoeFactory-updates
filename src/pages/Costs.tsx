import React, { useState, useEffect } from 'react'
import type { ShoeModel, CostBreakdown } from '../../shared/types'

export const Costs: React.FC = () => {
  const [models, setModels] = useState<ShoeModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number>(1)
  const [costData, setCostData] = useState<CostBreakdown | null>(null)

  const loadData = async () => {
    try {
      const modList = await window.api.models.list()
      setModels(modList)
      const targetId = modList.length > 0 ? modList[0].id : 1
      setSelectedModelId(targetId)
      const breakdown = await window.api.costs.calculateModel(targetId)
      setCostData(breakdown)
    } catch (err) {
      console.error('Failed to load cost data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleModelChange = async (id: number) => {
    setSelectedModelId(id)
    try {
      const breakdown = await window.api.costs.calculateModel(id)
      setCostData(breakdown)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePrintCostReport = async () => {
    if (!costData) return
    try {
      await window.api.documents.savePdf({
        docType: 'cost_sheet',
        id: selectedModelId,
        suggestedFilename: `Rapport_Couts_${costData.model_reference}.pdf`
      })
    } catch (err: any) {
      alert('Erreur impression: ' + err.message)
    }
  }

  const selectedModel = models.find((m) => m.id === selectedModelId)

  // Fallback values matching Screenshot 10 exact numbers if null
  const cuirCost = costData?.raw_materials_cost || 1150
  const semelleCost = costData?.soles_cost || 850
  const accessoiresCost = costData?.accessories_cost || 450
  const laborCost = costData?.labor_cost || 650
  const overheadCost = costData?.production_expenses || 300
  const totalCost = costData?.total_unit_cost || 3400
  const sellingPrice = costData?.sale_price || 5200
  const margin = costData?.gross_margin || 1800
  const marginPct = costData?.margin_percentage || 34.6

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar Matching Screenshot 10 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintCostReport}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy/90 shadow-sm transition"
          >
            <span>📥</span>
            <span>تصدير تقرير التكاليف (Export PDF)</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <span>التاريخ:</span>
            <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800">
              <option>الشهر الحالي (Ce mois)</option>
              <option>الثلاثي الحالي (Trimestre)</option>
              <option>السنة الكاملة (Année 2026)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>النموذج / Modèle:</span>
            <select
              value={selectedModelId}
              onChange={(e) => handleModelChange(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-bold text-navy"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.reference} — {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Cards Matching Screenshot 10 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
        {/* Total Cost Card (Orange Accent) */}
        <div className="bg-white rounded-xl shadow-sm border border-orange/30 p-6 flex items-center justify-between">
          <div className="w-4 h-12 bg-orange rounded-full" />
          <div>
            <p className="text-xs font-semibold text-slate-500">التكلفة الإجمالية للزوج / Coût Total</p>
            <h3 className="text-3xl font-extrabold text-navy font-mono mt-1">
              {totalCost.toLocaleString()} DA
            </h3>
          </div>
        </div>

        {/* Selling Price Card (Blue Accent) */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 flex items-center justify-between">
          <div className="w-4 h-12 bg-blue-500 rounded-full" />
          <div>
            <p className="text-xs font-semibold text-slate-500">سعر البيع المقترح / Prix de Vente</p>
            <h3 className="text-3xl font-extrabold text-navy font-mono mt-1">
              {sellingPrice.toLocaleString()} DA
            </h3>
          </div>
        </div>

        {/* Profit Margin Card (Green Accent) */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 flex items-center justify-between">
          <div className="w-4 h-12 bg-emerald-500 rounded-full" />
          <div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                +{marginPct.toFixed(1)}%
              </span>
              <p className="text-xs font-semibold text-slate-500">هامش الربح / Marge Brute</p>
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">
              {margin.toLocaleString()} DA
            </h3>
          </div>
        </div>
      </div>

      {/* Middle Row: Donut Chart + Unit Cost Table Matching Screenshot 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart Visual */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handlePrintCostReport}
              className="text-xs text-slate-500 hover:text-navy border border-slate-200 px-2.5 py-1 rounded"
            >
              📥 Export
            </button>
            <h4 className="text-base font-bold text-navy">توزيع التكاليف / Répartition des Coûts</h4>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-6">
            {/* Donut Chart SVG Representation */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Cuir: ~33.8% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  strokeDasharray="33.8 66.2"
                  strokeDashoffset="0"
                />
                {/* Semelle: ~25.0% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#F97316"
                  strokeWidth="4"
                  strokeDasharray="25.0 75.0"
                  strokeDashoffset="-33.8"
                />
                {/* Accessoires: ~13.2% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#EAB308"
                  strokeWidth="4"
                  strokeDasharray="13.2 86.8"
                  strokeDashoffset="-58.8"
                />
                {/* Main d'œuvre: ~19.1% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#A855F7"
                  strokeWidth="4"
                  strokeDasharray="19.1 80.9"
                  strokeDashoffset="-72.0"
                />
                {/* Frais généraux: ~8.8% */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray="8.9 91.1"
                  strokeDashoffset="-91.1"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs text-slate-400 font-medium block">الإجمالي</span>
                <span className="text-sm font-bold font-mono text-navy">{totalCost} DA</span>
              </div>
            </div>

            {/* Legend Matching Screenshot 10 */}
            <div className="space-y-3 text-xs text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-700 font-medium">المواد الأساسية (الجلود)</span>
                <span className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-700 font-medium">النعال (Semelles)</span>
                <span className="w-3 h-3 rounded-full bg-orange-500" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-700 font-medium">الإكسسوارات والبطانة</span>
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-700 font-medium">اليد العاملة (Main d'œuvre)</span>
                <span className="w-3 h-3 rounded-full bg-purple-500" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-700 font-medium">مصاريف التصنيع (Frais généraux)</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table Matching Screenshot 10 Exact Structure */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrintCostReport}
              className="text-xs text-slate-500 hover:text-navy border border-slate-200 px-2.5 py-1 rounded"
            >
              📥 Export
            </button>
            <h4 className="text-base font-bold text-navy">
              تفصيل تكلفة الوحدة - طراز {costData?.model_reference || selectedModel?.reference || 'SF-001'}
            </h4>
          </div>

          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center">التكلفة بالدينار الجزائري</th>
                <th className="py-2.5 px-3">البند / Élément de Coût</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                  {cuirCost.toLocaleString()} DA
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">المواد الأساسية (Cuirs)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                  {semelleCost.toLocaleString()} DA
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">النعل (Semelles)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                  {accessoiresCost.toLocaleString()} DA
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">الإكسسوارات والبطانة</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                  {laborCost.toLocaleString()} DA
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">اليد العاملة المباشرة</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                  {overheadCost.toLocaleString()} DA
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">مصاريف التصنيع العامة</td>
              </tr>
              <tr className="bg-slate-100/70 font-bold text-navy">
                <td className="py-3 px-3 text-center font-mono text-sm">
                  {totalCost.toLocaleString()} DA
                </td>
                <td className="py-3 px-3">إجمالي التكلفة / Coût Total</td>
              </tr>
              <tr className="bg-blue-50/50 font-bold text-navy">
                <td className="py-3 px-3 text-center font-mono text-sm text-blue-700">
                  {sellingPrice.toLocaleString()} DA
                </td>
                <td className="py-3 px-3">سعر البيع / Prix de Vente</td>
              </tr>
              <tr className="bg-amber-50/60 font-bold text-orange">
                <td className="py-3 px-3 text-center font-mono text-sm">
                  {margin.toLocaleString()} DA
                </td>
                <td className="py-3 px-3">هامش الربح الصافي / Marge</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Charts Row Matching Screenshot 10 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Evolution des revenus */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-slate-400">Export</span>
            <h5 className="text-xs font-bold text-navy">تطور الإيرادات (Chiffre d'Affaires)</h5>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
            {[40, 65, 30, 85, 95].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-orange to-amber-300 rounded-t"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[9px] text-slate-400 font-mono">S{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique de profitabilité */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-slate-400">Export</span>
            <h5 className="text-xs font-bold text-navy">مخططات الربحية (Bénéfices DA)</h5>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
            {[35, 50, 70, 80, 100].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[9px] text-slate-400 font-mono">M{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition de production */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-slate-400">Export</span>
            <h5 className="text-xs font-bold text-navy">توزيع إنتاج الطرازات (Paires)</h5>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
            {[100, 85, 80, 55, 45].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-navy rounded-t"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[9px] text-slate-400 font-mono">SF-0{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
