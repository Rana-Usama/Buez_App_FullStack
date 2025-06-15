import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { FIREBASE_DB } from "../../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import * as SecureStore from "expo-secure-store";

// components
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";

// auth
// eslint-disable-next-line import/no-unresolved
import { createUserWithEmailAndPassword } from "firebase/auth";

// config
import Colors from "../config/Colors";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { addUser } from "../services/User.service";
import { Icons } from "../config/theme";
import * as yup from "yup";
import { Formik } from "formik";
import Toast from "react-native-toast-message";
import { registerForPushNotificationsAsync } from "../utils/notificationService";
import { saveCredentials } from "../services/Auth.service";
import { useNavigation } from "@react-navigation/native";

const webClientId = "291364316025-qk5k8ptkmnqu2uadk7dmnn6vmkujiu3c.apps.googleusercontent.com";

function Signup(props: any) {
  let validationSchema = yup.object({
    name: yup.string().required("Username is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters long").required("Password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Passwords must match"),
  });
  const navigation = useNavigation();
  const [indicator, showIndicator] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    }
    getToken();
  }, []);

  // console.log('expoPushToken...................', expoPushToken)

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
    });
  }, []);

  const onGoogleButtonPress = async () => {
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
          text1: "Sign Up",
          text2: "User registered Successfully!",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Sign Up",
          text2: "Signed In Successfully!",
        });
      }
    } catch (error) {
      console.log("Google Sign-In Error:", error?.code ?? "Unknown Code", error?.message ?? error);
    }
  };

  const createAccountWithEmail = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;
      return user;
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (values: any) => {
    showIndicator(true);
    try {
      const userName = values.name;
      const email = values.email;
      const password = values.password;
      const user = await createAccountWithEmail(email, password);
       await SecureStore.setItemAsync("loggedOut", "false");
      if (user) {
        const userData = {
          userName: userName,
          email: email,
          isSubscribed: false,
          token: expoPushToken,
          isFreeTrial: false,
        };
        await addUser(user?.uid, userData);
        await saveCredentials(email, password);
      }
      Toast.show({
        type: "success",
        text1: "Sign Up",
        text2: "User registered Successfully!",
      });
      navigation.navigate("FreeTrial");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Sign Up Error",
        text2: "Credentials already in use",
      });
    }
    showIndicator(false);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Image style={styles.logo} source={Icons.logo} />
        <Text style={styles.welcomeText}>Welcome!</Text>

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
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              <View style={styles.inputContainer}>
                {/* Name */}
                <InputFieldNew
                  placeholder="Name"
                  onChangeText={handleChange("name")}
                  handleBlur={handleBlur("name")}
                  value={values.name}
                  customStyle={{
                    borderColor: touched.name && errors.name ? Colors.red : "#E5E7EB",
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

                {/* Confirm Password */}
                <InputFieldNew
                  placeholder="Confirm Password"
                  password={true}
                  onChangeText={handleChange("confirmPassword")}
                  handleBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  customStyle={{
                    borderColor: touched.confirmPassword && errors.confirmPassword ? Colors.red : "#E5E7EB",
                  }}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <>
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    </View>
                  </>
                )}
              </View>

              <MyAppButton title="Signup" loading={indicator} onPress={() => handleSubmit()} marginTop={RFPercentage(4.5)} disabled={indicator} />
            </>
          )}
        </Formik>

        {/* Social Media Login */}
        <View style={styles.socialMediaContainer}>
          <View style={styles.divider} />
          <Text style={styles.socialMediaText}>or signup with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Media Icons */}
        <View style={styles.socialIconsContainer}>
          <TouchableOpacity activeOpacity={0.8}>
            <Image style={styles.socialIcon} source={Icons.fb} />
          </TouchableOpacity>
          <View style={styles.socialIconSpacing}></View>
          {/* <TouchableOpacity activeOpacity={0.8}>
            <Image style={[styles.socialIcon, styles.socialIconSpacing]} source={Icons.apple} />
          </TouchableOpacity> */}
          <TouchableOpacity activeOpacity={0.8} onPress={onGoogleButtonPress}>
            <Image style={styles.socialIcon} source={Icons.google} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => props.navigation.navigate("Login")}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    width: "100%",
    alignItems: "center",
    paddingBottom: RFPercentage(5),
  },
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(3),
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
    fontSize: RFPercentage(1.6),
  },
  socialIconsContainer: {
    marginTop: RFPercentage(3),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  socialIcon: {
    width: RFPercentage(4.4),
    height: RFPercentage(4.4),
  },
  socialIconSpacing: {
    marginHorizontal: RFPercentage(0.7),
  },
  footer: {
    flexDirection: "row",
    marginTop: RFPercentage(3),
  },
  footerText: {
    fontSize: RFPercentage(1.6),
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
});

export default Signup;
