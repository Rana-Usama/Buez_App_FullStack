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

const { width: screenWidth } = Dimensions.get("window");

function Subscription(props) {
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
    console.log("res...............", res);
    if (res.success) {
      props.navigation.navigate("TabNavigator");
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
        userCurrency
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
      contentOffsetX / (screenWidth * 0.8 + RFPercentage(2))
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
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    };
  };

  const getBorderGradient = (isSelected) => {
    if (!isSelected) return { borderColor: "rgba(232, 232, 232, 1)" };
    return {
      borderColor: theme.primary,
      borderWidth: 1.2,
    };
  };

  const renderPlanCard = ({ item, index }) => {
    const isSelected = selectedPlan === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          {
            backgroundColor: theme.white,
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
        {item.popular && (
          <View
            style={[styles.popularBadge, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.popularText}>
              {t("subscriptionV2.mostPopular") || "MOST POPULAR"}
            </Text>
          </View>
        )}

        {/* Selection Glow Effect */}
        {isSelected && (
          <View
            style={[
              styles.selectedGlow,
              { backgroundColor: theme.primary + "05" },
            ]}
          />
        )}

        {/* Plan Header */}
        <View style={styles.planHeader}>
          <View>
            <Text style={[styles.planTitle, { color: theme.primary }]}>
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
                <Text style={[styles.price, { color: theme.primary }]}>
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

        {/* Highlight Badge */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: RFPercentage(2),
          }}
        >
          <View
            style={[
              styles.highlightBadge,
              {
                backgroundColor: item.popular
                  ? theme.secondary
                  : item.id === "yearly"
                  ? theme.secondary
                  : theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "15",
              },
            ]}
          >
            <Text
              style={[
                styles.highlightText,
                {
                  color:
                    item.popular || item.id === "yearly"
                      ? theme.white
                      : theme.primary,
                  fontSize:
                    item.popular || item.id === "yearly"
                      ? RFPercentage(1.5)
                      : RFPercentage(1.3),
                },
              ]}
            >
              {item.highlight}
            </Text>
          </View>

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
                style={[styles.checkIcon, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={[styles.featureText, { color: theme.heading }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        <View>
          <Image
            source={Icons.stars}
            resizeMode="contain"
            style={{
              width: RFPercentage(10),
              height: RFPercentage(10),
              alignSelf: "flex-end",
              position: "absolute",
              bottom: -RFPercentage(3),
              right: -RFPercentage(2),
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
       <StatusBar
              barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
              backgroundColor={"transparent"}
              translucent
            />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.title, { color: theme.primary }]}>
              {t("subscription.renewSubscription") || "Renew Subscription"}
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: theme.darkGrey }]}>
            {t("subscription.choosePlanToContinue") ||
              "Choose a plan to continue enjoying premium features"}
          </Text>
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
            initialScrollIndex={0} // Start with yearly plan (index 1)
            getItemLayout={(data, index) => ({
              length: screenWidth * 0.8 + RFPercentage(2),
              offset: (screenWidth * 0.8 + RFPercentage(2)) * index,
              index,
            })}
          />
        </View>

        {/* Plan Indicators */}
        <View style={styles.indicatorsContainer}>
          {plans.map((plan, index) => (
            <View
              key={plan.id}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    currentIndex === index ? theme.primary : theme.stroke,
                  width:
                    currentIndex === index
                      ? RFPercentage(2.5)
                      : RFPercentage(1),
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          { borderTopColor: theme.border, backgroundColor: theme.white },
        ]}
      >
        <MyAppButton
          title={`${t("subscription.renewWith") || "Renew with"} ${
            plans.find((p) => p.id === selectedPlan)?.title
          }`}
          onPress={openPaymentSheet}
          width={"100%"}
          loading={loading}
          marginTop={RFPercentage(1.5)}
          height={Platform.OS === "ios" ? RFPercentage(6.5) : RFPercentage(7)}
        />
      </View>
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
    paddingBottom: RFPercentage(16),
  },
  header: {
    alignItems: "center",
    marginTop: Platform.OS === "android" ? RFPercentage(7) : RFPercentage(4),
    paddingHorizontal: RFPercentage(3),
  },
  logo: {
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  title: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
  },
  subtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.2),
  },
  cardsContainer: {
    marginTop: RFPercentage(6),
  },
  flatListContent: {
    alignItems: "center",
    paddingVertical: RFPercentage(1.8),
  },
  planCard: {
    width: screenWidth * 0.8,
    borderRadius: RFPercentage(2),
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
    position: "relative",
    // overflow: "hidden",
  },
  selectedGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RFPercentage(2),
  },
  popularBadge: {
    position: "absolute",
    top: -RFPercentage(1.5),
    alignSelf: "center",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    zIndex: 1,
  },
  popularText: {
    color: Colors.white,
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_700Bold",
  },
  planHeader: {
    marginBottom: RFPercentage(1),
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
    marginBottom: RFPercentage(1),
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
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "line-through",
    opacity: 0.8,
  },
  highlightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    // marginBottom: RFPercentage(2),
  },
  highlightText: {
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
  selectionIndicator: {
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    alignItems: "center",
  },
  selectionText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(3),
  },
  indicator: {
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    marginHorizontal: RFPercentage(0.5),
  },
  infoContainer: {
    paddingHorizontal: RFPercentage(3),
    gap: RFPercentage(1.5),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontSize: RFPercentage(2),
    marginRight: RFPercentage(1),
  },
  infoText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: RFPercentage(3),
    borderTopWidth: 1,
    borderTopColor: Colors.stroke,
    height: RFPercentage(11),
  },
});

export default Subscription;
