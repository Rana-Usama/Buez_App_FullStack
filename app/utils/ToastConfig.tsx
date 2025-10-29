import React from "react";
import { Text, View, StyleSheet, Dimensions, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import { ToastConfig, ToastConfigParams } from "react-native-toast-message";

const { width } = Dimensions.get("window");

const baseToastStyle = {
  borderLeftWidth: RFPercentage(1.5),
  paddingHorizontal: RFPercentage(2),
  paddingVertical: RFPercentage(2),
  borderRadius: RFPercentage(1),
  marginHorizontal: RFPercentage(2),
  width: width * 0.85,
  marginTop: Platform.OS === "ios" ? RFPercentage(3) : RFPercentage(1),
};

type ThemedToastProps = {
  type: "success" | "error" | "info";
  text1?: string;
  text2?: string;
};

const ThemedToast = ({ type, text1, text2 }: ThemedToastProps) => {
  const { theme } = useAppTheme();

  const backgroundColor = theme.white;
  const borderLeftColor =
    type === "success"
      ? theme.primary
      : type === "error"
      ? "#dc3545"
      : "#17a2b8";

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
      {text1 && <Text style={[styles.text1, { color: theme.heading }]}>{text1}</Text>}
      {text2 && <Text style={[styles.text2, { color: theme.darkGrey }]}>{text2}</Text>}
    </View>
  );
};

// ✅ Properly typed ToastConfig
export const toastConfig: ToastConfig = {
  success: (params: ToastConfigParams<any>) => (
    <ThemedToast type="success" text1={params.text1} text2={params.text2} />
  ),
  error: (params: ToastConfigParams<any>) => (
    <ThemedToast type="error" text1={params.text1} text2={params.text2} />
  ),
  info: (params: ToastConfigParams<any>) => (
    <ThemedToast type="info" text1={params.text1} text2={params.text2} />
  ),
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
