import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import InputFieldNew from "../components/common/NewField";
import Colors from "../config/Colors";
import * as yup from "yup";
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { BlurView } from "expo-blur";
import CustomNav from "../components/common/CustomNav";

function ForgotPassword(props: any) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const validationSchema = yup.object({
    email: yup
      .string()
      .email(`${t("validations.inValid")}`)
      .required(`${t("validations.emailReq")}`),
  });

  const [loader, setLoader] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email2, setEmail2] = useState("");

  const handleNext = async (values: any) => {
    setEmail2(values.email);
    setLoader(true);
    setErrorMessage("");
    try {
      const q = query(
        collection(FIREBASE_DB, "users"),
        where("email", "==", values.email)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMessage(t("forgetPassword.txt6"));
        return;
      }
      await sendPasswordResetEmail(FIREBASE_AUTH, values.email);
      setModalVisible(true);
    } catch (error: any) {
      console.log("Error:", error.message);
      setErrorMessage(t("validations.somethingWentWrong"));
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav showBack title={`${t("forgetPassword.txt1")}`} />
      {/* Input field */}
      <Formik
        initialValues={{ email: "" }}
        validationSchema={validationSchema}
        onSubmit={(values) => handleNext(values)}
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
            <View style={styles.fieldWrapper}>
              <InputFieldNew
                placeholder={`${t("common.email")}`}
                onChangeText={handleChange("email")}
                handleBlur={handleBlur("email")}
                value={values.email}
                customStyle={{
                  borderColor:
                    touched.email && (errors.email || errorMessage)
                      ? Colors.red
                      : theme.border,
                }}
              />
              {(touched.email && errors.email) || errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {errors.email || errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Reset Button */}
            <MyAppButton
              title={`${t("forgetPassword.txt2")}`}
              marginTop={RFPercentage(8)}
              onPress={() => handleSubmit()}
              loading={loader}
              disabled={loader}
            />
          </>
        )}
      </Formik>

      {/* Success Modal */}
      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <BlurView
          intensity={5}
          style={[styles.modalOverlay, { backgroundColor: theme.modal }]}
        >
          <View
            style={[styles.modalContainer, { backgroundColor: theme.white }]}
          >
            <Text style={[styles.modalText, { color: theme.heading }]}>
              {t("forgetPassword.txt3")}
            </Text>
            <Text style={[styles.modalText, { color: theme.heading }]}>
              {email2}
            </Text>
            <Text
              style={[
                styles.modalText,
                {
                  color: theme.heading,
                  marginTop: RFPercentage(2.5),
                  fontFamily: "Poppins_500Medium",
                  fontSize: RFPercentage(1.7),
                },
              ]}
            >
              {t("forgetPassword.txt4")}
            </Text>

            <MyAppButton
              title={t("forgetPassword.txt5")}
              marginTop={RFPercentage(3)}
              width={RFPercentage(18)}
              onPress={() => {
                setModalVisible(false);
                props.navigation.navigate("Login");
              }}
            />
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "flex-start", alignItems: "center" },
  container: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(3),
  },
  heading: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_500Medium",
  },
  fieldWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: "88%",
    marginTop: 50,
  },
  errorContainer: { width: "100%", marginTop: RFPercentage(0.5) },
  errorText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: Colors.red,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 10,
    padding: RFPercentage(3),
    alignItems: "center",
  },
  modalText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: RFPercentage(1),
  },
});

export default ForgotPassword;
