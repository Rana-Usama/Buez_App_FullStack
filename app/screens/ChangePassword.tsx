import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  ScrollView,
  Linking,
  StatusBar,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "../components/common/MyAppButton";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { updatePassword } from "../services/Auth.service";
import Toast from "react-native-toast-message";
import * as yup from "yup";
import { Formik } from "formik";
import InputFieldNew from "../components/common/NewField";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import CustomNav from "../components/common/CustomNav";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface ChangePasswordProps {
  navigation: any;
}

function ChangePassword({ navigation }: ChangePasswordProps) {
  const [indicator, showIndicator] = useState<boolean>(false);
  const [provider, setProvider] = useState<string | null>(null);
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  // Detect login provider (email/password or google.com)
  useEffect(() => {
    const user = FIREBASE_AUTH.currentUser;
    if (user && user.providerData.length > 0) {
      setProvider(user.providerData[0].providerId);
    }
  }, []);

  let validationSchema = yup.object({
    oldPassword: yup.string().required(`${t("validations.passwordReq")}`),
    password: yup
      .string()
      .min(6, `${t("validations.passwordLen")}`)
      .notOneOf([yup.ref("oldPassword")], `${t("validations.samePassword")}`)
      .required(`${t("validations.passwordReq")}`),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], `${t("validations.passwordMatch")}`)
      .required(`${t("validations.passwordMatch")}`),
  });

  // Map Firebase auth error codes to user-friendly messages
  const getPasswordErrorMessage = (error: any): string => {
    switch (error?.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return `${t("toast.changePassword.five")}`; // Old password is incorrect
      case "auth/too-many-requests":
        return `${t("toast.changePassword.six")}`; // Too many attempts
      case "auth/weak-password":
        return `${t("validations.passwordLen")}`;
      default:
        return `${t("toast.changePassword.four")}`; // Something went wrong
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      showIndicator(true);
      const currentPassword = values.oldPassword;
      const newPassword = values.password;

      // Defensive guard: never allow reusing the current password
      if (currentPassword === newPassword) {
        Toast.show({
          type: "error",
          text1: `${t("toast.changePassword.three")}`,
          text2: `${t("validations.samePassword")}`,
        });
        return;
      }

      await updatePassword(currentPassword, newPassword);
      Toast.show({
        type: "success",
        text1: `${t("toast.changePassword.one")}`,
        text2: `${t("toast.changePassword.two")}`,
      });
      navigation.navigate("Login");
    } catch (error: any) {
      console.log("Change password failed:", error?.code, error?.message);
      Toast.show({
        type: "error",
        text1: `${t("toast.changePassword.three")}`,
        text2: getPasswordErrorMessage(error),
      });
    } finally {
      showIndicator(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav showBack title={`${t("settings.txt2")}`} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentContainer}
      >
        {/* If Google login → show message + manage account link */}
        {provider === "google.com" || provider === "apple.com" ? (
          <View style={styles.googleContainer}>
            {/* Provider badge — same circular treatment for both Google and
                Apple so the two variants stay visually identical. A fixed
                white backdrop (not theme-swapped) keeps each brand mark
                rendering correctly in both Light and Dark mode. */}
            <View
              style={[
                styles.providerIconCircle,
                {
                  backgroundColor: theme.cartsBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              {provider === "google.com" ? (
                <Image
                  source={Icons.google}
                  style={styles.providerIcon}
                  resizeMode="contain"
                />
              ) : (
                <FontAwesome
                  name="apple"
                  size={RFPercentage(6)}
                  color={theme.mode === "dark" ? Colors.white : "#1b1717"}
                  style={styles.fontAwesome}
                />
              )}
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: theme.heading,
                  fontFamily: "Poppins_500Medium",
                  textAlign: "center",
                },
              ]}
            >
              {provider === "google.com"
                ? `🔑 ${t("password.txt1")}`
                : `🔑 ${t("password.txt4")}`}
            </Text>

            <MyAppButton
              title={
                provider === "google.com"
                  ? t("password.txt2") // e.g., "Manage Google Account"
                  : t("password.txt3")
              }
              marginTop={RFPercentage(5)}
              onPress={() =>
                provider === "google.com"
                  ? Linking.openURL("https://myaccount.google.com/security")
                  : Linking.openURL("https://appleid.apple.com/")
              }
              width={"100%"}
            />
          </View>
        ) : (
          // Else show Change Password form (email/password users)
          <Formik
            initialValues={{
              oldPassword: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={validationSchema}
            onSubmit={(values) => handlePasswordChange(values)}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.title, { color: theme.heading }]}>
                    {`${t("chnagePassword.txt5")}`}
                  </Text>
                  <InputFieldNew
                    placeholder={`${t("chnagePassword.txt1")}`}
                    password={true}
                    onChangeText={handleChange("oldPassword")}
                    handleBlur={handleBlur("oldPassword")}
                    value={values.oldPassword}
                    customStyle={{
                      width: "100%",
                      marginTop: RFPercentage(1.3),
                      borderColor:
                        touched.oldPassword && errors.oldPassword
                          ? theme.red
                          : theme.border,
                    }}
                  />
                  {touched.oldPassword && errors.oldPassword && (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: theme.red }]}>
                        {errors.oldPassword}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={[styles.title, { color: theme.heading }]}>
                    {`${t("chnagePassword.txt6")}`}
                  </Text>
                  <InputFieldNew
                    placeholder={`${t("chnagePassword.txt2")}`}
                    password={true}
                    onChangeText={handleChange("password")}
                    handleBlur={handleBlur("password")}
                    value={values.password}
                    customStyle={{
                      width: "100%",
                      marginTop: RFPercentage(1.3),
                      borderColor:
                        touched.password && errors.password
                          ? theme.red
                          : theme.border,
                    }}
                  />
                  {touched.password && errors.password && (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: theme.red }]}>
                        {errors.password}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={[styles.title, { color: theme.heading }]}>
                    {`${t("chnagePassword.txt7")}`}
                  </Text>
                  <InputFieldNew
                    placeholder={`${t("chnagePassword.txt3")}`}
                    password={true}
                    onChangeText={handleChange("confirmPassword")}
                    handleBlur={handleBlur("confirmPassword")}
                    value={values.confirmPassword}
                    customStyle={{
                      width: "100%",
                      marginTop: RFPercentage(1.3),
                      borderColor:
                        touched.confirmPassword && errors.confirmPassword
                          ? theme.red
                          : theme.border,
                    }}
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: theme.red }]}>
                        {errors.confirmPassword}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.buttonWrapper}>
                  <MyAppButton
                    title={`${t("chnagePassword.txt4")}`}
                    marginTop={RFPercentage(2)}
                    onPress={() => handleSubmit()}
                    loading={indicator}
                    disabled={indicator}
                    width={"100%"}
                  />
                </View>
              </>
            )}
          </Formik>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  fieldContainer: {
    marginTop: RFPercentage(3),
    width: "88%",
    alignSelf: "center",
  },
  title: {
    color: "#57534E",
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(8),
    width: "90%",
  },
  errorContainer: {
    width: "100%",
    height: RFPercentage(2),
    top: RFPercentage(0.2),
  },
  errorText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: Colors.red,
    left: RFPercentage(0.2),
  },
  googleContainer: {
    marginTop: RFPercentage(8),
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
  },
  providerIconCircle: {
    width: RFPercentage(11),
    height: RFPercentage(11),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(2),
  },
  providerIcon: {
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  scrollView: { width: "100%" },
  scrollViewContentContainer: { width: "100%", alignItems: "center" },
  fontAwesome: { marginTop: -RFPercentage(0.3) },
});

export default ChangePassword;
