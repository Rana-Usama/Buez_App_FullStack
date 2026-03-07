import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import { differenceInDays } from "date-fns";
import * as SecureStore from "expo-secure-store";
import DeviceInfo from "react-native-device-info";
import { useAppTheme } from "../contexts/themeContext";
import { useUser } from "../contexts/user.context";
import { getCredentials } from "../services/Auth.service";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { reload } from "firebase/auth";

const DeciderScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { userData, loading: userLoading } = useUser();

  const [deviceId, setDeviceId] = useState("");
  const hasNavigated = useRef(false); // Prevent multiple navigations

  // Animated values
  const outerSpinValue = useRef(new Animated.Value(0)).current;
  const innerSpinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  const db = getFirestore();

  // Spinning animation
  useEffect(() => {
    const outerSpinAnimation = Animated.loop(
      Animated.timing(outerSpinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const innerSpinAnimation = Animated.loop(
      Animated.timing(innerSpinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    );

    const dotAnimation = Animated.loop(
      Animated.stagger(300, [
        Animated.sequence([
          Animated.timing(dotOpacity1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity1, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotOpacity2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity2, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotOpacity3, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity3, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    outerSpinAnimation.start();
    innerSpinAnimation.start();
    scaleAnimation.start();
    dotAnimation.start();

    return () => {
      outerSpinAnimation.stop();
      innerSpinAnimation.stop();
      scaleAnimation.stop();
      dotAnimation.stop();
    };
  }, []);

  // Interpolate spin values
  const outerSpin = outerSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const innerSpin = innerSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const scale = scaleValue.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0.8, 1],
  });

  // Fetch device unique ID
  useEffect(() => {
    const fetchDeviceId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
      console.log("Device ID:", id);
    };
    fetchDeviceId();
  }, []);

  // Check if device has already availed free trial
  const hasDeviceAvailedFreeTrial = async (deviceId: string) => {
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

  // Main decision logic with immediate navigation
  useEffect(() => {
    if (!deviceId || hasNavigated.current) return;

    const decideAndNavigate = async () => {
      try {
        // Wait for user loading to complete
        if (userLoading) return;

        const creds = await getCredentials();
        const loggedOut = await SecureStore.getItemAsync("loggedOut");
        const { email } = creds || {};
        const now = new Date();

        console.log("creds-----------------", creds);

        // Logged out → Login
        if (loggedOut === "true") {
          hasNavigated.current = true;
          navigation.replace("Login");
          return;
        }

        if ((email || creds?.password) && !userData) {
          const timeout = setTimeout(() => {
            if (!userData && !userLoading && !hasNavigated.current) {
              hasNavigated.current = true;
              navigation.replace("OnBoarding");
            }
          }, 3000); 

          return () => clearTimeout(timeout);
        }

        // No user → OnBoarding
        if (!userData) {
          hasNavigated.current = true;
          navigation.replace("OnBoarding");
          return;
        }

        const currentUser = FIREBASE_AUTH.currentUser;
        if (currentUser) {
          await reload(currentUser); 
          if (!currentUser.emailVerified) {
            hasNavigated.current = true;
            navigation.replace("EmailVerification", {
              email: currentUser.email,
              deviceId,
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

        const parseDate = (date: any) => {
          if (!date) return null;
          if (date.seconds) return new Date(date.seconds * 1000);
          if (typeof date === "string") return new Date(date);
          return null;
        };

        const subStartDate = parseDate(subscriptionStart);
        const subEndDate = parseDate(subscriptionEnd);

        const isWithinPaidPeriod =
          subStartDate &&
          subEndDate &&
          now >= subStartDate &&
          now <= subEndDate;

        // Active subscription → TabNavigator
        if (isSubscribed && isWithinPaidPeriod) {
          hasNavigated.current = true;
          navigation.replace("TabNavigator");
          return;
        }

        // Check free trial
        let deviceUsedTrial = false;
        if (deviceId) {
          deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);
        }

        // Case: New user, device not used trial → FreeTrial
        if (!isSubscribed && !isFreeTrial && !deviceUsedTrial) {
          hasNavigated.current = true;
          navigation.replace("FreeTrial");
          return;
        }

        // Case: Active free trial (within 14 days)
        let isTrialValid = false;
        if (isFreeTrial && freeTrialStartedAt?.seconds) {
          const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
          const trialDays = differenceInDays(now, trialStart);
          isTrialValid = trialDays >= 0 && trialDays <= 14;
        }

        if (isTrialValid) {
          hasNavigated.current = true;
          navigation.replace("TabNavigator");
          return;
        }

        // Case: Trial expired or device already used trial → Subscription
        if (!isSubscribed) {
          hasNavigated.current = true;
          navigation.replace("Subscription");
          return;
        }

        // Fallback → OnBoarding
        hasNavigated.current = true;
        navigation.replace("OnBoarding");
      } catch (error) {
        console.log("Error deciding initial route:", error);
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          navigation.replace("OnBoarding");
        }
      }
    };

    decideAndNavigate();
  }, [userData, userLoading, deviceId, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />

      {/* Animated Loading Indicator */}
      <View style={styles.loaderContainer}>
        <View
          style={[styles.outerCircle, { borderColor: theme.primary + "20" }]}
        />

        <Animated.View
          style={[
            styles.spinnerOuter,
            {
              borderColor: theme.primary,
              transform: [{ rotate: outerSpin }, { scale }],
            },
          ]}
        />

        <View
          style={[styles.innerCircle, { borderColor: theme.primary + "30" }]}
        />

        <Animated.View
          style={[
            styles.spinnerInner,
            {
              borderColor: theme.primary,
              transform: [{ rotate: innerSpin }],
            },
          ]}
        />

        <View style={[styles.centerDot, { backgroundColor: theme.primary }]} />
      </View>

      {/* Loading Text with animated dots */}
      <View style={styles.loadingTextContainer}>
        <Animated.Text style={[styles.loadingText, { color: theme.heading }]}>
          Loading
        </Animated.Text>
        <View style={styles.dotsContainer}>
          <Animated.Text
            style={[styles.dot, { color: theme.heading, opacity: dotOpacity1 }]}
          >
            .
          </Animated.Text>
          <Animated.Text
            style={[styles.dot, { color: theme.heading, opacity: dotOpacity2 }]}
          >
            .
          </Animated.Text>
          <Animated.Text
            style={[styles.dot, { color: theme.heading, opacity: dotOpacity3 }]}
          >
            .
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    width: RFPercentage(20),
    height: RFPercentage(20),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  outerCircle: {
    position: "absolute",
    width: RFPercentage(15),
    height: RFPercentage(15),
    borderRadius: RFPercentage(7.5),
    borderWidth: RFPercentage(0.4),
    opacity: 0.3,
  },
  spinnerOuter: {
    position: "absolute",
    width: RFPercentage(15),
    height: RFPercentage(15),
    borderRadius: RFPercentage(7.5),
    borderWidth: RFPercentage(0.4),
    ...Platform.select({
      ios: {
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
      },
      android: {
        borderLeftColor: "rgba(255,255,255,0.1)",
        borderRightColor: "rgba(255,255,255,0.1)",
        borderTopColor: "transparent",
      },
    }),
  },
  innerCircle: {
    position: "absolute",
    width: RFPercentage(10),
    height: RFPercentage(10),
    borderRadius: RFPercentage(5),
    borderWidth: RFPercentage(0.3),
    opacity: 0.3,
  },
  spinnerInner: {
    position: "absolute",
    width: RFPercentage(10),
    height: RFPercentage(10),
    borderRadius: RFPercentage(5),
    borderWidth: RFPercentage(0.3),
    ...Platform.select({
      ios: {
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      },
      android: {
        borderTopColor: "rgba(255,255,255,0.1)",
        borderBottomColor: "rgba(255,255,255,0.1)",
      },
    }),
  },
  centerDot: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    borderRadius: RFPercentage(1),
  },
  loadingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(4),
  },
  loadingText: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_500Medium",
  },
  dotsContainer: {
    flexDirection: "row",
    marginLeft: RFPercentage(0.2),
  },
  dot: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_700Bold",
  },
});

export default DeciderScreen;
