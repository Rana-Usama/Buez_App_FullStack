import * as SecureStore from "expo-secure-store";
import { translateText } from "../translation/googleTranslation";

const translationCache = {};
// Tracks in-flight translations so concurrent requests for the same text
// share a single network call instead of stampeding the translation API.
const pendingTranslations = {};
let currentLang = "en";

export const initializeLanguage = async () => {
  const storedLang = await SecureStore.getItemAsync("appLanguage");
  if (storedLang) {
    currentLang = storedLang;
  }
};

export const setCurrentLanguage = (lang) => {
  currentLang = lang;
};

export const cachedTranslate = async (text) => {
  if (!text) return "";

  const cacheKey = `${currentLang}-${text}`;

  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Re-use an in-flight request for the same text/language.
  if (pendingTranslations[cacheKey]) {
    return pendingTranslations[cacheKey];
  }

  const request = (async () => {
    try {
      const translated = await translateText(text, currentLang);
      translationCache[cacheKey] = translated;
      return translated;
    } catch {
      return text;
    } finally {
      delete pendingTranslations[cacheKey];
    }
  })();

  pendingTranslations[cacheKey] = request;
  return request;
};