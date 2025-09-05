import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "../components/common/MyAppButton";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { updatePassword } from "../services/Auth.service";
import Toast from "react-native-toast-message";
import * as yup from "yup";
import { Formik } from "formik";
import InputFieldNew from "../components/common/NewField";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { FIREBASE_AUTH } from "../../firebaseConfig";

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
      .required(`${t("validations.passwordReq")}`),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], `${t("validations.passwordMatch")}`)
      .required(`${t("validations.passwordMatch")}`),
  });

  const handlePasswordChange = async (values: any) => {
    try {
      showIndicator(true);
      const currentPassword = values.oldPassword;
      const newPassword = values.password;
      await updatePassword(currentPassword, newPassword);
      Toast.show({
        type: "success",
        text1: `${t("toast.changePassword.one")}`,
        text2: `${t("toast.changePassword.two")}`,
      });
      navigation.navigate("Login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: `${t("toast.changePassword.three")}`,
        text2: `${t("toast.changePassword.four")}`,
      });
    }
    showIndicator(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ width: "100%", alignItems: "center" }}
      >
        {/* Nav */}
        <Nav
          dpNull
          marginTop={
            Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)
          }
          leftLogo={false}
          navigation={navigation}
          title={`${t("settings.txt2")}`}
        />

        {/* If Google login → show message + manage account link */}
        {provider === "google.com" ? (
          <View style={styles.googleContainer}>
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
              🔑{" "}
              {t(
                "password.txt1"
              )}{" "}
            </Text>

            <MyAppButton
              title={t( "password.txt2")}
              marginTop={RFPercentage(5)}
              onPress={() =>
                Linking.openURL("https://myaccount.google.com/security")
              }
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
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(8),
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
    marginTop: RFPercentage(5),
    width: "88%",
    alignSelf: "center",
    alignItems: "center",
  },
});

export default ChangePassword;
