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
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

function CancelSubscription({ navigation }: any) {
  const { userData } = useUser();
  const { t } = useTranslation();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const [modalVisible2, setModalVisible2] = useState(false);
  const [isloading, setIsLoading] = useState(false);

  // console.log(userData?.subscriptionId);

  const cancelSubscription = async () => {
    if (!userData?.subscriptionId) {
      Toast.show({
        type: "error",
        text1: `${t("toast.cancelSubscription.one")}`,
        text2: `${t("toast.cancelSubscription.two")}`,
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
        if (result.success) {
          const { currentPeriodEnd } = result;
          if (userId) {
            const userRef = doc(firestore, "users", userId);
            try {
              await updateDoc(userRef, {
                isSubscribed: false,
                subscriptionId: null,
              });
              // console.log("User subscription status updated in Firestore");
            } catch (error) {
              console.log("Failed to update subscription status:", error);
            }
          }
          Toast.show({
            type: "success",
            text1: `${t("toast.cancelSubscription.three")}`,
            text2: `${t("toast.cancelSubscription.four")}`,
          });
        } else {
        }
      } catch (err) {
        console.log(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={Icons.logo} />
      <TouchableOpacity style={{ position: "absolute", left: RFPercentage(2), top: RFPercentage(5) }} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.8) }} color={Colors.primary} />
      </TouchableOpacity>
      {userData?.subscriptionId ? (
        <>
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumText}>{`${t("cancelSubscription.txt1")}`}</Text>
          </View>

          <View style={styles.subscriptionContainer}>
            <View style={styles.priceContainer}>
              <Image style={styles.starIconLeft} source={Icons.stars} />
              <Text style={{ fontFamily: "Poppins_600SemiBold", color: Colors.darkGrey }}>{`${t("cancelSubscription.txt2")}`}</Text>
              <Text style={styles.priceText}>
                $12<Text style={styles.priceSubText}>{`${t("cancelSubscription.txt3")}`}</Text>
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>⊙ {`${t("cancelSubscription.txt4")}`}</Text>
              <Text style={styles.detailText}>⊙ {`${t("cancelSubscription.txt5")}`}</Text>
              <Text style={styles.detailText}>⊙ {`${t("cancelSubscription.txt6")}`}</Text>
              <Text style={styles.detailText}>⊙ {`${t("cancelSubscription.txt7")}`}</Text>
            </View>

            <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
              <Image style={styles.starIconRight} source={Icons.stars} />
            </View>
          </View>
          <View style={{ alignItems: "center", justifyContent: "center", width: "80%" }}>
            <MyAppButton title={`${t("buttons.cancel")}`} marginTop={RFPercentage(7)} onPress={() => setModalVisible2(true)} width={RFPercentage(20)} loading={isloading} />
          </View>
        </>
      ) : (
        <>
          <Image style={styles.vector} source={Icons.notActive} resizeMode="contain" />
          <Text style={styles.notActive}>{`${t("cancelSubscription.txt8")}`}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Subscription")}>
            <Text style={styles.buttonText}>{`${t("cancelSubscription.txt9")}`}</Text>
            <AntDesign name="arrowright" color={Colors.primary} size={RFPercentage(3)} style={{ left: RFPercentage(1) }} />
          </TouchableOpacity>
        </>
      )}

      <Modal animationType="fade" transparent={true} visible={modalVisible2} onRequestClose={() => setModalVisible2(false)}>
        <BlurView intensity={100} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{`${t("cancelSubscription.txt10")}`}</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible2(false)}>
                <Text style={styles.cancelButtonText}>{`${t("buttons.cancel")}`}</Text>
              </Pressable>
              <MyAppButton
                title={`${t("buttons.yes")}`}
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
  notActive: { color: Colors.darkGrey, fontSize: RFPercentage(2), fontFamily: "Poppins_500Medium", marginTop: RFPercentage(2), paddingHorizontal: RFPercentage(5), textAlign: "center" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: RFPercentage(2), marginTop: RFPercentage(4) },

  starIconLeft: {
    position: "absolute",
    left: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  buttonText: { color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins_500Medium" },
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
