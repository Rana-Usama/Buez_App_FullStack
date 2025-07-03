import React from "react";
import { Text, View, StyleSheet, Dimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";

const { width } = Dimensions.get("window");

const baseToastStyle = {
  borderLeftWidth: RFPercentage(1.5),
  paddingHorizontal: RFPercentage(2),
  paddingVertical: RFPercentage(2),
  borderRadius: RFPercentage(1),
  marginHorizontal: RFPercentage(2),
  width: width * 0.85,
};

const ThemedToast = ({ type, text1, text2 }) => {
  const { theme } = useAppTheme();

  const backgroundColor = theme.white;
  const borderLeftColor = type === "success" ? theme.primary : type === "error" ? "#dc3545" : "#17a2b8";

  return (
    <View
      style={[
        baseToastStyle,
        {
          backgroundColor,
          borderLeftColor,
          borderBottomWidth: 1,
          borderBottomColor: theme.lightWhite,
          borderRightWidth: 1,
          borderRightColor: theme.lightWhite,
          borderTopWidth: 1,
          borderTopColor: theme.lightWhite,
        },
      ]}
    >
      <Text style={[styles.text1, { color: theme.heading }]}>{text1}</Text>
      <Text style={[styles.text2, { color: theme.darkGrey }]}>{text2}</Text>
    </View>
  );
};

export const toastConfig = {
  success: ({ text1, text2 }) => <ThemedToast type="success" text1={text1} text2={text2} />,
  error: ({ text1, text2 }) => <ThemedToast type="error" text1={text1} text2={text2} />,
  info: ({ text1, text2 }) => <ThemedToast type="info" text1={text1} text2={text2} />,
};

const styles = StyleSheet.create({
  text1: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.7),
  },
  text2: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
  },
});
