import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

// config
import Colors from "../../config/Colors";

const Nav = ({ dpNull = false, crown = false, marginTop = RFPercentage(6), title, navigation, leftLogo = false, post = false, profileImage }) => {
  return (
    <View style={{ width: "90%", justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: marginTop }}>
      {leftLogo ? (
        <TouchableOpacity activeOpacity={0.8} style={{ position: "absolute", left: 0, bottom: RFPercentage(-1) }}>
          {crown ? (
            <Image style={{ right: RFPercentage(-3.4), top: RFPercentage(2.2), zIndex: 1, width: RFPercentage(3), height: RFPercentage(3) }} source={require("../../../assets/Images/crown.png")} />
          ) : (
            false
          )}
          <Image
            style={{
              width: RFPercentage(5),
              height: RFPercentage(5),
            }}
            source={require("../../../assets/Images/buez.png")}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={{ position: "absolute", left: 0 }}>
          <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.8) }} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <Text style={{ color: Colors.primary, fontSize: RFPercentage(2.2), fontFamily: "Poppins_500Medium" }}>{title}</Text>

      {post ? (
        <TouchableOpacity onPress={() => navigation.navigate("Post")} activeOpacity={0.8} style={{ position: "absolute", right: 0 }}>
          <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins-Medium" }}>Post</Text>
        </TouchableOpacity>
      ) : dpNull ? null : (
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.8} style={{ position: "absolute", right: 0 }}>
          <Image
            style={{ borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.2), width: RFPercentage(6), height: RFPercentage(6) }}
            source={profileImage ? { uri: profileImage } : require("../../../assets/Images/dp.png")}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Nav;
