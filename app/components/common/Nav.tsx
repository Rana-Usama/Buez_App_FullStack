import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// config
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";
import { useNotifications } from "../../contexts/notification.context"; // 👈 Add this line
import { useAppTheme } from "../../contexts/themeContext";

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

const Nav: React.FC<NavProps> = ({
  dpNull = false,
  crown = false,
  marginTop = RFPercentage(6),
  title,
  navigation,
  leftLogo = false,
  post = false,
  profileImage,
}) => {
  const { unreadCount } = useNotifications();
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.white,
          marginTop: Platform.OS === "android" ? 0 : marginTop,
          borderBottomColor:
            theme.mode === "dark" ? theme.border : "rgba(224, 227, 232, 0.5)",
        },
      ]}
    >
      <View
        style={{
          width: "90%",
          alignSelf: "center",
        }}
      >
        {leftLogo ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
            style={styles.touch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image style={styles.crown} source={Icons.crown} />
            <Image
              style={styles.profile}
              source={profileImage ? { uri: profileImage } : Icons.dp}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <MaterialCommunityIcons
              name="keyboard-backspace"
              style={{ fontSize: RFPercentage(2.8) }}
              color={theme.heading}
            />

            <Text style={[styles.title, { color: theme.heading }]}>
              {title}
            </Text>
          </TouchableOpacity>
        )}
        {leftLogo && (
          <Text
            style={[
              styles.title,
              { color: theme.heading, textAlign: "center" },
            ]}
          >
            {title}
          </Text>
        )}

        {post ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("Post")}
            activeOpacity={0.8}
            style={{ position: "absolute", right: 0 }}
          >
            <Text style={[styles.post, { color: theme.primary }]}>Post</Text>
          </TouchableOpacity>
        ) : dpNull ? null : (
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.8}
            style={[
              styles.notify,
              { backgroundColor: theme.white, borderColor: theme.border },
            ]}
          >
            <Image
              style={{ width: RFPercentage(3), height: RFPercentage(3) }}
              source={Icons.notify2}
            />
            {unreadCount > 0 && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "flex-end",
    alignSelf: "center",
    height: RFPercentage(10),
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 227, 232, 0.5)",
    paddingBottom: RFPercentage(1.7),
  },
  touch: {
    position: "absolute",
    left: 0,
    bottom: RFPercentage(0),
    zIndex: 9999,
  },
  crown: {
    right: RFPercentage(-3.9),
    top: RFPercentage(2.2),
    zIndex: 1,
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
  buez: {
    width: RFPercentage(5),
    height: RFPercentage(5),
  },
  title: {
    color: Colors.primary,
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(1),
  },
  post: {
    color: Colors.primary,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins-Medium",
  },
  profile: {
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.2),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  notify: {
    position: "absolute",
    right: 0,
    width: RFPercentage(5),
    height: RFPercentage(5),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: RFPercentage(1),
    elevation: 6,
    shadowColor: "rgba(93, 88, 88, 0.8)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    bottom: RFPercentage(0),
  },
  dot: {
    position: "absolute",
    top: RFPercentage(0.6),
    right: RFPercentage(0.5),
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.primary,
  },
});

export default Nav;
