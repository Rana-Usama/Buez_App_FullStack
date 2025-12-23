import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors"; // Adjust path to your config
import { useAppTheme } from "../../contexts/themeContext";

interface NavProps {
  title: string;
  showBack?: boolean;
}

const CustomNav = ({ title, showBack = true }: NavProps) => {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <View style={styles.content}>
        {/* Left Action: Back Button */}
        <View style={styles.actionContainer}>
          {showBack && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                {
                  backgroundColor:
                   Colors.primary,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Screen Name */}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: theme.heading }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* Right Action: Empty placeholder for centering balance */}
        <View style={styles.actionContainer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    // Extra height for iOS safe areas
    paddingTop: Platform.OS === "ios" ? 55 : 55,
    backgroundColor: Colors.primary,
    height: RFPercentage(14),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(161, 156, 156, 0.25)",
  },
  gradient: {
    height: RFPercentage(7),
    justifyContent: "center",
    borderBottomLeftRadius: 20, // Optional: Softens the UI
    borderBottomRightRadius: 20,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: RFPercentage(2),
  },
  actionContainer: {
    width: 40, // Fixed width to ensure title stays centered
    alignItems: "flex-start",
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Glass-morphism effect
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
});

export default CustomNav;
