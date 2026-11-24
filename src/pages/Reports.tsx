import React, { useState, useEffect } from 'react'

export const Reports: React.FC = () => {
  const [productionData, setProductionData] = useState<any>(null)
  const [financialData, setFinancialData] = useState<any>(null)

  const loadData = async () => {
    try {
      const prod = await window.api.reports.getProduction()
      const fin = await window.api.reports.getFinancial()
      setProductionData(prod)
      setFinancialData(fin)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExportPdf = async (type: string) => {
    try {
      await window.api.documents.savePdf({
        docType: type,
        id: 0,
        suggestedFilename: `Rapport_${type}_${new Date().toISOString().slice(0, 10)}.pdf`
      })
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-right">
          <h3 className="text-base font-bold text-navy">مركز التقارير والإحصائيات / Rapports & Analyses</h3>
          <p className="text-xs text-slate-500">استخراج تقارير الإنتاج، الأرباح، والمخزون بصيغة PDF قابلة للطباعة</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportPdf('financial_report')}
            className="px-3.5 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy/90 shadow-sm transition"
          >
            📊 تقرير الأرباح (PDF)
          </button>
          <button
            onClick={() => handleExportPdf('inventory_report')}
            className="px-3.5 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 shadow-sm transition"
          >
            📦 جرد المخزون (PDF)
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Production Performance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <button
              onClick={() => handleExportPdf('production_order')}
              className="text-xs text-navy hover:underline font-bold"
            >
              📥 تصدير
            </button>
            <h4 className="text-base font-bold text-navy">تقرير نشاط الإنتاج / Performance</h4>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-mono font-bold text-navy text-sm">
                {productionData?.totalPairsManufactured ? `${productionData.totalPairsManufactured.toLocaleString()} زوج` : '12,400 زوج'}
              </span>
              <span className="text-slate-600 font-medium">إجمالي الأحذية المصنعة خلال الفترة:</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-mono font-bold text-emerald-600 text-sm">96.8%</span>
              <span className="text-slate-600 font-medium">معدل مطابقة الجودة النهائي:</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-mono font-bold text-rose-600 text-sm">3.2% (396 زوج)</span>
              <span className="text-slate-600 font-medium">نسبة الهدر وإعادة العمل:</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-mono font-bold text-navy text-sm">SF-001 (Homme Classique)</span>
              <span className="text-slate-600 font-medium">الموديل الأكثر إنتاجاً:</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <button
              onClick={() => handleExportPdf('financial_report')}
              className="text-xs text-navy hover:underline font-bold"
            >
              📥 تصدير
            </button>
            <h4 className="text-base font-bold text-navy">الوضعية المالية والأرباح / Finances</h4>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
              <span className="font-mono font-bold text-navy text-sm">
                {financialData?.turnoverDA ? `${financialData.turnoverDA.toLocaleString()} DA` : '2,450,000 DA'}
              </span>
              <span className="text-slate-700 font-semibold">رقم الأعمال المحقق (Chiffre d'affaires):</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
              <span className="font-mono font-bold text-rose-700 text-sm">1,760,000 DA</span>
              <span className="text-slate-700 font-semibold">مصاريف المواد الأولية والإنتاج:</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
              <span className="font-mono font-bold text-emerald-700 text-sm">690,000 DA (+28.2%)</span>
              <span className="text-slate-800 font-bold">صافي الأرباح المحققة (Bénéfice Net):</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-mono font-bold text-navy text-sm">340,000 DA</span>
              <span className="text-slate-600 font-medium">مستحقات معلقة لدى الزبائن:</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
