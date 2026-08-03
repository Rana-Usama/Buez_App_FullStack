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
  ActivityIndicator,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useStripe } from "@stripe/stripe-react-native";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { saveSubscription } from "../services/User.service";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { useNavigation } from "@react-navigation/native";
import * as Localization from "expo-localization";
import { handlePaymentSheet } from "../services/Subscription.service";
import { getCurrencyFromLocale, formatCurrency } from "../utils/getCurrency";
import {
  SUBSCRIPTION_PRICES,
  getPlanAmount,
} from "../config/subscriptionPricing";
import CustomNav from "../components/common/CustomNav";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";

const { width: screenWidth } = Dimensions.get("window");

function UpgradePlan(props) {
  const { t } = useTranslation();
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const { theme } = useAppTheme();
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const isDark = theme.mode === "dark";

  // ── ALL ORIGINAL LOGIC — UNTOUCHED ────────────────────────────────────────

  // Shared display pricing (kept in sync with Stripe via subscriptionPricing).
  const prices = SUBSCRIPTION_PRICES;

  const locale = Localization.locale;
  const userCurrency = getCurrencyFromLocale(locale);

  const priceLabelForPlan = (planId) => {
    const amount = prices[planId]?.[userCurrency] ?? prices[planId]?.USD ?? 0;
    return formatCurrency(amount, userCurrency);
  };

  const currentPlan =
    userData?.planType || userData?.subscription?.planInterval || "free";

  // Intro pricing awareness: during the first 3 discounted monthly cycles the
  // user is billed the coupon price (saved by the Stripe webhook), then the
  // standard monthly price automatically.
  const baseMonthlyAmount = getPlanAmount("monthly", userCurrency);
  const paidAmount =
    typeof userData?.subscription?.amountPaid === "number" &&
    userData.subscription.amountPaid > 0
      ? userData.subscription.amountPaid
      : baseMonthlyAmount;
  const paidCurrency = (
    userData?.subscription?.currency || userCurrency
  ).toUpperCase();
  const isOnIntroPricing =
    currentPlan !== "yearly" && paidAmount < baseMonthlyAmount;

  const updateSubscriptionStatus = async (start, end) => {
    if (!userId) return;
    const userRef = doc(firestore, "users", userId);
    try {
      await updateDoc(userRef, {
        isSubscribed: true,
        subscriptionStart: start,
        subscriptionEnd: end,
        planType: "yearly",
        isCancelled: false,
      });
    } catch (error) {
      console.error("Failed to update subscription status:", error);
    }
  };

  const fetchSetupIntent = async () => {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/payment-sheet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userData?.email, userId }),
        },
      );
      const { setupIntentClientSecret, customerId } = await response.json();
      if (!setupIntentClientSecret || !customerId) {
        throw new Error("Missing client secret or customer ID");
      }
      return { setupIntentClientSecret, customerId };
    } catch (error) {
      Alert.alert("Error", "Could not create customer. Please try again.");
      return null;
    }
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    const setupData = await fetchSetupIntent();
    if (!setupData) return;
    const { setupIntentClientSecret, customerId } = setupData;

    const { error: initError } = await initPaymentSheet({
      setupIntentClientSecret,
      merchantDisplayName: "BUEZ",
      returnURL: "buez://payment-complete",
    });

    if (initError) {
      setLoading(false);
      return;
    }

    const { error: paymentError } = await presentPaymentSheet();
    if (paymentError) {
      Toast.show({
        type: "info",
        text1: t("toast.upgradePlan.paymentCancelled"),
        text2: t("toast.upgradePlan.tryAgain"),
      });
      setLoading(false);
      return;
    }

    const setupIntentId = setupIntentClientSecret.split("_secret")[0];

    try {
      const res = await fetch(
        "https://buez-server-khaki.vercel.app/api/upgrade-plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            currentSubscriptionId: userData.subscriptionId,
            userId,
            setupIntentId,
            userCurrency,
          }),
        },
      );

      const result = await res.json();

      if (result.success) {
        await updateSubscriptionStatus(
          result?.currentPeriodStart,
          result?.currentPeriodEnd,
        );
        await saveSubscription(userId, result?.subscriptionId);
        Toast.show({
          type: "success",
          text1: t("toast.upgradePlan.upgradeSuccess"),
          text2: t("toast.upgradePlan.nowOnYearly"),
        });
        props.navigation.navigate("TabNavigator");
      } else {
        Toast.show({
          type: "error",
          text1: t("toast.upgradePlan.upgradeFailed"),
          text2: result.message || t("toast.upgradePlan.tryAgainLater"),
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("toast.upgradePlan.upgradeFailed"),
        text2: t("toast.upgradePlan.tryAgainLater"),
      });
    } finally {
      setLoading(false);
    }
  };

  const monthlyPrice = priceLabelForPlan("monthly");

  const monthlyRegular = prices.monthly[userCurrency];
  const yearlyPrice = prices.yearly[userCurrency];

  // Amount discounted each month for the intro offer
  const introDiscount = 4.0;

  // First 3 months intro price
  const introMonthly = monthlyRegular - introDiscount;

  // Cost of first year on monthly plan
  const firstYearMonthlyCost = introMonthly * 3 + monthlyRegular * 9;

  const savingsAmount = firstYearMonthlyCost - yearlyPrice;

  const savingsPercentage = (savingsAmount / firstYearMonthlyCost) * 100;
  const highlightText = `Save ${Math.round(savingsPercentage)}%`;

    const yearlySavings = {
    monthlyCost: formatCurrency(firstYearMonthlyCost, userCurrency),
    yearlyCost: formatCurrency(yearlyPrice, userCurrency),
    savings: formatCurrency(savingsAmount, userCurrency),
    savingsPercentage: Math.round(savingsPercentage),
  };

  const plans = [
    {
      id: "monthly",
      title: t("subscriptionV2.monthly") || "Monthly",
      price: monthlyPrice,
      period: t("subscriptionV2.perMonth") || "per month",
      description:
        t("subscriptionV2.fullAccess") || "Full access to all features",
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
        t("subscriptionV2.prioritySupport") || "Priority support",
      ],
      current: true,
    },
    {
      id: "yearly",
      title: t("subscriptionV2.yearly"),
      price: yearlyPrice,
      period: t("subscriptionV2.perYear"),
      originalPrice: yearlySavings?.monthlyCost,
      description: `${t("upgradePlan.bestValue")} ${highlightText}`,
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
        t("subscriptionV2.prioritySupport"),
        t("subscriptionV2.exclusiveContent"),
      ],
      popular: true,
      highlight: t("upgradePlan.recommended"),
      savings: highlightText,
    },
  ];


  // ── PLAN CARD RENDERER ─────────────────────────────────────────────────────
  const renderPlanCard = ({ item, index }) => {
    const accentColor = item.current ? Colors.success2 : Colors.secondary;

    return (
      <View
        style={[
          styles.planCard,
          {
            backgroundColor: isDark ? Colors.black7 : Colors.white,
            borderColor: item.current
              ? isDark
                ? Colors.primary2Alpha40
                : "rgba(37,50,117,0.2)"
              : "#DD53A8AA",
            borderWidth: 1.5,
            marginLeft: index === 0 ? RFPercentage(3) : RFPercentage(1),
            marginRight:
              index === plans.length - 1 ? RFPercentage(3) : RFPercentage(1),
            opacity: item.current ? 0.88 : 1,
          },
        ]}
      >
        {/* Top accent bar */}
        <LinearGradient
          colors={
            item.current ? [Colors.primary, Colors.success2] : [Colors.primary, Colors.secondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopBar}
        />

        {/* Current Plan badge */}
        {item.current && (
          <LinearGradient
            colors={[Colors.primary, Colors.success2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.planBadge}
          >
            <Text style={styles.planBadgeText}>
              {t("upgradePlan.currentPlan") || "CURRENT PLAN"}
            </Text>
          </LinearGradient>
        )}

        {/* Recommended badge */}
        {item.popular && (
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.planBadge}
          >
            <Text style={styles.planBadgeText}>
              ✦ {t("upgradePlan.recommended") || "RECOMMENDED"}
            </Text>
          </LinearGradient>
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
                name={item.current ? "calendar" : "star"}
                size={RFPercentage(2)}
                color={Colors.white}
              />
            </LinearGradient>
            <View style={styles.view}>
              <Text
                style={[
                  styles.planTitle,
                  { color: isDark ? Colors.white4 : Colors.blueDark },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.planDescription,
                  { color: isDark ? Colors.blue2 : Colors.desc },
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
                  ? Colors.primary2Alpha15
                  : Colors.primaryAlpha07,
              },
            ]}
          />

          {/* Price */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              {(() => {
                // Current monthly plan on intro pricing → show what the user
                // is actually billed right now ($3.90 during intro months).
                const priceStr =
                  item.id === "monthly" && isOnIntroPricing
                    ? formatCurrency(paidAmount, paidCurrency)
                    : priceLabelForPlan(item.id);
                const [integerPart, decimalPart] = priceStr.split(".");
                return (
                  <Text
                    style={[
                      styles.price,
                      { color: isDark ? Colors.white4 : Colors.blueDark },
                    ]}
                  >
                    {integerPart}
                    {decimalPart && (
                      <Text
                        style={[
                          styles.priceDecimal,
                          { color: isDark ? Colors.blue : Colors.desc },
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
                  { color: isDark ? Colors.blue2 : Colors.inputFieldPlaceholder },
                ]}
              >
                {item.period}
              </Text>
            </View>
          </View>

          {/* Intro pricing note — standard price after the first 3 months */}
          {item.id === "monthly" && isOnIntroPricing && (
            <Text
              style={[
                styles.introNote,
                { color: isDark ? Colors.blue : Colors.desc },
              ]}
              numberOfLines={2}
            >
              {t("subscriptionV2.thenAfter", { price: monthlyPrice })}
            </Text>
          )}

          {/* Savings badge + original price */}
          <View style={styles.highlightRow}>
            {item.savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{item.savings}</Text>
              </View>
            )}
            {!item.savings && !item.current && <View />}
            {item.current && (
              <View
                style={[
                  styles.currentTag,
                  {
                    backgroundColor: isDark
                      ? Colors.primary2Alpha20
                      : Colors.primaryAlpha08,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currentTagText,
                    { color: isDark ? Colors.success2 : Colors.primary },
                  ]}
                >
                  Active
                </Text>
              </View>
            )}
            {item.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: isDark ? Colors.blue22 : Colors.inputFieldPlaceholder },
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
                  ? Colors.primary2Alpha12
                  : Colors.primaryAlpha06,
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
                    { color: isDark ? Colors.blue : Colors.skip },
                  ]}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Upgrade button — only on yearly card */}
          {item.popular && (
            <TouchableOpacity
              onPress={openPaymentSheet}
              disabled={loading}
              activeOpacity={0.88}
              style={styles.upgradeBtnOuter}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="zap" size={RFPercentage(1.7)} color={Colors.white} />
                    <Text style={styles.upgradeBtnText} numberOfLines={1}>
                      {t("upgradePlan.upgradeNow") || "Upgrade Now"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Stars decoration */}
        <View>
          <Image
            source={Icons.stars}
            resizeMode="contain"
            style={styles.starsImage}
          />
        </View>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <CustomNav title={t("upgradePlan.upgradeYourPlan")} showBack />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Savings hero card ── */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={["#2c43b6a1", "#4557b0d3", "#dd53a8e4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard]}
          >
            <Text style={[styles.heroTitle]}>
              {t("upgradePlan.youSave")} {highlightText}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t("upgradePlan.yearlySavings")} {yearlySavings.savings}
            </Text>
          </LinearGradient>
        </View>

        {/* ── Plan comparison card ── */}
        <View style={styles.sectionWrap}>
          {/* Section label */}
          <View style={styles.sectionLabelRow}>
            <View
              style={[
                styles.sectionDot,
                {
                  backgroundColor: isDark
                    ? Colors.primary2Alpha40
                    : Colors.primaryAlpha15,
                },
              ]}
            >
              <View
                style={[styles.sectionDotInner, styles.view2]}
              />
            </View>
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? Colors.blue4 : Colors.inputFieldPlaceholder },
              ]}
            >
              PLAN COMPARISON
            </Text>
          </View>

          <View
            style={[
              styles.comparisonCard,
              {
                backgroundColor: isDark ? Colors.black7 : Colors.white,
                borderColor: isDark
                  ? Colors.primary2Alpha20
                  : Colors.primaryAlpha10,
              },
            ]}
          >
            <View style={styles.comparisonBody}>
              <Text
                style={[
                  styles.comparisonTitle,
                  { color: isDark ? Colors.blueLight : Colors.blueDark },
                ]}
              >
                {t("upgradePlan.planComparison") || "Plan Comparison"}
              </Text>

              {/* Monthly cost row */}
              <View
                style={[
                  styles.compRow,
                  {
                    borderBottomColor: isDark
                      ? Colors.primary2Alpha12
                      : Colors.primaryAlpha06,
                  },
                ]}
              >
                <View style={styles.compRowLeft}>
                  <View
                    style={[styles.compDot, styles.view2]}
                  />
                  <Text
                    style={[
                      styles.compLabel,
                      { color: isDark ? Colors.blue : Colors.desc },
                    ]}
                  >
                    {t("upgradePlan.monthlyCost") || "Monthly plan (per year)"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.compValue,
                    { color: isDark ? Colors.blue : Colors.desc },
                  ]}
                >
                  {yearlySavings.monthlyCost}
                </Text>
              </View>

              {/* Yearly cost row */}
              <View
                style={[
                  styles.compRow,
                  {
                    borderBottomColor: isDark
                      ? Colors.primary2Alpha12
                      : Colors.primaryAlpha06,
                  },
                ]}
              >
                <View style={styles.compRowLeft}>
                  <View
                    style={[styles.compDot, styles.view3]}
                  />
                  <Text
                    style={[
                      styles.compLabel,
                      { color: isDark ? Colors.blue : Colors.desc },
                    ]}
                  >
                    {t("upgradePlan.yearlyCost") || "Yearly plan cost"}
                  </Text>
                </View>
                <Text style={[styles.compValue, styles.text]}>
                  {yearlySavings.yearlyCost}
                </Text>
              </View>

              {/* Total savings row */}
              <View style={[styles.compRow, styles.view4]}>
                <View style={styles.compRowLeft}>
                  <View
                    style={[styles.compDot, styles.view5]}
                  />
                  <Text
                    style={[
                      styles.compLabel,
                      {
                        color: isDark ? Colors.blueLight : Colors.blueDark,
                        fontFamily: "Poppins_600SemiBold",
                      },
                    ]}
                  >
                    {t("upgradePlan.totalSavings") || "Your total savings"}
                  </Text>
                </View>
                <View style={styles.savingsChip}>
                  <Text style={styles.savingsChipText}>
                    {yearlySavings.savings}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Plan cards ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionLabelRow}>
            <View
              style={[
                styles.sectionDot,
                {
                  backgroundColor: isDark
                    ? Colors.primary2Alpha40
                    : Colors.primaryAlpha15,
                },
              ]}
            >
              <View
                style={[styles.sectionDotInner, styles.view3]}
              />
            </View>
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? Colors.blue4 : Colors.inputFieldPlaceholder },
              ]}
            >
              PLANS
            </Text>
          </View>
        </View>

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
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: RFPercentage(6) },

  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RFPercentage(28),
  },

  // ── Hero savings card ──
  heroWrap: {
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2.5),
    marginBottom: RFPercentage(1),
  },
  heroCard: {
    borderRadius: 20,
    padding: RFPercentage(2.8),
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroPill: {
    backgroundColor: Colors.backBtnBg,
    borderRadius: 100,
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.5),
    marginBottom: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.white3,
  },
  heroPillText: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.55),
    color: Colors.white,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(2.2),
    color: Colors.white,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: RFPercentage(0.5),
  },
  heroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
    color: Colors.whiteAlpha75,
    textAlign: "center",
  },

  // ── Section label ──
  sectionWrap: {
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(3),
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.4),
  },
  sectionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionDotInner: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.5),
    letterSpacing: 2,
  },

  // ── Comparison card ──
  comparisonCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  cardTopBar: { height: 3, width: "100%" },
  comparisonBody: { padding: RFPercentage(2.2) },
  comparisonTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.7),
    letterSpacing: -0.2,
    marginBottom: RFPercentage(1.6),
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: RFPercentage(1.1),
    borderBottomWidth: 1,
  },
  compRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
    flex: 1,
  },
  compDot: { width: 7, height: 7, borderRadius: 4 },
  compLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.45),
    flex: 1,
  },
  compValue: { fontFamily: "Poppins_600SemiBold", fontSize: RFPercentage(1.5) },
  savingsChip: {
    backgroundColor: "rgba(76,175,80,0.15)",
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.35),
    borderRadius: 100,
  },
  savingsChipText: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.4),
    color: Colors.green,
  },

  // ── Plan cards ──
  cardsContainer: { marginTop: RFPercentage(0.5) },
  flatListContent: { alignItems: "center", paddingVertical: RFPercentage(2) },

  planCard: {
    width: screenWidth * 0.8,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    marginBottom: RFPercentage(2),
  },
  cardBody: { padding: RFPercentage(2.5) },

  planBadge: {
    alignSelf: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.55),
    borderRadius: 100,
    marginTop: RFPercentage(1),
    marginBottom: -RFPercentage(0.5),
    alignItems: "center",
  },
  planBadgeText: {
    color: Colors.white,
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },

  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginBottom: RFPercentage(1.6),
    marginTop: RFPercentage(1),
  },
  planIconBubble: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  planTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
    letterSpacing: -0.3,
  },
  planDescription: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_400Regular",
  },

  cardDivider: { height: 1, marginVertical: RFPercentage(1.4) },

  priceSection: {
    flexDirection: "row",
    alignItems: "flex-end",
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
  priceDecimal: { fontSize: RFPercentage(2), fontFamily: "Poppins_400Regular" },
  period: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    paddingBottom: RFPercentage(0.5),
  },
  introNote: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_500Medium",
    marginTop: -RFPercentage(0.6),
    marginBottom: RFPercentage(1),
  },

  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: RFPercentage(1),
  },
  savingsBadge: {
    backgroundColor: Colors.secondarySolid,
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.45),
    borderRadius: 100,
  },
  savingsText: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.35),
    color: Colors.secondary,
  },

  currentTag: {
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.4),
    borderRadius: 100,
  },
  currentTagText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.3),
  },
  originalPrice: {
    fontSize: RFPercentage(1.65),
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "line-through",
  },

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
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_700Bold",
  },
  featureText: {
    fontSize: RFPercentage(1.55),
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },

  // Upgrade button inside yearly card
  upgradeBtnOuter: {
    marginTop: RFPercentage(2.2),
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    zIndex: 10,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: RFPercentage(6),
    gap: RFPercentage(0.8),
    borderRadius: 100,
  },
  upgradeBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.75),
    color: Colors.white,
    letterSpacing: 0.2,
  },

  starsImage: {
    width: RFPercentage(10),
    height: RFPercentage(10),
    alignSelf: "flex-end",
    position: "absolute",
    bottom: RFPercentage(0),
    right: RFPercentage(0),
  },
  view: { flex: 1 },
  view2: { backgroundColor: Colors.success2 },
  view3: { backgroundColor: Colors.secondary },
  text: { color: Colors.secondary },
  view4: { borderBottomWidth: 0 },
  view5: { backgroundColor: Colors.green },
});

export default UpgradePlan;
