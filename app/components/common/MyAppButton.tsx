import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, GestureResponderEvent, Platform } from "react-native";
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
  width?: number;
  marginTop?: number;
  title?: string;
  onPress?: (event: GestureResponderEvent) => void;
  navigation?: any;
}

const MyAppButton: React.FC<MyAppButtonProps> = ({
  loading = false,
  disabled = false,
  height = Platform.OS === 'android' ?  RFPercentage(6.2) : RFPercentage(5.5),
  width = Platform.OS === 'android' ?  RFPercentage(21.5) : RFPercentage(18.5),
  marginTop = RFPercentage(5),
  title = "Login",
  onPress,
  navigation,
}) => {
  const { theme } = useAppTheme();
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
          
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text
            style={{
              color: Colors.white,
              fontSize: RFPercentage(1.8),
              fontFamily: "Poppins_600SemiBold",
              textAlign: "center",
              marginHorizontal:5
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
