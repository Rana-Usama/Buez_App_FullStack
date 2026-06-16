import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import MyAppButton from "../components/common/MyAppButton";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { getCurrencyFromLocale, formatCurrency } from "../utils/getCurrency";
import * as Localization from "expo-localization";
import CustomNav from "../components/common/CustomNav";

function CancelSubscription({ navigation }: any) {
  const { userData } = useUser();
  const { t } = useTranslation();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const [modalVisible2, setModalVisible2] = useState(false);
  const [isloading, setIsLoading] = useState(false);
  const { theme } = useAppTheme();

  const currentPlan =
    userData?.planType || userData?.subscription?.planInterval || "monthly"; // Default to monthly if not specified
  const isYearlyPlan = currentPlan === "yearly";

  const locale = Localization.locale;
  const userCurrency = getCurrencyFromLocale(locale);

  const prices = {
    monthly: {
      USD: 9.5,
      EUR: 8.9,
      CHF: 7.9,
    },
    yearly: {
      USD: 95,
      EUR: 89,
      CHF: 79,
    },
  };

  const formattedPrice = formatCurrency(
    prices[currentPlan][userCurrency],
    userCurrency,
  );

  const cancelSubscription = async () => {
    if (!userData?.subscriptionId) {
      Toast.show({
        type: "error",
        text1: t("toast.cancelSubscription.one"),
        text2: t("toast.cancelSubscription.two"),
      });
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(
        "https://buez-server-khaki.vercel.app/api/cancel-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: userData?.subscriptionId,
            planType: currentPlan,
          }),
        },
      );
      const text = await res.text();
      try {
        const result = JSON.parse(text);
        if (result.success) {
          const { currentPeriodEnd } = result;
          if (userId) {
            const userRef = doc(firestore, "users", userId);
            try {
              await updateDoc(userRef, {
                isCancelled: true,
              });
            } catch (error) {
              console.log("Failed to update subscription status:", error);
            }
          }
          Toast.show({
            type: "success",
            text1: t("toast.cancelSubscription.three"),
            text2: isYearlyPlan
              ? t("cancelSubscription.yearlyCancelled")
              : t("cancelSubscription.monthlyCancelled"),
            visibilityTime: 5000,
          });
        }
      } catch (err) {
        console.log(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSavingsPercent = (monthly, yearly) => {
    const normalYearly = monthly * 12;
    const saved = normalYearly - yearly;
    return Math.round((saved / normalYearly) * 100); // round to whole number
  };

  const savingsPercent = getSavingsPercent(
    prices.monthly[userCurrency],
    prices.yearly[userCurrency],
  );

  const savingsLabel = `${t("cancelSubscription.save36")} ${savingsPercent}%`;

  const planDetails = {
    monthly: {
      price: formattedPrice,
      period: t("subscriptionV2.perMonth") || "per month",
      title: t("subscriptionV2.monthly") || "Monthly Plan",
      savings: null,
    },
    yearly: {
      price: formattedPrice,
      period: t("subscriptionV2.perYear") || "per year",
      title: t("subscriptionV2.yearly") || "Yearly Plan",
      savings: savingsLabel,
    },
  };

  const currentPlanDetails = planDetails[currentPlan];

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav showBack title={t("cancelSubscription.txt1")} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!userData?.isCancelled && userData?.planType != "free" ? (
          <>
            {/* Current Plan Badge */}
            <View style={styles.planBadgeContainer}>
              <View
                style={[styles.planBadge, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.planBadgeText}>
                  {isYearlyPlan
                    ? t("cancelSubscription.yearlyPlan")
                    : t("cancelSubscription.monthlyPlan")}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.subscriptionContainer,
                { borderColor: theme.stroke },
              ]}
            >
              <View style={styles.priceContainer}>
                <Image style={styles.starIconLeft} source={Icons.stars} />
                <Text style={[styles.planTitle, { color: theme.mode === "dark" ? Colors.white  : theme.primary }]}>
                  {currentPlanDetails?.title}
                </Text>

                <Text style={[styles.priceText, { color: theme.darkGrey }]}>
                  {currentPlanDetails?.price?.split(".")[0]}
                  <Text style={styles.priceDecimal}>
                    .{currentPlanDetails?.price?.split(".")[1]}
                  </Text>
                </Text>
                <Text style={[styles.periodText, { color: theme.darkGrey }]}>
                  {currentPlanDetails?.period}
                </Text>
              </View>

              {currentPlanDetails?.savings && (
                <View
                  style={[
                    styles.savingsBadge,
                    { backgroundColor: theme.secondary },
                  ]}
                >
                  <Text style={styles.savingsText}>
                    {currentPlanDetails?.savings}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { borderColor: theme.stroke }]} />

              {/* Details */}
              <View style={styles.detailsContainer}>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ✓ {t("subscriptionV2.txt3")}
                </Text>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ✓ {t("subscriptionV2.txt4")}
                </Text>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ✓ {t("subscriptionV2.txt5")}
                </Text>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ✓ {t("subscriptionV2.txt6")}
                </Text>
                {isYearlyPlan && (
                  <>
                    <Text
                      style={[styles.detailText, { color: theme.darkGrey }]}
                    >
                      ✓{" "}
                      {t("subscriptionV2.prioritySupport") ||
                        "Priority support"}
                    </Text>
                    <Text
                      style={[styles.detailText, { color: theme.darkGrey }]}
                    >
                      ✓{" "}
                      {t("subscriptionV2.exclusiveContent") ||
                        "Exclusive content"}
                    </Text>
                  </>
                )}
              </View>

              {/* Cancellation Info */}
              <View
                style={[
                  styles.cancellationInfo,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.darkGrey + "30"
                        : Colors.primary + "15",
                  },
                ]}
              >
                <Text
                  style={[styles.cancellationTitle, { color: theme.mode === "dark" ? Colors.white : theme.primary }]}
                >
                  {t("cancelSubscription.cancellationNote") ||
                    "Cancellation Details"}
                </Text>
                <Text
                  style={[styles.cancellationText, { color: theme.darkGrey }]}
                >
                  {isYearlyPlan
                    ? t("cancelSubscription.yearlyCancellation")
                    : t("cancelSubscription.monthlyCancellation")}
                </Text>
              </View>

              <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
                <Image style={styles.starIconRight} source={Icons.stars} />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <MyAppButton
                title={t("buttons.cancel")}
                marginTop={RFPercentage(2)}
                onPress={() => setModalVisible2(true)}
                width={"45%"}
                loading={isloading}
                // backgroundColor={theme.red}
              />
            </View>
          </>
        ) : (
          <>
            <Image
              style={styles.vector}
              source={Icons.notActive}
              resizeMode="contain"
            />
            <Text style={[styles.notActive, { color: theme.heading }]}>
              {t("cancelSubscription.txt8")}
            </Text>
          </>
        )}
      </ScrollView>

      <ConfirmationModal
        isVisible={modalVisible2}
        onClose={() => setModalVisible2(false)}
        onConfirm={() => {
          cancelSubscription();
          setModalVisible2(false);
        }}
        title={t("cancelSubscription.txt10")}
        message={
          isYearlyPlan
            ? t("cancelSubscription.yearlyConfirmation")
            : t("cancelSubscription.monthlyConfirmation")
        }
        theme={theme}
        t={t}
        loading={isloading}
      />
    </View>
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
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(2),
    alignSelf: "center",
  },
  backButton: {
    position: "absolute",
    left: RFPercentage(0),
  },
  subscriptionImage: {
    width: RFPercentage(50),
    height: RFPercentage(22),
    marginTop: RFPercentage(6),
    alignSelf: "center",
  },
  vector: {
    marginTop: RFPercentage(10),
    width: RFPercentage(34),
    height: RFPercentage(34),
    alignSelf: "center",
  },
  premiumInfo: {
    marginTop: Platform.OS === "android" ? RFPercentage(5) : RFPercentage(3),
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  premiumText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  planBadgeContainer: {
    alignItems: "center",
    marginTop: RFPercentage(6),
  },
  planBadge: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
  },
  planBadgeText: {
    color: Colors.white,
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  subscriptionContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "90%",
    borderColor: Colors.stroke,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(2),
    alignSelf: "center",
    paddingBottom: RFPercentage(2),
  },
  priceContainer: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },
  planTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(1),
    textAlign: "center",
  },
  priceText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(3.5),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  priceDecimal: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  periodText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: Colors.darkGrey,
    marginTop: RFPercentage(0.5),
  },
  savingsBadge: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(1),
  },
  savingsText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  starIconLeft: {
    position: "absolute",
    left: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  divider: {
    width: "100%",
    height: RFPercentage(0.1),
    borderColor: Colors.stroke,
    borderWidth: RFPercentage(0.1),
    marginTop: RFPercentage(2),
  },
  detailsContainer: {
    paddingVertical: RFPercentage(2),
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  detailText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.5),
    marginTop: RFPercentage(1),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  cancellationInfo: {
    width: "90%",
    padding: RFPercentage(2),
    backgroundColor: Colors.lightGrey,
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(1),
  },
  cancellationTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  cancellationText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  starContainer: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  starIconRight: {
    position: "absolute",
    right: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
    bottom: -3,
  },
  notActive: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(8),
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: RFPercentage(6),
  },
});

export default CancelSubscription;
