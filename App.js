import React, { useState, useEffect } from "react";
import { Stack } from 'expo-router/stack';
import { View, ActivityIndicator, LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as SecureStore from 'expo-secure-store';

// Screens
import Onboarding from "./app/Onboarding";
import Login from "./app/Login";
import Signup from "./app/Signup";
import ForgotPassword from "./app/ForgotPassword";
import OTPInput from "./app/OTPInput";
import SetNewPassword from "./app/SetNewPassword";
import Home from "./app/(app)/Home";
import SuccessScreen from "./app/(app)/SuccessScreen";
import ChangePassword from "./app/(app)/ChangePassword";
import OfferDetail from "./app/(app)/OfferDetail";
import PostRequest from "./app/(app)/PostRequest";
import MyRequests from "./app/(app)/MyRequests";
import Settings from "./app/(app)/Settings";
import TermsAndConditions from "./app/(app)/TermsAndConditions";
import FAQ from "./app/(app)/FAQ";
import PrivacyPolicy from "./app/(app)/PrivacyPolicy";
import Profile from "./app/(app)/Profile";
import EditProfile from "./app/(app)/EditProfile";
import Reviews from "./app/(app)/Reviews";
import Messages from "./app/(app)/Messages";
import Chat from "./app/(app)/Chat";
import Subscription from "./app/(app)/Subscription";

// auth
// eslint-disable-next-line import/no-unresolved
import { onAuthStateChanged } from 'firebase/auth';
import { UserProvider } from "./contexts/user.context";
import { FIREBASE_AUTH } from "./firebaseConfig";

// config
import Colors from "./config/Colors";

LogBox.ignoreAllLogs();

const AuthStack = () => (
  <Stack screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
    <Stack.Screen name="Onboarding" component={Onboarding} />
    <Stack.Screen name="index" component={Login} />
    <Stack.Screen name="Signup" component={Signup} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen name="OTPInput" component={OTPInput} />
    <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
  </Stack>
);

const AppStack = () => (
  <Stack screenOptions={{ headerShown: false }} initialRouteName="Home">
    <Stack.Screen name="index" component={Home} />
    <Stack.Screen name="SuccessScreen" component={SuccessScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePassword} />
    <Stack.Screen name="OfferDetail" component={OfferDetail} />
    <Stack.Screen name="PostRequest" component={PostRequest} />
    <Stack.Screen name="MyRequests" component={MyRequests} />
    <Stack.Screen name="Settings" component={Settings} />
    <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
    <Stack.Screen name="FAQ" component={FAQ} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfile} />
    <Stack.Screen name="Reviews" component={Reviews} />
    <Stack.Screen name="Messages" component={Messages} />
    <Stack.Screen name="Chat" component={Chat} />
    <Stack.Screen name="Subscription" component={Subscription} />
  </Stack>
)
export default function App() {
  // Font
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded || initializing)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={RFPercentage(6)} color={Colors.primary} />
      </View>
    );

  return (
    <UserProvider>
          {user ? <AppStack /> : <AuthStack /> }
      {/* <NavigationContainer>
      </NavigationContainer> */}
    </UserProvider>
  );
}

// Happy Coding :)
