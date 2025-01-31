import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// Config
import Colors from "../../config/Colors";

function MyAppButton({ disabled = false, height = RFPercentage(6.2), onPress, width = RFPercentage(21), marginTop = RFPercentage(5), title = "Login", navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={{
        width: width,
        height: height,
        borderRadius: RFPercentage(20),
        overflow: "hidden",
        marginTop: marginTop,
      }}
      onPress={onPress}
    >
      <LinearGradient
        colors={[Colors.primary, "#4557B0"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ color: Colors.white, fontSize: RFPercentage(1.8), fontFamily: "Poppins_500Medium" }}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default MyAppButton;
