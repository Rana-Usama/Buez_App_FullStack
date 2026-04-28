import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { BlurView } from "expo-blur";
import Colors from "../../config/Colors";

const { width } = Dimensions.get("window");

type BannerState =
  | "active"
  | "warning"
  | "urgent"
  | "warning_with_card"
  | "autorenew";

interface BannerConfig {
  gradientColors: [string, string];
  gradientColors2: [string, string];
  icon: keyof typeof Feather.glyphMap;
  label: string;
  title: string;
  badgeColor?: string;
}

const BANNER_CONFIG: Record<BannerState, BannerConfig> = {
  active: {
    gradientColors: ["#555690ff", "#4a357bff"],
    gradientColors2: ["#6366F180", "#8B5CF680"],
    icon: "gift",
    label: "Free trial active",
    title: "Enjoying premium features",
    badgeColor: "#ae8bffff",
  },
  warning: {
    gradientColors: ["#be9e66ff", "#774725ff"],
    gradientColors2: ["#F59E0B80", "#F9731680"],
    icon: "clock",
    label: "Trial expiring soon",
    title: "Subscribe to keep access",
    badgeColor: "#F59E0B",
  },
  urgent: {
    gradientColors: ["#874c4cff", "#a22626ff"],
    gradientColors2: ["#EF444480", "#DC262680"],
    icon: "alert-triangle",
    label: "Trial expires tomorrow!",
    title: "Upgrade now to continue",
    badgeColor: "#EF4444",
  },
  warning_with_card: {
    gradientColors: ["#558f7cff", "#306b58ff"],
    gradientColors2: ["#10B98180", "#05966980"],
    icon: "credit-card",
    label: "Trial ending soon",
    title: "Your plan will start automatically",
    badgeColor: "#10B981",
  },
  autorenew: {
    gradientColors: ["#4b5c76ff", "#27437fff"],
    gradientColors2: ["#3B82F680", "#2563EB80"],
    icon: "refresh-cw",
    label: "Starting tomorrow",
    title: "Monthly plan will begin automatically",
    badgeColor: "#3B82F6",
  },
};

type TestScenario =
  | "no_card_active"
  | "no_card_warning"
  | "no_card_urgent"
  | "card_active"
  | "card_warning"
  | "card_autorenew"
  | "card_warning_with_card"
  | "card_autorenew_test";

const TEST_SCENARIO: TestScenario = "card_active";

const getTestData = (scenario: TestScenario) => {
  switch (scenario) {
    case "no_card_active":
      return { days: 12, hasCard: false };
    case "no_card_warning":
      return { days: 4, hasCard: false };
    case "no_card_urgent":
      return { days: 1, hasCard: false };
    case "card_active":
      return { days: 12, hasCard: true };
    case "card_warning":
      return { days: 4, hasCard: true };
    case "card_warning_with_card":
      return { days: 4, hasCard: true, forceState: "warning_with_card" };
    case "card_autorenew_test":
      return { days: 1, hasCard: true, forceState: "autorenew" };
    default:
      return { days: 12, hasCard: false };
  }
};

const FreeTrialBannerTest = ({ theme }: any) => {
  const { days, hasCard, forceState } = getTestData(TEST_SCENARIO);

  let state: BannerState = "active";

  if (forceState) {
    state = forceState;
  } else {
    if (hasCard) {
      if (days <= 1) state = "urgent";
      else if (days <= 5) state = "warning";
      else state = "active";
    } else {
      if (days <= 1) state = "urgent";
      else if (days <= 5) state = "warning";
      else state = "active";
    }
  }

  const config = BANNER_CONFIG[state];
  const daysLabel = days === 1 ? "1 day left" : `${days} days left`;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => console.log("Navigate to Subscription")}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={
          theme?.mode === "dark"
            ? config.gradientColors2
            : config.gradientColors
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <View style={styles.content}>
          {/* Icon with pulse effect */}
          <View style={styles.iconWrapper}>
            <View
              style={[styles.pulseRing, { borderColor: config.badgeColor }]}
            />
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${config.badgeColor}20` },
              ]}
            >
              <Feather
                name={config.icon}
                size={RFPercentage(2.5)}
                color="#fff"
              />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textBlock}>
            <View style={styles.labelContainer}>
              <Text style={styles.label} numberOfLines={1}>
                {config.label}
              </Text>
              <View
                style={[styles.badge, { backgroundColor: config.badgeColor }]}
              />
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {config.title}
            </Text>
          </View>

          {/* Days Pill */}
          <View
            style={[styles.pill, { backgroundColor: `${config.badgeColor}30` }]}
          >
            <Feather name="calendar" size={RFPercentage(1.4)} color="#fff" />
            <Text style={styles.pillText}>{daysLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: RFPercentage(2),
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(1),
  },
  banner: {
    borderRadius: RFPercentage(2.5),
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.8),
    gap: RFPercentage(1.5),
  },
  decorativeCircle1: {
    position: "absolute",
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -width * 0.15,
    right: -width * 0.1,
  },
  decorativeCircle2: {
    position: "absolute",
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    backgroundColor: "rgba(255,255,255,0.1)",
    bottom: -width * 0.1,
    left: -width * 0.05,
  },
  iconWrapper: {
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(2.75),
    borderWidth: 2,
    opacity: 0.6,
    top: -RFPercentage(0.5),
    left: -RFPercentage(0.5),
  },
  iconContainer: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  textBlock: {
    flex: 1,
    gap: RFPercentage(0.5),
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
  },
  badge: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: RFPercentage(0.4),
  },
  label: {
    fontSize: RFPercentage(1.4),
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: RFPercentage(1.4),
    color: Colors.white,
    fontFamily: "Poppins_400Regular",
    letterSpacing: -0.1,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    borderRadius: RFPercentage(2),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.7),
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pillText: {
    fontSize: RFPercentage(1.3),
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
  },
});

export default FreeTrialBannerTest;
