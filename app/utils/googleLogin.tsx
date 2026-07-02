import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { saveCredentials } from "../services/Auth.service";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { hasCompletedFounderIntro } from "../utils/founderIntro";
import { Icons } from "../config/theme";
import { RFPercentage } from "react-native-responsive-fontsize";
import DeviceInfo from "react-native-device-info";
import { useAppTheme } from "../contexts/themeContext";


const webClientId =
  "211367941601-i7pb5oak2cqq5vcvtvfv0sqsl4t6mgma.apps.googleusercontent.com";
const iosClientId =
  "211367941601-en9daed1ci5shk3kemibpao7lcg7622v.apps.googleusercontent.com";

const GoogleLoginButton = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { theme } = useAppTheme();
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

  // Helper function to parse dates consistently
  const parseFirestoreTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000); // Sometimes it's _seconds
    if (typeof timestamp === "string") return new Date(timestamp);
    if (timestamp instanceof Date) return timestamp;
    return null;
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
      console.log("user....", userInfo)
      const { idToken } = userInfo.data;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        googleCredential,
      );
      const user = userCredential.user;

      const pushToken =
        expoPushToken || (await registerForPushNotificationsAsync());

      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Get current user data or create new
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        await setDoc(
          userRef,
          {
            userName: user.displayName || existingData.userName,
            profileImage: user.photoURL || existingData.profileImage,
            token: pushToken,
            phoneNumber: user.phoneNumber || existingData.phoneNumber,
            email: user.email || existingData.email,
            isSubscribed: existingData.isSubscribed ?? false,
            // Preserve existing subscription dates if they exist
            subscriptionStart: existingData.subscriptionStart || null,
            subscriptionEnd: existingData.subscriptionEnd || null,
            webhook: existingData.webhook ?? true,
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
          userName: user.displayName || "",
          email: user.email || "",
          profileImage: user.photoURL || "",
          phoneNumber: user.phoneNumber || "",
          token: pushToken,
          isSubscribed: false,
          subscriptionStart: null,
          subscriptionEnd: null,
          webhook: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: true,
        });
      }

      // Save credentials and clear logged out flag
       await SecureStore.setItemAsync("loggedOut", "false");
      await saveCredentials(user.email, "123456");
     
      // Give Firestore a moment to update
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

      // Parse subscription dates
      const subStartDate = parseFirestoreTimestamp(
        existingUser.subscriptionStart,
      );
      const subEndDate = parseFirestoreTimestamp(existingUser.subscriptionEnd);

      // Debug logs
      console.log("🔍 Google Login - Subscription Check:");
      console.log("isSubscribed:", existingUser.isSubscribed);
      console.log("subscriptionStart:", existingUser.subscriptionStart);
      console.log("subscriptionEnd:", existingUser.subscriptionEnd);
      console.log("Parsed start:", subStartDate);
      console.log("Parsed end:", subEndDate);
      console.log("Current date:", now);

      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

      console.log("Is within paid period:", isWithinPaidPeriod);

      console.log("Navigation Decision:");
      if (existingUser?.isSubscribed && isWithinPaidPeriod) {
        console.log("Navigating to TabNavigator (paid subscription)");
        navigation.replace("TabNavigator");
      } else {
        const founderIntroDone = await hasCompletedFounderIntro();
        console.log(
          "Navigating to",
          founderIntroDone ? "TabNavigator" : "FounderIntro",
        );
        navigation.replace(founderIntroDone ? "TabNavigator" : "FounderIntro");
      }

      Toast.show({
        type: "success",
        text1: `${t("toast.login.one")}`,
        text2: `${t("toast.login.two")}`,
      });
    } catch (error: any) {
      console.log("Google Sign-In Error:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);

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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleGoogleLogin}
      style={[
        styles.circleButton,
        {
          // Match the Apple button: solid black in light mode, white in dark.
          backgroundColor: theme.mode === "dark" ? "#FFFFFF" : "#000000ff",
        },
      ]}
    >
      <Image
        source={Icons.google}
        style={styles.googleIcon}
        resizeMode="contain"
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
  googleIcon: {
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
});

export default GoogleLoginButton;
