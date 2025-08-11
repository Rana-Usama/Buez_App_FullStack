import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function Profile({ navigation }) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const profileImgUrl = user?.profileImage || "";
  const userName = user?.userName || "";
  console.log(user);
  const navigationsList = [
    {
      iconSource: Icons.editP,
      title: `${t("profile.txt2")}`,
      navigation: () => navigation.navigate("EditProfile"),
    },
    {
      iconSource: Icons.receipt,
      title: `${t("profile.txt3")}`,
      navigation: () => navigation.navigate("Reviews"),
    },
    {
      iconSource: Icons.map2,
      title: `${t("profile.txt4")}`,
      navigation: () => navigation.navigate("CompletedTasks"),
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav
          dpNull
          marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)}
          leftLogo={false}
          profileImage={profileImgUrl}
          navigation={navigation}
          title={`${t("profile.txt1")}`}
        />

        {/* Profile Image */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("EditProfile")} style={{ marginTop: RFPercentage(5.5) }}>
          <Image style={styles.img} source={profileImgUrl ? { uri: profileImgUrl } : Icons.dp} />
          <Image style={styles.edit} source={Icons.edit} />
        </TouchableOpacity>

        {/*User Name */}
        <Text style={[styles.name, {color:theme.heading}]}>{userName}</Text>

        {/* Navigation List */}
        {navigationsList.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.navigation}
            activeOpacity={0.8}
            style={[
              styles.navigationContainer,
              {
                marginTop: i == 0 ? RFPercentage(4) : RFPercentage(2.5),
                borderColor:theme.border
              },
            ]}
          >
            <View style={styles.content}>
              <Image style={styles.icon} source={item.iconSource} tintColor={theme.heading} />
              <Text style={[styles.title, {color:theme.heading}]}>{item.title}</Text>
              <MaterialIcons name="arrow-forward-ios" style={styles.arrow} color={theme.heading} />
            </View>
          </TouchableOpacity>
        ))}
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
  scroll: { width: "100%" },
  scrollContent: { width: "100%", alignItems: "center" },
  img: { width: RFPercentage(18), height: RFPercentage(18), borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.4) },
  edit: { width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(20), position: "absolute", bottom: RFPercentage(-0.3), right: RFPercentage(3) },
  name: { color: "#57534E", fontSize: RFPercentage(2.4), fontFamily: "Poppins_500Medium", marginTop: RFPercentage(2.2) },
  navigationContainer: {
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(1),
    borderColor: Colors.detailsBorder,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  content: { width: "90%", justifyContent: "flex-start", alignItems: "center", flexDirection: "row" },
  icon: { width: RFPercentage(2.2), height: RFPercentage(2.2) },
  title: { marginLeft: RFPercentage(1.7), color: "#44403C", fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
  arrow: { fontSize: RFPercentage(1.7), position: "absolute", right: 0 },
});

export default Profile;
