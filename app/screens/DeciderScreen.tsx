import React, { useEffect, useState } from "react";
import { StyleSheet, View, StatusBar, Animated, Easing } from "react-native";
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


const DeciderScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { userData, loading: userLoading } = useUser();

  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");

  // Animated values
  const [spinValue] = useState(new Animated.Value(0));
  const [scaleValue] = useState(new Animated.Value(0.8));
  const [dotOpacity1] = useState(new Animated.Value(0.3));
  const [dotOpacity2] = useState(new Animated.Value(0.3));
  const [dotOpacity3] = useState(new Animated.Value(0.3));

  const db = getFirestore();

  // Spinning animation for the loader
  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    // Sequential dot animation for "Loading..."
    const dotAnimation = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotOpacity1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity1, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotOpacity2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity2, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotOpacity3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity3, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    spinAnimation.start();
    scaleAnimation.start();
    dotAnimation.start();

    return () => {
      spinAnimation.stop();
      scaleAnimation.stop();
      dotAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
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
        where("freeTrial", "==", true)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.log("Error fetching freeTrials:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!deviceId) return; 
    const decideInitialRoute = async () => {
      try {
        if (userLoading) return;
        const creds = await getCredentials();
        const loggedOut = await SecureStore.getItemAsync("loggedOut");
        const { email } = creds || {};
        const now = new Date();

        // 🔒 Logged out → Login
        if (loggedOut === "true") {
          setInitialRoute("Login");
          setIsLoading(false);
          return;
        }

        // Wait for Firestore userData if creds exist
        if ((email || creds?.password) && !userData) {
          setTimeout(() => {
            if (!userData && !userLoading) {
              setInitialRoute("OnBoarding");
              setIsLoading(false);
            }
          }, 2000);
          return;
        }

        // No user → OnBoarding
        if (!userData) {
          setInitialRoute("OnBoarding");
          setIsLoading(false);
          return;
        }

        const {
          isSubscribed,
          subscriptionStart,
          subscriptionEnd,
          isFreeTrial,
          freeTrialStartedAt,
        } = userData;

        // Helper to parse Firestore timestamp / ISO string
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

        // Active subscription → TabNavigator (skip trial logic)
        if (isSubscribed && isWithinPaidPeriod) {
          setInitialRoute("TabNavigator");
          setIsLoading(false);
          return;
        }

        //Check free trial
        let deviceUsedTrial = false;
        if (deviceId) {
          deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);
        }

        //Case: New user, device not used trial → FreeTrial
        if (!isSubscribed && !isFreeTrial && !deviceUsedTrial) {
          setInitialRoute("FreeTrial");
          setIsLoading(false);
          return;
        }

        //Case: Active free trial (within 14 days)
        let isTrialValid = false;
        if (isFreeTrial && freeTrialStartedAt?.seconds) {
          const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
          const trialDays = differenceInDays(now, trialStart);
          isTrialValid = trialDays >= 0 && trialDays <= 14;
        }

        if (isTrialValid) {
          setInitialRoute("TabNavigator");
          setIsLoading(false);
          return;
        }

        //Case: Trial expired or device already used trial → Subscription
        if (!isSubscribed) {
          setInitialRoute("Subscription");
          setIsLoading(false);
          return;
        }

        //Fallback → OnBoarding
        setInitialRoute("OnBoarding");
        setIsLoading(false);
      } catch (error) {
        console.log("Error deciding initial route:", error);
        setInitialRoute("OnBoarding");
        setIsLoading(false);
      }
    };

    decideInitialRoute();
  }, [userData, userLoading, deviceId]);

  //Navigate once route is determined
  useEffect(() => {
    if (!isLoading && initialRoute) {
      navigation.navigate(initialRoute);
    }
  }, [isLoading, initialRoute]);

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />

      {/* Animated Loading Indicator */}
      <View style={styles.loaderContainer}>
        {/* Outer spinning circle */}
        <Animated.View
          style={[
            styles.spinnerOuter,
            {
              borderColor: theme.primary,
              borderBottomColor: theme.primary,
              borderLeftColor: theme.primary,
              transform: [{ rotate: spin }, { scale: scaleValue }],
            },
          ]}
        />

        {/* Inner spinning circle */}
        <Animated.View
          style={[
            styles.spinnerInner,
            {
              borderColor: theme.primary,
              transform: [
                {
                  rotate: spinValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["360deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Center dot */}
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
    width: RFPercentage(15),
    height: RFPercentage(15),
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerOuter: {
    position: "absolute",
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(6),
    borderWidth: RFPercentage(0.4),
    borderColor: "rgba(0,0,0,0.1)", // Add base color
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  spinnerInner: {
    position: "absolute",
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    borderWidth: RFPercentage(0.3),
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  centerDot: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(0.75),
  },
  loadingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(3),
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
