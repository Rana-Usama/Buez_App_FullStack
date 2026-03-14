import { useEffect, useRef, useCallback } from "react";
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
import { navigate } from "../router/navigationRef";

// ─── Must match the key used in DeciderScreen.tsx ────────────────────────────
const PENDING_JOB_KEY = "pendingDeepLinkJobId";

type DeepLinkHandler = (jobId: string) => void;

interface UseDeepLinkingOptions {
  onJobLink?: DeepLinkHandler;
  userData: any;
  userLoading: boolean;
}

const isUserDataReady = (userData: any): boolean => {
  return !!(userData && userData.userId);
};

export const useDeepLinking = ({
  onJobLink,
  userData,
  userLoading,
}: UseDeepLinkingOptions) => {
  const db = getFirestore();

  const pendingJobId = useRef<string | null>(null);
  const hasHandled = useRef(false);

  // ─── Mirror props into refs so callbacks never go stale ──────────────────
  const userDataRef = useRef(userData);
  const userLoadingRef = useRef(userLoading);
  const onJobLinkRef = useRef(onJobLink);

  useEffect(() => { userDataRef.current = userData; }, [userData]);
  useEffect(() => { userLoadingRef.current = userLoading; }, [userLoading]);
  useEffect(() => { onJobLinkRef.current = onJobLink; }, [onJobLink]);

  // ─── Parse Firestore Timestamp OR ISO string OR Date → Date ──────────────
  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === "string") return new Date(date);
    if (date instanceof Date) return date;
    return null;
  };

  // ─── Check if this device has already used a free trial ──────────────────
  const hasDeviceAvailedFreeTrial = async (
    deviceId: string
  ): Promise<boolean> => {
    try {
      const q = query(
        collection(db, "freeTrials"),
        where("deviceId", "==", deviceId),
        where("freeTrial", "==", true)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.log("[DeepLink] Error fetching freeTrials:", error);
      return false;
    }
  };

  // ─── Core navigation resolver ─────────────────────────────────────────────
  const resolveAndNavigate = useCallback(async (jobId: string) => {
    try {
      const currentUserData = userDataRef.current;
      const currentUserLoading = userLoadingRef.current;

      console.log("[DeepLink] resolveAndNavigate — jobId:", jobId);
      console.log("[DeepLink] userLoading (ref):", currentUserLoading);
      console.log("[DeepLink] userData ready:", isUserDataReady(currentUserData));
      console.log("[DeepLink] userData snapshot:", JSON.stringify({
        userId: currentUserData?.userId,
        isSubscribed: currentUserData?.isSubscribed,
        isFreeTrial: currentUserData?.isFreeTrial,
        freeTrialStartedAt: currentUserData?.freeTrialStartedAt,
        subscriptionStart: currentUserData?.subscriptionStart,
        subscriptionEnd: currentUserData?.subscriptionEnd,
      }));

      // ── Still loading OR userData is empty {} → persist and wait
      if (currentUserLoading || !isUserDataReady(currentUserData)) {
        console.log(
          "[DeepLink] Not ready yet (loading or empty userData) — persisting jobId:",
          jobId
        );
        pendingJobId.current = jobId;
        hasHandled.current = false;
        await SecureStore.setItemAsync(PENDING_JOB_KEY, jobId);
        return;
      }

      // ── Auth is ready — clear the persisted jobId so it doesn't replay
      await SecureStore.deleteItemAsync(PENDING_JOB_KEY);

      const loggedOut = await SecureStore.getItemAsync("loggedOut");
      const deviceId = await DeviceInfo.getUniqueId();
      const now = new Date();

      // ── Logged out → Login
      if (loggedOut === "true") {
        console.log("[DeepLink] → Login (logged out)");
        navigate("Login", { pendingJobId: jobId });
        return;
      }

      // ── No real userData (unauthenticated) → OnBoarding
      if (!currentUserData) {
        console.log("[DeepLink] → OnBoarding (no userData)");
        navigate("OnBoarding");
        return;
      }

      // ── Email verification check
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
      } = currentUserData;

      const subStartDate = parseDate(subscriptionStart);
      const subEndDate = parseDate(subscriptionEnd);
      const isWithinPaidPeriod =
        subStartDate &&
        subEndDate &&
        now >= subStartDate &&
        now <= subEndDate;

      // ── Active paid subscription → open job
      if (isSubscribed && isWithinPaidPeriod) {
        console.log("[DeepLink] → onJobLink (active paid subscription)");
        onJobLinkRef.current?.(jobId);
        return;
      }

      const deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);

      // ── New user, no trial on this device → FreeTrial screen
      if (!isSubscribed && !isFreeTrial && !deviceUsedTrial) {
        console.log("[DeepLink] → FreeTrial (no trial used)");
        navigate("FreeTrial", { pendingJobId: jobId });
        return;
      }

      // ── Compute trial validity (safe for Timestamp + ISO string)
      let isTrialValid = false;
      if (isFreeTrial && freeTrialStartedAt) {
        const trialStart = parseDate(freeTrialStartedAt);
        if (trialStart) {
          const trialDays = differenceInDays(now, trialStart);
          console.log(
            "[DeepLink] trialDays:", trialDays,
            "| trialStart:", trialStart.toISOString()
          );
          isTrialValid = trialDays >= 0 && trialDays <= 14;
        } else {
          console.warn(
            "[DeepLink] Could not parse freeTrialStartedAt:",
            freeTrialStartedAt
          );
        }
      } else {
        console.log(
          "[DeepLink] Trial check skipped — isFreeTrial:", isFreeTrial,
          "| freeTrialStartedAt:", freeTrialStartedAt
        );
      }

      // ── Active free trial → open job
      if (isTrialValid) {
        console.log("[DeepLink] → onJobLink (active free trial)");
        onJobLinkRef.current?.(jobId);
        return;
      }

      // ── Trial expired
      if (isFreeTrial && !isTrialValid) {
        console.log("[DeepLink] → Subscription (trial expired)");
        navigate("Subscription", { pendingJobId: jobId });
        return;
      }

      // ── Device used trial before, not subscribed
      if (!isSubscribed && deviceUsedTrial) {
        console.log("[DeepLink] → Subscription (device trial used, not subscribed)");
        navigate("Subscription", { pendingJobId: jobId });
        return;
      }

      // ── No subscription catch-all
      if (!isSubscribed) {
        console.log("[DeepLink] → Subscription (no subscription)");
        navigate("Subscription", { pendingJobId: jobId });
        return;
      }

      // ── Fallback
      console.log("[DeepLink] → OnBoarding (fallback)");
      navigate("OnBoarding");
    } catch (error) {
      console.error("[DeepLink] Error in resolveAndNavigate:", error);
      navigate("OnBoarding");
    }
  }, []); // empty deps — reads live values via refs

  // ─── Parse URL and extract jobId ──────────────────────────────────────────
  const handleDeepLink = useCallback((url: string) => {
    console.log("[DeepLink] Deep link received:", url);

    const jobIdMatch = url.match(
      /(?:buez:\/\/job\/|https?:\/\/[^/]+\/job\/)([a-zA-Z0-9]+)/
    );
    const jobId = jobIdMatch?.[1];

    if (!jobId) {
      console.log("[DeepLink] Invalid deep link format:", url);
      return;
    }

    console.log("[DeepLink] jobId extracted:", jobId);
    resolveAndNavigate(jobId);
  }, [resolveAndNavigate]);

  useEffect(() => {
    if (userLoading) return;

    if (!isUserDataReady(userData)) return;

    const flushPendingJobId = async () => {
      try {
        const storedJobId = await SecureStore.getItemAsync(PENDING_JOB_KEY);
        if (storedJobId) {
          console.log(
            "[DeepLink] Flushing persisted jobId (SecureStore):",
            storedJobId
          );
          await SecureStore.deleteItemAsync(PENDING_JOB_KEY);
          pendingJobId.current = null;
          hasHandled.current = true;
          resolveAndNavigate(storedJobId);
          return;
        }

        // Fallback: check in-memory ref (background / foreground resume)
        if (pendingJobId.current && !hasHandled.current) {
          console.log(
            "[DeepLink] Flushing in-memory pendingJobId:",
            pendingJobId.current
          );
          hasHandled.current = true;
          const jobId = pendingJobId.current;
          pendingJobId.current = null;
          resolveAndNavigate(jobId);
        }
      } catch (error) {
        console.error("[DeepLink] Error flushing pending jobId:", error);
      }
    };

    flushPendingJobId();
  }, [userData, userLoading, resolveAndNavigate]);

  // ─── Register Linking listeners once ─────────────────────────────────────
  useEffect(() => {
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log("[DeepLink] Initial URL (cold start):", initialUrl);
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.log("[DeepLink] Error getting initial URL:", error);
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => subscription.remove();
  }, [handleDeepLink]);

  return { handleDeepLink };
};
