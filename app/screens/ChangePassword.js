import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";

// components
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import InputField from "../components/common/InputField";

// config
import Colors from "../config/Colors";

function ChangePassword({ navigation }) {
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Enter",
      title: "Old Password",
      value: "",
      secure: true,
    },
    {
      placeholder: "Enter",
      title: "New Password",
      value: "",
      secure: true,
    },
    {
      placeholder: "Enter",
      title: "Repeat New Password",
      value: "",
      secure: true,
    },
  ]);

  const handleChange = (text, i) => {
    let tempfeilds = [...inputField];
    tempfeilds[i].value = text;
    SetInputField(tempfeilds);
  };

  const handleLogin = () => {
    // showIndicator(true);
    let tempfeilds = [...inputField];

    if (tempfeilds[0].value === "" || tempfeilds[1].value === "") {
      // showIndicator(false);
      return true;
    }
    // navigation.navigate("HomeTab");
    try {
    } catch (error) {
      alert("Error");
    }

    // showIndicator(false);
  };
  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(8.6)} leftLogo={false} navigation={navigation} title="Change Password" />

        {/* Input field */}
        <View
          style={{
            marginTop: RFPercentage(6),
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            alignSelf: "center",
          }}
        >
          {inputField.map((item, i) => (
            <View
              key={i}
              style={{
                marginTop: i == 0 ? RFPercentage(-0.5) : RFPercentage(2.2),
                alignSelf: "center",
              }}
            >
              <Text style={{ left: RFPercentage(1.6), marginBottom: RFPercentage(1.2), color: "#57534E", fontSize: RFPercentage(1.8), fontFamily: "Poppins-Regular" }}>{item.title}</Text>
              <InputField
                placeholder={item.placeholder}
                placeholderColor={Colors.inputFieldPlaceholder}
                placeholderAtCenter={false}
                height={RFPercentage(6)}
                borderColor={Colors.border}
                borderWidth={RFPercentage(0.1)}
                backgroundColor={"white"}
                secure={item.secure}
                borderRadius={RFPercentage(1.4)}
                color={Colors.black}
                fontSize={RFPercentage(1.8)}
                fontFamily={"Poppins-Regular"}
                icon={item.icon}
                handleFeild={(text) => handleChange(text, i)}
                value={item.value}
                width={"97%"}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Button */}
      <View style={{ justifyContent: "center", alignItems: "center", position: "absolute", bottom: RFPercentage(16) }}>
        <MyAppButton title={"Change"} marginTop={RFPercentage(2)} onPress={() => navigation.navigate("Settings")} />
      </View>

      {/* Bottom Tab */}
      <CustomTabBar profileTab={true} navigation={navigation} />
    </View>
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

export default ChangePassword;
