import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
// config
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";

interface NavProps {
  dpNull?: boolean;
  crown?: boolean;
  marginTop?: number;
  title: string;
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
  leftLogo?: boolean;
  post?: boolean;
  profileImage?: string | null;
}

const Nav: React.FC<NavProps> = ({ dpNull = false, crown = false, marginTop = RFPercentage(6), title, navigation, leftLogo = false, post = false, profileImage }) => {
  return (
    <View style={[styles.container, { marginTop }]}>
      {leftLogo ? (
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.8} style={styles.touch}>
          {crown && <Image style={styles.crown} source={Icons.crown} />}
          <Image style={styles.profile} source={profileImage ? { uri: profileImage } : Icons.dp} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={{ position: "absolute", left: 0 }}>
          <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.8) }} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>{title}</Text>

      {post ? (
        <TouchableOpacity onPress={() => navigation.navigate("Post")} activeOpacity={0.8} style={{ position: "absolute", right: 0 }}>
          <Text style={styles.post}>Post</Text>
        </TouchableOpacity>
      ) : dpNull ? null : (
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")} activeOpacity={0.8} style={styles.notify}>
          <Image style={{ width: RFPercentage(3.5), height: RFPercentage(3.5) }} source={Icons.notify2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  touch: { position: "absolute", left: 0, bottom: RFPercentage(-1) },
  crown: { right: RFPercentage(-3.9), top: RFPercentage(2.2), zIndex: 1, width: RFPercentage(3), height: RFPercentage(3) },
  buez: {
    width: RFPercentage(5),
    height: RFPercentage(5),
  },
  title: { color: Colors.primary, fontSize: RFPercentage(2.3), fontFamily: "Poppins_500Medium" },
  post: { color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins-Medium" },
  profile: { borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.2), width: RFPercentage(6), height: RFPercentage(6) },
  notify: {
    position: "absolute",
    right: 0,
    width: RFPercentage(5.6),
    height: RFPercentage(5.6),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: RFPercentage(1),
    elevation: 6, // Android shadow

    // iOS shadow
    shadowColor: "rgba(93, 88, 88, 0.8)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Nav;
