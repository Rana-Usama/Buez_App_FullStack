import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
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
import { Feather, Ionicons } from "@expo/vector-icons";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── User profile cache — avoids re-fetching the same user doc repeatedly ────
const userProfileCache = new Map<string, any>();

const fetchOtherUserProfile = async (userId: string): Promise<any> => {
  if (userProfileCache.has(userId)) return userProfileCache.get(userId);
  const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
  const data = userDoc.exists() ? userDoc.data() : null;
  userProfileCache.set(userId, data);
  return data;
};

const mapChatDoc = async (d: any, currentUserId: string): Promise<any> => {
  const chatData = d.data();

  const otherUserId = chatData.participants?.find(
    (u: any) => u !== currentUserId
  );
  const otherUserData = otherUserId
    ? await fetchOtherUserProfile(otherUserId)
    : null;

  const rawText = chatData.lastMessage?.text ?? "";

  // ── Who sent the last message? ──────────────────────────────────────────
  // Check all possible locations where senderId might be stored,
  // then fall back to participants comparison as the guaranteed source of truth.
  const lastSenderId =
    chatData.lastMessage?.senderId ?? // inside lastMessage (new docs)
    chatData.senderId ??              // root level (your current data shape)
    null;

  // If lastSenderId is the OTHER user → translate. Otherwise it's ours → skip.
  const shouldTranslate = lastSenderId
    ? lastSenderId === otherUserId    // ✅ compare against participants-derived otherUserId
    : false;                          // can't determine → safe default: don't translate

  let displayText = rawText;
  if (rawText && shouldTranslate) {
    try {
      displayText = await cachedTranslate(rawText);
    } catch {
      displayText = rawText;
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
      text: displayText,
      createdAt,
    },
    user: otherUserData,
    unreadCount: chatData.unreadCount?.[currentUserId] || 0,
  };
};
// ─── Sub-components (memoised) ────────────────────────────────────────────────

const FilterButton = memo(
  ({
    title,
    isActive,
    onPress,
    theme,
  }: {
    title: string;
    isActive: boolean;
    onPress: () => void;
    theme: any;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.filterButton,
        {
          backgroundColor: isActive ? theme.primary : theme.white,
          borderColor: isActive ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
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
        <View style={[styles.activeIndicator, { backgroundColor: theme.white }]} />
      )}
    </TouchableOpacity>
  )
);

const ChatItem = memo(
  ({
    item,
    userId,
    theme,
    onPress,
    t,
  }: {
    item: any;
    userId: string;
    theme: any;
    onPress: () => void;
    t: any;
  }) => {
    const isUnread = item.unreadCount > 0 && item.lastMessage?.senderId !== userId;
    const lastMessageTime = formatChatTimestamp(item.lastMessage?.createdAt);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.chatItemContainer,
          {
            backgroundColor: isUnread ? theme.primary + "08" : theme.white,
            borderBottomColor: theme.border + "40",
          },
        ]}
      >
        <View style={styles.chatItemContent}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={
                item.user?.profileImage ? { uri: item.user.profileImage } : Icons.dp
              }
            />
          </View>

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
                {item.lastMessage?.text?.trim()
                  ? item.lastMessage.text
                  : `${t("messages.txt6")} ${item.user?.userName}!`}
              </Text>

              {isUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            {item.lastMessage?.type === "image" && (
              <View style={styles.messageTypeIndicator}>
                <Feather name="image" size={RFPercentage(1.6)} color={theme.lightGrey} />
                <Text style={[styles.messageTypeText, { color: theme.lightGrey }]}>
                  {t("messages.photo")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

// ─── Main Component ────────────────────────────────────────────────────────────
function Messages({ navigation }: any) {
  const { t } = useTranslation();
  const userId = getAuth().currentUser?.uid ?? "";
  const { userData } = useUser();
  const profileImgUrl = userData?.profileImage || "";
  const { theme } = useAppTheme();

  const [chats, setChats] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(t("messages.txt2"));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Prevent duplicate listener attachment on re-renders
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useExitAppOnBack();

  const filters = useMemo(
    () => [t("messages.txt2"), t("messages.txt3")],
    [t]
  );

  // ── Merge helper ──────────────────────────────────────────────────────────
  const mergeChats = useCallback((prev: any[], updates: any[]): any[] => {
    const map = new Map<string, any>(prev.map((c) => [c.id, c]));
    updates.forEach((u) => {
      if (u.removed) map.delete(u.id);
      else map.set(u.id, u);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0).getTime() -
        new Date(a.lastMessage?.createdAt ?? 0).getTime()
    );
  }, []);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const fetchInitialChats = useCallback(async () => {
    if (!userId) return;
    setLoadingInitial(true);
    try {
      const q = query(
        collection(FIREBASE_DB, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);

      // Parallel map — much faster than sequential for-await
      const chatData = await Promise.all(
        snapshot.docs.map((d) => mapChatDoc(d, userId))
      );

      setChats(chatData);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? null);
    } catch (e) {
      console.error("fetchInitialChats error:", e);
    } finally {
      setLoadingInitial(false);
    }
  }, [userId]);

  // ── Load more (pagination) ────────────────────────────────────────────────
  const fetchMoreChats = useCallback(async () => {
    if (!lastVisible || loadingMore || !userId) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(FIREBASE_DB, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const chatData = await Promise.all(
        snapshot.docs.map((d) => mapChatDoc(d, userId))
      );

      setChats((prev) => mergeChats(prev, chatData));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (e) {
      console.error("fetchMoreChats error:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, userId, mergeChats]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const refreshChats = useCallback(async () => {
    setIsRefreshing(true);
    await fetchInitialChats();
    setIsRefreshing(false);
  }, [fetchInitialChats]);

  // ── Real-time listener (only for added/modified/removed changes) ──────────
  const attachListener = useCallback(() => {
    if (!userId) return;

    // Only listen to the most recent page — avoids over-reading
    const q = query(
      collection(FIREBASE_DB, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc"),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const changes = snapshot.docChanges();
      if (!changes.length) return;

      const updates = await Promise.all(
        changes.map(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            return await mapChatDoc(change.doc, userId);
          }
          if (change.type === "removed") {
            return { id: change.doc.id, removed: true };
          }
          return null;
        })
      );

      const resolved = updates.filter(Boolean) as any[];
      setChats((prev) => mergeChats(prev, resolved));
    });

    unsubscribeRef.current = unsubscribe;
  }, [userId, mergeChats]);

  // ── Startup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialChats().then(() => attachListener());

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredChats = useMemo(() => {
    const valid = chats.filter(
      (c) => c.lastMessage?.text?.trim()
    );
    if (activeFilter === t("messages.txt3")) {
      return valid.filter(
        (c) => c.unreadCount > 0 && c.lastMessage?.senderId !== userId
      );
    }
    return valid;
  }, [chats, activeFilter, userId, t]);

  // ── Stable callbacks for ChatItem ─────────────────────────────────────────
  const handleChatPress = useCallback(
    (item: any) => {
      navigation.navigate("Chat", {
        chatId: item.id,
        senderId: userId,
        senderName: userData?.userName,
        receiver: item.user,
      });
    },
    [navigation, userId, userData]
  );



 

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ChatItem
        item={item}
        userId={userId}
        theme={theme}
        onPress={() => handleChatPress(item)}
        t={t}
      />
    ),
    [userId, theme, handleChatPress, t]
  );

  const keyExtractor = useCallback((item: any) => item.id, []);



  const EmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View
          style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "20" }]}
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
          {t("messages.emptyDescription")}
        </Text>
      </View>
    ),
    [activeFilter, theme, t]
  );

  console.log("filtered chats...........",filteredChats)
  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
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
        {filters.map((title) => (
          <FilterButton
            key={title}
            title={title}
            isActive={activeFilter === title}
            onPress={() => setActiveFilter(title)}
            theme={theme}
          />
        ))}
      </View>

      {/* Chat List */}
      <Animated.View
        style={[
          styles.chatListContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
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
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onEndReached={fetchMoreChats}
            onEndReachedThreshold={0.3}
            // FlatList performance tuning
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={8}
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
          />
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // paddingTop: RFPercentage(10),
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
});

export default memo(Messages);
