import React from "react";
import { Image, View, TouchableOpacity, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

//config
import Colors from "../../config/Colors";
import { router } from "expo-router";

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
    <View
      style={{
        borderTopRightRadius: RFPercentage(3),
        borderTopLeftRadius: RFPercentage(3),
        width: "100%",
        height: RFPercentage(9.7),
        backgroundColor: Colors.detailsBorder,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push({pathname: "/Home"})}
        style={{
          width: RFPercentage(8),
          height: RFPercentage(8),
          borderRadius: RFPercentage(200),
          backgroundColor: homeTab ? Colors.primary : "#D1D5DB",
          borderColor: Colors.white,
          borderWidth: RFPercentage(0.4),
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: RFPercentage(-3.8),
        }}
      >
        <Image style={{ width: RFPercentage(3), height: RFPercentage(3) }} source={require("../../assets/Images/homeTab.png")} />
      </TouchableOpacity>
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", width: "90%" }}>
        <View style={{ position: "absolute", left: RFPercentage(2.1), justifyContent: "center", alignItems: "center", flexDirection: "row" }}>
          {/* Orders */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({pathname: "/MyRequests"})} style={{ justifyContent: "center", alignItems: "center" }}>
            <Image
              style={{ width: RFPercentage(2.9), height: RFPercentage(2.9) }}
              source={myRequests ? require("../../assets/Images/myRequestsActive.png") : require("../../assets/Images/order.png")}
            />
            <Text style={{ fontFamily: "Poppins_500Medium", marginTop: RFPercentage(0.2), color: myRequests ? Colors.primary : Colors.detailsText, fontSize: RFPercentage(1.5) }}>My Req</Text>
          </TouchableOpacity>
          {/* Settings */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({pathname: "/PostRequest"})} style={{ marginLeft: RFPercentage(4), justifyContent: "center", alignItems: "center" }}>
            <Image
              style={{ width: RFPercentage(2.9), height: RFPercentage(2.9) }}
              source={postRequest ? require("../../assets/Images/activePostRequest.png") : require("../../assets/Images/setting.png")}
            />
            <Text style={{ fontFamily: "Poppins_500Medium", marginTop: RFPercentage(0.2), color: postRequest ? Colors.primary : Colors.detailsText, fontSize: RFPercentage(1.5) }}>Post Req</Text>
          </TouchableOpacity>
        </View>

        <View style={{ position: "absolute", right: RFPercentage(1), justifyContent: "center", alignItems: "center", flexDirection: "row" }}>
          {/* Vehicle */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({pathname: "/Messages"})} style={{ marginLeft: RFPercentage(4), justifyContent: "center", alignItems: "center" }}>
            <Image
              style={{ width: RFPercentage(2.9), height: RFPercentage(2.9) }}
              source={messagesTab ? require("../../assets/Images/activeMessages.png") : require("../../assets/Images/vehicle.png")}
            />
            <Text style={{ fontFamily: "Poppins_500Medium", marginTop: RFPercentage(0.2), color: messagesTab ? Colors.primary : Colors.detailsText, fontSize: RFPercentage(1.5) }}>Messages</Text>
          </TouchableOpacity>
          {/* Profile */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({pathname: "/Settings"})} style={{ marginLeft: RFPercentage(4), justifyContent: "center", alignItems: "center" }}>
            <Image
              style={{ width: RFPercentage(2.9), height: RFPercentage(2.9) }}
              source={settingTab ? require("../../assets/Images/settingsActive.png") : require("../../assets/Images/profile.png")}
            />
            <Text style={{ fontFamily: "Poppins_500Medium", marginTop: RFPercentage(0.2), color: settingTab ? Colors.primary : Colors.detailsText, fontSize: RFPercentage(1.5) }}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CustomTabBar;
