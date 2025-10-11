import * as Notifications from "expo-notifications";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";

export async function registerForPushNotificationsAsync() {
  try {
    let granted = false;

    if (Platform.OS === "ios") {
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === "granted";
    } else if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        granted = res === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = true; // Android ≤12 doesn’t need prompt
      }
    }

    if (!granted) {
      Alert.alert("Push notifications not allowed");
      return null;
    }

    // ----- 2️⃣ Ask FCM for authorization (iOS only, but safe to call everywhere) -----
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert("FCM permission not granted");
      return null;
    }

    // ----- 3️⃣ Get the FCM token -----
    const fcmToken = await messaging().getToken();
    console.log("✅ FCM Token:", fcmToken);

    // ----- 4️⃣ Android channel (optional but recommended) -----
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

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
