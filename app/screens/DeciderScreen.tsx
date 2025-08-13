import React from "react";
import { StyleSheet, Image, View } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useAppTheme } from "../contexts/themeContext";

function DeciderScreen() {
  const { theme } = useAppTheme();
  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.white }]}>
        <Image style={styles.img} source={Icons.logo} resizeMode="contain" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  img: { width: RFPercentage(15), height: RFPercentage(15) },
});

export default DeciderScreen;
