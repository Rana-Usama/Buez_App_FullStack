import React, { useEffect, useState } from "react";
import { TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  getDoc,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
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
import DeviceInfo from "react-native-device-info";

const webClientId =
  "211367941601-i7pb5oak2cqq5vcvtvfv0sqsl4t6mgma.apps.googleusercontent.com";
const iosClientId =
  "211367941601-en9daed1ci5shk3kemibpao7lcg7622v.apps.googleusercontent.com";

const GoogleLoginButton = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDeviceId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
    };
    fetchDeviceId();

    GoogleSignin.configure({ webClientId, iosClientId, offlineAccess: true });

    (async () => {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    })();
  }, []);

  const hasDeviceAvailedFreeTrial = async (deviceId: string) => {
    if (!deviceId) return false;
    try {
      const q = query(
        collection(FIREBASE_DB, "freeTrials"),
        where("deviceId", "==", deviceId),
        where("freeTrial", "==", true)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.log("Error fetching freeTrials:", error);
      return false;
    }
  };

  const handleGoogleLogin = async () => {
    if (!deviceId) {
      Toast.show({
        type: "info",
        text1: "Device ID loading",
        text2: "Please wait a moment before logging in.",
      });
      return;
    }

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo.data;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        googleCredential
      );
      const user = userCredential.user;

      const pushToken =
        expoPushToken || (await registerForPushNotificationsAsync());

      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await setDoc(
          userRef,
          {
            userName: user.displayName,
            profileImage: user.photoURL,
            token: pushToken,
            phoneNumber: user.phoneNumber,
            email: user.email,
            isSubscribed: userSnap.data()?.isSubscribed ?? false,
            isFreeTrial: userSnap.data()?.isFreeTrial ?? false,
          },
          { merge: true }
        );
      } else {
        await setDoc(userRef, {
          userName: user.displayName,
          email: user.email,
          profileImage: user.photoURL,
          phoneNumber: user.phoneNumber,
          token: pushToken,
          isSubscribed: false,
          isFreeTrial: false,
        });
      }

      await saveCredentials(user.email, "123456");
      await SecureStore.setItemAsync("loggedOut", "false");

      const updatedSnap = await getDoc(userRef);
      const existingUser = updatedSnap.data();
      const now = new Date();

      // Check subscription validity
      const parseDate = (date) => {
        if (!date) return null;
        if (date.seconds) return new Date(date.seconds * 1000);
        if (typeof date === "string") return new Date(date);
        return null;
      };

      const subStartDate = parseDate(existingUser.subscriptionStart);
      const subEndDate = parseDate(existingUser.subscriptionEnd);
      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

      // Check trial validity
      let isTrialValid = false;
      if (
        existingUser.isFreeTrial &&
        existingUser.freeTrialStartedAt?.seconds
      ) {
        const trialStart = new Date(
          existingUser.freeTrialStartedAt.seconds * 1000
        );
        const trialDays = differenceInDays(now, trialStart);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
      }

      // Check if device has already used free trial
      const deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);

      // Navigation logic
      if (existingUser.isSubscribed || isWithinPaidPeriod) {
        navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
      } else if (isTrialValid) {
        navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
      } else if (deviceUsedTrial) {
        navigation.reset({ index: 0, routes: [{ name: "Subscription" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "FreeTrial" }] });
      }

      Toast.show({
        type: "success",
        text1: `${t("toast.login.one")}`,
        text2: `${t("toast.login.two")}`,
      });
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

  if (loading) return <ActivityIndicator size={"small"} color={"grey"} />;

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
