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
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { BlurView } from "expo-blur";

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
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [freeTrialModalVisible, setFreeTrialModalVisible] = useState(false);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deviceId, setDeviceId] = useState("");

  const isDark = theme.mode === "dark";

  // ── ALL ORIGINAL LOGIC BELOW — UNTOUCHED ─────────────────────────────────

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
        hasPaymentMethod: false,
      });
      await createFreeTrialRecord({ userId, deviceId });
      await scheduleFreeTrialNotification(10);
      setFreeTrialModalVisible(false);
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
      await updateDoc(doc(firestore, "users", userId), {
        hasPaymentMethod: true,
      });
      await createFreeTrialRecord({ userId, deviceId });
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
    const accentColor =
      item.id === "free"
        ? "#4557B0"
        : item.id === "monthly"
          ? "#253275"
          : "#DD53A8";

    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          {
            backgroundColor: isDark ? "rgba(7, 9, 25, 0.95)" : "#fff",
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
            item.id === "free"
              ? ["#4557B0", "#253275"]
              : item.id === "monthly"
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
                name={
                  item.id === "free"
                    ? "gift"
                    : item.id === "monthly"
                      ? "calendar"
                      : "star"
                }
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
                  { color: isDark ? "#909fccff" : "#64748B" },
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
                          { color: isDark ? "#acb8daff" : "#64748B" },
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
                  { color: isDark ? "#8f9dc8ff" : "#94a3b8" },
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
                          ? "#616ca5ff"
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
                  { color: isDark ? "#838aa8ff" : "#94a3b8" },
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
                    { color: isDark ? "#a8b3d4ff" : "#475569" },
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
        barStyle={isDark ? "light-content" : "dark-content"}
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
        {/* ── Title block ── */}
        <View style={styles.titleContainer}>
          {/* Badge */}
          <View style={styles.titleBadgeWrap}>
            <LinearGradient
              colors={["#253275", "#DD53A8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleBadge}
            >
              <Feather name="zap" size={RFPercentage(1.3)} color="#fff" />
              <Text style={styles.titleBadgeText}>
                {t("subscriptionV2.choosePlan")}
              </Text>
            </LinearGradient>
          </View>

          <Text
            style={[
              styles.mainTitle,
              { color: isDark ? "#eef0ff" : "#1a1e4a" },
            ]}
          >
            {t("subscriptionV2.choosePlan")}
          </Text>

          {/* Gradient underline */}
          <LinearGradient
            colors={["#253275", "#DD53A8", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />

          <Text
            style={[styles.subTitle, { color: isDark ? "#6b7db3" : "#64748B" }]}
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
        <View
          style={[
            styles.indicatorsContainer,
            { marginTop: selectedPlan === "free" ? -30 : -15 },
          ]}
        >
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
                  {selectedPlan === "free"
                    ? t("subscriptionV2.startFreeTrial")
                    : `${t("subscriptionV2.continueWith")} ${plans.find((p) => p.id === selectedPlan)?.title}`}
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

      {/* ── Free Trial Modal ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={freeTrialModalVisible}
        onRequestClose={() => setFreeTrialModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setFreeTrialModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: isDark ? "#04081cff" : "#fff" },
                ]}
              >
                {/* Modal top bar */}
                <LinearGradient
                  colors={["#253275", "#4557B0", "#DD53A8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalTopBar}
                />

                <View style={styles.modalBody}>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <LinearGradient
                      colors={["#253275", "#4557B0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalIconCircle}
                    >
                      <Feather
                        name="gift"
                        size={RFPercentage(2.2)}
                        color="#fff"
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.modalTitle,
                        { color: isDark ? "#eef0ff" : "#1a1e4a" },
                      ]}
                    >
                      {t("freeTrialModal.title")}
                    </Text>
                  </View>

                  {/* Info card */}
                  <View
                    style={[
                      styles.infoCard,
                      {
                        backgroundColor: isDark
                          ? "rgba(37,50,117,0.15)"
                          : "rgba(37,50,117,0.05)",
                        borderLeftColor: "#253275",
                      },
                    ]}
                  >
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <View style={styles.infoContent}>
                      <Text
                        style={[
                          styles.infoTitle,
                          { color: isDark ? "#dde3ff" : "#253275" },
                        ]}
                      >
                        {t("freeTrialModal.importantNote")}
                      </Text>
                      <Text
                        style={[
                          styles.infoText,
                          { color: isDark ? "#6b7db3" : "#64748B" },
                        ]}
                      >
                        {t("freeTrialModal.automaticSubscription")}
                      </Text>
                    </View>
                  </View>

                  {/* Benefit bullets */}
                 

                  {/* Divider */}
                  <View
                    style={[
                      styles.modalDivider,
                      {
                        backgroundColor: isDark
                          ? "rgba(69,87,176,0.15)"
                          : "rgba(37,50,117,0.08)",
                      },
                    ]}
                  />

                  {/* Buttons */}
                  <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity
                      onPress={handleAddCardNow}
                      disabled={loading}
                      activeOpacity={0.88}
                      style={styles.modalPrimaryOuter}
                    >
                      <LinearGradient
                        colors={["#253275", "#4557B0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalPrimaryBtn}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text
                            style={styles.modalPrimaryText}
                            numberOfLines={1}
                          >
                            {t("freeTrialModal.addCardNow")}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Skip */}
                    <TouchableOpacity
                      onPress={handleFreeTrial}
                      disabled={loader}
                      activeOpacity={0.75}
                      style={[
                        styles.modalSecondaryBtn,
                        {
                          borderColor: isDark
                            ? "rgba(69,87,176,0.4)"
                            : "rgba(37,50,117,0.25)",
                          backgroundColor: isDark
                            ? "rgba(37,50,117,0.1)"
                            : "rgba(37,50,117,0.05)",
                        },
                      ]}
                    >
                      {loader ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#4557B0" : "#253275"}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.modalSecondaryText,
                            { color: isDark ? "#7a8fd4" : "#253275" },
                          ]}
                          numberOfLines={1}
                        >
                          {t("freeTrialModal.skipForNow")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    color: "#fff",
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
    color: "#fff",
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
    paddingHorizontal: RFPercentage(3),
    paddingTop: RFPercentage(1.6),
    paddingBottom:
      Platform.OS === "ios" ? RFPercentage(4.5) : RFPercentage(2.8),
    borderTopWidth: 1,
  },
  ctaOuter: {
    width: "70%",
    borderRadius: RFPercentage(100),
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    alignSelf: "center",
    height: RFPercentage(6),
    // elevation: 12,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: RFPercentage(1.85),
    gap: RFPercentage(1),
    borderRadius: 100,
    height: RFPercentage(6),
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    // elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(69,87,176,0.15)",
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
    shadowColor: "#253275",
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
    borderLeftWidth: 3,
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
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    // elevation: 8,
  },
  modalPrimaryBtn: {
    paddingVertical: RFPercentage(1.6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
  },
  modalPrimaryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.65),
    color: "#fff",
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: RFPercentage(1.6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    borderWidth: 1.5,
  },
  modalSecondaryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.65),
  },
});

export default SubscriptionV2;
