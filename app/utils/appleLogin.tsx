import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getDoc, doc, setDoc } from "firebase/firestore";
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

const AppleLoginButton = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") return;
    setLoading(true);
    try {
      let appleAuthRequestResponse;
      if (!appleAuth.isSupported) {
        //  Mock Apple sign-in result for simulator
        console.log("Simulator detected – using mock Apple login");
        appleAuthRequestResponse = {
          user: "simulatedUser",
          email: "simulator@test.com",
          fullName: { givenName: "Simulator", familyName: "User" },
          identityToken: "mock-identity-token",
          nonce: "mock-nonce",
        };
      } else {
        // Real Apple sign-in for physical device
        appleAuthRequestResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });
      }

      const { identityToken, nonce, email, fullName } =
        appleAuthRequestResponse;

      if (!email && !fullName) {
        Alert.alert(
          "Apple Sign-In Info",
          "Apple only shares your name and email the first time you sign in. " +
            "To get them again, go to iPhone Settings → Apple ID → " +
            "Sign in with Apple → Apps Using Your Apple ID → Stop using Apple ID for this app, then try again."
        );
      }
      if (!identityToken)
        throw new Error("No identity token from Apple Sign-In");

      // Create Firebase credential
      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      console.log("credential................", credential);

      // Sign in to Firebase
      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        credential
      );

      const user = userCredential.user;
      console.log("user................", user);

      // Register for push notifications
      let pushToken = null;
      try {
        pushToken = await registerForPushNotificationsAsync();
      } catch (e) {
        console.log("Push token registration failed:", e);
      }

      // 5️⃣ Firestore user reference
      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnap = await getDoc(userRef);
      let storedEmail = await SecureStore.getItemAsync("apple_email");
      let storedName = await SecureStore.getItemAsync("apple_name");

      if (email) await SecureStore.setItemAsync("apple_email", email);
      if (fullName && (fullName.givenName || fullName.familyName)) {
        const name = `${fullName.givenName || ""} ${
          fullName.familyName || ""
        }`.trim();
        await SecureStore.setItemAsync("apple_name", name);
      }
      const finalEmail =
        email || user.email || storedEmail || `${user.uid}@appleuser.com`; // fallback fake email
      const finalName =
        (fullName &&
          `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()) ||
        storedName ||
        "Apple User";

      const userData = {
        userName: finalName,
        email: finalEmail,
        profileImage: user.photoURL || null,
        token: pushToken,
        phoneNumber: user.phoneNumber || null,
        userId: user.uid,
        isSubscribed: false,
        isFreeTrial: false,
      };

      if (userSnap.exists()) {
        await setDoc(userRef, { ...userData }, { merge: true });
      } else {
        await setDoc(userRef, userData);
      }

      await saveCredentials(finalEmail, "123456");
      await SecureStore.setItemAsync("loggedOut", "false");

      // 6️⃣ Subscription / Free Trial logic
      const updatedSnapshot = await getDoc(userRef);
      const existingUser = updatedSnapshot.data();
      const now = new Date();
      const subscriptionStart = existingUser?.subscriptionStart
        ? new Date(existingUser.subscriptionStart)
        : null;
      const subscriptionEnd = existingUser?.subscriptionEnd
        ? new Date(existingUser.subscriptionEnd)
        : null;
      const isWithinPaidPeriod =
        subscriptionStart &&
        subscriptionEnd &&
        now >= subscriptionStart &&
        now <= subscriptionEnd;

      let trialDays = null;
      let isTrialValid = false;
      if (
        existingUser.isFreeTrial &&
        existingUser?.freeTrialStartedAt?.seconds
      ) {
        const trialStart = new Date(
          existingUser.freeTrialStartedAt.seconds * 1000
        );
        trialDays = differenceInDays(now, trialStart);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
      }

      Toast.show({
        type: "success",
        text1: t("toast.login.one"),
        text2: t("toast.login.two"),
      });

      if (existingUser.isSubscribed || isWithinPaidPeriod || isTrialValid) {
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
      console.log("Apple Sign-In Error:", error);
      Toast.show({
        type: "error",
        text1: t("toast.login.three"),
        text2: t("toast.login.four"),
      });
    } finally {
      setLoading(false);
    }
  };

  // if (Platform.OS !== "ios") return null;
  if (loading) return <ActivityIndicator size="small" color="grey" />;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleAppleLogin}>
      <FontAwesome name="apple" size={RFPercentage(5)} color={theme.black} />
    </TouchableOpacity>
  );
};

export default AppleLoginButton;
