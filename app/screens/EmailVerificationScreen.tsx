import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { reload, sendEmailVerification } from "firebase/auth";
import Colors from "../config/Colors";
import { RFPercentage } from "react-native-responsive-fontsize";
import Toast from "react-native-toast-message";
import { updateDoc, doc } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { resolveFounderRoute } from "../services/Founder.service";
import { Feather } from "@expo/vector-icons";

function EmailVerificationScreen({ navigation, route }: any) {
  const { email, password, deviceId } = route.params;
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const { t } = useTranslation();
  const { theme } = useAppTheme();

  // ─── Auto-poll every 5 seconds ────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      await checkVerification(true);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ─── Verification check ───────────────────────────────────────────────────
  const checkVerification = async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) return;

      await reload(user);

      if (user.emailVerified) {
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Update Firestore emailVerified flag
        await updateDoc(doc(FIREBASE_DB, "users", user.uid), {
          emailVerified: true,
        });

        Toast.show({
          type: "success",
          text1: t("emailVerification.verifiedSuccessTitle"),
          text2: t("emailVerification.verifiedSuccessDesc"),
        });
        const founderRoute = await resolveFounderRoute(deviceId);
        navigation.reset({
          index: 0,
          routes: [{ name: founderRoute }],
        });
      } else {
        if (!silent) {
          Toast.show({
            type: "info",
            text1: t("emailVerification.notVerifiedTitle"),
            text2: t("emailVerification.notVerifiedDesc"),
          });
        }
      }
    } catch (error) {
      console.log("Verification check error:", error);
    }
    if (!silent) setChecking(false);
  };

  // ─── Resend verification email ────────────────────────────────────────────
  const resendVerificationEmail = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        await sendEmailVerification(user);
        Toast.show({
          type: "success",
          text1: t("emailVerification.emailSentTitle"),
          text2: t("emailVerification.emailSentDesc"),
        });
        // 60s cooldown to prevent spam
        setCooldown(60);
        cooldownRef.current = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("emailVerification.resendFailedTitle"),
        text2: t("emailVerification.resendFailedDesc"),
      });
    }
    setResending(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <Text style={styles.emoji}>📧</Text>
      <Text style={styles.title}>{t("emailVerification.title")}</Text>
      <Text style={styles.subtitle}>{t("emailVerification.subtitle")}</Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.hint}>{t("emailVerification.hint")}</Text>

      {/* Manual check button */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.primaryButton}
        onPress={() => checkVerification(false)}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {t("emailVerification.verifiedButton")}
          </Text>
        )}
      </TouchableOpacity>

      {/* Resend button with cooldown */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.secondaryButton,
          cooldown > 0 && styles.disabledButton,
          {
            borderColor:
              theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
          },
        ]}
        onPress={resendVerificationEmail}
        disabled={resending || cooldown > 0}
      >
        {resending ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text
            style={[
              styles.secondaryButtonText,
              {
                color: theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
              },
            ]}
          >
            {cooldown > 0
              ? t("emailVerification.resendCooldown", { seconds: cooldown })
              : t("emailVerification.resendButton")}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Login")}
        style={styles.touchableOpacity}
      >
        <View
          style={{
            height: RFPercentage(3),
            width: RFPercentage(3),
            borderRadius: RFPercentage(100),
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.mode === "dark" ? Colors.black4 : Colors.blueLight12,
          }}
        >
          <Feather
            name="arrow-left"
            size={RFPercentage(2)}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.loginText}>
          {t("emailVerification.backToLogin")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: RFPercentage(4),
    backgroundColor: Colors.white,
    paddingTop: RFPercentage(18),
  },
  emoji: { fontSize: RFPercentage(9), marginBottom: RFPercentage(2) },
  title: {
    fontSize: RFPercentage(2.8),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heading,
    marginBottom: RFPercentage(1),
  },
  subtitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    color: Colors.darkGrey,
  },
  email: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
    marginVertical: RFPercentage(1),
  },
  hint: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: Colors.darkGrey,
    textAlign: "center",
    marginBottom: RFPercentage(4),
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    width: "100%",
    borderRadius: RFPercentage(2),
    alignItems: "center",
    marginBottom: RFPercentage(2),
    height: RFPercentage(6),
    justifyContent: "center",
  },
  primaryButtonText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2),
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    width: "100%",
    borderRadius: RFPercentage(2),
    alignItems: "center",
    marginBottom: RFPercentage(3),
    height: RFPercentage(6),
    justifyContent: "center",
  },
  disabledButton: { borderColor: Colors.darkGrey, opacity: 0.5 },
  secondaryButtonText: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2),
  },
  loginText: {
    color: Colors.darkGrey,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.8),
    marginLeft: RFPercentage(1),
  },
  touchableOpacity: { flexDirection: "row", alignItems: "center" },
});

export default EmailVerificationScreen;
