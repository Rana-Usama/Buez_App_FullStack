import React, { useState, useEffect } from "react";
import { TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import {
  getDoc,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signInWithCredential, OAuthProvider } from "firebase/auth";
import appleAuth from "@invertase/react-native-apple-authentication";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import { differenceInDays } from "date-fns";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { saveCredentials } from "../services/Auth.service";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAppTheme } from "../contexts/themeContext";
import DeviceInfo from "react-native-device-info";

const AppleLoginButton = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    const fetchId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
    };
    fetchId();
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

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") return;
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
      // Apple auth request
      const appleAuthResponse = !appleAuth.isSupported
        ? {
            user: "simulatedUser",
            email: "simulator@test.com",
            fullName: { givenName: "Simulator", familyName: "User" },
            identityToken: "mock-identity-token",
            nonce: "mock-nonce",
          }
        : await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
          });

      const { identityToken, nonce, email, fullName, user: appleUserId } =
        appleAuthResponse;

      if (!identityToken) throw new Error("No identity token from Apple Sign-In");

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
      const userCredential = await signInWithCredential(FIREBASE_AUTH, credential);
      const user = userCredential.user;

      const pushToken = await registerForPushNotificationsAsync();

      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const finalEmail = email || user.email || `${user.uid}@appleuser.com`;
      const finalName = fullName
        ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
        : user.displayName || "Apple User";

      if (userSnap.exists()) {
        const data = userSnap.data();
        await setDoc(
          userRef,
          {
            userName: finalName || data.userName || "Apple User",
            profileImage: data.profileImage || user.photoURL || null,
            token: pushToken || data.token || null,
            phoneNumber: user.phoneNumber || data.phoneNumber || null,
            email: finalEmail || data.email,
            userId: data.userId || user.uid,
            appleId: appleUserId,
            appleIdentityToken: identityToken,
            isSubscribed: data.isSubscribed ?? false,
            isFreeTrial: data.isFreeTrial ?? false,
            freeTrialStartedAt: data.freeTrialStartedAt || null,
            subscriptionStart: data.subscriptionStart || null,
            subscriptionEnd: data.subscriptionEnd || null,
          },
          { merge: true }
        );
      } else {
        await setDoc(userRef, {
          userName: finalName,
          email: finalEmail,
          profileImage: user.photoURL || null,
          phoneNumber: user.phoneNumber || null,
          token: pushToken,
          userId: user.uid,
          appleId: appleUserId,
          appleIdentityToken: identityToken,
          isSubscribed: false,
          isFreeTrial: false,
          freeTrialStartedAt: null,
          subscriptionStart: null,
          subscriptionEnd: null,
        });
      }

      await saveCredentials(String(finalEmail), String(appleUserId));
      await SecureStore.setItemAsync("loggedOut", "false");

      const updatedSnap = await getDoc(userRef);
      const existingUser = updatedSnap.data();
      const now = new Date();

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

      let isTrialValid = false;
      if (existingUser.isFreeTrial && existingUser.freeTrialStartedAt?.seconds) {
        const trialStart = new Date(existingUser.freeTrialStartedAt.seconds * 1000);
        const trialDays = differenceInDays(now, trialStart);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
      }

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
      console.log("Apple Sign-In Error:", error);
      Toast.show({
        type: "error",
        text1: `${t("toast.login.three")}`,
        text2: `${t("toast.login.four")}`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" color="grey" />;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleAppleLogin}>
      <FontAwesome
        name="apple"
        size={RFPercentage(5.3)}
        color={theme.black}
        style={{ bottom: 0.5 }}
      />
    </TouchableOpacity>
  );
};

export default AppleLoginButton;
