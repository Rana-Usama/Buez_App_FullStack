import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { Octicons } from "@expo/vector-icons";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function SuccessScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <LinearGradient
      colors={
        theme.mode === "dark"
          ? ["#000000", "#1a1a1a"]
          : [Colors.primary, Colors.success2]
      }
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        backgroundColor={theme.white}
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />
      <Octicons
        name={"check-circle"}
        style={styles.icon}
        color={theme.mode === "dark" ? Colors.primary : Colors.white}
      />

      {/* Icon */}
      <Text
        style={[
          styles.txt,
          { color: theme.mode === "dark" ? Colors.primary : Colors.white },
        ]}
      >
        {t("successScreen.txt1")}
      </Text>
      <TouchableOpacity
        style={[
          styles.buttonContainer,
          {
            backgroundColor:
              theme.mode === "dark" ? Colors.primary : Colors.white,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("TabNavigator")}
      >
        <Text
          style={[
            styles.home,
            { color: theme.mode === "dark" ? Colors.white : Colors.primary },
          ]}
        >
          {t("successScreen.txt2")}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    backgroundColor: Colors.white,
    position: "absolute",
    bottom: RFPercentage(8),
    width: RFPercentage(19),
    height: RFPercentage(5.5),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(20),
  },
  icon: { fontSize: RFPercentage(12) },
  txt: {
    color: Colors.white,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(3),
    textAlign: "center",
    marginHorizontal: RFPercentage(5),
  },
  home: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
});

export default SuccessScreen;
