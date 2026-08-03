import React, { useState, useEffect } from "react";
import {
  Platform,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInWithCredential, OAuthProvider } from "firebase/auth";
import appleAuth from "@invertase/react-native-apple-authentication";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { resolveFounderRoute } from "../services/Founder.service";
import { saveCredentials } from "../services/Auth.service";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAppTheme } from "../contexts/themeContext";
import DeviceInfo from "react-native-device-info";
import Colors from "../config/Colors";

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

    if (!appleAuth.isSupported) {
      Toast.show({
        type: "error",
        text1: "Not supported",
        text2: "Sign in with Apple requires iOS 13 or later.",
      });
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Apple auth request
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const {
        identityToken,
        nonce,
        email,
        fullName,
        user: appleUserId,
      } = appleAuthResponse;

      if (!identityToken) {
        throw new Error("Apple Sign-In failed: no identity token received");
      }

      // 2️⃣ Firebase credential + sign in
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

      // 3️⃣ Firestore read/write — no push token needed here
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
            phoneNumber: user.phoneNumber || existingData.phoneNumber || "",
            email: finalEmail || existingData.email,
            appleId: appleUserId,
            // Note: never store identityToken in Firestore (security)
            isSubscribed: existingData.isSubscribed ?? false,
            subscriptionStart: existingData.subscriptionStart || null,
            subscriptionEnd: existingData.subscriptionEnd || null,
            subscriptionId: existingData.subscriptionId || null,
            planType: existingData.planType || null,
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
          appleId: appleUserId,
          isSubscribed: false,
          subscriptionStart: null,
          subscriptionEnd: null,
          subscriptionId: null,
          planType: null,
          webhook: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: true,
        });
      }

      await saveCredentials(finalEmail, appleUserId);
      await SecureStore.setItemAsync("loggedOut", "false");

      // 4️⃣ Fetch updated user data for routing
      const updatedSnap = await getDoc(userRef);
      const existingUser = updatedSnap.data();

      if (!existingUser) {
        throw new Error("Failed to retrieve user data after sign-in");
      }

      const now = new Date();

      const subStartDate = parseFirestoreTimestamp(
        existingUser.subscriptionStart,
      );
      const subEndDate = parseFirestoreTimestamp(existingUser.subscriptionEnd);
      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

      // 5️⃣ Determine target route (founder intro once; device claimed by
      // another account → standard plans)
      let targetRoute: string;
      if (existingUser.isSubscribed && isWithinPaidPeriod) {
        targetRoute = "TabNavigator";
      } else {
        targetRoute = await resolveFounderRoute(deviceId, existingUser);
      }

      console.log("Apple Sign-In → navigating to:", targetRoute);

      // 6️⃣ Navigate FIRST — never block navigation on push token registration
      Toast.show({
        type: "success",
        text1: `${t("toast.login.one")}`,
        text2: `${t("toast.login.two")}`,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });

      // 7️⃣ Register push token in the background AFTER navigation completes
      registerForPushNotificationsAsync()
        .then((pushToken) => {
          if (pushToken) {
            setDoc(userRef, { token: pushToken }, { merge: true }).catch((e) =>
              console.warn("Failed to update push token:", e),
            );
          }
        })
        .catch((e) => console.warn("Push token registration error:", e));
    } catch (error: any) {
      console.log("Apple Sign-In Full Error:", JSON.stringify(error, null, 2));

      // User cancelled — don't show error toast
      if (
        error.code === "1001" ||
        error.code === "ERR_CANCELED" ||
        error.message?.includes("cancelled") ||
        error.message?.includes("canceled")
      ) {
        return;
      }

      let errorMessage = `${t("toast.login.four")}`;

      if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Apple Sign-In is not enabled in Firebase";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid Apple credentials. Please try again.";
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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleAppleLogin}
      style={[
        styles.circleButton,
        { backgroundColor: theme.mode === "dark" ? Colors.white : Colors.blackSolid },
      ]}
    >
      <FontAwesome
        name="apple"
        size={RFPercentage(3)}
        color={theme.mode === "dark" ? Colors.blackSolid : Colors.white}
        style={styles.fontAwesome}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circleButton: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3.5),
    alignItems: "center",
    justifyContent: "center",
  },
  fontAwesome: { marginTop: -RFPercentage(0.3) },
});

export default AppleLoginButton;
