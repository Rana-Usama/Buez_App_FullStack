import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, Keyboard } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RFPercentage } from "react-native-responsive-fontsize";

// Screens
import Home from "../screens/Home";
import MyRequests from "../screens/MyRequests";
import PostRequest from "../screens/PostRequest";
import Messages from "../screens/Messages";
import Settings from "../screens/Settings";

// Configs
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";



const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName={`${t("bottomTab.txt3")}`}
      screenOptions={({ route }) => ({
        tabBarButton: (props) => <TouchableOpacity activeOpacity={1} {...props} />,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: isKeyboardVisible ? 0 : RFPercentage(10.5),
          borderTopColor: theme.detailsBorder,
          backgroundColor: theme.detailsBorder,
          borderTopWidth: 0,
        },
        tabBarIcon: ({ focused }) => {
          let icon;
          switch (route.name) {
            case `${t("bottomTab.txt3")}`:
              icon = focused ? Icons.homeActive : theme.mode === "dark" ? Icons.dark_tab : Icons.homeInActive;
              break;
            case `${t("bottomTab.txt1")}`:
              icon = focused ? Icons.myRequestsActive : Icons.order;
              break;
            case `${t("bottomTab.txt2")}`:
              icon = focused ? Icons.activePostRequest : Icons.setting;
              break;
            case `${t("bottomTab.txt4")}`:
              icon = focused ? Icons.activeMessages : Icons.vehicle;
              break;
            case `${t("bottomTab.txt5")}`:
              icon = focused ? Icons.settingsActive : Icons.profile;
              break;
          }

          const isMiddle = route.name === `${t("bottomTab.txt3")}`;

          return (
            <Image
              source={icon}
              style={{
                width: isMiddle ? RFPercentage(8) : RFPercentage(3),
                height: isMiddle ? RFPercentage(8) : RFPercentage(3),
                bottom: isMiddle ? (isKeyboardVisible ? RFPercentage(-1.5) : RFPercentage(2)) : RFPercentage(-0.6),
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarLabel: ({ focused }) => {
          let label = route.name;
          return (
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: RFPercentage(1.5),
                color: focused ? theme.primary : theme.detailsText,
                top: RFPercentage(1),
                width: RFPercentage(9),
                textAlign: "center",
              }}
            >
              {label}
            </Text>
          );
        },
      })}
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
