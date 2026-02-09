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
import Feather from "@expo/vector-icons/Feather";

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
import Toast from "react-native-toast-message";
// Config

import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import CustomNav from "../components/common/CustomNav";

const { width } = Dimensions.get("window");

import { StyleProp, ViewStyle, TextStyle } from "react-native";
import { ShareButton } from "../job-sharing/ShareButton";

interface CustomAppButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Custom App Button Component
const CustomAppButton: React.FC<CustomAppButtonProps> = ({
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

  const jobId = route.params?.jobId;
  const initialPostRequest = route.params?.postRequest;

  const [postRequest, setPostRequest] = useState<any>(
    initialPostRequest ?? null,
  );
  const [isLoadingTask, setIsLoadingTask] = useState(
    !initialPostRequest && !!jobId,
  );

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

  const [isBulkRequest, setIsBulkRequest] = useState(false);
  const [numberOfWorkers, setNumberOfWorkers] = useState(1);
  const [appliedWorkers, setAppliedWorkers] = useState([]);
  const [confirmedWorkers, setConfirmedWorkers] = useState([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const db = FIREBASE_DB;
  const imageObjects =
    postRequest?.imageUrls?.map((url) => ({ uri: url })) || [];

  useEffect(() => {
    if (initialPostRequest) return; // already have full object
    if (!jobId) return;

    setIsLoadingTask(true);
    const taskDocRef = doc(db, "taskRequests", jobId);

    const unsubscribe = onSnapshot(
      taskDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPostRequest({ id: docSnap.id, ...data });
        } else {
          setPostRequest(null);
        }
        setIsLoadingTask(false);
      },
      (err) => {
        console.log("Error loading task:", err);
        setIsLoadingTask(false);
      },
    );

    return unsubscribe;
  }, [jobId, initialPostRequest]);

  // Animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Initialize bulk request data
    if (postRequest) {
      const workerCount = postRequest.numberOfWorkers || 1;
      setNumberOfWorkers(workerCount);
      setIsBulkRequest(workerCount > 1);
      setAppliedWorkers(postRequest.appliedWorkers || []);
      setConfirmedWorkers(postRequest.confirmedWorkers || []);
      // Check if current user has already applied
      if (currentUserId) {
        const userApplied = (postRequest.appliedWorkers || []).some(
          (worker) => worker.userId === currentUserId,
        );

        const confirmed = (postRequest.confirmedWorkers || []).some(
          (worker) => worker.userId === currentUserId,
        );
        setConfirmed(confirmed);
        setHasApplied(userApplied);
        // Check if current user is the worker (not the requester)
        setIsWorker(currentUserId !== postRequest.userId);
      }
    }
  }, [postRequest, currentUserId]);

  // Check if user can apply
  const canApply = () => {
    if (!isWorker) return false; // Not a worker
    if (isAccepted) return false; // Already accepted
    if (hasApplied) return false; // Already applied
    if (confirmed) return false;

    // Check if there are available slots
    const confirmedCount = confirmedWorkers.length;
    return confirmedCount < numberOfWorkers;
  };

  // Calculate remaining slots
  const getRemainingSlots = () => {
    const confirmedCount = confirmedWorkers.length;
    return numberOfWorkers - confirmedCount;
  };

  // Get slot status text
  const getSlotStatusText = () => {
    const remaining = getRemainingSlots();
    if (remaining <= 0) {
      return t("offerDetail.full") || "All slots filled";
    }
    return (
      t("offerDetail.slotsAvailable", { count: remaining }) ||
      `${remaining} slots available`
    );
  };

  // Get requester status text
  const getRequesterStatusText = () => {
    const confirmedCount = confirmedWorkers.length;
    return (
      t("offerDetail.confirmedStatus", {
        confirmed: confirmedCount,
        total: numberOfWorkers,
      }) || `${confirmedCount} of ${numberOfWorkers} helpers confirmed`
    );
  };

  // Check if chat is enabled for bulk requests
  const isChatEnabled = () => {
    if (!isBulkRequest) return true; // Single requests always have chat
    if (currentUserId === postRequest?.userId) {
      return confirmedWorkers.length > 0;
    } else {
      return confirmedWorkers.some((worker) => worker.userId === currentUserId);
    }
  };

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
        targetCurrency,
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
        const taskOwnerId = postRequest?.userId;
        const reviewsAboutTaskOwner = postRequest.reviews.filter((review) => {
          return review.recipient?.userId === taskOwnerId;
        });

        const translated = await Promise.all(
          reviewsAboutTaskOwner.map(async (review) => ({
            ...review,
            translatedText: await translateWithCache(review.reviewText || ""),
          })),
        );
        setTranslatedReviews(translated);

        // Calculate average rating from filtered reviews
        const ratings = reviewsAboutTaskOwner
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
        },
      );
      const data = await response.text();
      return data;
    } catch (error) {
      console.log("sendPushNotification error:", error);
      throw error;
    }
  }

  // Save notification (for single requests)
  const saveNotification = async () => {
    try {
      const postData = {
        id: postRequest?.id,
        taskType: postRequest?.taskType || "",
        description: postRequest?.description || "",
        compensationType: postRequest?.compensationType || "",
        monitarily: postRequest?.monitarily || "0",
        address: postRequest?.address || { name: "" },
        userId: postRequest?.userId || "",
        user: postRequest?.user || { userName: "" },
        imageUrls: postRequest?.imageUrls || [],
        createdAt: postRequest?.createdAt || new Date().toISOString(),
        status: postRequest?.status || "active",
        currencyInfo: postRequest?.currencyInfo || {
          code: "USD",
          symbol: "$",
          locale: "en-US",
        },
        isBulkRequest: false,
        numberOfWorkers: 1,
      };

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
          token: postRequest?.user?.token,
        },
        task: postData,
        type: "task_acceptance",
        timestamp: new Date().toISOString(),
        isRead: false,
        message: `${
          currentUser?.userData?.userName || "Someone"
        } has accepted your task request`,
        metadata: {
          postId: postRequest?.id,
          taskType: postRequest?.taskType,
          isBulkRequest: false,
        },
      });
      console.log("Task acceptance notification saved.");
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
          <MaterialIcons
            name="video-library"
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

  // Handle worker applying to bulk request
  const handleApply = async () => {
    if (!canApply()) return;
    setLoading(true);
    try {
      const userData = currentUser?.userData;
      const application = {
        userId: currentUserId || "",
        userName: userData?.userName || "Unknown User",
        profileImage: userData?.profileImage || "",
        email: currentUserId2?.email || "",
        phone: userData?.phone || "",
        token: userData?.token || "",
        appliedAt: new Date().toISOString(),
        status: "pending",
        userRating: userData?.rating || 0,
        completedTasks: userData?.completedTasks || 0,
      };

      const cleanApplication = Object.keys(application).reduce((acc, key) => {
        acc[key] = application[key] === undefined ? "" : application[key];
        return acc;
      }, {});

      const currentAppliedWorkers = Array.isArray(appliedWorkers)
        ? appliedWorkers
        : [];
      const updatedAppliedWorkers = [
        ...currentAppliedWorkers,
        cleanApplication,
      ];

      const taskDocRef = doc(db, "taskRequests", postRequest.id);
      const updateData = {
        appliedWorkers: updatedAppliedWorkers,
      };
      await saveApplicationNotification(cleanApplication);
      await updateDoc(taskDocRef, updateData);
      await sendApplicationNotification();
      setAppliedWorkers(updatedAppliedWorkers);
      setHasApplied(true);

      Toast.show({
        type: "success",
        text1: t("offerDetail.applicationSent") || "Application Sent",
        text2:
          t("offerDetail.waitForConfirmation") ||
          "Waiting for confirmation from requester",
      });
    } catch (error) {
      console.log("Error applying:", error);
      console.log("Error details:", error.message, error.stack);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit application",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save notification for bulk request application with complete post data
  const saveApplicationNotification = async (application) => {
    try {
      const postData = {
        // Basic identification
        id: postRequest?.id,
        postId: postRequest?.id,
        // Task details
        taskType: postRequest?.taskType || "",
        customTaskTitle: postRequest?.customTaskTitle || "",
        description: postRequest?.description || "",
        compensationType: postRequest?.compensationType || "",
        otherCompensation: postRequest?.otherCompensation || "",
        monitarily: postRequest?.monitarily || "0",
        // Bulk request specific fields
        numberOfWorkers: numberOfWorkers || 1,
        isBulkRequest: isBulkRequest,
        appliedWorkers: appliedWorkers || [],
        confirmedWorkers: confirmedWorkers || [],
        slotsAvailable: getRemainingSlots(),
        // Location
        address: postRequest?.address || {
          name: "",
          latitude: 0,
          longitude: 0,
        },
        // User info (requester)
        userId: postRequest?.userId || "",
        user: postRequest?.user || {
          userName: "",
          email: "",
          profileImage: "",
          token: "",
        },
        imageUrls: postRequest?.imageUrls || [],
        createdAt: postRequest?.createdAt || new Date().toISOString(),
        status: postRequest?.status || "active",
        currencyInfo: postRequest?.currencyInfo || {
          code: "USD",
          symbol: "$",
          locale: "en-US",
        },
        reviews: postRequest?.reviews || [],
        isEditable: false,
        isOwner: false,
      };

      const notificationData = {
        sender: {
          userId: currentUserId,
          userName: currentUser?.userData?.userName || "Unknown User",
          email: currentUserId2?.email || "",
          profileImage: currentUser?.userData?.profileImage || "",
          token: currentUser?.userData?.token || "",
        },
        receiver: {
          userId: postRequest?.userId,
          name: postRequest?.user?.userName || "Requester",
          email: postRequest?.user?.email || "",
          token: postRequest?.user?.token || "",
        },
        task: postData, // Use the complete postData object
        application: {
          appliedAt: new Date().toISOString(),
          status: "pending",
          workerName: currentUser?.userData?.userName || "Unknown User",
          workerId: currentUserId,
          workerProfileImage: currentUser?.userData?.profileImage || "",
          workerEmail: currentUserId2?.email || "",
        },
        type: "bulk_request_application",
        timestamp: new Date().toISOString(),
        isRead: false,
        notificationType: "application",
        message: `${
          currentUser?.userData?.userName || "Someone"
        } has applied to your "${
          postRequest?.taskType === "Other"
            ? postRequest?.customTaskTitle
            : postRequest?.taskType
        }" request`,
        metadata: {
          postId: postRequest?.id,
          workerId: currentUserId,
          taskTitle:
            postRequest?.taskType === "Other"
              ? postRequest?.customTaskTitle
              : postRequest?.taskType,
          isBulkRequest: true,
          actionRequired: true,
        },
      };
      // Clean any undefined values
      const cleanNotificationData = Object.keys(notificationData).reduce(
        (acc, key) => {
          if (notificationData[key] === undefined) {
            if (
              typeof notificationData[key] === "object" &&
              notificationData[key] !== null
            ) {
              acc[key] = {};
            } else {
              acc[key] = "";
            }
          } else {
            acc[key] = notificationData[key];
          }
          return acc;
        },
        {},
      );
      await addDoc(collection(db, "notifications"), cleanNotificationData);
    } catch (error) {
      console.log("Error saving application notification:", error);
    }
  };

  // Send notification to requester for application
  const sendApplicationNotification = async () => {
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
            title: "New Application",
            body: `${
              currentUser?.userData?.userName || "Someone"
            } has applied to your "${
              postRequest?.taskType === "Other"
                ? postRequest?.customTaskTitle
                : postRequest?.taskType
            }" request`,
          }),
        },
      );
      return response.text();
    } catch (error) {
      console.log("Notification error:", error);
    }
  };






   if (isLoadingTask) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.white }}>
        <Text style={{ color: theme.darkGrey }}>{t("common.loading") || "Loading..."}</Text>
      </View>
    );
  }

  if (!postRequest) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.white }}>
        <Text style={{ color: theme.darkGrey }}>
          {t("offerDetail.notFound") || "This task is no longer available."}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.primary }}>{t("common.goBack") || "Go back"}</Text>
        </TouchableOpacity>
      </View>
    );
  }


  

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      {/* <CustomNav title={t("details.txt1")} showBack={true} /> */}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
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
                    event.nativeEvent.layoutMeasurement.width,
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Feather name="arrow-left" color="white" size={RFPercentage(2.4)} />
          </TouchableOpacity>

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
                        theme.mode === "dark" ? Colors.white : theme.darkGrey
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

                {/* Share Button (Replaces the chat button) */}
                <ShareButton
                  jobId={postRequest?.id}
                  jobTitle={
                    postRequest?.taskType === "Other"
                      ? postRequest?.customTaskTitle || postRequest?.taskType
                      : postRequest?.taskType
                  }
                  jobDescription={postRequest?.description}
                  companyName="Buez"
                  style={[
                    styles.shareButton,
                    {
                      backgroundColor: Colors.primary + "30",
                    },
                  ]}
                />
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
                    ? Colors.lightGrey + "10"
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

            <View style={[styles.descriptionContainer]}>
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

          {/* Workers Information Section - Only show for bulk requests */}
          {isBulkRequest && (
            <View
              style={[
                styles.workersCard,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? Colors.lightGrey + "10"
                      : Colors.primary + "05",
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="people"
                  size={RFPercentage(2.2)}
                  color={Colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                  {t("offerDetail.helpersNeeded") || "Helpers Needed"}
                </Text>
              </View>

              <View style={styles.workersInfoContainer}>
                {/* Total Workers Needed */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-around",
                    width: "100%",
                  }}
                >
                  <View style={styles.workersStat}>
                    <View
                      style={[
                        styles.workersIconContainer,
                        { backgroundColor: Colors.primary + "20" },
                      ]}
                    >
                      <Ionicons
                        name="people-outline"
                        size={RFPercentage(2)}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.workersTextContainer}>
                      <Text
                        style={[styles.workersLabel, { color: theme.darkGrey }]}
                      >
                        {t("offerDetail.totalHelpers") ||
                          "Total Helpers Needed"}
                      </Text>
                      <Text
                        style={[styles.workersValue, { color: theme.heading }]}
                      >
                        {numberOfWorkers}
                      </Text>
                    </View>
                  </View>

                  {/* Confirmed Workers */}
                  <View style={[styles.workersStat]}>
                    <View
                      style={[
                        styles.workersIconContainer,
                        { backgroundColor: "#4CAF50" + "20" },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={RFPercentage(2)}
                        color="#4CAF50"
                      />
                    </View>
                    <View style={styles.workersTextContainer}>
                      <Text
                        style={[styles.workersLabel, { color: theme.darkGrey }]}
                      >
                        {t("offerDetail.confirmed") || "Confirmed"}
                      </Text>
                      <Text style={[styles.workersValue, { color: "#4CAF50" }]}>
                        {confirmedWorkers?.length}
                      </Text>
                    </View>
                  </View>
                </View>
                {/* Status Display */}
                <View style={styles.statusContainer}>
                  {currentUserId === postRequest?.userId ? (
                    // Requester view
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name="information-circle"
                        size={RFPercentage(1.6)}
                        color={Colors.primary}
                      />
                      <Text
                        style={[styles.statusText, { color: Colors.primary }]}
                      >
                        {getRequesterStatusText()}
                      </Text>
                    </View>
                  ) : (
                    // Worker view
                    <View
                      style={[
                        styles.statusBadge,
                        getRemainingSlots() <= 0 && {
                          backgroundColor: Colors.red + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          getRemainingSlots() <= 0
                            ? "alert-circle"
                            : "information-circle"
                        }
                        size={RFPercentage(1.6)}
                        color={
                          getRemainingSlots() <= 0 ? Colors.red : Colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              getRemainingSlots() <= 0
                                ? Colors.red
                                : Colors.primary,
                          },
                        ]}
                      >
                        {getSlotStatusText()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Applied Workers List (Visible to Requester Only) */}
              {currentUserId === postRequest?.userId &&
                appliedWorkers?.length > 0 && (
                  <View style={styles.appliedWorkersContainer}>
                    <Text
                      style={[styles.appliedTitle, { color: theme.darkGrey }]}
                    >
                      {t("offerDetail.applications") || "Applications"} (
                      {appliedWorkers?.length})
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.appliedScrollView}
                    >
                      {appliedWorkers?.map((worker, index) => {
                        const isConfirmed = confirmedWorkers.some(
                          (w) => w.userId === worker.userId,
                        );
                        return (
                          <View
                            key={worker.userId || index}
                            style={styles.appliedWorkerCard}
                          >
                            <Image
                              source={
                                worker.profileImage
                                  ? { uri: worker.profileImage }
                                  : Icons.dp
                              }
                              style={styles.appliedWorkerAvatar}
                            />
                            <Text
                              style={[
                                styles.appliedWorkerName,
                                { color: theme.heading },
                              ]}
                              numberOfLines={1}
                            >
                              {worker.userName}
                            </Text>
                            <View
                              style={[
                                styles.confirmationBadge,
                                {
                                  backgroundColor: isConfirmed
                                    ? "#4CAF50" + "20"
                                    : Colors.primary + "20",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.confirmationText,
                                  {
                                    color: isConfirmed
                                      ? "#4CAF50"
                                      : Colors.primary,
                                  },
                                ]}
                              >
                                {isConfirmed
                                  ? t("offerDetail.confirmed") || "Confirmed"
                                  : t("offerDetail.pending") || "Pending"}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
            </View>
          )}

          {/* Task Info Cards - Light Backgrounds */}
          <View style={styles.infoGrid}>
            {/* Location Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    theme.mode === "dark" ? Colors.lightGrey + "10" : "#E3F2FD",
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
                    theme.mode === "dark" ? Colors.lightGrey + "10" : "#E8F5E9",
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
                    theme.mode === "dark"
                      ? Colors.lightGrey + "10"
                      : "#efefefff",
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
          {(translatedReviews?.length > 0 || averageRating) && (
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

              {translatedReviews?.length > 0 ? (
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
                disabled={!isChatEnabled()}
              />
            ) : isBulkRequest ? (
              <>
                {/* Chat Button - Conditionally Enabled */}
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      borderColor: theme.lightGrey,
                      backgroundColor: !isChatEnabled()
                        ? theme.lightGrey + "30"
                        : theme.mode === "dark"
                          ? theme.white + "10"
                          : Colors.primary + "08",
                      opacity: isChatEnabled() ? 1 : 0.5,
                    },
                  ]}
                  onPress={handleStartChat}
                  activeOpacity={0.8}
                  disabled={!isChatEnabled()}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={RFPercentage(1.8)}
                    color={isChatEnabled() ? theme.darkGrey : theme.lightGrey}
                  />
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      {
                        color: isChatEnabled()
                          ? theme.darkGrey
                          : theme.lightGrey,
                      },
                    ]}
                  >
                    {t("details.txt9")}
                  </Text>
                </TouchableOpacity>

                {/* Apply/Accept Button */}
                {currentUserId === postRequest?.userId ? (
                  <CustomAppButton
                    title={
                      t("offerDetail.viewApplications") || "View Applications"
                    }
                    onPress={() =>
                      navigation.navigate("ApplicationsScreen", {
                        postId: postRequest.id,
                        appliedWorkers,
                        confirmedWorkers,
                        numberOfWorkers,
                      })
                    }
                    icon="list"
                    disabled={appliedWorkers.length === 0}
                  />
                ) : // Worker - Apply Button
                hasApplied || confirmed ? (
                  <View style={styles.appliedStatusContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={RFPercentage(2.5)}
                      color="#4CAF50"
                    />
                    <Text style={[styles.appliedText, { color: "#4CAF50" }]}>
                      {confirmed
                        ? t("offerDetail.confirmed")
                        : t("offerDetail.applied")}
                    </Text>
                  </View>
                ) : canApply() ? (
                  <CustomAppButton
                    title={t("offerDetail.imAvailable") || "I'm available"}
                    onPress={handleApply}
                    loading={loading}
                    icon="add-circle"
                    iconColor="white"
                  />
                ) : (
                  <View style={styles.disabledApplyContainer}>
                    <Ionicons
                      name="close-circle"
                      size={RFPercentage(2.5)}
                      color={Colors.red}
                    />
                    <Text style={[styles.disabledText, { color: Colors.red }]}>
                      {getRemainingSlots() <= 0
                        ? t("offerDetail.full") || "All slots filled"
                        : t("offerDetail.cannotApply") || "Cannot apply"}
                    </Text>
                  </View>
                )}
              </>
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
    height: RFPercentage(40),
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
    top: RFPercentage(6),
    right: RFPercentage(2),
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
  descriptionContainer: {},
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

  workersCard: {
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  workersInfoContainer: {
    // flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    // height:120
  },
  workersStat: {
    alignItems: "center",

    // backgroundColor:"blue"
  },
  workersIconContainer: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(0.5),
  },
  workersTextContainer: {
    alignItems: "center",
  },
  workersLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  workersValue: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  statusContainer: {
    marginTop: RFPercentage(2),
    width: "100%",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary + "10",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(0.5),
  },
  statusText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
  },
  appliedWorkersContainer: {
    marginTop: RFPercentage(1.5),
  },
  appliedTitle: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  appliedScrollView: {
    flexGrow: 0,
  },
  appliedWorkerCard: {
    alignItems: "center",
    marginRight: RFPercentage(1.5),
    width: RFPercentage(8),
  },
  appliedWorkerAvatar: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    marginBottom: RFPercentage(0.5),
  },
  appliedWorkerName: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    width: "100%",
  },
  confirmationBadge: {
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(0.3),
  },
  confirmationText: {
    fontSize: RFPercentage(0.9),
    fontFamily: "Poppins_600SemiBold",
  },
  appliedStatusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(100),
    backgroundColor: "#4CAF50" + "10",
    gap: RFPercentage(0.5),
    flexDirection: "row",
  },
  appliedText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  waitingText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
  },
  disabledApplyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.6),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.red + "10",
    gap: RFPercentage(0.5),
    flexDirection: "row",
  },
  disabledText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  back: {
    position: "absolute",
    top: RFPercentage(6),
    left: RFPercentage(2),
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  shareButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OfferDetail;
