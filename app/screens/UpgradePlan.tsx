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

  const currentPlan = "monthly"; // This should come from your user context or props

  const updateSubscriptionStatus = async (start, end) => {
    if (!userId) return;
    const userRef = doc(firestore, "users", userId);
    try {
      await updateDoc(userRef, {
        isSubscribed: true,
        subscriptionStart: start,
        subscriptionEnd: end,
        planType: "yearly", // Update to yearly plan
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
          body: JSON.stringify({ email: userData?.email }),
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
    console.log("setupIntentId..........", setupIntentId);

    const res = await fetch(
      "https://buez-server-khaki.vercel.app/api/upgrade-plan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          currentSubscriptionId: userData.subscriptionId,
          userId,
        }),
      }
    );

    const result = await res.json();
    console.log("result..........", result);
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
        text2: t("toast.upgradePlan.tryAgainLater"),
      });
    }
  };

  const plans = [
    {
      id: "monthly",
      title: t("subscriptionV2.monthly") || "Monthly",
      price: "$12",
      price2: ".99",
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
      title: t("subscriptionV2.yearly") || "Yearly",
      price: "$99",
      price2: ".99",
      period: t("subscriptionV2.perYear") || "per year",
      originalPrice: "$155",
      description: t("upgradePlan.bestValue") || "Best value - Save 36%",
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
        t("subscriptionV2.prioritySupport") || "Priority support",
        t("subscriptionV2.exclusiveContent") || "Exclusive content",
      ],
      popular: true,
      highlight: t("upgradePlan.recommended") || "Recommended",
      savings: t("upgradePlan.save36") || "Save 36%",
    },
  ];

  const yearlySavings = {
    monthlyCost: 12.99 * 12, // $155.88 yearly
    yearlyCost: 99.99, // $99.99 yearly
    savings: 12.99 * 12 - 99.99, // $55.89 savings
    savingsPercentage: Math.round(((12.99 * 12 - 99.99) / (12.99 * 12)) * 100), // 36% savings
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
          <Text
            style={[
              styles.price,
              {
                color: item.current
                  ? theme.primary
                  : item.popular
                  ? theme.secondary
                  : theme.primary,
              },
            ]}
          >
            {item.price}
            <Text style={{ fontSize: RFPercentage(2.3) }}>{item.price2}</Text>
          </Text>
          <Text style={[styles.period, { color: theme.darkGrey }]}>
            {item.period}
          </Text>
          {item.originalPrice && (
            <Text style={[styles.originalPrice, { color: theme.darkGrey }]}>
              {item.originalPrice}
            </Text>
          )}
        </View>
      </View>

      {/* Savings Badge */}
      {item.savings && (
        <View
          style={[styles.savingsBadge, { backgroundColor: theme.secondary }]}
        >
          <Text style={styles.savingsText}>{item.savings}</Text>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresContainer}>
        {item.features.map((feature, featureIndex) => (
          <View key={featureIndex} style={styles.featureRow}>
            <View
              style={[
                styles.checkIcon,
                {
                  backgroundColor: item.current
                    ? theme.primary
                    : item.popular
                    ? theme.secondary
                    : theme.primary,
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
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.white} />
          ) : (
            <Text style={styles.upgradeButtonText}>
              {t("upgradePlan.upgradeNow") || "Upgrade Now"}
            </Text>
          )}
        </TouchableOpacity>
      )}
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
          style={{ position: "absolute", left: RFPercentage(2) }}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="keyboard-backspace"
            style={{ fontSize: RFPercentage(2.9) }}
            color={theme.primary}
          />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: theme.primary }]}>
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
            {t("upgradePlan.youSave") || `You Save $55.89%`}
          </Text>
          <Text style={[styles.savingsDescription, { color: theme.darkGrey }]}>
            {t("upgradePlan.yearlySavings") ||
              `Switch to yearly and save $${yearlySavings.savings.toFixed(
                2
              )} per year`}
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
              ${yearlySavings.monthlyCost.toFixed(2)}
            </Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonLabel, { color: theme.darkGrey }]}>
              {t("upgradePlan.yearlyCost") || "Yearly plan cost:"}
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.secondary }]}>
              ${yearlySavings.yearlyCost.toFixed(2)}
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
              ${yearlySavings.savings.toFixed(2)}
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
    paddingTop: RFPercentage(2),
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: RFPercentage(0.06),
    paddingBottom: RFPercentage(1),
  },
  logo: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    marginBottom: RFPercentage(2),
  },
  title: {
    fontSize: RFPercentage(2.3),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(0.9),
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
    marginLeft: RFPercentage(5),
  },
  savingsBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    marginBottom: RFPercentage(2),
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
