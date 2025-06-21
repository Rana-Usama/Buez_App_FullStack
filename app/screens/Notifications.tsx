import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Platform, FlatList, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { createNewChat } from "../services/Chat.service";

// components
import Nav from "../components/common/Nav";

// config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";

function Notifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const currentUserId = getAuth().currentUser?.uid;
  const currentUser = useUser();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(collection(FIREBASE_DB, "notifications"), where("receiver.userId", "==", currentUserId));
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(results);
      } catch (error) {
        console.log("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  const handleStartChat = async (receiverUser) => {
    try {
      const chatId = await createNewChat(currentUserId, receiverUser.userId);
      navigation.navigate("Chat", {
        chatId: chatId,
        senderId: currentUserId,
        senderName: currentUser?.userData?.userName,
        receiver: receiverUser,
      });
    } catch (err) {
      console.log("Chat start error:", err);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`Notifications`} />
        </View>

        {/* Header */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.headerText}>Received Notifications</Text>
          <View style={styles.separator} />
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: RFPercentage(5) }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: RFPercentage(5), color: Colors.lightGrey, fontFamily: "Poppins_500Medium" }}>
              No notifications yet.
            </Text>
          }
          renderItem={({ item }) => {
            const taskDescription = item.task?.postRequest?.description || "No description";
            const shortDesc = taskDescription.length > 30 ? taskDescription.substring(0, 30) + "..." : taskDescription;
            const senderName = item.sender?.name || "Someone";
            const postedDate = new Date(item.timestamp).toDateString();
            const postedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <View style={styles.reviewCard}>
                <View style={styles.reviewTextContainer}>
                  <Image style={styles.authorAvatar} source={Icons.profile2} />
                  <View style={{ left: RFPercentage(1) }}>
                    <Text style={styles.reviewText}>{senderName} accepted your task!</Text>
                    <Text style={{ fontFamily: "Poppins_400Regular", color: Colors.lightGrey, top: RFPercentage(1.4) }}>{shortDesc}</Text>
                    <Text style={{ fontFamily: "Poppins_400Regular", color: Colors.lightGrey, top: RFPercentage(1.4) }}>Posted on: {postedDate}</Text>
                  </View>
                </View>

                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewDate}>{postedTime}</Text>
                  <TouchableOpacity
                    style={styles.authorContainer}
                    onPress={async () => {
                      await handleStartChat(item?.sender);
                    }}
                  >
                    <Image style={{ width: RFPercentage(3), height: RFPercentage(3), right: RFPercentage(0.5) }} source={Icons.messages} resizeMode="contain" />
                    <Text style={styles.authorText}>Message</Text>
                  </TouchableOpacity>
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
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    alignSelf: "center",
    elevation: 5,
    shadowColor: "rgb(96, 94, 94)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reviewTextContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "center",
    marginTop: RFPercentage(1.8),
    flexDirection: "row",
  },
  reviewText: {
    color: Colors.darkGrey2,
    textAlign: "left",
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
    top: RFPercentage(1),
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
    bottom: RFPercentage(1),
  },
});

export default Notifications;
