import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { changeLanguage } from '../i18n'
import type { CompanyProfile, AppSettings, LicenseUiState } from '../../shared/types'
import type { UpdateSnapshot } from '../../shared/updates'

export const Settings: React.FC = () => {
  const { i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'company' | 'language' | 'backup' | 'license' | 'updates'>('company')

  const [company, setCompany] = useState<CompanyProfile>({
    name: 'WeFlow ShoeFactory SARL',
    activity: 'Manufacture et fabrication industrielle de chaussures',
    address: 'Zone Industrielle Oued Smar, Lot 42',
    city: 'Alger',
    wilaya: 'Alger',
    phone: '+213 23 85 41 20',
    email: 'contact@shoefactory.weflow.dz',
    rc: '16/00-1234567B19',
    nif: '001916012345678',
    nis: '0912160123456',
    ai: '16014829104',
    logoUrl: ''
  })

  const [appSettings, setAppSettings] = useState<AppSettings>({
    language: 'ar',
    currency: 'DA',
    autoBackup: true,
    printFormat: 'A4',
    defaultMarginPercent: 35,
    theme: 'light'
  })

  const [license, setLicense] = useState<LicenseUiState | null>(null)
  const [updateSnapshot, setUpdateSnapshot] = useState<UpdateSnapshot | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // License activation modal inside settings
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [licenseKeyInput, setLicenseKeyInput] = useState('')
  const [activationCodeInput, setActivationCodeInput] = useState('')
  const [activating, setActivating] = useState(false)

  const loadData = async () => {
    try {
      const comp = await window.api.settings.getCompanyProfile()
      const sett = await window.api.settings.getAppSettings()
      const lic = await window.api.license.getUiState()
      const upd = await window.api.updates.getSnapshot()

      setCompany(comp)
      setAppSettings(sett)
      setLicense(lic)
      setUpdateSnapshot(upd)
    } catch (err: any) {
      console.error('Settings load error:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.api.settings.updateCompanyProfile(company)
      setFeedback({ message: 'Profil d’entreprise mis à jour avec succès', type: 'success' })
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur sauvegarde', type: 'error' })
    }
  }

  const handlePickLogo = async () => {
    try {
      const newLogoPath = await window.api.settings.pickLogo()
      if (newLogoPath) {
        setCompany((prev) => ({ ...prev, logoUrl: newLogoPath }))
        setFeedback({ message: 'Logo d’entreprise mis à jour', type: 'success' })
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur logo', type: 'error' })
    }
  }

  const handleClearLogo = async () => {
    try {
      await window.api.settings.clearLogo()
      setCompany((prev) => ({ ...prev, logoUrl: '' }))
      setFeedback({ message: 'Logo réinitialisé', type: 'success' })
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur', type: 'error' })
    }
  }

  const handleLanguageChange = async (lang: 'fr' | 'ar') => {
    try {
      await changeLanguage(lang)
      await window.api.settings.updateAppSettings({ language: lang })
      setAppSettings((prev) => ({ ...prev, language: lang }))
      setFeedback({ message: `Langue changée avec succès (${lang === 'ar' ? 'العربية' : 'Français'})`, type: 'success' })
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur langue', type: 'error' })
    }
  }

  const handleCreateBackup = async () => {
    try {
      const res = await window.api.backup.create()
      if (res.success) {
        setFeedback({
          message: `Sauvegarde SQLite créée avec succès ! (${(res.sizeBytes / 1024).toFixed(1)} KB) -> ${res.filePath}`,
          type: 'success'
        })
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur sauvegarde', type: 'error' })
    }
  }

  const handleRestoreBackup = async () => {
    if (!window.confirm('Attention : restaurer une sauvegarde écrasera les données actuelles. Continuer ?')) return
    try {
      const res = await window.api.backup.restore()
      if (res.success) {
        setFeedback({ message: 'Base de données restaurée avec succès ! Redémarrage conseillé.', type: 'success' })
        loadData()
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erreur restauration', type: 'error' })
    }
  }

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true)
    try {
      const snap = await window.api.updates.checkForUpdates()
      setUpdateSnapshot(snap)
      if (snap.phase === 'available') {
        setFeedback({ message: `Nouvelle mise à jour disponible : v${snap.availableVersion}`, type: 'success' })
      } else {
        setFeedback({ message: 'Votre logiciel WeFlow ShoeFactory est parfaitement à jour (v1.0.0).', type: 'success' })
      }
    } catch (err: any) {
      setFeedback({ message: 'Erreur vérification mise à jour: ' + err.message, type: 'error' })
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    setActivating(true)
    try {
      const updatedLic = await window.api.license.activate(licenseKeyInput.trim(), activationCodeInput.trim())
      setLicense(updatedLic)
      setFeedback({ message: 'Licence commerciale activée avec succès !', type: 'success' })
      setIsLicenseModalOpen(false)
    } catch (err: any) {
      setFeedback({ message: err.message || 'Échec de l’activation', type: 'error' })
    } finally {
      setActivating(false)
    }
  }

  const licAny = license as any

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

      {/* Tabs Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'company' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🏢 بيانات المصنع / Entreprise
        </button>
        <button
          onClick={() => setActiveTab('language')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'language' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🌐 اللغة والتخصيص / Langue & Région
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'backup' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          💾 النسخ الاحتياطي / Sauvegarde
        </button>
        <button
          onClick={() => setActiveTab('license')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'license' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🔑 الترخيص / Licence
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'updates' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🔄 التحديثات / Mises à jour
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right">
          <h3 className="text-base font-bold text-navy mb-4 border-b pb-2">
            معلومات المؤسسة والمصنع / Profil de l'Atelier
          </h3>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            {/* Logo Section */}
            <div className="flex items-center justify-end gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePickLogo}
                  className="px-3 py-1.5 bg-navy text-white rounded text-xs font-semibold hover:bg-navy/90"
                >
                  📁 تغيير الشعار
                </button>
                {company.logoUrl && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded text-xs hover:bg-rose-50"
                  >
                    حذف الشعار
                  </button>
                )}
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">شعار المؤسسة الرسمي</p>
                <p className="text-[11px] text-slate-500">يظهر في الفواتير ووصولات التسليم والبطاقات</p>
              </div>

              <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-orange">WF</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المؤسسة التجاري (Raison Sociale)</label>
                <input
                  type="text"
                  required
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">طبيعة النشاط (Activité)</label>
                <input
                  type="text"
                  value={company.activity}
                  onChange={(e) => setCompany({ ...company, activity: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الهاتف</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الولاية (Wilaya)</label>
                <input
                  type="text"
                  value={company.wilaya}
                  onChange={(e) => setCompany({ ...company, wilaya: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان الكامل للمصنع / الورشة</label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy"
              />
            </div>

            {/* Legal identifiers (NIF, NIS, RC, AI) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-navy">المعلومات الجبائية والقانونية (Facturation)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIF (الرقم الجبائي)</label>
                  <input
                    type="text"
                    value={company.nif}
                    onChange={(e) => setCompany({ ...company, nif: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIS (الرقم الإحصائي)</label>
                  <input
                    type="text"
                    value={company.nis}
                    onChange={(e) => setCompany({ ...company, nis: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">RC (السجل التجاري)</label>
                  <input
                    type="text"
                    value={company.rc}
                    onChange={(e) => setCompany({ ...company, rc: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Article d'Imposition (AI)</label>
                  <input
                    type="text"
                    value={company.ai}
                    onChange={(e) => setCompany({ ...company, ai: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-xs font-bold shadow-sm"
              >
                حفظ بيانات المصنع
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Language & Region */}
      {activeTab === 'language' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right space-y-6">
          <h3 className="text-base font-bold text-navy border-b pb-2">
            اللغة والتخصيص الإقليمي / Langue & Préférences
          </h3>

          <div className="space-y-4 max-w-xl ml-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">لغة واجهة البرنامج</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ar')}
                  className={`p-4 rounded-xl border text-center transition ${
                    i18n.language === 'ar'
                      ? 'border-navy bg-navy/5 font-bold text-navy shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-2xl block mb-1">🇩🇿</span>
                  <span className="text-sm">العربية (RTL كامل)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('fr')}
                  className={`p-4 rounded-xl border text-center transition ${
                    i18n.language === 'fr'
                      ? 'border-navy bg-navy/5 font-bold text-navy shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-2xl block mb-1">🇫🇷</span>
                  <span className="text-sm">Français (LTR)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">العملة الرسمية</label>
              <input
                type="text"
                disabled
                value={`${appSettings.currency} (الدينار الجزائري - Dinar Algérien)`}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-600 font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right space-y-6">
          <h3 className="text-base font-bold text-navy border-b pb-2">
            النسخ الاحتياطي واستعادة البيانات / Sauvegarde SQLite
          </h3>

          <p className="text-xs text-slate-600">
            يتم حفظ كافة بيانات المصنع محلياً في قاعدة بيانات SQLite آمنة وسريعة. يمكنك إنشاء نسخ احتياطية يدوية وتخزينها في قرص صلب خارجي أو وحدة تخزين سحابية.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 text-right space-y-3">
              <h4 className="text-sm font-bold text-navy">💾 إنشاء نسخة احتياطية الآن</h4>
              <p className="text-xs text-slate-500">
                توليد ملف نسخة احتياطية مشفر ومؤرخ يحتوي على كافة الموديلات، المواد، الطلبيات والتكاليف.
              </p>
              <button
                onClick={handleCreateBackup}
                className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/90 transition shadow-sm"
              >
                توليد نسخة احتياطية (.sqlite)
              </button>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 text-right space-y-3">
              <h4 className="text-sm font-bold text-rose-700">⚠️ استعادة نسخة احتياطية</h4>
              <p className="text-xs text-slate-500">
                استرجاع البيانات من ملف سابق. تنبيه: سيتم استبدال البيانات الحالية بالملف المسترجع.
              </p>
              <button
                onClick={handleRestoreBackup}
                className="px-4 py-2 border border-rose-300 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100/50 transition"
              >
                اختيار ملف واستعادة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: License Management */}
      {activeTab === 'license' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <button
              onClick={() => setIsLicenseModalOpen(true)}
              className="px-4 py-1.5 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange/90 shadow-sm"
            >
              🔑 تفعيل مفتاح جديد (Activer Clé)
            </button>
            <h3 className="text-base font-bold text-navy">
              إدارة الترخيص التجاري / Licence Universelle
            </h3>
          </div>

          <div className="max-w-xl ml-auto space-y-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {license?.status || 'ACTIVE'}
              </span>
              <span className="text-xs font-bold text-emerald-900">حالة الترخيص:</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-mono font-bold text-navy">{licAny?.licenseId || 'WFSF-PRO-2026-ALG'}</span>
                <span className="text-slate-500">مفتاح الترخيص:</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-mono font-bold text-navy">{licAny?.installationId || 'INST-UNKNOWN'}</span>
                <span className="text-slate-500">معرف الجهاز (Installation ID):</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-mono font-bold text-navy">{licAny?.daysRemaining ?? 365} يوم</span>
                <span className="text-slate-500">الأيام المتبقية:</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-mono text-slate-600">https://license.dentisuite.xyz</span>
                <span className="text-slate-500">خادم الترخيص:</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Software Updates */}
      {activeTab === 'updates' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right space-y-6">
          <h3 className="text-base font-bold text-navy border-b pb-2">
            تحديثات البرنامج / Mises à Jour Automatiques
          </h3>

          <div className="max-w-xl ml-auto space-y-4">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <button
                onClick={handleCheckUpdates}
                disabled={checkingUpdate}
                className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/90 transition shadow-sm disabled:opacity-50"
              >
                {checkingUpdate ? 'جاري الفحص...' : '🔄 التحقق من التحديثات الآن'}
              </button>

              <div className="text-right">
                <span className="text-xs font-bold text-navy block">WeFlow ShoeFactory {updateSnapshot?.currentVersion || 'v1.0.0'}</span>
                <span className="text-[11px] text-slate-500">مستودع التحديثات: GitHub Releases (wellotek/WeFlow-ShoeFactory-updates)</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              💡 يدعم البرنامج نظام التحديث التلقائي الهادئ والآمن عبر GitHub Releases. يتم تنزيل التحديث في الخلفية دون مقاطعة سير العمل في المصنع.
            </div>
          </div>
        </div>
      )}

      {/* License Modal */}
      {isLicenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn text-right">
            <h3 className="text-xl font-bold text-navy mb-2">تفعيل رخصة تجارية جديدة</h3>
            <p className="text-xs text-slate-500 mb-4">
              أدخل معرف الرخصة ورمز التفعيل المستلم من WeFlow لتفعيل النسخة.
            </p>

            <form onSubmit={handleActivateLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">معرف الرخصة (License ID)</label>
                <input
                  type="text"
                  required
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="Ex: WFSF-PRO-9872"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">رمز التفعيل (Activation Code)</label>
                <input
                  type="text"
                  required
                  value={activationCodeInput}
                  onChange={(e) => setActivationCodeInput(e.target.value)}
                  placeholder="Ex: ACT-4820-9182"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-navy font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsLicenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={activating}
                  className="px-5 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {activating ? 'جاري الاتصال بالسيرفر...' : 'تأكيد التفعيل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
