import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";

function Profile({ navigation }) {
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const userName = user?.userName || "";
  const navigationsList = [
    {
      iconSource: Icons.editP,
      title: "Edit Profile",
      navigation: () => navigation.navigate("EditProfile"),
    },
    {
      iconSource: Icons.receipt,
      title: "Rating & Reviews",
      navigation: () => navigation.navigate("Reviews"),
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} profileImage={profileImgUrl} navigation={navigation} title="Profile" />

        {/* Profile Image */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("EditProfile")} style={{ marginTop: RFPercentage(5.5) }}>
          <Image style={styles.img} source={profileImgUrl ? { uri: profileImgUrl } : Icons.dp} />
          <Image style={styles.edit} source={Icons.edit} />
        </TouchableOpacity>

        {/*User Name */}
        <Text style={styles.name}>{userName}</Text>

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
              },
            ]}
          >
            <View style={styles.content}>
              <Image style={styles.icon} source={item.iconSource} />
              <Text style={styles.title}>{item.title}</Text>
              <MaterialIcons name="arrow-forward-ios" style={styles.arrow} color={Colors.heading} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Tab */}
      {/* <CustomTabBar homeTab={true} navigation={navigation} /> */}
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
  img: { width: RFPercentage(20), height: RFPercentage(20), borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.4) },
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
  arrow: { fontSize: RFPercentage(1.7), color: "#44403C", position: "absolute", right: 0 },
});

export default Profile;
