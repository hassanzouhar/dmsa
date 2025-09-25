'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations directly
import noCommon from '../locales/no/common.json';
import enCommon from '../locales/en/common.json';

const resources = {
  no: {
    common: noCommon,
  },
  en: {
    common: enCommon,
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: typeof window !== 'undefined' ? localStorage.getItem('dmsa-language') || 'no' : 'no',
      fallbackLng: 'en',
      ns: ['common'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;