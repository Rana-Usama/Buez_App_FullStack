import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { useAppTheme } from "../contexts/themeContext";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Icons } from "../config/theme";

const InitialScreen = () => {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <Image style={styles.image} source={Icons.notActive} resizeMode="contain" />
      <Text style={[styles.title, { color: theme.darkGrey }]}>
        Checking for Active Subscription
      </Text>
      <Text style={[styles.subtitle, { color: theme.darkGrey }]}>Loading...</Text>
    </View>
  );
};

export default InitialScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: RFPercentage(60),
    height: RFPercentage(30),
    
  },
  title: {
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.9),
    marginTop: RFPercentage(3),
  },
  subtitle: {
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.6),
    marginTop: RFPercentage(0.5),
  },
});
