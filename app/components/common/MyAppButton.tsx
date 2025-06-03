import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// Config
import Colors from "../../config/Colors";

// Props interface
interface MyAppButtonProps {
  loading?: boolean;
  disabled?: boolean;
  height?: number;
  width?: number;
  marginTop?: number;
  title?: string;
  onPress?: (event: GestureResponderEvent) => void;
  navigation?: any; 
}

const MyAppButton: React.FC<MyAppButtonProps> = ({
  loading = false,
  disabled = false,
  height = RFPercentage(6.2),
  width = RFPercentage(21),
  marginTop = RFPercentage(5),
  title = "Login",
  onPress,
  navigation,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={{
        width,
        height,
        borderRadius: RFPercentage(20),
        overflow: "hidden",
        marginTop,
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
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text
            style={{
              color: Colors.white,
              fontSize: RFPercentage(1.8),
              fontFamily: "Poppins_500Medium",
            }}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default MyAppButton;
