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



// import messaging from "@react-native-firebase/messaging";
// import { Platform, Alert } from "react-native";

// export async function registerForPushNotificationsAsync() {
//   let token;

//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   if (!enabled) {
//     Alert.alert("Failed to get push token for push notification!");
//     return null;
//   }

//   token = await messaging().getToken();
//   console.log("FCM Token:", token);

//   if (Platform.OS === "android") {
//     await messaging().setAutoInitEnabled(true);
//   }
//   return token;
// }

// import notifee from "@notifee/react-native";

// export async function scheduleFreeTrialNotification(daysAfter = 10) {
//   const triggerDate = new Date();
//   triggerDate.setDate(triggerDate.getDate() + daysAfter);

//   await notifee.displayNotification({
//     title: "⏰ Free Trial Ending Soon",
//     body: "Your free trial ends in 4 days. Upgrade now to keep full access to all features.",
//     android: {
//       channelId: "default", 
//     },
//     ios: {
//       sound: "default",
//     },
//     schedule: {
//       type: "time",
//       timestamp: triggerDate.getTime(),
//     },
//   });
// }
