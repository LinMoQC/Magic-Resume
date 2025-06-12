import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import zh from "./locales/zh/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 