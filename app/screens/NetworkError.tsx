import React from "react";
import { StyleSheet, Text, View, StatusBar } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../contexts/themeContext";

const NetworkError: React.FC = () => {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.networkContainer, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <Feather name="wifi-off" size={RFPercentage(6)} color={theme.darkGrey} />
      <Text style={[styles.networkText, { color: theme.darkGrey }]}>
        No Internet Connection
      </Text>
    </View>
  );
};

export default NetworkError;

const styles = StyleSheet.create({
  networkContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffffff",
  },
  networkText: {
    fontSize: RFPercentage(1.8),
    color: "rgba(186, 186, 186, 1)",
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(1),
  },
});
