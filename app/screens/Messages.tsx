import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../config/Colors";
import Nav from "../components/common/Nav";
import { FIREBASE_DB } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useExitAppOnBack } from "../utils/appBack";
import { useAppTheme } from "../contexts/themeContext";
import { formatChatTimestamp } from "../services/Shared.service";
import { cachedTranslate } from "../utils/cachedTranslations";

function Messages({ navigation }) {
  const { t } = useTranslation();
  const userId = getAuth().currentUser?.uid;
  const { userData } = useUser();
  const profileImgUrl = userData?.profileImage || "";
  const { theme } = useAppTheme();
  const [chats, setChats] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(t("messages.txt2"));
  const pageSize = 10;

  useExitAppOnBack();

  const filters = [t("messages.txt2"), t("messages.txt3")];

  useEffect(() => {
    fetchInitialChats();
    const unsubscribe = listenForNewChats();
    return () => unsubscribe && unsubscribe();
  }, []);

  const getChatData = async (d) => {
    const chatData = d.data();
    const otherUser = chatData.participants.find((u) => u !== userId);
    const userRef = doc(FIREBASE_DB, "users", otherUser);
    const userDoc = await getDoc(userRef);
    const otherUserData = userDoc.exists() ? userDoc.data() : null;

    let translatedText = chatData.lastMessage?.text || "";
    if (translatedText) {
      try {
        translatedText = await cachedTranslate(translatedText);
      } catch (e) {
        console.log("Translation error:", e);
      }
    }

    const createdAt =
      chatData?.lastMessage?.createdAt?.toDate?.() ??
      (chatData?.lastMessage?.createdAt instanceof Date
        ? chatData.lastMessage.createdAt
        : new Date());

    return {
      id: d.id,
      ...chatData,
      lastMessage: {
        ...chatData.lastMessage,
        text: translatedText,
        createdAt,
      },
      user: otherUserData,
    };
  };

  const fetchInitialChats = async () => {
    setLoadingInitial(true);
    try {
      const q = query(
        collection(FIREBASE_DB, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const chatData = [];
      for await (const doc of snapshot.docs) {
        chatData.push(await getChatData(doc));
      }
      setChats(chatData);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (e) {
      console.log("Chat Error", e);
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchMoreChats = async () => {
    if (!lastVisible || loadingMore) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(FIREBASE_DB, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const chatData = [];
      for await (const doc of snapshot.docs) {
        chatData.push(await getChatData(doc));
      }

      setChats((prev) => [...prev, ...chatData]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (e) {
      console.log("Chat Error", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshChats = async () => {
    setIsRefreshing(true);
    await fetchInitialChats();
    setIsRefreshing(false);
  };

  const listenForNewChats = () => {
    const q = query(
      collection(FIREBASE_DB, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc"),
      limit(pageSize)
    );

    return onSnapshot(q, async (snapshot) => {
      const updates = await Promise.all(
        snapshot.docChanges().map(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            return await getChatData(change.doc);
          }
          if (change.type === "removed") {
            return { id: change.doc.id, removed: true };
          }
          return null;
        })
      );

      const resolvedUpdates = updates.filter(Boolean);

      // Merge updates without resetting the array
      setChats((prev) => {
        const merged = [...prev];
        resolvedUpdates.forEach((update) => {
          if (update.removed) {
            const index = merged.findIndex((c) => c.id === update.id);
            if (index !== -1) merged.splice(index, 1);
            return;
          }

          const index = merged.findIndex((c) => c.id === update.id);
          if (index !== -1) merged[index] = update;
          else merged.unshift(update);
        });
        return merged;
      });
    });
  };

  const FilterButton = ({ title, isActive, isFirst }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.filterButton,
        {
          backgroundColor: isActive ? "transparent" : theme.white,
          borderColor: isActive ? "transparent" : theme.border,
        },
        isFirst && styles.firstFilterButton,
      ]}
      onPress={() => setActiveFilter(title)}
    >
      {isActive ? (
        <LinearGradient
          colors={[Colors.primary, "#4557B0"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.filterButtonTextActive}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text
          style={[styles.filterButtonTextInactive, { color: theme.heading }]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Chat", {
          chatId: item.id,
          senderId: userId,
          senderName: userData.userName,
          receiver: item.user,
        })
      }
      activeOpacity={0.8}
      style={{ justifyContent: "center", alignItems: "center", width: "100%" }}
    >
      <View
        key={item.id}
        style={[
          styles.messageContainer,
          item.lastMessage?.unread &&
            item.lastMessage?.senderId !== userId &&
            styles.unreadMessage,
        ]}
      >
        <Image
          style={styles.messageImage}
          source={
            item.user?.profileImage ? { uri: item.user.profileImage } : Icons.dp
          }
        />
        <View style={styles.messageTextContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={[
                styles.messageUserName,
                item.lastMessage?.unread &&
                  item.lastMessage?.senderId !== userId &&
                  styles.unreadText,
                { color: theme.darkGrey2 },
              ]}
            >
              {item.user?.userName}
            </Text>
            {item.unread && item.senderId !== userId && (
              <View
                style={[styles.unreadDot, { backgroundColor: theme.primary }]}
              />
            )}
          </View>
          <Text
            style={[
              styles.messageText,
              item.lastMessage?.unread &&
                item.lastMessage?.senderId !== userId &&
                styles.unreadText,
              {
                color: item.lastMessage?.text
                  ? theme.darkGrey
                  : theme.lightGrey,
              },
            ]}
          >
            {item.lastMessage?.text
              ? item.lastMessage.text.replace(/\s+/g, " ").trim().slice(0, 30) +
                (item.lastMessage.text.replace(/\s+/g, " ").trim().length > 30
                  ? "..."
                  : "")
              : `${t("messages.txt6")} ${item.user?.userName}!`}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: theme.darkGrey }]}>
          {formatChatTimestamp(item.lastMessage?.createdAt)}
        </Text>
      </View>
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
    </TouchableOpacity>
  );

  const filteredChats = useMemo(() => {
    // Only keep chats where lastMessage exists and has text
    let validChats = chats.filter(
      (chat) =>
        chat.lastMessage &&
        chat.lastMessage.text &&
        chat.lastMessage.text.trim() !== ""
    );

    if (activeFilter === t("messages.txt3")) {
      return validChats.filter(
        (chat) => chat?.unread && chat.senderId !== userId
      );
    }

    return validChats;
  }, [chats, activeFilter, userId]);


  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />
      <Nav
        profileImage={profileImgUrl}
        leftLogo={true}
        navigation={navigation}
        title={t("messages.txt1")}
      />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {filters.map((title, index) => (
          <FilterButton
            key={title}
            title={title}
            isActive={activeFilter === title}
            isFirst={index === 0}
          />
        ))}
      </View>

      {loadingInitial ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: RFPercentage(10) }}
        />
      ) : (
        <FlatList
          style={{ width: "100%", marginTop: RFPercentage(2) }}
          data={filteredChats}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={fetchMoreChats}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshChats}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {filteredChats.length === 0 && (
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Image
                    style={styles.noMessageIcon}
                    source={Icons.noMessage}
                  />
                  <Text style={[styles.emptyText, { color: theme.darkGrey }]}>
                    {activeFilter === t("messages.txt3")
                      ? t("messages.txt4")
                      : t("messages.txt5")}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
      <View style={styles.bottomSpacing} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  filterContainer: {
    marginTop: RFPercentage(3),
    flexDirection: "row",
    width: "90%",
    marginBottom: RFPercentage(1),
  },
  filterButton: {
    width: RFPercentage(13),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(2),
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  firstFilterButton: { marginLeft: 0 },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    borderRadius: RFPercentage(1),
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  filterButtonTextInactive: {
    color: Colors.heading,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  messageContainer: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(3),
  },
  messageImage: {
    width: RFPercentage(5.8),
    height: RFPercentage(5.8),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
  },
  messageTextContainer: {
    marginLeft: RFPercentage(1.5),
    justifyContent: "flex-start",
  },
  messageUserName: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  messageText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  messageTime: {
    position: "absolute",
    right: 0,
    top: 0,
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  separator: {
    width: "90%",
    height: RFPercentage(0.1),
    backgroundColor: Colors.border,
    marginTop: RFPercentage(2),
  },
  bottomSpacing: { marginBottom: RFPercentage(6) },
  unreadMessage: {},
  unreadText: { fontFamily: "Poppins_500Medium" },
  unreadDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.primary,
    marginLeft: RFPercentage(1),
    top: RFPercentage(-0.1),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(17),
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(2),
    color: Colors.darkGrey,
    textAlign: "center",
  },
  noMessageIcon: {
    borderRadius: RFPercentage(1),
    width: RFPercentage(26),
    height: RFPercentage(18),
    marginBottom: RFPercentage(2),
  },
});

export default Messages;
