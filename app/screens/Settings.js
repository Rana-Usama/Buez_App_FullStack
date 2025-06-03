import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import { logout } from "../services/Auth.service";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { usePostContext } from "../contexts/PostContext";

function Settings({ navigation }) {
  const { userData: user } = useUser();
  const { resetPostsData } = usePostContext();
  const profileImgUrl = user?.profileImage || "";
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
      navigation: () => {
        resetPostsData();
        logout();
      },
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} profileImage={profileImgUrl} leftLogo={true} navigation={navigation} title="Settings" />

        <View style={styles.content}>
          <Text style={styles.txt}>Help & Security</Text>
          <View style={styles.wrap} />
        </View>

        {/* Navigation List */}
        {navigationsList.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.navigation}
            activeOpacity={0.8}
            style={[
              styles.navigationWrap,
              {
                marginTop: i == 0 ? RFPercentage(3) : RFPercentage(2.5),
              },
            ]}
          >
            <View style={styles.content2}>
              <Image style={styles.img} source={item.iconSource} />
              <Text style={[styles.title, { color: item.redColor ? Colors.red : "#44403C" }]}>{item.title}</Text>
              <MaterialIcons name="arrow-forward-ios" style={[styles.icon, { color: item.redColor ? Colors.red : "#44403C" }]} color={Colors.heading} />
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
  scroll: { width: "100%" },
  scrollContent: { width: "100%", alignItems: "center" },
  content: { width: "90%", justifyContent: "flex-start", alignItems: "flex-start", marginTop: RFPercentage(3.5) },
  txt: { color: Colors.lightGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins-Regular" },
  wrap: { width: "75%", height: RFPercentage(0.1), backgroundColor: "#F3F4F6", marginTop: RFPercentage(1.6) },
  navigationWrap: {
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(1),
    borderColor: Colors.detailsBorder,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  content2: { width: "90%", justifyContent: "flex-start", alignItems: "center", flexDirection: "row" },
  img: { width: RFPercentage(2.8), height: RFPercentage(2.8) },
  title: { fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular", marginLeft: RFPercentage(1.6) },
  icon: { position: "absolute", right: 0, fontSize: RFPercentage(1.7) },
});

export default Settings;
