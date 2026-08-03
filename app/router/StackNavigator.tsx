// navigation/StackNavigator.js
import React, { useEffect, useState } from "react";
import { View, BackHandler } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NetInfo from "@react-native-community/netinfo";
import { RFPercentage } from "react-native-responsive-fontsize";

// Contexts & Hooks
import { useUser } from "../contexts/user.context";
import { useAppTheme } from "../contexts/themeContext";

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
import SubscriptionV2 from "../screens/SubscriptionV2";
import CancelSubscription from "../screens/CancelSubscription";
import Location from "../screens/Location";
import Language from "../screens/Language";
import Notifications from "../screens/Notifications";
import CompletedTasks from "../screens/CompletedTasks";
import AcceptedTasks from "../screens/AcceptedTasks";
import AddReview from "../screens/AddReview";
import InstagramBusinessLoginWebView from "../utils/InstagramLogin";
import FacebookLoginWebView from "../utils/facebookLogin";
import NetworkError from "../screens/NetworkError";
import TopRatedUsers from "../screens/TopRatedUsers";
import TopRatedUserProfile from "../screens/TopRatedUserProfile";
import AddReviewToAccepter from "../screens/AddReviewToAccepter";
import UpgradePlan from "../screens/UpgradePlan";
// Import the Drawer Navigator
import DrawerNavigator from "./BottomNavigator";
import TaskApplicantsScreen from "../screens/TaskApplicantsScreen";
import ConfirmedHelpers from "../screens/ConfirmedHelpers";
import { navigationRef } from "./navigationRef";

import GroupChat from "../screens/GroupChat";
import GroupDetails from "../screens/GroupDetails";
import EmailVerificationScreen from "../screens/EmailVerificationScreen";
import InterestSelectionScreen from "../screens/InterestSelection";
import FounderIntro from "../screens/FounderIntro";

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  const { theme } = useAppTheme();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  // Globally disable the Android hardware/gesture back button. Returning true
  // swallows every hardware back press app-wide so it never pops the stack or
  // exits the app. The iOS swipe-back gesture is disabled via screenOptions
  // (gestureEnabled: false) below.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  // Network error handling
  if (!isConnected) return <NetworkError />;

  // if (isLoading || userLoading || !initialRoute) {
  //   return <InitialScreen />;
  // }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        id={undefined}
        initialRouteName={"Decider"}
        screenOptions={{
          headerShown: false,
          // Disable the iOS edge swipe-back gesture across all screens.
          gestureEnabled: false,
          animation: "slide_from_right",
          // Screens draw under a translucent status bar (each renders its own
          // <StatusBar translucent />). Tell native-stack the same so it does
          // not reserve/offset status-bar space during transitions — that
          // offset is what made the outgoing screen "drop down" before the
          // next screen slid in.
          statusBarTranslucent: true,
          // NOTE: `statusBarColor` was removed here — native-stack v7 reads
          // `statusBarBackgroundColor` instead, so the old key was silently
          // ignored at runtime. Dropping it changes nothing visually.
        }}
      >
        {/* Auth + Onboarding */}
        <Stack.Screen name="Decider" component={DeciderScreen} />

        <Stack.Screen name="OnBoarding" component={Onboarding} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTPInput" component={OTPInput} />
        <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
        <Stack.Screen name="SuccessScreen" component={SuccessScreen} />
        <Stack.Screen
          name="TaskApplicantsScreen"
          component={TaskApplicantsScreen}
        />

        {/* App flow - Use Drawer as main navigator */}
        <Stack.Screen name="MainApp" component={DrawerNavigator} />

        {/* Keep TabNavigator if you still need it standalone */}
        <Stack.Screen name="TabNavigator" component={TabNavigator} />

        {/* Other screens */}
        <Stack.Screen name="Subscription" component={Subscription} />
        <Stack.Screen name="SubscriptionV2" component={SubscriptionV2} />
        <Stack.Screen
          name="CancelSubscription"
          component={CancelSubscription}
        />

        <Stack.Screen name="OfferDetail" component={OfferDetail} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="Reviews" component={Reviews} />
        <Stack.Screen name="Messages" component={Messages} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="GroupChat" component={GroupChat} />

        <Stack.Screen name="PostRequest" component={PostRequest} />
        <Stack.Screen name="Language" component={Language} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="CompletedTasks" component={CompletedTasks} />
        <Stack.Screen name="AcceptedTasks" component={AcceptedTasks} />
        <Stack.Screen name="AddReview" component={AddReview} />
        <Stack.Screen
          name="TermsAndConditions"
          component={TermsAndConditions}
        />
        <Stack.Screen name="FAQ" component={FAQ} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="Location" component={Location} />
        <Stack.Screen
          name="InstagramLoginWebView"
          component={InstagramBusinessLoginWebView}
        />
        <Stack.Screen
          name="FacebookLoginWebView"
          component={FacebookLoginWebView}
        />
        <Stack.Screen name="TopRatedUsers" component={TopRatedUsers} />
        <Stack.Screen
          name="TopRatedUserProfile"
          component={TopRatedUserProfile}
        />
        <Stack.Screen
          name="AddReviewToAccepter"
          component={AddReviewToAccepter}
        />
        <Stack.Screen name="UpgradePlan" component={UpgradePlan} />
        <Stack.Screen name="ConfirmedHelpers" component={ConfirmedHelpers} />

        <Stack.Screen
          name="GroupDetails"
          component={GroupDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
        />
        <Stack.Screen
          name="InterestSelection"
          component={InterestSelectionScreen}
        />
        <Stack.Screen name="FounderIntro" component={FounderIntro} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
