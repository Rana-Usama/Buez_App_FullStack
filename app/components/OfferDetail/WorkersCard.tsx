import React from "react";
import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";
import AvatarInitials from "../common/DefaultAvatars";

type Props = {
  isBulkRequest: boolean;
  numberOfWorkers: number;
  confirmedWorkers: any[];
  appliedWorkers: any[];
  currentUserId: string | null;
  getRequesterStatusText: () => string;
  getRemainingSlots: () => number;
  getSlotStatusText: () => string;
  t: any;
  theme: any;
  onViewApplications?: () => void;
};

export default function WorkersCard({
  isBulkRequest,
  numberOfWorkers,
  confirmedWorkers = [],
  appliedWorkers = [],
  currentUserId,
  getRequesterStatusText,
  getRemainingSlots,
  getSlotStatusText,
  t,
  theme,
  onViewApplications,
}: Props) {
  if (!isBulkRequest) return null;

  const isDark = theme.mode === "dark";
  const cardBg = isDark ? Colors.whiteAlpha05 : Colors.white;
  const cardBorder = isDark ? Colors.whiteAlpha08 : Colors.primaryAlpha07;
  const chip = (hex: string) => (isDark ? Colors.whiteAlpha10 : hex);

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={styles.header}>
        <View style={[styles.headerChip, { backgroundColor: chip(Colors.blueLight4) }]}>
          <Ionicons
            name="people"
            size={RFPercentage(2.2)}
            color={isDark ? theme.darkGrey : Colors.primary}
          />
        </View>
        <Text style={[styles.headerTitle, { color: theme.heading }]}>
          {t("offerDetail.helpersNeeded") || "Helpers Needed"}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statTile,
            { backgroundColor: chip("#F4F6FB"), borderColor: cardBorder },
          ]}
        >
          <View style={[styles.statIcon, { backgroundColor: chip(Colors.blueLight4) }]}>
            <Ionicons
              name="people-outline"
              size={RFPercentage(2)}
              color={isDark ? theme.darkGrey : Colors.primary}
            />
          </View>
          <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
            {t("offerDetail.totalHelpers") || "Total Helpers Needed"}
          </Text>
          <Text style={[styles.statValue, { color: theme.heading }]}>
            {numberOfWorkers}
          </Text>
        </View>

        <View
          style={[
            styles.statTile,
            { backgroundColor: chip("#EEF8EF"), borderColor: cardBorder },
          ]}
        >
          <View style={[styles.statIcon, { backgroundColor: chip("#DDF1DE") }]}>
            <Ionicons
              name="checkmark-circle"
              size={RFPercentage(2)}
              color={Colors.green2}
            />
          </View>
          <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
            {t("offerDetail.confirmed") || "Confirmed"}
          </Text>
          <Text style={[styles.statValue, styles.text]}>
            {confirmedWorkers.length}
          </Text>
        </View>
      </View>

      <View style={styles.statusWrap}>
        {currentUserId === null ? null : (
          <View style={styles.statusInner}>
            <Text style={[styles.statusText, { color: theme.darkGrey }]}>
              {currentUserId
                ? currentUserId === (appliedWorkers[0]?.userId || null)
                  ? getRequesterStatusText()
                  : getSlotStatusText()
                : getSlotStatusText()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.6),
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(1),
  },
  headerChip: {
    width: RFPercentage(3.6),
    height: RFPercentage(3.6),
    borderRadius: RFPercentage(1.2),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: RFPercentage(1.5),
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: RFPercentage(1.4),
    paddingHorizontal: RFPercentage(1),
  },
  statIcon: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(0.7),
  },
  statLabel: {
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  statValue: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    marginTop: RFPercentage(0.3),
  },
  statusWrap: {
    marginTop: RFPercentage(1.5),
  },
  statusInner: {
    alignItems: "center",
  },
  statusText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  applicationsTitle: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(1),
  },
  workerCard: {
    alignItems: "center",
    marginRight: RFPercentage(1.5),
    width: RFPercentage(8),
  },
  workerAvatar: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    marginBottom: RFPercentage(0.5),
  },
  workerName: {
    fontSize: RFPercentage(1.1),
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    width: "100%",
  },
  workerBadge: {
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(0.8),
    marginTop: RFPercentage(0.4),
  },
  workerBadgeText: {
    fontSize: RFPercentage(0.95),
    fontFamily: "Poppins_600SemiBold",
    lineHeight: RFPercentage(1.2),
  },
  text: { color: Colors.green2 },
});
