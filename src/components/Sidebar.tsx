import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Layers,
  Boxes,
  FileSpreadsheet,
  Hammer,
  GitCommitHorizontal,
  Package,
  ShoppingCart,
  ShieldCheck,
  Wrench,
  Users,
  Truck,
  CreditCard,
  Send,
  PieChart,
  BarChart3,
  Barcode,
  Settings
} from 'lucide-react'
import logoImg from '../assets/logo.jpg'

interface SidebarProps {
  currentModule: string
  onSelectModule: (module: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, onSelectModule }) => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'models', label: t('nav.models'), icon: Layers },
    { id: 'materials', label: t('nav.materials'), icon: Boxes },
    { id: 'technical_sheets', label: t('nav.technical_sheets'), icon: FileSpreadsheet },
    { id: 'production_orders', label: t('nav.production_orders'), icon: Hammer },
    { id: 'tracking', label: t('nav.tracking'), icon: GitCommitHorizontal },
    { id: 'stocks', label: t('nav.stocks'), icon: Package },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingCart },
    { id: 'quality', label: t('nav.quality'), icon: ShieldCheck },
    { id: 'machines', label: t('nav.machines'), icon: Wrench },
    { id: 'clients', label: t('nav.clients'), icon: Users },
    { id: 'suppliers', label: t('nav.suppliers'), icon: Truck },
    { id: 'purchases', label: t('nav.purchases'), icon: CreditCard },
    { id: 'deliveries', label: t('nav.deliveries'), icon: Send },
    { id: 'costs', label: t('nav.costs'), icon: PieChart },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3 },
    { id: 'labels', label: t('nav.labels'), icon: Barcode },
    { id: 'settings', label: t('nav.settings'), icon: Settings }
  ]

  return (
    <aside className="w-64 bg-[#142B45] text-white flex flex-col h-full border-r border-[#203F60] shadow-xl select-none flex-shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-4 flex flex-col items-center justify-center border-b border-[#203F60]/70 bg-[#142B45]">
        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md border-2 border-[#F28A27]/40 mb-2 bg-[#203F60] flex items-center justify-center">
          <img src={logoImg} alt="WeFlow ShoeFactory" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <div className="font-extrabold text-base tracking-wide text-white">WeFlow ShoeFactory</div>
          <div className="text-[11px] text-[#F28A27] font-semibold tracking-wider uppercase">ERP / MES Manufacture</div>
        </div>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentModule === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#F28A27] text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-[#203F60] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono uppercase font-bold ${isRtl ? 'mr-auto' : 'ml-auto'}`}>
                  {isRtl ? 'نشط' : 'ACTIF'}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#203F60] bg-[#0f2136] text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-300">WeFlow Shoes</span>
          <span className="text-[10px] block text-slate-400">v1.0.0 (Algérie)</span>
        </div>
        <button
          onClick={() => onSelectModule('settings')}
          title="Paramètres"
          className="p-1.5 rounded hover:bg-[#203F60] text-slate-300 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
