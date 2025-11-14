import { useEffect, useState, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { getCredentials } from "../services/Auth.service";
import { differenceInDays } from "date-fns";

export const useInitialRoute = (userData, userLoading) => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);


  useEffect(() => {
    let isMounted = true;

    const decideRoute = async () => {
      if (!isMounted) return;

      try {
        // Wait until userLoading finishes
        if (userLoading) return;

        const creds = await getCredentials();
        const loggedOut = await SecureStore.getItemAsync("loggedOut");
        const { email, password } = creds || {};
        const now = new Date();

        console.log("email", email, "password", password, "userData", !!userData);

        // If user logged out → go to Login
        if (loggedOut === "true") {
          if (isMounted) {
            setInitialRoute("Login");
            setIsLoading(false);
          }
          return;
        }

        // If creds exist but userData not ready → retry up to 10 times (5s)
        if ((email || password) && !userData) {
          if (retryCount.current < 10) {
            retryCount.current++;
            retryRef.current = setTimeout(decideRoute, 500);
            return;
          } else {
            console.log("Retry limit reached → defaulting to OnBoarding");
            setInitialRoute("OnBoarding");
            setIsLoading(false);
            return;
          }
        }

        // No creds & no userData → go to OnBoarding
        if (!userData) {
          if (isMounted) {
            setInitialRoute("OnBoarding");
            setIsLoading(false);
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

        const subStartDate = subscriptionStart ? new Date(subscriptionStart) : null;
        const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;

        const isWithinPaidPeriod =
          subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

        let route = "OnBoarding"; // fallback

        if (isSubscribed && isWithinPaidPeriod) {
          route = "TabNavigator";
        } else if (isFreeTrial && freeTrialStartedAt?.seconds) {
          const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
          const trialDays = differenceInDays(now, trialStart);
          if (trialDays >= 0 && trialDays <= 14) route = "TabNavigator";
          else route = "Subscription";
        } else if (!isSubscribed && !isFreeTrial) {
          route = "FreeTrial";
        }

        if (isMounted) {
          setInitialRoute(route);
          setIsLoading(false);
        }
      } catch (err) {
        console.log("Error in initial route hook:", err);
        if (isMounted) {
          setInitialRoute("OnBoarding");
          setIsLoading(false);
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
