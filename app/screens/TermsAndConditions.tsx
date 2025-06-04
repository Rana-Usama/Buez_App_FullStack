import React from "react";
import { View, StyleSheet, ScrollView, Text, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";

function TermsAndConditions({ navigation }) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} navigation={navigation} title="Terms & Conditions" />

        <View style={styles.content}>
          <Text style={styles.text}>
            Welcome to BUEZ, a platform operated by Devappics that connects users who need help with daily tasks to individuals willing to provide assistance in exchange for compensation. By accessing
            or using the BUEZ mobile application (the "App") or any related services (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree,
            you must not use the Service.
          </Text>
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
      <CustomTabBar settingTab={true} navigation={navigation} />
    </View>
  );
}

const sections = [
  {
    title: "1. Eligibility",
    content:
      "You must be at least 18 years old to use BUEZ. By registering, you confirm that you have the legal capacity to enter into this agreement. BUEZ reserves the right to suspend or terminate accounts that violate these Terms.",
  },
  {
    title: "2. User Accounts",
    content:
      "You must create an account to access and use the Service. You are responsible for maintaining the confidentiality of your account credentials. BUEZ is not liable for any unauthorized access to your account.",
  },
  {
    title: "3. Subscription and Payments",
    content:
      "BUEZ operates on a subscription-based model. Users must subscribe to access and post requests. Subscription fees are charged monthly and will continue until canceled by the user. Payments are processed through third-party payment providers.",
  },
  {
    title: "4. Use of the Service",
    content:
      "Users may post requests for assistance, specifying compensation and task details. Compensation is handled directly between the requestor and the helper, and BUEZ does not guarantee or process payments between users.",
  },
  {
    title: "5. Prohibited Activities",
    content: "Users must not post misleading, harmful, or offensive content, use the platform for illegal activities, or attempt to hack or disrupt the platform’s functionality.",
  },
  {
    title: "6. Limitation of Liability",
    content:
      "BUEZ is a facilitator and is not liable for any direct, indirect, incidental, or consequential damages arising from the use of the Service. BUEZ does not guarantee the quality, reliability, or safety of services provided by users.",
  },
  { title: "7. Contact Information", content: "For questions or support, please contact us at info@buez.com" },
];

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
