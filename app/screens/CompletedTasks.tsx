import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";
import NotFound from "../components/common/NotFound";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { getFormatedDate } from "../services/Shared.service";
import { fetchCompletedTasksFromFirebase } from "../services/Review.service";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";

type Translations = {
  completedTasks: string;
  category: string;
  completedOn: string;
  review: string;
  reviewed: string;
  noTasks: string;
  translating: string;
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

  // Fetching Completed Tasks-------------
  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const records = await fetchCompletedTasksFromFirebase();
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
                    {
                      color: item.reviewed ? Colors.success2 : Colors.success2,
                    },
                  ]}
                >
                  {catName}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: item.reviewed
                  ? Colors.success2
                  : Colors.primary,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.reviewed
                ? `${t("completed.txt1")}`
                : `${t("completed.txt2")}`}
            </Text>
          </View>
        </View>

        {/* Task Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: theme.heading }]}>
            {desc}
          </Text>
        </View>

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
          {item.reviewed ? (
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
                width={RFPercentage(20)}
                marginTop={0}
                onPress={() => navigation.navigate("AddReview", { task: item })}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.white }]}>
        <Nav
          dpNull
          marginTop={RFPercentage(5)}
          leftLogo={false}
          navigation={navigation}
          title={t("profile.txt4")}
        />
      </View>

      {/* Stats Overview */}
      {!loading && tasks.length > 0 && (
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
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {`${t("completed.txt4")}`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {tasks.filter((task) => task.reviewed).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {`${t("completed.txt5")}`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {tasks.filter((task) => !task.reviewed).length}
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
    fontSize: RFPercentage(3),
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    marginBottom: RFPercentage(0.5),
  },
  statLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: RFPercentage(1),
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
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    color: Colors.heading,
    lineHeight: RFPercentage(2.2),
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
});
