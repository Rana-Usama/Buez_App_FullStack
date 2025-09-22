import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import {
  deleteGoogleAccount,
  removeCredentials,
} from "../services/Auth.service";
import { deleteCurrentUser } from "../services/Auth.service";
import * as SecureStore from "expo-secure-store";
import Nav from "../components/common/Nav";
import ToggleSwitch from "toggle-switch-react-native";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import { useExitAppOnBack } from "../utils/appBack";
import Toast from "react-native-toast-message";
import { updateDoc, doc, deleteField } from "firebase/firestore";
import ConfirmationModal from "../components/common/ConfirmationModal";
import Feather from "@expo/vector-icons/Feather";
import { getCredentials } from "../services/Auth.service";

function Settings({ navigation }) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const profileImgUrl = user?.profileImage || "";
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalVisible2, setIsModalVisible2] = useState(false);
  useExitAppOnBack();
  const [loading, setLoading] = useState(false);

  const { theme, toggleTheme } = useAppTheme();
  const [credentials, setCredentials] = useState({
    email: null,
    password: null,
  });

  useEffect(() => {
    const fetchCredentials = async () => {
      const savedCredentials = await getCredentials();
      setCredentials(savedCredentials);
    };
    fetchCredentials();
  }, []);

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
        setIsModalVisible2(true);
      },
    },
    {
      iconSource: Icons.delete,
      title: `${t("settings.txt7")}`,
      redColor: true,
      navigation: () => {
        setIsModalVisible(true);
      },
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      {/* Nav */}
      <Nav
        marginTop={
          Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)
        }
        profileImage={profileImgUrl}
        leftLogo={true}
        navigation={navigation}
        title={`${t("settings.txt9")}`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.txt, { color: theme.lightGrey }]}>{`${t(
            "settings.txt8"
          )}`}</Text>
          <View style={[styles.wrap, { backgroundColor: theme.border }]} />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.navigationWrap,
            {
              marginTop: RFPercentage(3),
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.content2}>
            <Image
              style={styles.img}
              source={Icons.language}
              tintColor={theme.heading}
            />
            <Text style={[styles.title, { color: theme.heading }]}>
              {t("settings.txt13")}
            </Text>
            <View style={{ position: "absolute", right: 0 }}>
              <ToggleSwitch
                isOn={theme.mode === "dark"}
                onColor={Colors.primary}
                offColor={"rgb(224, 224, 227)"}
                size="small"
                onToggle={toggleTheme}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Navigation List */}
        {navigationsList.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.navigation}
            activeOpacity={0.8}
            style={[
              styles.navigationWrap,
              {
                marginTop: RFPercentage(2.5),
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.content2}>
              {i === 2 ? (
                <>
                  <Feather name="globe" size={24} color={theme.heading} />
                </>
              ) : (
                <>
                  <Image
                    style={styles.img}
                    source={item.iconSource}
                    tintColor={item.redColor ? Colors.red : theme.heading}
                  />
                </>
              )}
              <Text
                style={[
                  styles.title,
                  { color: item.redColor ? Colors.red : theme.heading },
                ]}
              >
                {item.title}
              </Text>
              <MaterialIcons
                name="arrow-forward-ios"
                style={[
                  styles.icon,
                  { color: item.redColor ? Colors.red : theme.heading },
                ]}
                color={Colors.heading}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ConfirmationModal
        isVisible={isModalVisible}
        loading={loading} // pass loading to modal
        onClose={() => setIsModalVisible(false)}
        onConfirm={async () => {
          try {
            setLoading(true); // show loader
            const password2 = await SecureStore.getItemAsync("password2");
            if (password2) {
              await deleteCurrentUser(password2);
            } else {
              await deleteGoogleAccount();
            }
            await removeCredentials();
            await SecureStore.deleteItemAsync("appLanguage");
            await SecureStore.deleteItemAsync("password2");
            navigation.navigate("OnBoarding");
            setIsModalVisible(false);
          } catch (error) {
            console.log("Error deleting account:", error.message || error);
            Toast.show({
              type: "error",
              text1: "Delete Failed",
              text2: "Please try again.",
            });
          } finally {
            setLoading(false); // hide loader
          }
        }}
        title={t("settings.txt10")}
        theme={theme}
        t={t}
      />

      <ConfirmationModal
        isVisible={isModalVisible2}
        loading={loading} // pass loading to modal
        onClose={() => setIsModalVisible2(false)}
        onConfirm={async () => {
          try {
            setLoading(true); // show loader
            const currentUser = FIREBASE_AUTH.currentUser;
            if (currentUser) {
              await updateDoc(doc(FIREBASE_DB, "users", currentUser.uid), {
                token: deleteField(),
              });
            }
            await removeCredentials();
            await SecureStore.setItemAsync("loggedOut", "true");
            setIsModalVisible2(false);
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.log("Error logging out and removing token:", error);
            Toast.show({
              type: "error",
              text1: "Logout failed",
              text2: "Please try again.",
            });
          } finally {
            setLoading(false); // hide loader
          }
        }}
        title={t("settings.txt11")}
        theme={theme}
        t={t}
      />
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
  scrollContent: {
    width: "100%",
    alignItems: "center",
    paddingBottom: RFPercentage(15),
  },
  content: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(3.5),
  },
  txt: {
    color: Colors.lightGrey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  wrap: {
    width: "75%",
    height: RFPercentage(0.1),
    backgroundColor: "#F3F4F6",
    marginTop: RFPercentage(1.6),
  },
  navigationWrap: {
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(1),
    borderColor: Colors.detailsBorder,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  content2: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
  },
  img: { width: RFPercentage(2.8), height: RFPercentage(2.8) },
  title: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(1.6),
  },
  icon: { position: "absolute", right: 0, fontSize: RFPercentage(1.7) },
});

export default Settings;
