import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
// components
import Nav from "../components/common/Nav";
// config
import Colors from "../config/Colors";
import MyAppButton from "../components/common/MyAppButton";
import { getDateTime } from "../services/Shared.service";
import { createNewChat } from "../services/Chat.service";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useAppTheme } from "../contexts/themeContext";
import { LinearGradient } from "expo-linear-gradient";
import { cachedTranslate } from "../utils/cachedTranslations";
import { onSnapshot } from "firebase/firestore";
import AntDesign from "@expo/vector-icons/AntDesign";
import { formatCurrency } from "../utils/currencyChange";
import AcceptanceSuccessModal from "../components/common/AcceptanceSuccessModal";

const screenWidth = Dimensions.get("window").width;

function OfferDetail({ navigation, route }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;
  const currentUserId2 = getAuth().currentUser;
  const postRequest = route.params?.postRequest;
  const [showAll, setShowAll] = useState(false);
  const db = FIREBASE_DB;
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedReviews, setTranslatedReviews] = useState([]);
  const [translatedOffer, setTranslatedOffer] = useState({
    taskType: "",
    description: "",
    otherCompensation: "",
  });
  const [isAccepted, setIsAccepted] = useState(!!postRequest?.acceptedBy);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate("TabNavigator");
  };

  const handleViewRequests = () => {
    setShowSuccessModal(false);
    navigation.navigate("TabNavigator", { screen: t("bottomTab.txt1") });
  };

  useEffect(() => {
    if (!postRequest?.id) return;
    const taskDocRef = doc(db, "taskRequests", postRequest.id);
    const unsubscribe = onSnapshot(taskDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedData = docSnap.data();
        if (updatedData?.acceptedBy) {
          setIsAccepted(true);
        } else {
          setIsAccepted(false);
        }
      }
    });

    return () => unsubscribe();
  }, [postRequest?.id]);

  const [loading, setLoading] = useState(false);
  const visibleReviews = showAll
    ? translatedReviews
    : translatedReviews.slice(0, 3);
  const hiddenCount = translatedReviews.length - 3;
  const [averageRating, setAverageRating] = useState(null);
  const { theme } = useAppTheme();

  const translationCache = React.useRef({}).current;

  const translateWithCache = async (text: string) => {
    if (!text) return "";
    if (translationCache[text]) return translationCache[text];
    try {
      const translated = await cachedTranslate(text);
      translationCache[text] = translated;
      return translated;
    } catch (err) {
      console.log("Translation failed:", err);
      return text;
    }
  };

  useEffect(() => {
    const translateOfferData = async () => {
      const [
        translatedTaskType,
        translatedDescription,
        translatedCompensation,
      ] = await Promise.all([
        translateWithCache(postRequest.taskType || ""),
        translateWithCache(postRequest.description || ""),
        translateWithCache(postRequest.otherCompensation || ""),
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
            translatedText: await translateWithCache(review.reviewText || ""),
          }))
        );
        setTranslatedReviews(translated);

        // Calculate average rating
        const ratings = postRequest.reviews
          .map((r) => r.rating)
          .filter(Boolean);
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
          email: currentUserId2.email,
          image: currentUser?.userData?.profileImage || null,
          phone: currentUser?.userData?.phone || null,
        },
        taskDetails: postRequest,
        reviewed: false,
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
      const taskDocRef = doc(db, "taskRequests", postRequest.id);
      await updateDoc(taskDocRef, {
        acceptedBy: {
          userId: currentUserId,
          name: currentUser?.userData?.userName,
          email: currentUserId2.email,
          profileImage: currentUser?.userData?.profileImage || null,
          phone: currentUser?.userData?.phone || null,
          token: currentUser?.userData?.token,
        },
      });
      console.log("Request updated with acceptedBy field.");
    } catch (error) {
      console.log("Error updating acceptedBy field:", error);
    }
  };

  async function sendPushNotification() {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: postRequest?.user?.token,
            title: currentUser?.userData?.userName,
            body: "Accepted your task request.",
          }),
        }
      );
      const data = await response.text();
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
          email: currentUserId2.email,
          profileImage: currentUser?.userData?.profileImage || null,
          token: currentUser?.userData?.token,
        },
        receiver: {
          userId: postRequest?.userId,
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

  console.log("current user", currentUser);

  const handleAccept = async () => {
    setLoading(true); // show spinner
    try {
      await sendPushNotification();
      await storeAcceptedTask();
      await updateRequestAcceptedBy();
      await saveNotification();
      setIsAccepted(true);
      setShowSuccessModal(true);
      // navigation.goBack();
    } catch (error) {
      console.log("Error accepting task:", error);
    } finally {
      setLoading(false); // hide spinner
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <Nav
        dpNull
        leftLogo={false}
        navigation={navigation}
        title={`${t("details.txt1")}`}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={{ width: "90%", alignSelf: "center" }}>
          <View style={{ flexDirection: "row", marginTop: RFPercentage(1) }}>
            <LinearGradient
              colors={[Colors.primary, "#4557B0"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: RFPercentage(4),
                paddingVertical: 4,
                justifyContent: "center",
                alignItems: "center",
                borderTopRightRadius: RFPercentage(3),
                borderBottomLeftRadius: RFPercentage(3),
                alignSelf: "flex-start",
              }}
            >
              <Text style={[styles.title, { color: "white" }]}>
                {translatedOffer?.taskType}
              </Text>
            </LinearGradient>
            <Image
              source={Icons.bar}
              resizeMode="contain"
              tintColor={Colors.primary}
              style={{
                width: RFPercentage(3.5),
                height: RFPercentage(3.5),
                bottom: RFPercentage(1),
                right: RFPercentage(0.5),
              }}
            />
          </View>
        </View>
        {/* Image Carousel */}
        <View style={styles.carousal}>
          <FlatList
            data={postRequest.imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setActiveIndex(
                Math.floor(
                  event.nativeEvent.contentOffset.x /
                    event.nativeEvent.layoutMeasurement.width
                )
              );
            }}
            renderItem={({ item }) => (
              <ImageBackground
                style={styles.imageBackground}
                imageStyle={styles.image}
                source={{ uri: item }}
              />
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {/* Dots */}
        {postRequest?.imageUrls?.length > 1 && (
          <View style={styles.dotsContainer}>
            {postRequest.imageUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === activeIndex ? theme.primary : theme.stroke,
                  },
                ]}
              />
            ))}
          </View>
        )}

        <View
          style={{
            width: "90%",
            alignSelf: "center",
            marginTop: RFPercentage(2.5),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View>
              <Image
                style={styles.userImage}
                source={
                  postRequest?.user?.profileImage
                    ? { uri: postRequest?.user?.profileImage }
                    : Icons.dp
                }
              />
            </View>
            <Text
              style={[
                {
                  color: theme.heading,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: RFPercentage(1.8),
                  marginLeft: RFPercentage(0.6),
                },
              ]}
            >
              {postRequest?.user?.userName}
            </Text>
          </View>
        </View>

        {/* Translated Details */}
        <View style={styles.detailsContainer}>
          <View
            style={[styles.infoContainer, { marginTop: RFPercentage(2.5) }]}
          >
            <View
              style={{
                width: RFPercentage(3),
                height: RFPercentage(3),
                borderRadius: RFPercentage(100),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.primary + "40"
                    : Colors.primary + "15",
              }}
            >
              <Image
                style={styles.icon}
                source={Icons.bars}
                tintColor={Colors.primary}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.infoText, { color: theme.heading }]}>
              {t("postRequest.txt8")}
            </Text>
          </View>

          <Text style={[styles.description, { color: theme.darkGrey }]}>
            {isExpanded || translatedOffer?.description?.length <= 120
              ? translatedOffer?.description
              : translatedOffer?.description.slice(0, 120) + "... "}
            {translatedOffer?.description?.length > 120 && (
              <Text
                onPress={() => setIsExpanded(!isExpanded)}
                style={[styles.readMoreText, { color: theme.primary }]}
              >
                {isExpanded ? ` ${t("details.txt2")}` : `${t("details.txt3")}`}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <View
            style={{
              width: RFPercentage(3),
              height: RFPercentage(3),
              borderRadius: RFPercentage(100),
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "15",
            }}
          >
            <Image
              style={styles.icon}
              source={Icons.location}
              tintColor={Colors.primary}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.infoText, { color: theme.heading }]}>{`${t(
            "details.txt4"
          )}`}</Text>
        </View>
        <Text
          style={[
            {
              color: theme.darkGrey,
              fontSize: RFPercentage(1.8),
              fontFamily: "Poppins_400Regular",
              alignSelf: "center",
              width: "90%",
              marginTop: RFPercentage(0.5),
            },
          ]}
        >
          {postRequest.address.name}
        </Text>

        <View style={styles.infoContainer}>
          <View
            style={{
              width: RFPercentage(3),
              height: RFPercentage(3),
              borderRadius: RFPercentage(100),
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "15",
            }}
          >
            <Image
              style={styles.icon}
              source={Icons.cal}
              tintColor={Colors.primary}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.infoText, { color: theme.heading }]}>{`${t(
            "details.txt5"
          )}`}</Text>
        </View>
        <View
          style={{
            width: "90%",
            alignSelf: "center",
          }}
        >
          <Text
            style={[
              {
                color: theme.darkGrey,
                fontSize: RFPercentage(1.8),
                fontFamily: "Poppins_400Regular",
                width: "100%",
                marginTop: RFPercentage(0.5),
              },
            ]}
          >
            {getDateTime(postRequest.createdAt)}
          </Text>
        </View>

        <View style={styles.compensationContainer}>
          <View
            style={{
              width: RFPercentage(3),
              height: RFPercentage(3),
              borderRadius: RFPercentage(100),
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "15",
            }}
          >
            <Image
              style={styles.icon}
              source={require("../../assets/Images/compensation.png")}
              tintColor={Colors.primary}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.infoText, { color: theme.heading }]}>
            {`${t("details.txt6")}`}
          </Text>
        </View>
        <View style={{ width: "90%", alignSelf: "center" }}>
          <Text style={[styles.description, { color: theme.darkGrey }]}>
            {postRequest.compensationType === "Monitarely"
              ? `${formatCurrency(postRequest.monitarily)}`
              : translatedOffer.otherCompensation}
          </Text>
        </View>

        <View
          style={{
            width: "90%",
            alignSelf: "center",
            marginTop: RFPercentage(2.1),
            // flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: RFPercentage(3),
                height: RFPercentage(3),
                borderRadius: RFPercentage(100),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.primary + "40"
                    : Colors.primary + "15",
              }}
            >
              <AntDesign
                name="barschart"
                size={RFPercentage(1.8)}
                color={Colors.primary}
              />
            </View>
            <Text
              style={[
                styles.compensationTitle,
                { color: theme.heading, marginLeft: RFPercentage(1) },
              ]}
            >
              {t("profile.txt3")}
            </Text>
          </View>
          {averageRating && (
            <View
              style={{
                flexDirection: "row",
                // justifyContent: "space-between",
                alignItems: "center",
                marginTop: RFPercentage(1),
              }}
            >
              <Text style={[styles.rating, { color: theme.heading }]}>
                {t("details.txt14")}:
              </Text>
              <Text
                style={[
                  styles.ratingText,
                  { color: theme.heading, marginLeft: RFPercentage(0.5) },
                ]}
              >
                {averageRating} ⭐
              </Text>
            </View>
          )}
        </View>
        <View style={{ width: "90%" }}>
          {visibleReviews?.length > 0 ? (
            <>
              <FlatList
                data={visibleReviews}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                  const isLastItem = index === visibleReviews.length - 1;
                  return (
                    <View>
                      <View style={[styles.review]}>
                        <Image
                          source={
                            item?.reviewer?.profileImage
                              ? { uri: item?.reviewer?.profileImage }
                              : Icons.dp
                          }
                          resizeMode="cover"
                          style={styles.reviewPic}
                        />
                        <View
                          style={{
                            marginLeft: RFPercentage(1),
                            width: "85%",
                          }}
                        >
                          {/* Reviewer Name + Rating */}
                          <View style={{marginTop:RFPercentage(0.7)}}>
                            <Text
                              style={[
                                styles.userName,
                                {
                                  color: theme.heading,
                                  fontSize: RFPercentage(1.7),
                                  fontFamily: "Poppins_600SemiBold",
                                },
                              ]}
                            >
                              {item?.reviewer?.userName}
                            </Text>

                            {item?.createdAt && (
                              <Text
                                style={{
                                  fontSize: RFPercentage(1.4),
                                  color: theme.darkGrey,
                                  fontFamily: "Poppins_400Regular",
                                  alignSelf: "flex-start",
                                }}
                              >
                                {getDateTime(item.createdAt)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      {item?.rating && (
                        <View
                          style={{
                            flexDirection: "row",
                            marginTop: RFPercentage(0.5),
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Text
                              key={i}
                              style={{
                                color:
                                  i <= (item.rating || 0)
                                    ? Colors.star
                                    : Colors.stroke,
                                fontSize: RFPercentage(2),
                                marginRight: 1,
                              }}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                      )}

                      {/* Review Text */}
                      <Text
                        style={[
                          styles.userName,
                          {
                            color: theme.darkGrey,
                            marginTop: RFPercentage(0.6),
                            fontFamily: "Poppins_400Regular_Italic",
                            fontSize: RFPercentage(1.6),
                            fontStyle:"italic"
                          },
                        ]}
                      >
                        {item?.translatedText}
                      </Text>

                      {!isLastItem && (
                        <View
                          style={{
                            width: "60%",
                            height: RFPercentage(0.1),
                            backgroundColor: "rgba(226, 226, 226, 0.4)",
                            marginTop: RFPercentage(1),
                          }}
                        />
                      )}
                    </View>
                  );
                }}
              />

              {!showAll && hiddenCount > 0 && (
                <TouchableOpacity onPress={() => setShowAll(true)}>
                  <Text style={[styles.reviewCount, { color: theme.primary }]}>
                    +{hiddenCount} {t("details.txt11")}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.detail, { color: theme.heading }]}>
                {t("details.txt10")}
              </Text>
            </>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonWrapper}>
          {isAccepted ? (
            <MyAppButton
              title={t("details.txt9")}
              disabled={currentUserId === postRequest.userId}
              onPress={handleStartChat}
              marginTop={RFPercentage(0)}
            />
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.chatButton, { borderColor: theme.darkGrey }]}
                disabled={currentUserId === postRequest.userId}
                onPress={handleStartChat}
              >
                <Text style={[styles.text, { color: theme.darkGrey }]}>
                  {t("details.txt9")}
                </Text>
              </TouchableOpacity>
              <MyAppButton
                title={t("details.txt12")}
                marginTop={RFPercentage(0)}
                loading={loading}
                onPress={handleAccept}
              />
            </>
          )}
        </View>
      </ScrollView>

      <AcceptanceSuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        onViewRequests={handleViewRequests}
        theme={theme}
      />
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
    height: RFPercentage(26),
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    marginTop: RFPercentage(2),
  },
  image: {
    borderRadius: RFPercentage(2),
  },
  userImage: {
    width: RFPercentage(6.2),
    height: RFPercentage(6.2),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(100),
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
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(0.5),
  },
  title: {
    color: Colors.heading,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  description: {
    textAlign: "justify",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    width: "100%",
    marginTop: RFPercentage(0.5),
  },
  readMoreText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  infoContainer: {
    width: "90%",
    alignItems: "center",
    flexDirection: "row",
    marginTop: RFPercentage(2.1),
  },
  icon: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
  },
  infoText: {
    marginLeft: RFPercentage(1),
    color: Colors.heading,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
    top: RFPercentage(0.2),
  },
  infoDetail: {
    color: Colors.heading,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
  },
  compensationContainer: {
    width: "90%",
    marginTop: RFPercentage(2.1),
    alignItems: "center",
    flexDirection: "row",
  },
  reviewCount: {
    color: Colors.primary,
    marginTop: RFPercentage(1),
    fontFamily: "Poppins_500Medium",
    alignSelf: "flex-start",
  },
  detail: {
    textAlign: "justify",
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    width: "100%",
    marginTop: RFPercentage(0.5),
  },
  reviewPic: {
    width: RFPercentage(5.9),
    height: RFPercentage(5.9),
    borderRadius: RFPercentage(100),
    borderWidth: RFPercentage(0.3),
    borderColor: Colors.primary,
  },
  compensationTitle: {
    color: Colors.heading,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  review: {
    flexDirection: "row",
    paddingVertical: RFPercentage(1),
    marginTop: RFPercentage(1),
  },
  chatButton: {
    marginRight: RFPercentage(2),
    backgroundColor: "transparent",
    height: Platform.OS === "android" ? RFPercentage(6.2) : RFPercentage(5.5),
    width: Platform.OS === "android" ? RFPercentage(21.5) : RFPercentage(18.5),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
  },
  rating: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heading,
  },
  ratingText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.darkGrey,
  },
  userName: {
    color: Colors.heading,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.6),
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
    marginTop: RFPercentage(4),
  },
});

export default OfferDetail;
