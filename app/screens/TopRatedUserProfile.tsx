import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useAppTheme } from "../contexts/themeContext";
import Nav from "../components/common/Nav";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";

import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import MyAppButton from "../components/common/MyAppButton";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import { fetchUserDetailedProfile } from "../services/User.service";
import moment from "moment";
import { createNewChat } from "../services/Chat.service";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import { cachedTranslate } from "../utils/cachedTranslations";
import {
  formatCurrency,
  convertCurrency,
  getCurrencyInfo,
} from "../utils/currencyChange";
import { useLocation } from "../utils/useLocation";

const TopRatedUserProfile = ({ navigation, route }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { user } = route.params || {};
  const [userDetailedData, setUserDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("completed"); // 'completed' or 'reviews'
  const [translatedTasks, setTranslatedTasks] = useState([]);
  const [translatedReviews, setTranslatedReviews] = useState([]);
  const { location: currentLocation } = useLocation();

  const getConvertedCompensation = (task) => {
    if (task?.compensationType !== "Monitarely") return null;
    try {
      const originalAmount = parseFloat(task.monitarily) || 0;
      const locationToUse = currentLocation;
      if (!task.currencyInfo) {
        return formatCurrency(originalAmount, locationToUse);
      }
      const targetCurrency = getCurrencyInfo(locationToUse).code;
      const convertedAmount = convertCurrency(
        originalAmount,
        task.currencyInfo.code,
        targetCurrency
      );
      return formatCurrency(convertedAmount, locationToUse);
    } catch (error) {
      console.log("Currency conversion error:", error);
      return formatCurrency(parseFloat(task.monitarily) || 0, currentLocation);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchUserData(user.userId);
    }
  }, [user]);

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      const detailedData = await fetchUserDetailedProfile(userId);
      setUserDetailedData(detailedData);
      if (detailedData?.tasks?.completed) {
        const translated = await translateTasks(detailedData.tasks.completed);
        setTranslatedTasks(translated);
      }

      // Translate review data
      if (detailedData?.reviews) {
        const translated = await translateReviews(detailedData.reviews);
        setTranslatedReviews(translated);
      }
    } catch (error) {
      console.log("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const translateTasks = async (tasks) => {
    const translatedTasks = [];
    for (const task of tasks) {
      try {
        const translatedTask = { ...task };
        // Translate task description
        if (task.taskDetails?.description) {
          translatedTask.taskDetails.description = await cachedTranslate(
            task.taskDetails.description
          );
        }
        // Translate task type
        if (task.taskDetails?.taskType) {
          translatedTask.taskDetails.taskType = await cachedTranslate(
            task.taskDetails.taskType
          );
        }
        // Translate other compensation
        if (
          task.taskDetails?.compensationType === "Other" &&
          task.taskDetails?.otherCompensation
        ) {
          translatedTask.taskDetails.otherCompensation = await cachedTranslate(
            task.taskDetails.otherCompensation
          );
        }
        translatedTasks.push(translatedTask);
      } catch (error) {
        console.log("Error translating task:", error);
        translatedTasks.push(task); // Fallback to original task
      }
    }
    return translatedTasks;
  };

  // Translate review text
  const translateReviews = async (reviews) => {
    const translatedReviews = [];
    for (const review of reviews) {
      try {
        const translatedReview = { ...review };
        // Translate review text
        if (review.reviewText) {
          translatedReview.reviewText = await cachedTranslate(
            review.reviewText
          );
        }
        translatedReviews.push(translatedReview);
      } catch (error) {
        console.log("Error translating review:", error);
        translatedReviews.push(review); // Fallback to original review
      }
    }
    return translatedReviews;
  };

  // Calculate category based on completed tasks
  const getUserCategory = (completedCount) => {
    if (completedCount >= 3) return "Top Rated";
    if (completedCount >= 2) return "Rising Talent";
    return "Beginner";
  };

  const getCategoryBadge = (completedCount) => {
    const category = getUserCategory(completedCount);
    switch (category) {
      case "Top Rated":
        return {
          icon: "trophy",
          color: Colors.primary,
          text: `${t("profileRank.txt39")}`,
        };
      case "Rising Talent":
        return {
          icon: "trending-up",
          color: Colors.primary,
          text: `${t("profileRank.txt40")}`,
        };
      default:
        return {
          icon: "leaf",
          color: Colors.primary,
          text: `${t("profileRank.txt41")}`,
        };
    }
  };

  // StatCard Component
  const StatCard = ({ icon, value, label, color }) => (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.white, borderColor: theme.border },
      ]}
    >
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "15" }]}
      >
        {icon}
      </View>
      <Text style={[styles.statValue, { color: theme.heading }]}>{value}</Text>
      <Text
        style={[styles.statLabel, { color: theme.darkGrey }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  // Render actual completed tasks
  const renderTaskItem = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.taskCard,
        { backgroundColor: theme.white, borderColor: theme.border },
      ]}
      onPress={() => {
        console.log(item?.taskDetails);
      }}
    >
      <View style={{ width: "100%" }}>
        <Image
          source={item?.taskDetails?.imageUrls}
          resizeMode="cover"
          style={{ width: "100%", height: RFPercentage(18) }}
        />
      </View>
      <View style={styles.taskContent}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={
              item?.taskDetails?.user?.profileImage
                ? { uri: item?.taskDetails?.user?.profileImage }
                : Icons.dp
            }
            resizeMode="contain"
            style={{
              width: RFPercentage(5),
              height: RFPercentage(5),
              borderRadius: RFPercentage(100),
              borderWidth: RFPercentage(0.2),
              borderColor: Colors.primary,
            }}
          />
          <Text
            style={[
              styles.taskTitle,
              { color: theme.heading, marginLeft: RFPercentage(1.3) },
            ]}
          >
            {item?.taskDetails?.user?.userName.substr(0, 8) +
              (item?.taskDetails?.user?.userName.length > 8 ? "..." : "")}
          </Text>

          <View style={styles.taskMeta}>
            <Text style={[styles.completedDate, { color: theme.grey }]}>
              {t("profileRank.txt23")} :{" "}
              {item.completedAt
                ? moment(item.completedAt.seconds * 1000).format(
                    "MMMM DD, YYYY"
                  )
                : `${t("profileRank.txt24")}`}
            </Text>
          </View>
        </View>

        {item.taskDetails?.description && (
          <Text
            style={[styles.taskDescription, { color: theme.darkGrey }]}
            numberOfLines={2}
          >
            {item.taskDetails?.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          {item?.taskDetails && (
            <View style={styles.compensationContainer}>
              <Image
                tintColor={Colors.primary}
                source={require("../../assets/Images/compensation.png")}
                style={styles.compensationIcon}
              />
              <Text style={styles.compensationText}>
                {item.taskDetails.compensationType === "Monitarely"
                  ? getConvertedCompensation(item.taskDetails)
                  : item.taskDetails.otherCompensation?.substr(0, 15) +
                    (item.taskDetails.otherCompensation?.length > 15
                      ? "..."
                      : "")}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.successBadge,
              { backgroundColor: Colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={RFPercentage(1.6)}
              color={Colors.primary}
            />
            <Text style={[styles.successText, { color: Colors.primary }]}>
              {item?.taskDetails?.taskType}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render review items
  const renderReviewItem = ({ item }) => (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: theme.white, borderColor: theme.border },
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Image
            source={
              item.reviewer.profileImage
                ? { uri: item.reviewer.profileImage }
                : Icons.dp
            }
            style={styles.reviewerAvatar}
          />
          <View>
            <Text style={[styles.reviewerName, { color: theme.heading }]}>
              {item.reviewer.userName}
            </Text>
            <Text style={[styles.reviewDate, { color: theme.grey }]}>
              {item.createdAt
                ? moment(item.createdAt.seconds * 1000).format("MMMM DD, YYYY")
                : `${t("profileRank.txt24")}`}
            </Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? "star" : "star-outline"}
              size={RFPercentage(1.6)}
              color={Colors.star || "#FFD700"}
            />
          ))}
        </View>
      </View>
      <Text style={[styles.reviewComment, { color: theme.darkGrey }]}>
        "{item.reviewText}"
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.white }]}>
        <Nav
          marginTop={RFPercentage(5)}
          leftLogo={false}
          navigation={navigation}
          title={`${t("profileRank.txt27")}`}
          dpNull
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
            {t("profileRank.txt25")}
          </Text>
        </View>
      </View>
    );
  }

  if (!userDetailedData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.white }]}>
        <Nav
          marginTop={RFPercentage(5)}
          leftLogo={false}
          navigation={navigation}
          title={t("profileRank.txt27")}
          dpNull
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.darkGrey }]}>
            {t("profileRank.txt26")}
          </Text>
        </View>
      </View>
    );
  }

  const { userBasic, stats, tasks, reviews } = userDetailedData;
  const categoryBadge = getCategoryBadge(stats.completedTasks);

  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;

  const handleStartChat = async () => {
    const chatId = await createNewChat(currentUserId, userBasic.userId);
    navigation.navigate("Chat", {
      chatId: chatId,
      senderId: currentUserId,
      senderName: currentUser.userData.userName,
      receiver: userBasic,
    });
  };

  console.log("stats,,,,,,,,,,,,,", stats);

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      <Nav
        marginTop={RFPercentage(5)}
        leftLogo={false}
        navigation={navigation}
        title={t("profileRank.txt27")}
        dpNull
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  user?.profileImage ? { uri: user.profileImage } : Icons.dp
                }
                style={[styles.avatar, { borderColor: categoryBadge.color }]}
              />
              <View
                style={[
                  styles.categoryBadge,
                  {
                    borderColor: categoryBadge.color + "20",
                    backgroundColor: categoryBadge.color,
                  },
                ]}
              >
                <Ionicons
                  name={categoryBadge?.icon}
                  size={RFPercentage(1.5)}
                  color={Colors.white}
                />
                <Text
                  style={[styles.categoryBadgeText, { color: Colors.white }]}
                >
                  {categoryBadge.text}
                </Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.heading }]}>
                {user?.name || userBasic?.userName || "Unknown User"}
              </Text>
              <Text style={[styles.userTitle, { color: Colors.primary }]}>
                {stats.completedTasks >= 3
                  ? `${t("profileRank.txt28")}`
                  : stats.completedTasks >= 2
                  ? `${t("profileRank.txt29")}`
                  : `${t("profileRank.txt30")}`}{" "}
                • {stats.successRate}% {`${t("profileRank.txt31")}`}
              </Text>
              <Text style={[styles.userBio, { color: theme.darkGrey }]}>
                {userBasic?.biography ||
                  `${t("profileRank.txt23")} ${stats.completedTasks} ${t(
                    "profileRank.txt32"
                  )} ${stats.successRate}% ${t("profileRank.txt33")}.`}
              </Text>
            </View>
          </View>

          <View
            style={{
              alignSelf: "center",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
              flexDirection: "row",
              marginTop: RFPercentage(2),
            }}
          >
            <Text style={[styles.memberSince, { color: theme.grey }]}>
              {t("profileRank.txt9")} {stats.memberSince}
            </Text>
            <MyAppButton
              title={t("details.txt9")}
              marginTop={RFPercentage(0)}
              width="42%"
              onPress={() => {
                handleStartChat();
              }}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={
              <MaterialIcons
                name="pending-actions"
                size={RFPercentage(2)}
                color={Colors.primary}
              />
            }
            value={stats.activeTasks}
            label={`${t("profileRank.txt6")}`}
            color={Colors.primary}
          />
          <StatCard
            icon={
              <MaterialIcons
                name="task-alt"
                size={RFPercentage(2)}
                color="#45B356"
              />
            }
            value={stats.completedTasks}
            label={`${t("profileRank.txt23")}`}
            color="#45B356"
          />
          <StatCard
            icon={
              <Ionicons
                name="trending-up"
                size={RFPercentage(2)}
                color="#a96d28ff"
              />
            }
            value={`${stats.successRate}%`}
            label={`${t("profileRank.txt31")}`}
            color="#FF6B35"
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "completed" && [
                styles.activeTab,
                { backgroundColor: Colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("completed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "completed"
                  ? styles.activeTabText
                  : { color: theme.darkGrey },
              ]}
            >
              {t("profileRank.txt34")} ({tasks.completed.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "reviews" && [
                styles.activeTab,
                { backgroundColor: Colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reviews"
                  ? styles.activeTabText
                  : { color: theme.darkGrey },
              ]}
            >
              {t("profileRank.txt35")} ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {activeTab === "completed" ? (
            (translatedTasks.length > 0 ? translatedTasks : tasks.completed)
              .length > 0 ? (
              <FlatList
                data={
                  translatedTasks.length > 0 ? translatedTasks : tasks.completed
                }
                renderItem={renderTaskItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.tasksList}
              />
            ) : (
              <Text style={[styles.noDataText, { color: theme.grey }]}>
                {t("profileRank.txt36")}
              </Text>
            )
          ) : (translatedReviews.length > 0 ? translatedReviews : reviews)
              .length > 0 ? (
            <FlatList
              data={translatedReviews.length > 0 ? translatedReviews : reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reviewsList}
            />
          ) : (
            <Text style={[styles.noDataText, { color: theme.grey }]}>
              {t("profileRank.txt37")}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TopRatedUserProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    padding: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: RFPercentage(2),
  },
  avatar: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(6),
    borderWidth: 3,
    borderColor: Colors.primary + "20",
  },
  categoryBadge: {
    // position: "absolute",
    bottom: RFPercentage(1),
    left: RFPercentage(0),
    right: RFPercentage(0),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(0),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: RFPercentage(10),
    alignSelf: "center",
  },
  categoryBadgeText: {
    fontSize: RFPercentage(0.8),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.3),
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.5),
  },
  userTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  userBio: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(1),
  },
  memberSince: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
  },
  statsGrid: {
    flexDirection: "row",
    padding: RFPercentage(2),
    paddingBottom: RFPercentage(1),
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: RFPercentage(1.5),
    marginHorizontal: RFPercentage(0.5),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(1),
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
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(1),
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: RFPercentage(1),
    padding: RFPercentage(0.3),
  },
  tab: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(0.8),
    alignItems: "center",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  activeTabText: {
    color: Colors.white,
  },
  contentSection: {
    flex: 1,
    padding: RFPercentage(2),
  },
  tasksList: {
    paddingBottom: RFPercentage(2),
  },
  reviewsList: {
    paddingBottom: RFPercentage(2),
  },
  taskCard: {
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    marginBottom: RFPercentage(2),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskHeader: {
    position: "relative",
  },
  taskImage: {
    width: "100%",
    height: RFPercentage(16),
  },

  categoryText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  taskContent: {
    padding: RFPercentage(2),
  },
  taskTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  taskMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    right: 0,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientAvatar: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    marginRight: RFPercentage(0.8),
  },
  clientName: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  completedDate: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  taskDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    marginTop: RFPercentage(1),
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  compensationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compensationIcon: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    marginRight: RFPercentage(0.5),
  },
  compensationText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(0.8),
  },
  successText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.3),
  },
  reviewCard: {
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: RFPercentage(1),
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reviewerAvatar: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    marginRight: RFPercentage(1),
    borderWidth: RFPercentage(0.15),
    borderColor: Colors.primary,
  },
  reviewerName: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
  reviewDate: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  ratingContainer: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: RFPercentage(1.4),
    lineHeight: RFPercentage(2),
    fontStyle: "italic",
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  noDataText: {
    textAlign: "center",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(5),
  },
});
