import React, { useState, useEffect, useRef } from "react";
import { View, LogBox, Image, Platform } from "react-native";
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
import { UnreadMessagesProvider } from "./app/contexts/unread-messages.context";
// import messaging from "@react-native-firebase/messaging";

LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// async function getFCMToken() {
//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   if (enabled) {
//     const fcmToken = await messaging().getToken();
//     console.log("FCM Token:", fcmToken);
//     return fcmToken;
//   } else {
//     console.log("Notification permission not granted");
//     return null;
//   }
// }

function MainApp() {
  const { theme } = useAppTheme();
  const [appReady, setAppReady] = useState(false);

  const splashImage =
    theme.mode === "dark"
      ? require("./assets/Splash-dark.png")
      : require("./assets/splash.png");

  useEffect(() => {
    async function prepare() {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAppReady(true);
      await SplashScreen.hideAsync();
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

  // useEffect(() => {
  //   getFCMToken().then((token) => {
  //     if (token) {
  //       console.log("FCM token received:", token);
  //     }
  //   });
  //   const unsubscribe = messaging().onMessage(async (remoteMessage) => {
  //     console.log("FCM Foreground message received:", remoteMessage);
  //   });
  //   return unsubscribe;
  // }, []);

  useEffect(() => {
    console.log(i18n.isInitialized);
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("Expo push token received:", token);
        setExpoPushToken(token);
      } else {
        console.log("Failed to get push token");
      }
    });

    // Listener for foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Foreground notification received:", notification);
        setNotification(notification);
      });

    // Listener for user tapping the notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
      });

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <PostProvider>
          <UnreadMessagesProvider>
            <NotificationProvider>
              <ExpoStripeProvider>
                <Provider store={store}>
                  <MainApp />
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

// import React, { useState, useEffect, useRef } from "react";
// import { View, LogBox, Image, Platform, Alert } from "react-native";
// import {
//   Poppins_300Light,
//   Poppins_400Regular,
//   Poppins_500Medium,
//   Poppins_600SemiBold,
//   Poppins_700Bold,
//   Poppins_800ExtraBold,
//   Poppins_900Black,
//   useFonts,
// } from "@expo-google-fonts/poppins";
// import { UserProvider } from "./app/contexts/user.context";
// import { PostProvider } from "./app/contexts/PostContext";
// import ExpoStripeProvider from "./app/contexts/stripe-provider";
// import { NotificationProvider } from "./app/contexts/notification.context";
// import Toast from "react-native-toast-message";
// import { toastConfig } from "./app/utils/ToastConfig";
// import StackNavigator from "./app/router/StackNavigator";
// import i18n from "./app/translation/i18n";
// import { ThemeProvider, useAppTheme } from "./app/contexts/themeContext";
// import "react-native-get-random-values";
// import { Provider } from "react-redux";
// import store from "./app/redux/store";
// import * as SplashScreen from "expo-splash-screen";
// import { UnreadMessagesProvider } from "./app/contexts/unread-messages.context";
// import messaging from "@react-native-firebase/messaging";
// import notifee, { AndroidImportance } from "@notifee/react-native";

// LogBox.ignoreAllLogs();
// SplashScreen.preventAutoHideAsync();

// // Create Android default channel
// async function createDefaultChannel() {
//   if (Platform.OS === "android") {
//     await notifee.createChannel({
//       id: "default",
//       name: "Default",
//       importance: AndroidImportance.HIGH,
//       vibration: true,
//     });
//   }
// }

// // Request FCM permission and get token
// async function getFCMToken() {
//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   if (!enabled) {
//     Alert.alert("Notification permission not granted");
//     return null;
//   }

//   const token = await messaging().getToken();
//   console.log("FCM Token:", token);
//   return token;
// }

// // Handle foreground notification display
// async function displayNotification(remoteMessage) {
//   const { notification } = remoteMessage;
//   if (!notification) return;

//   await notifee.displayNotification({
//     title: notification.title,
//     body: notification.body,
//     android: {
//       channelId: "default",
//     },
//     ios: {
//       sound: "default",
//     },
//   });
// }

// function MainApp() {
//   const { theme } = useAppTheme();
//   const [appReady, setAppReady] = useState(false);

//   const splashImage =
//     theme.mode === "dark"
//       ? require("./assets/Splash-dark.png")
//       : require("./assets/splash.png");

//   useEffect(() => {
//     async function prepare() {
//       await createDefaultChannel();
//       await new Promise((resolve) => setTimeout(resolve, 500));
//       setAppReady(true);
//       await SplashScreen.hideAsync();
//     }
//     prepare();
//   }, []);

//   if (!appReady) {
//     return (
//       <View style={{ flex: 1 }}>
//         <Image
//           source={splashImage}
//           style={{ width: "100%", height: "100%" }}
//           resizeMode="cover"
//         />
//       </View>
//     );
//   }

//   return <StackNavigator />;
// }

// export default function App() {
//   const [fontsLoaded] = useFonts({
//     Poppins_300Light,
//     Poppins_400Regular,
//     Poppins_500Medium,
//     Poppins_600SemiBold,
//     Poppins_700Bold,
//     Poppins_800ExtraBold,
//     Poppins_900Black,
//   });

//   useEffect(() => {
//     // Get FCM token
//     getFCMToken();

//     // Foreground listener
//     const unsubscribeForeground = messaging().onMessage(
//       async (remoteMessage) => {
//         console.log("FCM Foreground message received:", remoteMessage);
//         await displayNotification(remoteMessage);
//       }
//     );

//     // Background & quit state handling
//     messaging().onNotificationOpenedApp((remoteMessage) => {
//       console.log(
//         "Notification caused app to open from background:",
//         remoteMessage
//       );
//     });

//     messaging()
//       .getInitialNotification()
//       .then((remoteMessage) => {
//         if (remoteMessage) {
//           console.log(
//             "Notification caused app to open from quit state:",
//             remoteMessage
//           );
//         }
//       });

//     return () => unsubscribeForeground();
//   }, []);

//   if (!fontsLoaded) return null;

//   return (
//     <ThemeProvider>
//       <UserProvider>
//         <PostProvider>
//           <UnreadMessagesProvider>
//             <NotificationProvider>
//               <ExpoStripeProvider>
//                 <Provider store={store}>
//                   <MainApp />
//                 </Provider>
//                 <Toast config={toastConfig} />
//               </ExpoStripeProvider>
//             </NotificationProvider>
//           </UnreadMessagesProvider>
//         </PostProvider>
//       </UserProvider>
//     </ThemeProvider>
//   );
// }
