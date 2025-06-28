import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert, Platform } from "react-native";
import { 
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts
} from "@expo-google-fonts/poppins";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { registerForPushNotificationsAsync } from "./app/utils/notificationService";

// Contexts
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { UserProvider } from "./app/contexts/user.context";
import { FIREBASE_AUTH } from "./firebaseConfig";
import { PostProvider } from "./app/contexts/PostContext";
import ExpoStripeProvider from "./app/contexts/stripe-provider";
import { NotificationProvider } from "./app/contexts/notification.context";

// Config
import Toast from "react-native-toast-message";
import { toastConfig } from "./app/utils/ToastConfig";
import StackNavigator from "./app/router/StackNavigator";
import i18n from "./app/translation/i18n";

LogBox.ignoreAllLogs();

/*Foreground notification handler */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,     //Show notification banner in foreground
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
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // console.log("Expo Push Token:", token);
      }
    });

    // Listener for foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // console.log("Foreground notification received:", notification);
      setNotification(notification);
    });

    // Listener for user tapping the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // console.log("Notification tapped:", response);
    });

    // Cleanup
    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (!fontsLoaded) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <UserProvider>
      <PostProvider>
        <NotificationProvider>
          <ExpoStripeProvider>
            <StackNavigator />
            <Toast config={toastConfig} />
          </ExpoStripeProvider>
        </NotificationProvider>
      </PostProvider>
    </UserProvider>
  );
}
