// cachedTranslate.js
import { translateText } from "../translation/googleTranslation";

const translationCache = {};

export const cachedTranslate = async (text) => {
  if (!text) return "";

  if (translationCache[text]) {
    return translationCache[text]; // return cached version
  }

  const translated = await translateText(text);
  translationCache[text] = translated;
  return translated;
};
