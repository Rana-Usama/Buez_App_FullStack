import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Platform, StatusBar } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import LottieView from "lottie-react-native";
import i18n from "../translation/i18n";
// components
import Screen from "../components/Screen";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function Onboarding(props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  useEffect(() => {
    console.log("i18n is initialized:", i18n.isInitialized);
  }, []);

  const onboardingData = [
    {
      image: Icons.onBoarding1,
      title: `${t("onBoarding.onBoarding1.Title")}`,
      description: `${t("onBoarding.onBoarding1.Desc")}`,
      lottie: require("../../assets/lottie/firstv2.json"),
    },

    {
      image: Icons.onBoarding1,
      title: `${t("onBoarding.onBoarding2.Title")}`,
      description: `${t("onBoarding.onBoarding2.Desc")}`,
      lottie: require("../../assets/lottie/OnBoarding1.json"),
    },
    {
      image: Icons.onBoarding1,
      title: `${t("onBoarding.onBoarding3.Title")}`,
      description: `${t("onBoarding.onBoarding3.Desc")}`,
      lottie: require("../../assets/lottie/chatMob.json"),
    },
    {
      image: Icons.onBoarding2,
      title: `${t("onBoarding.onBoarding4.Title")}`,
      description: `${t("onBoarding.onBoarding4.Desc")}`,
      lottie: require("../../assets/lottie/gift2.json"),
    },
    {
      image: Icons.onBoarding3,
      title: `${t("onBoarding.onBoarding5.Title")}`,
      description: `${t("onBoarding.onBoarding5.Desc")}`,
      lottie: require("../../assets/lottie/pay2.json"),
    },
  ];

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

  const renderDots = () => {
    return onboardingData.map((_, index) => (
      <TouchableOpacity
        onPress={() => handleDotPress(index)}
        key={index}
        activeOpacity={0.8}
        style={{
          marginHorizontal: RFPercentage(0.3),
          width: index === activeIndex ? RFPercentage(3) : RFPercentage(0.9),
          height: RFPercentage(0.9),
          backgroundColor: index === activeIndex ? theme.primary : theme.stroke,
          borderRadius: RFPercentage(20),
        }}
      />
    ));
  };

  const renderNextButtonText = () => {
    if (activeIndex === onboardingData.length - 1) {
      return `${t("buttons.start")}`;
    } else {
      return `${t("buttons.next")}`;
    }
  };

  const { lottie, title, description } = onboardingData[activeIndex];

  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(buttonScale, {
      toValue: 1 + activeIndex * 0.1, // increase size with index
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}  backgroundColor={theme.white} />
      <Image style={styles.img} source={Icons.logo} />

      {/* Body */}
      <View style={{ width: "90%", alignItems: "center", justifyContent: "center", marginTop: RFPercentage(8), position: "absolute", top: RFPercentage(10) }}>
        <LottieView source={lottie} autoPlay loop style={{ width: RFPercentage(40), height: activeIndex === 2 ? RFPercentage(34) : RFPercentage(40) }} />
      </View>
      <View style={{ top: RFPercentage(45), alignItems: "center", justifyContent: "center" }}>
        <View style={styles.wrapper}>
          <Text style={[styles.title, {color:theme.heading}]}>{title}</Text>
        </View>

        <View style={styles.wrapper2}>
          <Text style={[styles.desc, {color:theme.desc}]}>{description}</Text>
        </View>
        <View style={styles.dot}>{renderDots()}</View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity activeOpacity={0.8} style={styles.skip} onPress={() => props.navigation.navigate("Login")}>
          <Text style={[styles.skipText, {color:theme.skip}]}>{`${t("buttons.skip")}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.nextContainer}>
          <LinearGradient colors={[Colors.primary, "#4557B0"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
            <Text style={[styles.gradientText, {color:theme.pureWhite}]}>{renderNextButtonText()}</Text>
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
  buttonWrapper: { position: "absolute", bottom: RFPercentage(10), width: "90%", justifyContent: "center", alignItems: "center", alignSelf: "center", flexDirection: "row" },
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
