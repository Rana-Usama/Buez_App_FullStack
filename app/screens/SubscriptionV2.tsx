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
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useStripe } from "@stripe/stripe-react-native";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { saveSubscription } from "../services/User.service";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { scheduleFreeTrialNotification } from "../utils/notificationService";

const { width: screenWidth } = Dimensions.get("window");

function SubscriptionV2(props) {
  const { t } = useTranslation();
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const { theme } = useAppTheme();
  const [loader, setLoader] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("free"); // Default to yearly
  const [freeTrialModalVisible, setFreeTrialModalVisible] = useState(false);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Start with yearly plan (index 2)

 const updateSubscriptionStatus = async (start, end, planType) => {
    if (!userId) return;
    const userRef = doc(firestore, "users", userId);
    try {
      const updateData = {
        isSubscribed: true,
        subscriptionStart: start,
        subscriptionEnd: end,
        planType: planType,
      };

      // Only set free trial fields if it's a free trial
      if (selectedPlan === "free") {
        updateData.isFreeTrial = true;
        updateData.freeTrialStartedAt = serverTimestamp();
      }

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error("Error updating subscription status:", error);
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
    if (selectedPlan === "free") {
      setFreeTrialModalVisible(true);
      return;
    }

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
        text1: t("toast.subscriptionV2.one"),
        text2: t("toast.subscriptionV2.two"),
      });
      setLoading(false);
      return;
    }

    const setupIntentId = setupIntentClientSecret.split("_secret")[0];

    // Determine which endpoint to call based on selected plan
    let endpoint = "";
    if (selectedPlan === "monthly") {
      endpoint = "https://buez-server-khaki.vercel.app/api/create-subscription";
    } else if (selectedPlan === "yearly") {
      endpoint = "https://buez-server-khaki.vercel.app/api/yearly-subscription";
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          setupIntentId,
          userId,
          planType: selectedPlan,
        }),
      });

      const result = await res.json();
      if (result.success) {
        await updateSubscriptionStatus(
          result?.currentPeriodStart,
          result?.currentPeriodEnd,
          selectedPlan
        );
        await saveSubscription(userId, result?.subscriptionId);

        if (selectedPlan === "free") {
          await scheduleFreeTrialNotification(10);
        }

        Toast.show({
          type: "success",
          text1:
            selectedPlan === "free"
              ? t("toast.subscriptionV2.three")
              : t("toast.subscriptionV2.subscriptionActive"),
          text2:
            selectedPlan === "free"
              ? t("toast.subscriptionV2.four")
              : t("toast.subscriptionV2.enjoyPremium"),
          visibilityTime: 5000,
        });
        props.navigation.navigate("TabNavigator");
      } else {
        setModalVisible2(true);
        Toast.show({
          type: "error",
          text1: t("toast.subscriptionV2.paymentFailed"),
          text2: t("toast.subscriptionV2.tryAgain"),
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      Toast.show({
        type: "error",
        text1: t("toast.subscriptionV2.error"),
        text2: t("toast.subscriptionV2.tryAgain"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFreeTrial = async () => {
    if (!userId) return;
    try {
      setLoader(true);
      setFreeTrialModalVisible(false); // Close modal
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, {
        isFreeTrial: true,
        freeTrialStartedAt: serverTimestamp(),
        planType: "free",
      });
      await scheduleFreeTrialNotification(10);
      props.navigation.navigate("TabNavigator");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to start free trial. Please try again.",
      });
    } finally {
      setLoader(false);
    }
  };

  const handleAddCardNow = async () => {
    setFreeTrialModalVisible(false); // Close modal
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
        text1: t("toast.subscriptionV2.one"),
        text2: t("toast.subscriptionV2.two"),
      });
      setLoading(false);
      return;
    }
    // For free trial with card, we just save the payment method but don't charge yet
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, {
        isFreeTrial: true,
        freeTrialStartedAt: serverTimestamp(),
        hasPaymentMethod: true,
        planType: "free",
      });
      await scheduleFreeTrialNotification(10);
      Toast.show({
        type: "success",
        text1: "Free Trial Started!",
        text2: "Your payment method has been saved for future use.",
        visibilityTime: 5000,
      });
      props.navigation.navigate("TabNavigator");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save payment method. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: "free",
      title: t("subscriptionV2.freeTrial") || "Free Trial",
      price: "$0",
      price2: "",
      period: t("subscriptionV2.for7Days") || "for 14 days",
      description: t("subscriptionV2.tryPremium") || "Try all premium features",
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
      ],
      popular: false,
      highlight: t("subscriptionV2.noCreditCard") || "No credit card",
    },
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
      popular: false,
      highlight: t("subscriptionV2.prioritySupport") || "Flexible",
    },
    {
      id: "yearly",
      title: t("subscriptionV2.yearly") || "Yearly",
      price: "$99",
      price2: ".99",
      period: t("subscriptionV2.perYear") || "per year",
      originalPrice: "$155",
      description: t("subscriptionV2.bestValue") || "Best value",
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
        t("subscriptionV2.prioritySupport") || "Priority support",
        t("subscriptionV2.exclusiveContent") || "Exclusive content",
      ],
      popular: true, // Moved most popular to yearly
      highlight: t("subscriptionV2.save30") || "Save 36%",
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
            backgroundColor: theme.white || theme.white,
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
          // Scroll to the selected card
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }}
        activeOpacity={0.7}
      >
        {/* Popular Badge - Now on Yearly plan */}
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
              { backgroundColor: theme.primary + "10" },
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
            <Text style={[styles.price, { color: theme.primary }]}>
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

        {/* Highlight Badge */}
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
                    ? RFPercentage(1.6)
                    : RFPercentage(1.3),
              },
            ]}
          >
            {item.highlight}
          </Text>
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
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: theme.primary }]}>
            {t("subscriptionV2.choosePlan") || "Choose Your Plan"}
          </Text>
          <Text style={[styles.subTitle, { color: theme.darkGrey }]}>
            {t("subscriptionV2.startFree") ||
              "Start with a free trial, upgrade anytime"}
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
            initialScrollIndex={0} // Start with yearly plan
            getItemLayout={(data, index) => ({
              length: screenWidth * 0.8 + RFPercentage(2),
              offset: (screenWidth * 0.8 + RFPercentage(2)) * index,
              index,
            })}
          />
        </View>

        {/* Plan Indicators */}
        <View style={[styles.indicatorsContainer,{marginTop: selectedPlan === 'free' ?  -20 : 0}]}>
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
          title={
            selectedPlan === "free"
              ? t("subscriptionV2.startFreeTrial") || "Start Free Trial"
              : `${t("subscriptionV2.continueWith") || "Continue with"} ${
                  plans.find((p) => p.id === selectedPlan)?.title
                }`
          }
          onPress={openPaymentSheet}
          width={"100%"}
          loading={loading}
          marginTop={RFPercentage(1.5)}
        />
      </View>

      {/* Free Trial Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={freeTrialModalVisible}
        onRequestClose={() => setFreeTrialModalVisible(false)}
      >
        <TouchableWithoutFeedback
          style={{ flex: 1 }}
          onPress={() => setFreeTrialModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.white }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>
                  {t("freeTrialModal.title") || "Start Your Free Trial"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.darkGrey }]}>
                  {t("freeTrialModal.subtitle") ||
                    "Choose how you'd like to start your 14-day free trial"}
                </Text>
              </View>

              <View style={styles.modalButtonsContainer}>
                {/* Add Card Now Button */}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.primaryModalButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleAddCardNow}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("freeTrialModal.addCardNow") || "Add Card Now"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Skip Card Button */}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.secondaryModalButton,
                    { borderColor: theme.primary },
                  ]}
                  onPress={handleFreeTrial}
                  disabled={loader}
                >
                  {loader ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: theme.primary },
                      ]}
                    >
                      {t("freeTrialModal.skipForNow") || "Skip for Now"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingTop: RFPercentage(4),
    paddingHorizontal: RFPercentage(3),
  },
  logo: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    marginBottom: RFPercentage(2),
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(2),
  },
  badgeText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  titleContainer: {
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(4),
    marginBottom: RFPercentage(3),
  },
  mainTitle: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(0.5),
  },
  subTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2),
  },
  cardsContainer: {
    // marginVertical: RFPercentage(2),
  },
  flatListContent: {
    alignItems: "center",
    paddingVertical: RFPercentage(1.7),
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
    zIndex: 9999999,
  },
  popularText: {
    color: Colors.white,
    fontSize: RFPercentage(1.4),
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
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "line-through",
    opacity: 0.8,
    marginLeft: RFPercentage(5),
  },
  highlightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    marginBottom: RFPercentage(2),
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
  },
  modalContent: {
    width: "100%",
    borderRadius: RFPercentage(3),
    padding: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: RFPercentage(3),
  },
  modalTitle: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
  },
  modalSubtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.2),
  },
  modalButtonsContainer: {
    gap: RFPercentage(2),
    marginBottom: RFPercentage(3),
  },
  modalButton: {
    paddingVertical: RFPercentage(1.7),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    alignSelf: "center",
  },
  primaryModalButton: {
    backgroundColor: Colors.primary,
  },
  secondaryModalButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  modalInfo: {
    // gap: RFPercentage(1),
  },
  modalInfoText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
});

export default SubscriptionV2;
