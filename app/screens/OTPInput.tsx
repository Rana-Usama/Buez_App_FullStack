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

type InputFieldType = {
  placeholder: string;
  value: string;
  secure?: boolean; // optional
};

function OTPInput(props : any) {

 const [inputField, SetInputField] = useState<InputFieldType[]>([
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

  

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => props.navigation.goBack()} style={styles.touchableOpacity}>
          <Ionicons name="chevron-back" style={styles.ionicons} color={Colors.heading} />
        </TouchableOpacity>
        <Text style={styles.heading}>Reset Password?</Text>
      </View>

      {/* Input field */}
      <View style={styles.wrap}>
        {inputField.map((item, i) => (
          <View key={i} style={{ marginTop: i == 0 ? RFPercentage(5) : RFPercentage(3) }}>
            <InputField
              placeholder={item.placeholder}
              placeholderColor={Colors.heading}
              height={RFPercentage(6.2)}
              backgroundColor={Colors.white}
              borderWidth={RFPercentage(0.1)}
              borderColor={Colors.greyLight}
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
      <MyAppButton title={"Verify"} marginTop={RFPercentage(5.2)} onPress={() => props.navigation.navigate("SetNewPassword")} />
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
  wrap: { justifyContent: "center", alignItems: "center", width: "100%" },
  touchableOpacity: { position: "absolute", left: 0 },
  ionicons: { fontSize: RFPercentage(2.5) },
});

export default OTPInput;
