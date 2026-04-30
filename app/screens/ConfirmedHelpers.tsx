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
            backgroundColor: theme.white,
            borderWidth: 1,
            borderColor: theme.lightWhite,
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
            <AvatarInitials name={item?.userName} style={[styles.helperImage,{borderColor:groupTextColor}]} />
          )}

          <View style={styles.helperDetails}>
            <Text style={[styles.helperName, { color: theme.heading }]}>
              {item.userName || "Unknown User"}
            </Text>
            <Text style={[styles.helperEmail, { color: theme.darkGrey }]}>
              {item.email || ""}
            </Text>

            {item.confirmedAt && (
              <Text style={[styles.confirmedDate, { color: theme.darkGrey }]}>
                {t("offerDetail.confirmedOn")}:{" "}
                {new Date(item.confirmedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

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
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.primary + "05"
                    : Colors.primary + "10",
              },
            ]}
            onPress={() => handleStartChat(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-outline"
              size={RFPercentage(1.5)}
              color={Colors.primary}
            />
            <Text style={styles.messageButtonText}>
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

      <View style={[styles.taskInfo]}>
        <Image
          source={{ uri: task?.imageUrls[0] }}
          resizeMode="cover"
          style={{
            width: "100%",
            height: RFPercentage(30),
            borderRadius: RFPercentage(2),
          }}
        />
        <Text style={[styles.taskTitle, { color: theme.heading }]}>
          {task.taskType || task.title || "Task"}
        </Text>

        <Text style={[styles.taskDescription, { color: theme.darkGrey }]}>
          {task.description?.substring(0, 100) || "No description"}
          {task.description?.length > 100 ? "..." : ""}
        </Text>

        <View style={styles.taskStatusRow}>
          <Text style={[styles.taskStatus, { color: theme.darkGrey }]}>
            {t("taskApplicants.status")}:{" "}
            <Text style={{ color: Colors.green }}>{task.status}</Text>
          </Text>

          {task.reviewedAccepter && (
            <View style={styles.taskReviewedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={RFPercentage(1.3)}
                color={Colors.green}
              />
              <Text style={styles.taskReviewedText}>
                {task.isBulkRequest ? "Some helpers reviewed" : "Task reviewed"}
              </Text>
            </View>
          )}
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
    marginTop:RFPercentage(2)
    // padding: RFPercentage(2),
  },
  taskTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(1),
  },
  taskStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: RFPercentage(0.5),
  },
  taskStatus: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
  },
  taskReviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.green + "30",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(0.5),
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
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helperInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  helperImage: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    marginRight: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  helperDetails: {
    flex: 1,
  },
  helperName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  helperEmail: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(0.3),
  },
  confirmedDate: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: RFPercentage(1),
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(1),
    flex: 1,
  },
  reviewButtonText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    color: Colors.white,
    marginLeft: RFPercentage(0.5),
  },
  reviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.green + "30",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1),
    flex: 1,
  },
  reviewedText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    color: Colors.green,
    marginLeft: RFPercentage(0.5),
  },
  cannotReviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1),
    flex: 1,
  },
  cannotReviewText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey,
    marginLeft: RFPercentage(0.5),
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(1),
    flex: 1,
    justifyContent: "center",
  },
  messageButtonText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    color: Colors.primary,
    marginLeft: RFPercentage(0.5),
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
