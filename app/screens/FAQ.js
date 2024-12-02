import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, LayoutAnimation, Platform, UIManager, TouchableOpacity, ScrollView, Switch } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";

function FAQ({ navigation }) {
  const [faqs, setFaqs] = useState([
    {
      question: "What areas do you serve?",
      answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.`,
    },
    {
      question: "Can I post my own requests?",
      answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.`,
    },
    {
      question: "Can I cancel a request after I accept it?",
      answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.`,
    },
    {
      question: "Can I leave a review to requester?",
      answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.`,
    },
  ]);

  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleFAQ = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.9)} navigation={navigation} title="FAQ's" />

        <View style={{ marginTop: RFPercentage(3.2), width: "90%" }}>
          {faqs.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                onPress={() => toggleFAQ(index)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                  width: "100%",
                  marginTop: !index == 0 ? RFPercentage(2.5) : 0,
                  paddingVertical: RFPercentage(1.2),
                }}
              >
                <View style={{ width: "95%" }}>
                  <Text
                    style={{
                      fontSize: RFPercentage(1.8),
                      color: "#334155",
                      fontFamily: "Poppins-Regular",
                      textAlign: "left",
                    }}
                  >
                    {item.question}
                  </Text>
                </View>

                <MaterialIcons
                  name={expandedIndex === index ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  style={{
                    fontSize: RFPercentage(3),
                    color: "#57534E",
                    position: "absolute",
                    right: 0,
                  }}
                />
              </TouchableOpacity>
              {expandedIndex === index && (
                <Text
                  style={{
                    marginTop: RFPercentage(1),
                    fontSize: RFPercentage(1.7),
                    color: "#64748B",
                    textAlign: "justify",
                    fontFamily: "Poppins-Regular",
                  }}
                >
                  {item.answer}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Tab */}
      <CustomTabBar settingTab={true} navigation={navigation} />
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

export default FAQ;
