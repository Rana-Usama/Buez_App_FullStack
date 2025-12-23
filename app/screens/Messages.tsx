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
  Animated,
  Platform,
  Dimensions,
  TextInput,
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
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const pageSize = 10;
  useExitAppOnBack();

  const filters = [t("messages.txt2"), t("messages.txt3")];

  useEffect(() => {
    fetchInitialChats();
    const unsubscribe = listenForNewChats();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return () => unsubscribe && unsubscribe();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Handle search close
  const handleSearchClose = () => {
    setSearchQuery("");
  };

  const getChatData = async (d: any) => {
    const chatData = d.data();
    const otherUser = chatData.participants.find((u: any) => u !== userId);
    const userRef = doc(FIREBASE_DB, "users", otherUser);
    const userDoc = await getDoc(userRef);
    const otherUserData = userDoc.exists() ? userDoc.data() : null;

    let translatedText = chatData.lastMessage?.text || "";
    if (translatedText) {
      try {
        translatedText = await cachedTranslate(translatedText);
      } catch (e: any) {
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
      unreadCount: chatData.unreadCount?.[userId] || 0,
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

  const FilterButton = ({ title, isActive }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.filterButton,
        {
          backgroundColor: isActive ? theme.primary : theme.white,
          borderColor: isActive ? theme.primary : theme.border,
        },
      ]}
      onPress={() => setActiveFilter(title)}
    >
      <Text
        style={[
          styles.filterButtonText,
          {
            color: isActive ? Colors.white : theme.heading,
            fontFamily: isActive ? "Poppins_600SemiBold" : "Poppins_500Medium",
          },
        ]}
      >
        {title}
      </Text>
      {isActive && (
        <View
          style={[styles.activeIndicator, { backgroundColor: theme.white }]}
        />
      )}
    </TouchableOpacity>
  );

  const ChatItem = ({ item }) => {
    const isUnread =
      item.unreadCount > 0 && item.lastMessage?.senderId !== userId;
    const lastMessageTime = formatChatTimestamp(item.lastMessage?.createdAt);

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Chat", {
            chatId: item.id,
            senderId: userId,
            senderName: userData.userName,
            receiver: item.user,
          })
        }
        activeOpacity={0.7}
        style={[
          styles.chatItemContainer,
          {
            backgroundColor: theme.white,
            borderBottomColor: theme.border + "40",
          },
          isUnread && {
            backgroundColor: theme.primary + "08",
          },
        ]}
      >
        <View style={styles.chatItemContent}>
          {/* Avatar with Status Indicator */}
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={
                item.user?.profileImage
                  ? { uri: item.user.profileImage }
                  : Icons.dp
              }
            />
            {item.user?.isOnline && (
              <View
                style={[
                  styles.onlineIndicator,
                  { backgroundColor: theme.success },
                ]}
              />
            )}
          </View>

          {/* Chat Content */}
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <Text
                style={[
                  styles.userName,
                  { color: theme.darkGrey },
                  isUnread && { fontFamily: "Poppins_600SemiBold" },
                ]}
                numberOfLines={1}
              >
                {item.user?.userName || t("messages.unknownUser")}
              </Text>
              <Text style={[styles.timeText, { color: theme.darkGrey }]}>
                {lastMessageTime}
              </Text>
            </View>

            <View style={styles.messagePreview}>
              <Text
                style={[
                  styles.messageText,
                  {
                    color: isUnread ? theme.darkGrey : theme.lightGrey,
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage?.text
                  ? item.lastMessage.text
                  : `${t("messages.txt6")} ${item.user?.userName}!`}
              </Text>

              {/* Unread Badge */}
              {isUnread && (
                <View
                  style={[
                    styles.unreadBadge,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            {/* Message Type Indicator */}
            {item.lastMessage?.type === "image" && (
              <View style={styles.messageTypeIndicator}>
                <Feather
                  name="image"
                  size={RFPercentage(1.6)}
                  color={theme.lightGrey}
                />
                <Text
                  style={[styles.messageTypeText, { color: theme.lightGrey }]}
                >
                  {t("messages.photo")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredChats = useMemo(() => {
    let validChats = chats.filter(
      (chat) =>
        chat.lastMessage &&
        chat.lastMessage.text &&
        chat.lastMessage.text.trim() !== ""
    );

    // Apply search filter
    if (searchQuery.trim()) {
      validChats = validChats.filter(
        (chat) =>
          chat.user?.userName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chat.lastMessage?.text
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply unread filter
    if (activeFilter === t("messages.txt3")) {
      return validChats.filter(
        (chat) => chat.unreadCount > 0 && chat.lastMessage?.senderId !== userId
      );
    }

    return validChats;
  }, [chats, activeFilter, searchQuery]);

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.primary + "20" },
        ]}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={RFPercentage(5)}
          color={theme.primary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.darkGrey }]}>
        {activeFilter === t("messages.txt3")
          ? t("messages.txt4")
          : t("messages.txt5")}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.lightGrey }]}>
        {searchQuery.trim()
          ? t("messages.noResults")
          : t("messages.emptyDescription")}
      </Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <Nav
        profileImage={profileImgUrl}
        leftLogo
        gradient
        gradientColors={[Colors.primary, "#0b1544ff"]}
        title={`${t("messages.txt1")}`}
      />

      {/* Filter Tabs */}
      <View style={styles.filterTabContainer}>
        {filters.map((title, index) => (
          <FilterButton
            key={title}
            title={title}
            isActive={activeFilter === title}
          />
        ))}
      </View>

      {/* Chats List */}
      <Animated.View
        style={[
          styles.chatListContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {loadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
              {t("messages.loading")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={({ item }) => <ChatItem item={item} />}
            keyExtractor={(item) => item.id}
            onEndReached={fetchMoreChats}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshChats}
                colors={[theme.primary]}
                tintColor={theme.primary}
                progressBackgroundColor={theme.white}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatListContent}
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            }
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
  header: {
    paddingTop: Platform.OS === "ios" ? RFPercentage(6) : RFPercentage(3),
    paddingBottom: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "30",
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2),
  },
  backButton: {
    padding: RFPercentage(1),
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: RFPercentage(1),
  },
  headerTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
  },
  chatCount: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.2),
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: RFPercentage(1),
    marginLeft: RFPercentage(0.5),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: RFPercentage(1.5),
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    padding: 0,
  },
  filterTabContainer: {
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
    marginTop: 20,
  },
  filterButton: {
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    marginRight: RFPercentage(1.5),
    position: "relative",
    overflow: "hidden",
  },
  filterButtonText: {
    fontSize: RFPercentage(1.6),
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    left: "25%",
    right: "25%",
    height: 3,
    borderRadius: 1.5,
  },
  chatListContainer: {
    flex: 1,
  },
  chatListContent: {
    paddingBottom: RFPercentage(2),
  },
  chatItemContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
    borderBottomWidth: 1,
  },
  chatItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(3.25),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(0.75),
    borderWidth: 2,
    borderColor: Colors.white,
  },
  chatContent: {
    flex: 1,
    marginLeft: RFPercentage(1.5),
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(0.5),
  },
  userName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
  timeText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(1),
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  unreadBadge: {
    minWidth: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(1.25),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(1),
  },
  unreadCount: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: RFPercentage(0.5),
  },
  messageTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(0.3),
  },
  messageTypeText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(0.5),
  },
  moreButton: {
    padding: RFPercentage(0.5),
    marginLeft: RFPercentage(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: RFPercentage(10),
  },
  loadingText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(2),
  },
  loadingMoreContainer: {
    paddingVertical: RFPercentage(2),
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(5),
    paddingTop: RFPercentage(15),
  },
  emptyIconContainer: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(3),
  },
  emptyTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
  },
  emptySubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(3),
  },
  startChatButton: {
    paddingHorizontal: RFPercentage(4),
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(1.2),
  },
  startChatButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  fab: {
    position: "absolute",
    bottom: RFPercentage(3),
    right: RFPercentage(3),
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(3.5),
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    overflow: "hidden",
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Messages;
