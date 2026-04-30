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
  Animated,
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
import AvatarInitials from "../components/common/DefaultAvatars";
import { getAvatarColors } from "../config/avatarColors";

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

// ─── Animated Task Card Wrapper ───────────────────────────────────────────────
const AnimatedCard = ({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 60,
        friction: 9,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => (
  <View style={starStyles.row}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Text
        key={i}
        style={[
          starStyles.star,
          { color: i <= rating ? "#F5A623" : "rgba(0,0,0,0.12)" },
        ]}
      >
        ★
      </Text>
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2 },
  star: { fontSize: RFPercentage(2), lineHeight: RFPercentage(2.4) },
});

// ─── Pill Badge ───────────────────────────────────────────────────────────────
const Pill = ({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) => (
  <View style={[pillStyles.pill, { backgroundColor: bg }]}>
    <Text style={[pillStyles.text, { color }]}>{label}</Text>
  </View>
);

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.45),
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.2,
  },
});

// ─── Stat Cell ────────────────────────────────────────────────────────────────
const StatCell = ({
  value,
  label,
  accent,
  theme
}: {
  value: number;
  label: string;
  accent: string;
  theme:any
}) => (
  <View style={statCellStyles.cell}>
    <Text style={[statCellStyles.value, { color: theme?.mode === "dark" ? Colors.white :  accent }]}>{value}</Text>
    <Text style={[statCellStyles.label,{color: theme?.mode === "dark" ? Colors.darkGrey : "rgba(0,0,0,0.45)",}]}>{label}</Text>
  </View>
);

const statCellStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: "center", gap: RFPercentage(0.3) },
  value: {
    fontSize: RFPercentage(2.6),
    fontFamily: "Poppins_700Bold",
    lineHeight: RFPercentage(3.2),
  },
  label: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    color: "rgba(0,0,0,0.45)",
    textAlign: "center",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
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

  const isDark = theme.mode === "dark";

  // ─── Tokens ──────────────────────────────────────────────────────────────
  const token = {
    bg: isDark ? "#0E0F14" : "#F6F7FB",
    card: isDark ? "#18191F" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(235, 235, 255, 0.81)",
    heading: isDark ? "#FFFFFF" : "#0D0E14",
    body: isDark ? "rgba(255,255,255,0.55)" : "rgba(13,14,20,0.55)",
    accent: Colors.primary,
    success: "#22C55E",
    warning: "#F5A623",
    statBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(13,14,20,0.03)",
    bannerBg: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.07)",
    bulkBg: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.06)",
    dateBg: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
    reviewBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(13,14,20,0.03)",
    divider: isDark ? "rgba(255, 255, 255, 0.27)" : "rgba(0,0,0,0.06)",
  };

  // ─── Translations ─────────────────────────────────────────────────────────
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
        obj[k as keyof Translations] =
          vals[i] || base[k as keyof Translations];
        return obj;
      }, {} as Translations);
      setTr(mapped);
    })();
  }, []);

  // ─── Fetch Reviews ────────────────────────────────────────────────────────
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
        if (reviewData.taskId) reviewedTaskIds.add(reviewData.taskId as string);
      });
      return reviewedTaskIds;
    } catch (error) {
      console.log("Error fetching user reviews:", error);
      return new Set<string>();
    }
  };

  // ─── Fetch Tasks ──────────────────────────────────────────────────────────
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

  // ─── Review Check ─────────────────────────────────────────────────────────
  const hasUserReviewedTask = (taskId: string, task: any) => {
    if (task.isPersonalReview) return true;
    if (task.reviewed) {
      if (task.reviewer?.userId === currentUserId) return true;
      if (
        task.taskDetails?.isBulkRequest &&
        task.taskOwnerId === task.taskDetails?.user?.userId
      )
        return true;
    }
    return false;
  };

  // ─── Derived Stats ────────────────────────────────────────────────────────
  const reviewedCount = tasks.filter((t) =>
    hasUserReviewedTask(t.taskId || t.id, t)
  ).length;
  const pendingCount = tasks.length - reviewedCount;

  // ─── Render Card ──────────────────────────────────────────────────────────
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

    const firstLetter = owner?.userName?.trim()?.[0];
    const [, groupTextColor] = getAvatarColors(firstLetter, isDark);

    return (
      <AnimatedCard index={index}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: token.card,
              borderColor: token.border,
              shadowColor: isDark ? "#000" : "#5c61aaff",
            },
          ]}
        >
          {/* ── Confirmed Helper Banner ── */}
          {isBulkTask && userIsConfirmedHelper && (
            <View
              style={[styles.banner, { backgroundColor: token.bannerBg }]}
            >
              <Ionicons
                name="shield-checkmark"
                size={RFPercentage(1.8)}
                color={token.accent}
              />
              <Text style={[styles.bannerText, { color: theme.mode  === "dark" ?  Colors.white : token.accent }]}>
                {tr.cnf}
              </Text>
            </View>
          )}

          {/* ── Header Row ── */}
          <View style={styles.headerRow}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {owner?.profileImage ? (
                <Image
                  style={[styles.avatar, { borderColor: token.accent + "40" }]}
                  source={{ uri: owner?.profileImage }}
                />
              ) : (
                <AvatarInitials
                  name={owner.userName}
                  style={[styles.avatar, { borderColor: groupTextColor }]}
                  textStyle={{ fontSize: RFPercentage(2.1) }}
                />
              )}
              {/* Online-style dot reused as bulk indicator */}
              {isBulkTask && (
                <View
                  style={[
                    styles.bulkDot,
                    { backgroundColor: token.accent },
                  ]}
                />
              )}
            </View>

            {/* Name + Category */}
            <View style={styles.metaBlock}>
              <Text
                style={[styles.userName, { color: Colors.darkGrey2 }]}
                numberOfLines={1}
              >
                {owner.userName || "User"}
              </Text>
              <Pill
                label={catName}
                color={token.success}
                bg={token.success + "18"}
              />
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: hasReviewed
                    ? token.success + "18"
                    : token.accent + "18",
                },
              ]}
            >
              {hasReviewed ? (
                <Ionicons
                  name="checkmark-circle"
                  size={RFPercentage(1.6)}
                  color={token.success}
                />
              ) : (
                <Ionicons
                  name="time-outline"
                  size={RFPercentage(1.6)}
                  color={theme.mode  === "dark" ?  Colors.white : token.accent}
                />
              )}
              <Text
                style={[
                  styles.statusText,
                  { color: hasReviewed ? token.success : theme.mode  === "dark" ?  Colors.white : token.accent },
                ]}
              >
                {hasReviewed
                  ? tr.reviewAdded || "Done"
                  : tr.alreadyReviewed || "Pending"}
              </Text>
            </View>
          </View>

          {/* ── Description ── */}
          <Text
            style={[styles.description, { color: token.body }]}
            numberOfLines={2}
          >
            {desc}
          </Text>

          {/* ── Bulk Stats Row ── */}
          {isBulkTask && (
            <View
              style={[styles.bulkRow, { backgroundColor: token.bulkBg }]}
            >
              <View style={styles.bulkCell}>
                <Ionicons
                  name="people-outline"
                  size={RFPercentage(1.7)}
                  color={token.accent}
                />
                <Text style={[styles.bulkLabel, { color: token.body }]}>
                  {details?.numberOfWorkers || 1} {t("common.helpers")}
                </Text>
              </View>
              <View
                style={[
                  styles.bulkDividerLine,
                  { backgroundColor: token.divider },
                ]}
              />
              <View style={styles.bulkCell}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={RFPercentage(1.7)}
                  color={token.success}
                />
                <Text style={[styles.bulkLabel, { color: token.body }]}>
                  {details.confirmedWorkers?.length || 0}{" "}
                  {t("offerDetail.confirmed")}
                </Text>
              </View>
            </View>
          )}

          {/* ── Divider ── */}
          <View style={[styles.divider, { backgroundColor: token.divider }]} />

          {/* ── Date Row ── */}
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={RFPercentage(1.7)}
              color={token.body}
            />
            <Text style={[styles.dateLabel, { color: token.body }]}>
              {tr.completedOn || "Completed on"}
            </Text>
            <Text style={[styles.dateValue, { color: token.heading }]}>
              {getFormatedDate(doneOn)}
            </Text>
          </View>

          {/* ── Action / Review ── */}
          {hasReviewed ? (
            <View
              style={[
                styles.reviewBox,
                { backgroundColor: token.reviewBg, borderColor: token.border },
              ]}
            >
              <View style={styles.reviewTopRow}>
                <Text style={[styles.reviewTitle, { color: token.heading }]}>
                  {`${t("completed.txt3")}`}
                </Text>
                <StarRating rating={item.rating || 0} />
              </View>
              {item.reviewText && (
                <Text
                  style={[styles.reviewQuote, { color: token.body }]}
                  numberOfLines={3}
                >
                  "{item.reviewText}"
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.reviewCTA, { backgroundColor: token.accent }]}
              onPress={() =>
                navigation.navigate("AddReview", {
                  task: item,
                  isBulkTask: isBulkTask,
                  taskOwner: owner,
                  isConfirmedHelper: userIsConfirmedHelper,
                })
              }
            >
              <Feather name="edit-3" size={RFPercentage(1.8)} color="#fff" />
              <Text style={styles.reviewCTAText}>
                {tr.review || "Add Review"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </AnimatedCard>
    );
  };

  // ─── Root Render ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <CustomNav title={t("profile.txt4")} showBack />

      {/* ── Stats Bar ── */}
      {!loading && tasks.length > 0 && (
        <View
          style={[
            styles.statsBar,
            {
              backgroundColor: token.card,
              borderColor: token.border,
              shadowColor: isDark ? "#000" : "#5c61aaff",
            },
          ]}
        >
          <StatCell
            value={tasks.length}
            label={`${t("completed.txt4")}`}
            accent={token.accent}
            theme ={theme}
          />
          <View
            style={[styles.statsDivider, { backgroundColor: token.divider }]}
          />
          <StatCell
            value={reviewedCount}
            label={`${t("completed.txt5")}`}
            accent={token.success}
                        theme ={theme}

          />
          <View
            style={[styles.statsDivider, { backgroundColor: token.divider }]}
          />
          <StatCell
            value={pendingCount}
            label={`${t("completed.txt6")}`}
            accent={token.warning}
                        theme ={theme}

          />
        </View>
      )}

      {/* ── Content ── */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color={token.body}
              style={{ marginBottom: RFPercentage(1.5) }}
            />
            <Text style={[styles.loadingText, { color: token.body }]}>
              {`${t("completed.txt7")}`}
            </Text>
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
              length: RFPercentage(30),
              offset: RFPercentage(30) * index,
              index,
            })}
          />
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(0.5),
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  statsDivider: {
    width: 1,
    height: RFPercentage(5),
    marginHorizontal: RFPercentage(0.5),
  },

  // Content
  content: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  listContent: {
    padding: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    gap: RFPercentage(1.8),
  },

  // Card
  card: {
    borderRadius: RFPercentage(2.5),
    padding: RFPercentage(2.2),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },

  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1.2),
    marginBottom: RFPercentage(1.8),
  },
  bannerText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },

  // Header Row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginBottom: RFPercentage(1.4),
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: RFPercentage(6.2),
    height: RFPercentage(6.2),
    borderRadius: RFPercentage(3.1),
    borderWidth: 1.5,
  },
  bulkDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(0.75),
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  metaBlock: { flex: 1, gap: RFPercentage(0.5) ,},
  userName: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },

  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.55),
    borderRadius: 100,
  },
  statusText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },

  // Description
  description: {
    fontSize: RFPercentage(1.55),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.3),
    marginBottom: RFPercentage(1.4),
  },

  // Bulk Row
  bulkRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RFPercentage(1.4),
    paddingVertical: RFPercentage(1.1),
    paddingHorizontal: RFPercentage(1.5),
    marginBottom: RFPercentage(1.4),
  },
  bulkCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    justifyContent: "center",
  },
  bulkLabel: {
    fontSize: RFPercentage(1.35),
    fontFamily: "Poppins_500Medium",
  },
  bulkDividerLine: {
    width: 1,
    height: RFPercentage(2.5),
    marginHorizontal: RFPercentage(1),
  },

  // Divider
  divider: {
    height: 1,
    marginBottom: RFPercentage(1.2),
  },

  // Date Row
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
    marginBottom: RFPercentage(1.8),
  },
  dateLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
  },
  dateValue: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: "auto",
  },

  // Review Box
  reviewBox: {
    borderRadius: RFPercentage(1.6),
    padding: RFPercentage(1.6),
    borderWidth: 1,
    gap: RFPercentage(0.8),
  },
  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewTitle: {
    fontSize: RFPercentage(1.55),
    fontFamily: "Poppins_600SemiBold",
  },
  reviewQuote: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.1),
    fontStyle: "italic",
  },

  // Review CTA
  reviewCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.8),
    paddingVertical: RFPercentage(1.4),
    borderRadius: RFPercentage(1.6),
  },
  reviewCTAText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});