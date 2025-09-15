import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
} from "firebase/firestore";
import { createNewChat } from "../services/Chat.service";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import { useNotifications } from "../contexts/notification.context";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import NotFound from "../components/common/NotFound";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";
import { updateDoc } from "firebase/firestore";
import AntDesign from "@expo/vector-icons/AntDesign";

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
  });
  const [busy, setBusy] = useState(true);
  const [raw, setRaw] = useState([]);
  const [sections, setSections] = useState([]);
  const [descCache, setDescCache] = useState({});
  const currentUserId = getAuth().currentUser?.uid;
  const currentUser = useUser();
  const { markAllRead } = useNotifications();
  const { theme } = useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { notifications, markAsRead } = useNotifications();

  useEffect(() => {
    (async () => {
      const l = await getTargetLanguage();
      setLang(l);
      const phrases = {
        today: "Today",
        yesterday: "Yesterday",
        accepted: "accepted your task!",
        message: "Message",
        noNotifications: "No notifications yet.",
        notifications: "Notifications",
        translating: "Translating...",
        leftReview: "added a review",
        noReviewText: "No review text",
        sentNotification: "sent you a notification",
        view: "View",
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
    })();
  }, []);

  useEffect(() => {
    if (!lang || !currentUserId) return;
    (async () => {
      setBusy(true);
      try {
        const q = query(
          collection(FIREBASE_DB, "notifications"),
          where("receiver.userId", "==", currentUserId)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRaw(docs);
      } catch (e) {
        console.log("Notification fetch error:", e);
      } finally {
        setBusy(false);
      }
    })();
  }, [lang, currentUserId]);

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
          const original = item.task?.postRequest?.description || "";
          if (!original) {
            newCache[item.id] = "";
            return;
          }
          try {
            newCache[item.id] = await cachedTranslate(original);
          } catch {
            newCache[item.id] = original;
          }
        })
      );
      setDescCache(newCache);
    })();
  }, [raw, lang]);

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

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

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const senderName = item.sender?.userName || "Someone";
    const profileImage = item.sender?.profileImage || null;
    const translatedDesc = descCache[item.id];
    const taskDescription = translatedDesc ?? tr.translating;

    const shortDesc =
      taskDescription.length > 30
        ? `${taskDescription.substring(0, 30)}…`
        : taskDescription;

    const postedTime = new Date(item.timestamp).toLocaleTimeString(lang, {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    let mainText = "";
    let previewText = "";

    if (item.type === "task_acceptance") {
      mainText = `${senderName} ${tr.accepted}`;
      previewText = shortDesc;
    } else if (item.type === "review_added") {
      const reviewText = item.review?.text || tr.noReviewText;
      const shortReview =
        reviewText.length > 30 ? `${reviewText.substring(0, 30)}…` : reviewText;

      mainText = `${senderName} ${tr.leftReview}`;
      previewText = `${shortReview}`;
    } else {
      mainText = `${senderName} ${tr.sentNotification}`;
      previewText = shortDesc;
    }

    const handleToggleExpand = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const nextExpanded = isExpanded ? null : item.id;
      setExpandedId(nextExpanded);
      if (!isExpanded && !item.isRead) {
        markAsRead(item.id);
        setRaw((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
    };

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={handleToggleExpand}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.white,
              borderColor:
                theme.mode === "dark"
                  ? "rgba(117, 117, 117, 1)"
                  : "rgba(244, 244, 244, 1)",
              borderBottomWidth: RFPercentage(0.5),
            },
          ]}
        >
          {/* main row */}
          <View style={styles.row}>
            <Image
              source={profileImage ? { uri: profileImage } : Icons.dp}
              style={styles.avatar}
            />
            <View style={{ marginLeft: RFPercentage(0.5), width: "80%" }}>
              <Text
                style={[
                  styles.title,
                  { color: !item.isRead ? Colors.primary : theme.heading },
                ]}
              >
                {mainText}
              </Text>
              {!item.isRead && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 5,
                    backgroundColor: Colors.primary,
                    alignSelf: "center",
                    position: "absolute",
                    right: 0,
                    top: RFPercentage(0.6),
                  }}
                />
              )}
              {!isExpanded && !!previewText && (
                <Text style={styles.sub}>{previewText || "....."}</Text>
              )}
              <Text
                style={[
                  styles.time,
                  {
                    color: !item.isRead ? Colors.primary : Colors.grey,
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    top: RFPercentage(3.2),
                  },
                ]}
              >
                {postedTime}
              </Text>
            </View>

            {/* unread dot */}
          </View>

          {/* expanded content */}
          {isExpanded && (
            <View style={{ marginTop: RFPercentage(1.5) }}>
              {item.type === "review_added" ? (
                <>
                  <Text style={styles.sub}>
                    {item.review?.text || tr.noReviewText}
                  </Text>
                  <Text style={styles.sub}>
                    ⭐ {item.review?.rating || 0}/5
                  </Text>
                </>
              ) : (
                <Text style={styles.sub}>{taskDescription}</Text>
              )}

              {/* footer */}
              <View style={styles.footer}>
                <Text style={[styles.time, { color: theme.darkGrey }]}>
                  {postedTime}
                </Text>
                {item.type === "review_added" ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.msgBtn,
                      {
                        backgroundColor:
                          theme.mode === "dark"
                            ? Colors.primary + "40"
                            : Colors.primary + "15",
                      },
                    ]}
                    onPress={() => navigation.navigate("Reviews")}
                  >
                    <AntDesign
                      name="eye"
                      size={RFPercentage(2)}
                      color={Colors.primary}
                    />

                    <Text style={styles.msgTxt}>{tr.view || "View"}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.msgBtn,
                      {
                        backgroundColor:
                          theme.mode === "dark"
                            ? Colors.primary + "40"
                            : Colors.primary + "15",
                      },
                    ]}
                    onPress={() => handleStartChat(item.sender)}
                  >
                    <Image
                      source={Icons.messages}
                      resizeMode="contain"
                      style={{
                        width: RFPercentage(2.5),
                        height: RFPercentage(2.5),
                      }}
                    />
                    <Text style={styles.msgTxt}>{tr.message || "Message"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
      <Text
        style={[
          styles.sectionHeader,
          { color: theme.heading, borderColor: theme.border },
        ]}
      >
        {show}
      </Text>
    );
  };

  /* ---------- ui ---------- */
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View>
          <Nav
            dpNull
            marginTop={
              Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)
            }
            leftLogo={false}
            navigation={navigation}
            title={tr.notifications || "Notifications"}
          />
        </View>

        {busy ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: RFPercentage(5) }}
          />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderHeader}
            ListEmptyComponent={
              <NotFound
                title={tr?.noNotifications || "No notifications yet."}
              />
            }
            contentContainerStyle={{ paddingBottom: RFPercentage(5) }}
            stickySectionHeadersEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  empty: {
    textAlign: "center",
    marginTop: RFPercentage(5),
    color: Colors.lightGrey,
    fontFamily: "Poppins_500Medium",
  },
  sectionHeader: {
    alignSelf: "flex-start",
    marginTop: RFPercentage(3),
    marginLeft: RFPercentage(3),
    backgroundColor: Colors.lightGrey + "30", // light tint
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },

  card: {
    width: "92%",
    alignSelf: "center",
    marginTop: RFPercentage(2),
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(2),
    backgroundColor: Colors.white,
    borderWidth: RFPercentage(0.1),
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1.5),
    borderColor: Colors.primary,
    borderWidth: 1,
  },

  title: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    color: Colors.heading,
  },

  sub: {
    color: Colors.grey,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.1),
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: RFPercentage(1.8),
  },

  time: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    top: RFPercentage(0.5),
  },

  msgBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "40", // soft tint background
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(2),
  },

  msgTxt: {
    color: Colors.primary,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },
});
