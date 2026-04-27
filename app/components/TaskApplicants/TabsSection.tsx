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

  return (
    <View style={styles.tabsContainer}>
      <View
        style={[
          styles.tabsBackground,
          {
            backgroundColor:
              theme.mode === "dark" ? Colors.tabsBackgroundDark : Colors.tabsBackgroundLight,
          },
        ]}
      >
        {/* Applied Tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.APPLIED && styles.activeTab]}
          onPress={() => onTabChange(TABS.APPLIED)}
        >
          <LinearGradient
            colors={
              activeTab === TABS.APPLIED
                ? ["#717793ff", "#465493ff"]
                : ["transparent", "transparent"]
            }
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons
              name="person-add"
              size={RFPercentage(2)}
              color={activeTab === TABS.APPLIED ? "#FFF" : theme.darkGrey}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === TABS.APPLIED ? "#FFF" : theme.darkGrey,
                },
              ]}
            >
              {t("taskApplicants.applicantsTab")} ({appliedCount})
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Confirmed Tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.CONFIRMED && styles.activeTab]}
          onPress={() => onTabChange(TABS.CONFIRMED)}
        >
          <LinearGradient
            colors={
              activeTab === TABS.CONFIRMED
                ? [Colors.statusAlertSuccess, "#2E7D32"]
                : ["transparent", "transparent"]
            }
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons
              name="checkmark-circle"
              size={RFPercentage(2)}
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
              {t("taskApplicants.confirmedTab")} ({confirmedCount})
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  tabsBackground: {
    flexDirection: "row",
    borderRadius: RFPercentage(1),
    padding: RFPercentage(0.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    borderRadius: RFPercentage(1),
    overflow: "hidden",
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(2),
    gap: RFPercentage(0.8),
  },
  tabText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
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