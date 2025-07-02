import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, ScrollView } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import MyAppButton from "../components/common/MyAppButton";
import Nav from "../components/common/Nav";

// config
import Colors from "../config/Colors";
import { updatePassword } from "../services/Auth.service";

import Toast from "react-native-toast-message";
import * as yup from "yup";
import { Formik } from "formik";
import InputFieldNew from "../components/common/NewField";
import { useTranslation } from "react-i18next";

interface ChangePasswordProps {
  navigation: any;
}

function ChangePassword({ navigation }: ChangePasswordProps) {
  const [indicator, showIndicator] = useState<boolean>(false);
  const { t } = useTranslation();
  let validationSchema = yup.object({
    oldPassword: yup.string().required(`${t("validations.passwordReq")}`),
    password: yup
      .string()
      .min(6, `${t("validations.passwordLen")}`)
      .required(`${t("validations.passwordReq")}`),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], `${t("validations.passwordMatch")}`)
      .required(`${t("validations.passwordMatch")}`),
  });

  const handlePasswordChange = async (values: any) => {
    try {
      showIndicator(true);
      const currentPassword = values.oldPassword;
      const newPassword = values.password;
      await updatePassword(currentPassword, newPassword);
      Toast.show({
        type: "success",
        text1: `${t("toast.changePassword.one")}`,
        text2: `${t("toast.changePassword.two")}`,
      });
      navigation.navigate("Login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: `${t("toast.changePassword.three")}`,
        text2: `${t("toast.changePassword.four")}`,
      });
    }
    showIndicator(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`${t("settings.txt2")}`} />

        <Formik
          initialValues={{
            oldPassword: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => handlePasswordChange(values)}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.title}>{`${t("chnagePassword.txt5")}`}</Text>
                <InputFieldNew
                  placeholder={`${t("chnagePassword.txt1")}`}
                  password={true}
                  onChangeText={handleChange("oldPassword")}
                  handleBlur={handleBlur("oldPassword")}
                  value={values.oldPassword}
                  customStyle={{
                    width: "100%",
                    marginTop: RFPercentage(1.3),
                    borderColor: touched.oldPassword && errors.oldPassword ? Colors.red : "#E5E7EB",
                  }}
                />
                {touched.oldPassword && errors.oldPassword && (
                  <>
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.oldPassword}</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.title}>{`${t("chnagePassword.txt6")}`}</Text>
                <InputFieldNew
                  placeholder={`${t("chnagePassword.txt2")}`}
                  password={true}
                  onChangeText={handleChange("password")}
                  handleBlur={handleBlur("password")}
                  value={values.password}
                  customStyle={{
                    width: "100%",
                    marginTop: RFPercentage(1.3),
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
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.title}>{`${t("chnagePassword.txt7")}`}</Text>
                <InputFieldNew
                  placeholder={`${t("chnagePassword.txt3")}`}
                  password={true}
                  onChangeText={handleChange("confirmPassword")}
                  handleBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  customStyle={{
                    width: "100%",
                    marginTop: RFPercentage(1.3),
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
              <View style={styles.buttonWrapper}>
                <MyAppButton title={`${t("chnagePassword.txt4")}`} marginTop={RFPercentage(2)} onPress={() => handleSubmit()} loading={indicator} disabled={indicator} />
              </View>
            </>
          )}
        </Formik>
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
    marginTop: RFPercentage(3),
    // justifyContent: "center",
    // alignItems: "center",
    width: "88%",
    alignSelf: "center",
  },
  title: {
    // left: RFPercentage(1.6),
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

export default ChangePassword;
