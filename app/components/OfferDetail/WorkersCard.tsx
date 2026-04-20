import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";

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

export default function WorkersCard({ isBulkRequest, numberOfWorkers, confirmedWorkers = [], appliedWorkers = [], currentUserId, getRequesterStatusText, getRemainingSlots, getSlotStatusText, t, theme, onViewApplications }: Props) {
  if (!isBulkRequest) return null;
  return (
    <View style={{ borderRadius: 16, padding: RFPercentage(2), marginBottom: RFPercentage(2), borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", backgroundColor: theme.mode === "dark" ? Colors.lightGrey + "10" : Colors.primary + "05" }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: RFPercentage(1.5) }}>
        <Ionicons name="people" size={RFPercentage(2.2)} color={Colors.primary} />
        <Text style={{ marginLeft: RFPercentage(0.5), fontSize: RFPercentage(1.8), fontFamily: "Poppins_600SemiBold", color: theme.heading }}>{t("offerDetail.helpersNeeded") || "Helpers Needed"}</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: RFPercentage(1) }}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(2), justifyContent: "center", alignItems: "center", marginBottom: RFPercentage(0.5), backgroundColor: Colors.primary + "20" }}>
            <Ionicons name="people-outline" size={RFPercentage(2)} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: RFPercentage(1.3), color: theme.darkGrey , fontFamily: "Poppins_400Regular"}}>{t("offerDetail.totalHelpers") || "Total Helpers Needed"}</Text>
          <Text style={{ fontSize: RFPercentage(1.8), color: theme.heading, fontFamily: "Poppins_600SemiBold" }}>{numberOfWorkers}</Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <View style={{ width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(2), justifyContent: "center", alignItems: "center", marginBottom: RFPercentage(0.5), backgroundColor: "#4CAF50" + "20" }}>
            <Ionicons name="checkmark-circle" size={RFPercentage(2)} color="#4CAF50" />
          </View>
          <Text style={{ fontSize: RFPercentage(1.3), color: theme.darkGrey, fontFamily: "Poppins_400Regular" }}>{t("offerDetail.confirmed") || "Confirmed"}</Text>
          <Text style={{ fontSize: RFPercentage(1.8), color: "#4CAF50" , fontFamily: "Poppins_600SemiBold"}}>{confirmedWorkers.length}</Text>
        </View>
      </View>

      <View style={{ marginTop: RFPercentage(1) }}>
        {currentUserId === null ? null : (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: RFPercentage(1.5), color: theme.darkGrey, fontFamily: "Poppins_400Regular" }}>{currentUserId ? (currentUserId === (appliedWorkers[0]?.userId || null) ? getRequesterStatusText() : getSlotStatusText()) : getSlotStatusText()}</Text>
          </View>
        )}
      </View>

      {appliedWorkers?.length > 0 && (
        <>
          <Text style={{ fontSize: RFPercentage(1.3), fontFamily: "Poppins_600SemiBold", marginTop: RFPercentage(1), marginBottom: RFPercentage(1), color: theme.darkGrey }}>{t("offerDetail.applications") || "Applications"} ({appliedWorkers.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appliedWorkers.map((worker, idx) => (
              <View key={worker.userId || idx} style={{ alignItems: "center", marginRight: RFPercentage(1.5), width: RFPercentage(8) }}>
                <Image source={worker.profileImage ? { uri: worker.profileImage } : Icons.dp} style={{ width: RFPercentage(5), height: RFPercentage(5), borderRadius: RFPercentage(2.5), marginBottom: RFPercentage(0.5) }} />
                <Text style={{ fontSize: RFPercentage(1.1), textAlign: "center", color: theme.heading, fontFamily: "Poppins_600SemiBold" }}>{worker.userName}</Text>
                <View style={{ paddingHorizontal: RFPercentage(1), paddingVertical: RFPercentage(0.3), borderRadius: RFPercentage(0.8), marginTop: RFPercentage(0.3), backgroundColor: (confirmedWorkers.some(w => w.userId === worker.userId) ? "#4CAF50" : Colors.primary) + "20" }}>
                  <Text style={{ color: confirmedWorkers.some(w => w.userId === worker.userId) ? "#4CAF50" : Colors.primary, fontSize: RFPercentage(0.9), fontFamily: "Poppins_600SemiBold" }}>{confirmedWorkers.some(w => w.userId === worker.userId) ? (t("offerDetail.confirmed") || "Confirmed") : (t("offerDetail.pending") || "Pending")}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}