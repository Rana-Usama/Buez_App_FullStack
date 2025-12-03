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
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { saveSubscription } from "../services/User.service";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import * as Localization from "expo-localization";
import { handlePaymentSheet } from "../services/Subscription.service";
import { getCurrencyFromLocale, formatCurrency } from "../utils/getCurrency";

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

  const prices = {
    monthly: { USD: 9.5, EUR: 8.9, CHF: 7.9 },
    yearly: { USD: 95, EUR: 89, CHF: 79 },
    free: { USD: 0, EUR: 0, CHF: 0 },
  };

  const locale = Localization.locale;
  const userCurrency = getCurrencyFromLocale(locale);

  const priceLabelForPlan = (planId) => {
    const amount = prices[planId]?.[userCurrency] ?? prices[planId]?.USD ?? 0;
    return formatCurrency(amount, userCurrency);
  };

  const currentPlan =
    userData?.planType || userData?.subscription?.planInterval || "free";

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
        }
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

    console.log("SetupIntent Client Secret:", setupIntentClientSecret);
    console.log("Customer ID:", customerId);

    const { error: initError } = await initPaymentSheet({
      setupIntentClientSecret,
      merchantDisplayName: "BUEZ",
      returnURL: "buez://payment-complete",
    });

    if (initError) {
      console.log("Payment sheet init error:", initError);
      setLoading(false);
      return;
    }

    const { error: paymentError } = await presentPaymentSheet();
    if (paymentError) {
      console.log("Payment sheet error:", paymentError);
      Toast.show({
        type: "info",
        text1: t("toast.upgradePlan.paymentCancelled"),
        text2: t("toast.upgradePlan.tryAgain"),
      });
      setLoading(false);
      return;
    }

    // Payment was successful - get the SetupIntent ID
    const setupIntentId = setupIntentClientSecret.split("_secret")[0];
    console.log("setupIntentId:", setupIntentId);
    console.log("customerId:", customerId);
    console.log("currentSubscriptionId:", userData.subscriptionId);
    console.log("userId:", userId);

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
        }
      );

      const result = await res.json();
      console.log("Upgrade result:", result);

      if (result.success) {
        await updateSubscriptionStatus(
          result?.currentPeriodStart,
          result?.currentPeriodEnd
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
      console.log("Fetch error:", error);
      Toast.show({
        type: "error",
        text1: t("toast.upgradePlan.upgradeFailed"),
        text2: t("toast.upgradePlan.tryAgainLater"),
      });
    } finally {
      setLoading(false);
    }
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
      originalPrice: formatCurrency(
        prices.monthly[userCurrency] * 12,
        userCurrency
      ),
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

  const monthlyAmount = prices.monthly[userCurrency] ?? prices.monthly.USD;
  const yearlyAmount = prices.yearly[userCurrency] ?? prices.yearly.USD;

  // Compute savings with currency formatting
  const yearlySavings = {
    monthlyCost: formatCurrency(monthlyAmount * 12, userCurrency), // total if paying monthly
    yearlyCost: formatCurrency(yearlyAmount, userCurrency), // yearly plan cost
    savings: formatCurrency(monthlyAmount * 12 - yearlyAmount, userCurrency), // saved amount
    savingsPercentage: Math.round(
      ((monthlyAmount * 12 - yearlyAmount) / (monthlyAmount * 12)) * 100
    ), // e.g., 25%
  };

  const renderPlanCard = ({ item, index }) => (
    <View
      style={[
        styles.planCard,
        {
          backgroundColor: theme.white,
          borderColor: item.current
            ? theme.primary
            : item.popular
            ? theme.secondary
            : theme.stroke,
          borderWidth: item.current || item.popular ? 1.5 : 1,
          marginLeft: index === 0 ? RFPercentage(3) : RFPercentage(1),
          marginRight:
            index === plans.length - 1 ? RFPercentage(3) : RFPercentage(1),
          opacity: item.current ? 0.9 : 1,
          padding:
            currentPlan === "monthly" ? RFPercentage(4) : RFPercentage(3),
        },
      ]}
    >
      {/* Current Plan Badge */}
      {item.current && (
        <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.currentBadgeText}>
            {t("upgradePlan.currentPlan") || "CURRENT PLAN"}
          </Text>
        </View>
      )}

      {/* Recommended Badge */}
      {item.popular && (
        <View
          style={[
            styles.recommendedBadge,
            { backgroundColor: theme.secondary },
          ]}
        >
          <Text style={styles.recommendedBadgeText}>
            {t("upgradePlan.recommended") || "RECOMMENDED"}
          </Text>
        </View>
      )}

      {/* Plan Header */}
      <View style={styles.planHeader}>
        <View>
          <Text
            style={[
              styles.planTitle,
              {
                color: item.current
                  ? theme.primary
                  : item.popular
                  ? theme.secondary
                  : theme.primary,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.planDescription, { color: theme.darkGrey }]}>
            {item.description}
          </Text>
        </View>
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <View style={styles.priceContainer}>
          {(() => {
            const priceStr = priceLabelForPlan(item.id);
            const [integerPart, decimalPart] = priceStr.split(".");
            return (
              <Text
                style={[
                  styles.price,
                  {
                    color:
                      item.id === "yearly" ? theme.secondary : theme.primary,
                  },
                ]}
              >
                {integerPart}
                {decimalPart && (
                  <Text style={{ fontSize: RFPercentage(1.9) }}>
                    .{decimalPart}
                  </Text>
                )}
              </Text>
            );
          })()}
          <Text style={[styles.period, { color: theme.darkGrey }]}>
            {item.period}
          </Text>
        </View>
      </View>

      {/* Savings Badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: RFPercentage(2),
        }}
      >
        {item.savings && (
          <View
            style={[styles.savingsBadge, { backgroundColor: theme.secondary }]}
          >
            <Text style={styles.savingsText}>{item.savings}</Text>
          </View>
        )}

        {item.originalPrice && (
          <Text style={[styles.originalPrice, { color: theme.darkGrey }]}>
            {item.originalPrice}
          </Text>
        )}
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {item.features.map((feature, featureIndex) => (
          <View key={featureIndex} style={styles.featureRow}>
            <View
              style={[
                styles.checkIcon,
                {
                  backgroundColor: item.current
                    ? theme.border
                    : item.popular
                    ? theme.border
                    : theme.border,
                },
              ]}
            >
              <Text style={styles.checkText}>✓</Text>
            </View>
            <Text style={[styles.featureText, { color: theme.heading }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Upgrade Button - Only show for yearly plan */}
      {item.popular && (
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: theme.secondary }]}
          onPress={openPaymentSheet}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={"white"} />
          ) : (
            <Text style={styles.upgradeButtonText}>
              {t("upgradePlan.upgradeNow") || "Upgrade Now"}
            </Text>
          )}
        </TouchableOpacity>
      )}
      <View>
        <Image
          source={Icons.stars}
          resizeMode="contain"
          style={{
            width: RFPercentage(10),
            height: RFPercentage(10),
            alignSelf: "flex-end",
            position: "absolute",
            bottom: -RFPercentage(4),
            right: -RFPercentage(3),
          }}
        />
      </View>
    </View>
  );

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="keyboard-backspace"
            style={{ fontSize: RFPercentage(2.9) }}
            color={theme.grey}
          />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: theme.heading }]}>
            {t("upgradePlan.upgradeYourPlan") || "Upgrade Your Plan"}
          </Text>
          {/* <Text style={[styles.subtitle, { color: theme.darkGrey }]}>
            {t("upgradePlan.getBetterValue") ||
              "Switch to yearly and save money"}
          </Text> */}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Savings Highlight */}
        <View
          style={[
            styles.savingsContainer,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "15",
            },
          ]}
        >
          <Text style={[styles.savingsTitle, { color: theme.primary }]}>
            {t("upgradePlan.youSave")} {highlightText}
          </Text>
          <Text style={[styles.savingsDescription, { color: theme.darkGrey }]}>
            {t("upgradePlan.yearlySavings")} {yearlySavings.savings}
          </Text>
        </View>

        {/* Plan Comparison */}
        <View style={styles.comparisonContainer}>
          <Text style={[styles.comparisonTitle, { color: theme.primary }]}>
            {t("upgradePlan.planComparison") || "Plan Comparison"}
          </Text>

          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonLabel, { color: theme.darkGrey }]}>
              {t("upgradePlan.monthlyCost") || "Monthly plan cost per year:"}
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.darkGrey }]}>
              {yearlySavings.monthlyCost}
            </Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonLabel, { color: theme.darkGrey }]}>
              {t("upgradePlan.yearlyCost") || "Yearly plan cost:"}
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.secondary }]}>
              {yearlySavings.yearlyCost}
            </Text>
          </View>

          <View style={[styles.comparisonRow, styles.totalSavingsRow]}>
            <Text
              style={[
                styles.comparisonLabel,
                { color: theme.primary, fontFamily: "Poppins_600SemiBold" },
              ]}
            >
              {t("upgradePlan.totalSavings") || "Your total savings:"}
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.secondary }]}>
              {yearlySavings.savings}
            </Text>
          </View>
        </View>

        {/* Horizontal Plan Cards */}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: RFPercentage(4),
  },
  header: {
    alignItems: "center",
    paddingTop: RFPercentage(4),
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
    borderBottomWidth: RFPercentage(0.1),
    paddingBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  logo: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    marginBottom: RFPercentage(2),
  },
  title: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(2),
  },
  subtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(1.8),
  },
  savingsContainer: {
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(3),
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    alignItems: "center",
  },
  savingsTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.5),
  },
  savingsDescription: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  comparisonContainer: {
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(3),
    padding: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.stroke,
    borderRadius: RFPercentage(2),
  },
  comparisonTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(1.5),
    textAlign: "center",
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  totalSavingsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.stroke,
    paddingTop: RFPercentage(1),
    marginTop: RFPercentage(1),
  },
  comparisonLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  comparisonValue: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
  cardsContainer: {
    marginVertical: RFPercentage(3),
  },
  flatListContent: {
    alignItems: "center",
    paddingVertical: RFPercentage(2),
  },
  planCard: {
    width: screenWidth * 0.8,
    borderRadius: RFPercentage(3),
    padding: RFPercentage(3),
    borderWidth: 1,
    borderColor: Colors.stroke,
    marginBottom: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentBadge: {
    position: "absolute",
    top: -RFPercentage(1.5),
    alignSelf: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    zIndex: 1,
  },
  currentBadgeText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_700Bold",
  },
  recommendedBadge: {
    position: "absolute",
    top: -RFPercentage(1.5),
    alignSelf: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    zIndex: 1,
  },
  recommendedBadgeText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_700Bold",
  },
  planHeader: {
    marginBottom: RFPercentage(2),
  },
  planTitle: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.5),
  },
  planDescription: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: RFPercentage(2),
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: RFPercentage(4.5),
    fontFamily: "Poppins_700Bold",
    marginRight: RFPercentage(1),
  },
  period: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  originalPrice: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "line-through",
    opacity: 0.8,
  },
  savingsBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    // marginBottom: RFPercentage(2),
  },
  savingsText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  featuresContainer: {
    // marginBottom: RFPercentage(2),
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.2),
  },
  checkIcon: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderRadius: RFPercentage(1.1),
    alignItems: "center",
    justifyContent: "center",
    marginRight: RFPercentage(1.5),
  },
  checkText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_700Bold",
  },
  featureText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  upgradeButton: {
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    marginTop: RFPercentage(2),
    zIndex:9999
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  benefitsContainer: {
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2),
    padding: RFPercentage(2),
  },
  benefitsTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(1.5),
    textAlign: "center",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  benefitIcon: {
    fontSize: RFPercentage(2),
    marginRight: RFPercentage(1.5),
    width: RFPercentage(3),
    textAlign: "center",
  },
  benefitText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    flex: 1,
    lineHeight: RFPercentage(2),
  },
});

export default UpgradePlan;
