import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Bell, Globe, User, ShieldCheck } from 'lucide-react'
import { applyDocumentDirection } from '../i18n/direction'

interface HeaderProps {
  currentModuleTitle: string
  unreadAlertsCount?: number
  onNavigate: (module: string) => void
}

export const Header: React.FC<HeaderProps> = ({ currentModuleTitle, unreadAlertsCount = 0, onNavigate }) => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const [currentDateStr, setCurrentDateStr] = useState('')

  useEffect(() => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    const locale = isRtl ? 'ar-DZ' : 'fr-DZ'
    setCurrentDateStr(now.toLocaleDateString(locale, options))
  }, [isRtl])

  const toggleLanguage = () => {
    const nextLang = isRtl ? 'fr' : 'ar'
    i18n.changeLanguage(nextLang)
    applyDocumentDirection(nextLang)
    localStorage.setItem('i18nextLng', nextLang)
    window.api.settings.updateAppSettings({ language: nextLang }).catch(() => {})
  }

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shadow-xs select-none flex-shrink-0 z-10">
      {/* Title & Date */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-[#142B45] leading-tight">{currentModuleTitle}</h1>
          <p className="text-xs text-slate-500 font-medium capitalize">{currentDateStr}</p>
        </div>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={t('common.search')}
            className={`w-full bg-[#F4F6F8] border border-slate-200 rounded-lg py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F28A27] focus:bg-white transition-all ${
              isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
            }`}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title="Changer de langue / تغيير اللغة"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#142B45] transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-[#F28A27]" />
          <span>{isRtl ? 'Français' : 'العربية'}</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => onNavigate('quality')}
          className="relative p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-[#142B45] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* License Pill */}
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
          title="Licence active"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isRtl ? 'ترخيص مفعل' : 'Licence Active'}</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#142B45] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs leading-tight hidden md:block">
            <div className="font-bold text-[#142B45]">{isRtl ? 'أحمد بن علي' : 'Ahmed Benali'}</div>
            <div className="text-[10px] text-slate-500">{isRtl ? 'مدير الإنتاج' : 'Directeur Production'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
