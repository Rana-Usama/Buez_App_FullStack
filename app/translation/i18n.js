import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./locales/en.json";
import de from "./locales/de.json";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  // lng: Localization.locale.split("-")[0], // e.g. 'en-US' => 'en'
  lng : 'de',
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
