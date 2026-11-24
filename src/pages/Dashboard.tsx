import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Package,
  AlertTriangle
} from 'lucide-react'
import type { DashboardStats } from '@shared/types'

interface DashboardProps {
  onNavigate: (module: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await window.api.dashboard.getStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDa = (val?: number) => {
    return new Intl.NumberFormat('fr-DZ').format(val || 0) + ' DA'
  }

  if (isLoading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & KPI row (matching Screenshot 01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">{t('dashboard.total_orders')}</span>
            <div className="text-2xl font-black text-[#142B45] tracking-tight">
              {stats.totalOrders} <span className="text-xs font-medium text-slate-400">طلب</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50">+12%</span>
              <span className="text-slate-400 font-normal">ce mois</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#203F60] flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Active Production */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">{t('dashboard.active_production')}</span>
            <div className="text-2xl font-black text-[#F28A27] tracking-tight">
              {new Intl.NumberFormat('fr-DZ').format(stats.activeProductionPairs)}{' '}
              <span className="text-xs font-medium text-slate-400">زوج</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 font-medium">En atelier de fabrication</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F28A27] flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Shoes Manufactured */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">{t('dashboard.manufactured_shoes')}</span>
            <div className="text-2xl font-black text-[#142B45] tracking-tight">
              {new Intl.NumberFormat('fr-DZ').format(stats.totalShoesManufactured)}{' '}
              <span className="text-xs font-medium text-slate-400">زوج</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Conformes
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">{t('dashboard.stock_health')}</span>
            <div className="text-2xl font-black text-[#142B45] tracking-tight">{stats.stockHealthPercent}%</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-500">
              <AlertTriangle className="w-3 h-3" />
              <span>{stats.stockAlerts} alertes matières</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 flex items-center justify-center text-xs font-black text-[#203F60]">
            {stats.stockHealthPercent}%
          </div>
        </div>
      </div>

      {/* Financial Situation Cards (matching Screenshot 01) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-[#142B45] tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#F28A27]" />
            {t('dashboard.financial_status')}
          </h2>
          <button
            onClick={() => onNavigate('costs')}
            className="text-xs font-bold text-[#F28A27] hover:underline flex items-center gap-1"
          >
            <span>{isRtl ? 'عرض تفاصيل التكاليف' : 'Détails analytiques'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {/* Turnover */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">{t('dashboard.turnover')}</span>
            <div className="text-2xl font-black text-[#142B45] font-mono">{formatDa(stats.turnoverDA)}</div>
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">{t('dashboard.expenses')}</span>
            <div className="text-2xl font-black text-slate-700 font-mono">{formatDa(stats.expensesDA)}</div>
          </div>

          {/* Profit */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 block mb-1">{t('dashboard.profit')}</span>
            <div className="text-2xl font-black text-emerald-700 font-mono">+{formatDa(stats.profitDA)}</div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Recent Production Orders & Production Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Production Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[#142B45]">{t('dashboard.recent_orders')}</h3>
            <button
              onClick={() => onNavigate('production_orders')}
              className="text-xs font-bold text-[#F28A27] hover:underline"
            >
              {t('common.all')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className={`py-2 px-3 ${isRtl ? 'text-right' : 'text-left'}`}>N° Ordre</th>
                  <th className={`py-2 px-3 ${isRtl ? 'text-right' : 'text-left'}`}>Modèle</th>
                  <th className="py-2 px-3 text-center">Ligne</th>
                  <th className="py-2 px-3 text-center">Quantité</th>
                  <th className="py-2 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#142B45]">{ord.order_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{ord.model_name}</td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">{ord.line || 'Ligne 1'}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{ord.quantity} paires</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === 'Terminé' || ord.status === 'مكتمل'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ord.status === 'En cours' || ord.status === 'قيد التنفيذ'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Factory Stats & Shortcut Cards (1 col) */}
        <div className="space-y-4">
          <div className="bg-[#142B45] text-white p-5 rounded-2xl shadow-md">
            <h4 className="text-xs font-bold text-[#F28A27] uppercase tracking-wider mb-2">Atelier & Équipements</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Machines Opérationnelles</span>
                <span className="font-bold text-emerald-400">{stats.activeMachines} actives</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Fournisseurs Actifs</span>
                <span className="font-bold text-white">{stats.activeSuppliers} usines</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Modèles en Catalogue</span>
                <span className="font-bold text-white">{stats.totalModels} modèles</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('production_orders')}
              className="mt-5 w-full py-2 bg-[#F28A27] hover:bg-[#e07a16] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              + Nouvel Ordre de Fabrication
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Raccourcis Fréquents</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('technical_sheets')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-center font-bold text-slate-700 transition-colors"
              >
                Fiches BOM
              </button>
              <button
                onClick={() => onNavigate('stocks')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-center font-bold text-slate-700 transition-colors"
              >
                Stocks MP
              </button>
              <button
                onClick={() => onNavigate('costs')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-center font-bold text-slate-700 transition-colors"
              >
                Coûts Revient
              </button>
              <button
                onClick={() => onNavigate('labels')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-center font-bold text-slate-700 transition-colors"
              >
                Étiquettes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
