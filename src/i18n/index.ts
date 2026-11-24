import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'
import ar from './ar.json'
import { applyDocumentDirection } from './direction'

const savedLang = localStorage.getItem('i18nextLng') || 'ar'

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar }
  },
  lng: savedLang === 'fr' ? 'fr' : 'ar',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false
  }
})

export const changeLanguage = async (lng: 'fr' | 'ar'): Promise<void> => {
  await i18n.changeLanguage(lng)
  applyDocumentDirection(lng)
  localStorage.setItem('i18nextLng', lng)
}

export default i18n
