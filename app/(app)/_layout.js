import React, { useState, useEffect } from "react";
import { Stack } from 'expo-router/stack';
import { View, ActivityIndicator, LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as SecureStore from 'expo-secure-store';

// Screens
import Home from "./Home";
import SuccessScreen from "./SuccessScreen";
import ChangePassword from "./ChangePassword";
import OfferDetail from "./OfferDetail";
import PostRequest from "./PostRequest";
import MyRequests from "./MyRequests";
import Settings from "./Settings";
import TermsAndConditions from "./TermsAndConditions";
import FAQ from "./FAQ";
import PrivacyPolicy from "./PrivacyPolicy";
import Profile from "./Profile";
import EditProfile from "./EditProfile";
import Reviews from "./Reviews";
import Messages from "./Messages";
import Chat from "./Chat";
import Subscription from "./Subscription";

// auth
// eslint-disable-next-line import/no-unresolved
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from "../../firebaseConfig";

// config
import Colors from "../../config/Colors";
import { Redirect } from "expo-router";
import StripeProvider from "../../contexts/stripe-provider";

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

  if (!fontsLoaded || initializing)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={RFPercentage(6)} color={Colors.primary} />
      </View>
    );
  
  if (!user) {
    return <Redirect href={'/Login'} />
  }

  return (
    <StripeProvider>
      <Stack screenOptions={{headerShown: false}} initialRouteName="Subscription" />
    </StripeProvider>
  )
  
  // return (
  //     <Stack>
	// 			<Stack.Screen name='Home' component={Home} />
	// 			<Stack.Screen name='SuccessScreen' component={SuccessScreen} />
	// 			<Stack.Screen name='ChangePassword' component={ChangePassword} />
	// 			<Stack.Screen name='OfferDetail' component={OfferDetail} />
	// 			<Stack.Screen name='PostRequest' component={PostRequest} />
	// 			<Stack.Screen name='MyRequests' component={MyRequests} />
	// 			<Stack.Screen name='Settings' component={Settings} />
	// 			<Stack.Screen name='TermsAndConditions' component={TermsAndConditions} />
	// 			<Stack.Screen name='FAQ' component={FAQ} />
	// 			<Stack.Screen name='PrivacyPolicy' component={PrivacyPolicy} />
	// 			<Stack.Screen name='Profile' component={Profile} />
	// 			<Stack.Screen name='EditProfile' component={EditProfile} />
	// 			<Stack.Screen name='Reviews' component={Reviews} />
	// 			<Stack.Screen name='Messages' component={Messages} />
	// 			<Stack.Screen name='Chat' component={Chat} />
	// 			<Stack.Screen name='Subscription' component={Subscription} />
	// 		</Stack>
  // );
}

// Happy Coding :)
