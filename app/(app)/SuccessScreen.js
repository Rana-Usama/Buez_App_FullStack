import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { Octicons } from "@expo/vector-icons";

// components
import MyAppButton from "../../components/common/MyAppButton";

// config
import Colors from "../../config/Colors";
import { router } from "expo-router";

function SuccessScreen({ navigation }) {
  return (
    <LinearGradient colors={[Colors.primary, "#4557B0"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
      <Octicons name={"check-circle"} style={{ fontSize: RFPercentage(14) }} color={Colors.white} />

      {/* Gif */}
      <Text style={{ color: Colors.white, fontSize: RFPercentage(2.6), fontFamily: "Poppins_500Medium", marginTop: RFPercentage(3) }}>Request Posted Successfully</Text>

      <TouchableOpacity style={styles.buttonContainer} activeOpacity={0.8} onPress={() => router.push("/Home")}>
        <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.8), fontFamily: "Poppins_500Medium" }}>Home</Text>
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
});

export default SuccessScreen;
