import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  Button,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as SecureStore from "expo-secure-store";
import { signInWithEmailAndPassword } from "firebase/auth";
import { saveCredentials } from "../services/Auth.service";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";
import Toast from "react-native-toast-message";
import { updateUserToken } from "../services/User.service";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import * as yup from "yup";
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import GoogleLoginButton from "../utils/googleLogin";
import { useAppTheme } from "../contexts/themeContext";
import { BlurView } from "expo-blur";

function Login({ navigation }) {
  const [indicator, showIndicator] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const scrollViewRef = useRef();

  const validationSchema = yup.object({
    email: yup
      .string()
      .email(t("validations.inValid"))
      .required(t("validations.emailReq")),
    password: yup.string().required(t("validations.passwordReq")),
  });

  const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.log("user...........", error);
      throw error;
    }
  };

  const handleLogin = async (values) => {
    showIndicator(true);
    try {
      const { email, password } = values;
      const user = await signInWithEmail(email, password);
      await SecureStore.setItemAsync("loggedOut", "false");
      await SecureStore.setItemAsync("password2", password);

      if (remember) {
        await saveCredentials(email, password);
      }

      const pushToken = await registerForPushNotificationsAsync();
      if (user && pushToken) {
        await updateUserToken(user.uid, pushToken);
      }
      Toast.show({
        type: "success",
        text1: t("toast.login.one"),
        text2: t("toast.login.two"),
      });
      navigation.navigate("TabNavigator");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("toast.login.three"),
        text2: t("toast.login.five"),
      });
    }
    showIndicator(false);
  };

  const toggleRemember = () => {
    setRemember(!remember);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
          <StatusBar
            barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
            backgroundColor={theme.white}
          />

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Image
              style={theme.mode === "dark" ? styles.darkImg : styles.logo}
              source={theme.mode === "dark" ? Icons.dark_logo : Icons.logo}
            />
            <Image style={styles.crown} source={Icons.crown} />
            <Text style={[styles.welcomeText, { color: theme.heading }]}>
              {t("login.txt1")}
            </Text>

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={handleLogin}
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
                  <View style={styles.inputContainer}>
                    <InputFieldNew
                      placeholder={t("common.email")}
                      onChangeText={handleChange("email")}
                      handleBlur={handleBlur("email")}
                      value={values.email}
                      customStyle={{
                        borderColor:
                          touched.email && errors.email
                            ? Colors.red
                            : theme.border,
                      }}
                      onSubmitEditing={() => {
                        // Focus next input or dismiss keyboard
                        dismissKeyboard();
                      }}
                    />
                    {touched.email && errors.email && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{errors?.email}</Text>
                      </View>
                    )}

                    <InputFieldNew
                      placeholder={t("common.password")}
                      password
                      onChangeText={handleChange("password")}
                      handleBlur={handleBlur("password")}
                      value={values.password}
                      customStyle={{
                        borderColor:
                          touched.password && errors.password
                            ? Colors.red
                            : theme.border,
                      }}
                      onSubmitEditing={dismissKeyboard}
                    />
                    {touched.password && errors.password && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{errors?.password}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={toggleRemember}
                    style={styles.rememberContainer}
                  >
                    <View style={styles.rememberWrapper}>
                      <View style={styles.rememberBox}>
                        <View
                          style={[
                            styles.rememberIndicator,
                            {
                              backgroundColor: remember ? theme.primary : null,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.rememberText, { color: theme.darkGrey }]}
                      >
                        {t("login.txt2")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate("ForgotPassword")}
                      style={styles.forgotPassword}
                    >
                      <Text
                        style={[
                          styles.forgotPasswordText,
                          { color: theme.darkGrey },
                        ]}
                      >
                        {t("login.txt3")}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <MyAppButton
                    title={t("buttons.login")}
                    loading={indicator}
                    marginTop={RFPercentage(7)}
                    onPress={handleSubmit}
                    disabled={indicator}
                  />
                </>
              )}
            </Formik>

            <View style={styles.socialLoginContainer}>
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
              <Text style={[styles.orText, { color: theme.darkGrey }]}>
                {t("login.txt4")}
              </Text>
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
            </View>

            <View style={styles.socialIconsContainer}>
              <GoogleLoginButton navigation={navigation} />
            </View>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: theme.darkGrey }]}>
                {t("login.txt5")}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={[styles.signupLink, { color: theme.primary }]}>
                  {t("buttons.signup")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <Modal
            visible={isModalVisible}
            animationType="fade"
            onRequestClose={() => setIsModalVisible(false)}
            transparent={true}
          >
            <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
              <BlurView
                intensity={5}
                style={[
                  styles.modalBackground,
                  { backgroundColor: theme.modal },
                ]}
              >
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View
                    style={[
                      styles.modalContainer,
                      {
                        backgroundColor: theme.white,
                        alignSelf: "center",
                        marginTop: "auto",
                        marginBottom: "auto",
                      },
                    ]}
                  >
                    <Text style={[styles.modalText, { color: theme.black }]}>
                      Instagram Login Requirements
                    </Text>
                    <View style={{ marginTop: RFPercentage(1) }}>
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          color: theme.grey,
                          fontSize: RFPercentage(1.7),
                        }}
                      >{`i) The user must have an Instagram Business or Creator account!`}</Text>
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          marginTop: RFPercentage(1.6),
                          color: theme.grey,
                          fontSize: RFPercentage(1.7),
                        }}
                      >{`ii) The Instagram account must be linked to a Facebook Page that the user manages!`}</Text>
                    </View>

                    <MyAppButton
                      title="Login"
                      onPress={() => {
                        setIsModalVisible(false);
                        navigation.navigate("InstagramLoginWebView");
                      }}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </BlurView>
            </TouchableWithoutFeedback>
          </Modal>
        </Screen>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: RFPercentage(3),
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: RFPercentage(2),
    paddingVertical: RFPercentage(5),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(3),
  },
  modalText: {
    fontSize: RFPercentage(2),
    marginBottom: RFPercentage(2),
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
  },
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(3),
  },
  darkImg: {
    width: RFPercentage(20),
    height: RFPercentage(10.6),
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
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  forgotPassword: {
    position: "absolute",
    right: 0,
  },
  forgotPasswordText: {
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
  },
  orText: {
    color: Colors.darkGrey,
    marginHorizontal: RFPercentage(0.7),
    fontFamily: "Poppins_300Light",
    fontSize: RFPercentage(1.8),
  },
  socialIconsContainer: {
    marginTop: RFPercentage(3),
    flexDirection: "row",
    alignItems: "center",
  },
  socialIcon: {
    width: RFPercentage(4.8),
    height: RFPercentage(4.8),
  },
  socialIconMargin: {
    marginHorizontal: RFPercentage(1),
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: RFPercentage(3),
  },
  signupText: {
    fontSize: RFPercentage(1.7),
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
