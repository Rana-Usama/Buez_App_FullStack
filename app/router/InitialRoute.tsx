import { useEffect, useState, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { getCredentials } from "../services/Auth.service";
import { differenceInDays } from "date-fns";

export const useInitialRoute = (userData, userLoading) => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const hasDecided = useRef(false);

  const parseFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === "string") return new Date(timestamp);
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const decideRoute = async () => {
      if (!isMounted) return;

      // If already decided, don't re-run
      if (hasDecided.current) return;

      try {
        if (userLoading) return;

        const creds = await getCredentials();
        const loggedOut = await SecureStore.getItemAsync("loggedOut");
        const { email, password } = creds || {};
        const now = new Date();

        console.log("🔄 useInitialRoute - Starting decision");
        console.log("📧 Email:", email);
        console.log("👤 User data exists:", !!userData);
        
        if (userData) {
          console.log("📊 User data for decision:", {
            isSubscribed: userData.isSubscribed,
            isFreeTrial: userData.isFreeTrial,
            subscriptionStart: userData.subscriptionStart,
            subscriptionEnd: userData.subscriptionEnd,
          });
        }

        // If user logged out → go to Login
        if (loggedOut === "true") {
          console.log("🚪 User logged out, going to Login");
          if (isMounted) {
            setInitialRoute("Login");
            setIsLoading(false);
            hasDecided.current = true;
          }
          return;
        }

        // If creds exist but userData not ready → retry
        if ((email || password) && !userData) {
          if (retryCount.current < 10) {
            retryCount.current++;
            console.log(`⏳ Retrying... (${retryCount.current}/10)`);
            retryRef.current = setTimeout(decideRoute, 500);
            return;
          } else {
            console.log("⏰ Retry limit reached → defaulting to OnBoarding");
            setInitialRoute("OnBoarding");
            setIsLoading(false);
            hasDecided.current = true;
            return;
          }
        }

        // No creds & no userData → go to OnBoarding
        if (!userData) {
          console.log("👤 No user data, going to OnBoarding");
          if (isMounted) {
            setInitialRoute("OnBoarding");
            setIsLoading(false);
            hasDecided.current = true;
          }
          return;
        }

        // Subscription logic
        const {
          isSubscribed,
          isFreeTrial,
          subscriptionStart,
          subscriptionEnd,
          freeTrialStartedAt,
        } = userData;

        // Handle null/undefined isFreeTrial
        const isFreeTrialBool = Boolean(isFreeTrial); // Convert null to false
        
        const subStartDate = parseFirestoreTimestamp(subscriptionStart);
        const subEndDate = parseFirestoreTimestamp(subscriptionEnd);

        console.log("📅 Date Analysis:");
        console.log("Parsed subscription start:", subStartDate);
        console.log("Parsed subscription end:", subEndDate);
        console.log("Current date:", now);
        
        const isWithinPaidPeriod =
          subStartDate &&
          subEndDate &&
          now >= subStartDate &&
          now <= subEndDate;

        console.log("✅ Is within paid period:", isWithinPaidPeriod);

        let route = "OnBoarding";

        // 1. Active paid subscription
        if (isSubscribed && isWithinPaidPeriod) {
          console.log("🎯 Route: TabNavigator (active subscription)");
          route = "TabNavigator";
        }
        // 2. Active free trial
        else if (isFreeTrialBool && freeTrialStartedAt?.seconds) {
          const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
          const trialDays = differenceInDays(now, trialStart);
          console.log("📅 Trial days:", trialDays);
          
          if (trialDays >= 0 && trialDays <= 14) {
            console.log("🎯 Route: TabNavigator (active trial)");
            route = "TabNavigator";
          } else {
            console.log("🎯 Route: Subscription (trial expired)");
            route = "Subscription";
          }
        }
        // 3. No subscription and no trial (handle null as false)
        else if (!isSubscribed && !isFreeTrialBool) {
          console.log("🎯 Route: FreeTrial (new user)");
          route = "FreeTrial";
        }
        // 4. Subscribed but not within paid period
        else if (isSubscribed && !isWithinPaidPeriod) {
          console.log("🎯 Route: Subscription (subscription expired)");
          route = "Subscription";
        }
        // 5. Default fallback
        else {
          console.log("🎯 Route: OnBoarding (fallback)");
          route = "OnBoarding";
        }

        console.log("🏁 Final route decision:", route);
        
        if (isMounted) {
          setInitialRoute(route);
          setIsLoading(false);
          hasDecided.current = true;
        }
      } catch (err) {
        console.log("❌ Error in initial route hook:", err);
        if (isMounted) {
          setInitialRoute("OnBoarding");
          setIsLoading(false);
          hasDecided.current = true;
        }
      }
    };

    decideRoute();

    return () => {
      isMounted = false;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [userData, userLoading]);

  return { initialRoute, isLoading };
};