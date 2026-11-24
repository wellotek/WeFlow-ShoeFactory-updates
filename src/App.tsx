import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { LicenseGate } from './components/LicenseGate'
import { UpdateModal } from './components/UpdateModal'
import { applyDocumentDirection } from './i18n/direction'

// Pages
import { Dashboard } from './pages/Dashboard'
import { Models } from './pages/Models'
import { RawMaterials } from './pages/RawMaterials'
import { TechnicalSheets } from './pages/TechnicalSheets'
import { ProductionOrders } from './pages/ProductionOrders'
import { ProductionTracking } from './pages/ProductionTracking'
import { Stocks } from './pages/Stocks'
import { CustomerOrders } from './pages/CustomerOrders'
import { QualityControl } from './pages/QualityControl'
import { Machines } from './pages/Machines'
import { Clients } from './pages/Clients'
import { Suppliers } from './pages/Suppliers'
import { Purchases } from './pages/Purchases'
import { Deliveries } from './pages/Deliveries'
import { Costs } from './pages/Costs'
import { Reports } from './pages/Reports'
import { Labels } from './pages/Labels'
import { Settings } from './pages/Settings'

import type { LicenseUiState } from '../shared/types'
import type { UpdateSnapshot } from '../shared/updates'

export const App: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [currentModule, setCurrentModule] = useState<string>('dashboard')
  const [licenseState, setLicenseState] = useState<LicenseUiState | null>(null)
  const [licenseLoading, setLicenseLoading] = useState(true)
  const [updateSnapshot, setUpdateSnapshot] = useState<UpdateSnapshot | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // Initial setup: direction, license, updates listener
  useEffect(() => {
    applyDocumentDirection(i18n.language === 'ar' ? 'ar' : 'fr')

    const init = async () => {
      try {
        const lic = await window.api.license.getUiState()
        setLicenseState(lic)
      } catch (err) {
        console.error('License check failed:', err)
      } finally {
        setLicenseLoading(false)
      }

      try {
        const snap = await window.api.updates.getSnapshot()
        setUpdateSnapshot(snap)
        if (snap.phase === 'ready' || snap.phase === 'available') {
          setShowUpdateModal(true)
        }
      } catch (err) {
        console.error('Update snapshot fetch failed:', err)
      }
    }

    init()

    const unsubscribe = window.api.updates.onChanged((snap) => {
      setUpdateSnapshot(snap)
      if (snap.phase === 'downloading' || snap.phase === 'ready' || snap.phase === 'available') {
        setShowUpdateModal(true)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [i18n.language])

  const handleLicenseActivated = async () => {
    try {
      const lic = await window.api.license.getUiState()
      setLicenseState(lic)
    } catch (err) {
      console.error(err)
    }
  }

  // If license is strictly blocked/expired, enforce license gate
  const isLicenseLocked =
    licenseState &&
    (licenseState.status === 'blocked' || licenseState.status === 'expired')

  if (licenseLoading) {
    return (
      <div className="h-screen w-screen bg-[#142B45] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F28A27] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">WeFlow ShoeFactory...</p>
        </div>
      </div>
    )
  }

  if (isLicenseLocked) {
    return <LicenseGate onActivated={handleLicenseActivated} />
  }

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentModule} />
      case 'models':
        return <Models />
      case 'materials':
        return <RawMaterials />
      case 'technical_sheets':
        return <TechnicalSheets />
      case 'production_orders':
        return <ProductionOrders />
      case 'tracking':
        return <ProductionTracking />
      case 'stocks':
        return <Stocks />
      case 'orders':
        return <CustomerOrders />
      case 'quality':
        return <QualityControl />
      case 'machines':
        return <Machines />
      case 'clients':
        return <Clients />
      case 'suppliers':
        return <Suppliers />
      case 'purchases':
        return <Purchases />
      case 'deliveries':
        return <Deliveries />
      case 'costs':
        return <Costs />
      case 'reports':
        return <Reports />
      case 'labels':
        return <Labels />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onNavigate={setCurrentModule} />
    }
  }

  const getModuleTitle = () => {
    return t(`nav.${currentModule}`, currentModule)
  }

  return (
    <div className="h-screen w-screen flex bg-[#F4F6F8] font-sans antialiased overflow-hidden select-none">
      {/* Dynamic Sidebar */}
      <Sidebar currentModule={currentModule} onSelectModule={setCurrentModule} />

      {/* Main App Body */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <Header
          currentModuleTitle={getModuleTitle()}
          onNavigate={setCurrentModule}
          unreadAlertsCount={3}
        />

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1700px] mx-auto animate-fadeIn">
            {renderModuleContent()}
          </div>
        </main>
      </div>

      {/* Auto-update Modal */}
      {showUpdateModal && updateSnapshot && (
        <UpdateModal
          snapshot={updateSnapshot}
          onDismiss={() => setShowUpdateModal(false)}
          onDownload={() => window.api.updates.downloadUpdate()}
          onRestart={() => window.api.updates.quitAndInstall()}
        />
      )}
    </div>
  )
}

export default App
