import React, { useState, useEffect, useRef } from "react";
import {
  View,
  LogBox,
  Image,
} from "react-native";
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./app/utils/notificationService";
import { UserProvider } from "./app/contexts/user.context";
import { PostProvider } from "./app/contexts/PostContext";
import ExpoStripeProvider from "./app/contexts/stripe-provider";
import { NotificationProvider } from "./app/contexts/notification.context";
import Toast from "react-native-toast-message";
import { toastConfig } from "./app/utils/ToastConfig";
import StackNavigator from "./app/router/StackNavigator";
import i18n from "./app/translation/i18n";
import { ThemeProvider, useAppTheme } from "./app/contexts/themeContext";
import "react-native-get-random-values";
import { Provider } from "react-redux";
import store from "./app/redux/store";
import * as SplashScreen from "expo-splash-screen";

LogBox.ignoreAllLogs();

// keep splash screen visible until we hide manually
SplashScreen.preventAutoHideAsync();

/* Foreground notification handler */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function MainApp() {
  const { theme } = useAppTheme();
  const [appReady, setAppReady] = useState(false);

  const splashImage =
    theme.mode === "dark"
      ? require("./assets/Splash-dark.png")
      : require("./assets/splash.png");

  useEffect(() => {
    async function prepare() {
      // small delay (optional)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAppReady(true);
      await SplashScreen.hideAsync(); // ✅ hide native splash when ready
    }
    prepare();
  }, []);

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
  });

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    console.log("i18n is initialized:", i18n.isInitialized);
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listener for foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // Listener for user tapping the notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {});

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // wait for fonts before showing anything
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <UserProvider>
        <PostProvider>
          <NotificationProvider>
            <ExpoStripeProvider>
              <Provider store={store}>
                <MainApp />
              </Provider>
              <Toast config={toastConfig} />
            </ExpoStripeProvider>
          </NotificationProvider>
        </PostProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
