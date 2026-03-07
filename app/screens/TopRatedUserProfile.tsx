import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import CustomNav from "../components/common/CustomNav";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import moment from "moment";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";
// Service imports
import { fetchUserDetailedProfile } from "../services/User.service";
import { createNewChat } from "../services/Chat.service";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import { useLocation } from "../utils/useLocation";
import {
  doc,
  updateDoc,
  getFirestore,
  collection,
  addDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { createOrUpdateGroupChat } from "../services/GroupChat.service";
import { FontAwesome5 } from "@expo/vector-icons";
import { cachedTranslate } from "../utils/cachedTranslations";

// ─── Reusable colors map ─────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { color: string; icon: string }> = {
  Cleaning: { color: "#4ECDC4", icon: "broom" },
  Moving: { color: "#FF6B6B", icon: "truck" },
  Gardening: { color: "#95E06C", icon: "seedling" },
  Gaming: { color: "#A78BFA", icon: "gamepad" },
  Plumbing: { color: "#60A5FA", icon: "wrench" },
  Electrical: { color: "#FBBF24", icon: "bolt" },
  Carpentry: { color: "#F97316", icon: "hammer" },
  Painting: { color: "#EC4899", icon: "paint-brush" },
  Delivery: { color: "#14B8A6", icon: "shipping-fast" },
  Tutoring: { color: "#8B5CF6", icon: "chalkboard-teacher" },
  "Event Setup": { color: "#F43F5E", icon: "calendar-alt" },
  Photography: { color: "#06B6D4", icon: "camera" },
  "Pet Care": { color: "#D97706", icon: "paw" },
  Other: { color: "#6B7280", icon: "ellipsis-h" },
};

const InterestPill = ({
  item,
  isCustom,
}: {
  item: { key: string; label: string };
  isCustom?: boolean;
}) => {
  const meta = CATEGORY_MAP[item.key];

  const color = isCustom ? "#1b2572ff" : meta?.color || "#3a6dedff";
  const icon = isCustom ? "tag" : meta?.icon || "tag";

  return (
    <View
      style={[
        interestPillStyle.pill,
        {
          borderColor: isCustom ? "#2c2d305f" : color + "40",
          backgroundColor: color + "10",
        },
      ]}
    >
      <View
        style={[
          interestPillStyle.iconWrap,
          { backgroundColor: isCustom ? "#2e2e3234" : color + "20" },
        ]}
      >
        <FontAwesome5
          name={icon}
          size={RFPercentage(1.2)}
          color={color}
          solid
        />
      </View>
      <Text numberOfLines={1} style={[interestPillStyle.text, { color }]}>
        {item.label}
      </Text>
    </View>
  );
};

const interestPillStyle = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RFPercentage(10),
    paddingVertical: RFPercentage(0.5),
    paddingLeft: RFPercentage(0.55),
    paddingRight: RFPercentage(1.2),
    gap: RFPercentage(0.55),
  },
  iconWrap: {
    width: RFPercentage(2.7),
    height: RFPercentage(2.7),
    borderRadius: RFPercentage(5),
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
});

const TopRatedUserProfile = ({ navigation, route }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { user, applier, postRequest } = route.params || {};
  const { location: currentLocation } = useLocation();
  const currentUser = useUser();
  const [translatedBio, setTranslatedBio] = useState<string | null>(null);
  // State
  const [userDetailedData, setUserDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("completed");
  const [confirming, setConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [taskData, setTaskData] = useState(postRequest || null);
  const [slotInfo, setSlotInfo] = useState({
    total: 0,
    filled: 0,
    remaining: 0,
    isFull: false,
  });
  const [canConfirm, setCanConfirm] = useState(true);
  const [translatedTasks, setTranslatedTasks] = useState({});
  const [translatedReviews, setTranslatedReviews] = useState({});
  const [userInterests, setUserInterests] = useState<{
    selectedCategories: string[];
    customInterests: string[];
  } | null>(null);

  const [translatedInterests, setTranslatedInterests] = useState<{
    selectedCategories: { key: string; label: string }[];
    customInterests: { key: string; label: string }[];
  } | null>(null);

  const db = FIREBASE_DB;

  const INITIAL_COUNT = 3;
  const { userBasic, stats, tasks, reviews } = userDetailedData || {};

  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const completedTasks = tasks?.completed || [];
  const reviewsList = reviews || [];

  const visibleCompletedTasks = showAllCompleted
    ? completedTasks
    : completedTasks.slice(0, INITIAL_COUNT);

  const visibleReviews = showAllReviews
    ? reviewsList
    : reviewsList.slice(0, INITIAL_COUNT);

  // Fetch latest task data and update slot info
  const fetchTaskData = async () => {
    if (!postRequest?.id) return;

    try {
      const taskDocRef = doc(db, "taskRequests", postRequest.id);
      const docSnap = await getDoc(taskDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTaskData({ id: docSnap.id, ...data });

        // Calculate slot info
        const requiredWorkers = data.numberOfWorkers || 1;
        const confirmedWorkers = Array.isArray(data.confirmedWorkers)
          ? data.confirmedWorkers
          : [];
        const filled = confirmedWorkers.length;
        const remaining = Math.max(0, requiredWorkers - filled);
        const isFull = filled >= requiredWorkers;

        setSlotInfo({
          total: requiredWorkers,
          filled: filled,
          remaining: remaining,
          isFull: isFull,
        });

        // Check if current user is the task owner
        const currentUserId = getAuth().currentUser?.uid;
        setCanConfirm(data.userId === currentUserId);
      }
    } catch (error) {
      console.error("Error fetching task data:", error);
    }
  };

  // Real-time listener for confirmation status and slot updates
  useEffect(() => {
    if (!postRequest?.id || !user?.userId) return;

    const taskDocRef = doc(db, "taskRequests", postRequest.id);
    const unsubscribe = onSnapshot(taskDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedPost = docSnap.data();

        // Update task data
        setTaskData({ id: docSnap.id, ...updatedPost });

        // Calculate slot info
        const requiredWorkers = updatedPost.numberOfWorkers || 1;
        const confirmedWorkers = Array.isArray(updatedPost.confirmedWorkers)
          ? updatedPost.confirmedWorkers
          : [];
        const filled = confirmedWorkers.length;
        const remaining = Math.max(0, requiredWorkers - filled);
        const isFull = filled >= requiredWorkers;

        setSlotInfo({
          total: requiredWorkers,
          filled: filled,
          remaining: remaining,
          isFull: isFull,
        });

        // Check if current user is the task owner
        const currentUserId = getAuth().currentUser?.uid;
        setCanConfirm(updatedPost.userId === currentUserId);

        // Check if current user is confirmed
        const confirmed = confirmedWorkers.some(
          (worker) => worker?.userId === user.userId,
        );
        setIsConfirmed(confirmed);
      }
    });

    return () => unsubscribe();
  }, [postRequest?.id, user?.userId]);

  // Initial fetch
  useEffect(() => {
    fetchTaskData();
  }, [postRequest?.id]);

  // Data fetching for user profile
  useEffect(() => {
    if (user?.userId) {
      fetchUserData(user.userId);
    }
  }, [user]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      const detailedData = await fetchUserDetailedProfile(userId);
      setUserDetailedData(detailedData);

      const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserInterests(data?.interests || null);
        if (data?.biography) {
          const translateBio = async () => {
            try {
              const translated = await cachedTranslate(data.biography);
              setTranslatedBio(translated);
            } catch (e) {
              setTranslatedBio(data.biography); // fallback
            }
          };

          translateBio();
        }

        if (data?.interests) {
          const translateInterests = async () => {
            const translatedSelected = await Promise.all(
              (data.interests.selectedCategories || []).map(async (cat) => ({
                key: cat,
                label: await cachedTranslate(cat),
              })),
            );

            const translatedCustom = await Promise.all(
              (data.interests.customInterests || []).map(async (cat) => ({
                key: cat,
                label: await cachedTranslate(cat),
              })),
            );

            setTranslatedInterests({
              selectedCategories: translatedSelected,
              customInterests: translatedCustom,
            });
          };

          translateInterests();
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tasks?.completed?.length) return;

    const run = async () => {
      const map = {};

      for (const item of tasks.completed) {
        const desc = item?.taskDetails?.description;
        const type = item?.taskDetails?.taskType;

        if (!desc && !type) continue;

        try {
          map[item.id] = {
            description: desc ? await cachedTranslate(desc) : "",
            taskType: type ? await cachedTranslate(type) : "",
          };
        } catch {
          map[item.id] = {
            description: desc || "",
            taskType: type || "",
          };
        }
      }

      setTranslatedTasks(map);
    };

    run();
  }, [tasks?.completed]);

  useEffect(() => {
    if (!reviewsList?.length) return;

    const translateReviews = async () => {
      const map: Record<string, string> = {};

      for (const review of reviewsList) {
        if (!review?.reviewText) continue;

        try {
          const translated = await cachedTranslate(review.reviewText);
          map[review.id] = translated;
        } catch {
          map[review.id] = review.reviewText; // fallback
        }
      }

      setTranslatedReviews(map);
    };

    translateReviews();
  }, [reviewsList]);

  // Confirm applicant with slot limit check
  const handleConfirmApplicant = async () => {
    if (!applier || !postRequest?.id || !user?.userId || !canConfirm) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot confirm applicant",
      });
      return;
    }

    // Check if slots are full
    if (slotInfo.isFull) {
      Alert.alert(
        "All Slots Filled",
        `You have already confirmed all ${slotInfo.total} helpers needed for this task.`,
        [{ text: "OK", style: "default" }],
      );
      return;
    }

    // Check latest status
    try {
      const taskDocRef = doc(db, "taskRequests", postRequest.id);
      const docSnap = await getDoc(taskDocRef);
      if (docSnap.exists()) {
        const latestData = docSnap.data();
        const requiredWorkers = latestData.numberOfWorkers || 1;
        const confirmedCount = Array.isArray(latestData.confirmedWorkers)
          ? latestData.confirmedWorkers.length
          : 0;

        if (confirmedCount >= requiredWorkers) {
          Alert.alert(
            "All Slots Filled",
            `You have already confirmed all ${requiredWorkers} helpers needed for this task.`,
            [{ text: "OK", style: "default" }],
          );
          return;
        }

        const alreadyConfirmed = latestData.confirmedWorkers?.some(
          (worker) => worker.userId === user.userId,
        );

        if (alreadyConfirmed) {
          setIsConfirmed(true);
          Toast.show({
            type: "info",
            text1: "Already Confirmed",
            text2: "This applicant is already confirmed",
          });
          return;
        }
      }
    } catch (error) {
      console.log("Error checking latest status:", error);
    }

    if (isConfirmed) {
      Toast.show({
        type: "info",
        text1: "Already Confirmed",
        text2: "This applicant is already confirmed",
      });
      return;
    }
    confirmApplicant();
  };

  const confirmApplicant = async () => {
    try {
      setConfirming(true);
      const taskDocRef = doc(db, "taskRequests", postRequest.id);

      // Get latest data
      const docSnap = await getDoc(taskDocRef);
      let latestData = {};
      if (docSnap.exists()) {
        latestData = docSnap.data();
      }

      // Check slots one more time
      const requiredWorkers = latestData.numberOfWorkers || 1;
      const confirmedCount = Array.isArray(latestData.confirmedWorkers)
        ? latestData.confirmedWorkers.length
        : 0;

      if (confirmedCount >= requiredWorkers) {
        Toast.show({
          type: "error",
          text1: "All Slots Filled",
          text2: `Cannot confirm more than ${requiredWorkers} helpers`,
        });
        setConfirming(false);
        return;
      }
      const currentConfirmed = Array.isArray(
        latestData?.confirmedWorkers || postRequest.confirmedWorkers,
      )
        ? latestData?.confirmedWorkers || postRequest.confirmedWorkers
        : [];
      let currentApplied = [];
      const appliedSource =
        latestData?.appliedWorkers || postRequest.appliedWorkers;
      if (Array.isArray(appliedSource)) {
        currentApplied = appliedSource;
      } else if (appliedSource && typeof appliedSource === "object") {
        currentApplied = Object.values(appliedSource);
      }
      const confirmationData = {
        userId: user.userId,
        userName: user.userName,
        profileImage: user.profileImage || "",
        email: user.email || "",
        phone: user.phone || "",
        token: user.token || "",
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUser?.userData?.userId,
      };
      const updatedConfirmed = [...currentConfirmed, confirmationData];
      const updatedApplied = currentApplied.filter(
        (app) => app && app.userId !== user.userId,
      );
      await updateDoc(taskDocRef, {
        confirmedWorkers: updatedConfirmed,
        appliedWorkers: updatedApplied,
      });
      // Send confirmation notification
      await sendConfirmationNotification(confirmationData);
      // Save notification
      await saveConfirmationNotification(confirmationData);
      try {
        await createOrUpdateGroupChat(
          postRequest.id,
          {
            userId: currentUser?.userData?.userId,
            userName: currentUser?.userData?.userName,
            profileImage: currentUser?.userData?.profileImage || "",
            token: currentUser?.userData?.token || "",
          },
          {
            userId: user.userId,
            userName: user.userName,
            profileImage: user.profileImage || "",
            token: user.token || "",
          },
          postRequest?.taskType,
          postRequest?.customTaskTitle,
          postRequest?.description,
        );
      } catch (groupChatError) {
        console.log(
          "Group chat creation failed (non-blocking):",
          groupChatError,
        );
      }
      setIsConfirmed(true);
      Toast.show({
        type: "success",
        text1: "Applicant Confirmed",
        text2: `${user.userName} confirmed! (${updatedConfirmed.length}/${requiredWorkers} slots filled)`,
      });
    } catch (error) {
      console.error("Error confirming applicant:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to confirm applicant. Please try again.",
      });
    } finally {
      setConfirming(false);
    }
  };

  // Send confirmation notification
  const sendConfirmationNotification = async (worker) => {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: worker.token,
            title: "🎉 Application Confirmed!",
            body: `You have been confirmed for "${postRequest?.taskType}" task`,
            data: {
              type: "bulk_request_confirmation",
              postId: postRequest.id,
            },
          }),
        },
      );
      return await response.text();
    } catch (error) {
      console.log("Confirmation notification error:", error);
    }
  };

  // Save confirmation notification
  const saveConfirmationNotification = async (worker) => {
    try {
      const notificationData = {
        sender: {
          userId: currentUser?.userData?.userId,
          userName: currentUser?.userData?.userName,
          email: currentUser?.userData?.email,
          profileImage: currentUser?.userData?.profileImage || null,
          token: currentUser?.userData?.token,
        },
        receiver: {
          userId: worker.userId,
          name: worker.userName,
          email: worker.email,
          token: worker.token,
        },
        task: {
          id: postRequest?.id,
          title: postRequest?.taskType,
          description: postRequest?.description || "",
          isBulkRequest: true,
          confirmedPosition: (postRequest.confirmedWorkers?.length || 0) + 1,
          totalWorkers: postRequest.numberOfWorkers || 1,
        },
        type: "bulk_request_confirmation",
        timestamp: new Date().toISOString(),
        isRead: false,
        message: `You have been confirmed for "${postRequest?.taskType}" task`,
      };

      await addDoc(collection(db, "notifications"), notificationData);
    } catch (error) {
      console.log("Error saving confirmation notification:", error);
    }
  };

  // Start chat
  const handleStartChat = async () => {
    if (!userDetailedData?.userBasic?.userId) return;

    const currentUserId = getAuth().currentUser?.uid;
    try {
      const chatId = await createNewChat(
        currentUserId,
        userDetailedData.userBasic.userId,
      );
      navigation.navigate("Chat", {
        chatId: chatId,
        senderId: currentUserId,
        senderName: currentUser.userData.userName,
        receiver: userDetailedData.userBasic,
      });
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  // UI Helpers
  const getRankData = (completedCount: number) => {
    if (completedCount >= 3)
      return {
        label: t("profileRank.txt39"),
        icon: "trophy",
        color: "#FFD700",
        gradient: ["#FFD700", "#FFA500"],
      };
    if (completedCount >= 2)
      return {
        label: t("profileRank.txt40"),
        icon: "trending-up",
        color: "#FF9800",
        gradient: ["#FF9800", "#FF5722"],
      };
    return {
      label: t("profileRank.txt41"),
      icon: "leaf",
      color: "#4CAF50",
      gradient: ["#4CAF50", "#2E7D32"],
    };
  };

  const StatItem = ({ label, value, icon, color }) => (
    <View style={styles.statItem}>
      <LinearGradient
        colors={[color + "20", color + "10"]}
        style={styles.statIconContainer}
      >
        <Ionicons name={icon} size={RFPercentage(2.5)} color={color} />
      </LinearGradient>
      <Text style={[styles.statValue, { color: theme.heading }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.darkGrey }]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.white }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
          {t("profileRank.txt25")}
        </Text>
      </View>
    );
  }

  const rank = getRankData(stats?.completedTasks || 0);

  const light = ["#a5a5bd48", "#6183a9c7", "#3c6954c9"];
  const dark = ["#1f22388f", "#3a2850ff", "#9db7abff"];

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={"light-content"}
        backgroundColor={"transparent"}
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFILE HEADER SECTION */}
        <LinearGradient
          colors={theme.mode === "dark" ? dark : light}
          style={styles.headerGradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={[styles.backButton]}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.profileHero}>
            {/* Profile Avatar with Ring */}
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={rank.gradient}
                style={styles.avatarRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={
                      user?.profileImage ? { uri: user.profileImage } : Icons.dp
                    }
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>

              {/* Rank Badge */}
              <View style={styles.rankBadge}>
                <LinearGradient
                  colors={rank.gradient}
                  style={styles.rankGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={rank.icon as any}
                    size={RFPercentage(1.8)}
                    color="#FFF"
                  />
                </LinearGradient>
              </View>
            </View>

            {/* User Name and Status */}
            <View style={styles.nameContainer}>
              <Text style={[styles.nameText, { color: theme.pureWhite }]}>
                {userBasic?.userName || user?.userName}
              </Text>

              {/* Confirmation Status Badge */}
              {applier && isConfirmed && (
                <View style={styles.confirmedStatusBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={RFPercentage(1.8)}
                    color="#4CAF50"
                  />
                  <Text style={styles.confirmedStatusText}>
                    {t("profile.confirmed") || "Confirmed"}
                  </Text>
                </View>
              )}
            </View>

            {/* Rank and Success Rate */}
            <View style={styles.tagRow}>
              <LinearGradient
                colors={rank.gradient}
                style={styles.rankTag}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.rankLabel}>{rank.label}</Text>
              </LinearGradient>

              <View style={styles.successRateContainer}>
                <Ionicons
                  name="trending-up"
                  size={RFPercentage(1.5)}
                  color="#4CAF50"
                />
                <Text style={[styles.successText, { color: theme.darkGrey }]}>
                  {stats?.successRate || 0}% {t("profileRank.txt31")}
                </Text>
              </View>
            </View>

            {/* Bio */}
            <Text style={[styles.bioText, { color: theme.darkGrey }]}>
              {translatedBio
                ? translatedBio
                : userBasic?.biography ||
                  `${t("profileRank.txt23")} ${
                    stats?.completedTasks || 0
                  } tasks with high efficiency.`}
            </Text>

            {applier && canConfirm && (
              <View style={styles.actionSection}>
                <View style={styles.confirmationSection}>
                  {isConfirmed ? (
                    <></>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          slotInfo.isFull && styles.buttonDisabled,
                        ]}
                        onPress={handleConfirmApplicant}
                        disabled={confirming || slotInfo.isFull}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={
                            slotInfo.isFull
                              ? ["#CCCCCC", "#999999"]
                              : [Colors.primary, "#314495"]
                          }
                          style={styles.confirmButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          {confirming ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <View style={styles.confirmButtonContent}>
                              <View style={styles.confirmIconContainer}>
                                <Ionicons
                                  name={
                                    slotInfo.isFull
                                      ? "people"
                                      : "checkmark-circle"
                                  }
                                  size={RFPercentage(2.1)}
                                  color="#FFF"
                                />
                                <View style={styles.confirmIconGlow} />
                              </View>
                              <View style={styles.confirmTextContainer}>
                                <Text style={styles.confirmButtonTitle}>
                                  {slotInfo.isFull
                                    ? t("offerDetail.full")
                                    : t("profile.confirmApplicant") ||
                                      t("offerDetail.cnf")}
                                </Text>
                              </View>
                            </View>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.confirmButtonSubtitle,
                          { color: theme.darkGrey },
                        ]}
                      >
                        {slotInfo.filled}/{slotInfo.total}{" "}
                        {t("offerDetail.slt")} • {slotInfo.remaining}{" "}
                        {t("offerDetail.lft")}
                      </Text>
                    </>
                  )}
                </View>

                {/* Message Button */}
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={handleStartChat}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.messageButtonInner,
                      {
                        backgroundColor:
                          theme.mode === "dark"
                            ? "rgba(255, 255, 255, 0.3)"
                            : "rgba(112, 112, 120, 0.13)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={RFPercentage(2.2)}
                      color={Colors.primary}
                    />
                    <Text
                      style={[
                        styles.messageButtonText,
                        { color: Colors.primary },
                      ]}
                    >
                      {t("details.txt9")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* REGULAR PROFILE VIEW (non-applier or non-owner) */}
            {(!applier || !canConfirm) && (
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.fullMessageButton}
                  onPress={handleStartChat}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      theme.mode === "dark"
                        ? ["#2c1545ff", "#482074ff"]
                        : [Colors.primary, "#4c669f"]
                    }
                    style={styles.fullMessageButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={RFPercentage(2.2)}
                      color="#FFF"
                    />
                    <Text style={styles.fullMessageButtonText}>
                      {t("details.txt9")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* FLOATING STATS STRIP */}
        <View style={[styles.statsStrip, { backgroundColor: theme.white }]}>
          <StatItem
            label={t("profileRank.txt6")}
            value={stats?.activeTasks || 0}
            icon="flash-outline"
            color="#3498db"
          />
          <View style={styles.statDivider} />
          <StatItem
            label={t("profileRank.txt23")}
            value={stats?.completedTasks || 0}
            icon="checkmark-circle-outline"
            color="#2ecc71"
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Member Since"
            value={stats?.memberSince?.split(" ")[2] || "2024"}
            icon="calendar-outline"
            color="#e67e22"
          />
        </View>

        {/* ── USER INTERESTS SECTION ── */}
        {translatedInterests &&
          (translatedInterests.selectedCategories.length > 0 ||
            translatedInterests.customInterests.length > 0) && (
            <View
              style={[
                interestsSectionStyle.card,
                {
                  backgroundColor: theme.white,
                  borderColor:
                    theme.mode === "dark"
                      ? "rgba(21, 20, 22, 1)"
                      : "rgba(238,238,238,1)",
                },
              ]}
            >
              {/* Header */}
              <View style={interestsSectionStyle.header}>
                <LinearGradient
                  colors={["#293596ff", "#918fb8ff"]}
                  style={interestsSectionStyle.iconBg}
                >
                  <FontAwesome5
                    name="heart"
                    size={RFPercentage(1.3)}
                    color="#fff"
                    solid
                  />
                </LinearGradient>
                <Text
                  style={[
                    interestsSectionStyle.title,
                    { color: theme.heading },
                  ]}
                >
                  Interests
                </Text>
                <View
                  style={[
                    interestsSectionStyle.countBadge,
                    { backgroundColor: Colors.primary + "18" },
                  ]}
                >
                  <Text
                    style={[
                      interestsSectionStyle.countText,
                      { color: Colors.primary },
                    ]}
                  >
                    {(userInterests.selectedCategories?.length || 0) +
                      (userInterests.customInterests?.length || 0)}
                  </Text>
                </View>
              </View>

              {/* Pills */}
              <View style={interestsSectionStyle.pillsWrap}>
                {translatedInterests?.selectedCategories?.map((item) => (
                  <InterestPill key={item.key} item={item} />
                ))}
                {translatedInterests?.customInterests?.map((item) => (
                  <InterestPill key={item.key} item={item} isCustom />
                ))}
              </View>
            </View>
          )}

        {/* TABS SELECTION */}
        <View style={styles.tabWrapper}>
          <View
            style={[
              styles.tabContainer,
              {
                backgroundColor: theme.mode === "dark" ? "#1A1A1A" : "#F1F3F5",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "completed" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("completed")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "completed" ? "#FFF" : theme.grey },
                ]}
                numberOfLines={1}
              >
                {t("profileRank.txt34")} ({tasks?.completed?.length || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
              onPress={() => setActiveTab("reviews")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "reviews" ? "#FFF" : theme.grey },
                ]}
                numberOfLines={1}
              >
                {t("profileRank.txt35")} ({reviews?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT SECTION */}
        <View style={styles.contentSection}>
          {activeTab === "completed" ? (
            tasks?.completed && tasks?.completed?.length > 0 ? (
              <>
                {visibleCompletedTasks.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.taskCard,
                      {
                        backgroundColor: theme.white,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: item.taskDetails.imageUrls?.[0] }}
                      style={styles.taskImg}
                    />
                    <BlurView
                      intensity={80}
                      tint="dark"
                      style={styles.taskOverlay}
                    >
                      <Text style={styles.taskType}>
                        {translatedTasks[item.id]?.taskType ??
                          item.taskDetails.taskType}
                      </Text>
                    </BlurView>

                    <View style={styles.taskInfo}>
                      <Text
                        style={[styles.taskTitle, { color: theme.heading }]}
                        numberOfLines={2}
                      >
                        {translatedTasks[item.id]?.description ??
                          item.taskDetails.description}
                      </Text>

                      <Text style={[styles.taskDate, { color: theme.grey }]}>
                        {t("myRequests.txt3")}{" "}
                        {moment(
                          item.completedAt?.seconds
                            ? item.completedAt.seconds * 1000
                            : item.completedAt,
                        ).format("MMM DD, YYYY")}
                      </Text>
                    </View>
                  </View>
                ))}

                {/*SHOW MORE COMPLETED */}
                {tasks.completed.length > 3 && !showAllCompleted && (
                  <TouchableOpacity
                    onPress={() => setShowAllCompleted(true)}
                    style={styles.showMoreBtn}
                  >
                    <Text style={styles.showMoreText}>
                      +{tasks.completed.length - 3} more
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="checkbox-multiple-marked-circle-outline"
                  size={RFPercentage(4)}
                  color={theme.grey}
                />
                <Text style={[styles.emptyTitle, { color: theme.heading }]}>
                  {t("myRequests.noCompletedTasks")}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                  {t("myRequests.noCompletedTasksDesc")}
                </Text>
              </View>
            )
          ) : reviews && reviews?.length > 0 ? (
            <>
              {visibleReviews.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor:
                        theme.mode === "dark" ? "#0a090cff" : "#FFF",
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <Image
                      source={
                        item?.reviewer?.profileImage
                          ? { uri: item?.reviewer?.profileImage }
                          : Icons.dp
                      }
                      style={styles.revAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.revName, { color: theme.heading }]}>
                        {item?.reviewer?.userName}
                      </Text>
                      <View style={styles.starRow}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name="star"
                            size={RFPercentage(1.5)}
                            color={i < item?.rating ? "#FFD700" : "#DDD"}
                          />
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.revName,
                          {
                            color: Colors.primary,
                            fontFamily: "Poppins_400Regular",
                            fontSize: 12,
                          },
                        ]}
                      >
                        {moment(item.createdAt.seconds * 1000).format(
                          "DD MMMM YYYY",
                        )}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.revText, { color: theme.darkGrey }]}>
                    "{translatedReviews[item.id] ?? item?.reviewText}"
                  </Text>
                </View>
              ))}
              {reviews.length > 3 && !showAllReviews && (
                <TouchableOpacity
                  onPress={() => setShowAllReviews(true)}
                  style={styles.showMoreBtn}
                >
                  <Text style={styles.showMoreText}>
                    +{reviews.length - 3} more
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="comment-text-outline"
                size={RFPercentage(4)}
                color={theme.grey}
              />
              <Text style={[styles.emptyTitle, { color: theme.heading }]}>
                {t("myRequests.noReviews")}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                {t("myRequests.noReviewsDesc")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: RFPercentage(2),
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  scrollContent: {
    paddingBottom: RFPercentage(5),
  },

  // Header Section
  headerGradient: {
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(4),
    borderBottomLeftRadius: RFPercentage(2),
    borderBottomRightRadius: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHero: {
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
    paddingTop: RFPercentage(10),
  },

  // Avatar
  avatarWrapper: {
    position: "relative",
    marginBottom: RFPercentage(2),
  },
  avatarRing: {
    padding: RFPercentage(0.5),
    borderRadius: RFPercentage(100),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarContainer: {
    borderRadius: RFPercentage(100),
    overflow: "hidden",
  },
  avatar: {
    width: RFPercentage(14),
    height: RFPercentage(14),
    borderRadius: RFPercentage(7),
  },
  rankBadge: {
    position: "absolute",
    bottom: RFPercentage(1),
    right: RFPercentage(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rankGradient: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },

  // Name and Status
  nameContainer: {
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  nameText: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.5),
  },
  confirmedStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50" + "20",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(0.5),
  },
  confirmedStatusText: {
    color: "#4CAF50",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.3),
  },

  // Tags
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: RFPercentage(2),
    gap: RFPercentage(1),
  },
  rankTag: {
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(2),
  },
  rankLabel: {
    color: "#FFF",
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },
  successRateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  successText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },

  // Bio
  bioText: {
    textAlign: "center",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    marginBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },

  // Action Section
  actionSection: {
    width: "100%",
    marginBottom: RFPercentage(2),
  },
  confirmationSection: {
    marginBottom: RFPercentage(1.5),
  },

  // Slot Status Styles
  slotStatusContainer: {
    width: "100%",
    marginBottom: RFPercentage(2),
    padding: RFPercentage(2),
    backgroundColor: "rgba(79, 70, 229, 0.05)",
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.1)",
  },
  slotStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.2),
  },
  slotStatusTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
  slotProgressContainer: {
    width: "100%",
  },
  slotProgressBar: {
    height: RFPercentage(0.8),
    borderRadius: RFPercentage(0.4),
    overflow: "hidden",
    marginBottom: RFPercentage(0.8),
  },
  slotProgressFill: {
    height: "100%",
    borderRadius: RFPercentage(0.4),
  },
  slotStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  slotStatText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
  },

  // Confirm Button Styles
  confirmButton: {
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderRadius: RFPercentage(3),
    alignSelf: "center",
    width: "50%",
    marginBottom: RFPercentage(1),
  },
  confirmButtonGradient: {
    paddingVertical: RFPercentage(1.5),
    width: "100%",
    borderRadius: RFPercentage(3),
  },
  confirmButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1.5),
  },
  confirmIconContainer: {
    position: "relative",
  },
  confirmIconGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: RFPercentage(3),
    backgroundColor: "#FFF",
    opacity: 0.2,
  },
  confirmTextContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  confirmButtonTitle: {
    color: "#FFF",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_700Bold",
    // marginBottom: RFPercentage(0.3),
  },
  confirmButtonSubtitle: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },

  // Confirmed State Styles
  confirmedContainer: {
    borderRadius: RFPercentage(3),
    padding: RFPercentage(2),
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: "100%",
  },
  confirmedContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1.5),
  },
  confirmedIconContainer: {
    position: "relative",
  },
  confirmedIconGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: RFPercentage(3),
    backgroundColor: "#FFF",
    opacity: 0.2,
  },
  confirmedTextContainer: {
    alignItems: "center",
  },
  confirmedTitle: {
    color: "#FFF",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.3),
  },
  confirmedSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },

  // Disabled Button Style
  buttonDisabled: {
    opacity: 0.7,
  },

  backButton: {
    width: 30,
    height: 30,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Glass-morphism effect
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: RFPercentage(8),
    left: RFPercentage(3),
  },

  // Message Button
  messageButton: {
    marginHorizontal: RFPercentage(1),
  },
  messageButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(3),
    borderRadius: RFPercentage(3),
    gap: RFPercentage(1),
  },
  messageButtonText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },

  // Full Message Button (non-applier)
  fullMessageButton: {
    borderRadius: RFPercentage(3),
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    width: "50%",
    alignSelf: "center",
  },
  fullMessageButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(3),
    gap: RFPercentage(1),
  },
  fullMessageButtonText: {
    color: "#FFF",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },

  // Stats Strip
  statsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(-3),
    padding: RFPercentage(2),
    backgroundColor: "#FFF",
    borderRadius: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconContainer: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  statValue: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.3),
  },
  statLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(187, 187, 187, 0.73)",
    marginHorizontal: RFPercentage(0.5),
  },

  // Tabs
  tabWrapper: {
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(4),
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(0.3),
  },
  tab: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    alignItems: "center",
    borderRadius: RFPercentage(1.7),
  },
  activeTab: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    paddingHorizontal: 10,
  },
  tabText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },

  // Content Section
  contentSection: {
    padding: RFPercentage(3),
    paddingTop: RFPercentage(2),
  },

  // Task Card
  taskCard: {
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  taskImg: {
    width: "100%",
    height: RFPercentage(20),
  },
  taskOverlay: {
    position: "absolute",
    top: RFPercentage(1),
    right: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    overflow: "hidden",
  },
  taskType: {
    color: "#FFF",
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },
  taskInfo: {
    padding: RFPercentage(2),
  },
  taskTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    marginBottom: RFPercentage(0.5),
  },
  taskDate: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },

  // Review Card
  reviewCard: {
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    gap: RFPercentage(1),
  },
  revAvatar: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
  },
  revName: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  starRow: {
    flexDirection: "row",
    gap: RFPercentage(0.2),
    marginTop: RFPercentage(0.5),
  },
  revText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular_Italic",
    lineHeight: RFPercentage(2),
  },

  // Empty States
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(6),
    paddingHorizontal: RFPercentage(5),
  },
  emptyTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(0.5),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: RFPercentage(1.4),
    textAlign: "center",
    lineHeight: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
  },
  showMoreBtn: {
    alignSelf: "center",
    marginVertical: RFPercentage(1.5),
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.primary + "20",
  },
  showMoreText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
});

const interestsSectionStyle = StyleSheet.create({
  card: {
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(3),
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.2),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.9),
    marginBottom: RFPercentage(1.8),
  },
  iconBg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(0.8),
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: RFPercentage(1.1),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(5),
  },
  countText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(0.9),
  },
});

export default TopRatedUserProfile;
