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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import Toast from "react-native-toast-message";
import DeviceInfo from "react-native-device-info";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { markFounderIntroCompleted } from "../utils/founderIntro";
import {
  claimFounderSpot,
  subscribeFounderStats,
  FOUNDER_TOTAL_SPOTS,
  FounderStats,
} from "../services/Founder.service";
import Colors from "../config/Colors";

// Cap content width so the layout stays elegant on tablets / large devices.
const CONTENT_MAX_WIDTH = 560;

// ── Brand accent palette (matches Subscription / onboarding screens) ──────────
const ACCENT_PRIMARY = Colors.primary;
const ACCENT_PRIMARY_2 = Colors.success2;
const ACCENT_PINK = Colors.secondary;
const GOLD = Colors.orange5;

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
    accent: Colors.teal10,
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
            : Colors.whiteAlpha90,
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
        <Feather name={benefit.icon} size={RFPercentage(2.1)} color={Colors.white} />
      </LinearGradient>

      <View style={styles.benefitTextWrap}>
        <Text
          style={[
            styles.benefitTitle,
            { color: isDark ? Colors.white4 : Colors.blueDark },
          ]}
        >
          {t(benefit.titleKey)}
        </Text>
        <Text
          style={[
            styles.benefitDesc,
            { color: isDark ? Colors.blue20 : Colors.desc },
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
      style={[styles.slotStatLabel, { color: isDark ? Colors.blue : Colors.desc }]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

const FounderIntro = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { userData } = useUser();
  const insets = useSafeAreaInsets();
  const isDark = theme.mode === "dark";

  // The footer is position:absolute / bottom:0, and targetSdk 35 (Android 15)
  // forces edge-to-edge — so it draws underneath the gesture bar / nav bar and
  // clips the CTA on Samsung devices. Pad by the real inset, with a floor that
  // preserves the previous spacing where no inset is reported.
  const footerPaddingBottom = Math.max(
    insets.bottom + RFPercentage(1.5),
    Platform.OS === "ios" ? RFPercentage(4.5) : RFPercentage(2.8),
  );

  const [claiming, setClaiming] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  // ── Live founder stats (driven by Firebase) ──
  const [stats, setStats] = useState<FounderStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve the device id up-front so the per-device claim check is reliable.
  useEffect(() => {
    DeviceInfo.getUniqueId()
      .then((id) => setDeviceId(id))
      .catch((error) =>
        console.log("[FounderIntro] Failed to read device id:", error),
      );
  }, []);

  // Subscribe to real-time founder stats.
  useEffect(() => {
    const unsubscribe = subscribeFounderStats((next) => {
      setStats(next);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const total = stats?.total ?? FOUNDER_TOTAL_SPOTS;
  const filled = stats?.filled ?? 0;
  const remaining = stats?.remaining ?? Math.max(total - filled, 0);
  const progress = total > 0 ? Math.min(Math.max(filled / total, 0), 1) : 0;

  // Founder number: a claimed founder keeps their assigned number; otherwise
  // show the next available number they would receive on claiming (null when
  // the program is full).
  const claimedNumber =
    userData?.isFounder === true && userData?.founderNumber != null
      ? userData.founderNumber
      : null;
  const yourNumber = claimedNumber ?? (remaining > 0 ? filled + 1 : null);

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
  }, [badgeScale, badgeOpacity, headerOpacity]);

  // Animate the progress bar whenever the live fill ratio changes.
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Program full and this user isn't a founder → no claim possible; the
  // screen switches to an informative sold-out state that routes the user to
  // the standard subscription plans instead.
  const soldOut =
    !loading && remaining <= 0 && userData?.isFounder !== true;

  // Sold-out path: mark the intro as seen and continue to the standard plans.
  const handleContinueToPlans = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      await markFounderIntroCompleted();
    } catch (error) {
      console.log("[FounderIntro] Failed to persist intro flag:", error);
    }
    navigation.reset({ index: 0, routes: [{ name: "SubscriptionV2" }] });
  };

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

      // ── Race: last spot taken while the user was on this screen ──
      if (result.reason === "sold_out") {
        await markFounderIntroCompleted();
        Toast.show({ type: "info", text1: t("founderIntro.soldOutTitle") });
        navigation.reset({ index: 0, routes: [{ name: "SubscriptionV2" }] });
        return;
      }

      // ── One founder per device: this device already claimed for another
      //    account → inform the user and send them to the standard plans.
      //    (Intro flag intentionally NOT set: routing re-resolves via the
      //    device check, so this screen won't be shown here again.)
      if (result.reason === "device_claimed") {
        Toast.show({ type: "info", text1: t("founderIntro.deviceClaimed") });
        navigation.reset({ index: 0, routes: [{ name: "SubscriptionV2" }] });
        return;
      }

      // ── Failure: stay on screen, re-enable CTA, do NOT mark as completed ──
      Toast.show({ type: "error", text1: t("founderIntro.claimError") });
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
        barStyle={isDark ? "light-content" : "dark-content"}
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
            // Keep the scroll content clear of the (now inset-aware) absolute
            // footer, so the last card isn't hidden behind it.
            paddingBottom: RFPercentage(16) + insets.bottom,
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
              style={styles.image}
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
              <Text style={[styles.limitedPillText, styles.text]}>
                {t("founderIntro.badge")}
              </Text>
            </View>

            <Text
              style={[styles.title, { color: isDark ? Colors.white4 : Colors.blueDark }]}
            >
              {t("founderIntro.title")}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? Colors.blue20 : Colors.desc },
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
                backgroundColor: isDark ? "rgba(10, 13, 33, 0.9)" : Colors.white,
                borderColor: isDark
                  ? Colors.primary2Alpha25
                  : Colors.primaryAlpha10,
              },
            ]}
          >
            <View style={styles.slotsHeaderRow}>
              <Text
                style={[
                  styles.slotsTitle,
                  { color: isDark ? Colors.white4 : Colors.blueDark },
                ]}
              >
                {t("founderIntro.slotsTitle")}
              </Text>
              {!loading && yourNumber != null && (
                <LinearGradient
                  colors={[ACCENT_PRIMARY, ACCENT_PRIMARY_2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.yourNumberPill}
                >
                  <Text style={styles.yourNumberText}>
                    {t("founderIntro.yourNumber")} #{yourNumber}
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
                        ? Colors.whiteAlpha08
                        : Colors.primaryAlpha08,
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

                {soldOut ? (
                  <View style={styles.soldOutRow}>
                    <Feather
                      name="info"
                      size={RFPercentage(1.7)}
                      color={ACCENT_PINK}
                    />
                    <Text style={[styles.soldOutText, styles.text2]}>
                      {t("founderIntro.soldOutTitle")}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.slotsCaption,
                      { color: isDark ? Colors.blue : Colors.desc },
                    ]}
                  >
                    {t("founderIntro.slotsCaption", { remaining, total })}
                  </Text>
                )}

                {/* Stats */}
                <View style={styles.slotStatsRow}>
                  <SlotStat
                    value={total}
                    label={t("founderIntro.slotsTotal")}
                    color={isDark ? Colors.white4 : Colors.blueDark}
                    isDark={isDark}
                  />
                  <View
                    style={[
                      styles.slotDivider,
                      {
                        backgroundColor: isDark
                          ? Colors.whiteAlpha08
                          : Colors.primaryAlpha08,
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
                          ? Colors.whiteAlpha08
                          : Colors.primaryAlpha08,
                      },
                    ]}
                  />
                  <SlotStat
                    value={remaining}
                    label={t("founderIntro.slotsRemaining")}
                    color={Colors.teal10}
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
              { color: isDark ? Colors.white4 : Colors.blueDark },
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
              ? Colors.primary2Alpha18
              : Colors.primaryAlpha08,
            paddingBottom: footerPaddingBottom,
          },
        ]}
      >
        <TouchableOpacity
          onPress={soldOut ? handleContinueToPlans : handleClaim}
          disabled={claiming || loading}
          activeOpacity={0.88}
          style={styles.ctaOuter}
        >
          <LinearGradient
            colors={[ACCENT_PRIMARY, ACCENT_PRIMARY_2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            {claiming || loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={styles.ctaText}>
                  {soldOut
                    ? t("founderIntro.soldOutCta")
                    : t("founderIntro.cta")}
                </Text>
                <View style={styles.ctaArrow}>
                  <Feather
                    name="arrow-right"
                    size={RFPercentage(1.8)}
                    color={Colors.white}
                  />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.ctaNoteRow}>
          <Feather
            name={soldOut ? "info" : "shield"}
            size={RFPercentage(1.4)}
            color={isDark ? "#3a4570" : Colors.inputFieldPlaceholder}
          />
          <Text
            style={[styles.ctaNote, { color: isDark ? "#5a648f" : Colors.inputFieldPlaceholder }]}
          >
            {soldOut
              ? t("founderIntro.soldOutDesc")
              : t("founderIntro.ctaNote")}
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
    // paddingBottom is applied at runtime (base + safe-area inset).
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
    tintColor: Colors.white,
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
    fontSize: RFPercentage(2.4),
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
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2),
    textAlign: "center",
    paddingHorizontal: RFPercentage(1.5),
    marginTop:RFPercentage(0.6)
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
    color: Colors.white,
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
  soldOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.7),
    marginBottom: RFPercentage(1.8),
  },
  soldOutText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.5),
    flex: 1,
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
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
    fontSize: RFPercentage(1.8),
    color: Colors.white,
  },
  ctaArrow: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.backBtnBg,
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
  image: { width: RFPercentage(16), height: RFPercentage(16) },
  text: { color: GOLD },
  text2: { color: ACCENT_PINK },
});
