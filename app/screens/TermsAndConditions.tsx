import React from "react";
import { View, StyleSheet, ScrollView, Text, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";

function TermsAndConditions({ navigation }) {
  const { t } = useTranslation();
  const sections = [
    {
      title: `${t("terms.txt2")}`,
      content: `${t("terms.txt3")}`,
    },
    {
      title: `${t("terms.txt4")}`,
      content: `${t("terms.txt5")}`,
    },
    {
      title: `${t("terms.txt6")}`,
      content: `${t("terms.txt7")}`,
    },
    {
      title: `${t("terms.txt8")}`,
      content: `${t("terms.txt9")}`,
    },
    {
      title: `${t("terms.txt10")}`,
      content: `${t("terms.txt11")}`,
    },
    {
      title: `${t("terms.txt12")}`,
      content: `${t("terms.txt13")}`,
    },
    { title: `${t("terms.txt14")}`, content: `${t("terms.txt15")}` },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} navigation={navigation} title={`${t("settings.txt3")}`} />

        <View style={styles.content}>
          <Text style={styles.text}>{`${t("terms.txt1")}`}</Text>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.text}>{section.content}</Text>
          </View>
        ))}

        <View style={{ marginBottom: RFPercentage(6) }} />
      </ScrollView>

      {/* Bottom Tab */}
      {/* <CustomTabBar settingTab={true} navigation={navigation} /> */}
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
    marginTop: RFPercentage(2.5),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  sectionTitle: {
    textAlign: "justify",
    lineHeight: RFPercentage(3.2),
    color: "#44403C",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  text: {
    marginTop: RFPercentage(0.4),
    textAlign: "justify",
    lineHeight: RFPercentage(3.2),
    color: "#44403C",
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  content: { width: "90%", marginTop: RFPercentage(3), justifyContent: "center", alignItems: "center" },
  scroll: { width: "100%" },
  scrollContent: { width: "100%", alignItems: "center" },
});

export default TermsAndConditions;
