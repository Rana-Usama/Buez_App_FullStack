import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { createNewChat } from "../services/Chat.service";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import { useNotifications } from "../contexts/notification.context";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";
import {
  MaterialIcons,
  Feather,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import CustomNav from "../components/common/CustomNav";

const getTargetLanguage = async () => {
  try {
    const stored = await SecureStore.getItemAsync("appLanguage");
    return stored || Localization.locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
};

const sameDay = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const getSectionTitle = (dateObj, lang) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(dateObj, today)) return "Today";
  if (sameDay(dateObj, yesterday)) return "Yesterday";
  return dateObj.toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface Translations {
  today: string;
  yesterday: string;
  accepted: string;
  message: string;
  noNotifications: string;
  notifications: string;
  translating: string;
  leftReview: string;
  noReviewText: string;
  sentNotification: string;
  view: string;
  markAllRead: string;
  pullToRefresh: string;
  taskCompleted: string;
  viewTask: string;
}

export default function Notifications({ navigation }) {
  const [lang, setLang] = useState("en");
  const [tr, setTr] = useState<Translations>({
    today: "",
    yesterday: "",
    accepted: "",
    message: "",
    noNotifications: "",
    notifications: "",
    translating: "",
    leftReview: "",
    noReviewText: "",
    sentNotification: "",
    view: "",
    markAllRead: "",
    pullToRefresh: "",
    taskCompleted: "",
    viewTask: "",
  });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [raw, setRaw] = useState([]);
  const [sections, setSections] = useState([]);
  const [descCache, setDescCache] = useState({});
  const currentUserId = getAuth().currentUser?.uid;
  const currentUser = useUser();
  const { markAllRead } = useNotifications();
  const { theme } = useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { notifications, markAsRead } = useNotifications();
  const { t } = useTranslation();

  // Animation refs
  const animationValues = useRef({});
  const contentHeights = useRef({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      setBusy(true); // busy starts true
      // 1️⃣ Get language
      const l = await getTargetLanguage();
      setLang(l);
      // 2️⃣ Translation
      const phrases = {
        today: "Today",
        yesterday: "Yesterday",
        accepted: "accepted your task!",
        message: "Message",
        noNotifications: "No notifications yet.",
        notifications: "Notifications",
        translating: "Translating...",
        leftReview: "left a review on your task!",
        noReviewText: "No review text",
        sentNotification: "sent you a notification",
        view: "View",
        markAllRead: "Mark All Read",
        pullToRefresh: "Pull to refresh",
        taskCompleted: "marked your accepted task as completed!",
        viewTask: "View Task",
      };

      const translatedVals = await Promise.all(
        Object.values(phrases).map((txt) => cachedTranslate(txt))
      );
      const mapped: Translations = Object.keys(phrases).reduce(
        (acc, key, idx) => {
          acc[key as keyof Translations] = translatedVals[idx] || phrases[key];
          return acc;
        },
        {} as Translations
      );
      setTr(mapped);

      // 3️⃣ Fetch notifications
      await fetchNotifications();

      setBusy(false); // busy ends only after both translation and notifications are done
    };

    init();
  }, [currentUserId]);

// Fetching Notifications------
  const fetchNotifications = async () => {
    if (!currentUserId) return;
    setBusy(true);
    try {
      const q = query(
        collection(FIREBASE_DB, "notifications"),
        where("receiver.userId", "==", currentUserId),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRaw(docs);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.log("Notification fetch error:", e);
    } finally {
      setBusy(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!raw.length) return setSections([]);
    const grouped = new Map();
    raw.forEach((item) => {
      const title = getSectionTitle(new Date(item.timestamp), lang);
      const arr = grouped.get(title) || [];
      arr.push(item);
      grouped.set(title, arr);
    });

    const built = Array.from(grouped.entries())
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => {
        const timeA = new Date(a.data[0]?.timestamp).getTime() || 0;
        const timeB = new Date(b.data[0]?.timestamp).getTime() || 0;
        return timeB - timeA;
      });
    setSections(built);
  }, [raw, lang]);

  useEffect(() => {
    if (!raw.length) return;

    (async () => {
      const newCache = { ...descCache };

      await Promise.all(
        raw.map(async (item) => {
          if (newCache[item.id] !== undefined) return;

          if (item.type === "review_added") {
            const reviewText = item.review?.text || "";
            const translatedReview = reviewText
              ? await cachedTranslate(reviewText)
              : tr.noReviewText;

            newCache[item.id] = {
              kind: "review",
              text: translatedReview,
              rating: item.review?.rating ?? 0,
            };
          } else {
            const original = item.task?.postRequest?.description || "";
            const translatedDesc = original
              ? await cachedTranslate(original)
              : "";
            newCache[item.id] = {
              kind: "task",
              text: translatedDesc,
            };
          }
        })
      );
      setDescCache(newCache);
    })();
  }, [raw, lang]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleStartChat = useCallback(
    async (receiverUser) => {
      try {
        const chatId = await createNewChat(currentUserId, receiverUser.userId);
        navigation.navigate("Chat", {
          chatId,
          senderId: currentUserId,
          senderName: currentUser?.userData?.userName,
          receiver: receiverUser,
        });
      } catch (err) {
        console.log("Chat start error:", err);
      }
    },
    [currentUserId, currentUser?.userData?.userName]
  );

  const getNotificationIcon = (type, isRead) => {
    const iconColor = isRead ? theme.primary : Colors.primary;

    switch (type) {
      case "task_acceptance":
        return (
          <Ionicons
            name="checkmark-circle"
            size={RFPercentage(2.2)}
            color={iconColor}
          />
        );
      case "review_added":
        return (
          <Ionicons name="star" size={RFPercentage(2.2)} color={iconColor} />
        );
      case "task_completion": // Add this case
        return (
          <Ionicons
            name="checkmark-done-circle"
            size={RFPercentage(2.2)}
            color={iconColor}
          />
        );
      default:
        return (
          <Ionicons
            name="notifications"
            size={RFPercentage(2.2)}
            color={iconColor}
          />
        );
    }
  };

  const getAnimationValue = (id) => {
    if (!animationValues.current[id]) {
      animationValues.current[id] = {
        height: new Animated.Value(0),
        opacity: new Animated.Value(0),
        expanded: false,
      };
    }
    return animationValues.current[id];
  };

  const handleToggleExpand = (item) => {
    const isExpanded = expandedId === item.id;
    const nextExpanded = isExpanded ? null : item.id;
    const animation = getAnimationValue(item.id);

    if (nextExpanded === item.id && !contentHeights.current[item.id]) {
      setExpandedId(nextExpanded);
      if (!isExpanded && !item.isRead) {
        markAsRead(item.id);
        setRaw((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
      return;
    }

    if (nextExpanded === item.id) {
      Animated.parallel([
        Animated.timing(animation.height, {
          toValue: contentHeights.current[item.id] || 100,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animation.opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
      animation.expanded = true;
    } else {
      Animated.parallel([
        Animated.timing(animation.height, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animation.opacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
      animation.expanded = false;
    }

    setExpandedId(nextExpanded);
    if (!isExpanded && !item.isRead) {
      markAsRead(item.id);
      setRaw((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
  };

  const measureContentHeight = (event, id) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !contentHeights.current[id]) {
      contentHeights.current[id] = height;
      if (expandedId === id) {
        const animation = getAnimationValue(id);
        Animated.timing(animation.height, {
          toValue: height,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const renderItem = ({ item, index }) => {
    const isExpanded = expandedId === item.id;
    const animation = getAnimationValue(item.id);
    const senderName = item.sender?.userName || "Someone";
    const profileImage = item.sender?.profileImage || null;
    const cacheEntry = descCache[item.id];
    const translatedText =
      cacheEntry && "text" in cacheEntry ? cacheEntry.text : tr.translating;

    const shortText =
      translatedText.length > 30
        ? `${translatedText.substring(0, 30)}…`
        : translatedText;

    let mainText = "";
    let previewText = "";

    if (item.type === "task_acceptance") {
      mainText = `${senderName} ${tr.accepted}`;
      previewText = shortText;
    } else if (item.type === "review_added") {
      mainText = `${senderName} ${tr.leftReview}`;
      previewText = shortText;
    } else if (item.type === "task_completion") {
      // Add this case
      mainText = `${senderName} ${tr.taskCompleted}`;
      previewText = shortText;
    } else {
      mainText = `${senderName} ${tr.sentNotification}`;
      previewText = shortText;
    }

    const postedTime = new Date(item.timestamp).toLocaleTimeString(lang, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleToggleExpand(item)}
          style={styles.touchableCard}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.white,
                borderLeftWidth: !item.isRead ? RFPercentage(0.5) : 1,
                borderWidth: 1,
                borderColor: !item.isRead
                  ? Colors.primary
                  : "rgba(224, 223, 232, 0.6)",
                borderLeftColor: !item.isRead
                  ? Colors.primary
                  : "rgba(224, 223, 232, 1)",
                shadowColor:
                  theme.mode === "dark" ? "#000" : "#rgba(0,0,0,0.1)",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Image
                  source={profileImage ? { uri: profileImage } : Icons.dp}
                  style={styles.avatar}
                />
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: theme.white },
                  ]}
                >
                  {getNotificationIcon(item.type, item.isRead)}
                </View>
              </View>

              <View style={styles.headerContent}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: !item.isRead ? theme.primary : theme.heading,
                      fontFamily: !item.isRead
                        ? "Poppins_600SemiBold"
                        : "Poppins_500Medium",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {mainText}
                </Text>

                {!isExpanded && !!previewText && (
                  <Text
                    style={[
                      styles.sub,
                      { marginTop: RFPercentage(0.3), color: theme.grey },
                    ]}
                    numberOfLines={1}
                  >
                    {previewText}
                  </Text>
                )}
              </View>

              <View style={styles.timeContainer}>
                <Text style={[styles.time, { color: theme.darkGrey }]}>
                  {postedTime}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
            </View>

            <Animated.View
              style={{
                height: animation.height,
                opacity: animation.opacity,
                overflow: "hidden",
              }}
            >
              <View
                onLayout={(event) => measureContentHeight(event, item.id)}
                style={styles.expandedContent}
              >
                <View style={styles.contentBody}>
                  {item.type === "review_added" ? (
                    <View style={styles.reviewContent}>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingLabel}>
                          {t("notifications.txt3")}
                        </Text>
                        <View style={styles.stars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={
                                star <= (item.review?.rating || 0)
                                  ? "star"
                                  : "star-outline"
                              }
                              size={RFPercentage(2)}
                              color={Colors.star}
                              style={styles.star}
                            />
                          ))}
                        </View>
                        <Text style={styles.ratingText}>
                          {item.review?.rating || 0}/5
                        </Text>
                      </View>
                      <Text
                        style={[styles.reviewText, { color: theme.darkGrey }]}
                        numberOfLines={1}
                      >
                        {translatedText.length > 50
                          ? `${translatedText.substring(0, 50)}…`
                          : translatedText || tr.noReviewText}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.description, { color: theme.darkGrey }]}
                      numberOfLines={1}
                    >
                      {translatedText.length > 50
                        ? `${translatedText.substring(0, 50)}…`
                        : translatedText}
                    </Text>
                  )}

                  <View style={styles.footer}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor:
                            theme.mode === "dark"
                              ? Colors.primary + "40"
                              : Colors.primary + "15",
                        },
                      ]}
                      onPress={() => {
                        if (item.type === "review_added") {
                          navigation.navigate("Reviews");
                        } else if (item.type === "task_completion") {
                          // Navigate to completed tasks or task details
                          navigation.navigate("CompletedTasks");
                        } else {
                          handleStartChat(item.sender);
                        }
                      }}
                    >
                      {item.type === "review_added" ? (
                        <>
                          <Feather
                            name="eye"
                            size={RFPercentage(1.8)}
                            color={Colors.primary}
                          />
                          <Text style={styles.actionButtonText}>
                            {tr.view || "View"}
                          </Text>
                        </>
                      ) : item.type === "task_completion" ? (
                        <>
                          <Feather
                            name="check-circle"
                            size={RFPercentage(1.8)}
                            color={Colors.primary}
                          />
                          <Text style={styles.actionButtonText}>
                            {tr.viewTask || "View Task"}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Feather
                            name="message-circle"
                            size={RFPercentage(1.8)}
                            color={Colors.primary}
                          />
                          <Text style={styles.actionButtonText}>
                            {tr.message || "Message"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = ({ section: { title } }) => {
    const show =
      title === "Today"
        ? tr.today || title
        : title === "Yesterday"
        ? tr.yesterday || title
        : title;
    return (
      <View style={styles.sectionHeaderContainer}>
        <View
          style={[
            styles.sectionHeader,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(241, 244, 254, 0.05)"
                  : "rgba(250, 250, 255, 1)",
            },
          ]}
        >
         <MaterialIcons name="brightness-1"
            size={RFPercentage(0.6)}
            color={theme.primary}
          />
          {/* <MaterialIcons
            name="tips-and-updates"
            size={RFPercentage(2)}
            color={theme.primary}
          /> */}

          <Text style={[styles.sectionHeaderText, { color: theme.primary }]}>
            {show}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
    <CustomNav title={tr.notifications} showBack />

      <Animated.View style={[styles.container]}>
        {busy ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
              {t("notifications.txt1")}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderHeader}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={RFPercentage(8)}
                  color={theme.darkGrey}
                />
                <Text style={[styles.emptyText, { color: theme.darkGrey }]}>
                  {tr?.noNotifications || "No notifications yet."}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.grey }]}>
                  {t("notifications.txt2")}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
                title={tr.pullToRefresh || "Pull to refresh"}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
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
  listContent: {
    flexGrow: 1,
    paddingBottom: RFPercentage(5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(5),
    marginTop: RFPercentage(-2),
  },
  emptyText: {
    textAlign: "center",
    marginTop: RFPercentage(2),
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: RFPercentage(1),
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
  },
  sectionHeaderContainer: {
    paddingHorizontal: RFPercentage(2),
    marginVertical: RFPercentage(2),
  },
  sectionHeader: {
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(100),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.5),
  },
  touchableCard: {
    marginHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  card: {
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(2),
    backgroundColor: Colors.white,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerLeft: {
    position: "relative",
    marginRight: RFPercentage(1.5),
  },
  avatar: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  notificationIcon: {
    position: "absolute",
    bottom: -RFPercentage(0.5),
    right: -RFPercentage(0.5),
    backgroundColor: Colors.primary,
    borderRadius: RFPercentage(1),
    padding: RFPercentage(0.3),
  },
  headerContent: {
    flex: 1,
    marginRight: RFPercentage(1),
  },
  title: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2.2),
  },
  sub: {
    color: Colors.grey,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
  },
  unreadDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.primary,
    marginTop: RFPercentage(0.5),
  },
  expandedContent: {
    position: "absolute",
    width: "100%",
  },
  contentBody: {
    marginTop: RFPercentage(1.5),
  },
  reviewContent: {
    marginBottom: RFPercentage(1),
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  ratingLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    marginRight: RFPercentage(1),
    color: Colors.grey,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: RFPercentage(1),
  },
  star: {
    marginRight: RFPercentage(0.3),
  },
  ratingText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },
  reviewText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    fontStyle: "italic",
  },
  description: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },
  markAllButton: {
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.5),
  },
  markAllText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
  },
});
