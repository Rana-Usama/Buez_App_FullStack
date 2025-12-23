import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ImageView from "react-native-image-viewing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// Components
import AcceptanceSuccessModal from "../components/common/AcceptanceSuccessModal";

// Services & Utils
import { getDateTime } from "../services/Shared.service";
import { createNewChat } from "../services/Chat.service";
import { useUser } from "../contexts/user.context";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";
import {
  formatCurrency,
  convertCurrency,
  getCurrencyInfo,
} from "../utils/currencyChange";
import { useLocation } from "../utils/useLocation";

// Config
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import CustomNav from "../components/common/CustomNav";

const { width } = Dimensions.get("window");

// Custom App Button Component
const CustomAppButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  backgroundColor = Colors.primary,
  textColor = "white",
  icon,
  style,
  textStyle,
  iconColor,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        customButtonStyles.button,
        {
          backgroundColor: disabled ? backgroundColor + "80" : backgroundColor,
          transform: [{ scale: isPressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <View style={customButtonStyles.loadingContainer}>
          <Animated.View style={customButtonStyles.spinner} />
        </View>
      ) : (
        <View style={customButtonStyles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={RFPercentage(1.8)}
              color={iconColor || textColor}
              style={customButtonStyles.icon}
            />
          )}
          <Text
            style={[customButtonStyles.text, { color: textColor }, textStyle]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const customButtonStyles = StyleSheet.create({
  button: {
    flex: 1,
    height: Platform.OS === "android" ? RFPercentage(6.2) : RFPercentage(5.5),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: RFPercentage(0.5),
  },
  text: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    borderRadius: RFPercentage(1),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderTopColor: "white",
  },
});

function OfferDetail({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;
  const currentUserId2 = getAuth().currentUser;
  const { location: currentLocation } = useLocation();

  const postRequest = route.params?.postRequest;
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isAccepted, setIsAccepted] = useState(!!postRequest?.acceptedBy);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(null);

  const [translatedOffer, setTranslatedOffer] = useState({
    taskType: "",
    description: "",
    otherCompensation: "",
    customTaskTitle: "",
  });

  const [translatedReviews, setTranslatedReviews] = useState([]);
  const translationCache = useRef({}).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const db = FIREBASE_DB;
  const imageObjects =
    postRequest?.imageUrls?.map((url) => ({ uri: url })) || [];

  // Animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Currency conversion function
  const getConvertedCompensation = (item) => {
    if (item.compensationType !== "Monitarely") return null;

    try {
      const originalAmount = parseFloat(item.monitarily) || 0;
      if (!item.currencyInfo) {
        return formatCurrency(originalAmount, currentLocation);
      }

      const targetCurrency = getCurrencyInfo(currentLocation).code;
      const convertedAmount = convertCurrency(
        originalAmount,
        item.currencyInfo.code,
        targetCurrency
      );
      return formatCurrency(convertedAmount, currentLocation);
    } catch (error) {
      console.log("Currency conversion error:", error);
      return formatCurrency(parseFloat(item.monitarily) || 0, currentLocation);
    }
  };

  // Real-time acceptance status monitoring
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

  // Modal handlers
  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate("TabNavigator");
  };

  const handleViewRequests = () => {
    setShowSuccessModal(false);
    navigation.navigate("TabNavigator", { screen: t("bottomTab.txt1") });
  };

  // Translation function with cache
  const translateWithCache = async (text) => {
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

  // Translate offer data
  useEffect(() => {
    const translateOfferData = async () => {
      const [
        translatedTaskType,
        translatedDescription,
        translatedCompensation,
        translatedCustomTitle,
      ] = await Promise.all([
        translateWithCache(postRequest.taskType || ""),
        translateWithCache(postRequest.description || ""),
        translateWithCache(postRequest.otherCompensation || ""),
        translateWithCache(postRequest.customTaskTitle || ""),
      ]);
      setTranslatedOffer({
        taskType: translatedTaskType,
        description: translatedDescription,
        otherCompensation: translatedCompensation,
        customTaskTitle: translatedCustomTitle,
      });
    };
    if (postRequest) {
      translateOfferData();
    }
  }, [postRequest]);

  // Translate reviews and calculate average rating
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

  // Chat handler
  const handleStartChat = async () => {
    const chatId = await createNewChat(currentUserId, postRequest.userId);
    navigation.navigate("Chat", {
      chatId: chatId,
      senderId: currentUserId,
      senderName: currentUser.userData.userName,
      receiver: postRequest.user,
    });
  };

  // Store accepted task
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

  // Update request with acceptedBy field
  const updateRequestAcceptedBy = async () => {
    try {
      const taskDocRef = doc(db, "taskRequests", postRequest.id);
      await updateDoc(taskDocRef, {
        acceptedBy: {
          userId: currentUserId,
          userName: currentUser?.userData?.userName,
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

  // Send push notification
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
            body: t("pushNotifications.txt1"),
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

  // Save notification
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

  // Main accept handler
  const handleAccept = async () => {
    setLoading(true);
    try {
      await sendPushNotification();
      await storeAcceptedTask();
      await updateRequestAcceptedBy();
      await saveNotification();
      setIsAccepted(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.log("Error accepting task:", error);
    } finally {
      setLoading(false);
    }
  };

  // Category Icon
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "cleaning":
        return (
          <MaterialCommunityIcons
            name="broom"
            size={RFPercentage(2.5)}
            color={Colors.white}
          />
        );
      case "moving":
        return (
          <FontAwesome5
            name="truck-moving"
            size={RFPercentage(2.2)}
            color={Colors.white}
          />
        );
      case "gardening":
        return (
          <FontAwesome5
            name="seedling"
            size={RFPercentage(2.2)}
            color={Colors.white}
          />
        );
      case "gaming":
        return (
          <Ionicons
            name="game-controller"
            size={RFPercentage(2.5)}
            color={Colors.white}
          />
        );
      default:
        return (
          <MaterialIcons
            name="compost"
            size={RFPercentage(2.5)}
            color={Colors.white}
          />
        );
    }
  };

  const visibleReviews = showAll
    ? translatedReviews
    : translatedReviews.slice(0, 3);
  const hiddenCount = translatedReviews.length - 3;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.white }]}>
 <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav title={t("details.txt1")} showBack={true} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          {postRequest?.imageUrls?.length > 0 ? (
            <FlatList
              data={postRequest.imageUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x /
                    event.nativeEvent.layoutMeasurement.width
                );
                setActiveIndex(index);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setIsVisible(true)}
                  style={styles.imageContainer}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.3)"]}
                    style={styles.imageGradient}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          ) : (
            <View style={styles.noImageContainer}>
              <LinearGradient
                colors={[Colors.primary + "20", Colors.primary + "05"]}
                style={styles.noImageGradient}
              >
                <Ionicons
                  name="images"
                  size={RFPercentage(6)}
                  color={Colors.primary + "60"}
                />
                <Text
                  style={[styles.noImageText, { color: Colors.primary + "80" }]}
                >
                  {t("details.txt13")}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Image Dots */}
          {postRequest?.imageUrls?.length > 1 && (
            <View style={styles.dotsContainer}>
              {postRequest.imageUrls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activeIndex
                          ? Colors.primary
                          : "rgba(255,255,255,0.5)",
                      width:
                        index === activeIndex
                          ? RFPercentage(1.5)
                          : RFPercentage(1),
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <LinearGradient
              colors={[Colors.primary, "#4557B0"]}
              style={styles.categoryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {getCategoryIcon(postRequest?.category)}
              <Text style={styles.categoryText}>
                {postRequest?.taskType === "Other"
                  ? translatedOffer?.customTaskTitle ||
                    translatedOffer?.taskType
                  : translatedOffer?.taskType}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Main Content */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {/* User Info Card - Light Background */}
          <View style={styles.userCardContainer}>
            <BlurView
              intensity={80}
              tint={theme.mode === "dark" ? "dark" : "light"}
              style={styles.blurView}
            >
              <LinearGradient
                colors={
                  theme.mode === "dark"
                    ? ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.08)"]
                    : [Colors.primary + "40", Colors.primary + "20"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientOverlay}
              />

              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[Colors.primary, "#4557B0"]}
                    style={styles.avatarGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Image
                      source={
                        postRequest?.user?.profileImage
                          ? { uri: postRequest.user.profileImage }
                          : Icons.dp
                      }
                      style={[
                        styles.userAvatar,
                        {
                          borderColor:
                            theme.mode === "dark"
                              ? "rgba(255,255,255,0.3)"
                              : "white",
                        },
                      ]}
                    />
                  </LinearGradient>

                 
                </View>

                <View style={styles.userDetails}>
                  <Text
                    style={[
                      styles.userName,
                      {
                        color:
                          theme.mode === "dark" ? Colors.white : theme.primary,
                      },
                    ]}
                  >
                    {postRequest?.user?.userName}
                  </Text>
                  <View style={styles.subtitleRow}>
                    <Ionicons
                      name="time-outline"
                      size={RFPercentage(1.3)}
                      color={
                        theme.mode === "dark"
                          ? Colors.white
                          : theme.darkGrey
                      }
                    />
                    <Text
                      style={[
                        styles.userSubtitle,
                        {
                          color:
                            theme.mode === "dark"
                              ? Colors.white 
                              : theme.darkGrey,
                        },
                      ]}
                    >
                      {t("myRequests.txt4")} •{" "}
                      {getDateTime(postRequest?.createdAt)}
                    </Text>
                  </View>
                </View>

                {currentUserId !== postRequest?.userId && (
                  <TouchableOpacity
                    style={[
                      styles.messageButton,
                      {
                        backgroundColor:
                          theme.mode === "dark"
                            ? "rgba(255,255,255,0.15)"
                            : Colors.primary + "20",
                      },
                    ]}
                    onPress={handleStartChat}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={RFPercentage(2.2)}
                      color={
                        theme.mode === "dark" ? Colors.white : Colors.primary
                      }
                    />
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </View>

          {/* Task Description Card - Light Background */}
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? theme.primary + "30" 
                    : Colors.primary + "05",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text"
                size={RFPercentage(2.2)}
                color={Colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                {t("postRequest.txt8")}
              </Text>
            </View>

            <View
              style={[
                styles.descriptionContainer,
               
              ]}
            >
              <Text style={[styles.taskDescription, { color: theme.darkGrey }]}>
                {isExpanded || translatedOffer?.description?.length <= 150
                  ? translatedOffer?.description
                  : translatedOffer?.description?.substring(0, 150) + "... "}
                {translatedOffer?.description?.length > 150 && (
                  <Text
                    onPress={() => setIsExpanded(!isExpanded)}
                    style={[styles.readMore, { color: Colors.primary }]}
                  >
                    {isExpanded
                      ? ` ${t("details.txt2")}`
                      : ` ${t("details.txt3")}`}
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {/* Task Info Cards - Light Backgrounds */}
          <View style={styles.infoGrid}>
            {/* Location Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    theme.mode === "dark" ? theme.primary + "30"  : "#E3F2FD",
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: Colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name="location"
                  size={RFPercentage(2.2)}
                  color={Colors.primary}
                />
              </View>
              <Text style={[styles.infoLabel, { color: theme.darkGrey }]}>
                {t("details.txt4")}
              </Text>
              <View style={styles.infoValueContainer}>
                <Text
                  style={[styles.infoValue, { color: theme.heading }]}
                  numberOfLines={2}
                >
                  {postRequest?.address?.name || t("details.txt16")}
                </Text>
              </View>
            </View>

            {/* Compensation Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    theme.mode === "dark" ? theme.primary + "30"  : "#E8F5E9",
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "#4CAF50" + "20" },
                ]}
              >
                <Ionicons
                  name={
                    postRequest?.compensationType === "Monitarely"
                      ? "cash"
                      : "gift"
                  }
                  size={RFPercentage(2.2)}
                  color={
                    postRequest?.compensationType === "Monitarely"
                      ? "#4CAF50"
                      : "#FF9800"
                  }
                />
              </View>
              <Text style={[styles.infoLabel, { color: theme.darkGrey }]}>
                {t("home.txt10")}
              </Text>
              <View style={styles.infoValueContainer}>
                <Text
                  style={[styles.infoValue, { color: Colors.primary }]}
                  numberOfLines={2}
                >
                  {postRequest?.compensationType === "Monitarely"
                    ? getConvertedCompensation(postRequest)
                    : translatedOffer.otherCompensation || t("details.txt17")}
                </Text>
              </View>
            </View>

            {/* Date Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    theme.mode === "dark" ? theme.primary + "30" : "#efefefff",
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "#9C27B0" + "20" },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={RFPercentage(2.2)}
                  color="#9C27B0"
                />
              </View>
              <Text style={[styles.infoLabel, { color: theme.darkGrey }]}>
                {t("details.txt5")}
              </Text>
              <View style={styles.infoValueContainer}>
                <Text style={[styles.infoValue, { color: theme.heading }]}>
                  {getDateTime(postRequest?.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Reviews Section - Light Background */}
          {(translatedReviews.length > 0 || averageRating) && (
            <View
              style={[
                styles.reviewsCard,
                {
                  backgroundColor:
                    theme.mode === "dark" ? theme.white + "10" : "#FFF8E1",
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="star"
                  size={RFPercentage(2.2)}
                  color="#FFD700"
                />
                <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                  {t("profile.txt3")}
                  {averageRating && (
                    <Text
                      style={[styles.ratingText, { color: theme.darkGrey }]}
                    >
                      {" "}
                      ({averageRating} ⭐)
                    </Text>
                  )}
                </Text>
              </View>

              {translatedReviews.length > 0 ? (
                <>
                  {visibleReviews.map((review, index) => (
                    <View
                      key={review.id || index}
                      style={[
                        styles.reviewItem,
                        {
                          backgroundColor:
                            theme.mode === "dark"
                              ? theme.white + "08"
                              : "rgba(255,255,255,0.7)",
                        },
                      ]}
                    >
                      <View style={styles.reviewHeader}>
                        <Image
                          source={
                            review?.reviewer?.profileImage
                              ? { uri: review.reviewer.profileImage }
                              : Icons.dp
                          }
                          style={styles.reviewerAvatar}
                        />
                        <View style={styles.reviewerInfo}>
                          <Text
                            style={[
                              styles.reviewerName,
                              { color: theme.heading },
                            ]}
                          >
                            {review?.reviewer?.userName}
                          </Text>
                          <Text
                            style={[
                              styles.reviewDate,
                              { color: theme.darkGrey },
                            ]}
                          >
                            {getDateTime(review.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.starsContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name="star"
                              size={RFPercentage(1.4)}
                              color={
                                star <= (review.rating || 0)
                                  ? "#FFD700"
                                  : theme.border
                              }
                            />
                          ))}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.reviewTextContainer,
                          {
                            backgroundColor:
                              theme.mode === "dark"
                                ? theme.white + "05"
                                : "rgba(255,255,255,0.5)",
                          },
                        ]}
                      >
                        <Text
                          style={[styles.reviewText, { color: theme.darkGrey }]}
                        >
                          {review.translatedText}
                        </Text>
                      </View>
                      {index < visibleReviews.length - 1 && (
                        <View
                          style={[
                            styles.reviewDivider,
                            { backgroundColor: theme.border },
                          ]}
                        />
                      )}
                    </View>
                  ))}

                  {!showAll && hiddenCount > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowAll(true)}
                      style={styles.viewAllButton}
                    >
                      <Text
                        style={[styles.viewAllText, { color: Colors.primary }]}
                      >
                        +{hiddenCount} {t("details.txt11")}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={RFPercentage(1.6)}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View
                  style={[
                    styles.noReviewsContainer,
                    {
                      backgroundColor:
                        theme.mode === "dark"
                          ? theme.white + "08"
                          : "rgba(255,255,255,0.7)",
                    },
                  ]}
                >
                  <Text style={[styles.noReviews, { color: theme.darkGrey }]}>
                    {t("details.txt10")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isAccepted ? (
              <CustomAppButton
                title={t("details.txt9")}
                onPress={handleStartChat}
                icon="chatbubble-ellipses"
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      borderColor: theme.lightGrey,
                      backgroundColor:
                        theme.mode === "dark"
                          ? theme.white + "10"
                          : Colors.primary + "08",
                    },
                  ]}
                  onPress={handleStartChat}
                  activeOpacity={0.8}
                  disabled={currentUserId === postRequest.userId}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={RFPercentage(1.8)}
                    color={theme.darkGrey}
                  />
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.darkGrey },
                    ]}
                  >
                    {t("details.txt9")}
                  </Text>
                </TouchableOpacity>

                <CustomAppButton
                  title={t("details.txt12")}
                  onPress={handleAccept}
                  loading={loading}
                  icon="checkmark-circle"
                  disabled={currentUserId === postRequest.userId}
                />
              </>
            )}
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Image Viewer */}
      <ImageView
        images={imageObjects}
        imageIndex={activeIndex}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
        FooterComponent={({ imageIndex }) => (
          <View style={styles.imageViewerFooter}>
            <Text style={styles.imageIndexText}>
              {imageIndex + 1} / {imageObjects.length}
            </Text>
          </View>
        )}
      />

      {/* Success Modal */}
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
  safeArea: {
    flex: 1,
  },
  header: {
    zIndex: 1000,
    backgroundColor: "rgba(91, 92, 110, 1)",
    paddingTop: Platform.OS === "ios" ? RFPercentage(6) : 0,
  },
  blurHeader: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  backButton: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(2),
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  headerRight: {
    width: RFPercentage(4),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: RFPercentage(10),
  },
  heroSection: {
    height: RFPercentage(30),
    position: "relative",
  },
  imageContainer: {
    width: width,
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    marginTop: RFPercentage(1),
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
  },
  dotsContainer: {
    position: "absolute",
    bottom: RFPercentage(2),
    alignSelf: "center",
    flexDirection: "row",
    gap: RFPercentage(0.5),
  },
  dot: {
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
  },
  categoryBadge: {
    position: "absolute",
    top: RFPercentage(2),
    left: RFPercentage(2),
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    gap: RFPercentage(0.8),
  },
  categoryText: {
    color: "white",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  contentContainer: {
    marginTop: -RFPercentage(5),
    paddingHorizontal: RFPercentage(2),
  },
  userCard: {
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  detailCard: {
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  descriptionContainer: {
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  sectionTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  taskDescription: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
  },
  readMore: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(1.5),
    marginBottom: RFPercentage(2),
  },
  infoCard: {
    flex: 1,
    minWidth: width * 0.42,
    borderRadius: 16,
    padding: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  iconContainer: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  infoLabel: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    marginBottom: 4,
  },
  infoValueContainer: {
    marginTop: RFPercentage(0.5),
  },
  infoValue: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  reviewsCard: {
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  ratingText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  reviewItem: {
    borderRadius: 12,
    padding: RFPercentage(1.5),
    marginBottom: RFPercentage(1.5),
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  reviewerAvatar: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    marginRight: RFPercentage(1),
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewTextContainer: {
    borderRadius: 8,
    padding: RFPercentage(1),
    marginTop: RFPercentage(0.5),
  },
  reviewText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  reviewDivider: {
    height: 1,
    marginTop: RFPercentage(1.5),
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  viewAllText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
  noReviewsContainer: {
    borderRadius: 12,
    padding: RFPercentage(2),
    alignItems: "center",
  },
  noReviews: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: RFPercentage(1.5),
    marginTop: RFPercentage(1),
    marginBottom: RFPercentage(4),
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    gap: RFPercentage(0.8),
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  imageViewerFooter: {
    padding: RFPercentage(1),
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imageIndexText: {
    color: "white",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },

  userCardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: RFPercentage(2),
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  blurView: {
    padding: RFPercentage(2),
    borderRadius: 20,
    position: "relative",
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
    // backgroundColor:"red"
  },
  avatarContainer: {
    position: "relative",
    marginRight: RFPercentage(1.5),
  },
  avatarGradientBorder: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(3.25),
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: RFPercentage(3.25),
    borderWidth: 2,
  },
 
  
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  userSubtitle: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  messageButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(1),
  },
});

export default OfferDetail;
