import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { FIREBASE_AUTH } from "../../firebaseConfig";

// components
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";

// config
import Colors from "../config/Colors";
import * as yup from "yup";
import { Formik } from "formik";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function ForgotPassword(props: any) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  let validationSchema = yup.object({
    email: yup
      .string()
      .email(`${t("validations.inValid")}`)
      .required(`${t("validations.emailReq")}`),
  });

  const [loader, setLoader] = useState(false);

  const handleNext = async (values: any) => {
    setLoader(true);
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, values.email);
      props.navigation.navigate("Login");
      Toast.show({
        type: "success",
        text1: `${t("toast.forgetPassword.one")}`,
        text2: `${t("toast.forgetPassword.two")}`,
      });
    } catch (error) {
      console.log("Error sending reset link:", error.message);
      Toast.show({
        type: "error",
        text1: `${t("toast.forgetPassword.three")}`,
        text2: `${t("toast.forgetPassword.four")}`,
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} backgroundColor={theme.white} />
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => props.navigation.goBack()} style={{ position: "absolute", left: 0 }}>
          <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.5) }} color={theme.heading} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.heading }]}>{`${t("forgetPassword.txt1")}`}</Text>
      </View>

      {/* Input field */}
      <Formik
        initialValues={{
          email: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => handleNext(values)}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <View style={styles.fieldWrapper}>
              <InputFieldNew
                placeholder={`${t("common.email")}`}
                onChangeText={handleChange("email")}
                handleBlur={handleBlur("email")}
                value={values.email}
                customStyle={{
                  borderColor: touched.email && errors.email ? Colors.red : theme.border,
                }}
              />
              {touched.email && errors.email && (
                <>
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                </>
              )}
            </View>

            {/*Login Button */}
            <MyAppButton title={`${t("forgetPassword.txt2")}`} marginTop={RFPercentage(5.2)} onPress={() => handleSubmit()} loading={loader} disabled={loader} />
          </>
        )}
      </Formik>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  container: { width: "90%", justifyContent: "center", alignItems: "center", marginTop: RFPercentage(3) },
  heading: { color: Colors.heading, fontSize: RFPercentage(2.4), fontFamily: "Poppins_500Medium" },
  fieldWrapper: { justifyContent: "center", alignItems: "center", width: "88%" },
  errorContainer: {
    width: "100%",
    height: RFPercentage(2),
    top: RFPercentage(0.2),
  },

  errorText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: Colors.red,
    left: RFPercentage(0.3),
  },
});

export default ForgotPassword;
