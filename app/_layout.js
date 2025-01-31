import React, { useState, useEffect } from "react";
import { Stack } from 'expo-router/stack';
import { View, ActivityIndicator, LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as SecureStore from 'expo-secure-store';

// Screens
import Onboarding from "./Onboarding";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import OTPInput from "./OTPInput";
import SetNewPassword from "./SetNewPassword";

// auth
// eslint-disable-next-line import/no-unresolved
import { onAuthStateChanged } from 'firebase/auth';
import { UserProvider } from "../contexts/user.context";
import { FIREBASE_AUTH } from "../firebaseConfig";

// config
import Colors from "../config/Colors";
import { Redirect, router, Slot } from "expo-router";

LogBox.ignoreAllLogs();

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

  // if (!fontsLoaded || initializing) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <ActivityIndicator size={RFPercentage(6)} color={Colors.primary} />
  //     </View>
  //   );
  // }

  if (!user && !initializing && fontsLoaded) {
    router.replace('/Login')
  }

  if (user) {
    router.replace('/Subscription')
  }

  return (
		<UserProvider>
      {/* <Stack>
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTPInput" component={OTPInput} />
        <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
      </Stack> */}
      <Slot />
		</UserProvider>
  );
}

// Happy Coding :)
