import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import DeviceInfo from "react-native-device-info";
import { differenceInDays } from "date-fns";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { reload } from "firebase/auth";
import { getCredentials } from "../services/Auth.service";
import { navigate } from "../router/navigationRef";

type DeepLinkHandler = (jobId: string) => void;

interface UseDeepLinkingOptions {
  onJobLink?: DeepLinkHandler;
  userData: any; 
  userLoading: boolean; 
}

export const useDeepLinking = ({
  onJobLink,
  userData,
  userLoading,
}: UseDeepLinkingOptions) => {
  const db = getFirestore();

  const pendingJobId = useRef<string | null>(null);
  const hasHandled = useRef(false);

  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === "string") return new Date(date);
    return null;
  };

  const hasDeviceAvailedFreeTrial = async (
    deviceId: string,
  ): Promise<boolean> => {
    try {
      const q = query(
        collection(db, "freeTrials"),
        where("deviceId", "==", deviceId),
        where("freeTrial", "==", true),
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.log("Error fetching freeTrials:", error);
      return false;
    }
  };

  const resolveAndNavigate = async (jobId: string) => {
    try {
      const creds = await getCredentials();
      const loggedOut = await SecureStore.getItemAsync("loggedOut");
      const deviceId = await DeviceInfo.getUniqueId();
      const now = new Date();

      //  Logged out → Login
      if (loggedOut === "true") {
        navigate("Login", { pendingJobId: jobId });
        return;
      }

      // No userData → OnBoarding
      if (!userData) {
        console.log(" [DeepLink] → OnBoarding (no userData)");
        navigate("OnBoarding");
        return;
      }

      // Email not verified
      const currentUser = FIREBASE_AUTH.currentUser;
     

      if (currentUser) {
        await reload(currentUser);
        if (!currentUser.emailVerified) {
          console.log("[DeepLink] → EmailVerification");
          navigate("EmailVerification", {
            email: currentUser.email,
            deviceId,
            pendingJobId: jobId,
          });
          return;
        }
      }

      const {
        isSubscribed,
        subscriptionStart,
        subscriptionEnd,
        isFreeTrial,
        freeTrialStartedAt,
      } = userData;

      const subStartDate = parseDate(subscriptionStart);
      const subEndDate = parseDate(subscriptionEnd);
      const isWithinPaidPeriod =
        subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;


      //  Active paid subscription → open job
      if (isSubscribed && isWithinPaidPeriod) {
        onJobLink?.(jobId);
        return;
      }

      const deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);
      // New user, no trial used → FreeTrial
      if (!isSubscribed && !isFreeTrial && !deviceUsedTrial) {
        navigate("FreeTrial", { pendingJobId: jobId });
        return;
      }

      // Active free trial
      let isTrialValid = false;
      if (isFreeTrial && freeTrialStartedAt?.seconds) {
        const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
        const trialDays = differenceInDays(now, trialStart);
        console.log("DeepLink] trialDays:", trialDays);
        isTrialValid = trialDays >= 0 && trialDays <= 14;
      }


      if (isTrialValid) {
        console.log("[DeepLink] → OfferDetail (active trial)");
        onJobLink?.(jobId);
        return;
      }

      // No subscription → Subscription screen
      if (!isSubscribed) {
        console.log("[DeepLink] → Subscription (expired/no sub)");
        navigate("Subscription", { pendingJobId: jobId });
        return;
      }

      // Fallback
      navigate("OnBoarding");
    } catch (error) {
      console.error(" [DeepLink] Error:", error);
      navigate("OnBoarding");
    }
  };
  // ─── Parse URL and extract jobId ─────────────────────────────────────────

 // In useDeepLinking.ts — update handleDeepLink

const handleDeepLink = (url: string) => {
  console.log("Deep link received:", url);

  const customSchemeMatch = url.match(/buez:\/\/job\/([a-zA-Z0-9]+)/);
  const universalLinkMatch = url.match(/https?:\/\/.*\/job\/([a-zA-Z0-9]+)/);
  
  // ✅ NEW: matches buez://job/FIocimfM  (short code after /job/)
  const shortCodeMatch = url.match(/buez:\/\/job\/([a-zA-Z0-9]+)/);

  const jobId =
    customSchemeMatch?.[1] ||
    universalLinkMatch?.[1] ||
    shortCodeMatch?.[1];

  if (!jobId) {
    console.log("Invalid deep link format:", url);
    return;
  }

  console.log("✅ jobId extracted:", jobId); // should print FIocimfM

  if (userLoading) {
    pendingJobId.current = jobId;
    hasHandled.current = false;
    return;
  }

  resolveAndNavigate(jobId);
};

  // ─── Flush pending jobId once userData / userLoading settles ─────────────

  useEffect(() => {
    if (userLoading) return; 
    if (!pendingJobId.current) return; 
    if (hasHandled.current) return; 

    hasHandled.current = true;
    const jobId = pendingJobId.current;
    pendingJobId.current = null;
    resolveAndNavigate(jobId);
  }, [userData, userLoading]);

  // ─── Register Linking listeners ───────────────────────────────────────────
  useEffect(() => {
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) handleDeepLink(initialUrl);
      } catch (error) {
        console.log("Error getting initial URL:", error);
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => subscription.remove();
  }, []);

  return { handleDeepLink };
};
