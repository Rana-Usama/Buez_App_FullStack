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

const GOLD = "#F4B740";
const GOLD_DEEP = "#E08C2F";

/**
 * Founder status banner shown on the Home screen.
 *
 * Renders only for founders. Reads everything from the user context (kept in
 * sync with Firestore), so it updates automatically right after a claim and
 * reflects expiry without any extra work.
 */
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
            ? ["#736eb11c", "#2b2f5326"]
            : ["rgba(35, 50, 124, 0.11)", "rgba(35, 50, 124, 0.12)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.content}>
          {/* Founder badge */}

          <Image
            source={Icons.founderBadge}
            style={styles.badgeIcon}
            resizeMode="contain"
          />

          {/* Text */}
          <View style={styles.textBlock}>
            {/* <View style={styles.pillRow}>
              <Feather name="award" size={RFPercentage(2)} color={Colors.primary} />
              <Text style={[styles.pillText,{color:Colors.primary}]} numberOfLines={1}>
                {t("founderBanner.badge")}
              </Text>
            </View> */}
            <Text
              style={[
                styles.title,
                {
                  color: theme.mode === "dark" ? Colors.white : Colors.primary,
                },
              ]}
              numberOfLines={2}
            >
              {t("founderBanner.title")}
            </Text>
            <Text
              style={[
                styles.status,
                {
                  color: theme.mode === "dark" ? Colors.white : Colors.primary,
                },
              ]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: RFPercentage(2),
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(0.5),
  },
  banner: {
    borderRadius: RFPercentage(2.5),
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  decorCircle1: {
    position: "absolute",
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.16,
    backgroundColor: "rgba(244,183,64,0.12)",
    top: -width * 0.14,
    right: -width * 0.08,
  },
  decorCircle2: {
    position: "absolute",
    width: width * 0.22,
    height: width * 0.22,
    borderRadius: width * 0.11,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -width * 0.1,
    left: -width * 0.04,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.8),
    gap: RFPercentage(1.6),
  },
  badge: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeIcon: {
    width: RFPercentage(9),
    height: RFPercentage(9),
  },
  textBlock: {
    flex: 1,
    gap: RFPercentage(0.3),
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  pillText: {
    color: GOLD,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.6),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.75),
    letterSpacing: -0.2,
  },
  status: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.45),
  },
});

export default FounderBanner;
