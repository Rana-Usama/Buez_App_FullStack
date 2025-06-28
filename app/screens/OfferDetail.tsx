import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, FlatList, Dimensions, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc } from "firebase/firestore";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";
import MyAppButton from "../components/common/MyAppButton";
import { getDateTime } from "../services/Shared.service";
import { createNewChat } from "../services/Chat.service";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { translateText } from "../translation/googleTranslation";
import { FIREBASE_DB } from "../../firebaseConfig";

const screenWidth = Dimensions.get("window").width;

function OfferDetail({ navigation, route }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;
  const postRequest = route.params?.postRequest;
  const [showAll, setShowAll] = useState(false);
  const reviews = postRequest?.reviews || [];
  const db = FIREBASE_DB;
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedReviews, setTranslatedReviews] = useState([]);
  const [translatedOffer, setTranslatedOffer] = useState({
    taskType: "",
    description: "",
    otherCompensation: "",
  });
  const [loading, setLoading] = useState(false);
  const visibleReviews = showAll ? translatedReviews : translatedReviews.slice(0, 3);
  const hiddenCount = translatedReviews.length - 3;
  const [averageRating, setAverageRating] = useState(null);

  useEffect(() => {
    const translateOfferData = async () => {
      const [translatedTaskType, translatedDescription, translatedCompensation] = await Promise.all([
        translateText(postRequest.taskType || ""),
        translateText(postRequest.description || ""),
        translateText(postRequest.otherCompensation || ""),
      ]);

      setTranslatedOffer({
        taskType: translatedTaskType,
        description: translatedDescription,
        otherCompensation: translatedCompensation,
      });
    };

    if (postRequest) {
      translateOfferData();
    }
  }, [postRequest]);

  useEffect(() => {
    const translateReviews = async () => {
      if (postRequest?.reviews && postRequest.reviews.length > 0) {
        const translated = await Promise.all(
          postRequest.reviews.map(async (review) => ({
            ...review,
            translatedText: await translateText(review.reviewText || ""),
          }))
        );
        setTranslatedReviews(translated);

        // Calculate average rating
        const ratings = postRequest.reviews.map((r) => r.rating).filter(Boolean);
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          setAverageRating(avg.toFixed(1));
        } else {
          setAverageRating(null);
        }
      }
    };

    translateReviews();
  }, [postRequest?.reviews]);

  const handleStartChat = async () => {
    const chatId = await createNewChat(currentUserId, postRequest.userId);
    navigation.navigate("Chat", {
      chatId: chatId,
      senderId: currentUserId,
      senderName: currentUser.userData.userName,
      receiver: postRequest.user,
    });
  };

  const storeAcceptedTask = async () => {
    try {
      await addDoc(collection(db, "completedTask"), {
        taskId: postRequest.id,
        taskOwnerId: postRequest.userId,
        acceptedBy: {
          userId: currentUserId,
          name: currentUser?.userData?.userName,
          email: currentUser?.userData?.email,
          image: currentUser?.userData?.profileImage || null,
          phone: currentUser?.userData?.phone || null,
        },
        taskDetails: postRequest,
        reviewd: false,
        status: "pending",
        acceptedAt: new Date().toISOString(),
      });
      console.log("Task successfully stored in completedTask collection.");
    } catch (error) {
      console.log("Error storing accepted task:", error);
    }
  };

  const updateRequestAcceptedBy = async () => {
    try {
      const taskDocRef = doc(db, "taskRequests", postRequest.id); // replace with your actual collection name
      await updateDoc(taskDocRef, {
        acceptedBy: {
          userId: currentUserId,
          name: currentUser?.userData?.userName,
          email: currentUser?.userData?.email,
          profileImage: currentUser?.userData?.profileImage || null,
          phone: currentUser?.userData?.phone || null,
        },
      });
      console.log("Request updated with acceptedBy field.");
    } catch (error) {
      console.log("Error updating acceptedBy field:", error);
    }
  };

  async function sendPushNotification() {
    try {
      const response = await fetch("https://buez-server-khaki.vercel.app/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expoPushToken: postRequest?.user?.token,
          title: currentUser?.userData?.userName,
          message: "Accepted your task request.",
        }),
      });
      const data = await response.text();
      console.log("sendPushNotification:", data);
      return data;
    } catch (error) {
      console.log("sendPushNotification error:", error);
      throw error;
    }
  }

  const saveNotification = async () => {
    try {
      await addDoc(collection(db, "notifications"), {
        sender: {
          userId: currentUserId,
          userName: currentUser?.userData?.userName,
          email: currentUser?.userData?.email,
          profileImage: currentUser?.userData?.profileImage || null,
          token: currentUser?.userData?.token,
        },
        receiver: {
          userId: postRequest?.user?.id || postRequest?.userId,
          name: postRequest?.user?.userName,
          email: postRequest?.user?.email,
        },
        task: {
          postRequest,
        },
        type: "task_acceptance",
        timestamp: new Date().toISOString(),
        isRead: false,
      });
      console.log("Notification saved in notifications collection.");
    } catch (error) {
      console.log("Error saving notification:", error);
    }
  };

  const handleAccept = async () => {
    setLoading(true); // show spinner
    try {
      await sendPushNotification();
      await storeAcceptedTask();
      await updateRequestAcceptedBy();
      await saveNotification();
      navigation.goBack();
    } catch (error) {
      console.log("Error accepting task:", error);
    } finally {
      setLoading(false); // hide spinner
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`${t("details.txt1")}`} />

        {/* Image Carousel */}
        <View style={styles.carousal}>
          <FlatList
            data={postRequest.imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setActiveIndex(Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width));
            }}
            renderItem={({ item }) => <ImageBackground style={styles.imageBackground} imageStyle={styles.image} source={{ uri: item }} />}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {postRequest?.imageUrls?.length > 1 && postRequest.imageUrls.map((_, index) => <View key={index} style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]} />)}
        </View>

        {/* Translated Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>Category: {translatedOffer.taskType}</Text>
          <Text style={styles.description}>
            {isExpanded || translatedOffer.description.length <= 120 ? translatedOffer.description : translatedOffer.description.slice(0, 120) + "... "}
            {translatedOffer.description.length > 120 && (
              <Text onPress={() => setIsExpanded(!isExpanded)} style={styles.readMoreText}>
                {isExpanded ? `${t("details.txt2")}` : `${t("details.txt3")}`}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Image style={styles.icon} source={Icons.location} />
          <Text style={styles.infoText}>{`${t("details.txt4")}`}</Text>
          <Text style={styles.infoDetail}>{postRequest.address}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Image style={styles.icon} source={Icons.cal} />
          <Text style={styles.infoText}>{`${t("details.txt5")}`}</Text>
          <Text style={styles.infoDetail}>{getDateTime(postRequest.createdAt)}</Text>
        </View>

        <View style={styles.compensationContainer}>
          <Text style={styles.compensationTitle}>{`${t("details.txt6")}`}:</Text>
          <Text style={styles.description}>{postRequest.compensationType === "Monitarely" ? `${postRequest.monitarily}$` : translatedOffer.otherCompensation}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.compensationTitle}>{t("profile.txt3")}</Text>
        </View>
        <View style={{ width: "90%", alignSelf: "center" }}>
          {averageRating && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", }}>
              <Text style={{ fontSize: RFPercentage(2), fontFamily: "Poppins_500Medium", color: Colors.heading }}>{"Rating"}:</Text>
              <Text style={{ fontSize: RFPercentage(2), fontFamily: "Poppins_600SemiBold", color: Colors.darkGrey }}>⭐ {averageRating}</Text>
            </View>
          )}

          {visibleReviews.length > 0 ? (
            <>
              <FlatList
                data={visibleReviews}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  return (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: RFPercentage(2) }}>
                      <Image
                        source={item?.reviewer?.profileImage ? { uri: item?.reviewer?.profileImage } : Icons.profile}
                        resizeMode="cover"
                        style={{ width: RFPercentage(5), height: RFPercentage(5), borderRadius: RFPercentage(100), borderWidth: RFPercentage(0.3), borderColor: Colors.primary }}
                      />
                      <View style={{ marginLeft: RFPercentage(1), top: RFPercentage(0.5) }}>
                        <Text style={{ color: Colors.heading, fontFamily: "Poppins_500Medium" }}>{item?.reviewer?.userName}</Text>
                        <Text style={{ color: Colors.heading, fontFamily: "Poppins_400Regular" }}>{item?.translatedText}</Text>
                      </View>
                    </View>
                  );
                }}
              />
              {!showAll && hiddenCount > 0 && (
                <TouchableOpacity onPress={() => setShowAll(true)}>
                  <Text
                    style={{
                      color: Colors.primary,
                      marginTop: RFPercentage(1),
                      fontFamily: "Poppins_500Medium",
                      alignSelf: "flex-start",
                    }}
                  >
                    +{hiddenCount} {t("details.txt11")}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={{ color: Colors.heading, fontFamily: "Poppins_400Regular" }}>{t("details.txt10")}</Text>
            </>
          )}
        </View>
        {/* Buttons */}
        <View style={styles.buttonWrapper}>
          {postRequest?.acceptedBy ? (
            <>
              <MyAppButton title={t("details.txt9")} disabled={currentUserId === postRequest.userId} onPress={handleStartChat} />
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.chatButton} disabled={currentUserId === postRequest.userId} onPress={handleStartChat}>
                <Text style={styles.text}>{t("details.txt9")}</Text>
              </TouchableOpacity>
              <MyAppButton title={`Accept Task`} marginTop={RFPercentage(0)} loading={loading} onPress={handleAccept} />
            </>
          )}
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
    alignItems: "center",
    paddingBottom: RFPercentage(5),
  },
  carousal: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(0.5),
  },
  imageBackground: {
    width: screenWidth * 0.9,
    height: RFPercentage(24),
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    marginTop: RFPercentage(2.8),
  },
  image: {
    borderRadius: RFPercentage(2),
  },
  dotsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: RFPercentage(2.5),
    justifyContent: "center",
  },
  dot: {
    height: RFPercentage(1),
    width: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    marginHorizontal: RFPercentage(0.5),
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    backgroundColor: "#D3D3D3",
  },
  detailsContainer: {
    width: "90%",
    marginTop: RFPercentage(2.2),
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    color: Colors.heading,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  description: {
    textAlign: "justify",
    marginTop: RFPercentage(0.8),
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  readMoreText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  infoContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: RFPercentage(2),
  },
  icon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
  },
  infoText: {
    top: RFPercentage(-0.2),
    marginLeft: RFPercentage(0.6),
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  infoDetail: {
    top: RFPercentage(-0.2),
    position: "absolute",
    right: 0,
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  compensationContainer: {
    width: "90%",
    marginTop: RFPercentage(2.1),
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  compensationTitle: {
    color: Colors.heading,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  chatButton: {
    marginRight: RFPercentage(2),
    backgroundColor: "#F8FAFC",
    width: RFPercentage(21),
    height: RFPercentage(6.2),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  buttonWrapper: {
    // position: "absolute",
    // bottom: RFPercentage(8),
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: RFPercentage(5),
  },
});

export default OfferDetail;
