import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import InputFieldNew from "../components/common/NewField";
import Colors from "../config/Colors";
import * as yup from "yup";
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import CustomNav from "../components/common/CustomNav";

const { width } = Dimensions.get("window");

// ── Lock Icon ─────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <View style={lockStyles.wrapper}>
      <LinearGradient
        colors={["#253275", "#4557B0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={lockStyles.circle}
      >
        {/* Shackle */}
        <View style={lockStyles.shackle} />
        {/* Body */}
        <View style={lockStyles.body}>
          <View style={lockStyles.keyhole} />
        </View>
      </LinearGradient>
      {/* Pink dot accent */}
      <View style={lockStyles.pinkDot} />
    </View>
  );
}

const lockStyles = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
    marginBottom: RFPercentage(3),
    position: "relative",
  },
  circle: {
    width: RFPercentage(9.5),
    height: RFPercentage(9.5),
    borderRadius: RFPercentage(4.75),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  shackle: {
    width: RFPercentage(2.8),
    height: RFPercentage(2),
    borderTopLeftRadius: RFPercentage(1.6),
    borderTopRightRadius: RFPercentage(1.6),
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 0,
    marginBottom: -1,
  },
  body: {
    width: RFPercentage(4),
    height: RFPercentage(3.2),
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  keyhole: {
    width: RFPercentage(1.1),
    height: RFPercentage(1.1),
    borderRadius: RFPercentage(0.55),
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  pinkDot: {
    position: "absolute",
    top: 0,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#DD53A8",
    shadowColor: "#DD53A8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

// ── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({
  visible,
  email,
  onDismiss,
  theme,
  t,
}: {
  visible: boolean;
  email: string;
  onDismiss: () => void;
  theme: any;
  t: any;
}) {
  const isDark = theme.mode === "dark";

  return (
    <Modal transparent visible={visible} animationType="fade">
      <BlurView
        intensity={20}
        tint={isDark ? "dark" : "dark"}
        style={modalStyles.overlay}
      >
        <View
          style={[
            modalStyles.card,
            {
              backgroundColor: isDark ? "#080a16ff" : "#ffffff",
              borderColor: isDark
                ? "rgba(69,87,176,0.2)"
                : "rgba(37,50,117,0.1)",
            },
          ]}
        >
          {/* Top gradient bar */}
          <LinearGradient
            colors={["#253275", "#4557B0", "#DD53A8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={modalStyles.topBar}
          />

          <View style={modalStyles.body}>
            {/* Check circle */}
            <LinearGradient
              colors={["#253275", "#4557B0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={modalStyles.checkCircle}
            >
              {/* Simple ✓ using Text for reliability */}
              <Text style={modalStyles.checkText}>✓</Text>
            </LinearGradient>

            <Text
              style={[
                modalStyles.title,
                { color: isDark ? "#f4f6ff" : "#1a1a2e" },
              ]}
            >
              {t("forgetPassword.txt3")}
            </Text>

            {/* Email pill */}
            <View
              style={[
                modalStyles.emailPill,
                {
                  backgroundColor: isDark
                    ? "rgba(69,87,176,0.15)"
                    : "rgba(37,50,117,0.07)",
                },
              ]}
            >
              <Text style={modalStyles.emailText} numberOfLines={1}>
                {email}
              </Text>
            </View>

            <Text
              style={[
                modalStyles.hint,
                { color: isDark ? "#8892b0" : "#64748B" },
              ]}
            >
              {t("forgetPassword.txt4")}
            </Text>

            {/* Divider */}
            <View
              style={[
                modalStyles.divider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            />

            {/* CTA */}
            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.85}
              style={modalStyles.btnOuter}
            >
              <LinearGradient
                colors={["#253275", "#4557B0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={modalStyles.btn}
              >
                <Text style={modalStyles.btnText}>{t("buttons.login")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  topBar: { width: "100%", height: 4 },
  body: {
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
    paddingBottom: RFPercentage(3),
    paddingTop: RFPercentage(3),
  },
  checkCircle: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(4),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: RFPercentage(2),
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  checkText: {
    color: "#fff",
    fontSize: RFPercentage(3),
    fontFamily: "Poppins_700Bold",
    lineHeight: RFPercentage(4),
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(2),
    textAlign: "center",
    marginBottom: RFPercentage(1.5),
  },
  emailPill: {
    borderRadius: 100,
    paddingHorizontal: RFPercentage(2.2),
    paddingVertical: RFPercentage(0.7),
    marginBottom: RFPercentage(1.5),
    maxWidth: "90%",
  },
  emailText: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    color: "#4557B0",
    textAlign: "center",
  },
  hint: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.45),
    textAlign: "center",
    lineHeight: RFPercentage(2.3),
    marginBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(1),
  },
  divider: {
    width: "100%",
    height: 1,
    marginBottom: RFPercentage(2.5),
  },
  btnOuter: {
    width: "50%",
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btn: {
    paddingVertical: RFPercentage(1.7),
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.8),
    color: "#fff",
    letterSpacing: 0.3,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
function ForgotPassword(props: any) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const isDark = theme.mode === "dark";

  const validationSchema = yup.object({
    email: yup
      .string()
      .email(`${t("validations.inValid")}`)
      .required(`${t("validations.emailReq")}`),
  });

  const [loader, setLoader] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email2, setEmail2] = useState("");

  const handleNext = async (values: any) => {
    const email = values.email.trim().toLowerCase();
    setEmail2(email);
    setLoader(true);
    setErrorMessage("");
    try {
      const q = query(
        collection(FIREBASE_DB, "users"),
        where("email", "==", email),
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErrorMessage(t("forgetPassword.txt6"));
        return;
      }
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
      setModalVisible(true);
    } catch (error: any) {
      console.log("Error:", error.message);
      setErrorMessage(t("validations.somethingWentWrong"));
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <CustomNav showBack title={`${t("forgetPassword.txt1")}`} />

      <ScrollView contentContainerStyle={styles.content} >
        {/* Lock icon */}
        <LockIcon />

        {/* Heading */}
        <Text style={[styles.title, { color: isDark ? "#f4f6ff" : "#1a1a2e" }]}>
          {t("forgetPassword.txt1")}
        </Text>

        {/* Gradient underline */}
        <LinearGradient
          colors={["#253275", "#DD53A8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleUnderline}
        />

        <Text
          style={[styles.subtitle, { color: isDark ? "#8892b0" : "#64748B" }]}
        >
          Enter your email and we'll send you a password reset link.
        </Text>

        {/* Form card */}
        <Formik
          initialValues={{ email: "" }}
          validationSchema={validationSchema}
          onSubmit={(values) => handleNext(values)}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark
                    ? "rgba(3, 3, 3, 1)"
                    : "rgba(255,255,255,0.95)",
                  borderColor: isDark
                    ? "rgba(107, 115, 156, 0.38)"
                    : "rgba(37,50,117,0.1)",
                },
              ]}
            >
              {/* Card top bar */}
              <LinearGradient
                colors={["#253275", "#4557B0", "#DD53A8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardTopBar}
              />

              <View style={styles.cardInner}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? "#8892b0" : "#64748B" },
                  ]}
                >
                  Email Address
                </Text>

                <InputFieldNew
                  placeholder={`${t("common.email")}`}
                  onChangeText={(text: string) => {
                    handleChange("email")(text.toLowerCase());
                    if (errorMessage) setErrorMessage("");
                  }}
                  handleBlur={handleBlur("email")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={values.email}
                  customStyle={{
                    borderColor:
                      touched.email && (errors.email || errorMessage)
                        ? Colors.red
                        : isDark
                          ? "rgba(69, 87, 176, 0.63)"
                          : "rgba(37,50,117,0.15)",
                    marginTop: RFPercentage(1),
                  }}
                />

                {/* Error message */}
                {(touched.email && errors.email) || errorMessage ? (
                  <View style={styles.errorRow}>
                    <View style={styles.errorDot} />
                    <Text style={styles.errorText}>
                      {errors.email || errorMessage}
                    </Text>
                  </View>
                ) : null}

                {/* Send Link button */}
                <TouchableOpacity
                  onPress={() => handleSubmit()}
                  disabled={loader}
                  activeOpacity={0.85}
                  style={styles.btnOuter}
                >
                  <LinearGradient
                    colors={loader ? ["#aaa", "#bbb"] : ["#253275", "#4557B0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText} numberOfLines={1}>
                      {loader ? "Sending…" : t("forgetPassword.txt2")}
                    </Text>
                   
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to login */}
                <TouchableOpacity
                  onPress={() => props.navigation.navigate("Login")}
                  activeOpacity={0.7}
                  style={styles.backRow}
                >
                  <Text
                    style={[
                      styles.backText,
                      { color: isDark ? "#8892b0" : "#94A3B8" },
                    ]}
                  >
                    Remember your password?{" "}
                    <Text style={[styles.backLink,{color: theme.mode === "dark" ? Colors.white : theme.primary }]}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>

      {/* Success Modal */}
      <SuccessModal
        visible={modalVisible}
        email={email2}
        t={t}
        theme={theme}
        onDismiss={() => {
          setModalVisible(false);
          props.navigation.navigate("Login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "90%",
    alignItems: "center",
    paddingVertical: RFPercentage(5),
    alignSelf: "center",
    paddingBottom:RFPercentage(20)
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(3),
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 8,
  },
  titleUnderline: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginBottom: RFPercentage(1.5),
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.6),
    textAlign: "center",
    lineHeight: RFPercentage(2.6),
    maxWidth: 270,
    marginBottom: RFPercentage(3.5),
  },
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
  },
  cardTopBar: { width: "100%", height: 3 },
  cardInner: { padding: RFPercentage(3) },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    marginBottom: RFPercentage(0.8),
    letterSpacing: 0.2,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(0.8),
    gap: 6,
  },
  errorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.red,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.4),
    color: Colors.red,
  },
  btnOuter: {
    marginTop: RFPercentage(2.8),
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    shadowColor: "#253275",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 10,
    width: "90%",
    alignSelf: "center",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.6),
    gap: 10,
  },
  btnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.85),
    color: "#fff",
    letterSpacing: 0.3,
  },
  arrowBubble: {
    width: 26,
    height: 26,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: "#fff",
    fontSize: RFPercentage(2.2),
    textAlign: "center",
    fontFamily: "Poppins_400Regular",

    // lineHeight: RFPercentage(2),
  },
  backRow: {
    marginTop: RFPercentage(2.2),
    alignItems: "center",
  },
  backText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
  },
  backLink: {
    fontFamily: "Poppins_600SemiBold",
    color: "#4557B0",
  },
});

export default ForgotPassword;
