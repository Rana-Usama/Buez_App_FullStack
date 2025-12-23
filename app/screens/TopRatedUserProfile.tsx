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
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import CustomNav from "../components/common/CustomNav"; // Using the modern nav component
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import moment from "moment";

// --- Service & Context Imports (Your Original Logic) ---
import { fetchUserDetailedProfile } from "../services/User.service";
import { createNewChat } from "../services/Chat.service";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
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
  const { location: currentLocation } = useLocation();
  const currentUser = useUser();

  // State
  const [userDetailedData, setUserDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("completed"); // 'completed' or 'reviews'

  // --- Logic: Currency Conversion (Kept Original) ---
  const getConvertedCompensation = (task) => {
    if (task?.compensationType !== "Monitarely") return null;
    try {
      const originalAmount = parseFloat(task.monitarily) || 0;
      if (!task.currencyInfo)
        return formatCurrency(originalAmount, currentLocation);

      const targetCurrency = getCurrencyInfo(currentLocation).code;
      const convertedAmount = convertCurrency(
        originalAmount,
        task.currencyInfo.code,
        targetCurrency
      );
      return formatCurrency(convertedAmount, currentLocation);
    } catch (error) {
      return formatCurrency(parseFloat(task.monitarily) || 0, currentLocation);
    }
  };

  // --- Logic: Data Fetching ---
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
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    const currentUserId = getAuth().currentUser?.uid;
    const chatId = await createNewChat(
      currentUserId,
      userDetailedData.userBasic.userId
    );
    navigation.navigate("Chat", {
      chatId: chatId,
      senderId: currentUserId,
      senderName: currentUser.userData.userName,
      receiver: userDetailedData.userBasic,
    });
  };

  // --- UI Helpers ---
  const getRankData = (completedCount: number) => {
    if (completedCount >= 3)
      return {
        label: t("profileRank.txt39"),
        icon: "trophy",
        color: "#FFD700",
      };
    if (completedCount >= 2)
      return {
        label: t("profileRank.txt40"),
        icon: "trending-up",
        color: "#FF9800",
      };
    return { label: t("profileRank.txt41"), icon: "leaf", color: "#4CAF50" };
  };

  const StatItem = ({ label, value, icon, color }) => (
    <View
      style={[
        styles.statItem,
        { backgroundColor: theme.mode === "dark" ? "#1A1A1A" : "#F8F9FA" },
      ]}
    >
      <View style={[styles.statIconCircle, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.heading }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.grey }]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.white }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const { userBasic, stats, tasks, reviews } = userDetailedData;
  const rank = getRankData(stats.completedTasks);

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav title={t("profileRank.txt27")} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER SECTION */}
        <LinearGradient
          colors={[theme.white, theme.white]}
          style={styles.headerGradient}
        >
          <View style={styles.profileHero}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={[rank.color, "transparent"]}
                style={styles.avatarRing}
              >
                <Image
                  source={
                    user?.profileImage ? { uri: user.profileImage } : Icons.dp
                  }
                  style={styles.avatar}
                />
              </LinearGradient>
              <View style={[styles.rankBadge, { backgroundColor: rank.color }]}>
                <Ionicons name={rank.icon as any} size={14} color="#FFF" />
              </View>
            </View>

            <Text style={[styles.nameText, { color: theme.darkGrey }]}>
              {userBasic.userName}
            </Text>

            <View style={styles.tagRow}>
              <Text style={[styles.rankLabel, { color: rank.color }]}>
                {rank.label}
              </Text>
              <Text style={{ color: theme.border }}> • </Text>
              <Text style={[styles.successText, { color: theme.grey }]}>
                {stats.successRate}% {t("profileRank.txt31")}
              </Text>
            </View>

            <Text style={[styles.bioText, { color: theme.darkGrey }]}>
              {userBasic?.biography ||
                `${t("profileRank.txt23")} ${
                  stats.completedTasks
                } tasks with high efficiency.`}
            </Text>

            <TouchableOpacity style={styles.msgBtn} onPress={handleStartChat}>
              <LinearGradient
                colors={[Colors.primary, "#4c669f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.msgBtnGrad}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
                <Text style={styles.msgBtnText}>{t("details.txt9")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* FLOATING STATS STRIP */}
        <View style={styles.statsStrip}>
          <StatItem
            label={t("profileRank.txt6")}
            value={stats.activeTasks}
            icon="flash-outline"
            color="#3498db"
          />
          <StatItem
            label={t("profileRank.txt23")}
            value={stats.completedTasks}
            icon="checkmark-circle-outline"
            color="#2ecc71"
          />
          <StatItem
            label="Since"
            value={stats.memberSince.split(" ")[2]}
            icon="calendar-outline"
            color="#e67e22"
          />
        </View>

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
              >
                {t("profileRank.txt34")} ({tasks?.completed?.length})
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
              >
                {t("profileRank.txt35")} ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DYNAMIC CONTENT AREA */}
        <View style={styles.contentPadding}>
          {activeTab === "completed"
            ? tasks.completed.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.taskCard,
                    { backgroundColor: theme.white, borderColor: theme.border },
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
                      {item.taskDetails.taskType}
                    </Text>
                    {/* <Text style={styles.taskPrice}>{getConvertedCompensation(item.taskDetails)}</Text> */}
                  </BlurView>
                  <View style={styles.taskInfo}>
                    <Text
                      style={[styles.taskTitle, { color: theme.heading }]}
                      numberOfLines={2}
                    >
                      {item.taskDetails.description}
                    </Text>
                    <Text style={[styles.taskDate, { color: theme.grey }]}>
                      {t("myRequests.txt3")}{" "}
                      {moment(item.completedAt?.seconds * 1000).format(
                        "MMM DD, YYYY"
                      )}
                    </Text>
                  </View>
                </View>
              ))
            : reviews.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor:
                        theme.mode === "dark" ? "#1A1A1A" : "#FFF",
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <Image
                      source={
                        item.reviewer.profileImage
                          ? { uri: item.reviewer.profileImage }
                          : Icons.dp
                      }
                      style={styles.revAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.revName, { color: theme.heading }]}>
                        {item.reviewer.userName}
                      </Text>
                      <View style={styles.starRow}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name="star"
                            size={12}
                            color={i < item.rating ? "#FFD700" : "#DDD"}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.revText, { color: theme.darkGrey }]}>
                    "{item.reviewText}"
                  </Text>
                </View>
              ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileHero: { alignItems: "center", paddingHorizontal: 20 },
  avatarWrapper: { position: "relative" },
  avatarRing: { padding: 5, borderRadius: 60 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  rankBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  nameText: { fontSize: 22, fontFamily: "Poppins_700Bold", marginTop: 12 },
  tagRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  rankLabel: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  successText: { fontSize: 14, fontFamily: "Poppins_400Regular" },
  bioText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
    paddingHorizontal: 15,
  },
  msgBtn: {
    marginTop: 20,
    width: "55%",
    borderRadius: 30,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  msgBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  msgBtnText: { color: "#FFF", fontFamily: "Poppins_700Bold", fontSize: 15 },

  statsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -30,
  },
  statItem: {
    flex: 1,
    marginHorizontal: 6,
    padding: 15,
    borderRadius: 24,
    alignItems: "center",
    elevation: 4,
    shadowOpacity: 0.1,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  statLabel: {
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tabWrapper: { paddingHorizontal: 20, marginTop: 35 },
  tabContainer: { flexDirection: "row", borderRadius: 18, padding: 6 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 14 },
  activeTab: { backgroundColor: Colors.primary, elevation: 3 },
  tabText: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },

  contentPadding: { padding: 20 },
  taskCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
  },
  taskImg: { width: "100%", height: 160 },
  taskOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "flex-end",
  },
  taskType: { color: "#FFF", fontSize: 10, fontFamily: "Poppins_700Bold" },
  taskPrice: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    marginTop: 2,
  },
  taskInfo: { padding: 16 },
  taskTitle: { fontSize: 14, fontFamily: "Poppins_500Medium", marginBottom: 6 },
  taskDate: { fontSize: 11, fontFamily: "Poppins_400Regular" },

  reviewCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  revAvatar: { width: 40, height: 40, borderRadius: 20 },
  revName: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  starRow: { flexDirection: "row", gap: 3 },
  revText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular_Italic",
    lineHeight: 20,
  },
});

export default TopRatedUserProfile;
