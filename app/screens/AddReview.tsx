import React, { useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Platform, TouchableOpacity, TextInput } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import FontAwesome from "@expo/vector-icons/FontAwesome";

// components
import Nav from "../components/common/Nav";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import MyAppButton from "../components/common/MyAppButton";

function AddReview({ navigation }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState([false, false, false, false, false]);
  const [reviewText, setReviewText] = useState("");

  const handleStarPress = (index) => {
    const newRating = [...rating];
    newRating[index] = !newRating[index]; // toggle that star
    setRating(newRating);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`Add Review`} />
        </View>

        {/* Profile Section */}
        <View style={{ width: "90%", alignSelf: "center", marginTop: RFPercentage(4) }}>
          <Image
            source={Icons.profile2}
            resizeMode="contain"
            style={{
              width: RFPercentage(14),
              height: RFPercentage(14),
              borderWidth: 1.5,
              borderColor: Colors.primary,
              borderRadius: RFPercentage(100),
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop:RFPercentage(2) }}>
            <Text style={styles.nameText}>Sana Asghar</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={Icons.messages} resizeMode="contain" style={styles.messageIcon} />
              <Text style={styles.messageText}>Message</Text>
            </View>
          </View>
          <Text style={styles.descText}>Need help in cleaning the house!</Text>
          <Text style={styles.completedText}>Completed on: 25 Jul 2024</Text>
        </View>

        {/* Star Rating Section */}
        <View style={styles.ratingContainer}>
          <Text style={styles.experienceText}>How Was Your Experience?</Text>
          <View style={styles.starRow}>
            {rating.map((selected, index) => (
              <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                <FontAwesome name="star" size={30} color={selected ? "#F3CF2C" : "#D1D5DB"} style={{ marginHorizontal: 5 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ width: "90%", alignItems: "center", alignSelf: "center", marginTop: RFPercentage(4) }}>
          <TextInput
            value={reviewText}
            onChangeText={(text) => {
              if (text.length <= 180) {
                setReviewText(text);
              }
            }}
            placeholder="Share your thoughts..."
            multiline
            placeholderTextColor={'rgba(169, 166, 166, 0.7)'}
            maxLength={180}
            style={{
              borderWidth: 1,
              width: "100%",
              height: RFPercentage(15),
              borderRadius: RFPercentage(1.6),
              borderColor: 'rgba(169, 166, 166, 0.7)',
              padding: RFPercentage(1.4),
              fontFamily: "Poppins_400Regular",
              textAlignVertical: "top",

            }}
          />
          <View style={{ width: "100%", alignItems: "flex-end", marginTop: RFPercentage(0.8) , bottom:RFPercentage(3.5), right:RFPercentage(1)}}>
            <Text style={{ fontSize: RFPercentage(1.7), color: Colors.lightGrey, fontFamily: "Poppins_400Regular" }}>{reviewText.length} / 180</Text>
          </View>

          <View>
            <MyAppButton title="Add Review"  />
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    width: "100%",
  },
  nameText: {
    color: Colors.darkGrey2,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(2.3),
    // marginTop: RFPercentage(2),
  },
  messageIcon: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    right: RFPercentage(0.7),
  },
  messageText: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.8),
  },
  descText: {
    color: Colors.grey,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.9),
    marginTop: RFPercentage(1),
  },
  completedText: {
    color: Colors.grey,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(0.5),
  },
  ratingContainer: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: RFPercentage(6),
  },
  experienceText: {
    color: Colors.darkGrey2,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AddReview;
