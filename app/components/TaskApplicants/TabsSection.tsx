import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { TABS } from "../../config/constants";

interface TabsSectionProps {
  activeTab: "applied" | "confirmed";
  onTabChange: (tab: "applied" | "confirmed") => void;
  appliedCount: number;
  confirmedCount: number;
  t: (key: string, options?: any) => string;
}

const TabsSection: React.FC<TabsSectionProps> = ({
  activeTab,
  onTabChange,
  appliedCount,
  confirmedCount,
  t,
}) => {
  const { theme } = useAppTheme();

  const renderCountBadge = (count: number, active: boolean) => (
    <View
      style={[
        styles.countBadge,
        {
          backgroundColor: active ? Colors.white3 : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.countBadgeText,
          { color: active ? "#FFF" : theme.darkGrey },
        ]}
      >
        {count}
      </Text>
    </View>
  );

  return (
    <View style={styles.tabsContainer}>
      <View
        style={[
          styles.tabsBackground,
          {
            backgroundColor:
              theme.mode === "dark"
                ? Colors.tabsBackgroundDark
                : Colors.tabsBackgroundLight,
                borderWidth:1,
                borderColor:theme.border
          },
        ]}
      >
        {/* Applied Tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.APPLIED && styles.activeTab]}
          onPress={() => onTabChange(TABS.APPLIED)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={
              activeTab === TABS.APPLIED
                ? ["#465493ff", "#465493ff"]
                : ["transparent", "transparent"]
            }
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons
              name="person-add"
              size={RFPercentage(1.9)}
              color={activeTab === TABS.APPLIED ? "#FFF" : theme.darkGrey}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                {
                  color: activeTab === TABS.APPLIED ? "#FFF" : theme.darkGrey,
                },
              ]}
            >
              {t("taskApplicants.applicantsTab")}
            </Text>
            {renderCountBadge(appliedCount, activeTab === TABS.APPLIED)}
          </LinearGradient>
        </TouchableOpacity>

        {/* Confirmed Tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.CONFIRMED && styles.activeTab]}
          onPress={() => onTabChange(TABS.CONFIRMED)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={
              activeTab === TABS.CONFIRMED
                  ? ["#465493ff", "#465493ff"]
                : ["transparent", "transparent"]
            }
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons
              name="checkmark-circle"
              size={RFPercentage(1.9)}
              color={activeTab === TABS.CONFIRMED ? "#FFF" : theme.darkGrey}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                {
                  color: activeTab === TABS.CONFIRMED ? "#FFF" : theme.darkGrey,
                },
              ]}
            >
              {t("taskApplicants.confirmedTab")}
            </Text>
            {renderCountBadge(confirmedCount, activeTab === TABS.CONFIRMED)}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2.5),
    marginBottom: RFPercentage(1.5),
  },
  tabsBackground: {
    flexDirection: "row",
    borderRadius: RFPercentage(3),
    padding: RFPercentage(0.6),
    gap: RFPercentage(0.6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    borderRadius: RFPercentage(2.6),
    overflow: "hidden",
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.3),
    paddingHorizontal: RFPercentage(1.5),
    gap: RFPercentage(0.7),
  },
  tabText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  countBadge: {
    minWidth: RFPercentage(2.6),
    height: RFPercentage(2.6),
    borderRadius: RFPercentage(1.3),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(0.6),
  },
  countBadgeText: {
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_700Bold",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default TabsSection;
