import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from 'expo-secure-store';

// components
import Screen from "../components/Screen";

// config
import Colors from "../config/Colors";
import { router } from "expo-router";

const onboardingData = [
  {
    image: require("../assets/Images/o1.png"),
    title: "Connecting Communities",
    description: "Find help for your everyday tasks from people around you.",
  },
  {
    image: require("../assets/Images/o2.png"),
    title: "Simplifying Assistance",
    description: "Post requests for help with chores and get responses quickly.",
  },
  {
    image: require("../assets/Images/o3.png"),
    title: "Seamless Communication",
    description: "Chat within the app to ensure smooth coordination.",
  },
];

function Onboarding(props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setActiveIndex(activeIndex + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }).start();
      });
    } else {
      router.push({pathname: '/Login'})
    }
    SecureStore.setItemAsync('onboard', '1');
  };

  const handleDotPress = (index) => {
    setActiveIndex(index);
  };

  const calculateImageHeight = () => {
    if (activeIndex === 1) {
      return Platform.OS == "android" ? RFPercentage(25.8) : RFPercentage(24);
    } else if (activeIndex === 2) {
      return RFPercentage(30);
    } else {
      return RFPercentage(29);
    }
  };
  const calculateImageWidth = () => {
    if (activeIndex === 1) {
      return "68%";
    } else if (activeIndex === 2) {
      return "60%";
    } else {
      return "55%";
    }
  };

  const renderDots = () => {
    return onboardingData.map((_, index) => (
      <TouchableOpacity
        onPress={() => handleDotPress(index)}
        key={index}
        activeOpacity={0.8}
        style={{
          marginHorizontal: RFPercentage(0.2),
          width: index === activeIndex ? RFPercentage(3) : RFPercentage(0.9),
          height: RFPercentage(0.9),
          backgroundColor: index === activeIndex ? Colors.primary : "#D1D5DB",
          borderRadius: RFPercentage(20),
        }}
      />
    ));
  };

  const renderNextButtonText = () => {
    if (activeIndex === onboardingData.length - 1) {
      return "Start";
    } else {
      return "Next";
    }
  };

  const { image, title, description } = onboardingData[activeIndex];

  return (
    <Screen style={styles.screen}>
      <Image style={{ width: RFPercentage(6.5), height: RFPercentage(9.5), marginTop: RFPercentage(3) }} source={require("../assets/Images/logo.png")} />

      {/* Body */}
      <Animated.View
        style={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          marginTop: RFPercentage(-3),
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <Image style={{ borderRadius: RFPercentage(1), width: calculateImageWidth(), height: calculateImageHeight(), marginTop: RFPercentage(18) }} source={image} />

        <View style={{ width: "90%", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ textAlign: "center", marginTop: RFPercentage(2), color: Colors.heading, fontSize: RFPercentage(2.4), fontFamily: "Poppins_600SemiBold" }}>{title}</Text>
        </View>

        <View style={{ width: "75%", justifyContent: "center", alignItems: "center", marginTop: RFPercentage(0.5) }}>
          <Text style={{ lineHeight: RFPercentage(2.7), textAlign: "center", color: "#64748B", fontSize: RFPercentage(1.7), fontFamily: "Poppins_400Regular" }}>{description}</Text>
        </View>
      </Animated.View>

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: RFPercentage(2) }}>{renderDots()}</View>

      {/* Buttons */}
      <View style={{ position: "absolute", bottom: RFPercentage(8), width: "90%", justifyContent: "center", alignItems: "center", alignSelf: "center", flexDirection: "row" }}>
        <TouchableOpacity activeOpacity={0.8} style={{ position: "absolute", left: RFPercentage(1) }} onPress={() => router.push({pathname: '/Login'})}>
          <Text style={{ color: "#475569", fontSize: RFPercentage(2.1), fontFamily: "Poppins_500Medium" }}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.nextContainer}>
          <LinearGradient
            colors={[Colors.primary, "#4557B0"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <Text style={{ color: Colors.white, fontSize: RFPercentage(1.9), fontFamily: "Poppins_500Medium" }}>{renderNextButtonText()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  nextContainer: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(100),
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
  },
});

export default Onboarding;
