import React from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins";
import { RFPercentage } from "react-native-responsive-fontsize";

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

const Stack = createStackNavigator();

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

  if (!fontsLoaded)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={RFPercentage(6)} color={Colors.primary} />
      </View>
    );
// test
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTPInput" component={OTPInput} />
        <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
        <Stack.Screen name="Home" component={Home} />
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
        <Stack.Screen name="Subscription" component={Subscription} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Happy Coding :)
