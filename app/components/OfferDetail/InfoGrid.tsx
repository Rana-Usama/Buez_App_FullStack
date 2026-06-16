import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";

type Props = {
  postRequest: any;
  theme: any;
  getConvertedCompensation: (item: any) => string | null;
  t: any;
};

export default function InfoGrid({
  postRequest,
  theme,
  getConvertedCompensation,
  t,
}: Props) {
  const isDark = theme.mode === "dark";

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(17,24,39,0.08)";
  const chipBg = (hex: string) =>
    isDark ? "rgba(255,255,255,0.10)" : hex;

  const isMonetary = postRequest?.compensationType === "Monitarely";

  return (
    <View style={styles.grid}>
      {/* Location */}
      <View
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <View style={[styles.iconChip, { backgroundColor: chipBg("#E3F0FF") }]}>
          <Ionicons
            name="location"
            size={RFPercentage(2.2)}
            color={isDark ? theme.darkGrey : Colors.primary}
          />
        </View>
        <Text style={[styles.label, { color: theme.darkGrey }]}>
          {t("details.txt4")}
        </Text>
        <Text style={[styles.value, { color: theme.heading }]} numberOfLines={2}>
          {postRequest?.address?.name || t("details.txt16")}
        </Text>
      </View>

      {/* Compensation */}
      <View
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <View style={[styles.iconChip, { backgroundColor: chipBg("#E6F7E9") }]}>
          <Ionicons
            name={isMonetary ? "cash" : "gift"}
            size={RFPercentage(2.2)}
            color={isMonetary ? "#34A853" : "#FB8C00"}
          />
        </View>
        <Text style={[styles.label, { color: theme.darkGrey }]}>
          {t("home.txt10")}
        </Text>
        <Text
          style={[
            styles.value,
            { color: isDark ? theme.darkGrey : Colors.primary },
          ]}
          numberOfLines={2}
        >
          {isMonetary
            ? getConvertedCompensation(postRequest)
            : postRequest?.otherCompensation || t("details.txt17")}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: RFPercentage(1.5),
    marginBottom: RFPercentage(1.8),
  },
  card: {
    width: "100%",
    borderRadius: 16,
    padding: RFPercentage(1.6),
    borderWidth: 1,
  },
  iconChip: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(1.4),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  label: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  value: {
    marginTop: RFPercentage(0.5),
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
});
