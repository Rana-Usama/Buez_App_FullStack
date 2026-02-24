import * as SecureStore from "expo-secure-store";
import { translateText } from "../translation/googleTranslation";

const translationCache = {};
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

  console.log("currentLang........", currentLang);

  const translated = await translateText(text, currentLang);
  translationCache[cacheKey] = translated;

  return translated;
};