import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import MyAppButton from "../components/common/MyAppButton";
import NotFound from "../components/common/NotFound";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { getFormatedDate } from "../services/Shared.service";
import { fetchCompletedTasksFromFirebase } from "../services/Review.service";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";
import CustomNav from "../components/common/CustomNav";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";

type Translations = {
  completedTasks: string;
  category: string;
  completedOn: string;
  review: string;
  reviewed: string;
  noTasks: string;
  translating: string;
  helpers: string;
  confirmedHelpers: string;
  youWereConfirmed: string;
  bulkTask: string;
  viewHelpers: string;
  alreadyReviewed: string;
  reviewAdded: string;
  cnf: string;
};

export default function CompletedTasks({ navigation }: any) {
  const [tr, setTr] = useState<Partial<Translations>>({});
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<any[]>([]);
  const [cache, setCache] = useState<
    Record<string, { desc: string; category: string }>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { theme } = useAppTheme();
  const [userReviews, setUserReviews] = useState<Set<string>>(new Set());

  const currentUserId = getAuth().currentUser?.uid;

  // Translations-----
  useEffect(() => {
    (async () => {
      const base: Translations = {
        completedTasks: "Completed Tasks",
        category: "Category",
        completedOn: "Completed on",
        review: "Add Review",
        reviewed: "Reviewed",
        noTasks: "No completed tasks",
        translating: "Translating...",
        helpers: "Helpers",
        confirmedHelpers: "Confirmed Helpers",
        youWereConfirmed: "You were confirmed as a helper",
        bulkTask: "Bulk Task",
        viewHelpers: "View Helpers",
        alreadyReviewed: "Review Pending",
        reviewAdded: "Review Added",
        cnf: "You were a confirmed helper in this bulk task",
      };
      const vals = await Promise.all(
        Object.values(base).map((txt) => cachedTranslate(txt))
      );
      const mapped = Object.keys(base).reduce((obj, k, i) => {
        obj[k as keyof Translations] = vals[i] || base[k as keyof Translations];
        return obj;
      }, {} as Translations);

      setTr(mapped);
    })();
  }, []);

  // Fetch user's reviews to check what they've already reviewed
  const fetchUserReviews = async (): Promise<Set<string>> => {
    if (!currentUserId) return new Set<string>();
    try {
      const reviewsQuery = query(
        collection(FIREBASE_DB, "reviews"),
        where("reviewer.userId", "==", currentUserId)
      );
      const querySnapshot = await getDocs(reviewsQuery);
      const reviewedTaskIds: Set<string> = new Set();
      querySnapshot.forEach((doc) => {
        const reviewData = doc.data();
        if (reviewData.taskId) {
          reviewedTaskIds.add(reviewData.taskId as string);
        }
      });
      return reviewedTaskIds;
    } catch (error) {
      console.log("Error fetching user reviews:", error);
      return new Set<string>();
    }
  };

  // Fetching Completed Tasks-------------
  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const records = await fetchCompletedTasksFromFirebase();
      const userReviewedTasks = await fetchUserReviews();
      setUserReviews(userReviewedTasks);
      const newCache = { ...cache };
      await Promise.all(
        records.map(async (task: any) => {
          if (newCache[task.id]) return;
          const originalDesc = task.taskDetails?.description || "";
          const originalCat = task.taskDetails?.taskType || "";
          const [descTr, catTr] = await Promise.all([
            originalDesc ? cachedTranslate(originalDesc) : "",
            originalCat ? cachedTranslate(originalCat) : "",
          ]);
          newCache[task.id] = {
            desc: descTr || originalDesc,
            category: catTr || originalCat,
          };
        })
      );
      setCache(newCache);
      setTasks(records);
    } catch (e) {
      console.log("Task fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedTasks();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCompletedTasks();
    }, [])
  );

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text
            key={i}
            style={{
              color: i <= rating ? Colors.star : Colors.stroke,
              fontSize: RFPercentage(1.8),
            }}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  const hasUserReviewedTask = (taskId: string, task: any) => {
    if (task.isPersonalReview) return true;
    if (task.reviewed) {
      if (task.reviewer?.userId === currentUserId) {
        return true;
      }
      if (
        task.taskDetails?.isBulkRequest &&
        task.taskOwnerId === task.taskDetails?.user?.userId
      ) {
        return true;
      }
    }
    return false;
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const details = item.taskDetails || {};
    const owner = details.user || {};
    const doneOn =
      item.completedAt || item.acceptedAt || new Date().toISOString();
    const cached = cache[item.id] as
      | { desc?: string; category?: string }
      | undefined;
    const desc = cached?.desc ?? tr.translating;
    const catName = cached?.category ?? tr.translating;
    const isBulkTask = details.numberOfWorkers > 1 || details.isBulkRequest;
    const taskId = item.taskId || item.id;
    const hasReviewed = hasUserReviewedTask(taskId, item);
    const userIsConfirmedHelper = isBulkTask && item.isConfirmedHelper;

    return (
      <View
        style={[
          styles.taskCard,
          {
            backgroundColor: theme.white,
            borderColor:
              theme.mode === "dark" ? theme.border : "rgba(236, 238, 251, 1)",
          },
        ]}
      >
        {/* Bulk Task Info Banner */}
        {isBulkTask && userIsConfirmedHelper && (
          <View
            style={[
              styles.bulkTaskBanner,
              { backgroundColor: Colors.primary + "05" },
            ]}
          >
            <Ionicons
              name="people"
              size={RFPercentage(1.6)}
              color={Colors.lightGrey}
            />
            <Text
              style={[styles.bulkTaskBannerText, { color: Colors.lightGrey }]}
            >
              {tr.cnf}
            </Text>
          </View>
        )}

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              style={styles.avatar}
              source={
                owner?.profileImage ? { uri: owner?.profileImage } : Icons.dp
              }
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.darkGrey }]}>
                {owner.userName || "User"}
              </Text>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.success2 + "30"
                        : Colors.success2 + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: hasReviewed ? Colors.success2 : Colors.success2 },
                  ]}
                >
                  {catName}
                </Text>
              </View>
            </View>
          </View>

          {/* Review Status */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: hasReviewed ? Colors.success2 : Colors.primary,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {hasReviewed
                ? tr.reviewAdded || "Review Added"
                : tr.alreadyReviewed || "Review Pending"}
            </Text>
          </View>
        </View>

        {/* Task Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: theme.heading }]}>
            {desc}
          </Text>
        </View>

        {/* Bulk Task Stats */}
        {isBulkTask && (
          <View
            style={[
              styles.bulkStatsContainer,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.primary + "20"
                    : Colors.primary + "10",
              },
            ]}
          >
            <View style={styles.bulkStatItem}>
              <Ionicons
                name="people"
                size={RFPercentage(1.6)}
                color={theme.darkGrey}
              />
              <Text style={[styles.bulkStatText, { color: theme.darkGrey }]}>
                {details?.numberOfWorkers || 1} {t("common.helpers")}
              </Text>
            </View>
            <View
              style={[
                styles.bulkStatDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <View style={styles.bulkStatItem}>
              <Ionicons
                name="checkmark-circle"
                size={RFPercentage(1.6)}
                color="#4CAF50"
              />
              <Text style={[styles.bulkStatText, { color: "#4CAF50" }]}>
                {details.confirmedWorkers?.length || 0}{" "}
                {t("offerDetail.confirmed")}
              </Text>
            </View>
          </View>
        )}

        {/* Date Section */}
        <View
          style={[
            styles.dateContainer,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "30"
                  : Colors.primary + "10",
            },
          ]}
        >
          <Text style={styles.dateLabel}>
            {tr.completedOn || "Completed on"}
          </Text>
          <Text style={[styles.date, { color: theme.darkGrey }]}>
            {getFormatedDate(doneOn)}
          </Text>
        </View>

        {/* Action Section */}
        <View
          style={[
            styles.actionContainer,
            {
              borderTopColor:
                theme.mode === "dark" ? theme.border : "rgba(236, 238, 251, 1)",
            },
          ]}
        >
          {hasReviewed ? (
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>{`${t(
                  "completed.txt3"
                )}`}</Text>
                <StarRating rating={item.rating || 0} />
              </View>
              {item.reviewText && (
                <View
                  style={[
                    styles.reviewTextContainer,
                    {
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(24, 26, 40, 1)"
                          : Colors.lightWhite,
                    },
                  ]}
                >
                  <Text style={[styles.reviewText, { color: theme.darkGrey }]}>
                    "{item.reviewText}"
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.reviewButtonContainer}>
              <MyAppButton
                title={tr.review || "Add Review"}
                height={RFPercentage(5)}
                marginTop={0}
                onPress={() =>
                  navigation.navigate("AddReview", {
                    task: item,
                    isBulkTask: isBulkTask,
                    taskOwner: owner,
                    isConfirmedHelper: userIsConfirmedHelper,
                  })
                }
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav title={t("profile.txt4")} showBack />

      {/* Stats Overview */}
      {!loading && tasks?.length > 0 && (
        <View
          style={[
            styles.statsContainer,
            {
              backgroundColor:
                theme.mode === "dark" ? Colors.primary + "30" : Colors.white,
            },
          ]}
        >
          <View style={[styles.statItem]}>
            <Text style={styles.statNumber}>{tasks?.length}</Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {`${t("completed.txt4")}`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {
                tasks.filter((task) =>
                  hasUserReviewedTask(task.taskId || task.id, task)
                ).length
              }
            </Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {`${t("completed.txt5")}`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {
                tasks.filter(
                  (task) => !hasUserReviewedTask(task.taskId || task.id, task)
                ).length
              }
            </Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {`${t("completed.txt6")}`}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{`${t("completed.txt7")}`}</Text>
          </View>
        ) : tasks.length === 0 ? (
          <NotFound title={tr.noTasks || "No completed tasks yet"} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary, Colors.secondary]}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: RFPercentage(25),
              offset: RFPercentage(25) * index,
              index,
            })}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: Colors.white,
    shadowColor: Colors.primary + "20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: "row",
    margin: RFPercentage(2),
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    shadowColor: Colors.primary + "30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: RFPercentage(2.1),
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    marginBottom: RFPercentage(0.5),
  },
  statLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: RFPercentage(1),
  },
  selectedTaskHeader: {
    marginHorizontal: RFPercentage(2),
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    gap: RFPercentage(1),
  },
  selectedTaskText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey,
    marginTop: RFPercentage(2),
  },
  listContent: {
    padding: RFPercentage(2),
    paddingTop: RFPercentage(1),
  },
  scrollToNotice: {
    marginBottom: RFPercentage(1),
    padding: RFPercentage(1),
    backgroundColor: Colors.primary + "10",
    borderRadius: RFPercentage(1),
  },
  scrollToText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    fontStyle: "italic",
  },
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    marginBottom: RFPercentage(2),
    padding: RFPercentage(2.5),
    shadowColor: Colors.primary + "40",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: RFPercentage(1.5),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(3),
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userDetails: {
    marginLeft: RFPercentage(1.5),
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.darkGrey,
    marginBottom: RFPercentage(0.5),
  },
  categoryBadge: {
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(1),
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
  bulkIndicator: {
    padding: RFPercentage(0.5),
    borderRadius: RFPercentage(0.8),
    marginRight: RFPercentage(0.5),
  },
  statusIndicator: {
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
  },
  statusText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  descriptionContainer: {
    marginBottom: RFPercentage(1.5),
  },
  description: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    color: Colors.heading,
    lineHeight: RFPercentage(2.2),
  },
  bulkTaskContainer: {
    marginBottom: RFPercentage(1.5),
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1.2),
  },
  bulkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  bulkTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  bulkStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(0.8),
  },
  bulkStat: {
    flex: 1,
    alignItems: "center",
  },
  bulkStatLabel: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(0.2),
    textAlign: "center",
  },
  bulkStatValue: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
  },

  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(0.8),
    marginTop: RFPercentage(0.5),
    gap: RFPercentage(0.3),
  },
  confirmedText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },
  viewHelpersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(0.8),
    marginTop: RFPercentage(1),
    gap: RFPercentage(0.3),
  },
  viewHelpersText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(2),
    padding: RFPercentage(1.2),
    backgroundColor: Colors.lightPrimary,
    borderRadius: RFPercentage(1),
  },
  dateLabel: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
    marginRight: RFPercentage(0.5),
  },
  date: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: RFPercentage(1.5),
  },
  reviewSection: {
    // Review content styles
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  reviewTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  reviewTextContainer: {
    backgroundColor: Colors.lightWhite,
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    borderLeftWidth: 2,
    borderLeftColor: Colors.star,
  },
  reviewText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: Colors.darkGrey,
    fontStyle: "italic",
    lineHeight: RFPercentage(2),
  },
  reviewButtonContainer: {
    alignItems: "flex-end",
  },
  starRow: {
    flexDirection: "row",
  },
  star: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderRadius: RFPercentage(0.5),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: RFPercentage(0.2),
  },
  // Add to your styles:
  bulkTaskBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: RFPercentage(1),
    borderRadius: RFPercentage(0.8),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  bulkTaskBannerText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
  bulkStatsContainer: {
    flexDirection: "row",
    padding: RFPercentage(1),
    borderRadius: RFPercentage(1),
    marginBottom: RFPercentage(1.5),
    justifyContent: "space-around",
  },
  bulkStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  bulkStatText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
  bulkStatDivider: {
    width: 1,
    height: "100%",
  },
});
