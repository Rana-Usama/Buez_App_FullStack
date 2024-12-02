import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";

function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(9)} navigation={navigation} title="Privacy Policy" />
        <View style={{ width: "90%", marginTop: RFPercentage(3), justifyContent: "center", alignItems: "center" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
            laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.
          </Text>
        </View>

        <View style={{ width: "90%", marginTop: RFPercentage(2), justifyContent: "center", alignItems: "center" }}>
          <Text style={{ textAlign: "justify", lineHeight: RFPercentage(3.2), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>
            It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less
            normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English.
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

export default PrivacyPolicy;
