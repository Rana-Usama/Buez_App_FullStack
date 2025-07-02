import React from "react";
import { StyleSheet, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";

function DeciderScreen() {
  return (
    <>
      <LinearGradient colors={[Colors.white, Colors.white]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <Image style={styles.img} source={Icons.buez} />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  img: { width: RFPercentage(10), height: RFPercentage(10) },
});

export default DeciderScreen;
