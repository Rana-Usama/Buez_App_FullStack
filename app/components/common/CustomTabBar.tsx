import React, { useState, useEffect } from "react";
import { Image, View, TouchableOpacity, Text, StyleSheet, ImageSourcePropType, Keyboard } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// config
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";

interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
  props?: any;
  challengeTab?: boolean;
  postRequest?: boolean;
  profileTab?: boolean;
  settingTab?: boolean;
  homeTab?: boolean;
  orderTab?: boolean;
  vehiclesTab?: boolean;
  newsTab?: boolean;
  myRequests?: boolean;
  messagesTab?: boolean;
}

const CustomTabBar: React.FC<Props> = ({
  navigation,
  props,
  challengeTab = false,
  postRequest = false,
  profileTab = false,
  settingTab = false,
  homeTab = false,
  orderTab = false,
  vehiclesTab = false,
  newsTab = false,
  myRequests = false,
  messagesTab = false,
}) => {


  const [keyboardVisible, setKeyboardVisible] = useState(false);
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

  if (keyboardVisible) {
    return null;
  }

  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Home")}
        style={[
          styles.content,
          {
            backgroundColor: homeTab ? Colors.primary : "#D1D5DB",
          },
        ]}
      >
        <Image style={styles.home} source={Icons.homeTab as ImageSourcePropType} />
      </TouchableOpacity>

      <View style={styles.wrapper}>
        <View style={styles.inner}>
          {/* My Requests */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("MyRequests")} style={styles.touchable}>
            <Image style={styles.icon} source={(myRequests ? Icons.myRequestsActive : Icons.order) as ImageSourcePropType} />
            <Text style={[styles.req, { color: myRequests ? Colors.primary : Colors.detailsText }]}>My Req</Text>
          </TouchableOpacity>

          {/* Post Request */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("PostRequest")} style={styles.touchable2}>
            <Image style={styles.icon} source={(postRequest ? Icons.activePostRequest : Icons.setting) as ImageSourcePropType} />
            <Text style={[styles.req, { color: postRequest ? Colors.primary : Colors.detailsText }]}>Post Req</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inner2}>
          {/* Messages */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Messages")} style={styles.touchable2}>
            <Image style={styles.icon} source={(messagesTab ? Icons.activeMessages : Icons.vehicle) as ImageSourcePropType} />
            <Text style={[styles.req, { color: messagesTab ? Colors.primary : Colors.detailsText }]}>Messages</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Settings")} style={styles.touchable2}>
            <Image style={styles.icon} source={(settingTab ? Icons.settingsActive : Icons.profile) as ImageSourcePropType} />
            <Text style={[styles.req, { color: settingTab ? Colors.primary : Colors.detailsText }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopRightRadius: RFPercentage(3),
    borderTopLeftRadius: RFPercentage(3),
    width: "100%",
    height: RFPercentage(9.7),
    backgroundColor: Colors.detailsBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    borderColor: Colors.white,
    borderWidth: RFPercentage(0.4),
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: RFPercentage(-3.8),
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(200),
  },
  home: { width: RFPercentage(3), height: RFPercentage(3) },
  wrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  inner: {
    position: "absolute",
    left: RFPercentage(2.1),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  touchable: { justifyContent: "center", alignItems: "center" },
  icon: { width: RFPercentage(2.9), height: RFPercentage(2.9) },
  req: {
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(0.2),
    fontSize: RFPercentage(1.5),
  },
  touchable2: {
    marginLeft: RFPercentage(4),
    justifyContent: "center",
    alignItems: "center",
  },
  inner2: {
    position: "absolute",
    right: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
});

export default CustomTabBar;
