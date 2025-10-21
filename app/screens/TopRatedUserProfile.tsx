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
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import Nav from "../components/common/Nav";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import InputField from "../components/common/AuthInputField";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Feather from "@expo/vector-icons/Feather";
import MyAppButton from "../components/common/MyAppButton";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const TopRatedUserProfile = ({ navigation, route }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { user } = route.params || {};

  const [activeTab, setActiveTab] = useState("completed"); // 'completed' or 'reviews'

  // Mock data - replace with actual API data
  const userStats = {
    activeTasks: 3,
    completedTasks: 23,
    successRate: 98,
    memberSince: "April 4, 2024",
    bio: "I am passionate Mobile App Developer with expertise in React Native. I love creating efficient solutions and helping others with technical tasks.",
    rating: 4.9,
  };

  const completedTasks = [
    {
      id: 1,
      title: "Help in Gardening on Weekend",
      category: "Gardening",
      client: "Emma Stone",
      completedDate: "04-03-2025",
      compensation: "$60",
      image: Icons.garden,
      description:
        "Need help with garden maintenance and planting seasonal flowers in the backyard...",
    },
    {
      id: 2,
      title: "App Development Consultation",
      category: "Technical",
      client: "John Doe",
      completedDate: "02-03-2025",
      compensation: "$120",
      image: Icons.dp,
      description:
        "Mobile app development guidance and code review for React Native project...",
    },
  ];

  const reviews = [
    {
      id: 1,
      client: "Emma Stone",
      rating: 5,
      comment:
        "Sana did an amazing job with my garden! Very professional and attention to detail.",
      date: "1 week ago",
    },
    {
      id: 2,
      client: "John Doe",
      rating: 5,
      comment:
        "Excellent technical guidance. Helped me fix critical issues in my app.",
      date: "2 weeks ago",
    },
  ];

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
      <Text style={[styles.statLabel, { color: theme.darkGrey }]}>{label}</Text>
    </View>
  );

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.taskCard,
        { backgroundColor: theme.white, borderColor: theme.border },
      ]}
    >
      <View style={styles.taskHeader}>
        <Image
          source={item.image}
          resizeMode="cover"
          style={styles.taskImage}
        />
        <LinearGradient
          colors={[Colors.primary, "#4557B0"]}
          style={styles.categoryBadge}
        >
          <Text style={styles.categoryText}>{item.category}</Text>
        </LinearGradient>
      </View>

      <View style={styles.taskContent}>
        <Text
          style={[styles.taskTitle, { color: theme.heading }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View style={styles.taskMeta}>
          <View style={styles.clientInfo}>
            <Image source={Icons.profile2} style={styles.clientAvatar} />
            <Text style={[styles.clientName, { color: theme.darkGrey }]}>
              {item.client}
            </Text>
          </View>
          <Text style={[styles.completedDate, { color: theme.grey }]}>
            Completed: {item.completedDate}
          </Text>
        </View>

        <Text
          style={[styles.taskDescription, { color: theme.darkGrey }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={styles.taskFooter}>
          <View style={styles.compensationContainer}>
            <Image
              tintColor={Colors.primary}
              source={require("../../assets/Images/compensation.png")}
              style={styles.compensationIcon}
            />
            <Text style={styles.compensationText}>{item.compensation}</Text>
          </View>
          <View
            style={[
              styles.successBadge,
              { backgroundColor: Colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="checkmark-done"
              size={RFPercentage(1.6)}
              color={Colors.primary}
            />
            <Text style={[styles.successText, { color: Colors.primary }]}>
              Completed
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }) => (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: theme.white, borderColor: theme.border },
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Image source={Icons.profile2} style={styles.reviewerAvatar} />
          <View>
            <Text style={[styles.reviewerName, { color: theme.heading }]}>
              {item.client}
            </Text>
            <Text style={[styles.reviewDate, { color: theme.grey }]}>
              {item.date}
            </Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? "star" : "star-outline"}
              size={RFPercentage(1.6)}
              color={Colors.star}
            />
          ))}
        </View>
      </View>
      <Text style={[styles.reviewComment, { color: theme.darkGrey }]}>
        "{item.comment}"
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      <Nav
        marginTop={RFPercentage(5)}
        leftLogo={false}
        navigation={navigation}
        title={"Profile"}
        dpNull
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={Icons.dp} style={styles.avatar} />
              <View style={styles.topRatedBadge}>
                <Ionicons
                  name="trophy"
                  size={RFPercentage(1.8)}
                  color="#FFD700"
                />
                <Text style={styles.topRatedText}>Top Rated</Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.heading }]}>
                Sana Asghar
              </Text>
              <Text style={[styles.userTitle, { color: Colors.primary }]}>
                Task Expert • {userStats.successRate}% Success Rate
              </Text>
              <Text style={[styles.userBio, { color: theme.darkGrey }]}>
                {userStats.bio}
              </Text>
              <Text style={[styles.memberSince, { color: theme.grey }]}>
                Member since {userStats.memberSince}
              </Text>
            </View>
          </View>
          <View style={{ alignSelf: "center", alignItems: "center" , width:"100%"}}>
            <MyAppButton
              title={t("details.txt9")}
              marginTop={RFPercentage(2)}
              width="60%"
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
            value={userStats.activeTasks}
            label="Active Tasks"
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
            value={userStats.completedTasks}
            label="Completed"
            color="#45B356"
          />
          <StatCard
            icon={
              <Ionicons
                name="trending-up"
                size={RFPercentage(2)}
                color="#FF6B35"
              />
            }
            value={`${userStats.successRate}%`}
            label="Success Rate"
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
              Completed Tasks ({completedTasks.length})
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
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {activeTab === "completed" ? (
            <FlatList
              data={completedTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tasksList}
            />
          ) : (
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reviewsList}
            />
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
  topRatedBadge: {
    position: "absolute",
    bottom: -RFPercentage(1),
    left: RFPercentage(2),
    right: RFPercentage(2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    borderColor: Colors.primary + "20",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRatedText: {
    color: Colors.primary,
    fontSize: RFPercentage(1),
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
  categoryBadge: {
    position: "absolute",
    top: RFPercentage(1),
    right: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(0.8),
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
    marginBottom: RFPercentage(1),
  },
  taskMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1),
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
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  taskDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    fontStyle: "italic",
  },
});
