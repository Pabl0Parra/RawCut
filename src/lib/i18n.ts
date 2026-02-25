import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../locales/es.json';
import en from '../locales/en.json';
import ca from '../locales/ca.json';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      const language = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
      if (language) {
        return callback(language);
      } else {
        const locales = getLocales();
        if (locales && locales.length > 0) {
            const deviceLanguage = locales[0].languageCode;
            if (deviceLanguage && ['es', 'en', 'ca'].includes(deviceLanguage)) {
                return callback(deviceLanguage);
            }
        }
        return callback('es'); // Default fallback
      }
    } catch (error) {
      console.log('Error reading language', error);
      callback('es');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  }
};

const resources = {
  es: { translation: es },
  en: { translation: en },
  ca: { translation: ca },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    compatibilityJSON: 'v4', 
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, 
    },
    react: {
        useSuspense: false
    }
  });

export default i18n;
