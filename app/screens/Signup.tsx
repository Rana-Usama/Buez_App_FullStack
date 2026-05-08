import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  StatusBar,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as SecureStore from "expo-secure-store";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Colors from "../config/Colors";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { addUser } from "../services/User.service";
import { Icons } from "../config/theme";
import * as yup from "yup";
import { Formik } from "formik";
import Toast from "react-native-toast-message";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { saveCredentials } from "../services/Auth.service";
import { useTranslation } from "react-i18next";
import GoogleLoginButton from "../utils/googleLogin";
import { useAppTheme } from "../contexts/themeContext";
import { BlurView } from "expo-blur";
import AppleLoginButton from "../utils/appleLogin";
import DeviceInfo from "react-native-device-info";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

function Signup({ navigation }: any) {
  const { t } = useTranslation();
  let validationSchema = yup.object({
    name: yup.string().required(`${t("validations.userReq")}`),
    email: yup
      .string()
      .email(`${t("validations.inValid")}`)
      .required(`${t("validations.emailReq")}`),
    password: yup
      .string()
      .min(6, `${t("validations.passwordLen")}`)
      .required(`${t("validations.passwordReq")}`),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], `${t("validations.passwordMatch")}`)
      .required(`${t("validations.passwordMatch")}`),
  });

  const [indicator, showIndicator] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { theme } = useAppTheme();
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    const fetchId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
      console.log("Device ID:", id);
    };
    fetchId();
  }, []);

  const hasDeviceAvailedFreeTrial = async (deviceId) => {
    try {
      const q = query(
        collection(FIREBASE_DB, "freeTrials"),
        where("deviceId", "==", deviceId),
        where("freeTrial", "==", true),
      );
      const snapshot = await getDocs(q);
      console.log("snapppppp..................", snapshot);
      // If snapshot is NOT empty → device already used a free trial
      return !snapshot.empty;
    } catch (error) {
      console.log("Error fetching freeTrials:", error);
      return false;
    }
  };

  useEffect(() => {
    async function getToken() {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    }
    getToken();
  }, []);

  const createAccountWithEmail = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password,
      );
      const user = userCredential.user;
      await sendEmailVerification(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (values: any) => {
    showIndicator(true);
    try {
      const userName = values.name.trim();
      const email = values.email.trim().toLowerCase();
      const password = values.password.trim();
      const user = await createAccountWithEmail(email, password);
      await SecureStore.setItemAsync("loggedOut", "false");
      await SecureStore.setItemAsync("password2", password);

      if (user) {
        const userData = {
          userName: userName,
          email: email,
          isSubscribed: false,
          token: expoPushToken || null,
          isFreeTrial: false,
          emailVerified: false,
          createdAt: serverTimestamp(),
        };
        await addUser(user?.uid, userData);
        await saveCredentials(email, password);
      }
      Toast.show({
        type: "success",
        text1: "Account Created!",
        text2: "Please check your email to verify your account.",
      });

      // Navigate to verification screen, pass email for display
      navigation.navigate("EmailVerification", { email, password, deviceId });

      // const alreadyUsed = await hasDeviceAvailedFreeTrial(deviceId);
      // console.log("alreadyUsed............", alreadyUsed);

      // if (alreadyUsed) {
      //   navigation.navigate("Subscription");
      // } else {
      //   navigation.navigate("FreeTrial");
      // }
    } catch (error) {
      console.log("error.......", error);
      Toast.show({
        type: "error",
        text1: `${t("toast.signup.three")}`,
        text2: `${t("toast.signup.four")}`,
      });
    }
    showIndicator(false);
  };

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <LinearGradient
        colors={[
          "#7a6bffff",
          "#4ECDC4",
          "#45B7D1",
          "#96CEB4",
          "#5768feff",
          "#FF9FF3",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        style={styles.meshGradientTopLeft}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          style={theme.mode === "dark" ? styles.darkImg : styles.logo}
          source={theme.mode === "dark" ? Icons.dark_logo : Icons.logo}
        />
        <Text style={[styles.welcomeText, { color: theme.heading }]}>{`${t(
          "signup.txt1",
        )}`}</Text>

        <Formik
          initialValues={{
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => handleSignup(values)}
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
                {/* Name */}
                <InputFieldNew
                  placeholder={`${t("common.name")}`}
                  onChangeText={handleChange("name")}
                  handleBlur={handleBlur("name")}
                  value={values.name}
                  customStyle={{
                    borderColor:
                      touched.name && errors.name ? Colors.red : theme.border,
                  }}
                />
                {touched.name && errors.name && (
                  <>
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.name}</Text>
                    </View>
                  </>
                )}

                {/* Email */}
                <InputFieldNew
                  placeholder={`${t("common.email")}`}
                  onChangeText={(text) =>
                    handleChange("email")(text.toLowerCase())
                  }
                  handleBlur={handleBlur("email")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={values.email}
                  customStyle={{
                    borderColor:
                      touched.email && errors.email ? Colors.red : theme.border,
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
                    borderColor:
                      touched.password && errors.password
                        ? Colors.red
                        : theme.border,
                  }}
                />
                {touched.password && errors.password && (
                  <>
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  </>
                )}

                {/* Confirm Password */}
                <InputFieldNew
                  placeholder={`${t("common.confirm")}`}
                  password={true}
                  onChangeText={handleChange("confirmPassword")}
                  handleBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  customStyle={{
                    borderColor:
                      touched.confirmPassword && errors.confirmPassword
                        ? Colors.red
                        : theme.border,
                  }}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <>
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>
                        {errors.confirmPassword}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <MyAppButton
                title={`${t("buttons.signup")}`}
                loading={indicator}
                onPress={() => handleSubmit()}
                marginTop={RFPercentage(4.5)}
                disabled={indicator}
              />
            </>
          )}
        </Formik>

        {/* Social Media Login */}
        <View style={styles.socialMediaContainer}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text
            style={[styles.socialMediaText, { color: theme.darkGrey }]}
          >{`${t("signup.txt2")}`}</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        {/* Social Media Icons */}
        <View style={styles.socialIconsContainer}>
          {/* <View>
            <TouchableOpacity
              onPress={() => navigation.navigate("FacebookLoginWebView")}
            >
              <Image source={Icons.fb} style={styles.socialIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.socialIconMargin}>
            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
              <Image source={Icons.instagram} style={styles.socialIcon} />
            </TouchableOpacity>
          </View> */}
          <GoogleLoginButton navigation={navigation} />
          {Platform.OS === "android" ? null : (
            <View style={{ marginLeft: RFPercentage(2) }}>
              <AppleLoginButton navigation={navigation} />
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.darkGrey }]}>{`${t(
            "signup.txt3",
          )}`}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={[styles.loginText, { color: theme.primary }]}>{`${t(
              "buttons.login",
            )}`}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
        transparent={true}
      >
        <BlurView
          intensity={5}
          style={[styles.modalBackground, { backgroundColor: theme.modal }]}
        >
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={{ flex: 1, width: "100%" }}>
              <TouchableWithoutFeedback>
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
            </View>
          </TouchableWithoutFeedback>
        </BlurView>
      </Modal>
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
  meshGradientTopLeft: {
    position: "absolute",
    top: -RFPercentage(30),
    left: -RFPercentage(20),
    width: RFPercentage(50),
    height: RFPercentage(50),
    borderRadius: RFPercentage(25),
    opacity: 0.1,
    transform: [{ rotate: "45deg" }],
  },

  scrollView: {
    width: "100%",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 14,
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
  scrollViewContent: {
    width: "100%",
    alignItems: "center",
    paddingBottom: RFPercentage(5),
  },
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: Platform.OS === "ios" ? RFPercentage(3.5) : RFPercentage(9),
  },
  darkImg: {
    width: RFPercentage(20),
    height: RFPercentage(10.6),
    marginTop: Platform.OS === "ios" ? RFPercentage(3.5) : RFPercentage(9),
  },

  welcomeText: {
    color: Colors.heading,
    fontSize: RFPercentage(2.6),
    marginTop: RFPercentage(5),
    fontFamily: "Poppins_600SemiBold",
  },
  inputContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "88%",
    alignSelf: "center",
    marginVertical: RFPercentage(1.5),
    // backgroundColor:'red'
  },
  inputFieldContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  socialMediaContainer: {
    marginTop: RFPercentage(4.5),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  divider: {
    width: RFPercentage(3),
    height: RFPercentage(0.1),
    backgroundColor: "#E5E7EB",
  },
  socialMediaText: {
    color: Colors.darkGrey,
    marginHorizontal: RFPercentage(0.7),
    fontFamily: "Poppins_300Light",
    fontSize: RFPercentage(1.8),
  },
  socialIconsContainer: {
    marginTop: RFPercentage(3),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  socialIcon: {
    width: RFPercentage(4.8),
    height: RFPercentage(4.8),
  },
  socialIconSpacing: {
    marginHorizontal: RFPercentage(0.7),
  },
  footer: {
    flexDirection: "row",
    marginTop: RFPercentage(3),
  },
  footerText: {
    fontSize: RFPercentage(1.7),
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
  },
  loginText: {
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
    left: RFPercentage(0.2),
  },
  socialIconMargin: {
    marginHorizontal: RFPercentage(1),
  },
});

export default Signup;
