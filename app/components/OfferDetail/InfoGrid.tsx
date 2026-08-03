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

  const cardBg = isDark ? Colors.whiteAlpha04 : Colors.white;
  const cardBorder = isDark ? Colors.whiteAlpha10 : Colors.slateAlpha08;
  const chipBg = (hex: string) =>
    isDark ? Colors.whiteAlpha10 : hex;

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
            color={isMonetary ? Colors.green2 : "#FB8C00"}
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
