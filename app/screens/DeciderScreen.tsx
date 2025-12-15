import React, { useEffect, useState } from "react";
import { StyleSheet, Image, View, StatusBar } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import { differenceInDays } from "date-fns";
import * as SecureStore from "expo-secure-store";
import DeviceInfo from "react-native-device-info";

import { useAppTheme } from "../contexts/themeContext";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { getCredentials } from "../services/Auth.service";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";

const DeciderScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { userData, loading: userLoading } = useUser();

  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");

  const db = getFirestore();

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
    if (!deviceId) return; // wait for deviceId

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

        // 🔥 1) Active subscription → TabNavigator (skip trial logic)
        if (isSubscribed && isWithinPaidPeriod && email) {
          setInitialRoute("TabNavigator");
          setIsLoading(false);
          return;
        }

        // 🔥 2) Check free trial
        let deviceUsedTrial = false;
        if (deviceId) {
          deviceUsedTrial = await hasDeviceAvailedFreeTrial(deviceId);
        }

        // 🎯 Case: New user, device not used trial → FreeTrial
        if (!isSubscribed && !isFreeTrial && !deviceUsedTrial) {
          setInitialRoute("FreeTrial");
          setIsLoading(false);
          return;
        }

        // 🎯 Case: Active free trial (within 14 days)
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

        // 🎯 Case: Trial expired or device already used trial → Subscription
        if (!isSubscribed) {
          setInitialRoute("Subscription");
          setIsLoading(false);
          return;
        }

        // 💤 Fallback → OnBoarding
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

  // 🚀 Navigate once route is determined
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
