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
import {
  fetchUserDetailedProfile,
  isUserDeleted,
} from "../services/User.service";
import { sendPushToUser } from "../utils/pushNotify";
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
  arrayRemove,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { createOrUpdateGroupChat } from "../services/GroupChat.service";
import { FontAwesome5 } from "@expo/vector-icons";
import { cachedTranslate } from "../utils/cachedTranslations";
import ProfileHeader from "../components/TopRatedUserProfile/ProfileHeader";
import StatsStrip from "../components/TopRatedUserProfile/StatsStrip";
import InterestsSection from "../components/TopRatedUserProfile/InterestsSection";
import TaskCard from "../components/TopRatedUserProfile/TaskCard";
import ReviewCard from "../components/TopRatedUserProfile/ReviewCard";

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
  console.log("Translated Tasks:", translatedTasks);
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
  const { userBasic, stats, tasks, reviews } : any= userDetailedData || {};

  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const completedTasks = tasks?.completed || [];
  const reviewsList = reviews || [];

  const visibleCompletedTasks = showAllCompleted
    ? completedTasks
    : completedTasks.slice(0, INITIAL_COUNT);

  // Group reviews by reviewer so a user with multiple reviews renders as a
  // single card: profile shown once, all their reviews listed beneath it.
  // Group order follows first appearance in the existing sort order; reviews
  // within a group also keep the existing order. Presentation-only change.
  const groupedReviews = reviewsList.reduce(
    (groups : any, review: any) => {
      const key =
        review?.reviewer?.userId || review?.reviewer?.userName || "unknown";
      const existing = groups.find((g: any) => g.key === key);
      if (existing) {
        existing.reviews.push(review);
      } else {
        groups.push({ key, reviewer: review?.reviewer, reviews: [review] });
      }
      return groups;
    },
    [] as { key: string; reviewer: any; reviews: any[] }[],
  );

  const visibleReviewGroups = showAllReviews
    ? groupedReviews
    : groupedReviews.slice(0, INITIAL_COUNT);

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
        const id = item?.taskId; // FIX

        if (!id || (!desc && !type)) continue;

        try {
          map[id] = {
            description: desc ? await cachedTranslate(desc) : "",
            taskType: type ? await cachedTranslate(type) : "",
          };
        } catch {
          map[id] = {
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

      // Guard: never confirm a helper who has deleted their account (covers
      // confirming from an old application notification). Prune them from the
      // applicants list and abort.
      if (await isUserDeleted(user.userId)) {
        try {
          const applied = Array.isArray(latestData?.appliedWorkers)
            ? latestData.appliedWorkers.filter(
                (a: any) => a && a.userId !== user.userId,
              )
            : [];
          await updateDoc(taskDocRef, {
            appliedWorkers: applied,
            appliedWorkerIds: arrayRemove(user.userId),
          });
        } catch (pruneError) {
          console.log("Failed to prune deleted applicant:", pruneError);
        }
        Toast.show({
          type: "error",
          text1: t("taskApplicants.deletedUser.title"),
          text2: t("taskApplicants.deletedUser.message"),
        });
        setConfirming(false);
        return;
      }

      // Check slots one more time
      const requiredWorkers = latestData?.numberOfWorkers || 1;
      const confirmedCount = Array.isArray(latestData.confirmedWorkers)
        ? latestData?.confirmedWorkers.length
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
        appliedWorkerIds: arrayRemove(user.userId),
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

  // Send confirmation notification (skips deleted accounts / stale tokens)
  const sendConfirmationNotification = async (worker) => {
    await sendPushToUser({
      userId: worker.userId,
      token: worker.token,
      title: "🎉 Application Confirmed!",
      body: `You have been confirmed for "${postRequest?.taskType}" task`,
      data: {
        type: "bulk_request_confirmation",
        postId: postRequest.id,
      },
    });
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
    console.log("completedCount.....", completedCount);
    if (completedCount >= 6)
      return {
        label: t("profileRank.txt39"),
        icon: "diamond",
        color: "#bfa824ff",
        gradient: ["rgba(255, 215, 0, 0.1)","rgba(255, 215, 0, 0.1)"],
      };
    if (completedCount >= 2)
      return {
        label: t("profileRank.txt40"),
        icon: "rocket",
        color: "#79b7b0ff",
        gradient: ["#71a5821a", "#71a5821a"],
      };
    return {
      label: t("profileRank.txt41"),
      icon: "leaf",
      color: "#9b6fc1ff",
      gradient: ["#d3c2e23a", "#d3c2e23a"],
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
        <ActivityIndicator
          size="large"
          color={theme.mode === "dark" ? Colors.darkGrey : Colors.primary}
        />
        <Text
          style={[
            styles.loadingText,
            { color: theme.mode === "dark" ? Colors.darkGrey : Colors.primary },
          ]}
        >
          {t("profileRank.txt25")}
        </Text>
      </View>
    );
  }

  const rank = getRankData(stats?.completedTasks || 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFILE HEADER */}
        <ProfileHeader
          userBasic={userBasic}
          rank={rank}
          translatedBio={translatedBio}
          applier={applier}
          canConfirm={canConfirm}
          isConfirmed={isConfirmed}
          slotInfo={slotInfo}
          confirming={confirming}
          handleConfirmApplicant={handleConfirmApplicant}
          handleStartChat={handleStartChat}
          theme={theme}
          t={t}
          navigation={navigation}
          stats={stats}
        />

        {/* FLOATING STATS STRIP */}
        <StatsStrip stats={stats} theme={theme} t={t} />

        {/* INTERESTS */}
        <InterestsSection
          translatedInterests={translatedInterests}
          userInterests={userInterests}
          theme={theme}
        />

        {/* TABS */}
        <View style={styles.tabWrapper}>
          <View
            style={[
              styles.tabContainer,
              {
                backgroundColor:
                  theme.mode === "dark" ? "rgba(255,255,255,0.06)" : "#F6F7F9",
                borderWidth: 1,
                borderColor:
                  theme.mode === "dark"
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(17,24,39,0.08)",
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

        {/* CONTENT */}
        {activeTab === "completed" ? (
          completedTasks && completedTasks.length > 0 ? (
            <>
              <View style={{ marginTop: RFPercentage(3) }}>
                {visibleCompletedTasks.map((item, idx) => (
                  <TaskCard
                    key={item.id || idx}
                    item={item}
                    translatedText={translatedTasks[item.taskId]?.description}
                    translatedTaskType={translatedTasks[item.taskId]?.taskType}
                    t={t}
                    theme={theme}
                  />
                ))}
                {tasks.completed.length > INITIAL_COUNT &&
                  !showAllCompleted && (
                    <TouchableOpacity
                      onPress={() => setShowAllCompleted(true)}
                      style={[
                        styles.showMoreBtn,
                        {
                          borderColor:
                            theme.mode === "dark"
                              ? Colors.white
                              : Colors.primary + "55",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.showMoreText,
                          {
                            color:
                              theme.mode === "dark"
                                ? Colors.white
                                : Colors.primary,
                          },
                        ]}
                      >
                        +{tasks.completed.length - INITIAL_COUNT} more
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
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
        ) : reviews && reviews.length > 0 ? (
          <>
            <View style={{ marginTop: RFPercentage(3) }}>
              {visibleReviewGroups.map((group, i) => (
                <ReviewCard
                  key={group.key || i}
                  group={group}
                  translatedMap={translatedReviews}
                  theme={theme}
                  t={t}
                />
              ))}
              {groupedReviews.length > INITIAL_COUNT && !showAllReviews && (
                <TouchableOpacity
                  onPress={() => setShowAllReviews(true)}
                  style={[
                    styles.showMoreBtn,
                    {
                      borderColor:
                        theme.mode === "dark"
                          ? Colors.white
                          : Colors.primary + "55",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.showMoreText,
                      {
                        color:
                          theme.mode === "dark" ? Colors.white : Colors.primary,
                      },
                    ]}
                  >
                    +{groupedReviews.length - INITIAL_COUNT} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    fontSize: RFPercentage(1.8),
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
    paddingVertical: RFPercentage(0.3),
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
    borderRadius: RFPercentage(1.8),
    padding: RFPercentage(0.4),
  },
  tab: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    alignItems: "center",
    borderRadius: RFPercentage(1.4),
  },
  activeTab: {
    backgroundColor: Colors.primary,
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
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary + "55",
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
