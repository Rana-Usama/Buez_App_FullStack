import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  ScrollView,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useStripe } from "@stripe/stripe-react-native";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { saveSubscription } from "../services/User.service";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import * as Localization from "expo-localization";
import { handlePaymentSheet } from "../services/Subscription.service";
import { getCurrencyFromLocale, formatCurrency } from "../utils/getCurrency";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";

const { width: screenWidth } = Dimensions.get("window");

function Subscription({ navigation, route }) {
  const { t } = useTranslation();
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const { theme } = useAppTheme();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { newUser } = route.params ?? false;

  const isDark = theme.mode === "dark";

  // ── ALL ORIGINAL LOGIC — UNTOUCHED ───────────────────────────────────────

  const prices = {
    monthly: { USD: 9.5, EUR: 8.9, CHF: 7.9 },
    yearly: { USD: 95, EUR: 89, CHF: 79 },
    free: { USD: 0, EUR: 0, CHF: 0 },
  };

  const locale = Localization?.locale;
  const userCurrency = getCurrencyFromLocale(locale);

  const priceLabelForPlan = (planId) => {
    const amount = prices[planId]?.[userCurrency] ?? prices[planId]?.USD ?? 0;
    return formatCurrency(amount, userCurrency);
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    const res = await handlePaymentSheet({
      initPaymentSheet,
      presentPaymentSheet,
      selectedPlan,
      userCurrency,
      email: userData?.email,
      userId,
      t,
    });

    if (res.success) {
      if (userData?.interests === undefined) {
        navigation.navigate("InterestSelection");
      } else {
        navigation.navigate("TabNavigator");
      }
    }
    setLoading(false);
  };

  const yearlyPrice = priceLabelForPlan("yearly");
  const monthlyPrice = priceLabelForPlan("monthly");

  const savingsPercentage =
    ((prices.monthly[userCurrency] * 12 - prices.yearly[userCurrency]) /
      (prices.monthly[userCurrency] * 12)) *
    100;

  const highlightText = `Save ${Math.round(savingsPercentage)}%`;

  const plans = [
    {
      id: "monthly",
      title: t("subscriptionV2.monthly"),
      price: monthlyPrice,
      period: t("subscriptionV2.perMonth"),
      description: t("subscriptionV2.fullAccess"),
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
        t("subscriptionV2.prioritySupport"),
      ],
      popular: false,
      highlight: t("subscriptionV2.prioritySupport"),
    },
    {
      id: "yearly",
      title: t("subscriptionV2.yearly"),
      price: yearlyPrice,
      period: t("subscriptionV2.perYear"),
      originalPrice: formatCurrency(
        prices.monthly[userCurrency] * 12,
        userCurrency,
      ),
      description: t("subscriptionV2.bestValue"),
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
        t("subscriptionV2.prioritySupport"),
        t("subscriptionV2.exclusiveContent"),
      ],
      popular: true,
      highlight: highlightText,
    },
  ];

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(
      contentOffsetX / (screenWidth * 0.8 + RFPercentage(2)),
    );
    if (index >= 0 && index < plans.length) {
      setCurrentIndex(index);
      setSelectedPlan(plans[index].id);
    }
  };

  const getCardGradient = (isSelected) => {
    if (!isSelected) return null;
    return {
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      // elevation: 8,
    };
  };

  const getBorderGradient = (isSelected) => {
    if (!isSelected)
      return {
        borderColor: isDark ? "rgba(69,87,176,0.18)" : "rgba(37,50,117,0.1)",
      };
    return { borderColor: "#253275", borderWidth: 1.5 };
  };

  // ── PLAN CARD RENDERER ────────────────────────────────────────────────────
  const renderPlanCard = ({ item, index }) => {
    const isSelected = selectedPlan === item.id;
    const accentColor = item.id === "monthly" ? "#253275" : "#DD53A8";

    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          {
            backgroundColor: isDark ? "rgba(17, 20, 48, 0.95)" : "#fff",
            ...getBorderGradient(isSelected),
            marginLeft: index === 0 ? RFPercentage(3) : RFPercentage(1),
            marginRight:
              index === plans.length - 1 ? RFPercentage(3) : RFPercentage(1),
          },
          getCardGradient(isSelected),
        ]}
        onPress={() => {
          setSelectedPlan(item.id);
          setCurrentIndex(index);
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }}
        activeOpacity={0.7}
      >
        {/* Top accent bar */}
        <LinearGradient
          colors={
            item.id === "monthly"
              ? ["#253275", "#4557B0"]
              : ["#253275", "#DD53A8"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopBar}
        />

        {/* Popular badge */}
        {item.popular && (
          <LinearGradient
            colors={["#253275", "#DD53A8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.popularBadge}
          >
            <Text style={styles.popularText}>
              ✦ {t("subscriptionV2.mostPopular") || "MOST POPULAR"}
            </Text>
          </LinearGradient>
        )}

        {/* Selection glow */}
        {isSelected && (
          <View
            style={[
              styles.selectedGlow,
              { backgroundColor: accentColor + "06" },
            ]}
          />
        )}

        <View style={styles.cardBody}>
          {/* Plan header */}
          <View style={styles.planHeader}>
            <LinearGradient
              colors={[accentColor, accentColor + "BB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planIconBubble}
            >
              <Feather
                name={item.id === "monthly" ? "calendar" : "star"}
                size={RFPercentage(2)}
                color="#fff"
              />
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.planTitle,
                  { color: isDark ? "#eef0ff" : "#1a1e4a" },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.planDescription,
                  { color: isDark ? "#6b7db3" : "#64748B" },
                ]}
              >
                {item.description}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.cardDivider,
              {
                backgroundColor: isDark
                  ? "rgba(69,87,176,0.15)"
                  : "rgba(37,50,117,0.07)",
              },
            ]}
          />

          {/* Price */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              {(() => {
                const priceStr = priceLabelForPlan(item.id);
                const [integerPart, decimalPart] = priceStr.split(".");
                return (
                  <Text
                    style={[
                      styles.price,
                      { color: isDark ? "#eef0ff" : "#1a1e4a" },
                    ]}
                  >
                    {integerPart}
                    {decimalPart && (
                      <Text
                        style={[
                          styles.priceDecimal,
                          { color: isDark ? "#8892b0" : "#64748B" },
                        ]}
                      >
                        .{decimalPart}
                      </Text>
                    )}
                  </Text>
                );
              })()}
              <Text
                style={[
                  styles.period,
                  { color: isDark ? "#6b7db3" : "#94a3b8" },
                ]}
              >
                {item.period}
              </Text>
            </View>
          </View>

          {/* Highlight badge + original price */}
          <View style={styles.highlightRow}>
            <View
              style={[
                styles.highlightBadge,
                {
                  backgroundColor:
                    item.popular || item.id === "yearly"
                      ? "#DD53A820"
                      : isDark
                        ? "rgba(69,87,176,0.2)"
                        : "rgba(37,50,117,0.08)",
                },
              ]}
            >
              <Text
                style={[
                  styles.highlightText,
                  {
                    color:
                      item.popular || item.id === "yearly"
                        ? "#DD53A8"
                        : isDark
                          ? "#4557B0"
                          : "#253275",
                  },
                ]}
              >
                {item.highlight}
              </Text>
            </View>
            {item.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: isDark ? "#4a5580" : "#94a3b8" },
                ]}
              >
                {item.originalPrice}
              </Text>
            )}
          </View>

          {/* Divider */}
          <View
            style={[
              styles.cardDivider,
              {
                backgroundColor: isDark
                  ? "rgba(69,87,176,0.12)"
                  : "rgba(37,50,117,0.06)",
              },
            ]}
          />

          {/* Features */}
          <View style={styles.featuresContainer}>
            {item.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.featureRow}>
                <LinearGradient
                  colors={[accentColor, accentColor + "CC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.checkIcon}
                >
                  <Text style={styles.checkText}>✓</Text>
                </LinearGradient>
                <Text
                  style={[
                    styles.featureText,
                    { color: isDark ? "#8892b0" : "#475569" },
                  ]}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Decorative stars */}
        <View>
          <Image
            source={Icons.stars}
            resizeMode="contain"
            style={styles.starsImage}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "light-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Top glow strip */}
      <LinearGradient
        colors={
          theme.mode === "dark"
            ? ["rgba(37, 50, 117, 0.9)", "transparent"]
            : ["rgba(37, 50, 117, 0.92)", Colors.white]
        }
        style={styles.topGlow}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Badge */}
          <View style={styles.titleBadgeWrap}>
            <LinearGradient
              colors={["#253275", "#DD53A8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleBadge}
            >
              <Feather
                name="refresh-cw"
                size={RFPercentage(1.3)}
                color="#fff"
              />
              <Text style={styles.titleBadgeText}>
                {t("subscription.renewSubscription") || "Renew Subscription"}
              </Text>
            </LinearGradient>
          </View>

          <Text
            style={[styles.title, { color: isDark ? "#eef0ff" : "#1a1e4a" }]}
          >
            {t("subscription.renewSubscription") || "Renew Subscription"}
          </Text>

          {/* Gradient underline */}
          <LinearGradient
            colors={["#253275", "#DD53A8", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />

          <Text
            style={[styles.subtitle, { color: isDark ? "#6b7db3" : "#64748B" }]}
          >
            {t("subscription.choosePlanToContinue") ||
              "Choose a plan to continue enjoying\npremium features on BUEZ"}
          </Text>

          {/* Trust badges */}
          <View style={styles.trustRow}>
            {[
              {
                icon: "shield",
                label: t("subscription.securePayment") || "Secure payment",
              },
              {
                icon: "x-circle",
                label: t("subscription.cancelAnytime") || "Cancel anytime",
              },
            ].map((badge, i) => (
              <View
                key={i}
                style={[
                  styles.trustBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(69,87,176,0.12)"
                      : "rgba(37,50,117,0.06)",
                  },
                ]}
              >
                <Feather
                  name={badge.icon as any}
                  size={RFPercentage(1.4)}
                  color={isDark ? "#4557B0" : "#253275"}
                />
                <Text
                  style={[
                    styles.trustText,
                    { color: isDark ? "#4557B0" : "#253275" },
                  ]}
                >
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Plan Cards ── */}
        <View style={styles.cardsContainer}>
          <FlatList
            ref={flatListRef}
            data={plans}
            renderItem={renderPlanCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={screenWidth * 0.8 + RFPercentage(2)}
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            initialScrollIndex={0}
            getItemLayout={(data, index) => ({
              length: screenWidth * 0.8 + RFPercentage(2),
              offset: (screenWidth * 0.8 + RFPercentage(2)) * index,
              index,
            })}
          />
        </View>

        {/* ── Dot indicators ── */}
        {/* <View style={styles.indicatorsContainer}>
          {plans.map((plan, index) => (
            <LinearGradient
              key={plan.id}
              colors={
                currentIndex === index
                  ? ["#253275", "#DD53A8"]
                  : [
                      isDark ? "#1e2240" : "#d1d5e8",
                      isDark ? "#1e2240" : "#d1d5e8",
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.indicator,
                { width: currentIndex === index ? RFPercentage(3) : RFPercentage(1) },
              ]}
            />
          ))}
        </View> */}
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: isDark
              ? "rgba(8,11,26,0.97)"
              : "rgba(240,243,255,0.97)",
            borderTopColor: isDark
              ? "rgba(69,87,176,0.15)"
              : "rgba(37,50,117,0.08)",
          },
        ]}
      >
        <TouchableOpacity
          onPress={openPaymentSheet}
          disabled={loading}
          activeOpacity={0.88}
          style={styles.ctaOuter}
        >
          <LinearGradient
            colors={["#253275", "#4557B0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaBtnText}>
                  {`${t("subscription.renewWith") || "Start with"} ${
                    plans.find((p) => p.id === selectedPlan)?.title
                  }`}
                </Text>
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
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: RFPercentage(16) },

  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RFPercentage(28),
  },

  // ── Header ──
  header: {
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
    paddingTop: Platform.OS === "android" ? RFPercentage(8) : RFPercentage(8),
    marginBottom: RFPercentage(1),
  },
  titleBadgeWrap: { marginBottom: RFPercentage(1.8) },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.55),
    borderRadius: 100,
  },
  titleBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.3),
    color: "#fff",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: RFPercentage(2.7),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: RFPercentage(0.8),
  },
  titleUnderline: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginBottom: RFPercentage(1.2),
  },
  subtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.4),
    marginBottom: RFPercentage(2),
  },
  trustRow: {
    flexDirection: "row",
    gap: RFPercentage(1),
    flexWrap: "wrap",
    justifyContent: "center",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
    paddingHorizontal: RFPercentage(1.3),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 100,
  },
  trustText: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.3),
  },

  // ── Cards ──
  cardsContainer: { marginTop: RFPercentage(2) },
  flatListContent: { alignItems: "center", paddingVertical: RFPercentage(2) },

  planCard: {
    width: screenWidth * 0.8,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    // elevation: 8,
    marginBottom: RFPercentage(2),
  },
  cardTopBar: { height: 3, width: "100%" },
  cardBody: { padding: RFPercentage(2.5) },

  popularBadge: {
    // position: "absolute",
    // top: -RFPercentage(0.1),
    alignSelf: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.55),
    borderRadius: 100,
    zIndex: 10,
    // left: "20%",
    // right: "20%",
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  popularText: {
    color: "#fff",
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  selectedGlow: { ...StyleSheet.absoluteFillObject },

  // Plan header
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginBottom: RFPercentage(1.6),
  },
  planIconBubble: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // elevation: 6,
  },
  planTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
    letterSpacing: -0.3,
  },
  planDescription: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },

  cardDivider: { height: 1, marginVertical: RFPercentage(1.4) },

  // Price
  priceSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: RFPercentage(1),
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: RFPercentage(0.6),
  },
  price: {
    fontSize: RFPercentage(4.2),
    fontFamily: "Poppins_700Bold",
    letterSpacing: -1,
  },
  priceDecimal: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
  },
  period: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    paddingBottom: RFPercentage(0.5),
  },

  // Highlight
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: RFPercentage(1),
  },
  highlightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.45),
    borderRadius: 100,
  },
  highlightText: {
    fontSize: RFPercentage(1.35),
    fontFamily: "Poppins_600SemiBold",
  },
  originalPrice: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "line-through",
  },

  // Features
  featuresContainer: { gap: RFPercentage(0.9), marginTop: RFPercentage(0.4) },
  featureRow: { flexDirection: "row", alignItems: "center" },
  checkIcon: {
    width: RFPercentage(2.3),
    height: RFPercentage(2.3),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: RFPercentage(1.2),
  },
  checkText: {
    color: "#fff",
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_700Bold",
  },
  featureText: {
    fontSize: RFPercentage(1.55),
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  starsImage: {
    width: RFPercentage(10),
    height: RFPercentage(10),
    alignSelf: "flex-end",
    position: "absolute",
    bottom: RFPercentage(0),
    right: RFPercentage(0),
  },

  // Indicators
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: RFPercentage(0.6),
    marginBottom: RFPercentage(3),
  },
  indicator: {
    height: RFPercentage(0.9),
    borderRadius: 100,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // paddingHorizontal: RFPercentage(3),
    paddingTop: RFPercentage(1.6),
    paddingBottom:
      Platform.OS === "ios" ? RFPercentage(4.5) : RFPercentage(2.8),
    borderTopWidth: 1,
  },
  ctaOuter: {
    width: "90%",
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    alignSelf: "center",
    height: RFPercentage(6.4),
    // elevation: 12,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1),
     borderRadius: RFPercentage(2),
    height: RFPercentage(6.4),
  },
  ctaBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.7),
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
});

export default Subscription;
