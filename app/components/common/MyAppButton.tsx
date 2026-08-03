import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  GestureResponderEvent,
  Platform, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// Config
import Colors from "../../config/Colors";
import { useAppTheme } from "../../contexts/themeContext";

// Props interface
interface MyAppButtonProps {
  loading?: boolean;
  disabled?: boolean;
  height?: number;
  width?: any;
  marginTop?: number;
  title?: string;
  onPress?: (event: GestureResponderEvent) => void;
  navigation?: any;
  borderRadius? :any
}

const MyAppButton: React.FC<MyAppButtonProps> = ({
  loading = false,
  disabled = false,
  height = Platform.OS === "android" ? RFPercentage(6.2) : RFPercentage(6.5),
  width = "100%",
  marginTop = RFPercentage(5),
  title = "Login",
  onPress,
  navigation,
  borderRadius
}) => {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={{
        width,
        height,
        borderRadius: borderRadius ? borderRadius : RFPercentage(2),
        overflow: "hidden",
        marginTop,
        opacity: disabled ? 0.5 : 1,
      }}
      onPress={onPress}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.success2]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.linearGradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text
            numberOfLines={1}
            style={styles.text}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default MyAppButton;

const styles = StyleSheet.create({
  linearGradient: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
  text: {
              color: Colors.white,
              fontSize: RFPercentage(1.8),
              fontFamily: "Poppins_600SemiBold",
              textAlign: "center",
              marginHorizontal: 5,
            },
});
