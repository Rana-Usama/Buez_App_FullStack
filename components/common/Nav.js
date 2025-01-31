import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

// config
import Colors from "../../config/Colors";
import { router } from "expo-router";

const Nav = ({ crown = false, marginTop = RFPercentage(6), title, navigation, leftLogo = false, post = false, profileImage }) => {
  return (
    <View style={{ width: "90%", justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: marginTop }}>
      {leftLogo ? (
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({pathname: "/Profile"})} style={{ position: "absolute", left: 0 }}>
          {crown ? (
            <Image style={{ right: RFPercentage(-4), top: RFPercentage(2.2), zIndex: 1, width: RFPercentage(3), height: RFPercentage(3) }} source={require("../../assets/Images/crown.png")} />
          ) : (
            false
          )}
          <Image
            style={{
              borderColor: profileImage ? Colors.primary : undefined,
              borderWidth: profileImage ? RFPercentage(0.1) : undefined,
              width: profileImage ? RFPercentage(6) : RFPercentage(5),
              height: profileImage ? RFPercentage(6) : RFPercentage(5),
              borderRadius: profileImage ? RFPercentage(100) : undefined,
            }}
            source={profileImage ? { uri: profileImage } : require("../../assets/Images/buez.png")}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={{ position: "absolute", left: 0 }}>
          <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.6) }} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <Text style={{ color: Colors.primary, fontSize: RFPercentage(2.2), fontFamily: "Poppins_500Medium" }}>{title}</Text>

      {post ? (
        <TouchableOpacity onPress={() => router.push({pathname: "/Post"})} activeOpacity={0.8} style={{ position: "absolute", right: 0 }}>
          <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins-Medium" }}>Post</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.8} style={{ position: "absolute", right: 0 }}>
          <Image style={{ width: RFPercentage(6.5), height: RFPercentage(6.5) }} source={require("../../assets/Images/noti.png")} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Nav;
