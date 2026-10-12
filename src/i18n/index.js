import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import nb from './nb.json'
import en from './en.json'
import { useSettings } from '../store/settings.js'

// Both bundles are tiny, so they ship inline: no loading state, and the
// calculator works offline in either language.
i18n.use(initReactI18next).init({
  resources: { nb: { translation: nb }, en: { translation: en } },
  lng: useSettings.getState().lang,
  fallbackLng: 'nb',
  interpolation: { escapeValue: false },
  returnNull: false,
})

function applyLang(lang) {
  if (i18n.language !== lang) i18n.changeLanguage(lang)
  document.documentElement.lang = lang === 'en' ? 'en' : 'nb'
}

applyLang(useSettings.getState().lang)
useSettings.subscribe((s) => applyLang(s.lang))

export default i18n
