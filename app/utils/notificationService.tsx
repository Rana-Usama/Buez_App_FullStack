import * as Notifications from "expo-notifications";
import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";

export async function registerForPushNotificationsAsync() {
  try {
    // ----- 1️⃣ Request FCM permission (handles both Expo + Firebase in one call on iOS) -----
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      // User denied — silently return null, never block the caller
      console.log("Push notification permission not granted");
      return null;
    }

    // ----- 2️⃣ Android: explicit permission prompt + notification channel -----
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // ----- 3️⃣ Get the FCM token -----
    const fcmToken = await messaging().getToken();
    console.log("✅ FCM Token:", fcmToken);
    return fcmToken;
  } catch (e) {
    console.error("Error getting FCM token", e);
    return null;
  }
}

// Example local notification
export async function scheduleFreeTrialNotification(daysAfter = 10) {
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + daysAfter);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ Free Trial Ending Soon",
      body: "Your free trial ends in 4 days. Stay subscribed to maintain full access.",
      sound: true,
    },
    trigger: triggerDate,
  });
}
