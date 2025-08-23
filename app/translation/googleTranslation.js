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

export const translateText = async (text) => {
  const targetLang = await getTargetLanguage();
  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: "text",
      }),
    });

    const data = await response.json();
    return data?.data?.translations[0]?.translatedText || text;
  } catch (error) {
    console.log("Translation error:", error);
    return null;
  }
};
