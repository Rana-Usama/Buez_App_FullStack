import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import MyAppButton from "../components/common/MyAppButton";
import Nav from "../components/common/Nav";
import InputField from "../components/common/InputField";

// config
import Colors from "../config/Colors";
import { validateConfirmPassword, validatePassword } from "../utils/helperFunctions";
import { updatePassword } from "../services/Auth.service";

// types
interface InputFieldType {
  placeholder: string;
  title: string;
  value: string;
  secure: boolean;
  icon?: any;
  error?: string;
  validator?: (value: string, secondValue?: string) => string;
}

interface ChangePasswordProps {
  navigation: any;
}

function ChangePassword({ navigation }: ChangePasswordProps) {
  const [indicator, showIndicator] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [inputField, SetInputField] = useState<InputFieldType[]>([
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
      error: "",
      validator: validatePassword,
    },
    {
      placeholder: "Enter",
      title: "Repeat New Password",
      value: "",
      secure: true,
      error: "",
      validator: validateConfirmPassword,
    },
  ]);

  const handleChange = (text: string, i: number) => {
    const tempFields = [...inputField];
    tempFields[i].value = text;
    SetInputField(tempFields);
  };

  const handleValidation = (): boolean => {
    let isValid = true;
    const updatedFields = [...inputField];

    // Validate Password
    if (updatedFields[1].validator) {
      updatedFields[1].error = updatedFields[1].validator(updatedFields[1].value);
      if (updatedFields[1].error) isValid = false;
    }

    // Validate Confirm Password
    if (updatedFields[2].validator) {
      updatedFields[2].error = updatedFields[2].validator(
        updatedFields[1].value,
        updatedFields[2].value
      );

      if (updatedFields[2].error) {
        isValid = false;
        alert("Please enter a valid password");
      }
    }

    SetInputField(updatedFields);
    return isValid;
  };

  const handlePasswordChange = async () => {
    try {
      if (!handleValidation()) return;
      showIndicator(true);

      const currentPassword = inputField[0].value;
      const newPassword = inputField[1].value;
      await updatePassword(currentPassword, newPassword);
      navigation.navigate("Settings");
    } catch (error: any) {
      setErrorMessage(error.message);
      setShowError(true);
    }
    showIndicator(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav
          dpNull
          marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)}
          leftLogo={false}
          navigation={navigation}
          title="Change Password"
        />

        {/* Input Fields */}
        <View style={styles.fieldContainer}>
          {inputField.map((item, i) => (
            <View
              key={i}
              style={{
                marginTop: i === 0 ? RFPercentage(-0.5) : RFPercentage(2.2),
                alignSelf: "center",
              }}
            >
              <Text style={styles.title}>{item.title}</Text>
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
                fontFamily={"Poppins_400Regular"}
                icon={item.icon}
                handleFeild={(text: string) => handleChange(text, i)}
                value={item.value}
                width={"97%"}
              />
            </View>
          ))}
        </View>

        {/* Button */}
        <View style={styles.buttonWrapper}>
          <MyAppButton title="Change" marginTop={RFPercentage(2)} onPress={handlePasswordChange} loading={indicator} disabled={indicator} />
        </View>
      </ScrollView>
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
  fieldContainer: {
    marginTop: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },
  title: {
    left: RFPercentage(1.6),
    // marginBottom: RFPercentage(1.2),
    color: "#57534E",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(8),
  },
});

export default ChangePassword;
