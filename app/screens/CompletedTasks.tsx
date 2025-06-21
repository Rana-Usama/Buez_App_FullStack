import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, Platform, FlatList } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

// components
import Nav from "../components/common/Nav";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import MyAppButton from "../components/common/MyAppButton";

const notificationsData = [
  {
    id: "1",
    name: "Sana Asghar",
    message: "accepted your task!",
    description: "Need help in cleaning the house!",
    datePosted: "25 Jul 2024",
    time: "9:45 PM",
  },
  {
    id: "2",
    name: "John Doe",
    message: "completed your task!",
    description: "Gardening and lawn maintenance",
    datePosted: "22 Jul 2024",
    time: "11:00 AM",
  },
  {
    id: "3",
    name: "John Doe",
    message: "completed your task!",
    description: "Gardening and lawn maintenance",
    datePosted: "22 Jul 2024",
    time: "11:00 AM",
  },
  {
    id: "4",
    name: "John Doe",
    message: "completed your task!",
    description: "Gardening and lawn maintenance",
    datePosted: "22 Jul 2024",
    time: "11:00 AM",
  },
];

function CompletedTasks({ navigation }) {
  const { t } = useTranslation();

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`Completed Tasks`} />
        </View>

        {/* My Reviews */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.headerText}>{`Completed Tasks`}</Text>
          <View style={styles.separator} />
        </View>

        {/* Review Card */}
        <FlatList
          data={notificationsData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: RFPercentage(5) }}
          renderItem={({ item }) => {
            return (
              <View style={styles.reviewCard}>
                <View style={styles.reviewTextContainer}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image style={styles.authorAvatar} source={Icons.profile2} />
                    <Text style={styles.reviewText}>Sana Asghar</Text>
                  </View>
                  <Text style={{ fontFamily: "Poppins_500Medium", color: Colors.darkGrey2, fontSize: RFPercentage(1.7) }}>Category: Cleaning</Text>
                </View>
                <View style={{ marginLeft: RFPercentage(8.5), bottom: RFPercentage(0.3) }}>
                  <Text style={{ color: Colors.darkGrey, fontFamily: "Poppins_400Regular" }}>Need help in cleaning the house!</Text>
                  <Text style={{ color: Colors.darkGrey, fontFamily: "Poppins_400Regular", fontSize: RFPercentage(1.6) }}>Completed on: 25 Jul 2024</Text>
                </View>
                <View style={{ position: "absolute", right: RFPercentage(1.6), bottom: RFPercentage(2) }}>
                  <MyAppButton title="Review" height={RFPercentage(4)} width={RFPercentage(12)} onPress={() => navigation.navigate("AddReview")} />
                </View>
              </View>
            );
          }}
        />
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
  reviewsHeader: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(3.5),
    alignSelf: "center",
  },
  headerText: {
    color: Colors.grey,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_400Regular",
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
    height: RFPercentage(20),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.white, // Important for visible shadow
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    alignSelf: "center",
    // Android shadow
    elevation: 5,

    // iOS shadow
    shadowColor: "rgb(96, 94, 94)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  reviewTextContainer: {
    width: "90%",
    justifyContent: "space-between",
    alignSelf: "center",
    marginTop: RFPercentage(1.8),
    flexDirection: "row",
    alignItems: "center",
  },
  reviewText: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
    left: RFPercentage(0.9),
  },
  reviewFooter: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "center",
    top: RFPercentage(3.9),
  },
  reviewDate: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    top: 2,
    position: "absolute",
    right: 0,
  },
  authorContainer: {
    position: "absolute",
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  authorText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  authorAvatar: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    top: RFPercentage(0.5),
  },
});

export default CompletedTasks;
