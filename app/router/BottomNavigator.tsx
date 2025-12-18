// navigation/BottomNavigator.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  BackHandler,
  Platform,
} from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnreadMessages } from "../contexts/unread-messages.context";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { deleteCurrentUser } from "../services/Auth.service";
import * as SecureStore from "expo-secure-store";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import Home from "../screens/Home";
import MyRequests from "../screens/MyRequests";
import PostRequest from "../screens/PostRequest";
import Messages from "../screens/Messages";
import Settings from "../screens/Settings";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useUser } from "../contexts/user.context";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import {
  deleteAppleAccount,
  deleteGoogleAccount,
  removeCredentials,
} from "../services/Auth.service";
import { updateDoc, doc, deleteField } from "firebase/firestore";
import Toast from "react-native-toast-message";
import ConfirmationModal from "../components/common/ConfirmationModal";
import DeviceInfo from "react-native-device-info";
import { LinearGradient } from "expo-linear-gradient";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Custom Drawer Content with Icons and Custom Styling
const CustomDrawerContent = (props) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const navigation = useNavigation<any>();
  const currentPlan =
    user?.planType || user?.subscription?.planInterval || "free";
  const isYearlyPlan = currentPlan === "yearly";
  const isMonthlyPlan = currentPlan === "monthly";
  const freePlan = user?.planType === "free";

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [buildNumber, setBuildNumber] = useState("");

  useEffect(() => {
    // Fetch version & build number dynamically
    const fetchVersionInfo = async () => {
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();
      setAppVersion(version);
      setBuildNumber(build);
    };

    fetchVersionInfo();
  }, []);

  const drawerItems = [
    {
      label: t("profile.txt1"),
      icon: "person-outline",
      iconType: "ionicons",
      route: "Profile",
    },
    {
      label: t("profile.txt3"),
      icon: "star-outline",
      iconType: "ionicons",
      route: "Reviews",
    },
    {
      label: t("profile.txt4"),
      icon: "check-circle-outline",
      iconType: "material",
      route: "CompletedTasks",
    },

    ...(isMonthlyPlan
      ? [
          {
            label: t("settings.txt14"),
            icon: "diamond-outline",
            iconType: "ionicons",
            route: "UpgradePlan",
          },
        ]
      : []),
    ...((isMonthlyPlan || isYearlyPlan) && !freePlan
      ? [
          {
            label: t("settings.txt1"),
            icon: "close-circle-outline",
            iconType: "ionicons",
            route: "CancelSubscription",
          },
        ]
      : []),
    {
      label: t("settings.txt7"),
      icon: "trash-outline",
      iconType: "ionicons",
      route: "TermsAndConditions",
      isDestructive: true,
      onPress: () => setIsDeleteAccountModalVisible(true),
    },
    {
      label: t("settings.txt6"),
      icon: "log-out-outline",
      iconType: "ionicons",
      route: "Logout",
      isDestructive: true,
      onPress: () => setIsLogoutModalVisible(true),
    },
  ];

  // Get the current active route
  const activeRoute = props.state?.routeNames[props.state?.index] || "MainTabs";

  const handleItemPress = (item) => {
    props.navigation.closeDrawer();
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      setTimeout(() => {
        props.navigation.navigate(item.route);
      }, 300);
    }
  };

  const cancelUserSubscription = async () => {
    if (!user?.subscriptionId) return false;

    try {
      const res = await fetch(
        "https://buez-server-khaki.vercel.app/api/cancel-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: user.subscriptionId,
            planType: currentPlan || "monthly",
          }),
        }
      );
      const result = await res.json();
      if (result.success) {
        console.log("Subscription canceled successfully");
        return true;
      }
      return false;
    } catch (err) {
      console.log("Error canceling subscription:", err);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        await updateDoc(doc(FIREBASE_DB, "users", currentUser.uid), {
          token: deleteField(),
        });
      }
      await removeCredentials();
      await SecureStore.setItemAsync("loggedOut", "true");
      setIsLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.log("Error logging out and removing token:", error);
      Toast.show({
        type: "error",
        text1: t("settings.logoutFailed") || "Logout failed",
        text2: t("settings.tryAgain") || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const password2 = await SecureStore.getItemAsync("password2");
      await cancelUserSubscription();

      const provider = user?.provider || "email";
      if (provider === "apple.com") {
        await deleteAppleAccount();
      } else if (provider === "google.com") {
        await deleteGoogleAccount();
      } else {
        await deleteCurrentUser(password2);
      }

      await removeCredentials();
      await SecureStore.deleteItemAsync("appLanguage");
      await SecureStore.deleteItemAsync("password2");
      setIsDeleteAccountModalVisible(false);
      navigation.navigate("OnBoarding");
    } catch (error) {
      console.log("Error deleting account:", error.message || error);
      Toast.show({
        type: "error",
        text1: t("settings.deleteFailed") || "Delete Failed",
        text2: t("settings.tryAgain") || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderIcon = (icon, iconType, color) => {
    if (iconType === "material") {
      return (
        <MaterialCommunityIcons
          name={icon}
          size={RFPercentage(2.5)}
          color={color}
        />
      );
    } else {
      // Default to Ionicons
      return <Ionicons name={icon} size={RFPercentage(2.5)} color={color} />;
    }
  };

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Full Gradient Background */}
        <LinearGradient
          colors={[Colors.primary, "#030a29ff"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Drawer Header */}
        <View
          style={[
            styles.drawerHeader,
            { borderBottomColor: theme.border + "40" },
          ]}
        >
          <LinearGradient
            colors={[Colors.primary, "#142477ff"]}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={
                user?.profileImage ? { uri: user?.profileImage } : Icons.dp
              }
              style={styles.userImage}
            />
          </LinearGradient>
          <Text style={[styles.userName, { color: Colors.white }]}>
            {user?.userName || "Guest User"}
          </Text>
          <Text style={[styles.userEmail, { color: theme.detailsText }]}>
            {user?.email || "guest@example.com"}
          </Text>
        </View>

        {/* Drawer Items */}
        <View style={styles.drawerItemsContainer}>
          {drawerItems.map((item, index) => {
            const isActive = activeRoute === item.route;
            const itemColor = item.isDestructive
              ? Colors.red
              : isActive
              ? "white"
              : Colors.white;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[Colors.primary, "#4557B0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeItemGradient}
                  >
                    <View style={styles.iconContainer}>
                      {renderIcon(item.icon, item.iconType, itemColor)}
                    </View>
                    <Text
                      style={[
                        styles.drawerItemText,
                        {
                          color: itemColor,
                          fontFamily: "Poppins_600SemiBold",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <View style={styles.activeIndicator} />
                  </LinearGradient>
                ) : (
                  <>
                    <View style={styles.iconContainer}>
                      {renderIcon(item.icon, item.iconType, itemColor)}
                    </View>
                    <Text
                      style={[
                        styles.drawerItemText,
                        {
                          color: itemColor,
                          fontFamily: "Poppins_500Medium",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drawer Footer */}
        <View
          style={[styles.drawerFooter, { borderTopColor: theme.border + "30" }]}
        >
          <Text style={[styles.versionText, { color: Colors.white }]}>
            {t("common.version")} {appVersion}
          </Text>
          <Text style={[styles.copyrightText, { color: Colors.white }]}>
            © {new Date().getFullYear()} {t("common.rights")}
          </Text>
        </View>
      </DrawerContentScrollView>

      <ConfirmationModal
        isVisible={isLogoutModalVisible}
        loading={isLoading}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
        title={t("settings.txt11") || "Logout"}
        theme={theme}
        t={t}
        message={false}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isVisible={isDeleteAccountModalVisible}
        loading={isLoading}
        onClose={() => setIsDeleteAccountModalVisible(false)}
        onConfirm={handleDeleteAccount}
        title={t("settings.txt10") || "Delete Account"}
        theme={theme}
        t={t}
        message={false}
      />
    </>
  );
};

// Create a Drawer Navigator that wraps the Tab Navigator
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "white",
          width: RFPercentage(35),
        },
        drawerType: "front",
        swipeEnabled: true,
        overlayColor: "rgba(0, 0, 0, 0.5)",
        drawerStatusBarAnimation: "slide",
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          drawerLabel: () => null,
          title: "",
        }}
      />
    </Drawer.Navigator>
  );
}

// Your existing Tab Navigator component
function MainTabNavigator() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName={`${t("bottomTab.txt3")}`}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name={`${t("bottomTab.txt1")}`} component={MyRequests} />
      <Tab.Screen name={`${t("bottomTab.txt2")}`} component={PostRequest} />
      <Tab.Screen name={`${t("bottomTab.txt3")}`} component={Home} />
      <Tab.Screen name={`${t("bottomTab.txt4")}`} component={Messages} />
      <Tab.Screen name={`${t("bottomTab.txt5")}`} component={Settings} />
    </Tab.Navigator>
  );
}

// Your existing CustomTabBar component
const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const screenFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { unreadCount } = useUnreadMessages();

  useEffect(() => {
    const backAction = () => {
      if (screenFocused) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [screenFocused, navigation]);

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: insets.bottom, backgroundColor: theme.detailsBorder },
      ]}
    >
      <View style={styles.labelContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              key={index}
              onPress={onPress}
              style={[styles.tabButton, isFocused && styles.activeTab]}
            >
              {route.name === `${t("bottomTab.txt3")}` ? (
                <View
                  style={{
                    bottom:
                      Platform.OS === "android"
                        ? RFPercentage(3.5)
                        : RFPercentage(2.5),
                  }}
                >
                  <Image
                    source={
                      isFocused
                        ? Icons.homeActive
                        : theme.mode === "dark"
                        ? Icons.dark_tab
                        : Icons.homeInActive
                    }
                    style={styles.middle}
                    resizeMode="contain"
                  />
                </View>
              ) : route.name === `${t("bottomTab.txt1")}` ? (
                <View>
                  <Image
                    source={isFocused ? Icons.myRequestsActive : Icons.order}
                    style={styles.imgStyle}
                    resizeMode="contain"
                  />
                </View>
              ) : route.name === `${t("bottomTab.txt2")}` ? (
                <Image
                  source={isFocused ? Icons.activePostRequest : Icons.setting}
                  style={styles.imgStyle}
                  resizeMode="contain"
                />
              ) : route.name === `${t("bottomTab.txt4")}` ? (
                <View style={{}}>
                  <Image
                    source={isFocused ? Icons.activeMessages : Icons.vehicle}
                    style={styles.imgStyle}
                    resizeMode="contain"
                  />
                  {unreadCount > 0 && (
                    <View
                      style={[
                        styles.count,
                        unreadCount > 9 && {
                          paddingHorizontal: RFPercentage(0.5),
                          minWidth: RFPercentage(2.8),
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: RFPercentage(1.3),
                          fontFamily: "Poppins_400Regular",
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Image
                  source={isFocused ? Icons.settingsActive : Icons.profile}
                  style={styles.imgStyle}
                  resizeMode="contain"
                />
              )}
              <Text
                style={{
                  color: isFocused ? theme.primary : theme.detailsText,
                  fontSize: RFPercentage(1.4),
                  top:
                    route.name === `${t("bottomTab.txt3")}`
                      ? RFPercentage(-2)
                      : RFPercentage(0.5),
                  fontFamily: isFocused
                    ? "Poppins_500Medium"
                    : "Poppins_500Medium",
                }}
              >
                {label.length > 9 ? label.slice(0, 9) + `..` : label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Export the DrawerNavigator instead of TabNavigator
export default DrawerNavigator;

const styles = StyleSheet.create({
  // Tab Bar Styles
  tabBarContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: Platform.OS === "ios" ? RFPercentage(10) : RFPercentage(10),
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
  },
  activeTab: {
    fontWeight: "bold",
  },
  labelContainer: {
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: "100%",
    top: Platform.OS === "ios" ? RFPercentage(0.6) : 0,
  },
  middle: {
    width: Platform.OS === "ios" ? RFPercentage(7.5) : RFPercentage(8.5),
    height: Platform.OS === "ios" ? RFPercentage(7.5) : RFPercentage(8.5),
  },
  imgStyle: {
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
  count: {
    position: "absolute",
    top: RFPercentage(-0.8),
    right: RFPercentage(-0.8),
    backgroundColor: Colors.primary,
    borderRadius: RFPercentage(100),
    width: RFPercentage(2),
    height: RFPercentage(2),
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  avatarGradient: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  avatarContainer: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  gradientHeader: {
    paddingVertical: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  drawerItemsGradient: {
    flex: 1,
    paddingTop: RFPercentage(2),
  },
  activeDrawerItem: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: RFPercentage(1),
    marginVertical: RFPercentage(0.5),
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activeItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderRadius: 12,
  },
  activeIndicator: {
    position: "absolute",
    right: RFPercentage(2),
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: RFPercentage(0.4),
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  // Option 3 Glassmorphism Styles
  avatarGlassContainer: {
    marginBottom: RFPercentage(1),
  },
  avatarGlassBorder: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  drawerItemContainer: {
    marginHorizontal: RFPercentage(1),
    marginVertical: RFPercentage(0.5),
    borderRadius: 12,
    overflow: "hidden",
  },
  activeGlassItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderRadius: 12,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inactiveGlassItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderRadius: 12,
  },

  // Original Styles (keep these)
  drawerHeader: {
    paddingVertical: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
    borderBottomWidth: 1,
  },
  userImage: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(100),
    borderWidth: 2,
    borderColor: "white",
  },
  userName: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(1),
  },
  userEmail: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.5),
  },
  drawerItemsContainer: {
    paddingVertical: RFPercentage(1),
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    // marginHorizontal: RFPercentage(1),
    marginVertical: RFPercentage(0.5),
    borderRadius: 12,
  },
  iconContainer: {
    width: RFPercentage(3),
    marginRight: RFPercentage(1.5),
  },
  drawerItemText: {
    fontSize: RFPercentage(1.6),
    flex: 1,
  },
  drawerFooter: {
    padding: RFPercentage(2),
    borderTopWidth: 1,
    marginTop: "auto",
  },
  versionText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(0.5),
  },
  copyrightText: {
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});
