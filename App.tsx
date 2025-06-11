import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, StackNavigationProp } from "@react-navigation/stack";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as SecureStore from "expo-secure-store";

// Screens
import Onboarding from "./app/screens/Onboarding";
import Login from "./app/screens/Login";
import Signup from "./app/screens/Signup";
import ForgotPassword from "./app/screens/ForgotPassword";
import OTPInput from "./app/screens/OTPInput";
import SetNewPassword from "./app/screens/SetNewPassword";
import Home from "./app/screens/Home";
import SuccessScreen from "./app/screens/SuccessScreen";
import ChangePassword from "./app/screens/ChangePassword";
import OfferDetail from "./app/screens/OfferDetail";
import PostRequest from "./app/screens/PostRequest";
import MyRequests from "./app/screens/MyRequests";
import Settings from "./app/screens/Settings";
import TermsAndConditions from "./app/screens/TermsAndConditions";
import FAQ from "./app/screens/FAQ";
import PrivacyPolicy from "./app/screens/PrivacyPolicy";
import Profile from "./app/screens/Profile";
import EditProfile from "./app/screens/EditProfile";
import Reviews from "./app/screens/Reviews";
import Messages from "./app/screens/Messages";
import Subscription from "./app/screens/Subscription";
import Chat from "./app/screens/Chat";
import InitialScreen from "./app/screens/InitialScreen";
import DeciderScreen from "./app/screens/DeciderScreen";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./app/utils/notificationService";

// Contexts
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { UserProvider } from "./app/contexts/user.context";
import { FIREBASE_AUTH } from "./firebaseConfig";
import { PostProvider } from "./app/contexts/PostContext";
import ExpoStripeProvider from "./app/contexts/stripe-provider";

// Config
import Colors from "./app/config/Colors";
import Toast from "react-native-toast-message";
import { toastConfig } from "./app/utils/ToastConfig";
import FreeTrial from "./app/screens/FreeTrial";
import SubscriptionV2 from "./app/screens/SubscriptionV2";

LogBox.ignoreAllLogs();

// Stack Param Lists
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  OTPInput: undefined;
  SetNewPassword: undefined;
  FreeTrial: undefined;
  SubscriptionV2: undefined;
};

export type AppStackParamList = {
  InitialScreen: undefined;
  Home: undefined;
  SuccessScreen: undefined;
  DeciderScreen: undefined;
  ChangePassword: undefined;
  OfferDetail: undefined;
  PostRequest: undefined;
  MyRequests: undefined;
  Settings: undefined;
  TermsAndConditions: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Reviews: undefined;
  Messages: undefined;
  Chat: undefined;
  Subscription: undefined;
  FreeTrial: undefined;
  SubscriptionV2: undefined;
};

// Create Typed Navigators
const AuthStackNavigator = createStackNavigator<AuthStackParamList>();
const AppStackNavigator = createStackNavigator<AppStackParamList>();

// Auth Stack
const AuthStack = () => (
  <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
    <AuthStackNavigator.Screen name="Onboarding" component={Onboarding} />
    <AuthStackNavigator.Screen name="Login" component={Login} />
    <AuthStackNavigator.Screen name="Signup" component={Signup} />
    <AuthStackNavigator.Screen name="ForgotPassword" component={ForgotPassword} />
    <AuthStackNavigator.Screen name="OTPInput" component={OTPInput} />
    <AuthStackNavigator.Screen name="SetNewPassword" component={SetNewPassword} />
    <AuthStackNavigator.Screen name="FreeTrial" component={FreeTrial} />
    <AuthStackNavigator.Screen name="SubscriptionV2" component={SubscriptionV2} />
  </AuthStackNavigator.Navigator>
);

// App Stack
const AppStack = () => (
  <AppStackNavigator.Navigator screenOptions={{ headerShown: false }} initialRouteName="DeciderScreen">
    <AppStackNavigator.Screen name="InitialScreen" component={InitialScreen} />
    <AppStackNavigator.Screen name="Home" component={Home} />
    <AppStackNavigator.Screen name="SuccessScreen" component={SuccessScreen} />
    <AppStackNavigator.Screen name="DeciderScreen" component={DeciderScreen} />
    <AppStackNavigator.Screen name="ChangePassword" component={ChangePassword} />
    <AppStackNavigator.Screen name="OfferDetail" component={OfferDetail} />
    <AppStackNavigator.Screen name="PostRequest" component={PostRequest} />
    <AppStackNavigator.Screen name="MyRequests" component={MyRequests} />
    <AppStackNavigator.Screen name="Settings" component={Settings} />
    <AppStackNavigator.Screen name="TermsAndConditions" component={TermsAndConditions} />
    <AppStackNavigator.Screen name="FAQ" component={FAQ} />
    <AppStackNavigator.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
    <AppStackNavigator.Screen name="Profile" component={Profile} />
    <AppStackNavigator.Screen name="EditProfile" component={EditProfile} />
    <AppStackNavigator.Screen name="Reviews" component={Reviews} />
    <AppStackNavigator.Screen name="Messages" component={Messages} />
    <AppStackNavigator.Screen name="Chat" component={Chat} />
    <AppStackNavigator.Screen name="Subscription" component={Subscription} />
    <AppStackNavigator.Screen name="SubscriptionV2" component={SubscriptionV2} />
    <AppStackNavigator.Screen name="FreeTrial" component={FreeTrial} />
  </AppStackNavigator.Navigator>
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Root App
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

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // console.log('notification...............', notification)
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (!fontsLoaded || initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={RFPercentage(6)} color={Colors.primary} />
      </View>
    );
  }

  return (
    <UserProvider>
      <PostProvider>
        <NavigationContainer>
          {user ? (
            <ExpoStripeProvider>
              <AppStack />
            </ExpoStripeProvider>
          ) : (
            <AuthStack />
          )}
        </NavigationContainer>
        <Toast config={toastConfig} />
      </PostProvider>
    </UserProvider>
  );
}
