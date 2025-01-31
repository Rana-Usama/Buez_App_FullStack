import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../../components/common/Nav";
import CustomTabBar from "../../components/common/CustomTabBar";

// config
import Colors from "../../config/Colors";

function TermsAndConditions({ navigation }) {
  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(9)} navigation={navigation} title="T & C's" />
        <View style={{ width: "90%", marginTop: RFPercentage(3), justifyContent: "center", alignItems: "center" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            These Terms and Conditions ("Terms") govern your use of the fuel delivery services offered by Fueled Up ("Company," "we," "us," or "our") through our mobile application ("App"). By
            accessing or using our services, you agree to be bound by these Terms. If you do not agree with these Terms, you may not use our services.
          </Text>
        </View>

        {/* 1 */}
        <View style={{ width: "90%", marginTop: RFPercentage(3), justifyContent: "center", alignItems: "flex-start" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.8), fontFamily: "Poppins-Medium" }}>1. Service Description</Text>
          <Text style={{ marginTop: RFPercentage(0.4), textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            Our service enables customers to order and receive fuel delivery directly to their specified location.
          </Text>
        </View>

        {/* 2 */}
        <View style={{ width: "90%", marginTop: RFPercentage(2), justifyContent: "center", alignItems: "flex-start" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.8), fontFamily: "Poppins-Medium" }}>2. Eligibility</Text>
          <Text style={{ marginTop: RFPercentage(0.4), textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            To use our services, you must be of legal age in your jurisdiction and capable of entering into a binding agreement. By using our services, you represent and warrant that you meet these
            eligibility requirements.
          </Text>
        </View>

        {/* 3 */}
        <View style={{ width: "90%", marginTop: RFPercentage(2), justifyContent: "center", alignItems: "flex-start" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.8), fontFamily: "Poppins-Medium" }}>3. Posting Req</Text>
          <Text style={{ marginTop: RFPercentage(0.4), textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            Customers can place orders for fuel delivery through our App. By placing an order, you agree to provide accurate and complete information about your location, contact details, and payment
            information.
          </Text>
        </View>

        {/* 3 */}
        <View style={{ width: "90%", marginTop: RFPercentage(2), justifyContent: "center", alignItems: "flex-start" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.8), fontFamily: "Poppins-Medium" }}>4. Reviews</Text>
          <Text style={{ marginTop: RFPercentage(0.4), textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            We will make best efforts to deliver fuel orders within the requested time slot. However, delivery times may vary depending on factors such as weather conditions, traffic, and operational
            constraints. We do not guarantee specific delivery times and are not liable for any delays.
          </Text>
        </View>

        <View style={{ marginBottom: RFPercentage(6) }} />
      </ScrollView>

      {/* Bottom Tab */}
      <CustomTabBar settingTab={true} navigation={navigation} />
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
});

export default TermsAndConditions;
