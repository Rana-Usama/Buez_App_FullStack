import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import ToggleSwitch from "toggle-switch-react-native";
import i18n from "../translation/i18n";
import * as SecureStore from "expo-secure-store";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

const languages = ["German", "French", "Italian", "English"];
const languageMap = {
  German: "de",
  French: "fr",
  Italian: "it",
  English: "en",
};

function Language({ navigation }) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const { t } = useTranslation();
  const {theme} = useAppTheme()

  useEffect(() => {
    const getStoredLanguage = async () => {
      const code = await SecureStore.getItemAsync("appLanguage");
      if (code) {
        const lang = Object.keys(languageMap).find((key) => languageMap[key] === code);
        if (lang) {
          setSelectedLanguage(lang);
          i18n.changeLanguage(code);
        }
      } else {
        // fallback to device locale
        const defaultLang = "English";
        setSelectedLanguage(defaultLang);
        i18n.changeLanguage(languageMap[defaultLang]);
        await SecureStore.setItemAsync("appLanguage", languageMap[defaultLang]);
      }
    };
    getStoredLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    setSelectedLanguage(lang);
    const code = languageMap[lang];
    i18n.changeLanguage(code);
    await SecureStore.setItemAsync("appLanguage", code);
  };

  return (
    <View style={[styles.screen,{backgroundColor:theme.white}]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`${t("settings.txt12")}`} />
        <View style={styles.container}>
          {languages.map((lang) => (
            <TouchableOpacity key={lang} style={[styles.languageCard,{borderColor:theme.border},]} activeOpacity={0.8} onPress={() => changeLanguage(lang)}>
              <Text style={[styles.languageText, selectedLanguage === lang && styles.languageTextSelected,{color:theme.heading}]}>{lang}</Text>
              <ToggleSwitch isOn={selectedLanguage === lang} onColor={Colors.primary} offColor={Colors.switch} size="small" onToggle={() => changeLanguage(lang)} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    alignItems: "center",
    paddingBottom: RFPercentage(5),
  },
  container: {
    width: "100%",
    marginTop: RFPercentage(6),
    alignItems: "center",
  },
  languageCard: {
    width: "90%",
    height: RFPercentage(7),
    borderWidth: 1,
    borderRadius: RFPercentage(1.5),
    borderColor: "rgba(219, 216, 216, 0.7)",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(2),
    // backgroundColor: "#F9FAFB",
  },
  languageText: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  languageTextSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
});

export default Language;
