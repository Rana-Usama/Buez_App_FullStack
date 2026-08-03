import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/user.context";
import { Icons } from "../../config/theme";
import { hasFounderBadge } from "../../services/Founder.service";
import Colors from "../../config/Colors";

const GOLD = Colors.orange5;

interface FounderBadgeProps {
  /**
   * "avatar" — the badge icon, meant to be overlaid on a profile picture.
   * "pill"   — a labelled chip ("Founder #12"), meant for info sections.
   */
  variant?: "avatar" | "pill";
  /** Icon size (avatar variant). Defaults to RFPercentage(6). */
  size?: number;
  /** Optional user record; defaults to the signed-in user from context. */
  user?: any;
  style?: StyleProp<ViewStyle>;
}

/**
 * Permanent Founder Badge.
 *
 * Renders ONLY from `hasFounderBadge` (i.e. `isFounder === true`). It has no
 * knowledge of subscriptions, trial expiry, or `founderStatus` — once awarded
 * to one of the first 100 founders, it is never removed by any lifecycle
 * change. Premium access is a separate concern (`isFounderActive` /
 * `isSubscribed`) and must never gate this component.
 */
const FounderBadge: React.FC<FounderBadgeProps> = ({
  variant = "avatar",
  size,
  user,
  style,
}) => {
  const { userData } = useUser();
  const { t } = useTranslation();

  const target = user ?? userData;

  // Not a founder → no badge, nothing else matters.
  if (!hasFounderBadge(target)) return null;

  if (variant === "pill") {
    const founderNumber = target?.founderNumber;
    return (
      <View style={[styles.pill, style]}>
        <Image
          source={Icons.founderBadge}
          style={styles.pillIcon}
          resizeMode="contain"
        />
        <Text style={styles.pillText} numberOfLines={1}>
          {t("founderBanner.badge")}
          {founderNumber != null ? ` #${founderNumber}` : ""}
        </Text>
      </View>
    );
  }

  const iconSize = size ?? RFPercentage(6);
  return (
    <Image
      source={Icons.founderBadge}
      resizeMode="contain"
      style={[{ width: iconSize, height: iconSize }, style as any]}
    />
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: RFPercentage(0.5),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(100),
    backgroundColor: GOLD + "22",
    borderWidth: 1,
    borderColor: GOLD + "55",
    marginTop: RFPercentage(0.6),
  },
  pillIcon: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
  },
  pillText: {
    color: "#B07818",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.35),
    letterSpacing: 0.3,
  },
});

export default FounderBadge;
