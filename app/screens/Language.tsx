import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../translation/i18n";
import * as SecureStore from "expo-secure-store";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { setCurrentLanguage } from "../utils/cachedTranslations";
import CustomNav from "../components/common/CustomNav";

type LanguageOption = {
  label: string;
  native: string;
  code: string;
  flag: string;
};

const LANGUAGES: LanguageOption[] = [
  { label: "Swiss German", native: "Schwiizerdütsch", code: "de-CH", flag: "🇨🇭" },
  { label: "German", native: "Deutsch", code: "de-DE", flag: "🇩🇪" },
  { label: "French", native: "Français", code: "fr", flag: "🇫🇷" },
  { label: "Italian", native: "Italiano", code: "it", flag: "🇮🇹" },
  { label: "Spanish", native: "Español", code: "es", flag: "🇪🇸" },
  { label: "English", native: "English", code: "en", flag: "🇬🇧" },
];

function Language({ navigation }) {
  const [selectedCode, setSelectedCode] = useState("");
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const isDark = theme.mode === "dark";

  useEffect(() => {
    const getStoredLanguage = async () => {
      const code = await SecureStore.getItemAsync("appLanguage");
      if (code) {
        setSelectedCode(code);
        i18n.changeLanguage(code);
      } else {
        const defaultCode = "en";
        setSelectedCode(defaultCode);
        i18n.changeLanguage(defaultCode);
        await SecureStore.setItemAsync("appLanguage", defaultCode);
      }
    };
    getStoredLanguage();
  }, []);

  const changeLanguage = async (code: string) => {
    setSelectedCode(code);
    i18n.changeLanguage(code);
    setCurrentLanguage(code); // update cachedTranslate's current language
    await SecureStore.setItemAsync("appLanguage", code);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav title={`${t("settings.txt12")}`} showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: theme.detailsText }]}>
          {t("settings.txt12")}
        </Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedCode === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                activeOpacity={0.85}
                onPress={() => changeLanguage(lang.code)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? theme.white
                        : Colors.primary + "10"
                      : theme.white,
                    borderColor: isSelected ? isDark ? Colors.darkGrey : theme.primary : theme.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.flagBadge,
                    {
                      backgroundColor: isDark
                        ? theme.white
                        : Colors.pureWhite,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={styles.flagText}>{lang.flag}</Text>
                </View>

                <View style={styles.textWrap}>
                  <Text
                    style={[
                      styles.languageLabel,
                      {
                        color: isSelected ? isDark ? Colors.white : theme.primary : theme.heading,
                        fontFamily: isSelected
                          ? "Poppins_600SemiBold"
                          : "Poppins_500Medium",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    style={[styles.languageNative, { color: theme.detailsText }]}
                    numberOfLines={1}
                  >
                    {lang.native}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? theme.primary : theme.stroke,
                      backgroundColor: isSelected ? theme.primary : "transparent",
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={RFPercentage(2)}
                      color={Colors.white}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: RFPercentage(2.5),
    paddingBottom: RFPercentage(5),
  },
  sectionLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: RFPercentage(2.5),
    marginBottom: RFPercentage(1.5),
    marginLeft: RFPercentage(0.5),
  },
  list: {
    width: "100%",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RFPercentage(1.6),
    paddingVertical: RFPercentage(1.4),
    paddingHorizontal: RFPercentage(1.8),
    marginBottom: RFPercentage(1.6),
  },
  flagBadge: {
    width: RFPercentage(5.2),
    height: RFPercentage(5.2),
    borderRadius: RFPercentage(2.6),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flagText: {
    fontSize: RFPercentage(2.6),
  },
  textWrap: {
    flex: 1,
    marginLeft: RFPercentage(1.6),
  },
  languageLabel: {
    fontSize: RFPercentage(1.9),
  },
  languageNative: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.2),
  },
  radio: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Language;
