import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert, Platform } from "react-native";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./app/utils/notificationService";
// Contexts
import { UserProvider } from "./app/contexts/user.context";
import { PostProvider } from "./app/contexts/PostContext";
import ExpoStripeProvider from "./app/contexts/stripe-provider";
import { NotificationProvider } from "./app/contexts/notification.context";
// Config
import Toast from "react-native-toast-message";
import { toastConfig } from "./app/utils/ToastConfig";
import StackNavigator from "./app/router/StackNavigator";
import i18n from "./app/translation/i18n";
import { ThemeProvider } from "./app/contexts/themeContext";
import "react-native-get-random-values";
import { Provider } from "react-redux";
import store from "./app/redux/store";

LogBox.ignoreAllLogs();

/*Foreground notification handler */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listener for user tapping the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {});

    // Cleanup
    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (!fontsLoaded) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ThemeProvider>
      <UserProvider>
        <PostProvider>
          <NotificationProvider>
            <ExpoStripeProvider>
              <Provider store={store}>
                <StackNavigator />
              </Provider>
              <Toast config={toastConfig} />
            </ExpoStripeProvider>
          </NotificationProvider>
        </PostProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
