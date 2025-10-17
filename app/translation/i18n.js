import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";

// Import translations
import en from "./locales/en.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import rm from "./locales/rm.json";

// Map translations
const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  rm: { translation: rm },
};

// Async function to get preferred language
const getStoredLanguage = async () => {
  try {
    const storedLang = await SecureStore.getItemAsync("appLanguage");
    if (storedLang) {
      return storedLang;
    }
    const deviceLocale = Localization.locale;
    if (deviceLocale.startsWith("de")) {
      return "de";
    }
    return deviceLocale.split("-")[0] || "en";
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
