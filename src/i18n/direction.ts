export function applyDocumentDirection(locale: 'fr' | 'ar'): void {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
  document.documentElement.dir = dir
}
