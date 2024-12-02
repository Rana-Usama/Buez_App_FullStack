import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Screen from "../components/Screen";
import InputField from "../components/common/AuthInputField";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";

function Subscription(props) {
  const [indicator, showIndicator] = useState(false);
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Email",
      value: "",
    },
    {
      placeholder: "Password",
      value: "",
      secure: true,
    },
  ]);

  const handleChange = (text, i) => {
    let tempFields = [...inputField];
    tempFields[i].value = text;
    SetInputField(tempFields);
  };

  const handleLogin = () => {
    showIndicator(true);
    let tempFields = [...inputField];

    if (tempFields[0].value === "" || tempFields[1].value === "") {
      alert("Please fill all the fields to proceed");
      showIndicator(false);
      return true;
    }
    try {
      // Add login logic here
    } catch (error) {
      alert("Error");
    }
    showIndicator(false);
  };

  const [remember, setRemember] = useState(false);
  const toggleRemember = () => {
    setRemember(!remember);
  };

  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={require("../../assets/Images/logo.png")} />
      <Image style={styles.vector} source={require("../../assets/Images/vec.png")} />

      <View style={styles.premiumInfo}>
        <Image style={styles.crownIcon} source={require("../../assets/Images/crown.png")} />
        <Text style={styles.premiumText}>Buy our premium to access full services</Text>
      </View>

      <View style={styles.subscriptionContainer}>
        <View style={styles.priceContainer}>
          <Image style={styles.starIconLeft} source={require("../../assets/Images/stars.png")} />
          <Text style={styles.priceText}>
            $12<Text style={styles.priceSubText}>.99/month</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>⊙ Post daily chore requests</Text>
          <Text style={styles.detailText}>⊙ See requests daily</Text>
          <Text style={styles.detailText}>⊙ Earn money by doing daily chores</Text>
          <Text style={styles.detailText}>⊙ Cancel anytime</Text>
        </View>

        <View style={[styles.starContainer, { bottom: RFPercentage(1) }]}>
          <Image style={styles.starIconRight} source={require("../../assets/Images/stars.png")} />
        </View>
      </View>

      <MyAppButton title={"Checkout"} marginTop={RFPercentage(7)} onPress={() => props.navigation.navigate("Home")} />
    </Screen>
  );
}

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
  vector: {
    marginTop: RFPercentage(3),
    width: RFPercentage(20),
    height: RFPercentage(20),
  },
  premiumInfo: {
    marginTop: RFPercentage(4),
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  crownIcon: {
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
  premiumText: {
    marginLeft: RFPercentage(1),
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.9),
  },
  subscriptionContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "90%",
    height: RFPercentage(30),
    borderColor: Colors.stroke,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(3),
  },
  priceContainer: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },
  starIconLeft: {
    position: "absolute",
    left: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
  priceText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(4.2),
    fontFamily: "Poppins_500Medium",
  },
  priceSubText: {
    fontSize: RFPercentage(1.8),
  },
  divider: {
    width: "100%",
    height: RFPercentage(0.1),
    borderColor: Colors.stroke,
    borderWidth: RFPercentage(0.1),
    marginTop: RFPercentage(1.5),
  },
  detailsContainer: {
    marginTop: RFPercentage(2),
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  detailText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    marginTop: RFPercentage(1.3),
  },
  starContainer: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  starIconRight: {
    position: "absolute",
    right: RFPercentage(-1.5),
    width: RFPercentage(6),
    height: RFPercentage(6),
  },
});

export default Subscription;
