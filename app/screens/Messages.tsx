import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
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
import AvatarInitials from "../components/common/DefaultAvatars";
import FounderBadgeById from "../components/common/FounderBadgeById";
import { getAvatarColors } from "../config/avatarColors";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;
const userProfileCache = new Map<string, any>();

// ─── Fetch other user's profile (1:1 chat) ───────────────────────────────────
const fetchOtherUserProfile = async (userId: string): Promise<any> => {
  if (userProfileCache.has(userId)) return userProfileCache.get(userId);
  const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
  const data = userDoc.exists() ? userDoc.data() : null;
  userProfileCache.set(userId, data);
  return data;
};

// ─── Map 1:1 chat document ────────────────────────────────────────────────────
const mapChatDoc = async (d: any, currentUserId: string): Promise<any> => {
  const chatData = d.data();
  const otherUserId = chatData.participants?.find(
    (u: string) => u !== currentUserId,
  );
  const otherUserData = otherUserId
    ? await fetchOtherUserProfile(otherUserId)
    : null;
  const rawText = chatData.lastMessage?.text ?? "";

  const lastSenderId =
    chatData.lastMessage?.senderId ?? chatData.senderId ?? null;
  const shouldTranslate = lastSenderId === otherUserId;
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
    chatData?.lastMessageTimestamp?.toDate?.() ??
    null;

  return {
    id: d.id,
    ...chatData,
    lastMessage: chatData.lastMessage
      ? { ...chatData.lastMessage, text: displayText, createdAt }
      : null,
    user: otherUserData,
    unreadCount: chatData.unreadCount?.[currentUserId] || 0,
  };
};

// ─── Map Group chat document ──────────────────────────────────────────────────
const mapGroupChatDoc = async (d: any, currentUserId: string): Promise<any> => {
  const data = d.data();
  const rawText = data.lastMessage?.text ?? "";
  const createdAt =
    data?.lastMessageTimestamp?.toDate?.() ??
    (data?.lastMessageTimestamp instanceof Date
      ? data.lastMessageTimestamp
      : new Date());
  const unreadCount = data.unreadCounts?.[currentUserId] || 0;

  const senderName = data.lastMessage?.senderName || "";
  const isSentByCurrentUser = data.lastMessage?.senderId === currentUserId;

  return {
    id: d.id,
    type: "group",
    groupTitle:
      data.taskType === "Other"
        ? data.customTaskTitle || "Group Chat"
        : data.taskType || "Group Chat",
    members: data.members || [],
    lastMessage: rawText
      ? {
          text: isSentByCurrentUser
            ? `You: ${rawText}`
            : senderName
              ? `${senderName}: ${rawText}`
              : rawText,
          senderId: data.lastMessage?.senderId,
          createdAt,
        }
      : null,
    unreadCount,
  };
};

// ─── Filter Button ───────────────────────────────────────────────────────────
const FilterButton = memo(({ title, isActive, onPress, theme }: any) => (
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
    
  </TouchableOpacity>
));

// ─── Chat Item ──────────────────────────────────────────────────────────────
const ChatItem = memo(({ item, userId, theme, onPress, t }: any) => {
  const isUnread =
    (item.unread || item.unreadCount > 0) &&
    (item.type === "group"
      ? item.lastMessage?.senderId !== userId // group:
      : item?.senderId !== userId); // 1:1
  const lastMessageTime = formatChatTimestamp(item.lastMessage?.createdAt);

  const isDark = theme.mode === "dark";

  const firstLetter = item.groupTitle?.trim()?.[0];
  const [, groupTextColor] = getAvatarColors(firstLetter, isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chatItemContainer,
        {
          backgroundColor: isUnread ? theme.primary + "10" : theme.white,
          borderBottomColor: theme.border + "40",
        },
      ]}
    >
      <View style={styles.chatItemContent}>
        {item.type === "group" ? (
          <View style={styles.avatarContainer}>
            <AvatarInitials name={item.groupTitle} size={RFPercentage(6.5)} />
            {/* Small group indicator badge */}
            <View
              style={[
                styles.groupBadge,
                { backgroundColor: groupTextColor + (isDark ? "60" : "70") },
              ]}
            >
              <Ionicons
                name="people"
                size={RFPercentage(1.4)}
                color={Colors.white}
              />
            </View>
          </View>
        ) : (
          <View style={styles.avatarContainer}>
            {item.user?.profileImage ? (
              <Image
                style={styles.avatar}
                source={{ uri: item.user.profileImage }}
              />
            ) : (
              <AvatarInitials
                name={item.user?.userName}
                style={styles.avatarInitials}
              />
            )}

            {/* Founder Badge — item.user is a full `users` doc (resolved via
                fetchOtherUserProfile), so isFounder is already present. */}
            <FounderBadgeById
              user={item.user}
              userId={item.user?.userId}
              size={RFPercentage(2.6)}
              style={styles.founderBadge}
            />
          </View>
        )}

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
              {item.user?.userName ||
                item.groupTitle ||
                t("messages.unknownUser")}
            </Text>
            <Text style={[styles.timeText, { color: theme.darkGrey }]}>
              {lastMessageTime}
            </Text>
          </View>

          {item.lastMessage && (
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
                {item.lastMessage.text}
              </Text>
              {isUnread && (
                <View
                  style={[
                    styles.unreadBadge,
                    { backgroundColor: theme.primary },
                  ]}
                ></View>
              )}
            </View>
          )}

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
});

// ─── Main Messages Component ────────────────────────────────────────────────
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
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useExitAppOnBack();

  const filters = useMemo(() => [t("messages.txt2"), t("messages.txt3")], [t]);

  const mergeChats = useCallback((prev: any[], updates: any[]): any[] => {
    const map = new Map<string, any>(prev.map((c) => [c.id, c]));
    updates.forEach((u) => {
      if (u.removed) map.delete(u.id);
      else map.set(u.id, u);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0).getTime() -
        new Date(a.lastMessage?.createdAt ?? 0).getTime(),
    );
  }, []);

  const fetchInitialChats = useCallback(async () => {
    if (!userId) return;
    setLoadingInitial(true);
    try {
      const chatsQuery = query(
        collection(FIREBASE_DB, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        limit(PAGE_SIZE),
      );

      const groupQuery = query(
        collection(FIREBASE_DB, "groupChats"),
        where("memberIds", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        limit(PAGE_SIZE),
      );

      const [chatSnap, groupSnap] = await Promise.all([
        getDocs(chatsQuery),
        getDocs(groupQuery),
      ]);

      const oneToOneChats = (
        await Promise.all(chatSnap.docs.map((d) => mapChatDoc(d, userId)))
      ).filter((c) => c.lastMessage);
      const groupChats = (
        await Promise.all(groupSnap.docs.map((d) => mapGroupChatDoc(d, userId)))
      ).filter((c) => c.lastMessage);

      setChats(
        [...oneToOneChats, ...groupChats].sort(
          (a, b) =>
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime(),
        ),
      );
    } catch (e) {
      console.error("fetchInitialChats error:", e);
    } finally {
      setLoadingInitial(false);
    }
  }, [userId]);

  const fetchMoreChats = useCallback(async () => {
    if (!lastVisible || loadingMore || !userId) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(FIREBASE_DB, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const chatData = await Promise.all(
        snapshot.docs.map((d) => mapChatDoc(d, userId)),
      );
      setChats((prev) => mergeChats(prev, chatData));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (e) {
      console.error("fetchMoreChats error:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, userId, mergeChats]);

  const refreshChats = useCallback(async () => {
    setIsRefreshing(true);
    await fetchInitialChats();
    setIsRefreshing(false);
  }, [fetchInitialChats]);

  const attachListener = useCallback(() => {
    if (!userId) return;

    const chatQuery = query(
      collection(FIREBASE_DB, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc"),
      limit(PAGE_SIZE),
    );

    const groupQuery = query(
      collection(FIREBASE_DB, "groupChats"),
      where("memberIds", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc"),
      limit(PAGE_SIZE),
    );

    const unsubChats = onSnapshot(chatQuery, async (snapshot) => {
      const changes = snapshot.docChanges();
      if (!changes.length) return;

      const updates = await Promise.all(
        changes.map(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            return await mapChatDoc(change.doc, userId);
          }
          if (change.type === "removed")
            return { id: change.doc.id, removed: true };
          return null;
        }),
      );

      setChats((prev) => mergeChats(prev, updates.filter(Boolean) as any[]));
    });

    const unsubGroups = onSnapshot(groupQuery, async (snapshot) => {
      const changes = snapshot.docChanges();
      if (!changes.length) return;

      const updates = await Promise.all(
        changes.map(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            return await mapGroupChatDoc(change.doc, userId);
          }
          if (change.type === "removed")
            return { id: change.doc.id, removed: true };
          return null;
        }),
      );

      setChats((prev) => mergeChats(prev, updates.filter(Boolean) as any[]));
    });

    unsubscribeRef.current = () => {
      unsubChats();
      unsubGroups();
    };
  }, [userId, mergeChats]);

  useEffect(() => {
    fetchInitialChats().then(() => attachListener());

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

    return () => unsubscribeRef.current?.();
  }, []);
  const filteredChats = useMemo(() => {
    const visibleChats = chats.filter((c) => c.lastMessage);

    if (activeFilter === t("messages.txt3")) {
      return visibleChats.filter((c) => {
        if (c.type === "group") {
          return c.unreadCount > 0 && c.lastMessage?.senderId !== userId;
        } else {
          return c.unread === true && c?.senderId !== userId;
        }
      });
    }

    return visibleChats;
  }, [chats, activeFilter, userId, t]);

  const handleChatPress = useCallback(
    (item: any) => {
      if (item.type === "group") {
        navigation.navigate("GroupChat", {
          groupChatId: item.id,
          currentUserId: userId,
          currentUserName: userData?.userName,
        });
      } else {
        navigation.navigate("Chat", {
          chatId: item.id,
          senderId: userId,
          senderName: userData?.userName,
          receiver: item.user,
        });
      }
    },
    [navigation, userId, userData],
  );

  console.log("filtered chats............", filteredChats);

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
    [userId, theme, handleChatPress, t],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const EmptyState = useCallback(
    () => (
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
          {t("messages.emptyDescription")}
        </Text>
      </View>
    ),
    [activeFilter, theme, t],
  );

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
        gradientColors={[Colors.primary, Colors.blueDark3]}
        title={`${t("messages.txt1")}`}
      />

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

      <Animated.View
        style={[
          styles.chatListContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {loadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.mode === "dark" ? Colors.darkGrey : Colors.primary}
            />
            <Text
              style={[
                styles.loadingText,
                {
                  color:
                    theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
                },
              ]}
            >
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
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={8}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshChats}
                colors={[theme.mode === "dark" ? Colors.white : theme.primary]}
                tintColor={theme.mode === "dark" ? Colors.white : theme.primary}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  filterTabContainer: {
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
    marginTop: 20,
  },
  filterButton: {
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    marginRight: RFPercentage(1.5),
    position: "relative",
    overflow: "hidden",
  },
  filterButtonText: { fontSize: RFPercentage(1.6), textAlign: "center" },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    left: "25%",
    right: "25%",
    height: 3,
    borderRadius: 1.5,
  },
  chatListContainer: { flex: 1 },
  chatListContent: { paddingBottom: RFPercentage(2) },
  chatItemContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
    borderBottomWidth: 1,
  },
  chatItemContent: { flexDirection: "row", alignItems: "center" },
  avatarContainer: { position: "relative" },
  founderBadge: {
    position: "absolute",
    right: -RFPercentage(0.5),
    bottom: -RFPercentage(0.3),
  },
  avatar: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.lightGrey,
  },
  chatContent: { flex: 1, marginLeft: RFPercentage(2) },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: { fontSize: RFPercentage(2), fontFamily: "Poppins_400Regular" },
  timeText: { fontSize: RFPercentage(1.5), fontFamily: "Poppins_400Regular" },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },
  messageText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  unreadBadge: {
    minWidth: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(1.25),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(1),
  },
  unreadCount: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontWeight: "600",
  },
  messageTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  messageTypeText: {
    fontSize: RFPercentage(1.5),
    marginLeft: RFPercentage(0.5),
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: RFPercentage(1.5), fontSize: RFPercentage(1.8) , fontFamily: "Poppins_400Regular"},
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(10),
  },
  emptyIconContainer: {
    padding: RFPercentage(2.5),
    borderRadius: RFPercentage(5),
    marginBottom: RFPercentage(2),
  },
  emptyTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  emptySubtitle: {
    fontSize: RFPercentage(1.6),
    textAlign: "center",
    marginTop: RFPercentage(1),
    width: "70%",
    fontFamily: "Poppins_400Regular"
  },
  groupBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: RFPercentage(2.6),
    height: RFPercentage(2.6),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.white,
  },
  avatarInitials: {
                  width: RFPercentage(6.5),
                  height: RFPercentage(6.5),
                  borderRadius: RFPercentage(100),
                },
});

export default Messages;
