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
  serverTimestamp,
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
        where("freeTrial", "==", true),
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.log("Error fetching freeTrials:", error);
      return false;
    }
  };

  // Consistent date parsing helper (same as in GoogleLoginButton)
  const parseFirestoreTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    if (typeof timestamp === "string") return new Date(timestamp);
    if (timestamp instanceof Date) return timestamp;
    return null;
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") {
      Toast.show({
        type: "error",
        text1: "Not supported",
        text2: "Apple Sign-In is only available on iOS",
      });
      return;
    }

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
      let appleAuthResponse;

      if (!appleAuth.isSupported) {
        console.log(" Apple Auth not supported, using simulator");
        // Simulator mode for testing
        appleAuthResponse = {
          user: "simulatedUser_" + Date.now(),
          email: `appleuser_${Date.now()}@test.com`,
          fullName: { givenName: "Apple", familyName: "User" },
          identityToken: "mock-identity-token-" + Date.now(),
          nonce: "mock-nonce-" + Date.now(),
        };
      } else {
        appleAuthResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });
      }

      const {
        identityToken,
        nonce,
        email,
        fullName,
        user: appleUserId,
      } = appleAuthResponse;

      if (!identityToken) {
        throw new Error("No identity token from Apple Sign-In");
      }

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        credential,
      );
      const user = userCredential.user;

      const pushToken = await registerForPushNotificationsAsync();

      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const finalEmail =
        email || user.email || `appleuser_${user.uid}@appleid.com`;
      const finalName = fullName
        ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
        : user.displayName || "Apple User";

      if (userSnap.exists()) {
        const existingData = userSnap.data();
        await setDoc(
          userRef,
          {
            userName: finalName || existingData.userName,
            profileImage: existingData.profileImage || user.photoURL || "",
            token: pushToken,
            phoneNumber: user.phoneNumber || existingData.phoneNumber || "",
            email: finalEmail || existingData.email,
            appleId: appleUserId,
            appleIdentityToken: identityToken,
            isSubscribed: existingData.isSubscribed ?? false,
            isFreeTrial: existingData.isFreeTrial ?? false,
            // Preserve existing subscription data
            subscriptionStart: existingData.subscriptionStart || null,
            subscriptionEnd: existingData.subscriptionEnd || null,
            subscriptionId: existingData.subscriptionId || null,
            planType: existingData.planType || null,
            freeTrialStartedAt: existingData.freeTrialStartedAt || null,
            webhook: existingData.webhook ?? true,
            lastLocationUpdate:
              existingData.lastLocationUpdate || serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdAt: existingData.createdAt || serverTimestamp(),
            emailVerified: true,
          },
          { merge: true },
        );
      } else {
        // New user
        await setDoc(userRef, {
          userId: user.uid,
          userName: finalName,
          email: finalEmail,
          profileImage: user.photoURL || "",
          phoneNumber: user.phoneNumber || "",
          token: pushToken,
          appleId: appleUserId,
          appleIdentityToken: identityToken,
          isSubscribed: false,
          isFreeTrial: false,
          subscriptionStart: null,
          subscriptionEnd: null,
          subscriptionId: null,
          planType: null,
          freeTrialStartedAt: null,
          webhook: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: true,
        });
      }

      // Save credentials
      await saveCredentials(finalEmail, appleUserId);
      await SecureStore.setItemAsync("loggedOut", "false");

      // Give Firestore time to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get updated user data
      const updatedSnap = await getDoc(userRef);
      const existingUser = updatedSnap.data();

      if (!existingUser) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to retrieve user data",
        });
        return;
      }

      const now = new Date();

      // Parse subscription dates using helper
      const subStartDate = parseFirestoreTimestamp(
        existingUser.subscriptionStart,
      );
      const subEndDate = parseFirestoreTimestamp(existingUser.subscriptionEnd);

      // Debug logs
      console.log("Apple Login - Subscription Check:");
      console.log("isSubscribed:", existingUser.isSubscribed);
      console.log("subscriptionStart:", existingUser.subscriptionStart);
      console.log("subscriptionEnd:", existingUser.subscriptionEnd);
      console.log("Parsed start:", subStartDate);
      console.log("Parsed end:", subEndDate);
      console.log("Current date:", now);

      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

      console.log("Is within paid period:", isWithinPaidPeriod);

      // Check trial validity
      let isTrialValid = false;
      const trialStartDate = parseFirestoreTimestamp(
        existingUser.freeTrialStartedAt,
      );
      if (existingUser.isFreeTrial && trialStartDate) {
        const trialDays = differenceInDays(now, trialStartDate);
        console.log("Trial days:", trialDays);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
        console.log("Is trial valid:", isTrialValid);
      }

      // Check if device has already used free trial
      const deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);
      console.log("Device used trial:", deviceUsedTrial);

      // Navigation logic - same order as Google login
      console.log(" Apple Navigation Decision:");

      if (existingUser.isSubscribed && isWithinPaidPeriod) {
        console.log(" Navigating to TabNavigator (paid subscription)");
        navigation.reset({
          index: 0,
          routes: [{ name: "TabNavigator" }],
        });
      } else if (isTrialValid) {
        console.log(" Navigating to TabNavigator (active trial)");
        navigation.reset({
          index: 0,
          routes: [{ name: "TabNavigator" }],
        });
      } else if (!deviceUsedTrial) {
        console.log("Navigating to FreeTrial (new device)");
        navigation.reset({
          index: 0,
          routes: [{ name: "FreeTrial" }],
        });
      } else {
        console.log(" Navigating to Subscription (device used trial)");
        navigation.reset({
          index: 0,
          routes: [{ name: "Subscription" }],
        });
      }

      Toast.show({
        type: "success",
        text1: `${t("toast.login.one")}`,
        text2: `${t("toast.login.two")}`,
      });
    } catch (error: any) {
      console.log("Apple Sign-In Error:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);

      let errorMessage = `${t("toast.login.four")}`;

      // More specific error messages
      if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Apple Sign-In is not enabled in Firebase";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid Apple credentials";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage = "Account already exists with different credentials";
      }

      Toast.show({
        type: "error",
        text1: `${t("toast.login.three")}`,
        text2: errorMessage,
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
