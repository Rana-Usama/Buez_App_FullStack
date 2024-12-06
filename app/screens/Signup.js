import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";

// auth
// eslint-disable-next-line import/no-unresolved
import { createUserWithEmailAndPassword } from "firebase/auth";

// config
import Colors from "../config/Colors";
import { validateConfirmPassword, validateEmail, validateName, validatePassword } from "../utils/helperFunctions";
import { FIREBASE_AUTH } from "../../firebaseConfig";
import { addUser } from "../services/user";

function Signup(props) {
  const [indicator, showIndicator] = useState(false);
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Name",
      value: "",
      error: "",
      validator: validateName,
    },
    {
      placeholder: "Email",
      value: "",
      error: "",
      validator: validateEmail,
    },
    {
      placeholder: "Password",
      value: "",
      error: "",
      secure: true,
      validator: validatePassword,
    },
    {
      placeholder: "Confirm Password",
      value: "",
      error: "",
      secure: true,
      validator: validateConfirmPassword,
    },
  ]);

  const handleChange = (text, i) => {
    let tempfeilds = [...inputField];
    tempfeilds[i].value = text;
    SetInputField(tempfeilds);
  };

  const handleValidation = () => {
    let isValid = true;
    const updatedFields = [...inputField];

    // Validate Name
    updatedFields[0].error = updatedFields[0].validator(updatedFields[0].value);
    if (updatedFields[0].error) isValid = false;

    // Validate Email
    updatedFields[1].error = updatedFields[1].validator(updatedFields[1].value);
    if (updatedFields[1].error) isValid = false;

    // Validate Password
    updatedFields[2].error = updatedFields[2].validator(updatedFields[2].value);
    if (updatedFields[2].error) isValid = false;

    // Validate Confirm Password
    updatedFields[3].error = updatedFields[3].validator(updatedFields[2].value, updatedFields[3].value);
    if (updatedFields[3].error) isValid = false;

    SetInputField(updatedFields);
    return isValid;
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

  const handleSignup = async () => {
    if (!handleValidation()) {
      console.error('Please fill all the required fields');
      return;
    }

    showIndicator(true);
    try {
      const userName = inputField[0].value;
      const email = inputField[1].value;
      const password = inputField[2].value;
      const user = await createAccountWithEmail(email, password);
      if (user) {
        const userData = {
          userName: userName,
        };
        await addUser(user?.uid, userData);
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Email already in use. Please choose a different email.");
      } else if (error.code === "auth/weak-password") {
        alert("Weak password. Please choose a stronger password.");
      } else {
        alert("Signup error: " + error.message);
      }
    }

    showIndicator(false);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Image style={styles.logo} source={require("../../assets/Images/logo.png")} />
        <Text style={styles.welcomeText}>Welcome!</Text>

        {/* Input field */}
        <View style={styles.inputContainer}>
          {inputField.map((item, i) => (
            <View key={i} style={[styles.inputFieldContainer, { marginTop: i === 0 ? RFPercentage(4.5) : RFPercentage(1.2) }]}>
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
                handleFeild={(text) => handleChange(text, i)}
                value={item.value}
                width={"94%"}
              />
            </View>
          ))}
        </View>

        {/* Signup Button */}
        <MyAppButton disabled={indicator} title={"Signup"} onPress={handleSignup} marginTop={RFPercentage(4.5)} />

        {/* Social Media Login */}
        <View style={styles.socialMediaContainer}>
          <View style={styles.divider} />
          <Text style={styles.socialMediaText}>or signup with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Media Icons */}
        <View style={styles.socialIconsContainer}>
          <TouchableOpacity activeOpacity={0.8}>
            <Image style={styles.socialIcon} source={require("../../assets/Images/fbicon.png")} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8}>
            <Image style={[styles.socialIcon, styles.socialIconSpacing]} source={require("../../assets/Images/apple.png")} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8}>
            <Image style={styles.socialIcon} source={require("../../assets/Images/goicon.png")} />
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
    width: "100%",
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
    marginHorizontal: RFPercentage(1.6),
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
});

export default Signup;
