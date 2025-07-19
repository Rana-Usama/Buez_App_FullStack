import React, { useEffect, useState } from "react";
import { TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { saveCredentials } from "../services/Auth.service";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { Icons } from "../config/theme";
import { differenceInDays } from "date-fns";

const webClientId = "291364316025-qk5k8ptkmnqu2uadk7dmnn6vmkujiu3c.apps.googleusercontent.com";
// const webClientId = "291364316025-00v6oroakujt01a10cht0kjacsbm1drd.apps.googleusercontent.com"

const GoogleLoginButton = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId,
    });

    (async () => {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    })();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo?.data;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(FIREBASE_AUTH, googleCredential);
      const user = userCredential.user;

      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        const newUserData = {
          userName: user.displayName,
          email: user.email,
          isSubscribed: false,
          profileImage: user.photoURL,
          phoneNumber: user.phoneNumber,
          token: expoPushToken,
          isFreeTrial: false,
        };

        await setDoc(userRef, newUserData);
        await saveCredentials(user.email, "123456");
        Toast.show({
          type: "success",
          text1: `${t("toast.login.one")}`,
          text2: `${t("toast.login.two")}`,
        });
        navigation.navigate("FreeTrial");
      } else {
        const existingUser = userSnapshot.data();
        await saveCredentials(user.email, "123456");
        const subscriptionStart = existingUser?.subscriptionStart;
        const subscriptionEnd = existingUser?.subscriptionEnd;
        const now = new Date();
        let trialDays = null;
        let isTrialValid = false;

        if (existingUser.isFreeTrial && existingUser?.freeTrialStartedAt?.seconds) {
          const trialStartDate = new Date(existingUser.freeTrialStartedAt.seconds * 1000);
          trialDays = differenceInDays(now, trialStartDate);
          isTrialValid = trialDays >= 0 && trialDays <= 14;
        }

        const subStartDate = subscriptionStart ? new Date(subscriptionStart) : null;
        const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;

        const isWithinPaidPeriod = subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

        Toast.show({
          type: "success",
          text1: `${t("toast.login.one")}`,
          text2: `${t("toast.login.two")}`,
        });

        if (existingUser.isSubscribed || isWithinPaidPeriod) {
          navigation.navigate("TabNavigator");
        } else if (isTrialValid) {
          navigation.navigate("TabNavigator");
        } else if (existingUser.isFreeTrial && trialDays !== null && (trialDays < 0 || trialDays > 14)) {
          navigation.navigate("Subscription");
        } else {
          navigation.navigate("FreeTrial");
        }
      }
    } catch (error) {
      console.log("Google Sign-In Error:", error);
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
      <Image source={Icons.google} style={{ width: 35, height: 35 }} />
    </TouchableOpacity>
  );
};

export default GoogleLoginButton;
