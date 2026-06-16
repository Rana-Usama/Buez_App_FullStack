import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { Icons } from "../config/theme";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { createNewChat } from "../services/Chat.service";
import { useUser } from "../contexts/user.context";
import CustomNav from "../components/common/CustomNav";
import AvatarInitials from "../components/common/DefaultAvatars";
import { getAvatarColors } from "../config/avatarColors";

interface ReviewType {
  id: string;
  reviewedUserId?: string;
  recipient?: { userId: string };
  [key: string]: any;
}

function ConfirmedHelpers({ route, navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { userData: currentUser } = useUser();
  const { task } = route.params;

  const [confirmedHelpers, setConfirmedHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();
  const currentUserId = getAuth().currentUser?.uid;

  // Check if user has reviewed a helper
  const checkIfReviewed = async (workerId) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const reviewQuery = query(
        reviewsRef,
        where("taskId", "==", task.id),
        where("reviewedUserId", "==", workerId),
        where("reviewerId", "==", currentUserId),
      );
      const reviewSnapshot = await getDocs(reviewQuery);

      console.log(`Checking review for worker ${workerId}:`, {
        taskId: task.id,
        reviewerId: currentUserId,
        found: !reviewSnapshot.empty,
        count: reviewSnapshot.size,
      });

      return !reviewSnapshot.empty;
    } catch (error) {
      console.log("Error checking review status:", error);
      return false;
    }
  };

  // Fetch complete user data for confirmed workers
  const fetchUserData = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.log("Error fetching user data:", error);
      return null;
    }
  };

  // Get all reviews for this task
  const fetchAllTaskReviews = async () => {
    try {
      const reviewsRef = collection(db, "reviews");
      const reviewQuery = query(reviewsRef, where("taskId", "==", task.id));
      const reviewSnapshot = await getDocs(reviewQuery);
      const reviews: ReviewType[] = reviewSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReviewType, "id">),
      }));

      // Create a map of reviewed user IDs
      const reviewedUserIds = new Set();
      reviews.forEach((review) => {
        if (review?.reviewedUserId) {
          reviewedUserIds.add(review?.reviewedUserId);
        }
        if (review?.recipient?.userId) {
          reviewedUserIds.add(review?.recipient?.userId);
        }
      });

      return {
        reviews,
        reviewedUserIds,
        reviewCount: reviews.length,
      };
    } catch (error) {
      console.log("Error fetching task reviews:", error);
      return { reviews: [], reviewedUserIds: new Set(), reviewCount: 0 };
    }
  };

  const fetchConfirmedHelpers = async () => {
    try {
      setLoading(true);
      const { reviews, reviewedUserIds } = await fetchAllTaskReviews();
      let helpers = [];
      if (task.confirmedWorkers && task.confirmedWorkers.length > 0) {
        const helpersWithData = await Promise.all(
          task.confirmedWorkers.map(async (worker) => {
            const userData = await fetchUserData(worker.userId);
            let hasReviewed = reviewedUserIds.has(worker.userId);
            if (!hasReviewed) {
              hasReviewed = await checkIfReviewed(worker.userId);
            }
            const canReview = task.status === "Completed" && !hasReviewed;

            return {
              ...worker,
              ...userData,
              hasReviewed,
              canReview,
              userId: worker.userId || userData?.userId,
              userName: worker.userName || userData?.userName || "Unknown User",
              email: worker.email || userData?.email || "",
              profileImage:
                worker.profileImage || userData?.profileImage || null,
              confirmedAt:
                worker.confirmedAt || worker.userConfirmation?.confirmedAt,
            };
          }),
        );
        helpers = helpersWithData;
      }
      // For single accepted tasks (non-bulk)
      else if (task.acceptedBy && task.acceptedBy.userId) {
        const userData = await fetchUserData(task.acceptedBy.userId);
        // Check if reviewed
        let hasReviewed = reviewedUserIds.has(task.acceptedBy.userId);
        if (!hasReviewed) {
          hasReviewed = await checkIfReviewed(task.acceptedBy.userId);
        }
        const canReview = task.status === "Completed" && !hasReviewed;

        helpers = [
          {
            ...task.acceptedBy,
            ...userData,
            hasReviewed,
            canReview,
            userId: task.acceptedBy.userId,
            userName:
              task.acceptedBy.userName || userData?.userName || "Unknown User",
            email: task.acceptedBy.email || userData?.email || "",
            profileImage:
              task.acceptedBy.profileImage || userData?.profileImage || null,
            confirmedAt: task.acceptedBy.confirmedAt || task.confirmedAt,
          },
        ];
      }

      setConfirmedHelpers(helpers);
    } catch (error) {
      console.log("Error fetching confirmed helpers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedHelpers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConfirmedHelpers();
    setRefreshing(false);
  };

  const handleStartChat = async (receiverUser) => {
    try {
      const chatId = await createNewChat(currentUserId, receiverUser.userId);
      navigation.navigate("Chat", {
        chatId,
        senderId: currentUserId,
        senderName: currentUser?.userName,
        receiver: receiverUser,
      });
    } catch (err) {
      console.log("Chat start error:", err);
    }
  };

  const handleAddReview = (worker) => {
    navigation.navigate("AddReviewToAccepter", {
      task: {
        ...task,
        acceptedBy: worker,
        taskId: task.id,
        isBulkRequest: task.isBulkRequest,
        bulkWorkerId: worker.userId,
      },
    });
  };


  

  const renderHelperItem = ({ item, index }) => {

      const isDark = theme.mode === "dark";
    
      const firstLetter = item?.userName.trim()?.[0];
      const [, groupTextColor] = getAvatarColors(firstLetter, isDark);


    return (
      <View
        style={[
          styles.helperCard,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255,255,255,0.10)"
              : "rgba(17,24,39,0.08)",
          },
        ]}
      >
        <View style={styles.helperInfo}>
          {item?.profileImage ? (
            <Image
              style={styles.helperImage}
              source={{ uri: item.profileImage }}
              resizeMode="cover"
            />
          ) : (
            <AvatarInitials
              name={item?.userName}
              style={[styles.helperImage, { borderColor: groupTextColor }]}
            />
          )}

          <View style={styles.helperDetails}>
            <Text style={[styles.helperName, { color: theme.heading }]}>
              {item.userName || "Unknown User"}
            </Text>
            <Text
              style={[styles.helperEmail, { color: theme.darkGrey }]}
              numberOfLines={1}
            >
              {item.email || ""}
            </Text>

            {item.confirmedAt && (
              <View style={styles.confirmedDateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={RFPercentage(1.3)}
                  color={theme.darkGrey}
                />
                <Text
                  style={[styles.confirmedDate, { color: theme.darkGrey }]}
                >
                  {t("offerDetail.confirmedOn")}:{" "}
                  {new Date(item.confirmedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.helperDivider,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(17,24,39,0.06)",
            },
          ]}
        />

        <View style={styles.actionButtons}>
          {item.canReview ? (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => handleAddReview(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="star"
                size={RFPercentage(1.5)}
                color={Colors.white}
              />
              <Text style={styles.reviewButtonText}>
                {t("myRequests.addReview") || "Add Review"}
              </Text>
            </TouchableOpacity>
          ) : item.hasReviewed ? (
            <View style={styles.reviewedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={RFPercentage(1.8)}
                color={Colors.green}
              />
              <Text style={styles.reviewedText}>
                {t("myRequests.reviewed") || "Reviewed"}
              </Text>
            </View>
          ) : (
            <View style={styles.cannotReviewBadge}>
              <Ionicons
                name="time-outline"
                size={RFPercentage(1.8)}
                color={Colors.darkGrey}
              />
              <Text style={styles.cannotReviewText}>
                {task.status !== "Completed"
                  ? "Task not completed"
                  : "Cannot Review"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.messageButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : Colors.primary + "0D",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.12)"
                  : Colors.primary + "33",
              },
            ]}
            onPress={() => handleStartChat(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-outline"
              size={RFPercentage(1.5)}
              color={isDark ? Colors.white : Colors.primary}
            />
            <Text style={[styles.messageButtonText,{color: isDark ? Colors.white : Colors.primary}]}>
              {t("details.txt9") || "Message"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />

      <CustomNav title={t("myRequests.confirmedHelpers")} />

      {/* Compact task summary card */}
      <View
        style={[
          styles.taskInfo,
          {
            backgroundColor:
              theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderColor:
              theme.mode === "dark"
                ? "rgba(255,255,255,0.10)"
                : "rgba(17,24,39,0.08)",
          },
        ]}
      >
        <Image
          source={{ uri: task?.imageUrls[0] }}
          resizeMode="cover"
          style={styles.taskThumb}
        />
        <View style={styles.taskMeta}>
          <Text
            style={[styles.taskTitle, { color: theme.heading }]}
            numberOfLines={1}
          >
            {task.taskType || task.title || "Task"}
          </Text>

          <Text
            style={[styles.taskDescription, { color: theme.darkGrey }]}
            numberOfLines={2}
          >
            {task.description?.substring(0, 100) || "No description"}
            {task.description?.length > 100 ? "..." : ""}
          </Text>

          <View style={styles.taskStatusRow}>
            <View style={styles.taskStatusPill}>
              <View style={styles.taskStatusDot} />
              <Text style={styles.taskStatus} numberOfLines={1}>
                {task.status}
              </Text>
            </View>

            {task.reviewedAccepter && (
              <View style={styles.taskReviewedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={RFPercentage(1.3)}
                  color={Colors.green}
                />
                <Text style={styles.taskReviewedText} numberOfLines={1}>
                  {task.isBulkRequest
                    ? "Some helpers reviewed"
                    : "Task reviewed"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
            Loading confirmed helpers...
          </Text>
        </View>
      ) : confirmedHelpers.length > 0 ? (
        <FlatList
          data={confirmedHelpers}
          renderItem={renderHelperItem}
          keyExtractor={(item, index) => `${item.userId}_${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={[styles.helpersCount, { color: theme.heading }]}>
                {confirmedHelpers.length} Confirmed{" "}
                {confirmedHelpers.length === 1 ? "helper" : "helpers"}
              </Text>
              <Text style={[styles.headerNote, { color: theme.darkGrey }]}>
                You can review helpers and message them directly
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={[styles.emptyText, { color: theme.darkGrey }]}>
                No helpers found
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="people-outline"
            size={RFPercentage(10)}
            color={theme.darkGrey + "50"}
          />
          <Text style={[styles.emptyText, { color: theme.heading }]}>
            No confirmed helpers
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.darkGrey }]}>
            This task has no confirmed helpers
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  taskInfo: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(2),
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: RFPercentage(1.4),
    gap: RFPercentage(1.4),
  },
  taskThumb: {
    width: RFPercentage(9),
    height: RFPercentage(9),
    borderRadius: 12,
  },
  taskMeta: {
    flex: 1,
  },
  taskTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  taskStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
    marginTop: RFPercentage(0.8),
  },
  taskStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    backgroundColor: Colors.green + "15",
    borderWidth: 1,
    borderColor: Colors.green + "55",
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(100),
  },
  taskStatusDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: RFPercentage(0.4),
    backgroundColor: Colors.green,
  },
  taskStatus: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.green,
  },
  taskReviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    backgroundColor: Colors.green + "15",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(100),
  },
  taskReviewedText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    color: Colors.green,
    marginLeft: RFPercentage(0.3),
  },
  reviewSummary: {
    marginBottom: RFPercentage(0.5),
  },
  reviewSummaryText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
  },
  taskDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  headerContainer: {
    marginBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(1),
  },
  helpersCount: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  headerNote: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
  },
  listContainer: {
    padding: RFPercentage(2),
  },
  helperCard: {
    borderRadius: 16,
    padding: RFPercentage(1.8),
    marginBottom: RFPercentage(1.4),
  },
  helperInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  helperImage: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.6),
    marginRight: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.primary + "33",
  },
  helperDetails: {
    flex: 1,
  },
  helperName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.2),
  },
  helperEmail: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(0.3),
  },
  confirmedDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  confirmedDate: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  helperDivider: {
    height: 1,
    width: "100%",
    marginVertical: RFPercentage(1.4),
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: RFPercentage(1.2),
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.5),
    backgroundColor: Colors.primary,
    height: RFPercentage(4.6),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1.4),
    flex: 1,
  },
  reviewButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  reviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.5),
    backgroundColor: Colors.green + "15",
    borderWidth: 1,
    borderColor: Colors.green + "55",
    height: RFPercentage(4.6),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1.4),
    flex: 1,
  },
  reviewedText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.green,
  },
  cannotReviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.5),
    backgroundColor: Colors.lightGrey + "40",
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    height: RFPercentage(4.6),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1.4),
    flex: 1,
  },
  cannotReviewText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.5),
    height: RFPercentage(4.6),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1.4),
    flex: 1,
  },
  messageButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: RFPercentage(5),
    bottom:RFPercentage(10)
  },
  emptyText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(2),
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
    textAlign: "center",
    paddingHorizontal: RFPercentage(5),
  },
  emptyList: {
    padding: RFPercentage(5),
    alignItems: "center",
  },
});

export default ConfirmedHelpers;
