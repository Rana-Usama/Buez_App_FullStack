import React, { useMemo } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../contexts/user.context";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const FREE_TRIAL_DAYS = 14;

type BannerState =
  | "active"
  | "warning_no_card"
  | "urgent_no_card"
  | "warning_with_card"
  | "autorenew";

interface BannerConfig {
  gradientColors: [string, string];
  gradientColorsDark: [string, string];
  icon: keyof typeof Feather.glyphMap;
  label: string;
  title: string;
  badgeColor: string;
}

const FreeTrialBanner: React.FC = () => {
  const { userData } = useUser();
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const { t } = useTranslation();

  const BANNER_CONFIG: Record<BannerState, BannerConfig> = {
    active: {
      gradientColors: ["#555690ff", "#4a357bff"],
      gradientColorsDark: ["#6366F180", "#8B5CF680"],
      icon: "gift",
      label: t("freeTrialBanner.active.label"),
      title: t("freeTrialBanner.active.title"),
      badgeColor: "#ae8bffff",
    },
    warning_no_card: {
      gradientColors: ["#F59E0B", "#F97316"],
      gradientColorsDark: ["#F59E0B80", "#F9731680"],
      icon: "alert-circle",
      label: t("freeTrialBanner.warning_no_card.label"),
      title: t("freeTrialBanner.warning_no_card.title"),
      badgeColor: "#F59E0B",
    },
    urgent_no_card: {
      gradientColors: ["#EF4444", "#DC2626"],
      gradientColorsDark: ["#EF444480", "#DC262680"],
      icon: "alert-triangle",
      label: t("freeTrialBanner.urgent_no_card.label"),
      title: t("freeTrialBanner.urgent_no_card.title"),
      badgeColor: "#EF4444",
    },
    warning_with_card: {
      gradientColors: ["#10B981", "#059669"],
      gradientColorsDark: ["#10B98180", "#05966980"],
      icon: "clock",
      label: t("freeTrialBanner.warning_with_card.label"),
      title: t("freeTrialBanner.warning_with_card.title"),
      badgeColor: "#10B981",
    },
    autorenew: {
      gradientColors: ["#3B82F6", "#2563EB"],
      gradientColorsDark: ["#3B82F680", "#2563EB80"],
      icon: "refresh-cw",
      label: t("freeTrialBanner.autorenew.label"),
      title: t("freeTrialBanner.autorenew.title"),
      badgeColor: "#3B82F6",
    },
  };

  const { daysLeft, bannerState } = useMemo(() => {
    if (!userData?.isFreeTrial || !userData?.freeTrialStartedAt) {
      return { daysLeft: 0, bannerState: null };
    }

    const startDate =
      userData.freeTrialStartedAt?.toDate?.() ??
      new Date(userData.freeTrialStartedAt);

    const now = new Date();
    const msElapsed = now.getTime() - startDate.getTime();
    const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
    const remaining = FREE_TRIAL_DAYS - daysElapsed;

    if (remaining <= 0) return { daysLeft: 0, bannerState: null };

    const hasCard = !!userData?.hasPaymentMethod;

    let state: BannerState = "active";

    if (hasCard) {
      if (remaining <= 1) state = "autorenew";
      else if (remaining <= 5) state = "warning_with_card";
      else state = "active";
    } else {
      if (remaining <= 1) state = "urgent_no_card";
      else if (remaining <= 5) state = "warning_no_card";
      else state = "active";
    }

    return { daysLeft: remaining, bannerState: state };
  }, [userData]);

  // Determine if banner should be clickable and navigate to subscription
  const shouldNavigateToSubscription = () => {
    return bannerState === "warning_no_card" || bannerState === "urgent_no_card";
  };

  const handlePress = () => {
    if (shouldNavigateToSubscription()) {
      navigation.navigate("Subscription");
    }
  };

  if (!bannerState) return null;

  const config = BANNER_CONFIG[bannerState];

  const getDaysLabel = () => {
    if (bannerState === "autorenew") return "Starts tomorrow";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  return (
    <TouchableOpacity
      activeOpacity={shouldNavigateToSubscription() ? 0.8 : 1}
      onPress={handlePress}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={
          theme?.mode === "dark"
            ? config.gradientColorsDark
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
            <Text style={styles.pillText}>{getDaysLabel()}</Text>
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
    fontSize: RFPercentage(1.3),
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: RFPercentage(1.6),
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
    letterSpacing: -0.2,
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
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
  },
});

export default FreeTrialBanner;