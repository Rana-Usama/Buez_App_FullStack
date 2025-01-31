import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";
import { router } from "expo-router";

function OTPInput(props) {
  const [indicator, showIndicator] = useState(false);

  const [inputField, SetInputField] = useState([
    {
      placeholder: "Enter Sent One Time Password",
      value: "",
    },
  ]);

  const handleChange = (text, i) => {
    let tempfeilds = [...inputField];
    tempfeilds[i].value = text;
    SetInputField(tempfeilds);
  };

  const handleLogin = () => {
    showIndicator(true);
    let tempfeilds = [...inputField];

    if (tempfeilds[0].value === "" || tempfeilds[1].value === "") {
      alert("Please fill all the feilds to proceed");
      showIndicator(false);
      return true;
    }
    try {
    } catch (error) {
      alert("Error");
    }

    showIndicator(false);
  };

  const [remember, setRemember] = useState(false);
  const toggleRemember = () => {
    setRemember(!remember);
  };

  return (
    <Screen style={styles.screen}>
      <View style={{ width: "90%", justifyContent: "center", alignItems: "center", marginTop: RFPercentage(3) }}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => props.navigation.goBack()} style={{ position: "absolute", left: 0 }}>
          <Ionicons name="chevron-back" style={{ fontSize: RFPercentage(2.5) }} color={Colors.heading} />
        </TouchableOpacity>
        <Text style={{ color: Colors.heading, fontSize: RFPercentage(2.4), fontFamily: "Poppins_500Medium" }}>Reset Password?</Text>
      </View>

      {/* Input field */}
      <View style={{ justifyContent: "center", alignItems: "center", width: "100%" }}>
        {inputField.map((item, i) => (
          <View key={i} style={{ marginTop: i == 0 ? RFPercentage(5) : RFPercentage(3) }}>
            <InputField
              placeholder={item.placeholder}
              placeholderColor={"#6B7280"}
              height={RFPercentage(6.2)}
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
              width={"95%"}
            />
          </View>
        ))}
      </View>
      {/*Login Button */}
      <MyAppButton title={"Verify"} marginTop={RFPercentage(5.2)} onPress={() => router.push({pathname: '/SetNewPassword'})} />
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
});

export default OTPInput;
