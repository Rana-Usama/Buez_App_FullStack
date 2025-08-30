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
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnreadMessages } from "../contexts/unread-messages.context";

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

const Tab = createBottomTabNavigator();

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const screenFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { unreadCount } = useUnreadMessages();


  console.log("unreadCount......",unreadCount)


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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (isKeyboardVisible) return null;

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
                      ? RFPercentage(-2.2)
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

const TabNavigator: React.FC = () => {
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
};

export default TabNavigator;

const styles = StyleSheet.create({
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
});
