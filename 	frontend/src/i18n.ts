import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import deTranslation from './locales/de/translation.json';

// Ensure translations are properly loaded - use direct object access
const resources = {
  en: {
    translation: enTranslation,
  },
  de: {
    translation: deTranslation,
  },
};

// Initialize i18n synchronously to ensure translations are available immediately
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'de'],
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
    // Ensure i18n is ready before rendering
    initImmediate: false,
    // Force synchronous initialization
    lng: undefined, // Let detector decide, but ensure it's set
  });

// Ensure i18n is initialized before export
if (!i18n.isInitialized) {
  console.warn('i18n was not initialized synchronously');
}

export default i18n;

