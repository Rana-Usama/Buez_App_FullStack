import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// auth
// eslint-disable-next-line import/no-unresolved
import { signInWithEmailAndPassword } from "firebase/auth";
import { getCredentials, saveCredentials } from "../services/Auth.service";
import { FIREBASE_AUTH } from "../firebaseConfig";

// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";

// utils]
import { validateEmail } from "../utils/helperFunctions";

// config
import Colors from "../config/Colors";
import { router } from "expo-router";

function Login(props) {
  const [indicator, showIndicator] = useState(false);
  const [remember, setRemember] = useState(false);
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Email",
      value: "",
      validator: validateEmail,
    },
    {
      placeholder: "Password",
      value: "",
      secure: true,
    },
  ]);

  useEffect(() => {
    const fetchCredentials = async () => {
      const credentials = await getCredentials();
      if (credentials.email && credentials.password) {
        const tempfeilds = [...inputField];
        tempfeilds[0].value = credentials.email;
        tempfeilds[1].value = credentials.password;
        SetInputField(tempfeilds);
        setRemember(true);
      }
    };

    fetchCredentials();
  }, []);

  const handleChange = (text, i) => {
    let tempFields = [...inputField];
    tempFields[i].value = text;
    SetInputField(tempFields);
  };

  const handleValidation = () => {
    let isValid = true;
    const updatedFields = [...inputField];
    // Validate Email
    updatedFields[0].error = updatedFields[0].validator(updatedFields[0].value);
    if (updatedFields[0].error) isValid = false;

    SetInputField(updatedFields);
    return isValid;
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

  const handleLogin = async () => {
    if (!handleValidation()) {
      return;
    }

    showIndicator(true);
    let tempFields = [...inputField];

    if (tempFields[0].value === "" || tempFields[1].value === "") {
      alert("Please fill all the fields to proceed");
      showIndicator(false);
      return true;
    }
    try {
      const email = tempFields[0].value;
      const password = tempFields[1].value;
      const user = await signInWithEmail(email, password);
      if (remember) {
        await saveCredentials(email, password);
      }
      console.log(user);
    } catch (error) {
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        alert("Invalid email or password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many unsuccessful login attempts. Please try again later.");
      } else {
        alert("Sign-in error: " + error.message + " code: " + error.code);
      }
      console.log(error.code);
    }
    showIndicator(false);
  };

  const toggleRemember = () => {
    setRemember(!remember);
  };

  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={require("../assets/Images/logo.png")} />
      <Image style={styles.crown} source={require("../assets/Images/crown.png")} />
      <Text style={styles.welcomeText}>Welcome Back</Text>

      <View style={styles.inputContainer}>
        {inputField.map((item, i) => (
          <View key={i} style={[styles.inputFieldWrapper, i === 0 && styles.firstInput]}>
            <InputField
              placeholder={item.placeholder}
              placeholderColor={"#6B7280"}
              height={RFPercentage(6.4)}
              backgroundColor={Colors.white}
              borderWidth={RFPercentage(0.1)}
              borderColor={"#E5E7EB"}
              secure={item.secure}
              borderRadius={RFPercentage(1.6)}
              color={Colors.black}
              fontSize={RFPercentage(1.7)}
              fontFamily={"Poppins_400Regular"}
              onChangeText={(text) => handleChange(text, i)}
              value={item.value}
              width={"94%"}
            />
          </View>
        ))}
      </View>

      <View style={styles.rememberContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleRemember} style={styles.rememberWrapper}>
          <TouchableOpacity style={styles.rememberBox}>
            <TouchableOpacity onPress={toggleRemember} style={[styles.rememberIndicator, { backgroundColor: remember ? Colors.primary : null }]} />
          </TouchableOpacity>
          <Text style={styles.rememberText}>Remember me?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push({pathname: '/ForgotPassword'})} style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <MyAppButton title={"Login"} marginTop={RFPercentage(7)} onPress={() => handleLogin()} />

      <View style={styles.socialLoginContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>or login with</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialIconsContainer}>
        <TouchableOpacity activeOpacity={0.8}>
          <Image style={styles.socialIcon} source={require("../assets/Images/fbicon.png")} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}>
          <Image style={[styles.socialIcon, styles.socialIconMargin]} source={require("../assets/Images/apple.png")} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}>
          <Image style={styles.socialIcon} source={require("../assets/Images/goicon.png")} />
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push({pathname: '/Signup'})}>
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
    width: "100%",
  },
  inputFieldWrapper: {
    marginTop: RFPercentage(1.5),
  },
  firstInput: {
    marginTop: RFPercentage(7),
  },
  rememberContainer: {
    width: "83.6%",
    flexDirection: "row",
    marginTop: RFPercentage(1),
    justifyContent: "flex-start",
    alignItems: "center",
  },
  rememberWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberBox: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    borderColor: "#E5E7EB",
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
    fontFamily: "Poppins_300Light",
  },
  forgotPassword: {
    position: "absolute",
    right: 0,
  },
  forgotPasswordText: {
    color: "#4B5563",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_300Light",
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
    marginHorizontal: RFPercentage(1.6),
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
});

export default Login;
