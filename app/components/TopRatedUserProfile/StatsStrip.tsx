import React from "react";
import { View, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../config/Colors";

type Props = {
  stats: any;
  theme: any;
  t: any;
};

const StatItem = ({ label, value, icon, color }: any) => (
  <View style={{ flex: 1, alignItems: "center" ,}}>
    <View style={{ width: RFPercentage(5), height: RFPercentage(5), borderRadius: RFPercentage(2.5), justifyContent: "center", alignItems: "center", marginBottom: RFPercentage(1) }}>
      <Ionicons name={icon} size={RFPercentage(2.5)} color={color} />
    </View>
    <Text style={{ fontSize: RFPercentage(2), fontFamily: "Poppins_700Bold", marginBottom: RFPercentage(0.3), color:Colors.darkGrey }}>{value}</Text>
    <Text style={{ fontSize: RFPercentage(1.1), fontFamily: "Poppins_500Medium", textAlign: "center", color:Colors.darkGrey2 }}>{label}</Text>
  </View>
);

export default function StatsStrip({ stats, theme, t }: Props) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: RFPercentage(3), marginTop: RFPercentage(-3), padding: RFPercentage(2), backgroundColor: theme.white, borderRadius: RFPercentage(2) }}>
      <StatItem label={t("profileRank.txt6")} value={stats?.activeTasks || 0} icon="flash-outline" color="#3498db" />
      <View style={{ width: 1, backgroundColor: "rgba(187,187,187,0.73)", marginHorizontal: RFPercentage(0.5) }} />
      <StatItem label={t("profileRank.txt23")} value={stats?.completedTasks || 0} icon="checkmark-circle-outline" color="#2ecc71" />
      <View style={{ width: 1, backgroundColor: "rgba(187,187,187,0.73)", marginHorizontal: RFPercentage(0.5) }} />
      <StatItem label="Member Since" value={stats?.memberSince?.split(" ")[2] || "2024"} icon="calendar-outline" color="#e67e22" />
    </View>
  );
}