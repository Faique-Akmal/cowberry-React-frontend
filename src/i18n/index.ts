// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend) // load translations from files
  .use(LanguageDetector) // detect browser/user language
  .use(initReactI18next) // bind with React
  .init({
    fallbackLng: 'en', // default language
    debug: false, // set true only in dev
    interpolation: {
      escapeValue: false, // React already escapes
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // where to load
    },
    react: {
      useSuspense: false, // avoid suspense issues
    },
  });

export default i18n;

