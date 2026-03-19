import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  FlatList,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
} from "react";
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
  getDoc,
  deleteDoc,
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
import { Linking } from "react-native";
import ClickableMessageText from "../components/common/ClickableMessageText";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInputToolbar from "../components/chat/ChatInputToolbar";
import MessageActionModal from "../components/chat/MessageActionModal";
import ReactionDisplay from "../components/chat/ReactionDisplay";
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_LOAD_LIMIT = 20;
const LOAD_MORE_LIMIT = 20;

// ─── Helper: Map a Firestore doc → GiftedChat message ─────────────────────────
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
    },
    _timestamp: data.timestamp, // keep raw Timestamp for cursor
    reactions: data.reactions || {},
    edited: data.edited || false,
    editedAt: data.editedAt || null,
    originalText: data.originalText || null,
  };
};

const Chat = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const {
    chatId,
    senderId: currentUserId,
    senderName,
    receiver,
  } = route.params;
  const { theme } = useAppTheme();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loader, setLoader] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Action modal state (replaces old delete modal)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Edit state
  const [editingMessage, setEditingMessage] = useState<any>(null);

  // Refs — avoid stale closures and unnecessary re-renders
  const lastDocRef = useRef<any>(null); 
  const listenerAttachedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Merge helper (dedup + sort desc) ──────────────────────────────────────
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

  // ── Attach real-time listener for new messages ─────────────────────────────
  const attachListener = useCallback(
    (afterTimestamp: Timestamp) => {
      if (listenerAttachedRef.current) return;
      listenerAttachedRef.current = true;

      const q = query(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
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
    [chatId, currentUserId, mergeMessages],
  );

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      if (!chatId) return;
      setLoader(true);
      try {
        const q = query(
          collection(FIREBASE_DB, `chats/${chatId}/messages`),
          orderBy("timestamp", "desc"),
          limit(INITIAL_LOAD_LIMIT),
        );
        const snapshot = await getDocs(q);

        if (cancelled) return;

        if (snapshot.docs.length < INITIAL_LOAD_LIMIT) setHasMore(false);

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;

        // Translate in parallel; skip translation for own messages
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

        // Mark as read (fire-and-forget)
        markMessagesAsRead();

        // Attach listener from NOW (newest message timestamp or now)
        const newestTimestamp =
          snapshot.docs[0]?.data().timestamp ?? Timestamp.now();
        attachListener(newestTimestamp);
      } catch (err) {
        console.error("fetchInitial error:", err);
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
  }, [chatId]);

  // ── Load older messages (pagination) ──────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
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
      console.error("loadMore error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, currentUserId, hasMore, loadingMore, mergeMessages]);

  // ── Mark as read ──────────────────────────────────────────────────────────
  const markMessagesAsRead = useCallback(async () => {
    if (!chatId || !currentUserId) return;
    try {
      await updateDoc(doc(FIREBASE_DB, "chats", chatId), { unread: false });
    } catch (err) {
      console.error("markMessagesAsRead error:", err);
    }
  }, [chatId, currentUserId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const onSend = useCallback(
    async (msgs: any[] = []) => {
      const msg = msgs[0];
      if (!msg?.text?.trim()) return;

      const newMessage = {
        text: msg.text,
        timestamp: Timestamp.now(),
        senderId: currentUserId,
        senderName,
        unread: true,
      };

      setInputText("");

      try {
        await addDoc(
          collection(FIREBASE_DB, `chats/${chatId}/messages`),
          newMessage,
        );
        const chatRef = doc(FIREBASE_DB, "chats", chatId);
        await updateDoc(chatRef, {
          unread: true,
          senderId: currentUserId,
          senderName,
          lastMessage: { text: msg.text },
          lastMessageTimestamp: Timestamp.now(),
        });
        sendPushNotification(msg.text);
      } catch (err) {
        console.error("onSend error:", err);
      }
    },
    [chatId, currentUserId, senderName],
  );

  // ── Push notification (fire-and-forget) ──────────────────────────────────
  const sendPushNotification = useCallback(
    async (text: string) => {
      try {
        await fetch(
          "https://buez-server-khaki.vercel.app/api/send-notification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fcmToken: receiver?.token,
              title: senderName,
              body: text,
            }),
          },
        );
      } catch (err) {
        console.warn("sendPushNotification error:", err);
      }
    },
    [receiver?.token, senderName],
  );

  // ── Delete message ────────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await deleteDoc(
          doc(FIREBASE_DB, `chats/${chatId}/messages`, messageId),
        );
        setMessages((prev) => prev.filter((m) => m._id !== messageId));

        // Update lastMessage on chat doc
        const q = query(
          collection(FIREBASE_DB, `chats/${chatId}/messages`),
          orderBy("timestamp", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(q);
        const chatRef = doc(FIREBASE_DB, "chats", chatId);
        if (!snapshot.empty) {
          const d = snapshot.docs[0].data();
          await updateDoc(chatRef, {
            lastMessage: {
              text: d.text,
              createdAt: d.timestamp,
              senderId: d.senderId,
              senderName: d.senderName,
              unread: d.unread ?? false,
            },
            lastMessageTimestamp: d.timestamp,
          });
        } else {
          await updateDoc(chatRef, {
            lastMessage: null,
            lastMessageTimestamp: null,
          });
        }
      } catch (err) {
        console.error("deleteMessage error:", err);
      }
    },
    [chatId],
  );

  // ── Toggle reaction ───────────────────────────────────────────────────────
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const msgRef = doc(FIREBASE_DB, `chats/${chatId}/messages`, messageId);
        const msgSnap = await getDoc(msgRef);
        if (!msgSnap.exists()) return;

        const data = msgSnap.data();
        const reactions = data.reactions || {};
        const emojiUsers = reactions[emoji] || [];

        if (emojiUsers.includes(currentUserId)) {
          // Remove reaction
          await updateDoc(msgRef, {
            [`reactions.${emoji}`]: arrayRemove(currentUserId),
          });
          // Update local state
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
          // Add reaction
          await updateDoc(msgRef, {
            [`reactions.${emoji}`]: arrayUnion(currentUserId),
          });
          // Update local state
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
        console.error("toggleReaction error:", err);
      }
    },
    [chatId, currentUserId],
  );

  // ── Edit message ──────────────────────────────────────────────────────────
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      try {
        const msgRef = doc(FIREBASE_DB, `chats/${chatId}/messages`, messageId);
        const msgSnap = await getDoc(msgRef);
        if (!msgSnap.exists()) return;

        const data = msgSnap.data();
        const updateData: any = {
          text: newText,
          edited: true,
          editedAt: Timestamp.now(),
        };
        // Preserve original text only on first edit
        if (!data.originalText) {
          updateData.originalText = data.text;
        }

        await updateDoc(msgRef, updateData);

        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, text: newText, edited: true }
              : m,
          ),
        );

        // Update lastMessage if this was the most recent message
        const lastMsgQuery = query(
          collection(FIREBASE_DB, `chats/${chatId}/messages`),
          orderBy("timestamp", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(lastMsgQuery);
        if (!snapshot.empty && snapshot.docs[0].id === messageId) {
          const chatRef = doc(FIREBASE_DB, "chats", chatId);
          await updateDoc(chatRef, {
            lastMessage: { text: newText },
          });
        }
      } catch (err) {
        console.error("editMessage error:", err);
      }
    },
    [chatId],
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


  const renderDay = useCallback(
    (props: any) => <Day {...props} textStyle={styles.dateText} />,
    [],
  );

  const renderAvatar = useCallback(
    (props: any) => {
      if (props.currentMessage?.user?._id === currentUserId) return null;
      return receiver?.profileImage ? (
        <Image source={{ uri: receiver.profileImage }} style={styles.img} />
      ) : (
        <View style={[styles.inner, { backgroundColor: theme.white }]}>
          <Text style={[styles.nm, { color: theme.primary }]}>
            {receiver?.userName?.[0] || "?"}
          </Text>
        </View>
      );
    },
    [currentUserId, receiver, theme],
  );

  const sendText = useCallback(
    (text: string) => {
      if (!text?.trim()) return;

      // If we're in edit mode, save the edit instead of sending a new message
      if (editingMessage) {
        editMessage(editingMessage._id, text.trim());
        setEditingMessage(null);
        setInputText("");
        return;
      }

      onSend([
        {
          text: text.trim(),
          user: { _id: currentUserId, name: senderName },
          createdAt: new Date(),
        },
      ]);
    },
    [onSend, currentUserId, senderName, editingMessage, editMessage],
  );

  const renderBubble = useCallback(
    (props: any) => {
      const isFromSameUser =
        props.currentMessage?.user?._id === props.previousMessage?.user?._id;
      if (!props.currentMessage) return null;
      const msg = props.currentMessage;
      const isOwn = msg.user?._id === currentUserId;
      return (
        <View
          style={{
            marginVertical: isFromSameUser
              ? RFPercentage(0.3)
              : RFPercentage(1),
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <Bubble
              {...props}
              onLongPress={() => handleActionPress(msg)}
              wrapperStyle={{
                left: {
                  backgroundColor:
                    theme.mode === "dark"
                      ? Colors.chatDarkBg
                      : Colors.cardBorderLight,
                  padding: RFPercentage(0.6),
                  marginLeft: 0,
                },
                right: {
                  backgroundColor:
                    theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
                  padding: RFPercentage(0.6),
                  marginRight: 0,
                },
              }}
              textStyle={{
                left: {
                  color: theme.black,
                  fontFamily: "Poppins_400Regular",
                  fontSize: RFPercentage(1.8),
                  lineHeight: RFPercentage(2.5),
                },
                right: {
                  color: Colors.white,
                  fontFamily: "Poppins_400Regular",
                  fontSize: RFPercentage(1.8),
                  lineHeight: RFPercentage(2.5),
                },
              }}
              renderFooter={() =>
                msg.edited ? (
                  <Text
                    style={[
                      styles.editedLabel,
                      {
                        color: isOwn
                          ? "rgba(255,255,255,0.55)"
                          : theme.mode === "dark"
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(0,0,0,0.35)",
                        textAlign: isOwn ? "right" : "left",
                      },
                    ]}
                  >
                    {t("chat.txt8")}
                  </Text>
                ) : null
              }
            />
          </View>
          {/* Reactions display */}
          <ReactionDisplay
            reactions={msg.reactions}
            currentUserId={currentUserId}
            onToggleReaction={(emoji) => toggleReaction(msg._id, emoji)}
            theme={theme}
            isOwnMessage={isOwn}
          />
        </View>
      );
    },
    [currentUserId, theme, handleActionPress, toggleReaction, t],
  );

  // Footer shown while loading older messages
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

  // Memoised listViewProps — stable object reference
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


const renderMessageText = useCallback(
  (props: any) => (
    <ClickableMessageText
      currentMessage={props.currentMessage}
      currentUserId={currentUserId}
      theme={theme}
    />
  ),
  [currentUserId, theme],
);




  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <ChatHeader navigation={navigation} receiver={receiver} theme={theme} />

      {/* Message list */}
      <View style={styles.messageContainer}>
        <ImageBackground
          source={theme.mode === "dark" ? Icons.dark : Icons.light}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{ _id: currentUserId, name: senderName }}
            keyExtractor={(item) => item._id.toString()}
            renderMessageText={renderMessageText}
            // Pagination
            loadEarlier={hasMore}
            onLoadEarlier={loadMoreMessages}
            isLoadingEarlier={loadingMore}
            renderLoadEarlier={renderLoadEarlier}
            // Render props (all memoised)
            renderInputToolbar={(props) => (
              <ChatInputToolbar
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
            renderAvatar={renderAvatar}
            renderBubble={renderBubble}
            // FlatList tuning
            listViewProps={listViewProps as any}
            // Misc
            maxInputLength={500}
            showUserAvatar={false}
            alwaysShowSend
            scrollToBottom
          />

          {/* Initial load overlay */}
          {loader && (
            <View
              style={[
                styles.loader,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? Colors.loaderDarkOverlay
                      : Colors.loaderLightOverlay,
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? RFPercentage(2) : RFPercentage(3),
  },
  messageContainer: {
    flex: 1,
    width: "100%",
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
    paddingTop:3
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
  noProfile: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(100),
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  noProfileInner: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2.6),
    top: 3,
  },
  profile: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(100),
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    height: RFPercentage(8.6),
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
    marginTop: Platform.OS === "android" ? RFPercentage(5) : RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
  },
  modalOverlay: {
    backgroundColor: Colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    width: "80%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    // alignItems: "center",
    paddingVertical: RFPercentage(3),
  },
  modalTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  modalText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    // textAlign: "center",
    marginBottom: RFPercentage(2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancel: {
    borderRadius: RFPercentage(100),
    width: RFPercentage(15.5),
    height: RFPercentage(5.2),
    borderWidth: RFPercentage(0.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  markButton: {
    borderRadius: RFPercentage(100),
    height: RFPercentage(5.2),
    borderColor: Colors.dangerRed,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
     backgroundColor: Colors.dangerRed,
    width: RFPercentage(15.5),
  },
  wrap: {
    minHeight: RFPercentage(10),
    justifyContent: "center",
    paddingVertical: RFPercentage(2),
  },
  img: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(50),
    borderWidth: 1,
    borderColor: Colors.primary,
    bottom: RFPercentage(0.3),
  },
  inner: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(50),
    alignItems: "center",
    justifyContent: "center",
    bottom: RFPercentage(0.3),
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  nm: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    lineHeight: RFPercentage(2),
  },
  loader: {
    position: "absolute",
    top: 0,
    bottom: RFPercentage(10),
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  txt: {
    color: "white",
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.7),
  },
  editedLabel: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular_Italic",
    marginTop: RFPercentage(0.2),
    paddingHorizontal: RFPercentage(0.5),
  },
});

export default memo(Chat);
