import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";

interface EmptyStateProps {
  message: string;
  icon: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  const { theme } = useAppTheme();

  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor:
              theme.mode === "dark"
                ? Colors.tabsBackgroundDark
                : Colors.helpBackgroundLight,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={RFPercentage(5)}
          color={Colors.primary + "AA"}
        />
      </View>
      <Text style={[styles.emptyText, { color: theme.darkGrey }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(7),
  },
  iconCircle: {
    width: RFPercentage(11),
    height: RFPercentage(11),
    borderRadius: RFPercentage(5.5),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: RFPercentage(2),
  },
  emptyText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    width: "80%",
    lineHeight: RFPercentage(2.2),
  },
});

export default EmptyState;
