import React, { memo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

type Props = {
  navigation: any;
  groupTitle: string;
  memberCount: number;
  theme: any;
  onOpenDetails: () => void;
};

const GroupHeader = memo(({ navigation, groupTitle, memberCount, theme, onOpenDetails }: Props) => {
  return (
    <View style={[styles.header, styles.view]}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={RFPercentage(2.7)} color={theme.heading} />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8} onPress={onOpenDetails}>
        <View
          style={[
            styles.groupIconContainer,
            { backgroundColor: theme.mode === "dark" ? Colors.darkGrey2 : Colors.primary + "20" },
          ]}
        >
          <Ionicons name="people" size={RFPercentage(3.2)} color={theme.mode === "dark" ? Colors.white : Colors.primary} />
        </View>
      </TouchableOpacity>

      <View style={styles.headerTextContainer}>
        <Text style={[styles.headerTitle, { color: theme.heading }]} numberOfLines={1}>
          {groupTitle}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.darkGrey }]}>
          {memberCount} members
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(1.5),
    paddingTop: RFPercentage(6),
    borderBottomWidth: 1,
    gap: RFPercentage(1.2),
    width: "100%",
  },
  groupIconContainer: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(1),
  },
  headerTextContainer: { flex: 1, marginLeft: RFPercentage(1) },
  headerTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  headerSubtitle: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
  },
  view: { borderBottomColor: Colors.white5 },
});

export default GroupHeader;