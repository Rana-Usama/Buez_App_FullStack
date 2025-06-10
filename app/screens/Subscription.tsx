import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as Linking from "expo-linking";
import { useStripe } from "@stripe/stripe-react-native";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// config
import Colors from "../config/Colors";
import SubscriptionListener from "../components/SubscriptionListener";
import { Icons } from "../config/theme";

async function getPaymentSheet(amount, currency, userId) {
  console.log("getPaymentSheet", amount);
  try {
    const response = await fetch("https://buez-server-khaki.vercel.app/api/payment-sheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amount, currency, userId }),
    });
    console.log("response", response);
    const data = await response.json();
    console.log("getPaymentSheet", data);
    return data;
  } catch (error) {
    console.log("getPaymentSheet", error);
    throw error;
  }
}

function Subscription(props) {
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const [indicator, showIndicator] = useState(false);
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  
  console.log("Subscription", userData);
  const initializePaymentSheet = async () => {
    try {
      // PaymentConfiguration.init(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      console.log("Payment init");
      const { customer, ephemeralKey, paymentIntent } = await getPaymentSheet(12.99, "USD", userId);
      const { error } = await initPaymentSheet({
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: userData.userName, // logged in user name
          email: userData.email, // logged in user email
          phone: userData.phoneNumber, // logged in user phone
          address: {
            postalCode: "12345",
          },
        },
        merchantDisplayName: "Buez",
        returnURL: Linking.createURL("/stripe-redirect"),
        // applePay: {
        //   merchantCountryCode: "US",
        //   merchantIdentifier: "merchant.com.example.test",
        //   displayName: "Buez",
        // }
      });

      if (error) {
        console.log(error.message);
      } else {
        setLoading(true);
        onPaymentSheet();
      }
    } catch (e) {
      console.log("Error initializing payment sheet", e);
    }
  };

  const updateSubscriptionStatus = async () => {
    if (!userId) return;
    const userRef = doc(firestore, "users", userId);
    try {
      await updateDoc(userRef, {
        isSubscribed: true,
        subscriptionDate: serverTimestamp(),
      });
      console.log("User subscription status updated in Firestore");
    } catch (error) {
      console.error("Failed to update subscription status:", error);
    }
  };

  const onPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      // TODO: handle error
      // show error message to user
      console.log(error.message);
    } else {
      // save user subscription to firebase
      await updateSubscriptionStatus();
      console.log("Payment successful");
    }
  };


  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={Icons.logo} />
      <Image style={styles.vector} source={Icons.vec} />

      <View style={styles.premiumInfo}>
        <Image style={styles.crownIcon} source={Icons.crown} />
        <Text style={styles.premiumText}>Buy our premium to access full services</Text>
      </View>

      <View style={styles.subscriptionContainer}>
        <View style={styles.priceContainer}>
          <Image style={styles.starIconLeft} source={Icons.stars} />
          <Text style={styles.priceText}>
            $12<Text style={styles.priceSubText}>.99/month</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>⊙ Post daily chore requests</Text>
          <Text style={styles.detailText}>⊙ See requests daily</Text>
          <Text style={styles.detailText}>⊙ Earn money by doing daily chores</Text>
          <Text style={styles.detailText}>⊙ Cancel anytime</Text>
        </View>

        <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
          <Image style={styles.starIconRight} source={Icons.stars} />
        </View>
      </View>
      {userId && <SubscriptionListener navigation={props.navigation} userId={userId} />}
      <MyAppButton title={"Checkout"} marginTop={RFPercentage(7)} onPress={() => initializePaymentSheet()} />
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
    width: RFPercentage(20),
    height: RFPercentage(20),
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
  },
  subscriptionContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "90%",
    height: RFPercentage(30),
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
    marginTop: RFPercentage(2),
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  detailText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    marginTop: RFPercentage(1.3),
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
  },
});

export default Subscription;
