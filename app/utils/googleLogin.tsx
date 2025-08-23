import React, { useEffect, useState } from "react";
import { TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { saveCredentials } from "../services/Auth.service";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { Icons } from "../config/theme";
import { differenceInDays } from "date-fns";
import { RFPercentage } from "react-native-responsive-fontsize";

const webClientId =
  "";
const iosClientId =
  "";

const GoogleLoginButton = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId,
      iosClientId,
    });

    (async () => {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    })();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();
      console.log("userInfo...............", userInfo);
      
      const { idToken } = userInfo?.data;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        googleCredential
      );
      const user = userCredential.user;

      let pushToken = null;
      try {
        pushToken = await registerForPushNotificationsAsync();
      } catch (e) {
        console.log("Push token registration failed", e);
      }

      const userRef = doc(FIREBASE_DB, "users", user.uid);

      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Existing user → update only name, image, token
        await setDoc(
          userRef,
          {
            userName: user.displayName,
            profileImage: user.photoURL,
            token: pushToken || null,
            phoneNumber: user.phoneNumber,
          },
          { merge: true }
        );
      } else {
        await setDoc(userRef, {
          userName: user.displayName,
          email: user.email,
          profileImage: user.photoURL,
          phoneNumber: user.phoneNumber,
          token: pushToken || null,
          isSubscribed: false,
          isFreeTrial: false, // Only set once at first sign in
        });
      }

      await saveCredentials(user.email, "123456");
      await SecureStore.setItemAsync("loggedOut", "false");

      const updatedSnapshot = await getDoc(userRef);
      const existingUser = updatedSnapshot.data();
      const subscriptionStart = existingUser?.subscriptionStart;
      const subscriptionEnd = existingUser?.subscriptionEnd;
      const now = new Date();
      let trialDays = null;
      let isTrialValid = false;

      if (
        existingUser.isFreeTrial &&
        existingUser?.freeTrialStartedAt?.seconds
      ) {
        const trialStartDate = new Date(
          existingUser.freeTrialStartedAt.seconds * 1000
        );
        trialDays = differenceInDays(now, trialStartDate);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
      }

      const subStartDate = subscriptionStart
        ? new Date(subscriptionStart)
        : null;
      const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;
      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

      Toast.show({
        type: "success",
        text1: `${t("toast.login.one")}`,
        text2: `${t("toast.login.two")}`,
      });

      if (existingUser.isSubscribed || isWithinPaidPeriod) {
        navigation.navigate("TabNavigator");
      } else if (isTrialValid) {
        navigation.navigate("TabNavigator");
      } else if (
        existingUser.isFreeTrial &&
        trialDays !== null &&
        (trialDays < 0 || trialDays > 14)
      ) {
        navigation.navigate("Subscription");
      } else {
        navigation.navigate("FreeTrial");
      }
    } catch (error) {
      console.log("Google Sign-In Error:", JSON.stringify(error, null, 2));
      Toast.show({
        type: "error",
        text1: `${t("toast.login.three")}`,
        text2: `${t("toast.login.four")}`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size={"small"} color={"grey"} />;
  }

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleGoogleLogin}>
      <Image
        source={Icons.google}
        style={{ width: RFPercentage(4.5), height: RFPercentage(4.5) }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default GoogleLoginButton;
