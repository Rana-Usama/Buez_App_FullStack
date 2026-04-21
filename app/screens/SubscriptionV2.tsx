import React, { useState, useRef, useEffect } from "react";
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
  setDoc,
} from "firebase/firestore";
import Colors from "../config/Colors";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { scheduleFreeTrialNotification } from "../utils/notificationService";
import * as Localization from "expo-localization";
import {
  handlePaymentSheet,
  fetchSetupIntent,
  createSubscription,
} from "../services/Subscription.service";
import { getCurrencyFromLocale, formatCurrency } from "../utils/getCurrency";
import { Icons } from "../config/theme";
import DeviceInfo from "react-native-device-info";
import { FIREBASE_DB } from "../../firebaseConfig";

const { width: screenWidth } = Dimensions.get("window");
const db = FIREBASE_DB;

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
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    const fetchId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
      console.log("Device ID:", id);
    };
    fetchId();
  }, []);

  const createFreeTrialRecord = async ({ userId, deviceId }) => {
    try {
      const freeTrialRef = doc(db, "freeTrials", `${deviceId}`);
      await setDoc(freeTrialRef, {
        userId,
        deviceId,
        freeTrial: true,
        freeTrialStartedAt: serverTimestamp(),
      });
    } catch (error) {
      console.log("Error creating free trial record:", error);
    }
  };

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
    if (selectedPlan === "free") {
      setFreeTrialModalVisible(true);
      return;
    }
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

  const handleFreeTrial = async () => {
    if (!userId) return;
    try {
      setLoader(true);
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, {
        isFreeTrial: true,
        freeTrialStartedAt: serverTimestamp(),
        planType: "free",
      });
      await createFreeTrialRecord({
        userId,
        deviceId,
      });
      await scheduleFreeTrialNotification(10);
      setFreeTrialModalVisible(false); // Close modal
      props.navigation.navigate("InterestSelection");
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
    setFreeTrialModalVisible(false);
    setLoading(true);
    try {
      const setupData = await fetchSetupIntent(userData?.email, userId);
      if (!setupData) return;
      const { setupIntentClientSecret, customerId } = setupData;
      const { error: initError } = await initPaymentSheet({
        setupIntentClientSecret,
        merchantDisplayName: "BUEZ",
        returnURL: "buez://payment-complete",
      });
      if (initError) return;
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        Toast.show({
          type: "info",
          text1: t("toast.subscriptionV2.one"),
          text2: t("toast.subscriptionV2.two"),
        });
        return;
      }
      const setupIntentId = setupIntentClientSecret.split("_secret")[0];
      await createSubscription({
        customerId,
        setupIntentId,
        planType: "monthly",
        userCurrency,
        t,
      });
      await createFreeTrialRecord({
        userId,
        deviceId,
      });
      props.navigation.navigate("InterestSelection");
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

  const savingsPercentage =
    ((prices.monthly[userCurrency] * 12 - prices.yearly[userCurrency]) /
      (prices.monthly[userCurrency] * 12)) *
    100;

  const highlightText = `Save ${Math.round(savingsPercentage)}%`;

  const plans = [
    {
      id: "free",
      title: t("subscriptionV2.freeTrial"),
      price: "$0",
      period: t("subscriptionV2.for7Days"),
      description: t("subscriptionV2.tryPremium"),
      features: [
        t("subscriptionV2.txt3"),
        t("subscriptionV2.txt4"),
        t("subscriptionV2.txt5"),
        t("subscriptionV2.txt6"),
      ],
      popular: false,
      highlight: t("subscriptionV2.noCreditCard"),
    },
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
              {t("subscriptionV2.mostPopular")}
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
            <Text
              style={[
                styles.planTitle,
                {
                  color: theme.mode === "dark" ? Colors.white : Colors.primary,
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
              const priceStr = priceLabelForPlan(item.id); // e.g. "$8.90"
              const [integerPart, decimalPart] = priceStr.split(".");
              return (
                <Text
                  style={[
                    styles.price,
                    {
                      color:
                        theme.mode === "dark" ? Colors.white : Colors.primary,
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
                      ? Colors.white
                      : theme.mode === "dark"
                        ? Colors.darkGrey
                        : Colors.primary,
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
        {/* Main Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: theme.primary }]}>
            {t("subscriptionV2.choosePlan")}
          </Text>
          <Text style={[styles.subTitle, { color: theme.darkGrey }]}>
            {t("subscriptionV2.startFree")}
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
        <View
          style={[
            styles.indicatorsContainer,
            { marginTop: selectedPlan === "free" ? -20 : 0 },
          ]}
        >
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
              ? t("subscriptionV2.startFreeTrial")
              : `${t("subscriptionV2.continueWith")} ${
                  plans.find((p) => p.id === selectedPlan)?.title
                }`
          }
          onPress={openPaymentSheet}
          width={"100%"}
          loading={loading}
          marginTop={RFPercentage(1.5)}
          height={RFPercentage(6)}
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
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(20, 22, 41, 1)"
                        : theme.white,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          theme.mode === "dark" ? Colors.white : theme.primary,
                      },
                    ]}
                  >
                    {t("freeTrialModal.title")}
                  </Text>
                  {/* <Text
                    style={[styles.modalSubtitle, { color: theme.darkGrey }]}
                  >
                    {t("freeTrialModal.subtitle") ||
                      "Choose how you'd like to start your free trial"}
                  </Text> */}
                </View>

                {/* Important Information Card */}
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(70, 74, 111, 0.47)"
                          : Colors.lightWhite,
                    },
                  ]}
                >
                  <View style={styles.infoIcon}>
                    <Text
                      style={[styles.infoIconText, { color: theme.primary }]}
                    >
                      ℹ️
                    </Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text
                      style={[
                        styles.infoTitle,
                        {
                          color:
                            theme.mode === "dark"
                              ? Colors.white
                              : theme.primary,
                        },
                      ]}
                    >
                      {t("freeTrialModal.importantNote")}
                    </Text>
                    <Text style={[styles.infoText, { color: theme.darkGrey }]}>
                      {t("freeTrialModal.automaticSubscription")}
                    </Text>
                  </View>
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
                      <Text style={styles.primaryButtonText} numberOfLines={1}>
                        {t("freeTrialModal.addCardNow")}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Skip Card Button */}
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.secondaryModalButton,
                      {
                        borderColor:
                          theme.mode === "dark" ? Colors.white : Colors.primary,
                      },
                    ]}
                    onPress={handleFreeTrial}
                    disabled={loader}
                  >
                    {loader ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          theme.mode === "dark" ? Colors.white : Colors.primary
                        }
                      />
                    ) : (
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          {
                            color:
                              theme.mode === "dark"
                                ? Colors.white
                                : Colors.primary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t("freeTrialModal.skipForNow")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
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
    paddingTop: Platform.OS === "android" ? RFPercentage(7) : RFPercentage(4),
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
    marginTop: Platform.OS === "android" ? RFPercentage(7) : RFPercentage(4),
    marginBottom: RFPercentage(3),
  },
  mainTitle: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(0.5),
  },
  subTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2),
  },
  cardsContainer: {
    marginTop: RFPercentage(5),
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
    marginLeft: RFPercentage(5),
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
  },
  modalContent: {
    width: "100%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(3),
    paddingVertical: RFPercentage(4),
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
    // marginBottom: RFPercentage(3),
  },
  modalTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.2),
  },
  modalButtonsContainer: {
    gap: RFPercentage(2),
    marginBottom: RFPercentage(1),
    flexDirection: "row",
    alignItems: "center",
  },
  modalButton: {
    paddingVertical: RFPercentage(1.4),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    width: "45%",
    alignSelf: "center",
  },
  primaryModalButton: {
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryModalButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
    paddingHorizontal: 5,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.7),
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
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    marginVertical: RFPercentage(4),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoIcon: {
    marginRight: RFPercentage(1.5),
    marginTop: RFPercentage(0.2),
  },
  infoIconText: {
    fontSize: RFPercentage(2),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  infoText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
});

export default SubscriptionV2;
