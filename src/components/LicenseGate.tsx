import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, ShieldAlert, CheckCircle2, Loader2, Globe } from 'lucide-react'
import logoImg from '../assets/logo.jpg'
import { applyDocumentDirection } from '../i18n/direction'

interface LicenseGateProps {
  onActivated: () => void
}

export const LicenseGate: React.FC<LicenseGateProps> = ({ onActivated }) => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [licenseId, setLicenseId] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!licenseId.trim() || !activationCode.trim()) {
      setErrorMessage(isRtl ? 'يرجى إدخال معرف الترخيص ورمز التفعيل' : 'Veuillez saisir le License ID et le code d’activation')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const res = await window.api.license.activate(licenseId, activationCode)
      if (res.status === 'active' || res.status === 'grace') {
        setSuccessMessage(t('license.status_active'))
        setTimeout(() => {
          onActivated()
        }, 1200)
      } else if (res.status === 'blocked' || res.status === 'expired') {
        setErrorMessage(t(res.messageKey) || res.messageKey)
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('license.errors.invalid'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLanguage = () => {
    const nextLang = isRtl ? 'fr' : 'ar'
    i18n.changeLanguage(nextLang)
    applyDocumentDirection(nextLang)
    localStorage.setItem('i18nextLng', nextLang)
  }

  return (
    <div className="min-h-screen w-screen bg-[#142B45] flex flex-col justify-center items-center p-4 relative font-sans">
      {/* Top Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#203F60] text-white text-xs font-semibold hover:bg-[#F28A27] transition-all shadow-md"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isRtl ? 'Français' : 'العربية'}</span>
        </button>
      </div>

      {/* Main Activation Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Brand Banner */}
        <div className="bg-[#203F60] p-6 text-center text-white relative">
          <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden shadow-lg border-2 border-[#F28A27] mb-3 bg-white flex items-center justify-center">
            <img src={logoImg} alt="WeFlow ShoeFactory" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-extrabold tracking-wide">WeFlow ShoeFactory</h2>
          <p className="text-xs text-[#F28A27] font-semibold tracking-wider mt-0.5">
            {isRtl ? 'نظام التراخيص المعتمد — الجزائر' : 'Système de Licence Universelle — Algérie'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleActivate} className="p-6 space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-sm font-bold text-[#142B45]">{t('license.title')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('license.subtitle')}</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('license.license_id')}
            </label>
            <input
              type="text"
              required
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value.toUpperCase())}
              placeholder="Ex: WF-SHOE-XXXX-XXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tracking-wider text-slate-900 focus:outline-none focus:border-[#F28A27] focus:ring-1 focus:ring-[#F28A27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('license.activation_code')}
            </label>
            <input
              type="text"
              required
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="Ex: ACT-XXXX-XXXX-XXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tracking-wider text-slate-900 focus:outline-none focus:border-[#F28A27] focus:ring-1 focus:ring-[#F28A27]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-[#F28A27] hover:bg-[#e07a16] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isRtl ? 'جاري التحقق من الخادم...' : 'Vérification en cours...'}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{t('license.activate_btn')}</span>
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Serveur central : <strong>https://license.dentisuite.xyz</strong>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
