import React, { useRef, useState } from "react";
import { View, ActivityIndicator, Alert, Text } from "react-native";
import { WebView } from "react-native-webview";
import { FacebookAuthProvider, signInWithCredential } from "firebase/auth";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { registerForPushNotificationsAsync } from "./notificationService";
import { differenceInDays } from "date-fns";
import { saveCredentials } from "../services/Auth.service";
import { checkExistingEmailLoginType, saveEmailLoginType } from "./loginType";
import * as SecureStore from "expo-secure-store";

const FB_APP_ID = "";
const APP_SECRET = "";
const REDIRECT_URI = "";

const FB_LOGIN_URL = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&response_type=token&auth_type=rerequest&scope=email,public_profile,business_management,`;

const FacebookLoginWebView = ({ navigation }: any) => {
  const webViewRef = useRef();
  const [loadingMessage, setLoadingMessage] = useState(
    "Connecting to Facebook..."
  );

  const handleNavigationChange = (navState) => {
    const { url } = navState;

    if (url.startsWith(REDIRECT_URI)) {
      const fragment = url.split("#")[1];
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const access_token = params.get("access_token");
      if (access_token) {
        exchangeForLongLivedToken(access_token)
          .then((longLivedToken) => onTokenReceived(longLivedToken))
          .catch((err) => Alert.alert("Token Exchange Error", err.message));
      } else {
        Alert.alert("Login Failed", "Access token not found.");
      }
    }
  };

  const exchangeForLongLivedToken = async (shortToken) => {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`
    );
    const json = await res.json();
    if (json.access_token) return json.access_token;
    throw new Error("Failed to get long-lived token.");
  };

  const onTokenReceived = async (longLivedToken: string) => {
    try {
      const userRes = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${longLivedToken}`
      );
      const userDataResponse = await userRes.json();
      console.log("userDataResponse.....", userDataResponse);
      const email = userDataResponse.email;
      const currentLoginType = "facebook";

      const existingType = await checkExistingEmailLoginType(
        email,
        currentLoginType
      );
      if (existingType) {
        Alert.alert(
          "Login Failed",
          `You have already used this email with ${existingType} login.`
        );
        return;
      }
      const facebookCredential =
        FacebookAuthProvider.credential(longLivedToken);
      const userCredential = await signInWithCredential(
        FIREBASE_AUTH,
        facebookCredential
      );
      const firebaseUser = userCredential.user;

      const uid = firebaseUser.uid;
      const userRef = doc(FIREBASE_DB, "users", uid);
      const userSnapshot = await getDoc(userRef);

      const pushToken = await registerForPushNotificationsAsync();
      await setDoc(
        userRef,
        {
          userName: userDataResponse.name,
          email: userDataResponse.email,
          facebookId: userDataResponse.id,
          profileImage: userDataResponse.picture?.data?.url || null,
          token: pushToken || null,
          createdAt: new Date().toISOString(),
          isSubscribed: false,
          isFreeTrial: true,
        },
        { merge: true }
      );

      await saveEmailLoginType(email, currentLoginType);
      Alert.alert("Success", `Welcome, ${userDataResponse.name}!`);
      const password = userDataResponse.id;
      await saveCredentials(userDataResponse.email, password);
      await SecureStore.setItemAsync("loggedOut", "false");
      const userData = userSnapshot.exists() ? userSnapshot.data() : null;

      const now = new Date();
      const trialStart = userData?.freeTrialStartedAt?.seconds
        ? new Date(userData.freeTrialStartedAt.seconds * 1000)
        : null;
      const subStartDate = userData?.subscriptionStart
        ? new Date(userData.subscriptionStart)
        : null;
      const subEndDate = userData?.subscriptionEnd
        ? new Date(userData.subscriptionEnd)
        : null;

      const trialDays = trialStart ? differenceInDays(now, trialStart) : null;
      const isTrialValid =
        trialDays !== null && trialDays >= 0 && trialDays <= 14;
      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

      if (userData?.isSubscribed || isWithinPaidPeriod) {
        navigation.navigate("TabNavigator");
      } else if (isTrialValid) {
        navigation.navigate("TabNavigator");
      } else if (userData?.isFreeTrial && (trialDays < 0 || trialDays > 14)) {
        navigation.navigate("Subscription");
      } else {
        navigation.navigate("FreeTrial");
      }
    } catch (error) {
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: FB_LOGIN_URL }}
        onNavigationStateChange={handleNavigationChange}
        injectedJavaScript={`setInterval(() => {
          window.ReactNativeWebView.postMessage(window.location.href);
        }, 1000); true;`}
        onMessage={() => {}}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View style={{ bottom: 200 }}>
              <ActivityIndicator size="large" color="#333" />
              <Text
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  fontFamily: "Poppins_500Medium",
                }}
              >
                {loadingMessage}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default FacebookLoginWebView;
