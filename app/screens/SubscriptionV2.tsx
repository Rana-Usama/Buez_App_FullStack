import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useStripe } from "@stripe/stripe-react-native";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import Colors from "../config/Colors";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import * as Localization from "expo-localization";
import { handlePaymentSheet } from "../services/Subscription.service";
import { getCurrencyFromLocale, formatCurrency } from "../utils/getCurrency";
import {
  SUBSCRIPTION_PRICES,
  getIntroMonthlyAmount,
  getRegularYearlyEquivalent,
  getYearlySavings,
  INTRO_MONTHS,
} from "../config/subscriptionPricing";
import { Icons } from "../config/theme";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import {
  useNavigation,
  NavigationProp,
  ParamListBase,
} from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");

function SubscriptionV2(props: any) {
  const { t } = useTranslation();
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const { theme } = useAppTheme();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const isDark = theme.mode === "dark";

  // Shared display pricing (single source of truth for all pricing screens).
  const prices = SUBSCRIPTION_PRICES;

  const locale = Localization.locale;
  const userCurrency = getCurrencyFromLocale(locale);

  const priceLabelForPlan = (planId : any) => {
    const amount = prices[planId]?.[userCurrency] ?? prices[planId]?.USD ?? 0;
    return formatCurrency(amount, userCurrency);
  };

  // Intro pricing: the Stripe coupon takes 4.00 (in the billing currency) off
  // the first 3 monthly cycles, so the advertised monthly price is the
  // discounted one ($3.90) with the standard price ($7.90) shown below it.
  const introMonthlyPrice = formatCurrency(
    getIntroMonthlyAmount(userCurrency),
    userCurrency,
  );

  // Monthly shows the intro price as the primary figure; other plans show
  // their standard price.
  const displayPriceForPlan = (planId : any) =>
    planId === "monthly" ? introMonthlyPrice : priceLabelForPlan(planId);

  const openPaymentSheet = async () => {
    setLoading(true);
    try {
      const result = await handlePaymentSheet({
        initPaymentSheet,
        presentPaymentSheet,
        selectedPlan,
        userCurrency,
        email: userData?.email,
        userId,
        t,
      });
      console.log("res.........", result);
      if (result.success) {
        props.navigation.navigate("InterestSelection");
      } else {
        setModalVisible2(true);
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: t("toast.subscriptionV2.error"),
        text2: t("toast.subscriptionV2.tryAgain"),
      });
    } finally {
      setLoading(false);
    }
  };

  const yearlyPrice = priceLabelForPlan("yearly");
  const monthlyPrice = priceLabelForPlan("monthly");

  // Intro highlight for the Monthly plan — built from the configured intro
  // price/duration instead of a hardcoded "$3.90 for first 3 months" string,
  // so it stays correct for every currency and if the offer ever changes.
  const introHighlightText = t("subscriptionV2.introOfferDynamic", {
    price: introMonthlyPrice,
    months: INTRO_MONTHS,
  });

  // Original yearly price (regular monthly price × 12) and the savings from
  // choosing yearly instead — both amount and percentage — computed from the
  // centralized SUBSCRIPTION_PRICES config for the user's currency. No
  // hardcoded numbers: change the config and this recalculates everywhere.
  //
  // PRE-PURCHASE baseline (standardMonthly × 12 = $94.80 → "Save 17%"): the
  // viewer hasn't consumed the intro offer yet. UpgradePlan intentionally uses
  // a different baseline for existing subscribers — see the "two
  // yearly-savings baselines" note in config/subscriptionPricing.ts before
  // changing either one.
  const originalYearlyPrice = formatCurrency(
    getRegularYearlyEquivalent(userCurrency),
    userCurrency,
  );
  const { amount: yearlySavingsAmount, percentage: savingsPercentage } =
    getYearlySavings(userCurrency);
  const savingsAmountFormatted = formatCurrency(
    yearlySavingsAmount,
    userCurrency,
  );
  const savingsPercentRounded = Math.round(savingsPercentage);
  const highlightText = t("subscriptionV2.saveLabel", {
    percent: savingsPercentRounded,
  });
  const savingsCaption = t("subscriptionV2.yearlySavingsCaption", {
    amount: savingsAmountFormatted,
  });

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
      highlight: introHighlightText,
    },
    {
      id: "yearly",
      title: t("subscriptionV2.yearly"),
      price: yearlyPrice,
      period: t("subscriptionV2.perYear"),
      originalPrice: originalYearlyPrice,
      savingsCaption,
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

  const handleScroll = (event : any) => {
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

  const getBorderGradient = (isSelected : any) => {
    if (!isSelected)
      return {
        borderColor: isDark ? Colors.primary2Alpha18 : Colors.primaryAlpha10,
      };
    return { borderColor: Colors.primary, borderWidth: 1.5 };
  };

  // ── PLAN CARD RENDERER ────────────────────────────────────────────────────
  const renderPlanCard = ({ item, index }) => {
    const isSelected = selectedPlan === item.id;
    const accentColor = item.id === "monthly" ? Colors.primary : Colors.secondary;

    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          {
            backgroundColor: isDark ? "rgba(7, 9, 25, 0.95)" : Colors.white,
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
              ? [Colors.primary, Colors.success2]
              : [Colors.primary, Colors.secondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopBar}
        />

        {/* Popular badge */}
        {item.popular && (
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.popularBadge}
          >
            <Text style={styles.popularText} numberOfLines={1}>
              ✦ {t("subscriptionV2.mostPopular")}
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
            {/* Icon bubble */}
            <LinearGradient
              colors={[accentColor, accentColor + "BB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planIconBubble}
            >
              <Feather
                name={item.id === "monthly" ? "calendar" : "star"}
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
                  { color: isDark ? "#909fccff" : Colors.desc },
                ]}
                numberOfLines={1}
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
                const priceStr = displayPriceForPlan(item.id);
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
                          { color: isDark ? "#acb8daff" : Colors.desc },
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
                  { color: isDark ? "#8f9dc8ff" : Colors.inputFieldPlaceholder },
                ]}
              >
                {item.period}
              </Text>
            </View>
          </View>

          {/* Intro offer line (monthly only) — states the promotional price
              and duration explicitly; the badge below it carries the standard
              price the plan renews at. Mirrors UpgradePlan's monthly card. */}
          {item.id === "monthly" && item.highlight && (
            <Text
              style={[
                styles.introHighlight,
                { color: isDark ? Colors.success2 : Colors.primary },
              ]}
              numberOfLines={2}
            >
              {item.highlight}
            </Text>
          )}

          {/* Highlight badge + original price */}
          <View style={styles.highlightRow}>
            <View
              style={[
                styles.highlightBadge,
                {
                  backgroundColor:
                    item.popular || item.id === "yearly"
                      ? Colors.secondarySolid
                      : isDark
                        ? Colors.primary2Alpha20
                        : Colors.primaryAlpha08,
                },
              ]}
            >
              <Text
                style={[
                  styles.highlightText,
                  {
                    color:
                      item.popular || item.id === "yearly"
                        ? Colors.secondary
                        : isDark
                          ? "#616ca5ff"
                          : Colors.primary,
                  },
                ]}
              >
                {item.id === "yearly"
                  ? `${item.highlight}`
                  : t("subscriptionV2.thenAfter", { price: monthlyPrice })}
              </Text>
            </View>
            {item.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: isDark ? Colors.blue23 : Colors.inputFieldPlaceholder },
                ]}
              >
                {item.originalPrice}
              </Text>
            )}
          </View>

          {/* Absolute savings amount (yearly only) — computed alongside the
              percentage badge above from the same centralized pricing config. */}
          {item.savingsCaption && (
            <Text
              style={[
                styles.savingsCaption,
                { color: isDark ? Colors.blue23 : Colors.inputFieldPlaceholder },
              ]}
              numberOfLines={1}
            >
              {item.savingsCaption}
            </Text>
          )}

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
                    { color: isDark ? "#a8b3d4ff" : Colors.skip },
                  ]}
                  numberOfLines={1}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Decorative stars image */}
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

  // ─────────────────────────────────────────────────────────────────────────
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
            ? [Colors.primaryAlpha90, "transparent"]
            : [Colors.primaryAlpha92, Colors.white]
        }
        style={styles.topGlow}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Title block ── */}
        <View style={styles.titleContainer}>
          {/* Badge */}
          <View style={styles.titleBadgeWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleBadge}
            >
              <Feather name="zap" size={RFPercentage(1.3)} color={Colors.white} />
              <Text style={styles.titleBadgeText}>
                {t("subscriptionV2.choosePlan")}
              </Text>
            </LinearGradient>
          </View>

          <Text
            style={[
              styles.mainTitle,
              { color: isDark ? Colors.white4 : Colors.blueDark },
            ]}
          >
            {t("subscriptionV2.choosePlan")}
          </Text>

          {/* Gradient underline */}
          <LinearGradient
            colors={[Colors.primary, Colors.secondary, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />

          <Text
            style={[styles.subTitle, { color: isDark ? Colors.blue2 : Colors.desc }]}
          >
            {t("subscriptionV2.startFree")}
          </Text>
        </View>

        {/* ── Plan cards ── */}
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
        <View style={[styles.indicatorsContainer, styles.view2]}>
          {plans.map((plan, index) => (
            <LinearGradient
              key={plan.id}
              colors={
                currentIndex === index
                  ? [Colors.primary, Colors.secondary]
                  : [
                      isDark ? Colors.blueDark11 : Colors.blueLight13,
                      isDark ? Colors.blueDark11 : Colors.blueLight13,
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.indicator,
                {
                  width:
                    currentIndex === index ? RFPercentage(3) : RFPercentage(1),
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.white,
            borderTopColor: isDark
              ? Colors.primary2Alpha15
              : Colors.primaryAlpha08,
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
            colors={[Colors.primary, Colors.success2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={styles.ctaBtnText}>
                  {`${t("subscriptionV2.continueWith")} ${plans.find((p) => p.id === selectedPlan)?.title}`}
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

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Login")}
          style={styles.touchableOpacity}
        >
          <View
            style={{
              height: RFPercentage(3),
              width: RFPercentage(3),
              borderRadius: RFPercentage(100),
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.mode === "dark" ? Colors.black4 : Colors.blueLight12,
            }}
          >
            <Feather
              name="arrow-left"
              size={RFPercentage(2)}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.loginText}>
            {t("emailVerification.backToLogin")}
          </Text>
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

  // ── Title block ──
  titleContainer: {
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
    paddingTop: Platform.OS === "android" ? RFPercentage(8) : RFPercentage(9),
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
    color: Colors.white,
    letterSpacing: 0.2,
  },
  mainTitle: {
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
  subTitle: {
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
  cardsContainer: { marginTop: RFPercentage(1) },
  flatListContent: { alignItems: "center", paddingVertical: RFPercentage(2) },

  planCard: {
    width: screenWidth * 0.8,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
    shadowColor: Colors.primary,
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
    // top: -RFPercentage(2),
    alignSelf: "center",
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 100,
    zIndex: 9999,
    // left: "25%",
    // right: "25%",
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  popularText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
  },

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
    shadowColor: Colors.blackSolid,
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
  introHighlight: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    marginTop: -RFPercentage(0.6),
    marginBottom: RFPercentage(0.8),
  },
  introNote: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_500Medium",
    marginTop: -RFPercentage(0.6),
    marginBottom: RFPercentage(1),
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
  savingsCaption: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginTop: -RFPercentage(0.4),
    marginBottom: RFPercentage(0.6),
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
    color: Colors.white,
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
    right: -RFPercentage(1),
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
    shadowColor: Colors.primary,
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
    // paddingVertical: RFPercentage(1.85),
    gap: RFPercentage(1),
    borderRadius: RFPercentage(2),
    height: RFPercentage(6.4),
  },
  ctaBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.7),
    color: Colors.white,
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: 100,
    backgroundColor: Colors.backBtnBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    // elevation: 20,
    borderWidth: 1,
    borderColor: Colors.primary2Alpha15,
  },
  modalTopBar: { height: 4, width: "100%" },
  modalBody: { padding: RFPercentage(3) },
  modalHeader: {
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginBottom: RFPercentage(2.5),
  },
  modalIconCircle: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // elevation: 8,
  },
  modalTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: RFPercentage(1.2),
    padding: RFPercentage(1.8),
    borderRadius: 14,
    marginBottom: RFPercentage(2),
  },
  infoIcon: { fontSize: RFPercentage(2) },
  infoContent: { flex: 1 },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.55),
    marginBottom: RFPercentage(0.4),
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.4),
    lineHeight: RFPercentage(2.1),
  },

  modalBullets: { gap: RFPercentage(0.8), marginBottom: RFPercentage(2) },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.9),
  },
  bulletDot: { width: 5, height: 5, borderRadius: 3 },
  bulletText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.4),
    flex: 1,
    lineHeight: RFPercentage(2.1),
  },

  modalDivider: { height: 1, marginBottom: RFPercentage(2.5) },

  modalButtonsContainer: {
    flexDirection: "row",
    gap: RFPercentage(1.2),
  },
  modalPrimaryOuter: {
    flex: 1,
    borderRadius: RFPercentage(100),
  },
  modalPrimaryBtn: {
    paddingVertical: RFPercentage(1.6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RFPercentage(100),
  },
  modalPrimaryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.65),
    color: Colors.white,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: RFPercentage(1.6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RFPercentage(100),
    borderWidth: 1,
  },
  modalSecondaryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.65),
  },
  loginText: {
    color: Colors.darkGrey,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.8),
    marginLeft: RFPercentage(1),
  },
  view: { flex: 1 },
  view2: { marginTop: -15 },
  touchableOpacity: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "center",
            marginTop: RFPercentage(1.5),
          },
});

export default SubscriptionV2;
