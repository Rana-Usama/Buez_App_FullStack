import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  Platform,
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

function SubscriptionV2(props) {
  const { t } = useTranslation();
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const { theme } = useAppTheme();

  const updateSubscriptionStatus = async (start, end) => {
    if (!userId) return;
    const userRef = doc(firestore, "users", userId);
    try {
      await updateDoc(userRef, {
        isSubscribed: true,
        isFreeTrial: true,
        freeTrialStartedAt: serverTimestamp(),
        subscriptionStart: start,
        subscriptionEnd: end,
      });
      console.log("User subscription status updated in Firestore");
    } catch (error) {
      console.log("Failed to update subscription status:", error);
    }
  };

  // Fetching payment intent
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

  // Open payment sheet
  const openPaymentSheet = async () => {
    setLoading(true);
    const setupData = await fetchSetupIntent();
    // console.log("setup data........", setupData);
    if (!setupData) return;
    const { setupIntentClientSecret, customerId } = setupData;
    const { error: initError } = await initPaymentSheet({
      setupIntentClientSecret,
      merchantDisplayName: "BUEZ",
      returnURL: "buez://payment-complete",
    });
    // console.log("init error.........", initError);
    if (initError) {
      setLoading(false);
      return;
    }
    const { error: paymentError } = await presentPaymentSheet();
    // console.log("paymentError............", paymentError);
    if (paymentError) {
      Toast.show({
        type: "info",
        text1: `${t("toast.subscriptionV2.one")}`,
        text2: `${t("toast.subscriptionV2.two")}`,
      });
      setLoading(false);
      return;
    }

    // Payment
    const setupIntentId = setupIntentClientSecret.split("_secret")[0];

    const res = await fetch(
      "https://buez-server-khaki.vercel.app/api/create-subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, setupIntentId }),
      }
    );

    // console.log("res......", res);
    const result = await res.json();
    // console.log("result...........", result);

    if (result.success) {
      await updateSubscriptionStatus(
        result?.currentPeriodStart,
        result?.currentPeriodEnd
      );
      await saveSubscription(userId, result?.subscriptionId);
      await scheduleFreeTrialNotification(10);
      Toast.show({
        type: "success",
        text1: `${t("toast.subscriptionV2.three")}`,
        text2: `${t("toast.subscriptionV2.four")}`,
      });
      props.navigation.navigate("TabNavigator");
    } else {
      setModalVisible2(true);
    }
  };

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />
      <Image style={styles.logo} source={Icons.logo} />
      <Image style={styles.vector} source={Icons.vec} />

      <View style={styles.premiumInfo}>
        <Image style={styles.crownIcon} source={Icons.crown} />
        <Text style={[styles.premiumText, { color: theme.darkGrey }]}>{`${t(
          "subscriptionV2.txt1"
        )}`}</Text>
      </View>

      <View
        style={[styles.subscriptionContainer, { borderColor: theme.stroke }]}
      >
        <View style={styles.priceContainer}>
          <Image style={styles.starIconLeft} source={Icons.stars} />
          <Text style={[styles.priceText, { color: theme.darkGrey }]}>
            $12
            <Text style={styles.priceSubText}>{`${t(
              "subscriptionV2.txt2"
            )}`}</Text>
          </Text>
        </View>

        <View style={[styles.divider, { borderColor: theme.stroke }]} />

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailText, { color: theme.darkGrey }]}>
            ⊙ {`${t("subscriptionV2.txt3")}`}
          </Text>
          <Text style={[styles.detailText, { color: theme.darkGrey }]}>
            ⊙ {`${t("subscriptionV2.txt4")}`}
          </Text>
          <Text style={[styles.detailText, { color: theme.darkGrey }]}>
            ⊙ {`${t("subscriptionV2.txt5")}`}
          </Text>
          <Text style={[styles.detailText, { color: theme.darkGrey }]}>
            ⊙ {`${t("subscriptionV2.txt6")}`}
          </Text>
        </View>

        <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
          <Image style={styles.starIconRight} source={Icons.stars} />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "80%",
          marginTop: RFPercentage(4),
        }}
      >
        <MyAppButton
          title={`${t("subscriptionV2.txt7")}`}
          marginTop={RFPercentage(0)}
          onPress={() => openPaymentSheet()}
          width={RFPercentage(19)}
          loading={loading}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            if (!userId) return;
            try {
              const userRef = doc(firestore, "users", userId);
              await updateDoc(userRef, {
                isFreeTrial: true,
                freeTrialStartedAt: serverTimestamp(),
              });
              await scheduleFreeTrialNotification(10);
              props.navigation.navigate("TabNavigator");
            } catch (error) {}
          }}
          style={[styles.skip, { borderColor: theme.grey }]}
        >
          <Text
            style={{
              color: theme.grey,
              fontFamily: "Poppins_500Medium",
              fontSize: RFPercentage(2),
            }}
          >{`${t("buttons.skip")}`}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(3),
  },
  vector: {
    marginTop: RFPercentage(3),
    width: RFPercentage(18),
    height: RFPercentage(18),
  },
  premiumInfo: {
    marginTop: RFPercentage(4),
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  crownIcon: {
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
  premiumText: {
    marginLeft: RFPercentage(1),
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  subscriptionContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "90%",
    height: Platform.OS === "android" ? RFPercentage(32) : RFPercentage(30),
    borderColor: Colors.stroke,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(3),
  },
  priceContainer: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },
  starIconLeft: {
    position: "absolute",
    left: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  priceText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(4.2),
    fontFamily: "Poppins_500Medium",
  },
  priceSubText: {
    fontSize: RFPercentage(1.8),
  },
  divider: {
    width: "100%",
    height: RFPercentage(0.1),
    borderColor: Colors.stroke,
    borderWidth: RFPercentage(0.1),
    marginTop: RFPercentage(1.5),
  },
  detailsContainer: {
    paddingVertical: RFPercentage(2),
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    // backgroundColor:'red'
  },
  detailText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
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
    bottom: RFPercentage(0.1),
  },
  skip: {
    height: Platform.OS === "android" ? RFPercentage(6.2) : RFPercentage(5.5),
    width: RFPercentage(19),
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RFPercentage(100),
  },
});

export default SubscriptionV2;
