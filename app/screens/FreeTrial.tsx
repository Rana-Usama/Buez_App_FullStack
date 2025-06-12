import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import Screen from "../components/Screen";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "../components/common/MyAppButton";
import { useNavigation } from "@react-navigation/native";

const FreeTrial = () => {
  const navigation = useNavigation()
  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={Icons.logo} />
      <View style={{ marginTop: RFPercentage(4), width: "100%" }}>
        <Text style={{ color: Colors.primary, fontSize: RFPercentage(2.2), fontFamily: "Poppins_700Bold", textAlign: "center" }}>Activate Your 14-day free trial!</Text>
        <Text style={{ color: Colors.grey, fontSize: RFPercentage(2), fontFamily: "Poppins_500Medium", textAlign: "center", top: RFPercentage(2) }}>🎁 How the Free Trial Works</Text>
        <View style={{ marginTop: RFPercentage(4), width: "90%", alignSelf: "center", marginLeft: RFPercentage(3) }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: RFPercentage(6), height: RFPercentage(6), alignItems: "center", justifyContent: "center", backgroundColor: "#E5E7EB", borderRadius: RFPercentage(100) }}>
              <Image source={Icons.key} resizeMode="contain" style={{ width: RFPercentage(3), height: RFPercentage(3) }} />
            </View>
            <View style={{ marginLeft: RFPercentage(2), width: RFPercentage(30), top: RFPercentage(3) }}>
              <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins_700Bold" }}>Today</Text>
              <Text style={{ color: Colors.grey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" }}>Unlock full access — enjoy all features of the app, completely free.</Text>
            </View>
          </View>
          <View style={{ width: RFPercentage(0.8), height: RFPercentage(12), backgroundColor: "#F3F4F6", bottom: RFPercentage(2.6), left: RFPercentage(2.4) }}></View>

          {/* 2nddddddddd */}
          <View style={{ flexDirection: "row", alignItems: "center", bottom: RFPercentage(6) }}>
            <View style={{ width: RFPercentage(6), height: RFPercentage(6), alignItems: "center", justifyContent: "center", backgroundColor: "#E5E7EB", borderRadius: RFPercentage(100) }}>
              <Image source={Icons.notify} resizeMode="contain" style={{ width: RFPercentage(3), height: RFPercentage(3) }} />
            </View>
            <View style={{ marginLeft: RFPercentage(2), width: RFPercentage(30), top: RFPercentage(1.5) }}>
              <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins_700Bold" }}>In 10 days</Text>
              <Text style={{ color: Colors.grey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" }}>We’ll let you know as your trial nears its end — stay informed.</Text>
            </View>
          </View>
          <View style={{ width: RFPercentage(0.8), height: RFPercentage(12), backgroundColor: "#F3F4F6", bottom: RFPercentage(7.6), left: RFPercentage(2.4) }}></View>

          {/* 3rddddddddddddd */}
          <View style={{ flexDirection: "row", alignItems: "center", bottom: RFPercentage(12.5) }}>
            <View style={{ width: RFPercentage(6), height: RFPercentage(6), alignItems: "center", justifyContent: "center", backgroundColor: "#E5E7EB", borderRadius: RFPercentage(100) }}>
              <Image source={Icons.star} resizeMode="contain" style={{ width: RFPercentage(3), height: RFPercentage(3) }} />
            </View>
            <View style={{ marginLeft: RFPercentage(2), width: RFPercentage(30), top: RFPercentage(3) }}>
              <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.9), fontFamily: "Poppins_700Bold" }}>In 14 days</Text>
              <Text style={{ color: Colors.grey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" }}>
                Your subscription begins automatically. Cancel anytime before then to avoid charges.
              </Text>
            </View>
          </View>
          <View style={{ width: RFPercentage(0.8), height: RFPercentage(12), backgroundColor: "#F3F4F6", bottom: RFPercentage(15.2), left: RFPercentage(2.4) }}></View>
        </View>
      </View>
      <MyAppButton title="Start Free Trial" marginTop={RFPercentage(-10)} onPress={() => navigation.navigate("SubscriptionV2")} />
    </Screen>
  );
};

export default FreeTrial;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(3),
  },
});
