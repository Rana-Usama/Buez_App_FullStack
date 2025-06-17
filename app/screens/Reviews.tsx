import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";

function Reviews({ navigation }) {
  const { t } = useTranslation();

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`${t("profile.txt3")}`} />

        {/* My Reviews */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.headerText}>{`${t("reviews.txt1")}`}</Text>
          <View style={styles.separator} />
        </View>

        {/* Review Card */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewText}>It was fun to do gardening with Jake.</Text>
          </View>
          <View style={styles.reviewFooter}>
            <Text style={styles.reviewDate}>{`${t("reviews.txt2")}`} 25 Jul 2024</Text>
            <View style={styles.authorContainer}>
              <Text style={styles.authorText}>{`${t("reviews.txt3")}`} Jhon Brown</Text>
              <Image style={styles.authorAvatar} source={Icons.profile2} />
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Bottom Tab */}
      {/* <CustomTabBar settingTab={true} navigation={navigation} /> */}
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
    alignItems: "center",
  },
  reviewsHeader: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(3.5),
  },
  headerText: {
    color: Colors.grey,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins-Regular",
  },
  separator: {
    width: "75%",
    height: RFPercentage(0.1),
    backgroundColor: "#F3F4F6",
    marginTop: RFPercentage(1),
  },
  reviewCard: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(4),
    width: "90%",
    height: RFPercentage(14),
    borderRadius: RFPercentage(1),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
  },
  reviewTextContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "center",
    marginTop: RFPercentage(1.6),
  },
  reviewText: {
    color: Colors.darkGrey2,
    textAlign: "left",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  reviewFooter: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "center",
    bottom: RFPercentage(2),
    position: "absolute",
  },
  reviewDate: {
    color: Colors.darkGrey,
    textAlign: "left",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  authorContainer: {
    position: "absolute",
    right: 0,
    top: RFPercentage(-1),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  authorText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  authorAvatar: {
    marginLeft: RFPercentage(1),
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
  },
});

export default Reviews;
