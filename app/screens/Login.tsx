import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
// import auth from "@react-native-firebase/auth";
import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { FIREBASE_DB } from "../../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import * as SecureStore from "expo-secure-store";

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
import { addUser, updateUserToken } from "../services/User.service";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
// import { FacebookAuthProvider } from "firebase/auth";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";

import * as yup from "yup";
import { Formik } from "formik";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// WebBrowser.maybeCompleteAuthSession();
const webClientId = "291364316025-qk5k8ptkmnqu2uadk7dmnn6vmkujiu3c.apps.googleusercontent.com";

function Login({ navigation }: any) {
  const [indicator, showIndicator] = useState(false);
  const [remember, setRemember] = useState(false);
  const { t } = useTranslation();
  let validationSchema = yup.object({
    email: yup
      .string()
      .email(`${t("validations.inValid")}`)
      .required(`${t("validations.emailReq")}`),
    password: yup.string().required(`${t("validations.passwordReq")}`),
  });
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    }
    getToken();
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
    });
  }, []);

  const onGoogleButtonPress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      console.log(userInfo);
      const { idToken } = userInfo?.data;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(FIREBASE_AUTH, googleCredential);
      const user = userCredential.user;
      console.log("Firebase User:", user);
      const userRef = doc(FIREBASE_DB, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        const userData = {
          userName: user?.displayName,
          email: user?.email,
          isSubscribed: false,
          profileImage: user?.photoURL,
          phoneNumber: user?.phoneNumber,
          token: expoPushToken,
          isFreeTrial: false,
        };
        await addUser(user?.uid, userData);
        Toast.show({
          type: "success",
          text1: `${t("toast.login.one")}`,
          text2: `${t("toast.login.two")}`,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: `${t("toast.login.three")}`,
        text2: `${t("toast.login.four")}`,
      });
    } finally {
      setLoading(false);
    }
  };

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
      await SecureStore.setItemAsync("loggedOut", "false");
      if (remember) {
        await saveCredentials(email, password);
      }

      const pushToken = await registerForPushNotificationsAsync();
      if (user && pushToken) {
        await updateUserToken(user.uid, pushToken);
      }
      Toast.show({
        type: "success",
        text1: `${t("toast.login.one")}`,
        text2: `${t("toast.login.two")}`,
      });
      navigation.navigate("TabNavigator");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: `${t("toast.login.three")}`,
        text2: `${t("toast.login.five")}`,
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
      <Text style={styles.welcomeText}>{`${t("login.txt1")}`}</Text>

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
                placeholder={`${t("common.email")}`}
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
                placeholder={`${t("common.password")}`}
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
                <Text style={styles.rememberText}>{`${t("login.txt2")}`}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>{`${t("login.txt3")}`}</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <MyAppButton title={`${t("buttons.login")}`} loading={indicator} marginTop={RFPercentage(7)} onPress={() => handleSubmit()} disabled={indicator} />
          </>
        )}
      </Formik>
      <View style={styles.socialLoginContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>{`${t("login.txt4")}`}</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialIconsContainer}>
        {loading ? (
          <>
            <ActivityIndicator size={"small"} color={Colors.primary} />
          </>
        ) : (
          <>
            <TouchableOpacity activeOpacity={0.8}>
              <Image style={styles.socialIcon} source={Icons.fb} />
            </TouchableOpacity>
            <View style={styles.socialIconMargin}></View>
            {/* <TouchableOpacity activeOpacity={0.8}>
          <Image style={[styles.socialIcon, styles.socialIconMargin]} source={Icons.apple} />
        </TouchableOpacity> */}
            <TouchableOpacity activeOpacity={0.8} onPress={onGoogleButtonPress}>
              <Image style={styles.socialIcon} source={Icons.google} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>{`${t("login.txt5")}`}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.signupLink}>{`${t("buttons.signup")}`}</Text>
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
