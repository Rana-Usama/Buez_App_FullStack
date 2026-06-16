import React from "react";
import { View, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  stats: any;
  theme: any;
  t: any;
};

const StatItem = ({ label, value, icon, color, theme }: any) => (
  <View style={{ flex: 1, alignItems: "center" }}>
    <View
      style={{
        width: RFPercentage(4.4),
        height: RFPercentage(4.4),
        borderRadius: RFPercentage(1.4),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: RFPercentage(0.8),
        backgroundColor: color + "15",
      }}
    >
      <Ionicons name={icon} size={RFPercentage(2.2)} color={color} />
    </View>
    <Text
      style={{
        fontSize: RFPercentage(2),
        fontFamily: "Poppins_600SemiBold",
        marginBottom: RFPercentage(0.2),
        color: theme.heading,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: RFPercentage(1.1),
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        color: theme.darkGrey,
      }}
    >
      {label}
    </Text>
  </View>
);

export default function StatsStrip({ stats, theme, t }: Props) {
  const isDark = theme.mode === "dark";
  const divider = isDark ? "rgba(255,255,255,0.10)" : "rgba(17,24,39,0.08)";

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: RFPercentage(3),
        marginTop: RFPercentage(-3),
        padding: RFPercentage(2),
        backgroundColor: isDark ? "#1A1D2C" : "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: divider,
      }}
    >
      <StatItem
        label={t("profileRank.txt6")}
        value={stats?.activeTasks || 0}
        icon="flash-outline"
        color="#3498db"
        theme={theme}
      />
      <View
        style={{
          width: 1,
          backgroundColor: divider,
          marginHorizontal: RFPercentage(0.5),
        }}
      />
      <StatItem
        label={t("profileRank.txt23")}
        value={stats?.completedTasks || 0}
        icon="checkmark-circle-outline"
        color="#2ecc71"
        theme={theme}
      />
      <View
        style={{
          width: 1,
          backgroundColor: divider,
          marginHorizontal: RFPercentage(0.5),
        }}
      />
      <StatItem
        label="Member Since"
        value={stats?.memberSince?.split(" ")[2] || "2024"}
        icon="calendar-outline"
        color="#e67e22"
        theme={theme}
      />
    </View>
  );
}
