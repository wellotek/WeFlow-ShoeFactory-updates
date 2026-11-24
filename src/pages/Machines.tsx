import React, { useState, useEffect } from 'react'
import type { Machine, MachineMaintenance } from '../../shared/types'

export const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([])
  const [maintenances, setMaintenances] = useState<MachineMaintenance[]>([])

  // Maintenance Modal
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: 'Préventive' as 'Préventive' | 'Corrective',
    description: 'Vidange huile hydraulique et affûtage des lames',
    technician_name: 'Mourad Maintenance',
    cost: 15000,
    intervention_date: new Date().toISOString().slice(0, 10),
    status: 'Effectuée' as 'Planifiée' | 'Effectuée'
  })

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    try {
      const machList = await window.api.machines.list()
      const maintList = await window.api.machines.listMaintenance()
      setMachines(machList)
      setMaintenances(maintList)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMachine) return
    try {
      await window.api.machines.createMaintenance({
        machine_id: selectedMachine.id,
        maintenance_type: maintenanceForm.maintenance_type,
        description: maintenanceForm.description,
        technician_name: maintenanceForm.technician_name,
        cost: Number(maintenanceForm.cost),
        intervention_date: maintenanceForm.intervention_date,
        status: maintenanceForm.status
      })
      setFeedback({ message: 'Intervention de maintenance enregistrée avec succès !', type: 'success' })
      setIsMaintenanceModalOpen(false)
      loadData()
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur enregistrement', type: 'error' })
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

      {/* Top Fleet Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="text-right">
          <h3 className="text-base font-bold text-navy">الآلات والمعدات الصناعية / Parc Machines</h3>
          <p className="text-xs text-slate-500">مراقبة وصيانة أسطول آلات تصنيع الأحذية</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (machines.length > 0) {
                setSelectedMachine(machines[0])
                setIsMaintenanceModalOpen(true)
              }
            }}
            className="px-4 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 shadow-sm transition"
          >
            + تسجيل صيانة جديدة
          </button>
        </div>
      </div>

      {/* Machine Fleet Cards Matching Screenshot 08 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {machines.map((mach) => {
          const isOperational = mach.status === 'Active'
          const isMaintenance = mach.status === 'Maintenance'
          return (
            <div
              key={mach.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between text-right hover:border-navy transition"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isOperational
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMaintenance
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isOperational ? 'جاهزة للعمل' : isMaintenance ? 'في الصيانة' : 'متوقفة'}
                  </span>
                  <span className="font-mono font-bold text-navy text-sm">{mach.code}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 mb-1">{mach.name}</h4>
                <p className="text-xs text-slate-500 font-mono mb-4">{mach.machine_type || 'Presse hydraulique'}</p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-mono font-bold text-navy">{mach.location || 'Atelier A'}</span>
                    <span className="text-slate-400">الموقع في الورشة:</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono font-bold text-orange">{mach.next_maintenance_date || '2026-02-10'}</span>
                    <span className="text-slate-400">الصيانة القادمة:</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedMachine(mach)
                    setIsMaintenanceModalOpen(true)
                  }}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  🛠️ جدولة صيانة
                </button>
                <span className="text-[11px] text-slate-400">الورشة الرئيسية</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Maintenance History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-right">
          <span className="text-xs font-mono font-semibold text-slate-500">
            {maintenances.length} تدخلات مسجلة
          </span>
          <h4 className="text-sm font-bold text-navy">
            سجل التدخلات والصيانة الدورية / Historique Maintenance
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">التكلفة (DA)</th>
                <th className="py-3 px-4">الفني / التقني</th>
                <th className="py-3 px-4">طبيعة التدخل / Description</th>
                <th className="py-3 px-4 text-center">النوع</th>
                <th className="py-3 px-4 text-center">التاريخ</th>
                <th className="py-3 px-4">الآلة / Machine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenances.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {m.status || 'منجز'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-navy">
                    {m.cost.toLocaleString()} DA
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-700">
                    👨‍🔧 {m.technician_name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-medium">
                    {m.description}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        m.maintenance_type === 'Préventive'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {m.maintenance_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                    {m.intervention_date}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-navy">
                    {m.machine_name || `Machine #${m.machine_id}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-1">تسجيل عملية صيانة للآلة</h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedMachine.code} — {selectedMachine.name}
            </p>
            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">نوع الصيانة</label>
                  <select
                    value={maintenanceForm.maintenance_type}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value as any })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy bg-white"
                  >
                    <option value="Préventive">وقائية (Préventive)</option>
                    <option value="Corrective">علاجية / طارئة (Corrective)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.intervention_date}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, intervention_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">طبيعة التدخل والإصلاحات</label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الفني المسؤول</label>
                  <input
                    type="text"
                    required
                    value={maintenanceForm.technician_name}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technician_name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">التكلفة الإجمالية (DA)</label>
                  <input
                    type="number"
                    min="0"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-xs font-bold shadow-sm"
                >
                  تأكيد وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
