import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import { logout } from "../services/auth";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";

function Settings({ navigation }) {
  const navigationsList = [
    {
      iconSource: require("../../assets/Images/privacy.png"),
      title: "Change Password",
      navigation: () => navigation.navigate("ChangePassword"),
    },
    {
      iconSource: require("../../assets/Images/tc.png"),
      title: "Terms & Conditions",
      navigation: () => navigation.navigate("TermsAndConditions"),
    },
    {
      iconSource: require("../../assets/Images/privacy.png"),
      title: "Privacy Policy",
      navigation: () => navigation.navigate("PrivacyPolicy"),
    },
    {
      iconSource: require("../../assets/Images/faq.png"),
      title: "FAQ's",
      navigation: () => navigation.navigate("FAQ"),
    },
    {
      iconSource: require("../../assets/Images/logout.png"),
      title: "Logout",
      redColor: true,
      navigation: () => logout(),
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.9)} leftLogo={true} navigation={navigation} title="Settings" />

        <View style={{ width: "90%", justifyContent: "flex-start", alignItems: "flex-start", marginTop: RFPercentage(3.5) }}>
          <Text style={{ color: Colors.lightGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins-Regular" }}>Help & Security</Text>
          <View style={{ width: "75%", height: RFPercentage(0.1), backgroundColor: "#F3F4F6", marginTop: RFPercentage(1.6) }} />
        </View>

        {/* Navigation List */}
        {navigationsList.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.navigation}
            activeOpacity={0.8}
            style={{
              width: "90%",
              marginTop: i == 0 ? RFPercentage(3) : RFPercentage(2.5),
              height: RFPercentage(6.5),
              borderRadius: RFPercentage(1),
              borderColor: Colors.detailsBorder,
              borderWidth: RFPercentage(0.1),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ width: "90%", justifyContent: "flex-start", alignItems: "center", flexDirection: "row" }}>
              <Image style={{ width: RFPercentage(2.8), height: RFPercentage(2.8) }} source={item.iconSource} />
              <Text style={{ marginLeft: RFPercentage(1.6), color: item.redColor ? Colors.red : "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>{item.title}</Text>
              <MaterialIcons name="arrow-forward-ios" style={{ fontSize: RFPercentage(1.7), color: item.redColor ? Colors.red : "#44403C", position: "absolute", right: 0 }} color={Colors.heading} />
            </View>
          </TouchableOpacity>
        ))}
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

export default Settings;
