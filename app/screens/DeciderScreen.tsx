import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Text,
  Image,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import DeviceInfo from "react-native-device-info";
import { useAppTheme } from "../contexts/themeContext";
import { useUser } from "../contexts/user.context";
import { getCredentials } from "../services/Auth.service";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { reload } from "firebase/auth";

const PENDING_JOB_KEY = "pendingDeepLinkJobId";
import { deepLinkState } from "../job-sharing/deepLinkState";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { resolveFounderRoute } from "../services/Founder.service";

const isUserDataReady = (userData: any): boolean => {
  return !!(userData && userData.userId);
};

const DeciderScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { userData, loading: userLoading } = useUser();
  const { t } = useTranslation();

  const [deviceId, setDeviceId] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const hasNavigated = useRef(false);

  // Latest values for the safety-timeout effect below, which runs with empty
  // deps and would otherwise only ever see the first render's values.
  const userDataRef = useRef(userData);
  const deviceIdRef = useRef(deviceId);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);
  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  // ─── Animation values ─────────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;

  // ─── Logo + tagline entrance ──────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ─── Progress bar fill (0 → 0.85 over 6s, stays until navigation) ────────
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.85,
      duration: 6000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);

  // ─── Splash messages shown during progress ────────────────────────────────────
  const SPLASH_MESSAGES = [
    t("decider.dc1"),
    t("decider.dc2"),
    t("decider.dc3"),
    t("decider.dc4"),
  ];

  // ─── Cycle splash messages every 1.8s ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((i) => (i + 1) % SPLASH_MESSAGES.length);
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // ─── Complete progress bar before navigating ──────────────────────────────
  const completeAndNavigate = useCallback(
    (routeName: string, params?: object) => {
      if (hasNavigated.current) return;
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        hasNavigated.current = true;
        if (params) {
          navigation.replace(routeName, params);
        } else {
          navigation.replace(routeName);
        }
      });
    },
    [navigation, progressAnim],
  );

  // ─── Device ID ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDeviceId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
    };
    fetchDeviceId();
  }, []);

  // ─── Date Parser ──────────────────────────────────────────────────────────
  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === "string") return new Date(date);
    if (date instanceof Date) return date;
    return null;
  };

  // ─── Access gate ──────────────────────────────────────────────────────────
  // The main app is only reachable with an active paid subscription or active
  // Founder access. Everything else is handed to resolveFounderRoute, which
  // returns FounderIntro (can still claim) or SubscriptionV2 (must pay).
  // Takes its inputs as arguments so the safety timeout can reuse it without
  // capturing stale state.
  const resolveAccessRoute = async (
    data: any,
    device: string | null,
  ): Promise<string> => {
    const now = new Date();
    const subStartDate = parseDate(data?.subscriptionStart);
    const subEndDate = parseDate(data?.subscriptionEnd);
    const isWithinPaidPeriod =
      subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

    if (data?.isSubscribed && isWithinPaidPeriod) return "TabNavigator";

    return await resolveFounderRoute(device, data);
  };

  // ─── Main Navigation Decision ─────────────────────────────────────────────
  const decideAndNavigate = useCallback(async () => {
    if (hasNavigated.current) return;

    try {
      const creds = await getCredentials();
      const { email } = creds || {};
      const isLoggedIn = !!(email || creds?.password);

      const pendingJobId = await SecureStore.getItemAsync(PENDING_JOB_KEY);
      if (pendingJobId || deepLinkState.isHandlingDeepLink) {
        console.log(
          "[Decider] Deep link is being handled — skipping TabNavigator",
        );
        return;
      }

      const loggedOut = await SecureStore.getItemAsync("loggedOut");

      if (loggedOut === "true") {
        completeAndNavigate("Login");
        return;
      }

      if (!isLoggedIn && !userData) {
        completeAndNavigate("OnBoarding");
        return;
      }

      if (!isUserDataReady(userData)) {
        completeAndNavigate("OnBoarding");
        return;
      }

      // ── Email verification ─────────────────────────────────────────────────
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        await reload(currentUser);
        if (!currentUser.emailVerified) {
          completeAndNavigate("EmailVerification", {
            email: currentUser.email,
            deviceId,
          });
          return;
        }
      }

      // ── Active paid subscription, else Founder Phase routing ──────────────
      completeAndNavigate(await resolveAccessRoute(userData, deviceId));
    } catch (error) {
      console.log("[Decider] Error deciding initial route:", error);
      if (!hasNavigated.current) {
        completeAndNavigate("OnBoarding");
      }
    }
  }, [userData, deviceId, navigation, completeAndNavigate]);

  // ─── Trigger decision when dependencies are ready ─────────────────────────
  useEffect(() => {
    if (!deviceId) return;
    if (userLoading) return;
    if (hasNavigated.current) return;

    const run = async () => {
      const creds = await getCredentials();
      const { email } = creds || {};
      const isLoggedIn = !!(email || creds?.password);

      if (isLoggedIn && !isUserDataReady(userData)) {
        console.log("[Decider] Waiting for userData.userId...");
        return;
      }

      decideAndNavigate();
    };

    run();
  }, [userData?.userId, userLoading, deviceId, decideAndNavigate]);

  // ─── Safety timeout fallback ──────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (hasNavigated.current || deepLinkState.isHandlingDeepLink) return;
      console.warn(
        "[Decider] Timeout — checking stored session before deciding",
      );
      try {
        const creds = await getCredentials();
        const loggedOutFlag = await SecureStore.getItemAsync("loggedOut");
        const hasStoredSession =
          !!(creds?.email || creds?.password) && loggedOutFlag !== "true";
        const latestUserData = userDataRef.current;

        // Timing out must never hand out app access — apply the same
        // subscription/Founder gate as the normal path. If userData never
        // loaded we can't evaluate it, so fall back to Login (which re-runs
        // the gate) rather than dropping the user into the app.
        if (isUserDataReady(latestUserData)) {
          completeAndNavigate(
            await resolveAccessRoute(latestUserData, deviceIdRef.current),
          );
        } else if (hasStoredSession || FIREBASE_AUTH.currentUser) {
          completeAndNavigate("Login");
        } else {
          completeAndNavigate("OnBoarding");
        }
      } catch (e) {
        console.log("[Decider] Timeout fallback error:", e);
        completeAndNavigate("OnBoarding");
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  // ─── Progress bar width interpolation ────────────────────────────────────
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* ── Center content ── */}
      <View style={styles.centerContent}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Replace with your own <Image> or SVG logo */}
          <View style={[styles.logoPlaceholder]}>
            <Image
              source={theme.mode === "dark" ? Icons.dark_logo : Icons.logo}
              style={[
                {
                  width:
                    theme.mode === "dark" ? RFPercentage(30) : RFPercentage(20),
                  height:
                    theme.mode === "dark" ? RFPercentage(15) : RFPercentage(15),
                },
              ]}
              resizeMode={theme.mode === "dark" ? "cover" : "contain"}
            />
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              color: theme.heading,
              opacity: taglineOpacity,
            },
          ]}
        >
          {t("decider.tag")}
        </Animated.Text>
      </View>

      {/* ── Bottom section: progress + message ── */}
      <View style={styles.bottomSection}>
        {/* Cycling message */}
        <Animated.Text
          style={[
            styles.statusMessage,
            {
              color: theme.darkGrey,
              opacity: messageOpacity,
            },
          ]}
        >
          {SPLASH_MESSAGES[messageIndex]}
        </Animated.Text>

        {/* Progress bar track */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.primary + "25" },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>

        {/* Footer credit */}
        <Text style={[styles.footerText, { color: theme.heading }]}>
          {t("decider.footer")}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: RFPercentage(10),
    paddingBottom: RFPercentage(6),
    paddingHorizontal: RFPercentage(5),
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrapper: {
    marginBottom: RFPercentage(3),
    alignItems: "center",
  },
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: RFPercentage(14),
    height: RFPercentage(14),
  },
  appName: {
    fontSize: RFPercentage(3.8),
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: RFPercentage(1),
  },
  tagline: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    letterSpacing: 0.3,
    paddingHorizontal: RFPercentage(4),
    bottom: RFPercentage(1),
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: RFPercentage(1.5),
  },
  statusMessage: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(0.5),
  },
  progressTrack: {
    width: "80%",
    height: RFPercentage(0.6),
    borderRadius: RFPercentage(1),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RFPercentage(1),
  },
  footerText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    // marginTop: RFPercentage(1),
  },
});

export default DeciderScreen;
