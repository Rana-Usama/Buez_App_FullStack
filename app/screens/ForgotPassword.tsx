import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { FIREBASE_AUTH } from "../../firebaseConfig";

// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";

// config
import Colors from "../config/Colors";
import * as yup from "yup";
import { Formik } from "formik";
import Toast from "react-native-toast-message";

function ForgotPassword(props: any) {
  let validationSchema = yup.object({
    email: yup.string().email("Invalid email").required("Email is required"),
  });

  const [loader, setLoader] = useState(false);

  const handleNext = async (values: any) => {
    setLoader(true);
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, values.email);
      props.navigation.navigate('Login')
      Toast.show({
        type: "success",
        text1: "Reset Link Sent",
        text2: "Check your email to reset your password.",
      });
    } catch (error) {
      console.log("Error sending reset link:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send reset link.",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => props.navigation.goBack()} style={{ position: "absolute", left: 0 }}>
          <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.5) }} color={Colors.heading} />
        </TouchableOpacity>
        <Text style={styles.heading}>Reset Password?</Text>
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
                placeholder="Enter Email"
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
            </View>

            {/*Login Button */}
            <MyAppButton title={"Send OTP"} marginTop={RFPercentage(5.2)} onPress={() => handleSubmit()} loading={loader} disabled={loader} />
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
