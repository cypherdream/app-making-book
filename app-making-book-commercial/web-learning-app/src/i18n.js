import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import sw from './locales/sw/common.json';

// Real i18next setup, not just a config file sitting unused. Only
// covers UI chrome strings (buttons, labels) — NOT lesson content,
// which is far larger and needs a real translation review pass before
// it's trustworthy to ship. See README for exactly what's covered.
i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    sw: { common: sw },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes — avoids double-escaping
});

export default i18n;
