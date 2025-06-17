import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert, Platform } from "react-native";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./app/utils/notificationService";

// Contexts
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { UserProvider } from "./app/contexts/user.context";
import { FIREBASE_AUTH } from "./firebaseConfig";
import { PostProvider } from "./app/contexts/PostContext";
import ExpoStripeProvider from "./app/contexts/stripe-provider";

// Config
import Toast from "react-native-toast-message";
import { toastConfig } from "./app/utils/ToastConfig";
import StackNavigator from "./app/router/StackNavigator";
import i18n from "./app/translation/i18n";

LogBox.ignoreAllLogs();

// Root App
export default function App() {
  useEffect(() => {
    console.log("i18n is initialized:", i18n.isInitialized);
  }, []);

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
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // console.log("user...............", user);

  useEffect(() => {
    // Register for push notifications and get token
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    // Store the listener references
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
      setNotification(notification); // if you want to update state
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("User interacted with notification:", response);
      // You can navigate or do something on notification tap
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <UserProvider>
      <PostProvider>
        <StackNavigator />
        <Toast config={toastConfig} />
      </PostProvider>
    </UserProvider>
  );
}
