import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Platform, Modal, Pressable } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import { removeCredentials } from "../services/Auth.service";
import { deleteCurrentUser } from "../services/Auth.service";
import { BlurView } from "expo-blur";
import * as SecureStore from "expo-secure-store";
// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useExitAppOnBack } from "../utils/appBack";

function Settings({ navigation }) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const profileImgUrl = user?.profileImage || "";
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalVisible2, setIsModalVisible2] = useState(false);
  useExitAppOnBack();

  const navigationsList = [
    {
      iconSource: Icons.cancel,
      title: `${t("settings.txt1")}`,
      navigation: () => navigation.navigate("CancelSubscription"),
    },
    {
      iconSource: Icons.privacy,
      title: `${t("settings.txt2")}`,
      navigation: () => navigation.navigate("ChangePassword"),
    },
    {
      iconSource: Icons.language,
      title: `${t("settings.txt12")}`,
      navigation: () => navigation.navigate("Language"),
    },
    {
      iconSource: Icons.tc,
      title: `${t("settings.txt3")}`,
      navigation: () => navigation.navigate("TermsAndConditions"),
    },
    {
      iconSource: Icons.privacy,
      title: `${t("settings.txt4")}`,
      navigation: () => navigation.navigate("PrivacyPolicy"),
    },
    {
      iconSource: Icons.faq,
      title: `${t("settings.txt5")}`,
      navigation: () => navigation.navigate("FAQ"),
    },
    {
      iconSource: Icons.logout,
      title: `${t("settings.txt6")}`,
      redColor: true,
      navigation: () => {
        // resetPostsData();
        // logout();
        setIsModalVisible2(true);
      },
    },
    {
      iconSource: Icons.delete,
      title: `${t("settings.txt7")}`,
      redColor: true,
      navigation: () => {
        setIsModalVisible(true);
        // resetPostsData();
        // deleteAccount();
      },
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Nav */}
        <Nav marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} profileImage={profileImgUrl} leftLogo={true} navigation={navigation} title={`${t("settings.txt9")}`} />

        <View style={styles.content}>
          <Text style={styles.txt}>{`${t("settings.txt8")}`}</Text>
          <View style={styles.wrap} />
        </View>

        {/* Navigation List */}
        {navigationsList.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.navigation}
            activeOpacity={0.8}
            style={[
              styles.navigationWrap,
              {
                marginTop: i == 0 ? RFPercentage(3) : RFPercentage(2.5),
              },
            ]}
          >
            <View style={styles.content2}>
              <Image style={styles.img} source={item.iconSource} />
              <Text style={[styles.title, { color: item.redColor ? Colors.red : "#44403C" }]}>{item.title}</Text>
              <MaterialIcons name="arrow-forward-ios" style={[styles.icon, { color: item.redColor ? Colors.red : "#44403C" }]} color={Colors.heading} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Tab */}
      {/* <CustomTabBar settingTab={true} navigation={navigation} /> */}

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <BlurView intensity={100} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{`${t("settings.txt10")}`}</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>{`${t("buttons.cancel")}`}</Text>
              </Pressable>
              <MyAppButton
                title={`${t("buttons.yes")}`}
                marginTop={RFPercentage(0)}
                height={RFPercentage(5.8)}
                width={RFPercentage(17)}
                onPress={async () => {
                  deleteCurrentUser();
                  setIsModalVisible(false);
                  removeCredentials();
                  await SecureStore.deleteItemAsync("appLanguage");
                  navigation.navigate("OnBoarding");
                }}
              />
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={isModalVisible2} onRequestClose={() => setIsModalVisible2(false)}>
        <BlurView intensity={100} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{`${t("settings.txt11")}`}</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setIsModalVisible2(false)}>
                <Text style={styles.cancelButtonText}>{`${t("buttons.cancel")}`}</Text>
              </Pressable>
              <MyAppButton
                title={`${t("buttons.yes")}`}
                marginTop={RFPercentage(0)}
                height={RFPercentage(5.8)}
                width={RFPercentage(17)}
                onPress={async () => {
                  removeCredentials();
                  setIsModalVisible2(false);
                  await SecureStore.setItemAsync("loggedOut", "true");
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                }}
              />
            </View>
          </View>
        </BlurView>
      </Modal>
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
  scroll: { width: "100%" },
  scrollContent: { width: "100%", alignItems: "center", paddingBottom: RFPercentage(5) },
  content: { width: "90%", justifyContent: "flex-start", alignItems: "flex-start", marginTop: RFPercentage(3.5) },
  txt: { color: Colors.lightGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
  wrap: { width: "75%", height: RFPercentage(0.1), backgroundColor: "#F3F4F6", marginTop: RFPercentage(1.6) },
  navigationWrap: {
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(1),
    borderColor: Colors.detailsBorder,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  content2: { width: "90%", justifyContent: "flex-start", alignItems: "center", flexDirection: "row" },
  img: { width: RFPercentage(2.8), height: RFPercentage(2.8) },
  title: { fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular", marginLeft: RFPercentage(1.6) },
  icon: { position: "absolute", right: 0, fontSize: RFPercentage(1.7) },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(218, 218, 218, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    alignItems: "center",
    height: RFPercentage(28),
    justifyContent: "center",
  },
  modalText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(4),
    lineHeight: RFPercentage(3.2),
    paddingHorizontal: RFPercentage(2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    alignItems: "center",
  },
  cancelButton: {
    width: RFPercentage(17),
    borderRadius: RFPercentage(10),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(2),
    height: RFPercentage(5.8),
  },
  cancelButtonText: {
    fontSize: RFPercentage(2),
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
  },
  confirmButton: {
    width: "45%",
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: RFPercentage(2),
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
  },
});

export default Settings;
