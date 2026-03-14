import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";

interface HelpTextProps {
  message: string;
}

const HelpText: React.FC<HelpTextProps> = ({ message }) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.helpContainer,
        {
          backgroundColor:
            theme.mode === "dark"
              ? Colors.tabsBackgroundDark
              : Colors.helpBackgroundLight,
        },
      ]}
    >
      <Ionicons
        name="information-circle"
        size={RFPercentage(2)}
        color={Colors.primary}
      />
      <Text style={[styles.helpText, { color: theme.darkGrey }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: RFPercentage(2),
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(1),
  },
  helpText: {
    flex: 1,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(1.8),
  },
});

export default HelpText;