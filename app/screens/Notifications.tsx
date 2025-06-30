import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Platform, SectionList, TouchableOpacity, ActivityIndicator } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { createNewChat } from "../services/Chat.service";

/* components */
import Nav from "../components/common/Nav";

/* config */
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import { useNotifications } from "../contexts/notification.context";

import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import { translateText } from "../translation/googleTranslation";

const getTargetLanguage = async () => {
  try {
    const stored = await SecureStore.getItemAsync("appLanguage");
    return stored || Localization.locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
};

/* ---------- date helpers ---------- */
const sameDay = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

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

export default function Notifications({ navigation }) {
  /* ---------- local state ---------- */
  const [lang, setLang] = useState("en");
  const [tr, setTr] = useState({});
  const [busy, setBusy] = useState(true);
  const [raw, setRaw] = useState([]);
  const [sections, setSections] = useState([]);
  const [descCache, setDescCache] = useState({});

  const currentUserId = getAuth().currentUser?.uid;
  const currentUser = useUser();
  const { markAllRead } = useNotifications();


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
      };
      const translatedVals = await Promise.all(Object.values(phrases).map((txt) => translateText(txt, l)));
      const mapped = Object.keys(phrases).reduce((acc, key, idx) => {
        acc[key] = translatedVals[idx] || phrases[key];
        return acc;
      }, {});
      setTr(mapped);
    })();
  }, []);

  /* ---------- fetch notifications ---------- */
  useEffect(() => {
    if (!lang || !currentUserId) return;

    (async () => {
      setBusy(true);
      try {
        const q = query(collection(FIREBASE_DB, "notifications"), where("receiver.userId", "==", currentUserId));
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

  /* ---------- mark as read once items fetched ---------- */
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

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
      .sort((a, b) => new Date(b.data[0].timestamp) - new Date(a.data[0].timestamp));
    setSections(built);
  }, [raw, lang]);

  /* ---------- translate task descriptions ---------- */
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
            newCache[item.id] = await translateText(original, lang);
          } catch {
            newCache[item.id] = original;
          }
        })
      );
      setDescCache(newCache);
    })();
  }, [raw, lang]);

  /* ---------- chat shortcut ---------- */
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

  /* ---------- SectionList renderers ---------- */
  const renderItem = ({ item }) => {
    const senderName = item.sender?.userName || "Someone";
    const profileImage = item.sender?.profileImage || null;

    const translatedDesc = descCache[item.id];
    const taskDescription = translatedDesc !== undefined ? translatedDesc : tr.translating || "Translating...";
    const shortDesc = taskDescription.length > 30 ? `${taskDescription.substring(0, 30)}…` : taskDescription;

    const postedTime = new Date(item.timestamp).toLocaleTimeString(lang, {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    return (
      <View style={styles.card}>
        {/* main row */}
        <View style={styles.row}>
          <Image source={profileImage ? { uri: profileImage } : Icons.dp} style={styles.avatar} />
          <View style={{ marginLeft: RFPercentage(1.5), width: RFPercentage(35) }}>
            <Text style={styles.title}>{`${senderName}${tr.accepted || "accepted your task!"}`}</Text>
            {!!shortDesc && <Text style={styles.sub}>{shortDesc}</Text>}
          </View>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Text style={styles.time}>{postedTime}</Text>
          <TouchableOpacity style={styles.msgBtn} onPress={() => handleStartChat(item.sender)}>
            <Image source={Icons.messages} resizeMode="contain" style={{ width: RFPercentage(3), height: RFPercentage(3) }} />
            <Text style={styles.msgTxt}>{tr.message || "Message"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = ({ section: { title } }) => {
    const show = title === "Today" ? tr.today || title : title === "Yesterday" ? tr.yesterday || title : title;
    return <Text style={styles.sectionHeader}>{show}</Text>;
  };

  /* ---------- ui ---------- */
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={tr.notifications || "Notifications"} />
        </View>

        {busy ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: RFPercentage(5) }} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderHeader}
            ListEmptyComponent={<Text style={styles.empty}>{tr.noNotifications || "No notifications yet."}</Text>}
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
    width: "50%",
    alignSelf: "flex-start",
    marginTop: RFPercentage(3.5),
    color: Colors.grey,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
    borderBottomWidth: RFPercentage(0.1),
    borderColor: "rgb(235, 234, 234)",
    paddingBottom: RFPercentage(0.5),
    left: RFPercentage(3),
  },
  card: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(2),
    paddingVertical: RFPercentage(2),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    elevation: 5,
    shadowColor: "rgb(96, 94, 94)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
  },
  avatar: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
  },
  title: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
  },
  sub: {
    color: Colors.lightGrey,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.5),
  },
  footer: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: RFPercentage(2),
  },
  time: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  msgBtn: { flexDirection: "row", alignItems: "center" },
  msgTxt: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.3),
  },
});
