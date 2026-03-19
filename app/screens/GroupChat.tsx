import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  GiftedChat,
  Bubble,
  Day,
  InputToolbar,
} from "react-native-gifted-chat";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  getDocs,
  Timestamp,
  startAfter,
  doc,
  updateDoc,
  where,
  deleteDoc,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../config/Colors";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";
import { Icons } from "../config/theme";
import {
  resetUnreadCount,
  incrementUnreadForAll,
} from "../services/GroupChat.service";
import ClickableMessageText from "../components/common/ClickableMessageText";
import GroupHeader from "../components/group/GroupHeader";
import GroupInputToolbar from "../components/group/GroupInputToolbar";
import MessageActionModal from "../components/chat/MessageActionModal";
import MessageItem from "../components/group/MessageItem";

const INITIAL_LOAD_LIMIT = 20;
const LOAD_MORE_LIMIT = 20;

// Reuse same mapFirestoreDoc helper as Chat.tsx
const mapFirestoreDoc = async (
  docSnap: any,
  skipTranslation = false,
): Promise<any> => {
  const data = docSnap.data();
  const text = skipTranslation ? data.text : await cachedTranslate(data.text);
  return {
    _id: docSnap.id,
    text,
    createdAt: data.timestamp.toDate(),
    user: {
      _id: data.senderId,
      name: data.senderName,
      avatar: data.senderProfileImage || "",
    },
    _timestamp: data.timestamp,
    reactions: data.reactions || {},
    edited: data.edited || false,
    editedAt: data.editedAt || null,
    originalText: data.originalText || null,
  };
};

const GroupChat = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const {
    groupChatId,
    currentUserId,
    currentUserName,
    taskType,
    customTaskTitle,
  } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loader, setLoader] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupTitle, setGroupTitle] = useState(
    customTaskTitle || taskType || t("taskApplicants.group"),
  );

  // Action modal state (replaces old delete modal)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Edit state
  const [editingMessage, setEditingMessage] = useState<any>(null);

  const lastDocRef = useRef<any>(null);
  const listenerAttachedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const groupUnsubscribeRef = useRef<(() => void) | null>(null);

  const collectionPath = `groupChats/${groupChatId}/messages`;

  const senderMember = groupMembers.find((m) => m.userId === currentUserId);

  useEffect(() => {
    const rawInitial = customTaskTitle || taskType || "";
    if (!rawInitial) return;
    cachedTranslate(rawInitial).then((translated) => {
      if (translated) setGroupTitle(translated);
    });
  }, []);

  // ── Load group metadata (members) with real-time listener ─────────────────
  useEffect(() => {
    if (!groupChatId) return;
    const groupRef = doc(FIREBASE_DB, "groupChats", groupChatId);
    const unsubscribe = onSnapshot(groupRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Make sure each member has profileImage and token
        const members = (data.members || []).map((m: any) => ({
          userId: m.userId,
          userName: m.userName,
          profileImage: m.profileImage || "",
          token: m.token || "",
        }));
        setGroupMembers(members);
        const rawTitle =
          data.taskType === "Other"
            ? data.customTaskTitle || ""
            : data.taskType || "";

        if (rawTitle) {
          cachedTranslate(rawTitle).then((translated) => {
            setGroupTitle(translated || t("taskApplicants.group"));
          });
        } else {
          setGroupTitle(t("taskApplicants.group"));
        }
      }
    });
    groupUnsubscribeRef.current = unsubscribe;
    return () => unsubscribe();
  }, [groupChatId]);

  // ── Merge helper ──────────────────────────────────────────────────────────
  const mergeMessages = useCallback((prev: any[], incoming: any[]): any[] => {
    if (!incoming.length) return prev;
    const map = new Map<string, any>();
    prev.forEach((m) => map.set(m._id, m));
    incoming.forEach((m) => map.set(m._id, m));
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, []);

  // ── Real-time listener for new messages ───────────────────────────────────
  const attachListener = useCallback(
    (afterTimestamp: Timestamp) => {
      if (listenerAttachedRef.current) return;
      listenerAttachedRef.current = true;

      const q = query(
        collection(FIREBASE_DB, collectionPath),
        where("timestamp", ">", afterTimestamp),
        orderBy("timestamp", "asc"),
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) return;
        const incoming = await Promise.all(
          snapshot.docs.map((d) =>
            mapFirestoreDoc(d, d.data().senderId === currentUserId),
          ),
        );
        setMessages((prev) => mergeMessages(prev, incoming));
      });

      unsubscribeRef.current = unsubscribe;
    },
    [groupChatId, currentUserId, mergeMessages],
  );

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      if (!groupChatId) return;
      setLoader(true);
      try {
        const q = query(
          collection(FIREBASE_DB, collectionPath),
          orderBy("timestamp", "desc"),
          limit(INITIAL_LOAD_LIMIT),
        );
        const snapshot = await getDocs(q);

        if (cancelled) return;
        if (snapshot.docs.length < INITIAL_LOAD_LIMIT) setHasMore(false);

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;

        const initial = await Promise.all(
          snapshot.docs.map((d) =>
            mapFirestoreDoc(d, d.data().senderId === currentUserId),
          ),
        );

        if (cancelled) return;

        setMessages(
          initial.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );

        // Reset unread count for current user
        await resetUnreadCount(groupChatId, currentUserId);

        const newestTimestamp =
          snapshot.docs[0]?.data().timestamp ?? Timestamp.now();
        attachListener(newestTimestamp);
      } catch (err) {
        console.error("GroupChat fetchInitial error:", err);
      } finally {
        if (!cancelled) setLoader(false);
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      listenerAttachedRef.current = false;
    };
  }, [groupChatId]);

  // ── Load more (pagination) ────────────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(FIREBASE_DB, collectionPath),
        orderBy("timestamp", "desc"),
        startAfter(lastDocRef.current),
        limit(LOAD_MORE_LIMIT),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }
      if (snapshot.docs.length < LOAD_MORE_LIMIT) setHasMore(false);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];

      const older = await Promise.all(
        snapshot.docs.map((d) =>
          mapFirestoreDoc(d, d.data().senderId === currentUserId),
        ),
      );
      setMessages((prev) => mergeMessages(prev, older));
    } catch (err) {
      console.error("GroupChat loadMore error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [groupChatId, currentUserId, hasMore, loadingMore, mergeMessages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const onSend = useCallback(
    async (msgs: any[] = []) => {
      const msg = msgs[0];
      if (!msg?.text?.trim()) return;

      const newMessage = {
        text: msg.text,
        timestamp: Timestamp.now(),
        senderId: currentUserId,
        senderName: currentUserName,
        senderProfileImage: senderMember?.profileImage || "",
        unread: true,
      };

      setInputText("");

      try {
        await addDoc(collection(FIREBASE_DB, collectionPath), newMessage);

        // ── Increment unread count for all other members ──────────────────
        await incrementUnreadForAll(groupChatId, currentUserId, groupMembers);

        // ── Update group doc lastMessage ──────────────────────────────────
        const groupRef = doc(FIREBASE_DB, "groupChats", groupChatId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
          // Create the group document first
          await setDoc(groupRef, {
            createdAt: Timestamp.now(),
            members: groupMembers,
            lastMessage: {
              text: msg.text,
              senderId: currentUserId,
              senderName: currentUserName,
            },
            lastMessageTimestamp: Timestamp.now(),
            groupTitle: groupTitle,
          });
        } else {
          // Update existing document
          await updateDoc(groupRef, {
            lastMessage: {
              text: msg.text,
              senderId: currentUserId,
              senderName: currentUserName,
            },
            lastMessageTimestamp: Timestamp.now(),
          });
        }

        // ── Send push notifications to all members except sender ──────────
        sendGroupNotifications(msg.text);
      } catch (err) {
        console.error("GroupChat onSend error:", err);
      }
    },
    [groupChatId, currentUserId, currentUserName, groupMembers, senderMember],
  );

  // ── Push notifications to all group members except sender ─────────────────
  const sendGroupNotifications = useCallback(
    async (text: string) => {
      const recipients = groupMembers.filter(
        (m) => m.userId !== currentUserId && m.token,
      );
      await Promise.all(
        recipients.map((member) =>
          fetch("https://buez-server-khaki.vercel.app/api/send-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fcmToken: member.token,
              title: `${currentUserName} • ${groupTitle}`,
              body: text,
              data: {
                type: "group_message",
                groupChatId,
              },
            }),
          }).catch((err) => console.warn("Group notification error:", err)),
        ),
      );
    },
    [groupMembers, currentUserId, currentUserName, groupTitle, groupChatId],
  );

  // ── Delete message ────────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await deleteDoc(doc(FIREBASE_DB, collectionPath, messageId));
        setMessages((prev) => prev.filter((m) => m._id !== messageId));

        // Update lastMessage
        const q = query(
          collection(FIREBASE_DB, collectionPath),
          orderBy("timestamp", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(q);
        const groupRef = doc(FIREBASE_DB, "groupChats", groupChatId);
        if (!snapshot.empty) {
          const d = snapshot.docs[0].data();
          await updateDoc(groupRef, {
            lastMessage: {
              text: d.text,
              senderId: d.senderId,
              senderName: d.senderName,
            },
            lastMessageTimestamp: d.timestamp,
          });
        } else {
          await updateDoc(groupRef, {
            lastMessage: null,
            lastMessageTimestamp: null,
          });
        }
      } catch (err) {
        console.error("GroupChat deleteMessage error:", err);
      }
    },
    [groupChatId],
  );

  // ── Toggle reaction ───────────────────────────────────────────────────────
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const msgRef = doc(FIREBASE_DB, collectionPath, messageId);
        const msgSnap = await getDoc(msgRef);
        if (!msgSnap.exists()) return;

        const data = msgSnap.data();
        const reactions = data.reactions || {};
        const emojiUsers = reactions[emoji] || [];

        if (emojiUsers.includes(currentUserId)) {
          await updateDoc(msgRef, {
            [`reactions.${emoji}`]: arrayRemove(currentUserId),
          });
          setMessages((prev) =>
            prev.map((m) => {
              if (m._id !== messageId) return m;
              const updated = { ...m.reactions };
              updated[emoji] = (updated[emoji] || []).filter(
                (id: string) => id !== currentUserId,
              );
              if (updated[emoji].length === 0) delete updated[emoji];
              return { ...m, reactions: updated };
            }),
          );
        } else {
          await updateDoc(msgRef, {
            [`reactions.${emoji}`]: arrayUnion(currentUserId),
          });
          setMessages((prev) =>
            prev.map((m) => {
              if (m._id !== messageId) return m;
              const updated = { ...m.reactions };
              updated[emoji] = [...(updated[emoji] || []), currentUserId];
              return { ...m, reactions: updated };
            }),
          );
        }
      } catch (err) {
        console.error("GroupChat toggleReaction error:", err);
      }
    },
    [groupChatId, currentUserId, collectionPath],
  );

  // ── Edit message ──────────────────────────────────────────────────────────
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      try {
        const msgRef = doc(FIREBASE_DB, collectionPath, messageId);
        const msgSnap = await getDoc(msgRef);
        if (!msgSnap.exists()) return;

        const data = msgSnap.data();
        const updateData: any = {
          text: newText,
          edited: true,
          editedAt: Timestamp.now(),
        };
        if (!data.originalText) {
          updateData.originalText = data.text;
        }

        await updateDoc(msgRef, updateData);

        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, text: newText, edited: true }
              : m,
          ),
        );

        // Update lastMessage if most recent
        const lastMsgQuery = query(
          collection(FIREBASE_DB, collectionPath),
          orderBy("timestamp", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(lastMsgQuery);
        if (!snapshot.empty && snapshot.docs[0].id === messageId) {
          const groupRef = doc(FIREBASE_DB, "groupChats", groupChatId);
          await updateDoc(groupRef, {
            lastMessage: {
              text: newText,
              senderId: currentUserId,
              senderName: currentUserName,
            },
          });
        }
      } catch (err) {
        console.error("GroupChat editMessage error:", err);
      }
    },
    [groupChatId, currentUserId, currentUserName, collectionPath],
  );

  // ── Action modal handlers ─────────────────────────────────────────────────
  const handleActionPress = useCallback((message: any) => {
    setSelectedMessage(message);
    setActionModalVisible(true);
  }, []);

  const handleReact = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        toggleReaction(selectedMessage._id, emoji);
      }
    },
    [selectedMessage, toggleReaction],
  );

  const handleEdit = useCallback(() => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      setInputText(selectedMessage.text);
    }
  }, [selectedMessage]);

  const handleDeleteFromModal = useCallback(async () => {
    if (selectedMessage) {
      await deleteMessage(selectedMessage._id);
    }
    setActionModalVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage, deleteMessage]);

  const closeActionModal = useCallback(() => {
    setActionModalVisible(false);
    setSelectedMessage(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setInputText("");
  }, []);

  // create fast lookup map for group members (O(1) lookup)
  const memberMap = useMemo(() => {
    const m = new Map<string, any>();
    groupMembers.forEach((gm) => m.set(gm.userId, gm));
    return m;
  }, [groupMembers]);

  // stable send wrapper for GroupInputToolbar
  const sendText = useCallback(
    (text: string) => {
      if (!text?.trim()) return;

      // If editing, save the edit instead of sending a new message
      if (editingMessage) {
        editMessage(editingMessage._id, text.trim());
        setEditingMessage(null);
        setInputText("");
        return;
      }

      onSend([
        {
          text: text.trim(),
          user: { _id: currentUserId, name: currentUserName },
          createdAt: new Date(),
        },
      ]);
    },
    [onSend, currentUserId, currentUserName, editingMessage, editMessage],
  );

  // replace renderMessage with lightweight memoised MessageItem usage
  const renderMessage = useCallback(
    (props: any) => {
      const msg = props.currentMessage;
      if (!msg) return null;
      const isOwn = msg.user?._id === currentUserId;
      const member = memberMap.get(msg.user?._id);
      const profileImage = msg.user?.avatar || member?.profileImage || "";
      const displayName = msg.user?.name || member?.userName || "?";

      return (
        <MessageItem
          message={msg}
          isOwn={isOwn}
          profileImage={profileImage}
          displayName={displayName}
          onLongPress={handleActionPress}
          currentUserId={currentUserId}
          theme={theme}
          onToggleReaction={toggleReaction}
        />
      );
    },
    [currentUserId, memberMap, theme, handleActionPress, toggleReaction],
  );

  const renderDay = useCallback(
    (props: any) => <Day {...props} textStyle={styles.dateText} />,
    [],
  );

 

  const renderLoadEarlier = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <ActivityIndicator
        size="small"
        color={Colors.primary}
        style={{ marginVertical: 8 }}
      />
    );
  }, [loadingMore]);

  const listViewProps = useMemo(
    () => ({
      removeClippedSubviews: true,
      keyboardShouldPersistTaps: "handled" as const,
      showsVerticalScrollIndicator: true,
      initialNumToRender: 15,
      maxToRenderPerBatch: 10,
      windowSize: 10,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      },
    }),
    [],
  );

  const renderMessageText = useCallback(() => null, []);
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* header */}
      <GroupHeader
        navigation={navigation}
        groupTitle={groupTitle}
        memberCount={groupMembers.length}
        theme={theme}
        onOpenDetails={() =>
          navigation.navigate("GroupDetails", {
            groupChatId,
            currentUserId,
            currentUserName,
          })
        }
      />

      {/* messages */}
      <View style={styles.messageContainer}>
        <ImageBackground
          source={theme.mode === "dark" ? Icons.dark : Icons.light}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{ _id: currentUserId, name: currentUserName }}
            keyExtractor={(item) => item._id.toString()}
            loadEarlier={hasMore}
            onLoadEarlier={loadMoreMessages}
            isLoadingEarlier={loadingMore}
            renderLoadEarlier={renderLoadEarlier}
            renderInputToolbar={() => (
              <GroupInputToolbar
                inputText={inputText}
                setInputText={setInputText}
                onSendText={sendText}
                theme={theme}
                t={t}
                editingMessage={editingMessage}
                onCancelEdit={cancelEdit}
              />
            )}
            renderDay={renderDay}
            renderMessage={renderMessage}
            renderAvatar={() => null}
            renderBubble={undefined}
            listViewProps={listViewProps as any}
            maxInputLength={500}
            showUserAvatar={false}
            alwaysShowSend
            scrollToBottom
            renderMessageText={renderMessageText}
          />

          {loader && (
            <View
              style={[
                styles.loaderOverlay,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(4,4,4,0.6)"
                      : "rgba(255,255,255,0.6)",
                },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={theme.mode === "dark" ? Colors.white : Colors.primary}
              />
            </View>
          )}
        </ImageBackground>
      </View>

      {/* action modal */}
      <MessageActionModal
        visible={actionModalVisible}
        isOwnMessage={selectedMessage?.user?._id === currentUserId}
        currentReactions={selectedMessage?.reactions}
        currentUserId={currentUserId}
        onReact={handleReact}
        onEdit={handleEdit}
        onDelete={handleDeleteFromModal}
        onClose={closeActionModal}
        theme={theme}
        t={t}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? RFPercentage(2) : RFPercentage(3),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(1.5),
    paddingTop: RFPercentage(6),
    borderBottomWidth: 1,
    gap: RFPercentage(1.2),
  },
  groupIconContainer: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: { flex: 1 },
  headerTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  headerSubtitle: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
  },
  messageContainer: { flex: 1, width: "100%" },
  avatar: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
  },
  avatarFallback: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  senderName: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(1),
    marginBottom: RFPercentage(0.3),
  },

  wrap: {
    minHeight: RFPercentage(10),
    justifyContent: "center",
    paddingVertical: RFPercentage(2),
  },

  inlineAvatar: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
  },
  inlineAvatarFallback: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    justifyContent: "center",
    alignItems: "center",
  },
  inlineAvatarInitial: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  senderNameInBubble: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(1),
    marginBottom: RFPercentage(0.3),
  },

  // renderMessage styles
  msgAvatar: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1),
  },
  msgAvatarFallback: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
  },
  msgAvatarInitial: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  msgSenderName: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    // marginLeft: RFPercentage(1),
    // marginBottom: RFPercentage(0.4),
  },
  msgBubble: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.2),
    paddingBottom: RFPercentage(0.8),
    borderRadius: RFPercentage(2.2),
    minWidth: RFPercentage(10),
  },
  msgText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.6),
    marginTop: RFPercentage(1.4),
    marginBottom: RFPercentage(0.6),
  },
  msgTime: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.4),
  },
  toolbar: {
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(4),
    maxHeight: RFPercentage(18),
    justifyContent: "center",
    paddingHorizontal: RFPercentage(1.7),
    borderTopWidth: RFPercentage(0.1),
    alignSelf: "center",
    width: "90%",
    paddingVertical: RFPercentage(1.5),
  },
  customTextInput: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    width: "90%",
    marginVertical: 0,
    paddingVertical: 0,
    justifyContent: "center",
    textAlignVertical: "top",
    // lineHeight: RFPercentage(2.7),
    paddingTop: 3,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    position: "absolute",
    right: 0,
    top: RFPercentage(-0.8),
  },
  dateText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.4),
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  // Delete modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContainer: {
    width: "80%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(1),
  },
  modalText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(2),
  },
  modalButtons: {
    flexDirection: "row",
    gap: RFPercentage(1),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    alignItems: "center",
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(100),
    backgroundColor: "#F44336",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.5),
  },
});

export default GroupChat;
