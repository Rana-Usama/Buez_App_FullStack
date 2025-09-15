import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  return token;
}

export async function scheduleFreeTrialNotification(daysAfter = 10) {
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + daysAfter);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ Free Trial Ending Soon",
      body: "Your free trial ends in 4 days. Upgrade now to keep full access to all features.",
      sound: true,
    },
    trigger: {
      date: triggerDate,
      repeats: false,
      type: "date",
    },
  });
}
