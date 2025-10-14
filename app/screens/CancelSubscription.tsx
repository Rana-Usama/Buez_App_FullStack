import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
  ScrollView
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { AntDesign } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import ConfirmationModal from "../components/common/ConfirmationModal";

function CancelSubscription({ navigation }: any) {
  const { userData } = useUser();
  const { t } = useTranslation();
  const userId = getAuth()?.currentUser?.uid;
  const firestore = getFirestore();
  const [modalVisible2, setModalVisible2] = useState(false);
  const [isloading, setIsLoading] = useState(false);
  const { theme } = useAppTheme();

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
      const res = await fetch(
        "https://buez-server-khaki.vercel.app/api/cancel-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId: userData.subscriptionId }),
        }
      );
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
            } catch (error) {
              console.log("Failed to update subscription status:", error);
            }
          }
          Toast.show({
            type: "success",
            text1: `${t("toast.cancelSubscription.three")}`,
            text2: `${t("toast.cancelSubscription.four")}`,
            visibilityTime: 5000,
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
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:RFPercentage(3), alignItems:"center"}} style={{}}>
        <Image style={styles.logo} source={Icons.logo} />
        <TouchableOpacity
        activeOpacity={0.8}
          style={{
            position: "absolute",
            left: RFPercentage(2),
            top: Platform.OS === "ios" ? RFPercentage(9) : RFPercentage(5),
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            style={{ fontSize: RFPercentage(2.8) }}
            color={theme.heading}
          />
        </TouchableOpacity>
        {userData?.subscriptionId ? (
          <>
            <Image
              style={{
                width: RFPercentage(50),
                height: RFPercentage(22),
                marginTop: RFPercentage(3),
              }}
              source={Icons.notActive}
              resizeMode="contain"
            />

            <View style={styles.premiumInfo}>
              <Text
                style={[styles.premiumText, { color: theme.heading }]}
              >{`${t("cancelSubscription.txt1")}`}</Text>
            </View>

            <View
              style={[
                styles.subscriptionContainer,
                { borderColor: theme.stroke },
              ]}
            >
              <View style={styles.priceContainer}>
                <Image style={styles.starIconLeft} source={Icons.stars} />
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    color: theme.darkGrey,
                  }}
                >{`${t("cancelSubscription.txt2")}`}</Text>
                <Text style={[styles.priceText, { color: theme.darkGrey }]}>
                  $12
                  <Text style={styles.priceSubText}>{`${t(
                    "cancelSubscription.txt3"
                  )}`}</Text>
                </Text>
              </View>

              <View style={[styles.divider, { borderColor: theme.stroke }]} />

              {/* Details */}
              <View style={styles.detailsContainer}>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ⊙ {`${t("cancelSubscription.txt4")}`}
                </Text>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ⊙ {`${t("cancelSubscription.txt5")}`}
                </Text>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ⊙ {`${t("cancelSubscription.txt6")}`}
                </Text>
                <Text style={[styles.detailText, { color: theme.darkGrey }]}>
                  ⊙ {`${t("cancelSubscription.txt7")}`}
                </Text>
              </View>

              <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
                <Image style={styles.starIconRight} source={Icons.stars} />
              </View>
            </View>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: "80%",
              }}
            >
              <MyAppButton
                title={`${t("buttons.cancel")}`}
                marginTop={RFPercentage(3)}
                onPress={() => setModalVisible2(true)}
                width={RFPercentage(20)}
                loading={isloading}
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
            <Text style={[styles.notActive, { color: theme.heading }]}>{`${t(
              "cancelSubscription.txt8"
            )}`}</Text>
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
        theme={theme}
        t={t}
      />
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
    marginTop: RFPercentage(2),
  },
  vector: {
    marginTop: RFPercentage(12),
    width: RFPercentage(34),
    height: RFPercentage(34),
  },
  premiumInfo: {
    marginTop: RFPercentage(1),
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
    // height: RFPercentage(45),
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
  notActive: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(8),
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(2),
    marginTop: RFPercentage(4),
  },

  starIconLeft: {
    position: "absolute",
    left: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  buttonText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
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
    marginTop: RFPercentage(2),
  },
  starIconRight: {
    position: "absolute",
    right: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
    bottom: -3,
  },
});

export default CancelSubscription;
