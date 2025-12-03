import React, { useState } from "react";
import { TouchableOpacity, Platform, ActivityIndicator } from "react-native";
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
      let appleAuthResponse;

      if (!appleAuth.isSupported) {
        // Mock for simulator
        appleAuthResponse = {
          user: "simulatedUser",
          email: "simulator@test.com",
          fullName: { givenName: "Simulator", familyName: "User" },
          identityToken: "mock-identity-token",
          nonce: "mock-nonce",
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

      if (!identityToken)
        throw new Error("No identity token from Apple Sign-In");

      // Firebase credential
      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        credential
      );
      const user = userCredential.user;

      console.log("user.........", user);

      // Push token
      let pushToken: string | null = null;
      try {
        pushToken = await registerForPushNotificationsAsync();
      } catch (e) {
        console.log("Push token registration failed", e);
      }

      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Compute final email and name
      let finalEmail = email || user.email || `${user.uid}@appleuser.com`;
      let finalName = fullName
        ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
        : user.displayName || "Apple User";

      if (userSnap.exists()) {
        const data = userSnap.data();
        // Merge logic: reuse previous email/name if identity token matches
        if (data.appleIdentityToken === identityToken) {
          finalEmail = data.email || finalEmail;
          finalName = data.userName || finalName;
        }

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
          email: finalEmail || "Apple User",
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

      // Save credentials and user info in SecureStore
      await saveCredentials(String(finalEmail), String(appleUserId));
      await SecureStore.setItemAsync("loggedOut", "false");
      await SecureStore.setItemAsync("apple_email", String(finalEmail));
      await SecureStore.setItemAsync("apple_name", String(finalName));
      await SecureStore.setItemAsync(
        "apple_user_data",
        JSON.stringify({ uid: user.uid, email: finalEmail, name: finalName })
      );

      // Navigation based on subscription/trial
      const data = (await getDoc(userRef)).data();
      const now = new Date();

      const subStart = data?.subscriptionStart
        ? new Date(data.subscriptionStart)
        : null;
      const subEnd = data?.subscriptionEnd
        ? new Date(data.subscriptionEnd)
        : null;
      const isWithinPaidPeriod =
        subStart && subEnd && now >= subStart && now <= subEnd;

      let isTrialValid = false;
      if (data?.isFreeTrial && data?.freeTrialStartedAt?.seconds) {
        const trialStart = new Date(data.freeTrialStartedAt.seconds * 1000);
        const trialDays = differenceInDays(now, trialStart);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
      }

      if (data?.isSubscribed || isWithinPaidPeriod || isTrialValid) {
        navigation.navigate("TabNavigator");
      } else if (data?.isFreeTrial && !isTrialValid) {
        navigation.navigate("Subscription");
      } else {
        navigation.navigate("FreeTrial");
      }

      Toast.show({
        type: "success",
        text1: t("toast.login.one"),
        text2: t("toast.login.two"),
      });
    } catch (error) {
      console.log("🍎 Apple Sign-In Error:", error);
      Toast.show({
        type: "error",
        text1: t("toast.login.three"),
        text2: t("toast.login.four"),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" color="grey" />;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleAppleLogin}>
      <FontAwesome name="apple" size={RFPercentage(5.3)} color={theme.black} style={{bottom : 0.5}}/>
    </TouchableOpacity>
  );
};

export default AppleLoginButton;
