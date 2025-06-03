import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";

// components
import Screen from "../components/Screen";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";

const onboardingData = [
  {
    image: Icons.onBoarding1,
    title: "Connecting Communities",
    description: "Find help for your everyday tasks from people around you.",
  },
  {
    image: Icons.onBoarding2,
    title: "Simplifying Assistance",
    description: "Post requests for help with chores and get responses quickly.",
  },
  {
    image: Icons.onBoarding3,
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
      props.navigation.navigate("Login");
    }
    SecureStore.setItemAsync("onboard", "1");
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
      <Image style={styles.img} source={Icons.logo} />

      {/* Body */}
      <Animated.View
        style={[
          styles.body,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Image style={{ borderRadius: RFPercentage(1), width: calculateImageWidth(), height: calculateImageHeight(), marginTop: RFPercentage(18) }} source={image} />

        <View style={styles.wrapper}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.wrapper2}>
          <Text style={styles.desc}>{description}</Text>
        </View>
      </Animated.View>

      <View style={styles.dot}>{renderDots()}</View>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity activeOpacity={0.8} style={styles.skip} onPress={() => props.navigation.navigate("Login")}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.nextContainer}>
          <LinearGradient colors={[Colors.primary, "#4557B0"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
            <Text style={styles.gradientText}>{renderNextButtonText()}</Text>
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
  img: { width: RFPercentage(6.5), height: RFPercentage(9.5), marginTop: RFPercentage(3) },
  wrapper: { width: "90%", justifyContent: "center", alignItems: "center" },
  title: { textAlign: "center", marginTop: RFPercentage(2), color: Colors.heading, fontSize: RFPercentage(2.4), fontFamily: "Poppins_600SemiBold" },
  wrapper2: { width: "75%", justifyContent: "center", alignItems: "center", marginTop: RFPercentage(0.5) },
  desc: { lineHeight: RFPercentage(2.7), textAlign: "center", color: "#64748B", fontSize: RFPercentage(1.7), fontFamily: "Poppins_400Regular" },
  dot: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: RFPercentage(2) },
  buttonWrapper: { position: "absolute", bottom: RFPercentage(8), width: "90%", justifyContent: "center", alignItems: "center", alignSelf: "center", flexDirection: "row" },
  skip: { position: "absolute", left: RFPercentage(1) },
  skipText: { color: "#475569", fontSize: RFPercentage(2.1), fontFamily: "Poppins_500Medium" },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  gradientText: { color: Colors.white, fontSize: RFPercentage(1.9), fontFamily: "Poppins_500Medium" },
  body: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(-3),
  },
});

export default Onboarding;
