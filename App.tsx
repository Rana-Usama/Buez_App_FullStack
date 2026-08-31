import React, { useState, useEffect, useRef } from "react";
import { View, LogBox, Image, Platform, InteractionManager } from "react-native";
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  Poppins_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/poppins";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./app/utils/notificationService";
import { UserProvider, useUser } from "./app/contexts/user.context";
import { PostProvider } from "./app/contexts/PostContext";
import ExpoStripeProvider from "./app/contexts/stripe-provider";
import { NotificationProvider } from "./app/contexts/notification.context";
import Toast from "react-native-toast-message";
import { toastConfig } from "./app/utils/ToastConfig";
import StackNavigator from "./app/router/StackNavigator";
import "./app/translation/i18n"; // side effect only: triggers i18next init at module load
import { ThemeProvider, useAppTheme } from "./app/contexts/themeContext";
import "react-native-get-random-values";
import { Provider } from "react-redux";
import store from "./app/redux/store";
import * as SplashScreen from "expo-splash-screen";
import { UnreadMessagesProvider } from "./app/contexts/unread-messages.context";
import messaging from "@react-native-firebase/messaging";
import LanguageOnboardingModal, {
  useLanguageOnboarding,
} from "./app/translation/OnBoardingSelection";
import { initializeLanguage } from "./app/utils/cachedTranslations";
import { useDeepLinking } from "./app/job-sharing/useDeepLinking";
import { navigate } from "./app/router/navigationRef";
import { initLiveRates } from "./app/utils/currencyChange";
import { applyGlobalFontScaling } from "./app/utils/fontScaling";
import { markFirstScreenReady } from "./app/utils/launchMetrics";

LogBox.ignoreAllLogs();

// Cap OS-level text scaling app-wide so large accessibility font/display
// settings don't break layouts. Runs once at module load, before first render.
applyGlobalFontScaling();

// Global safety net: log uncaught JS errors instead of letting them stall the
// JS thread, while preserving React Native's default handling.
const _ErrorUtils: any =
  typeof (global as any).ErrorUtils !== "undefined"
    ? (global as any).ErrorUtils
    : undefined;
if (_ErrorUtils?.setGlobalHandler && _ErrorUtils?.getGlobalHandler) {
  const _defaultHandler = _ErrorUtils.getGlobalHandler();
  _ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error("Global error:", isFatal ? "[FATAL]" : "", error?.message || error);
    if (_defaultHandler) _defaultHandler(error, isFatal);
  });
}

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getFCMToken() {
  registerForPushNotificationsAsync()
    .then((token) => {
      if (token) console.log("Push token:", token);
    })
    .catch(() => {});

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const fcmToken = await messaging().getToken();
    console.log("FCM Token:", fcmToken);
    return fcmToken;
  } else {
    console.log("Notification permission not granted");
    return null;
  }
}

function MainApp() {
  const { theme } = useAppTheme();
  const [appReady, setAppReady] = useState(false);
  const { userData, loading: userLoading } = useUser();
  useDeepLinking({
    userData,
    userLoading,
    onJobLink: (jobId) => {
      navigate("OfferDetail", { jobId });
    },
  });

  const splashImage =
    theme.mode === "dark"
      ? require("./assets/Splash-dark.png")
      : require("./assets/splash.png");

  useEffect(() => {
    async function prepare() {
      setAppReady(true);
      await SplashScreen.hideAsync();
      markFirstScreenReady();
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!appReady) return;

    // Deferred until the first real screen is visible -- none of this is
    // needed to render it, so it shouldn't compete with startup for the JS
    // thread. See PERFORMANCE_AUDIT.md, Section 1.
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      initLiveRates().catch(() => {});

      getFCMToken()
        .then((token) => {
          if (token) console.log("FCM token:", token);
        })
        .catch(() => {});

      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
      });
    });

    return () => interactionHandle.cancel();
  }, [appReady]);

  if (!appReady) {
    return (
      <View style={{ flex: 1 }}>
        <Image
          source={splashImage}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return <StackNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    Poppins_400Regular_Italic,
  });
  const { showModal, checked, handleDone } = useLanguageOnboarding();

  useEffect(() => {
    // Foreground push messages must be subscribed as early as possible so
    // none are missed while the app is open -- this only registers a
    // listener (no network/permission work), so it's cheap enough to keep
    // immediate. The actual permission prompt + token fetch + Android
    // channel setup are deferred until after the first screen is visible
    // (see the appReady-gated effect in MainApp above).
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          sound: "default",
        },
        trigger: null,
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const setupLanguage = async () => {
      await initializeLanguage();
    };
    setupLanguage();
  }, []);

  if (!checked || !fontsLoaded) return null;

  return (
    <ThemeProvider>
      <UserProvider>
        <PostProvider>
          <UnreadMessagesProvider>
            <NotificationProvider>
              <ExpoStripeProvider>
                <Provider store={store}>
                  <MainApp />
                  <LanguageOnboardingModal
                    visible={showModal}
                    onDone={handleDone}
                  />
                </Provider>
                <Toast config={toastConfig} />
              </ExpoStripeProvider>
            </NotificationProvider>
          </UnreadMessagesProvider>
        </PostProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
