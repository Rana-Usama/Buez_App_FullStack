import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, Platform, Modal, Pressable } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import { logout } from "../services/Auth.service";
import { deleteCurrentUser } from "../services/Auth.service";
import { BlurView } from "expo-blur";
import { getCredentials } from "../services/Auth.service";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { usePostContext } from "../contexts/PostContext";
import { Icons } from "../config/theme";

function Settings({ navigation }) {
  const { userData: user } = useUser();
  const { resetPostsData } = usePostContext();
  const profileImgUrl = user?.profileImage || "";
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalVisible2, setIsModalVisible2] = useState(false);
  const [password, setPassword] = useState('')

  const fetchCredentials = async () => {
    const { email, password } = await getCredentials();
    console.log(email, password);
    setPassword(password)
  };

  fetchCredentials();

  const navigationsList = [
    {
      iconSource: Icons.privacy,
      title: "Cancel Subscription",
      navigation: () => navigation.navigate("CancelSubscription"),
    },
    {
      iconSource: Icons.privacy,
      title: "Change Password",
      navigation: () => navigation.navigate("ChangePassword"),
    },
    {
      iconSource: Icons.tc,
      title: "Terms & Conditions",
      navigation: () => navigation.navigate("TermsAndConditions"),
    },
    {
      iconSource: Icons.privacy,
      title: "Privacy Policy",
      navigation: () => navigation.navigate("PrivacyPolicy"),
    },
    {
      iconSource: Icons.faq,
      title: "FAQ's",
      navigation: () => navigation.navigate("FAQ"),
    },
    {
      iconSource: Icons.logout,
      title: "Logout",
      redColor: true,
      navigation: () => {
        // resetPostsData();
        // logout();
        setIsModalVisible2(true);
      },
    },
    {
      iconSource: Icons.logout,
      title: "Delete Account",
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
        <Nav marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} profileImage={profileImgUrl} leftLogo={true} navigation={navigation} title="Settings" />

        <View style={styles.content}>
          <Text style={styles.txt}>Help & Security</Text>
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
      <CustomTabBar settingTab={true} navigation={navigation} />

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <BlurView intensity={100} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete{"\n"}this account?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <MyAppButton
                title={"Yes"}
                marginTop={RFPercentage(0)}
                height={RFPercentage(5.8)}
                width={RFPercentage(17)}
                onPress={() => {
                  deleteCurrentUser();
                  setIsModalVisible(false);
                }}
              />
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={isModalVisible2} onRequestClose={() => setIsModalVisible2(false)}>
        <BlurView intensity={100} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to logout{"\n"} from this account?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setIsModalVisible2(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <MyAppButton
                title={"Yes"}
                marginTop={RFPercentage(0)}
                height={RFPercentage(5.8)}
                width={RFPercentage(17)}
                onPress={() => {
                  logout();
                  setIsModalVisible2(false);
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
  scrollContent: { width: "100%", alignItems: "center" },
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
    height: RFPercentage(25),
    justifyContent: "center",
  },
  modalText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(4),
    lineHeight: RFPercentage(3.2),
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
