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
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  GiftedChat,
  InputToolbar,
  Bubble,
  Day,
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
  writeBatch,
  getDoc,
  deleteDoc,
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

const Chat = ({ navigation, route }) => {
  const { t } = useTranslation();
  const {
    chatId,
    senderId: currentUserId,
    senderName,
    receiver,
  } = route.params;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const { theme } = useAppTheme();
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    const listenForNewMessages = () => {
      const lastLoadedTimestamp =
        messages.length > 0
          ? Timestamp.fromDate(messages[messages.length - 1].createdAt)
          : Timestamp.now();
      const q = query(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
        where("timestamp", ">", lastLoadedTimestamp),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const newMessages = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const firebaseMessage = doc.data();
            const translatedText = await cachedTranslate(firebaseMessage?.text);
            return {
              _id: doc.id,
              text: translatedText,
              createdAt: firebaseMessage.timestamp.toDate(),
              user: {
                _id: firebaseMessage.senderId,
                name: firebaseMessage.senderName,
              },
            };
          })
        );

        setMessages((prevMessages) => {
          const messagesMap = new Map();
          prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
          newMessages.forEach((msg) => messagesMap.set(msg._id, msg));
          const sortedMessages = Array.from(messagesMap.values()).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return GiftedChat.append([], sortedMessages).filter(Boolean);
        });
      });

      return unsubscribe;
    };
    if (chatId) {
      return listenForNewMessages();
    }
  }, []);

  const markMessagesAsRead = async () => {
    if (!chatId || !currentUserId) return;
    try {
      // Get unread messages sent by the other user
      const docRef = doc(FIREBASE_DB, "chats", chatId);
      await updateDoc(docRef, { unread: false });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    const fetchInitialMessages = async () => {
      // if (chatCache.data[chatId]) return;
      try {
        setLoader(true);

        const q = query(
          collection(FIREBASE_DB, `chats/${chatId}/messages`),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        const snapshot = await getDocs(q);

        const initialMessages = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const firebaseMessage = doc.data();
            const translatedText = await cachedTranslate(firebaseMessage?.text);
            return {
              _id: doc.id,
              text: translatedText,
              createdAt: firebaseMessage.timestamp.toDate(),
              user: {
                _id: firebaseMessage.senderId,
                name: firebaseMessage.senderName,
              },
            };
          })
        );

        // setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

        setMessages((prevMessages) => {
          const messagesMap = new Map();
          prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
          initialMessages.forEach((msg) => messagesMap.set(msg._id, msg));
          const mergedMessages = Array.from(messagesMap.values()).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          // chatCache.data[chatId] = mergedMessages;
          return GiftedChat.append([], mergedMessages).filter(Boolean);
        });
        markMessagesAsRead();
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoader(false); // stop loader
      }
    };
    fetchInitialMessages();
  }, [chatId]);

  const onSend = useCallback(async (messages = []) => {
    const message = messages[0];
    const newMessage = {
      text: message.text,
      timestamp: Timestamp.now(),
      senderId: currentUserId,
      senderName: senderName,
      unread: true,
    };

    // Save message to Firestore
    setMessage("");
    try {
      await addDoc(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
        newMessage
      );
      const chatRef = doc(FIREBASE_DB, "chats", chatId);
      await updateDoc(chatRef, {
        ...message,
        unread: true,
        senderId: currentUserId,
        senderName: senderName,
        lastMessage: message,
        lastMessageTimestamp: Timestamp.now(),
      });
      sendPushNotification(message?.text);
    } catch (e) {
      console.log(e);
    }
  }, []);

  async function sendPushNotification(message) {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: receiver?.token,
            title: senderName,
            body: message,
          }),
        }
      );
      const data = await response.text();
      return data;
    } catch (error) {
      console.log("sendPushNotification error:", error);
      throw error;
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      // 1. Delete the message
      const messageRef = doc(
        FIREBASE_DB,
        `chats/${chatId}/messages`,
        messageId
      );
      await deleteDoc(messageRef);
      // 2. Optimistically update local state
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
      // 3. Find latest message (after deletion)
      const q = query(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      const chatRef = doc(FIREBASE_DB, "chats", chatId);
      if (!snapshot.empty) {
        // Chat still has messages → update lastMessage
        const latestDoc = snapshot.docs[0];
        const latestMsg = latestDoc.data();

        await updateDoc(chatRef, {
          lastMessage: {
            text: latestMsg.text,
            createdAt: latestMsg.timestamp,
            senderId: latestMsg.senderId,
            senderName: latestMsg.senderName,
            unread: latestMsg.unread ?? false,
          },
          lastMessageTimestamp: latestMsg.timestamp,
        });
      } else {
        // No messages left → clear lastMessage
        await updateDoc(chatRef, {
          lastMessage: null,
          lastMessageTimestamp: null,
        });
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleDeletePress = (messageId) => {
    setSelectedMessageId(messageId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (selectedMessageId) {
      await deleteMessage(selectedMessageId);
      setSelectedMessageId(null);
    }
    setDeleteModalVisible(false);
  };

  const cancelDelete = () => {
    setSelectedMessageId(null);
    setDeleteModalVisible(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <View
        style={[styles.profileContainer, { borderBottomColor: Colors.white5 }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("TabNavigator", { screen: t("bottomTab.txt4") })
          }
        >
          <Ionicons
            name="chevron-back"
            size={RFPercentage(2.7)}
            color={theme.heading}
          />
        </TouchableOpacity>
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          {receiver?.profileImage ? (
            <>
              <Image
                source={{ uri: receiver?.profileImage }}
                resizeMode="cover"
                style={styles.profile}
              />
            </>
          ) : (
            <>
              <View style={styles.noProfile}>
                <Text style={[styles.noProfileInner, { color: theme.primary }]}>
                  {receiver?.userName[0]}
                </Text>
              </View>
            </>
          )}
        </View>
        <View style={{ marginLeft: RFPercentage(1.5) }}>
          <Text
            style={{
              color: theme.heading,
              fontSize: RFPercentage(2.2),
              fontFamily: "Poppins_500Medium",
            }}
          >
            {receiver?.userName}
          </Text>
        </View>
      </View>

      <View style={styles.messageContainer}>
        <ImageBackground
          source={theme.mode === "dark" ? Icons.dark : Icons.light}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          <GiftedChat
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{
              _id: currentUserId,
              name: senderName,
            }}
            listViewProps={{
              removeClippedSubviews: false,
              keyboardShouldPersistTaps: "handled",
              showsVerticalScrollIndicator: true,
              maintainVisibleContentPosition: {
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              },
            }}
            renderInputToolbar={(props) => (
              <View
                style={[
                  styles.wrap,
                  {
                    backgroundColor: theme.white,
                  },
                ]}
              >
                <InputToolbar
                  {...props}
                  containerStyle={[
                    styles.toolbar,
                    {
                      backgroundColor:
                        theme.mode === "dark"
                          ? "transparent"
                          : "rgba(241, 241, 241, 1)",
                      borderColor:
                        theme.mode == "dark"
                          ? Colors.darkGrey
                          : "rgba(234, 233, 233, 1)",
                      borderTopColor:
                        theme.mode == "dark"
                          ? Colors.darkGrey
                          : "rgba(234, 233, 233, 1)",
                    },
                  ]}
                  renderComposer={() => (
                    <TextInput
                      style={[styles.customTextInput, { color: theme.black }]}
                      placeholder={`${t("chat.txt2")}`}
                      placeholderTextColor={"rgba(145, 144, 144, 1)"}
                      value={message}
                      onChangeText={setMessage}
                      multiline={true}
                      scrollEnabled={true}
                      textAlignVertical="top"
                    />
                  )}
                  renderSend={() => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.sendButton}
                      disabled={!message}
                      onPress={() => {
                        onSend([
                          {
                            text: message,
                            user: {
                              _id: currentUserId,
                              name: senderName,
                            },
                            createdAt: new Date(),
                          },
                        ]);
                      }}
                    >
                      <Feather
                        name="send"
                        size={RFPercentage(2.6)}
                        color={
                          theme.mode === "dark" ? Colors.white : Colors.primary
                        }
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            renderDay={(props) => (
              <Day {...props} textStyle={styles.dateText} />
            )}
            renderAvatar={(props) => {
              const isReceiver =
                props.currentMessage.user._id !== currentUserId;
              if (!isReceiver) return null; // Don't show avatar for current user

              return receiver?.profileImage ? (
                <Image
                  source={{ uri: receiver.profileImage }}
                  style={styles.img}
                />
              ) : (
                <View style={[styles.inner, { backgroundColor: theme.white }]}>
                  <Text style={[styles.nm, { color: theme.primary }]}>
                    {receiver?.userName?.[0] || receiver?.name?.[0] || "?"}
                  </Text>
                </View>
              );
            }}
            renderBubble={(props) => {
              const isFromSameUser =
                props.currentMessage?.user?._id ===
                props.previousMessage?.user?._id;
              if (!props.currentMessage) return null;
              return (
                <View
                  style={{
                    flexDirection: "row",
                    marginVertical: isFromSameUser
                      ? RFPercentage(0.3)
                      : RFPercentage(1),
                  }}
                >
                  <Bubble
                    {...props}
                    onLongPress={() => {
                      if (props.currentMessage?.user?._id === currentUserId) {
                        handleDeletePress(props.currentMessage._id);
                      }
                    }}
                    wrapperStyle={{
                      left: {
                        backgroundColor:
                          theme.mode === "dark"
                            ? "rgba(25, 25, 25, 1)"
                            : "rgba(239, 239, 239, 1)",
                        padding: RFPercentage(0.6),
                        marginLeft: 0, // Ensure no left margin
                      },
                      right: {
                        backgroundColor:
                          theme.mode === "dark"
                            ? Colors.darkGrey
                            : Colors.primary,
                        padding: RFPercentage(0.6),
                        marginRight: 0, // Ensure no right margin
                      },
                    }}
                    textStyle={{
                      left: {
                        color: theme.black,
                        fontFamily: "Poppins_400Regular",
                        fontSize: RFPercentage(1.9),
                      },
                      right: {
                        color: Colors.white,
                        fontFamily: "Poppins_400Regular",
                        fontSize: RFPercentage(1.9),
                      },
                    }}
                  />
                </View>
              );
            }}
          />
          {loader && (
            <View
              style={[
                styles.loader,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(4, 4, 4, 0.6)"
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
      {isDeleteModalVisible && (
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
                activeOpacity={0.8}
                style={[
                  styles.cancel,
                  {
                    borderColor:
                      theme.mode === "dark" ? theme.lightGrey : theme.lightGrey,
                  },
                ]}
                onPress={cancelDelete}
              >
                <Text
                  style={{
                    color: theme.heading,
                    fontFamily: "Poppins_500Medium",
                    fontSize: RFPercentage(1.7),
                  }}
                >
                  {t("buttons.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.markButton}
                onPress={confirmDelete}
              >
                <Text style={styles.txt}>{t("chat.txt5")}</Text>
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
    paddingTop: Platform.OS === "android" ? RFPercentage(2) : RFPercentage(4),
  },
  messageContainer: {
    flex: 1,
    width: "100%",
  },
  loadMessages: {
    backgroundColor: Colors.chat,
    padding: RFPercentage(1.3),
    borderRadius: RFPercentage(100),
    alignSelf: "center",
    marginBottom: 10,
    paddingHorizontal: RFPercentage(2.6),
  },
  toolbar: {
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(4),
    // minHeight: RFPercentage(5.5),
    maxHeight: RFPercentage(18),
    justifyContent: "center",
    paddingHorizontal: RFPercentage(1.7),
    borderTopWidth: RFPercentage(0.1),
    alignSelf: "center",
    width: "90%",
    paddingVertical: RFPercentage(1.5),
  },
  customTextInput: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    width: "90%",
    marginVertical: 0,
    paddingVertical: 0,
    justifyContent: "center",
    textAlignVertical: "top",
    top: 0,
    lineHeight: RFPercentage(2.7),
    // backgroundColor:"red"
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
    color: Colors.primary,
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2.8),
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
    marginTop: Platform.OS === "android" ? 0 : RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    alignItems: "center",
    paddingVertical: RFPercentage(3),
  },
  modalTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  modalText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    marginHorizontal: RFPercentage(0.5),
    alignItems: "center",
  },
  cancel: {
    borderRadius: RFPercentage(100),
    width: RFPercentage(17),
    height: RFPercentage(5.2),
    borderWidth: RFPercentage(0.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  markButton: {
    borderRadius: RFPercentage(100),
    height: RFPercentage(5.2),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    width: RFPercentage(17.5),
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
});

export default Chat;
