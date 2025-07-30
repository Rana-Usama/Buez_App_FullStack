// import React, { useEffect, useState } from "react";
// import { TouchableOpacity, Image, ActivityIndicator } from "react-native";
// import { LoginManager, AccessToken } from "react-native-fbsdk-next";
// import { FacebookAuthProvider, signInWithCredential, fetchSignInMethodsForEmail } from "firebase/auth";
// import { getDoc, doc, setDoc } from "firebase/firestore";
// import Toast from "react-native-toast-message";
// import { useTranslation } from "react-i18next";
// import { differenceInDays } from "date-fns";

// import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// import { saveCredentials } from "../services/Auth.service";
// import { registerForPushNotificationsAsync } from "../utils/notificationService";
// import { Icons } from "../config/theme";

// const FacebookLoginButton = ({ navigation }: { navigation: any }) => {
//   const [loading, setLoading] = useState(false);
//   const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
//   const { t } = useTranslation();

//   useEffect(() => {
//     (async () => {
//       const token = await registerForPushNotificationsAsync();
//       setExpoPushToken(token);
//     })();
//   }, []);

//   const handleFacebookLogin = async () => {
//     setLoading(true);
//     console.log("[FacebookLogin] Starting Facebook login process...");

//     try {
//       console.log("[FacebookLogin] Attempting to log in with Facebook permissions...");
//       const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
//       console.log('result........', result)
//       console.log("[FacebookLogin] Login result:", JSON.stringify(result, null, 2));

//       if (result.isCancelled) {
//         console.log("[FacebookLogin] User cancelled the login process");
//         throw new Error("USER_CANCELLED");
//       }

//       console.log("[FacebookLogin] Getting Facebook access token...");
//       const data = await AccessToken.getCurrentAccessToken();
//       console.log("[FacebookLogin] Access token data:", JSON.stringify(data, null, 2));

//       if (!data) {
//         console.log("[FacebookLogin] No access token received");
//         throw new Error("NO_ACCESS_TOKEN");
//       }

//       console.log("[FacebookLogin] Creating Facebook credential...");
//       const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
//       console.log("[FacebookLogin] Credential created:", facebookCredential);

//       let userCredential;
//       try {
//         console.log("[FacebookLogin] Attempting to sign in with credential...");
//         userCredential = await signInWithCredential(FIREBASE_AUTH, facebookCredential);
//         console.log("[FacebookLogin] Sign-in successful:", userCredential.user.uid);
//       } catch (error: any) {
//         console.error("[FacebookLogin] Sign-in error:", JSON.stringify(error, null, 2));

//         if (error.code === "auth/account-exists-with-different-credential") {
//           const email = error.customData?.email;
//           console.log("[FacebookLogin] Account exists with different credential for email:", email);

//           const methods = await fetchSignInMethodsForEmail(FIREBASE_AUTH, email);
//           console.log("[FacebookLogin] Available sign-in methods:", methods);

//           const message = methods.includes("google.com") ? "Please sign in with Google first to link your account." : `Try logging in using: ${methods.join(", ")}`;

//           Toast.show({
//             type: "error",
//             text1: "Account exists",
//             text2: message,
//           });

//           return;
//         }
//         throw error;
//       }

//       const user = userCredential.user;
//       console.log("[FacebookLogin] User authenticated:", user.uid);

//       const userRef = doc(FIREBASE_DB, "users", user.uid);
//       const userSnapshot = await getDoc(userRef);
//       console.log("[FacebookLogin] User document exists:", userSnapshot.exists());

//       if (!userSnapshot.exists()) {
//         console.log("[FacebookLogin] Creating new user document...");
//         const newUserData = {
//           userName: user.displayName,
//           email: user.email,
//           isSubscribed: false,
//           profileImage: user.photoURL,
//           phoneNumber: user.phoneNumber,
//           token: expoPushToken,
//           isFreeTrial: false,
//           createdAt: new Date().toISOString(),
//         };

//         await setDoc(userRef, newUserData);
//         await saveCredentials(user.email, "123456");

//         console.log("[FacebookLogin] New user created and credentials saved");
//         Toast.show({
//           type: "success",
//           text1: t("toast.login.one"),
//           text2: t("toast.login.two"),
//         });
//         navigation.navigate("FreeTrial");
//       } else {
//         console.log("[FacebookLogin] Existing user found, processing...");
//         const existingUser = userSnapshot.data();
//         await saveCredentials(user.email, "123456");

//         const now = new Date();
//         const trialStart = existingUser?.freeTrialStartedAt?.seconds ? new Date(existingUser.freeTrialStartedAt.seconds * 1000) : null;
//         const trialDays = trialStart ? differenceInDays(now, trialStart) : null;
//         const isTrialValid = trialDays !== null && trialDays >= 0 && trialDays <= 14;

//         const subscriptionStart = existingUser.subscriptionStart ? new Date(existingUser.subscriptionStart) : null;
//         const subscriptionEnd = existingUser.subscriptionEnd ? new Date(existingUser.subscriptionEnd) : null;

//         const isWithinPaidPeriod = subscriptionStart && subscriptionEnd && now >= subscriptionStart && now <= subscriptionEnd;

//         console.log("[FacebookLogin] User status:", {
//           isSubscribed: existingUser.isSubscribed,
//           isWithinPaidPeriod,
//           isTrialValid,
//           trialDays,
//         });

//         Toast.show({
//           type: "success",
//           text1: t("toast.login.one"),
//           text2: t("toast.login.two"),
//         });

//         if (existingUser.isSubscribed || isWithinPaidPeriod || isTrialValid) {
//           console.log("[FacebookLogin] Navigating to TabNavigator");
//           navigation.navigate("TabNavigator");
//         } else if (existingUser.isFreeTrial && (trialDays < 0 || trialDays > 14)) {
//           console.log("[FacebookLogin] Navigating to Subscription");
//           navigation.navigate("Subscription");
//         } else {
//           console.log("[FacebookLogin] Navigating to FreeTrial");
//           navigation.navigate("FreeTrial");
//         }
//       }
//     } catch (error) {
//       console.error("[FacebookLogin] Error in Facebook login process:", error);
//       Toast.show({
//         type: "error",
//         text1: t("toast.login.three"),
//         text2: t("toast.login.four"),
//       });
//     } finally {
//       console.log("[FacebookLogin] Login process completed");
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <ActivityIndicator size={"small"} color={"grey"} />;
//   }

//   return (
//     <TouchableOpacity activeOpacity={0.8} onPress={handleFacebookLogin}>
//       <Image source={Icons.fb} style={{ width: 38, height: 38 }} />
//     </TouchableOpacity>
//   );
// };

// export default FacebookLoginButton;

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

const FB_APP_ID = process.env.FB_ID_IG;        // "716889610970681";
const APP_SECRET = process.env.APP_SECRET_IG;  // "2fc223957e3ccdcdfceb59311e226adc";
const REDIRECT_URI = "https://auth.expo.io/@native-team/Buez";

const FB_LOGIN_URL = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&response_type=token&auth_type=rerequest&scope=email,public_profile,business_management,`;

const FacebookLoginWebView = ({ navigation }: any) => {
  const webViewRef = useRef();
  const [loadingMessage, setLoadingMessage] = useState("Connecting to Facebook...");

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
    const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`);
    const json = await res.json();
    if (json.access_token) return json.access_token;
    throw new Error("Failed to get long-lived token.");
  };

  const onTokenReceived = async (longLivedToken: string) => {
    try {
      const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${longLivedToken}`);
      const userDataResponse = await userRes.json();
      const email = userDataResponse.email;
      const currentLoginType = "facebook";

      const existingType = await checkExistingEmailLoginType(email, currentLoginType);
      if (existingType) {
        Alert.alert("Login Failed", `You have already used this email with ${existingType} login.`);
        return;
      }
      const facebookCredential = FacebookAuthProvider.credential(longLivedToken);
      const userCredential = await signInWithCredential(FIREBASE_AUTH, facebookCredential);
      const firebaseUser = userCredential.user;

      const uid = firebaseUser.uid;
      const userRef = doc(FIREBASE_DB, "users", uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        const pushToken = await registerForPushNotificationsAsync();
        await setDoc(userRef, {
          userName: userDataResponse.name,
          email: userDataResponse.email,
          facebookId: userDataResponse.id,
          profileImage: userDataResponse.picture?.data?.url || null,
          token: pushToken || null,
          createdAt: new Date().toISOString(),
          isSubscribed: false,
          isFreeTrial: true,
        });
      }
      await saveEmailLoginType(email, currentLoginType);
      Alert.alert("Success", `Welcome, ${userDataResponse.name}!`);
      const password = userDataResponse.id;
      await saveCredentials(userDataResponse.email, password);
      const userData = userSnapshot.exists() ? userSnapshot.data() : null;

      const now = new Date();
      const trialStart = userData?.freeTrialStartedAt?.seconds ? new Date(userData.freeTrialStartedAt.seconds * 1000) : null;
      const subStartDate = userData?.subscriptionStart ? new Date(userData.subscriptionStart) : null;
      const subEndDate = userData?.subscriptionEnd ? new Date(userData.subscriptionEnd) : null;

      const trialDays = trialStart ? differenceInDays(now, trialStart) : null;
      const isTrialValid = trialDays !== null && trialDays >= 0 && trialDays <= 14;
      const isWithinPaidPeriod = subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

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
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ bottom: 200 }}>
              <ActivityIndicator size="large" color="#333" />
              <Text style={{ marginTop: 20, textAlign: "center", fontFamily: "Poppins_500Medium" }}>{loadingMessage}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default FacebookLoginWebView;
