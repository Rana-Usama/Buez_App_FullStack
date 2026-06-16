// import * as SecureStore from "expo-secure-store";
// import * as Localization from "expo-localization";

// const getTargetLanguage = async () => {
//   try {
//     const storedLang = await SecureStore.getItemAsync("appLanguage");
//     return storedLang || Localization.locale.split("-")[0] || "en";
//   } catch (error) {
//     console.log("Failed to get language:", error);
//     return "en";
//   }
// };

// const key = process.env.EXPO_PUBLIC_TRANSLATION_KEY

// export const translateText = async (text) => {
//   const targetLang = await getTargetLanguage();
//   try {
//     const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         q: text,
//         target: targetLang,
//         format: "text",
//       }),
//     });

//     const data = await response.json();
//     return data?.data?.translations[0]?.translatedText || text;
//   } catch (error) {
//     console.log("Translation error:", error);
//     return null;
//   }
// };

import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";

const getTargetLanguage = async () => {
  try {
    const storedLang = await SecureStore.getItemAsync("appLanguage");
    return storedLang || Localization.locale.split("-")[0] || "en";
  } catch (error) {
    console.log("Failed to get language:", error);
    return "en";
  }
};

const TRANSLATION_TIMEOUT_MS = 6000;

export const translateText = async (text, targetLang) => {
  // Abort the request if the network stalls so it can never block the JS
  // queue / awaiting loops indefinitely.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

  try {
    const encodedText = encodeURIComponent(text);
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodedText}`,
      { signal: controller.signal },
    );

    if (!response.ok) return text;

    const data = await response.json();
    return data[0]?.map((item) => item[0]).join("") || text;
  } catch (error) {
    // Timeouts/network errors fall back to the original text (non-blocking).
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
};
