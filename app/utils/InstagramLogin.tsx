import React, { useRef, useState, useEffect } from "react";
import { View, ActivityIndicator, Alert, Text } from "react-native";
import { WebView } from "react-native-webview";
import { getPagesAndIGAccount } from "./IgApis";
import { handleInstagramLogin } from "./InstagramLoginHandler";
import { registerForPushNotificationsAsync } from "./notificationService";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import { checkExistingEmailLoginType, saveEmailLoginType } from "./loginType";

// Instagram Onboarding screen
// &display=page&extras=${encodeURIComponent(
// JSON.stringify({ setup: { channel: "IG_API_ONBOARDING" } })
// )}


const FB_APP_ID = process.env.FB_ID_IG;      // "716889610970681";
const APP_SECRET = process.env.APP_SECRET_IG;     // "2fc223957e3ccdcdfceb59311e226adc";
const REDIRECT_URI = "https://auth.expo.io/@native-team/Buez";

const IG_LOGIN_URL = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&response_type=token&auth_type=rerequest&scope=instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement,email,business_management`;

const InstagramBusinessLoginWebView = ({ navigation }: any) => {
  const { t } = useTranslation();
  const webViewRef = useRef();
  const [loadingMessage, setLoadingMessage] = useState("Connecting to Instagram...");

  const handleNavigationChange = (navState) => {
    const { url } = navState;

    if (url.startsWith(REDIRECT_URI)) {
      const fragment = url.split("#")[1];
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const access_token = params.get("access_token");
      if (access_token) {
        exchangeForLongLivedToken(access_token)
          .then((long_lived_token) => {
            onTokenReceived({ access_token, long_lived_token });
          })
          .catch((err) => {
            Alert.alert("Token Exchange Error", err.message);
          });
      } else {
        Alert.alert("Login Failed", "Access token not found.");
      }
    }
  };

  const exchangeForLongLivedToken = async (shortLivedToken) => {
    const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`);
    const json = await res.json();
    if (json.access_token) {
      return json.access_token;
    } else {
      throw new Error("Failed to get long-lived token.");
    }
  };

  const onTokenReceived = async ({ access_token, long_lived_token }) => {
    try {
      const userRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${long_lived_token}`);
      const userData = await userRes.json();

      const email = userData?.email;
      const currentLoginType = "instagram";

      const existingType = await checkExistingEmailLoginType(email, currentLoginType);
      if (existingType) {
        Alert.alert("Login Failed", `You have already used this email with ${existingType} login.`);
        return;
      }

      const data = await getPagesAndIGAccount(long_lived_token);
      const pushToken = await registerForPushNotificationsAsync();

      const loginResult = await handleInstagramLogin({
        igProfile: data.ig_profile,
        pageId: data.page_id,
        pageToken: data.page_token,
        email: userData?.email || null,
        pushToken,
        navigation,
        t,
        long_lived_token,
      });
      if (loginResult?.success) {
        await saveEmailLoginType(email, currentLoginType);
        await SecureStore.setItemAsync("instagramUid", data.ig_profile.id);
        Alert.alert("Verified", `Connected IG: @${data.ig_profile.username}\nEmail: ${userData.email}\nid: ${data.ig_profile.id}`);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: IG_LOGIN_URL }}
        onNavigationStateChange={handleNavigationChange}
        injectedJavaScript={`setInterval(() => {
          window.ReactNativeWebView.postMessage(window.location.href);
        }, 1000); true;`}
        onMessage={(event) => {
          const url = event.nativeEvent.data;
        }}
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

export default InstagramBusinessLoginWebView;
