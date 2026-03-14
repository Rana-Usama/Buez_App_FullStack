import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";

interface EmptyStateProps {
  message: string;
  icon: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  const { theme } = useAppTheme();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={icon as any}
        size={RFPercentage(6)}
        color={theme.darkGrey + "60"}
      />
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
    paddingVertical: RFPercentage(8),
  },
  emptyText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(2),
    textAlign: "center",
    width: "80%",
  },
});

export default EmptyState;