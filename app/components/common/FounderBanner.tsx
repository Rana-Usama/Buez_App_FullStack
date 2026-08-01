import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/user.context";
import { useAppTheme } from "../../contexts/themeContext";
import { Icons } from "../../config/theme";
import {
  getFounderInfo,
  isFounderActive,
  getFounderDaysRemaining,
} from "../../services/Founder.service";
import Colors from "../../config/Colors";

const { width } = Dimensions.get("window");

// Premium founder accent (warm gold) — reused across the banner.
const GOLD = "#F4B740";
const GOLD_SOFT = "rgba(244,183,64,0.35)";

const FounderBanner: React.FC = () => {
  const { userData } = useUser();
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const isDark = theme.mode === "dark";

  const { founder, active, daysLeft } = useMemo(() => {
    const info = getFounderInfo(userData);
    return {
      founder: info,
      active: isFounderActive(userData),
      daysLeft: getFounderDaysRemaining(userData),
    };
  }, [userData]);

  // Not a founder → render nothing.
  if (!founder) return null;

  const statusText = !active
    ? t("founderBanner.expired")
    : daysLeft === 1
      ? t("founderBanner.dayLeft")
      : t("founderBanner.daysLeft", { days: daysLeft });

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={
          isDark
            ? ["#2A2E52", "#1E2140", "#141628"]
            : ["#2e3d8648", "#253275db", "#1A2358"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        {/* Decorative depth */}
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />
     

        <View style={styles.content}>
          {/* Founder badge (unchanged icon) inside a subtle glass ring */}
          <View style={styles.badgeRing}>
            <Image
              source={Icons.founderBadge}
              style={styles.badgeIcon}
              resizeMode="contain"
            />
          </View>

          {/* Text */}
          <View style={styles.textBlock}>
            <View style={styles.pillRow}>
              <Feather name="award" size={RFPercentage(1.5)} color={GOLD} />
              <Text style={styles.pillText} numberOfLines={1}>
                {t("founderBanner.badge")}
              </Text>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {t("founderBanner.title")}
            </Text>

            <View style={styles.statusRow}>
              <Feather
                name={active ? "clock" : "alert-circle"}
                size={RFPercentage(1.4)}
                color={active ? "rgba(255,255,255,0.65)" : GOLD}
              />
              <Text
                style={[styles.status, !active && styles.statusExpired]}
                numberOfLines={1}
              >
                {statusText}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: RFPercentage(1.7),
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(0.5),
  },
  banner: {
    borderRadius: RFPercentage(2.5),
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  accentRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: RFPercentage(0.5),
    backgroundColor: GOLD,
  },
  decorCircle1: {
    position: "absolute",
    width: width * 0.34,
    height: width * 0.34,
    borderRadius: width * 0.17,
    backgroundColor: "rgba(244,183,64,0.14)",
    top: -width * 0.15,
    right: -width * 0.09,
  },
  decorCircle2: {
    position: "absolute",
    width: width * 0.24,
    height: width * 0.24,
    borderRadius: width * 0.12,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -width * 0.12,
    right: width * 0.18,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    gap: RFPercentage(1.7),
  },
  badgeRing: {
    width: RFPercentage(9.4),
    height: RFPercentage(9.4),
    borderRadius: RFPercentage(4.7),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  badgeIcon: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  textBlock: {
    flex: 1,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.35),
    borderRadius: RFPercentage(100),
    backgroundColor: "rgba(244,183,64,0.14)",
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    marginBottom: RFPercentage(0.8),
  },
  pillText: {
    color: GOLD,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.15),
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.75),
    lineHeight: RFPercentage(2.3),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    marginTop: RFPercentage(0.6),
  },
  status: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.45),
  },
  statusExpired: {
    color: GOLD,
    fontFamily: "Poppins_500Medium",
  },
});

export default FounderBanner;
