import React from "react";
import { View, StyleSheet, ScrollView, Text, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";

function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} navigation={navigation} title="Privacy Policy" />

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Welcome to our Privacy Policy. Your privacy is critically important to us. This Privacy Policy explains how we collect, use, and protect your personal data when you use our application.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.heading}>Information We Collect</Text>
          <Text style={styles.text}>
            We collect information that you provide directly to us, such as when you create an account, submit a request, or communicate with customer support. This may include your name, email, phone
            number, and other relevant details.
          </Text>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.heading}>How We Use Your Information</Text>
          <Text style={styles.text}>
            We use the collected information to provide, improve, and personalize our services. This includes processing transactions, sending notifications, ensuring security, and analyzing usage
            trends.
          </Text>
        </View>

        {/* Data Sharing and Security */}
        <View style={styles.section}>
          <Text style={styles.heading}>Data Sharing and Security</Text>
          <Text style={styles.text}>
            We do not sell your personal data to third parties. We may share data with trusted service providers for necessary operations, complying with legal obligations, or ensuring user safety. We
            implement security measures to protect your data.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.heading}>Your Rights</Text>
          <Text style={styles.text}>
            You have the right to access, update, or delete your personal information. You may also opt-out of certain data collection practices. Contact us if you have any privacy concerns.
          </Text>
        </View>

        {/* Changes to This Policy */}
        <View style={styles.section}>
          <Text style={styles.heading}>Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. We encourage you to review it periodically for any changes. Continued use of our services after updates constitutes your acceptance of
            the revised policy.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.heading}>Contact Us</Text>
          <Text style={styles.text}>If you have any questions about this Privacy Policy, please contact us at support@example.com.</Text>
        </View>

        <View style={styles.space} />
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
    marginTop: RFPercentage(3),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  heading: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
    color: "#000",
    marginBottom: RFPercentage(0.4),
  },
  text: {
    textAlign: "justify",
    lineHeight: RFPercentage(3.2),
    color: "#44403C",
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  scroll : { width: "100%" },
  scrollContent : { width: "100%", alignItems: "center" },
  space : { marginBottom: RFPercentage(6) }

});

export default PrivacyPolicy;
