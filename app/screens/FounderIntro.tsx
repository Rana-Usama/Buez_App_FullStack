import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import Toast from "react-native-toast-message";
import DeviceInfo from "react-native-device-info";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { Icons } from "../config/theme";
import { markFounderIntroCompleted } from "../utils/founderIntro";
import { claimFounderSpot } from "../services/Founder.service";

// Cap content width so the layout stays elegant on tablets / large devices.
const CONTENT_MAX_WIDTH = 560;

// ── Brand accent palette (matches Subscription / onboarding screens) ──────────
const ACCENT_PRIMARY = "#253275";
const ACCENT_PRIMARY_2 = "#4557B0";
const ACCENT_PINK = "#DD53A8";
const GOLD = "#F4B740";

/**
 * Static placeholder founder-slot data.
 *
 * TODO(next step): replace this object with live data fetched from the backend
 * (e.g. a `useFounderSlots()` hook). The screen already reads every value from
 * this single source + a `loading` flag, so swapping in an API response will
 * not require any UI changes.
 */
interface FounderSlots {
  total: number;
  filled: number;
  remaining: number;
  yourNumber: number | null;
}

const FOUNDER_SLOTS: FounderSlots = {
  total: 100,
  filled: 37,
  remaining: 63,
  yourNumber: 38,
};

// ── Benefit row (staggered entrance) ─────────────────────────────────────────
interface Benefit {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  titleKey: string;
  descKey: string;
}

const BENEFITS: Benefit[] = [
  {
    key: "freeAccess",
    icon: "unlock",
    accent: ACCENT_PRIMARY_2,
    titleKey: "founderIntro.benefit1Title",
    descKey: "founderIntro.benefit1Desc",
  },
  {
    key: "badge",
    icon: "award",
    accent: GOLD,
    titleKey: "founderIntro.benefit2Title",
    descKey: "founderIntro.benefit2Desc",
  },
  {
    key: "premium",
    icon: "star",
    accent: ACCENT_PINK,
    titleKey: "founderIntro.benefit3Title",
    descKey: "founderIntro.benefit3Desc",
  },
  {
    key: "recognition",
    icon: "heart",
    accent: "#7B6FD4",
    titleKey: "founderIntro.benefit4Title",
    descKey: "founderIntro.benefit4Desc",
  },
  {
    key: "shape",
    icon: "trending-up",
    accent: "#2BB6A3",
    titleKey: "founderIntro.benefit5Title",
    descKey: "founderIntro.benefit5Desc",
  },
];

const BenefitRow = ({
  benefit,
  index,
  isDark,
  t,
}: {
  benefit: Benefit;
  index: number;
  isDark: boolean;
  t: any;
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 460,
        delay: 250 + index * 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 460,
        delay: 250 + index * 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, index]);

  return (
    <Animated.View
      style={[
        styles.benefitRow,
        {
          opacity: fade,
          transform: [{ translateY: slide }],
          backgroundColor: isDark
            ? "rgba(26, 30, 61, 0.65)"
            : "rgba(255,255,255,0.9)",
          borderColor: isDark ? benefit.accent + "33" : benefit.accent + "22",
        },
      ]}
    >
      <LinearGradient
        colors={[benefit.accent, benefit.accent + "AA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.benefitIcon}
      >
        <Feather name={benefit.icon} size={RFPercentage(2.1)} color="#fff" />
      </LinearGradient>

      <View style={styles.benefitTextWrap}>
        <Text
          style={[
            styles.benefitTitle,
            { color: isDark ? "#eef0ff" : "#1a1e4a" },
          ]}
        >
          {t(benefit.titleKey)}
        </Text>
        <Text
          style={[
            styles.benefitDesc,
            { color: isDark ? "#9aa3c4" : "#64748B" },
          ]}
        >
          {t(benefit.descKey)}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Slot stat pill ────────────────────────────────────────────────────────────
const SlotStat = ({
  value,
  label,
  color,
  isDark,
}: {
  value: string | number;
  label: string;
  color: string;
  isDark: boolean;
}) => (
  <View style={styles.slotStat}>
    <Text style={[styles.slotStatValue, { color }]}>{value}</Text>
    <Text
      style={[styles.slotStatLabel, { color: isDark ? "#8892b0" : "#64748B" }]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

const FounderIntro = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const isDark = theme.mode === "dark";

  const [claiming, setClaiming] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  // Resolve the device id up-front so the per-device claim check is reliable.
  useEffect(() => {
    DeviceInfo.getUniqueId()
      .then((id) => setDeviceId(id))
      .catch((error) =>
        console.log("[FounderIntro] Failed to read device id:", error),
      );
  }, []);

  // Future-proofing: when slot data comes from an API this flag will reflect
  // the request state. It is `false` today because the data is static.
  const [loading] = useState(false);
  const slots = FOUNDER_SLOTS;

  const total = slots?.total ?? 100;
  const filled = slots?.filled ?? 0;
  const remaining = slots?.remaining ?? Math.max(total - filled, 0);
  const progress = total > 0 ? Math.min(Math.max(filled / total, 0), 1) : 0;

  // Hero entrance animations
  const badgeScale = useRef(new Animated.Value(0.8)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [badgeScale, badgeOpacity, headerOpacity, progressAnim, progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // CTA — claim the founder spot, persist enrollment, then continue to Home.
  const handleClaim = async () => {
    // Prevent duplicate requests from rapid taps.
    if (claiming) return;
    setClaiming(true);

    try {
      // Ensure a device id is available for per-device enforcement.
      let id = deviceId;
      if (!id) {
        id = await DeviceInfo.getUniqueId();
        setDeviceId(id);
      }

      const result = await claimFounderSpot(id);

      if (result.success) {
        // The local user context updates automatically via the Firestore
        // snapshot listener once the enrollment is written.
        await markFounderIntroCompleted();
        Toast.show({
          type: "success",
          text1:
            result.reason === "already_founder"
              ? t("founderIntro.alreadyFounder")
              : t("founderIntro.successTitle"),
        });
        navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
        return;
      }

      // ── Failure: stay on screen, re-enable CTA, do NOT mark as completed ──
      Toast.show({
        type: "error",
        text1:
          result.reason === "device_claimed"
            ? t("founderIntro.deviceClaimed")
            : t("founderIntro.claimError"),
      });
      setClaiming(false);
    } catch (error) {
      console.log("[FounderIntro] Claim failed:", error);
      Toast.show({ type: "error", text1: t("founderIntro.claimError") });
      setClaiming(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "light-content"}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              Platform.OS === "ios" ? RFPercentage(7) : RFPercentage(8),
          },
        ]}
      >
        <View style={styles.contentWrap}>
          {/* ── Hero ── */}
          <Animated.View
            style={[
              styles.heroBadgeWrap,
              { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
            ]}
          >
            <Image
              source={Icons.founderBadge}
              resizeMode="contain"
              style={{ width: RFPercentage(16), height: RFPercentage(16) }}
            />
          </Animated.View>

          <Animated.View
            style={[styles.heroTextWrap, { opacity: headerOpacity }]}
          >
            {/* Limited pill */}
            <View
              style={[
                styles.limitedPill,
                {
                  backgroundColor: isDark
                    ? "rgba(244,183,64,0.15)"
                    : "rgba(244,183,64,0.16)",
                },
              ]}
            >
              <Feather name="zap" size={RFPercentage(1.3)} color={GOLD} />
              <Text style={[styles.limitedPillText, { color: GOLD }]}>
                {t("founderIntro.badge")}
              </Text>
            </View>

            <Text
              style={[styles.title, { color: isDark ? "#eef0ff" : "#1a1e4a" }]}
            >
              {t("founderIntro.title")}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#9aa3c4" : "#64748B" },
              ]}
            >
              {t("founderIntro.subtitle")}
            </Text>
          </Animated.View>

          {/* ── Founder slots ── */}
          <View
            style={[
              styles.slotsCard,
              {
                backgroundColor: isDark ? "rgba(10, 13, 33, 0.9)" : "#fff",
                borderColor: isDark
                  ? "rgba(69,87,176,0.25)"
                  : "rgba(37,50,117,0.1)",
              },
            ]}
          >
            <View style={styles.slotsHeaderRow}>
              <Text
                style={[
                  styles.slotsTitle,
                  { color: isDark ? "#eef0ff" : "#1a1e4a" },
                ]}
              >
                {t("founderIntro.slotsTitle")}
              </Text>
              {slots?.yourNumber != null && (
                <LinearGradient
                  colors={[ACCENT_PRIMARY, ACCENT_PRIMARY_2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.yourNumberPill}
                >
                  <Feather name="hash" size={RFPercentage(1.4)} color="#fff" />
                  <Text style={styles.yourNumberText}>
                    {t("founderIntro.yourNumber")} #{slots.yourNumber}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {loading ? (
              <View style={styles.slotsLoader}>
                <ActivityIndicator color={ACCENT_PRIMARY_2} />
              </View>
            ) : (
              <>
                {/* Progress bar */}
                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(37,50,117,0.08)",
                    },
                  ]}
                >
                  <Animated.View style={{ width: progressWidth }}>
                    <LinearGradient
                      colors={[ACCENT_PRIMARY, ACCENT_PINK]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressFill}
                    />
                  </Animated.View>
                </View>

                <Text
                  style={[
                    styles.slotsCaption,
                    { color: isDark ? "#8892b0" : "#64748B" },
                  ]}
                >
                  {t("founderIntro.slotsCaption", { remaining, total })}
                </Text>

                {/* Stats */}
                <View style={styles.slotStatsRow}>
                  <SlotStat
                    value={total}
                    label={t("founderIntro.slotsTotal")}
                    color={isDark ? "#eef0ff" : "#1a1e4a"}
                    isDark={isDark}
                  />
                  <View
                    style={[
                      styles.slotDivider,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(37,50,117,0.08)",
                      },
                    ]}
                  />
                  <SlotStat
                    value={filled}
                    label={t("founderIntro.slotsFilled")}
                    color={ACCENT_PINK}
                    isDark={isDark}
                  />
                  <View
                    style={[
                      styles.slotDivider,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(37,50,117,0.08)",
                      },
                    ]}
                  />
                  <SlotStat
                    value={remaining}
                    label={t("founderIntro.slotsRemaining")}
                    color="#2BB6A3"
                    isDark={isDark}
                  />
                </View>
              </>
            )}
          </View>

          {/* ── Benefits ── */}
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#eef0ff" : "#1a1e4a" },
            ]}
          >
            {t("founderIntro.benefitsTitle")}
          </Text>

          <View style={styles.benefitsWrap}>
            {BENEFITS.map((benefit, index) => (
              <BenefitRow
                key={benefit.key}
                benefit={benefit}
                index={index}
                isDark={isDark}
                t={t}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.white,
            borderTopColor: isDark
              ? "rgba(69,87,176,0.18)"
              : "rgba(37,50,117,0.08)",
            paddingBottom:
              Platform.OS === "ios" ? RFPercentage(4.5) : RFPercentage(2.8),
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleClaim}
          disabled={claiming}
          activeOpacity={0.88}
          style={styles.ctaOuter}
        >
          <LinearGradient
            colors={[ACCENT_PRIMARY, ACCENT_PRIMARY_2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            {claiming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>{t("founderIntro.cta")}</Text>
                <View style={styles.ctaArrow}>
                  <Feather
                    name="arrow-right"
                    size={RFPercentage(1.8)}
                    color="#fff"
                  />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.ctaNoteRow}>
          <Feather
            name="shield"
            size={RFPercentage(1.4)}
            color={isDark ? "#3a4570" : "#94a3b8"}
          />
          <Text
            style={[styles.ctaNote, { color: isDark ? "#5a648f" : "#94a3b8" }]}
          >
            {t("founderIntro.ctaNote")}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default FounderIntro;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RFPercentage(34),
  },
  scrollContent: {
    paddingBottom: RFPercentage(16),
    alignItems: "center",
  },
  contentWrap: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: RFPercentage(2.8),
  },

  // Hero
  heroBadgeWrap: { alignItems: "center", marginBottom: RFPercentage(2) },
  heroBadge: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  heroBadgeRing: {
    position: "absolute",
    width: RFPercentage(14),
    height: RFPercentage(14),
    borderRadius: RFPercentage(100),
    borderWidth: 1.5,
    borderColor: "rgba(244,183,64,0.4)",
  },
  heroCrown: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    tintColor: "#fff",
  },
  heroTextWrap: {
    alignItems: "center",
    marginBottom: RFPercentage(3),
  },
  limitedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(100),
    marginBottom: RFPercentage(1.4),
  },
  limitedPillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.4),
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(3.2),
    letterSpacing: -0.5,
    textAlign: "center",
  },
  titleUnderline: {
    height: RFPercentage(0.45),
    width: RFPercentage(9),
    borderRadius: RFPercentage(100),
    marginTop: RFPercentage(1),
    marginBottom: RFPercentage(1.6),
  },
  subtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.85),
    lineHeight: RFPercentage(2.9),
    textAlign: "center",
    paddingHorizontal: RFPercentage(1.5),
  },

  // Slots card
  slotsCard: {
    borderRadius: RFPercentage(2.4),
    borderWidth: 1,
    padding: RFPercentage(2.2),
    marginBottom: RFPercentage(3),
    shadowColor: ACCENT_PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  slotsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: RFPercentage(1),
    marginBottom: RFPercentage(1.6),
  },
  slotsTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(2),
    letterSpacing: -0.2,
  },
  yourNumberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.55),
    borderRadius: RFPercentage(100),
  },
  yourNumberText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.35),
  },
  slotsLoader: {
    paddingVertical: RFPercentage(3),
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: RFPercentage(1.1),
    borderRadius: RFPercentage(100),
    overflow: "hidden",
    marginBottom: RFPercentage(1),
  },
  progressFill: {
    height: RFPercentage(1.1),
    borderRadius: RFPercentage(100),
  },
  slotsCaption: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
    marginBottom: RFPercentage(1.8),
  },
  slotStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotStat: { flex: 1, alignItems: "center" },
  slotStatValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(2.8),
    letterSpacing: -0.5,
  },
  slotStatLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.4),
    marginTop: RFPercentage(0.2),
  },
  slotDivider: {
    width: 1,
    height: RFPercentage(3.4),
  },

  // Benefits
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(2.1),
    letterSpacing: -0.2,
    marginBottom: RFPercentage(1.6),
  },
  benefitsWrap: { gap: RFPercentage(1.2) },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RFPercentage(1.8),
    borderWidth: 1,
    padding: RFPercentage(1.6),
    gap: RFPercentage(1.4),
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  benefitIcon: {
    width: RFPercentage(4.8),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1.4),
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTextWrap: { flex: 1 },
  benefitTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.75),
    marginBottom: RFPercentage(0.2),
  },
  benefitDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.2),
  },

  // Footer CTA
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: RFPercentage(1.6),
    paddingHorizontal: RFPercentage(2.8),
    borderTopWidth: 1,
    alignItems: "center",
  },
  ctaOuter: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    height: RFPercentage(6.6),
    shadowColor: ACCENT_PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  ctaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1),
    height: RFPercentage(6.6),
  },
  ctaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.95),
    color: "#fff",
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(100),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    marginTop: RFPercentage(1.2),
  },
  ctaNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.35),
  },
});
