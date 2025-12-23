import React from "react";
import { View, StyleSheet, ScrollView, Text, Platform, StatusBar } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import CustomNav from "../components/common/CustomNav";

function PrivacyPolicy({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
       <StatusBar
              barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
              backgroundColor={"transparent"}
              translucent
            />
      <CustomNav showBack title={`${t("settings.txt4")}`} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt1"
          )}`}</Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.heading }]}>{`${t(
            "privacyPolicy.txt2"
          )}`}</Text>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt3"
          )}`}</Text>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.heading }]}>{`${t(
            "privacyPolicy.txt4"
          )}`}</Text>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt5"
          )}`}</Text>
        </View>

        {/* Data Sharing and Security */}
        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.heading }]}>{`${t(
            "privacyPolicy.txt6"
          )}`}</Text>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt7"
          )}`}</Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.heading }]}>{`${t(
            "privacyPolicy.txt8"
          )}`}</Text>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt9"
          )}`}</Text>
        </View>

        {/* Changes to This Policy */}
        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.heading }]}>{`${t(
            "privacyPolicy.txt10"
          )}`}</Text>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt11"
          )}`}</Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.heading }]}>{`${t(
            "privacyPolicy.txt12"
          )}`}</Text>
          <Text style={[styles.text, { color: theme.darkGrey }]}>{`${t(
            "privacyPolicy.txt13"
          )}`}</Text>
        </View>

        <View style={styles.space} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  section: {
    width: "90%",
    marginTop: RFPercentage(3),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  heading: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
    marginBottom: RFPercentage(0.4),
  },
  text: {
    // textAlign: "justify",
    lineHeight: RFPercentage(3.2),
    color: "#44403C",
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  scroll: { width: "100%" },
  scrollContent: { width: "100%", alignItems: "center" },
  space: { marginBottom: RFPercentage(6) },
});

export default PrivacyPolicy;
