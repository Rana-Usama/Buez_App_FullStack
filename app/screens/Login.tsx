import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// auth
// eslint-disable-next-line import/no-unresolved
import { signInWithEmailAndPassword } from "firebase/auth";
import { getCredentials, saveCredentials } from "../services/Auth.service";
import { FIREBASE_AUTH } from "../../firebaseConfig";

// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";
import Toast from "react-native-toast-message";

// utils
import { validateEmail } from "../utils/helperFunctions";
import { updateUserToken } from "../services/User.service";
import { registerForPushNotificationsAsync } from "../utils/notificationService";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";

import * as yup from "yup";
import { Formik } from "formik";

type InputField = {
  placeholder: string;
  value: string;
  secure?: boolean;
  error?: string;
  validator?: (value: any, compareValue?: any) => string;
};

function Login(props: any) {
  const [indicator, showIndicator] = useState(false);
  const [remember, setRemember] = useState(false);

  let validationSchema = yup.object({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().required("Password is required"),
  });

  const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;
      return user;
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (values: any) => {
    showIndicator(true);
    try {
      const email = values.email;
      const password = values.password;
      const user = await signInWithEmail(email, password);

      if (remember) {
        await saveCredentials(email, password);
      }

      const pushToken = await registerForPushNotificationsAsync();
      if (user && pushToken) {
        await updateUserToken(user.uid, pushToken);
      }
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
      });
      console.log(user);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Sign In Error",
        text2: "Invalid Credentials",
      });
    }
    showIndicator(false);
  };

  const toggleRemember = () => {
    setRemember(!remember);
  };

  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={Icons.logo} />
      <Image style={styles.crown} source={Icons.crown} />
      <Text style={styles.welcomeText}>Welcome Back</Text>

      <Formik
        initialValues={{
          email: "",
          password: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => handleLogin(values)}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <View style={styles.inputContainer}>
              {/* Email */}
              <InputFieldNew
                placeholder="Email"
                onChangeText={handleChange("email")}
                handleBlur={handleBlur("email")}
                value={values.email}
                customStyle={{
                  borderColor: touched.email && errors.email ? Colors.red : "#E5E7EB",
                }}
              />
              {touched.email && errors.email && (
                <>
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                </>
              )}

              {/* Password */}
              <InputFieldNew
                placeholder="Password"
                password={true}
                onChangeText={handleChange("password")}
                handleBlur={handleBlur("password")}
                value={values.password}
                customStyle={{
                  borderColor: touched.password && errors.password ? Colors.red : "#E5E7EB",
                }}
              />
              {touched.password && errors.password && (
                <>
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={toggleRemember} style={styles.rememberContainer}>
              <View style={styles.rememberWrapper}>
                <View style={styles.rememberBox}>
                  <View style={[styles.rememberIndicator, { backgroundColor: remember ? Colors.primary : null }]} />
                </View>
                <Text style={styles.rememberText}>Remember me?</Text>
              </View>
              <TouchableOpacity onPress={() => props.navigation.navigate("ForgotPassword")} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <MyAppButton title={"Login"} loading={indicator} marginTop={RFPercentage(7)} onPress={() => handleSubmit()} disabled={indicator} />
          </>
        )}
      </Formik>
      <View style={styles.socialLoginContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>or login with</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialIconsContainer}>
        <TouchableOpacity activeOpacity={0.8}>
          <Image style={styles.socialIcon} source={Icons.fb} />
        </TouchableOpacity>
        <View style={styles.socialIconMargin}></View>
        {/* <TouchableOpacity activeOpacity={0.8}>
          <Image style={[styles.socialIcon, styles.socialIconMargin]} source={Icons.apple} />
        </TouchableOpacity> */}
        <TouchableOpacity activeOpacity={0.8}>
          <Image style={styles.socialIcon} source={Icons.google} />
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => props.navigation.navigate("Signup")}>
          <Text style={styles.signupLink}>Signup</Text>
        </TouchableOpacity>
      </View>
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
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(3),
  },
  crown: {
    marginTop: RFPercentage(6),
    width: RFPercentage(4),
    height: RFPercentage(4),
  },
  welcomeText: {
    color: Colors.heading,
    fontSize: RFPercentage(2.6),
    marginTop: RFPercentage(0.5),
    fontFamily: "Poppins_600SemiBold",
  },
  inputContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "88%",
    alignSelf: "center",
  },
  inputFieldWrapper: {
    marginTop: RFPercentage(1.5),
  },
  firstInput: {
    marginTop: RFPercentage(7),
  },
  rememberContainer: {
    width: "87%",
    flexDirection: "row",
    marginTop: RFPercentage(1),
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "center",
  },
  rememberWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rememberBox: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderColor: Colors.lightGrey,
    borderRadius: RFPercentage(30),
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
  },
  rememberIndicator: {
    width: RFPercentage(1.2),
    height: RFPercentage(1.2),
    borderRadius: RFPercentage(30),
  },
  rememberText: {
    marginLeft: RFPercentage(0.6),
    color: "#4B5563",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  forgotPassword: {
    position: "absolute",
    right: 0,
  },
  forgotPasswordText: {
    color: "#4B5563",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
  },
  socialLoginContainer: {
    marginTop: RFPercentage(4.5),
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    width: RFPercentage(3),
    height: RFPercentage(0.1),
    backgroundColor: "#E5E7EB",
  },
  orText: {
    color: Colors.darkGrey,
    marginHorizontal: RFPercentage(0.7),
    fontFamily: "Poppins_300Light",
    fontSize: RFPercentage(1.6),
  },
  socialIconsContainer: {
    marginTop: RFPercentage(3),
    flexDirection: "row",
    alignItems: "center",
  },
  socialIcon: {
    width: RFPercentage(4.4),
    height: RFPercentage(4.4),
  },
  socialIconMargin: {
    marginHorizontal: RFPercentage(0.7),
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: RFPercentage(5),
  },
  signupText: {
    fontSize: RFPercentage(1.6),
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
  },
  signupLink: {
    fontSize: RFPercentage(1.7),
    color: Colors.primary,
    marginLeft: RFPercentage(0.5),
    fontFamily: "Poppins_500Medium",
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
    left: RFPercentage(0.3),
  },
});

export default Login;
