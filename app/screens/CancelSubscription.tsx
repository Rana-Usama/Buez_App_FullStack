import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Modal, Pressable } from "react-native";
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
import { BlurView } from "expo-blur";

// config
import Colors from "../config/Colors";
import SubscriptionListener from "../components/SubscriptionListener";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { saveSubscription } from "../services/User.service";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

function CancelSubscription(props) {
  const { userData } = useUser();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const [indicator, showIndicator] = useState(false);
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [isloading, setIsLoading] = useState(false);

  console.log(userData?.subscriptionId);

  const cancelSubscription = async () => {
    if (!userData?.subscriptionId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No active subscription found.",
      });
      return;
    }
    try {
      setIsLoading(true); // Start loader
      const res = await fetch("https://buez-server-khaki.vercel.app/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: userData.subscriptionId }),
      });
      const text = await res.text(); // Read as text first
      try {
        const result = JSON.parse(text); // Try parsing manually
        console.log("result...........", result);
        if (result.success) {
          const { currentPeriodEnd } = result;
          if (userId) {
            const userRef = doc(firestore, "users", userId);
            try {
              await updateDoc(userRef, {
                isSubscribed: false,
                subscriptionId: null,
                // isFreeTrial: true,
                // freeTrialStartedAt: start,
                // freeTrialEndAt: end,
              });
              console.log("User subscription status updated in Firestore");
            } catch (error) {
              console.error("Failed to update subscription status:", error);
            }
          }
          Toast.show({
            type: "success",
            text1: "Cancel Subscription",
            text2: "Subscription has been canceled successfully!",
          });
          //   navigation.goBack();
        } else {
          //   setModalVisible2(true);
        }
      } catch (err) {
        console.log(err);
        // setModalVisible2(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
const navigation = useNavigation()

  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={Icons.logo} />
      {userData?.subscriptionId ? (
        <>
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumText}>Cancel Premium Subscription</Text>
          </View>

          <View style={styles.subscriptionContainer}>
            <View style={styles.priceContainer}>
              <Image style={styles.starIconLeft} source={Icons.stars} />
              <Text style={{ fontFamily: "Poppins_600SemiBold", color: Colors.darkGrey }}>Current Plan</Text>
              <Text style={styles.priceText}>
                $12<Text style={styles.priceSubText}>.99/month</Text>
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>⊙ Your services will no longer be visible to others</Text>
              <Text style={styles.detailText}>⊙ You won't receive daily requests anymore</Text>
              <Text style={styles.detailText}>⊙ You won’t be able to earn from daily chores</Text>
              <Text style={styles.detailText}>⊙ You will lose access to flexible cancellations</Text>
            </View>

            <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
              <Image style={styles.starIconRight} source={Icons.stars} />
            </View>
          </View>
          {/* {userId && <SubscriptionListener navigation={props.navigation} userId={userId} />} */}
          <View style={{ alignItems: "center", justifyContent: "center", width: "80%" }}>
            <MyAppButton title={"Cancel"} marginTop={RFPercentage(7)} onPress={() => setModalVisible2(true)} width={RFPercentage(20)} loading={loading} />
          </View>
        </>
      ) : (
        <>
          <Image style={styles.vector} source={Icons.notActive} resizeMode="contain" />
          <Text style={{ color: Colors.darkGrey, fontSize: RFPercentage(2), fontFamily: "Poppins_500Medium", marginTop: RFPercentage(2), paddingHorizontal: RFPercentage(5), textAlign: "center" }}>
            You do not have an active subscription.
          </Text>
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: RFPercentage(2), marginTop: RFPercentage(4) }} onPress={()=> navigation.navigate('Subscription')}>
            <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins_500Medium" }}>Activate Subscription</Text>
            <AntDesign name="arrowright" color={Colors.primary} size={RFPercentage(3)} style={{ left: RFPercentage(1) }} />
          </TouchableOpacity>
        </>
      )}

      <Modal animationType="fade" transparent={true} visible={modalVisible2} onRequestClose={() => setModalVisible2(false)}>
        <BlurView intensity={100} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to cancel{"\n"}your monthly subscription?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible2(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <MyAppButton
                title={"Yes"}
                marginTop={RFPercentage(0)}
                height={RFPercentage(5.8)}
                width={RFPercentage(17)}
                onPress={() => {
                  cancelSubscription();
                  setModalVisible2(false);
                }}
              />
            </View>
          </View>
        </BlurView>
      </Modal>
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
    marginTop: RFPercentage(8),
    width: RFPercentage(34),
    height: RFPercentage(34),
  },
  premiumInfo: {
    marginTop: RFPercentage(10),
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
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  subscriptionContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "90%",
    height: RFPercentage(45),
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
    fontFamily: "Poppins_500Medium",
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
    fontSize: RFPercentage(1.8),
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

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(218, 218, 218, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    alignItems: "center",
    height: RFPercentage(28),
    justifyContent: "center",
  },
  modalText: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(4),
    lineHeight: RFPercentage(3.2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    alignItems: "center",
  },
  cancelButton: {
    width: RFPercentage(17),
    borderRadius: RFPercentage(10),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(2),
    height: RFPercentage(5.8),
  },
  cancelButtonText: {
    fontSize: RFPercentage(2),
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
  },
  confirmButton: {
    width: "45%",
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: RFPercentage(2),
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
  },
});

export default CancelSubscription;
