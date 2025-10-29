import React, { useEffect, useState } from "react";
import { StyleSheet, Image, View, StatusBar, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import { differenceInDays } from "date-fns";
import * as SecureStore from "expo-secure-store";

import { useAppTheme } from "../contexts/themeContext";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { getCredentials } from "../services/Auth.service";

const DeciderScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { userData, loading: userLoading } = useUser();

  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const decideInitialRoute = async () => {
      try {
        // 🕓 Wait for user loading
        if (userLoading) return;

        const creds = await getCredentials();
        const loggedOut = await SecureStore.getItemAsync("loggedOut");
        const { email, password } = creds || {};
        const now = new Date();

        console.log("creds.........", creds);

        // 🔒 Explicitly logged out → Login
        if (loggedOut === "true") {
          console.log("🚀 Decided route: Login");
          setInitialRoute("Login");
          setIsLoading(false);
          return;
        }

        // ⏳ Wait for Firestore if creds exist but no userData yet
        if ((email || password) && !userData) {
          console.log("⏳ Waiting for Firestore userData...");
          // safety fallback
          setTimeout(() => {
            if (!userData && !userLoading) {
              console.log("⏰ Timeout → OnBoarding fallback");
              setInitialRoute("OnBoarding");
              setIsLoading(false);
            }
          }, 2000);
          return;
        }

        // 🚫 No user → OnBoarding
        if (!userData) {
          console.log("🚀 Decided route: OnBoarding (no creds)");
          setInitialRoute("OnBoarding");
          setIsLoading(false);
          return;
        }

        console.log("📍 userData:", userData);

        const {
          isSubscribed,
          isFreeTrial,
          subscriptionStart,
          subscriptionEnd,
          freeTrialStartedAt,
        } = userData;

        // 🎯 Case 1: No sub + no trial → FreeTrial
        if (!isSubscribed && !isFreeTrial) {
          console.log("🚀 Decided route: FreeTrial (new user)");
          setInitialRoute("FreeTrial");
          setIsLoading(false);
          return;
        }

        // 🎯 Case 2: Active subscription
        const subStartDate = subscriptionStart
          ? new Date(subscriptionStart)
          : null;
        const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;
        const isWithinPaidPeriod =
          subStartDate &&
          subEndDate &&
          now >= subStartDate &&
          now <= subEndDate;

        if (isSubscribed && isWithinPaidPeriod && email) {
          console.log("🚀 Decided route: TabNavigator (sub active)");
          setInitialRoute("TabNavigator");
          setIsLoading(false);
          return;
        }

        // 🎯 Case 3: Active free trial (within 14 days)
        let isTrialValid = false;
        if (isFreeTrial && freeTrialStartedAt?.seconds) {
          const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
          const trialDays = differenceInDays(now, trialStart);
          isTrialValid = trialDays >= 0 && trialDays <= 14;
        }

        if (isTrialValid && email) {
          console.log("🚀 Decided route: TabNavigator (trial active)");
          setInitialRoute("TabNavigator");
          setIsLoading(false);
          return;
        }

        // 🎯 Case 4: Trial expired → Subscription
        if (isFreeTrial && !isTrialValid) {
          console.log("🚀 Decided route: Subscription (trial expired)");
          setInitialRoute("Subscription");
          setIsLoading(false);
          return;
        }

        // 💤 Fallback
        console.log("🚀 Decided route: OnBoarding (fallback)");
        setInitialRoute("OnBoarding");
        setIsLoading(false);
      } catch (error) {
        console.log("Error determining initial route:", error);
        setInitialRoute("OnBoarding");
        setIsLoading(false);
      }
    };

    decideInitialRoute();
  }, [userData, userLoading]);

  // 🚀 Navigate once the route is determined
  useEffect(() => {
    if (!isLoading && initialRoute) {
      navigation.reset({
        index: 0,
        routes: [{ name: initialRoute }],
      });
    }
  }, [isLoading, initialRoute]);

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />
      <Image style={styles.img} source={Icons.logo} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    width: RFPercentage(16),
    height: RFPercentage(16),
  },
});

export default DeciderScreen;
