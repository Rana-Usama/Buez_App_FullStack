import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";

// Import translations
import en from "./locales/en.json";
import deDE from "./locales/de-DE.json"; // Germany German
import deCH from "./locales/de-CH.json"; // Swiss German
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import es from "./locales/es.json"; // Spanish

// Map translations
const resources = {
  en: { translation: en },
  "de-DE": { translation: deDE },
  "de-CH": { translation: deCH },
  fr: { translation: fr },
  it: { translation: it },
  es: { translation: es },
};

// Async function to get preferred language
const getStoredLanguage = async () => {
  try {
    const storedLang = await SecureStore.getItemAsync("appLanguage");
    if (storedLang) return storedLang;

    // Detect device locale
    const deviceLocale = Localization.locale;

    if (deviceLocale.startsWith("de-CH")) return "de-CH";
    if (deviceLocale.startsWith("de-DE") || deviceLocale.startsWith("de"))
      return "de-DE";
    if (deviceLocale.startsWith("es")) return "es";
    if (deviceLocale.startsWith("fr")) return "fr";
    if (deviceLocale.startsWith("it")) return "it";

    return "en"; // default fallback
  } catch (error) {
    console.log("Failed to get stored language:", error);
    return "en";
  }
};

// Initialize i18n
const initI18n = async () => {
  const lng = await getStoredLanguage();

  i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources,
    lng,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
