import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";

// components
import Nav from "../../components/common/Nav";
import CustomTabBar from "../../components/common/CustomTabBar";

// config
import Colors from "../../config/Colors";
import { useUser } from "../../contexts/user.context";
import { useFocusEffect } from "@react-navigation/native";

function Profile({ navigation }) {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const profileImgUrl = user?.profileImage || "";
  const userName = user?.userName || "";
  const navigationsList = [
    {
      iconSource: require("../../assets/Images/editP.png"),
      title: "Edit Profile",
      navigation: () => navigation.navigate("EditProfile"),
    },
    {
      iconSource: require("../../assets/Images/receipt.png"),
      title: "Rating & Reviews",
      navigation: () => navigation.navigate("Reviews"),
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.9)} leftLogo={true} profileImage={profileImgUrl} navigation={navigation} title="Profile" />

        {/* Profile Image */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("EditProfile")} style={{ marginTop: RFPercentage(5.5) }}>
          <Image
            style={{ width: RFPercentage(20), height: RFPercentage(20), borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.4) }}
            source={profileImgUrl ? { uri: profileImgUrl } : require("../../assets/Images/dp.png")}
          />
          <Image
            style={{ width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(20), position: "absolute", bottom: RFPercentage(-0.3), right: RFPercentage(3) }}
            source={require("../../assets/Images/edit.png")}
          />
        </TouchableOpacity>

        {/*User Name */}
        <Text style={{ color: "#57534E", fontSize: RFPercentage(2.2), fontFamily: "Poppins-Medium", marginTop: RFPercentage(2) }}>{userName}</Text>

        {/* Navigation List */}
        {navigationsList.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.navigation}
            activeOpacity={0.8}
            style={{
              width: "90%",
              marginTop: i == 0 ? RFPercentage(4) : RFPercentage(2.5),
              height: RFPercentage(6.5),
              borderRadius: RFPercentage(1),
              borderColor: Colors.detailsBorder,
              borderWidth: RFPercentage(0.1),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ width: "90%", justifyContent: "flex-start", alignItems: "center", flexDirection: "row" }}>
              <Image style={{ width: RFPercentage(2.2), height: RFPercentage(2.2) }} source={item.iconSource} />
              <Text style={{ marginLeft: RFPercentage(1.7), color: "#44403C", fontSize: RFPercentage(1.7), fontFamily: "Poppins-Regular" }}>{item.title}</Text>
              <MaterialIcons name="arrow-forward-ios" style={{ fontSize: RFPercentage(1.7), color: "#44403C", position: "absolute", right: 0 }} color={Colors.heading} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Tab */}
      <CustomTabBar homeTab={true} navigation={navigation} />
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
});

export default Profile;
