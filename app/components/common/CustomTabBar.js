import React from "react";
import { Image, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

//config
import Colors from "../../config/Colors";

const CustomTabBar = ({
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
        <Image style={styles.home} source={require("../../../assets/Images/homeTab.png")} />
      </TouchableOpacity>
      <View style={styles.wrapper}>
        <View style={styles.inner}>
          {/* Orders */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("MyRequests")} style={styles.touchable}>
            <Image style={styles.icon} source={myRequests ? require("../../../assets/Images/myRequestsActive.png") : require("../../../assets/Images/order.png")} />
            <Text style={[styles.req, { color: myRequests ? Colors.primary : Colors.detailsText }]}>My Req</Text>
          </TouchableOpacity>
          {/* Settings */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("PostRequest")} style={styles.touchable2}>
            <Image style={styles.icon} source={postRequest ? require("../../../assets/Images/activePostRequest.png") : require("../../../assets/Images/setting.png")} />
            <Text style={[styles.req, { color: postRequest ? Colors.primary : Colors.detailsText }]}>Post Req</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inner2}>
          {/* Vehicle */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Messages")} style={styles.touchable2}>
            <Image style={styles.icon} source={messagesTab ? require("../../../assets/Images/activeMessages.png") : require("../../../assets/Images/vehicle.png")} />
            <Text style={[styles.req, { color: messagesTab ? Colors.primary : Colors.detailsText }]}>Messages</Text>
          </TouchableOpacity>
          {/* Profile */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Settings")} style={styles.touchable2}>
            <Image style={styles.icon} source={settingTab ? require("../../../assets/Images/settingsActive.png") : require("../../../assets/Images/profile.png")} />
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
  wrapper: { flexDirection: "row", justifyContent: "center", alignItems: "center", width: "90%" },
  inner: { position: "absolute", left: RFPercentage(2.1), justifyContent: "center", alignItems: "center", flexDirection: "row" },
  touchable: { justifyContent: "center", alignItems: "center" },
  icon: { width: RFPercentage(2.9), height: RFPercentage(2.9) },
  req: { fontFamily: "Poppins_500Medium", marginTop: RFPercentage(0.2), fontSize: RFPercentage(1.5) },
  touchable2: { marginLeft: RFPercentage(4), justifyContent: "center", alignItems: "center" },
  inner2: { position: "absolute", right: RFPercentage(1), justifyContent: "center", alignItems: "center", flexDirection: "row" },
});

export default CustomTabBar;
