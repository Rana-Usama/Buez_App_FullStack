import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getCredentials } from "../services/Auth.service";
import { differenceInDays } from "date-fns";

export const useInitialRoute = (userData, userLoading) => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialRoute = async () => {
      try {
        // wait for user loading
        if (userLoading) return;

        const creds = await getCredentials();
        const loggedOut = await SecureStore.getItemAsync("loggedOut");
        const { email, password } = creds || {};
        const now = new Date();

        // 🔒 If explicitly logged out → go to Login
        if (loggedOut === "true") {
          console.log("🚀 Decided route: Login");
          setInitialRoute("Login");
          setIsLoading(false);
          return;
        }

        // ⏳ Wait for userData if creds exist but userData not yet loaded
        if ((email || password) && !userData) {
          console.log("⏳ Waiting for Firestore userData...");
          return;
        }

        // 🚫 No user at all → OnBoarding
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
          subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

        if (isSubscribed && isWithinPaidPeriod) {
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

        if (isTrialValid) {
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
        console.error("Error determining initial route:", error);
        setInitialRoute("OnBoarding");
        setIsLoading(false);
      }
    };

    loadInitialRoute();
  }, [userData, userLoading]);

  return { initialRoute, isLoading };
};
