import React, { useRef, useEffect } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { Icons } from "../config/theme";
import Colors from "../config/Colors";
import Feather from "@expo/vector-icons/Feather";

const { width } = Dimensions.get("window");

// ─── Step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "today",
    iconKey: "key",
    accent: "#4557B0",
    labelKey: "freeTrial.txt3",
    descKey: "freeTrial.txt4",
    featherIcon: "unlock",
  },
  {
    key: "day10",
    iconKey: "notify",
    accent: "#7B6FD4",
    labelKey: "freeTrial.txt5",
    descKey: "freeTrial.txt6",
    featherIcon: "bell",
  },
  {
    key: "after",
    iconKey: "star",
    accent: "#DD53A8",
    labelKey: "freeTrial.txt7",
    descKey: "freeTrial.txt8",
    featherIcon: "star",
  },
];

// ─── Animated Step Row ────────────────────────────────────────────────────────
const StepRow = ({
  step,
  index,
  isLast,
  isDark,
  t,
}: {
  step: (typeof STEPS)[0];
  index: number;
  isLast: boolean;
  isDark: boolean;
  t: any;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 300 + index * 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 300 + index * 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        stepStyles.row,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Left: icon + connector */}
      <View style={stepStyles.leftCol}>
        {/* Icon circle */}
        <LinearGradient
          colors={[step.accent, step.accent + "AA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={stepStyles.iconCircle}
        >
          {/* Outer ring */}
          <View
            style={[stepStyles.iconRing, { borderColor: step.accent + "55" }]}
          />
          <Feather
            name={step.featherIcon as any}
            size={RFPercentage(2.2)}
            color="#fff"
          />
        </LinearGradient>

        {/* Connector */}
        {!isLast && (
          <View style={stepStyles.connectorWrap}>
            <LinearGradient
              colors={[step.accent + "60", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={stepStyles.connector}
            />
          </View>
        )}
      </View>

      {/* Right: text card */}
      <View
        style={[
          stepStyles.card,
          {
            backgroundColor: isDark
              ? "rgba(26, 30, 61, 0.75)"
              : "rgba(255,255,255,0.85)",
            borderColor: isDark ? step.accent + "28" : step.accent + "20",
          },
        ]}
      >
        {/* Card left accent bar */}
        <View style={[stepStyles.cardBar, { backgroundColor: step.accent }]} />

        <View style={stepStyles.cardContent}>
          {/* Step label pill */}
          <View
            style={[stepStyles.pill, { backgroundColor: step.accent + "18" }]}
          >
            <Text style={[stepStyles.pillText, { color: step.accent }]}>
              {t(step.labelKey)}
            </Text>
          </View>
          <Text
            style={[
              stepStyles.desc,
              { color: isDark ? "#abb2c9ff" : "#64748B" },
            ]}
          >
            {t(step.descKey)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: RFPercentage(0.5),
  },
  leftCol: {
    alignItems: "center",
    width: RFPercentage(6),
  },
  iconCircle: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    // elevation: 8,
  },
  iconRing: {
    position: "absolute",
    width: RFPercentage(7.2),
    height: RFPercentage(7.2),
    borderRadius: 100,
    borderWidth: 1.5,
  },
  connectorWrap: {
    flex: 1,
    alignItems: "center",
    width: 2,
    marginTop: 4,
  },
  connector: {
    width: 2,
    height: RFPercentage(7.5),
    borderRadius: 2,
  },

  card: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: RFPercentage(1),
    marginBottom: RFPercentage(2.2),
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 4,
  },
  cardBar: {
    width: 3,
    alignSelf: "stretch",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: RFPercentage(1.6),
    gap: RFPercentage(0.5),
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.3),
    borderRadius: 100,
  },
  pillText: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.55),
    letterSpacing: 0.2,
  },
  desc: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.35),
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FreeTrial = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const isDark = theme.mode === "dark";

  // Mount animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* ── Background gradient ── */}
      {/* <LinearGradient
        colors={
          isDark
            ? ["#080b1a", "#0f1230", "#080b1a"]
            : ["#f0f3ff", "#eaedff", "#f5f0ff"]
        }
        style={StyleSheet.absoluteFillObject}
      /> */}

      {/* ── Top glow ── */}
      <LinearGradient
        colors={
          theme.mode === "dark"
            ? ["rgba(37, 50, 117, 0.7)", "transparent"]
            : ["rgba(37, 50, 117, 0.92)", Colors.white]
        }
        style={styles.topGlow}
        pointerEvents="none"
      />

      <Image source={Icons.logo} style={styles.logo} resizeMode="contain" />

      {/* ── Header text ── */}
      <Animated.View
        style={[
          styles.headerWrap,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#eef0ff" : "#1a1e4a" }]}>
          {t("freeTrial.txt1")}
        </Text>

        {/* Gradient underline */}
        <LinearGradient
          colors={["#253275", "#DD53A8", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleUnderline}
        />

        {/* Gift badge */}
        <View
          style={[
            styles.giftBadge,
            {
              backgroundColor: isDark
                ? "rgba(69,87,176,0.15)"
                : "rgba(37,50,117,0.07)",
            },
          ]}
        >
          <Text style={styles.giftEmoji}>🎁</Text>
          <Text
            style={[styles.giftText, { color: isDark ? "#8892b0" : "#64748B" }]}
          >
            {t("freeTrial.txt2")}
          </Text>
        </View>
      </Animated.View>

      {/* ── Steps ── */}
      <ScrollView style={styles.stepsContainer}>
        {STEPS.map((step, index) => (
          <StepRow
            key={step.key}
            step={step}
            index={index}
            isLast={index === STEPS.length - 1}
            isDark={isDark}
            t={t}
          />
        ))}
      </ScrollView>

      {/* ── CTA button ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          onPress={() => navigation.navigate("SubscriptionV2")}
          activeOpacity={0.88}
          style={styles.ctaOuter}
        >
          <LinearGradient
            colors={["#253275", "#4557B0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaBtnText}>{t("freeTrial.txt9")}</Text>
            <View style={styles.ctaArrow}>
              <Feather
                name="arrow-right"
                size={RFPercentage(1.8)}
                color="#fff"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* No commitment note */}
        <View style={styles.noteRow}>
          <Feather
            name="shield"
            size={RFPercentage(1.5)}
            color={isDark ? "#3a4570" : "#94a3b8"}
          />
          <Text
            style={[styles.noteText, { color: isDark ? "#3a4570" : "#94a3b8" }]}
          >
            No credit card required · Cancel anytime
          </Text>
        </View>
      </View>
    </View>
  );
};

export default FreeTrial;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? RFPercentage(8) : RFPercentage(9),
  },

  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RFPercentage(30),
  },

  // Logo
  logoWrap: {
    marginBottom: RFPercentage(2.8),
  },
  logoRing: {
    width: RFPercentage(13),
    height: RFPercentage(13),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  logoInner: {
    width: "92%",
    height: "92%",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    // elevation: 10,
  },
  logo: {
    width: RFPercentage(8),
    height: RFPercentage(10),
  },

  // Header
  headerWrap: {
    alignItems: "center",
    marginBottom: RFPercentage(3.5),
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(4),
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(2.6),
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: RFPercentage(0.8),
  },
  titleUnderline: {
    height: 3,
    width: 52,
    borderRadius: 2,
    marginBottom: RFPercentage(1.6),
  },
  giftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.7),
    paddingHorizontal: RFPercentage(1.8),
    paddingVertical: RFPercentage(0.6),
    borderRadius: 100,
  },
  giftEmoji: {
    fontSize: RFPercentage(1.7),
  },
  giftText: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
  },

  // Steps
  stepsContainer: {
    width: "100%",
    paddingHorizontal: RFPercentage(2.8),
    flex: 1,
  },

  // CTA
  ctaWrap: {
    width: "100%",
    paddingHorizontal: RFPercentage(3),
    paddingBottom: Platform.OS === "ios" ? RFPercentage(5) : RFPercentage(3.5),
    alignItems: "center",
    gap: RFPercentage(1.2),
  },
  ctaOuter: {
    width: "60%",
    borderRadius: RFPercentage(100),
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    height: RFPercentage(6),
    // elevation: 12,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1),
    borderRadius: RFPercentage(100),
    height: RFPercentage(6),
  },
  ctaBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.85),
    color: "#fff",
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
  },
  noteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.35),
  },
});
