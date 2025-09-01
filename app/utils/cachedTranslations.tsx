import { translateText } from "../translation/googleTranslation";

const translationCache = {};
let currentLang = "en"; // default language

export const setCurrentLanguage = (lang) => {
  currentLang = lang;
  // Optional: clear cache when language changes
  // Object.keys(translationCache).forEach(key => delete translationCache[key]);
};

export const cachedTranslate = async (text) => {
  if (!text) return "";

  // use current language automatically
  const cacheKey = `${currentLang}-${text}`;

  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const translated = await translateText(text, currentLang);
  translationCache[cacheKey] = translated;
  return translated;
};
