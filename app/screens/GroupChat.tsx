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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

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

  const handleDeletePress = useCallback((id: string) => {
    setSelectedMessageId(id);
    setDeleteModalVisible(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedMessageId) {
      await deleteMessage(selectedMessageId);
      setSelectedMessageId(null);
    }
    setDeleteModalVisible(false);
  }, [selectedMessageId, deleteMessage]);

  const cancelDelete = useCallback(() => {
    setSelectedMessageId(null);
    setDeleteModalVisible(false);
  }, []);

  // ── Render: Avatar (show for non-current-user messages) ───────────────────
  const renderAvatar = useCallback(
    (props: any) => {
      if (props.currentMessage?.user?._id === currentUserId) return null;

      // Primary: avatar stored on the message itself
      const messageAvatar = props.currentMessage?.user?.avatar;

      // Fallback: look up from live groupMembers state
      const member = groupMembers.find(
        (m) => m.userId === props.currentMessage?.user?._id,
      );
      const profileImage = messageAvatar || member?.profileImage || "";
      const displayName = props.currentMessage?.user?.name || "?";

      return profileImage ? (
        <Image source={{ uri: profileImage }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            { backgroundColor: Colors.primary + "30" },
          ]}
        >
          <Text style={[styles.avatarInitial, { color: Colors.primary }]}>
            {displayName[0]?.toUpperCase() || "?"}
          </Text>
        </View>
      );
    },
    [currentUserId, groupMembers],
  );

  const renderMessage = useCallback(
    (props: any) => {
      if (!props.currentMessage) return null;
      const isOwn = props.currentMessage?.user?._id === currentUserId;

      // Get sender info
      const messageAvatar = props.currentMessage?.user?.avatar;
      const member = groupMembers.find(
        (m) => m.userId === props.currentMessage?.user?._id,
      );
      const profileImage = messageAvatar || member?.profileImage || "";
      const displayName = props.currentMessage?.user?.name || "?";

      return (
        <View
          style={{
            flexDirection: isOwn ? "row-reverse" : "row",
            alignItems: "flex-end",
            marginVertical: RFPercentage(0.5),
            paddingHorizontal: RFPercentage(2),
          }}
        >
          {/* ── Bubble column ── */}
          <View
            style={{
              maxWidth: "90%",
              alignItems: isOwn ? "flex-end" : "flex-start",
            }}
          >
            {/* Message bubble */}
            <TouchableOpacity
              activeOpacity={0.85}
              onLongPress={() => {
                if (isOwn) handleDeletePress(props.currentMessage._id);
              }}
              style={[
                styles.msgBubble,
                isOwn
                  ? {
                      backgroundColor:
                        theme.mode === "dark"
                          ? Colors.darkGrey
                          : Colors.primary,
                      borderBottomRightRadius: 4,
                    }
                  : {
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(10, 10, 17, 1)"
                          : "rgba(240,240,240,1)",
                      borderBottomLeftRadius: 4,
                    },
              ]}
            >
              <View
                style={{
                  marginRight: RFPercentage(1.2),
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.msgAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.msgAvatarFallback,
                      { backgroundColor: Colors.primary + "25" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgAvatarInitial,
                        {
                          color:
                            theme.mode === "dark"
                              ? Colors.white
                              : Colors.primary,
                        },
                      ]}
                    >
                      {displayName[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}

                <View style={{ marginLeft: RFPercentage(1.2) }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.msgSenderName,
                      { color: isOwn ? Colors.white : Colors.lightGrey },
                    ]}
                  >
                    {displayName}
                  </Text>
                  <Text
                    style={[
                      styles.msgTime,
                      {
                        color: isOwn
                          ? "rgba(255,255,255,0.6)"
                          : theme.mode === "dark"
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(0,0,0,0.35)",
                      },
                    ]}
                  >
                    {new Date(
                      props.currentMessage.createdAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              <ClickableMessageText
                currentMessage={props.currentMessage}
                currentUserId={currentUserId}
                theme={theme}
               
                textStyle={{
                  color: isOwn ? Colors.white : theme.black,
                  marginTop: RFPercentage(1.4),
                  marginBottom: RFPercentage(0.6),
                }}
                linkStyle={{
                  color: isOwn ? "rgba(255,255,255,0.85)" : theme.primary,
                }}
                noPadding 
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [currentUserId, groupMembers, theme, handleDeletePress],
  );

  const renderDay = useCallback(
    (props: any) => <Day {...props} textStyle={styles.dateText} />,
    [],
  );

  const renderInputToolbar = useCallback(
    (props: any) => (
      <View style={[styles.wrap, { backgroundColor: theme.white }]}>
        <InputToolbar
          {...props}
          containerStyle={[
            styles.toolbar,
            {
              backgroundColor:
                theme.mode === "dark" ? "transparent" : "rgba(241,241,241,1)",
              borderColor:
                theme.mode === "dark" ? Colors.darkGrey : "rgba(234,233,233,1)",
              borderTopColor:
                theme.mode === "dark" ? Colors.darkGrey : "rgba(234,233,233,1)",
            },
          ]}
          renderComposer={() => (
            <TextInput
              style={[styles.customTextInput, { color: theme.black }]}
              placeholder={`${t("chat.txt2")}`}
              placeholderTextColor="rgba(145,144,144,1)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              scrollEnabled
              textAlignVertical="top"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          )}
          renderSend={() => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.sendButton}
              disabled={!inputText.trim()}
              onPress={() => {
                if (!inputText.trim()) return;
                onSend([
                  {
                    text: inputText.trim(),
                    user: { _id: currentUserId, name: currentUserName },
                    createdAt: new Date(),
                  },
                ]);
              }}
            >
              <Feather
                name="send"
                size={RFPercentage(2.6)}
                color={theme.mode === "dark" ? Colors.white : Colors.primary}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    ),
    [inputText, theme, onSend, currentUserId, currentUserName],
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

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: Colors.white5 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={RFPercentage(2.7)}
            color={theme.heading}
          />
        </TouchableOpacity>

        {/* Group icon */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("GroupDetails", {
              groupChatId,
              currentUserId,
              currentUserName,
            })
          }
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.groupIconContainer,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.darkGrey
                    : Colors.primary + "20",
              },
            ]}
          >
            <Ionicons
              name="people"
              size={RFPercentage(3.2)}
              color={theme.mode === "dark" ? Colors.white : Colors.primary}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text
            style={[styles.headerTitle, { color: theme.heading }]}
            numberOfLines={1}
          >
            {groupTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.darkGrey }]}>
            {groupMembers.length} {t("taskApplicants.member")}
          </Text>
        </View>
      </View>

      {/* ── Messages ── */}
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
            renderInputToolbar={renderInputToolbar}
            renderDay={renderDay}
            renderMessage={renderMessage}
            renderAvatar={() => {}}
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

      {/* ── Delete Modal ── */}
      {deleteModalVisible && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContainer, { backgroundColor: theme.white }]}
          >
            <Text style={[styles.modalTitle, { color: theme.heading }]}>
              {t("chat.txt3")}
            </Text>
            <Text style={[styles.modalText, { color: theme.darkGrey }]}>
              {t("chat.txt4")}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.lightGrey }]}
                onPress={cancelDelete}
              >
                <Text
                  style={{
                    color: theme.heading,
                    fontFamily: "Poppins_500Medium",
                  }}
                >
                  {t("buttons.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteBtnText}>{t("chat.txt5")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
