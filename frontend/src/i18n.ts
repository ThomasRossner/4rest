import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import deTranslation from './locales/de/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      de: { translation: deTranslation },
    },
    fallbackLng: 'de',
    supportedLngs: ['en', 'de'],
    defaultNS: 'translation',
    ns: 'translation',
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
    returnEmptyString: false,
    returnNull: false,
    returnObjects: true,
  })
  .catch((error) => {
    console.error('i18n initialization error:', error);
  });

export default i18n;

