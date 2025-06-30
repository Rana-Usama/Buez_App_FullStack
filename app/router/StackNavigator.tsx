import { StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import Onboarding from "../screens/Onboarding";
import Login from "../screens/Login";
import Signup from "../screens/Signup";
import ForgotPassword from "../screens/ForgotPassword";
import OTPInput from "../screens/OTPInput";
import SetNewPassword from "../screens/SetNewPassword";
import SuccessScreen from "../screens/SuccessScreen";
import ChangePassword from "../screens/ChangePassword";
import OfferDetail from "../screens/OfferDetail";
import PostRequest from "../screens/PostRequest";
import MyRequests from "../screens/MyRequests";
import Settings from "../screens/Settings";
import TermsAndConditions from "../screens/TermsAndConditions";
import FAQ from "../screens/FAQ";
import PrivacyPolicy from "../screens/PrivacyPolicy";
import Profile from "../screens/Profile";
import EditProfile from "../screens/EditProfile";
import Reviews from "../screens/Reviews";
import Messages from "../screens/Messages";
import Subscription from "../screens/Subscription";
import Chat from "../screens/Chat";
import InitialScreen from "../screens/InitialScreen";
import DeciderScreen from "../screens/DeciderScreen";
import TabNavigator from "./BottomNavigator";
import FreeTrial from "../screens/FreeTrial";
import SubscriptionV2 from "../screens/SubscriptionV2";
import CancelSubscription from "../screens/CancelSubscription";

// Utils
import { getCredentials } from "../services/Auth.service";
import * as SecureStore from "expo-secure-store";
import { useUser } from "../contexts/user.context";
import { differenceInDays } from "date-fns";
import Language from "../screens/Language";
import Notifications from "../screens/Notifications";
import CompletedTasks from "../screens/CompletedTasks";
import AddReview from "../screens/AddReview";

export type RootStackParamList = {
  OnBoarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  SetNewPassword: undefined;
  OTPInput: undefined;
  SuccessScreen: undefined;
  OfferDetail: undefined;
  CitySelection: undefined;
  TabNavigator: undefined;
  InitialScreen: undefined;
  FreeTrial: undefined;
  ProfileDetails: {
    user: any;
    currentUserInterests?: string[];
  };
  SubscriptionV2: undefined;
  EditProfile: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  ChangePassword: undefined;
  Reviews: undefined;
  Subscription: undefined;
  Chat: {
    chatId: string;
    senderId?: string;
    senderName: any;
    receiver: any;
    receiverName: any;
    receiverProfile: any;
    senderProfile: any;
    fcmToken: any;
  };
  Messages: undefined;
  Profile: undefined;
  CancelSubscription: undefined;
  Language: undefined;
  PostRequest: undefined;
  Notifications: undefined;
  CompletedTasks: undefined;
  AddReview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState({ email: null, password: null });
  const [loggedOut, setLoggedOut] = useState<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  const { userData, loading: userLoading } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const creds = await getCredentials();
      const status = await SecureStore.getItemAsync("loggedOut");
      setCredentials(creds);
      setLoggedOut(status);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const { email, password } = credentials;
    const isUserDataReady = userData && typeof userData?.isSubscribed === "boolean" && typeof userData?.isFreeTrial === "boolean";

    if (!isLoading && !userLoading) {
      if (loggedOut === "true") {
        setInitialRoute("Login");
      } else if (email && password && isUserDataReady) {
        const isFreeTrial = userData.isFreeTrial;
        const isSubscribed = userData.isSubscribed;
        const subscriptionStart = userData?.subscriptionStart;
        const subscriptionEnd = userData?.subscriptionEnd;
        const now = new Date();

        let trialDays = null;
        let isTrialValid = false;

        if (isFreeTrial && userData?.freeTrialStartedAt?.seconds) {
          const trialStartDate = new Date(userData.freeTrialStartedAt.seconds * 1000);
          trialDays = differenceInDays(now, trialStartDate);
          isTrialValid = trialDays >= 0 && trialDays <= 14;
        }
        console.log(trialDays);
        const subStartDate = subscriptionStart ? new Date(subscriptionStart) : null;
        const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;

        const isWithinPaidPeriod = subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

        if (isSubscribed || isWithinPaidPeriod) {
          setInitialRoute("TabNavigator");
        } else if (isTrialValid) {
          setInitialRoute("TabNavigator");
        } else if (isFreeTrial && trialDays !== null && (trialDays < 0 || trialDays > 14)) {
          setInitialRoute("Subscription");
        } else {
          setInitialRoute("FreeTrial");
        }
      } else if (!email && !password) {
        setInitialRoute("OnBoarding");
      }
    }
  }, [isLoading, userLoading, userData, credentials, loggedOut]);

  return (
    <NavigationContainer>
      {isLoading || userLoading || !initialRoute ? (
        <DeciderScreen />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          {/* Auth Screens */}
          <Stack.Screen name="OnBoarding" component={Onboarding} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
          <Stack.Screen name="OTPInput" component={OTPInput} />
          <Stack.Screen name="FreeTrial" component={FreeTrial} />
          <Stack.Screen name="SubscriptionV2" component={SubscriptionV2} />

          {/* Main App Screens */}
          <Stack.Screen
            name="TabNavigator"
            children={() => (
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <TabNavigator />
              </KeyboardAvoidingView>
            )}
          />

          <Stack.Screen name="InitialScreen" component={InitialScreen} />
          <Stack.Screen name="SuccessScreen" component={SuccessScreen} />
          <Stack.Screen name="Language" component={Language} />

          <Stack.Screen name="OfferDetail" component={OfferDetail} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="FAQ" component={FAQ} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
          <Stack.Screen name="Reviews" component={Reviews} />
          <Stack.Screen name="Subscription" component={Subscription} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="Messages" component={Messages} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="CancelSubscription" component={CancelSubscription} />
          <Stack.Screen name="PostRequest" component={PostRequest} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="CompletedTasks" component={CompletedTasks} />
          <Stack.Screen name="AddReview" component={AddReview} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default StackNavigator;

const styles = StyleSheet.create({});
