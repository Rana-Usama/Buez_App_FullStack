import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, Image, TextInput, StatusBar } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { GiftedChat, InputToolbar, Bubble, Day } from "react-native-gifted-chat";
import Nav from "../components/common/Nav";
import { collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, Timestamp, startAfter, doc, updateDoc, where, writeBatch, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { RFPercentage } from "react-native-responsive-fontsize";
import { translateText } from "../translation/googleTranslation";

import Colors from "../config/Colors";
import { FIREBASE_DB } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
const Chat = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const { chatId, senderId: currentUserId, senderName, receiver } = route.params;
  // console.log({ chatId, senderId: currentUserId, senderName, receiver });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const listenForNewMessages = () => {
      const lastLoadedTimestamp = messages.length > 0 ? Timestamp.fromDate(messages[messages.length - 1].createdAt) : Timestamp.now();
      const q = query(collection(FIREBASE_DB, `chats/${chatId}/messages`), where("timestamp", ">", lastLoadedTimestamp), orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const newMessages = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const firebaseMessage = doc.data();
            const translatedText = await translateText(firebaseMessage?.text);
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
          const sortedMessages = Array.from(messagesMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return GiftedChat.append([], sortedMessages).filter(Boolean);
        });
      });

      return unsubscribe;
    };
    if (chatId) {
      return listenForNewMessages();
    }
  }, []);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      const q = query(collection(FIREBASE_DB, `chats/${chatId}/messages`), orderBy("timestamp", "desc"), limit(100));
      const snapshot = await getDocs(q);
      const initialMessages = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const firebaseMessage = doc.data();
          const translatedText = await translateText(firebaseMessage?.text);
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

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

      setMessages((prevMessages) => {
        const messagesMap = new Map();
        prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
        initialMessages.forEach((msg) => messagesMap.set(msg._id, msg));
        const mergedMessages = Array.from(messagesMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return GiftedChat.append([], mergedMessages).filter(Boolean);
      });

      markMessagesAsRead();
    };

    fetchInitialMessages();
  }, [chatId]);

  const fetchMoreMessages = async () => {
    if (!lastVisible) return;
    const q = query(collection(FIREBASE_DB, `chats/${chatId}/messages`), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(100));
    const snapshot = await getDocs(q);
    const newMessages = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const firebaseMessage = doc.data();
        const translatedText = await translateText(firebaseMessage?.text);
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
      const combinedMessages = Array.from(messagesMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return GiftedChat.append([], combinedMessages).filter(Boolean);
    });

    markMessagesAsRead();
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
  };

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
      await addDoc(collection(FIREBASE_DB, `chats/${chatId}/messages`), newMessage);
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

  // Add a new useEffect to mark messages as read when the chat is opened

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

  // console.log(messages);

  async function sendPushNotification(message) {
    try {
      const response = await fetch("https://buez-server-khaki.vercel.app/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expoPushToken: receiver.token,
          title: senderName,
          message: message,
        }),
      });
      const data = await response.text();
      console.log("sendPushNotification:", data);
      return data;
    } catch (error) {
      console.error("sendPushNotification error:", error);
      throw error;
    }
  }

  return (
    <LinearGradient colors={["rgba(161, 172, 235, 0)", "rgba(95, 96, 142, 0.53)"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.screen}>
      {/* Nav */}
      <View style={styles.profileContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          {receiver?.profileImage ? (
            <>
              <Image source={{ uri: receiver?.profileImage }} resizeMode="cover" style={styles.profile} />
            </>
          ) : (
            <>
              <View style={styles.noProfile}>
                <Text style={styles.noProfileInner}>{receiver?.userName[0]}</Text>
              </View>
            </>
          )}
        </View>
        <View style={{ marginLeft: RFPercentage(1.5) }}>
          <Text style={{ color: Colors.primary, fontSize: RFPercentage(2.2), fontFamily: "Poppins_500Medium" }}>{receiver?.userName}</Text>
        </View>
      </View>

      <View style={styles.messageContainer}>
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={{
            _id: currentUserId,
            name: senderName,
          }}
          loadEarlier={!!lastVisible}
          onLoadEarlier={fetchMoreMessages}
          // bottomOffset={RFPercentage(2)} // Adjusted bottomOffset
          renderLoadEarlier={(props) => (
            <TouchableOpacity style={styles.loadMessages} onPress={props.onLoadEarlier}>
              <Text style={{ color: Colors.white, fontFamily: "Poppins_400Regular" }}>{`${t("chat.txt1")}`}</Text>
            </TouchableOpacity>
          )}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={styles.toolbar}
              renderComposer={() => <TextInput style={styles.customTextInput} placeholder={`${t("chat.txt2")}`} placeholderTextColor="#bbb" value={message} onChangeText={setMessage} />}
              renderSend={() => (
                <TouchableOpacity
                  style={styles.sendButton}
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
                  <Feather name="send" size={RFPercentage(2.3)} color={Colors.white} />
                </TouchableOpacity>
              )}
            />
          )}
          renderDay={(props) => <Day {...props} textStyle={styles.dateText} />}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                left: {
                  backgroundColor: Colors.lightWhite,
                  padding: RFPercentage(0.6),
                },
                right: {
                  backgroundColor: Colors.primary,
                  padding: RFPercentage(0.6),
                },
              }}
              textStyle={{
                left: {
                  color: Colors.black,
                  fontFamily: "Poppins_400Regular",
                },
                right: {
                  color: Colors.white,
                  fontFamily: "Poppins_400Regular",
                },
              }}
            />
          )}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: RFPercentage(1),
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
    backgroundColor: "rgb(124, 130, 164)",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: RFPercentage(6),
    height: RFPercentage(6),
    justifyContent: "center",
    padding: RFPercentage(1.5),
    borderTopWidth: 1,
    alignSelf: "center",
    width: "100%",
    marginBottom: RFPercentage(2.5),
    // bottom: keyboardVisible ? RFPercentage(25) : 0,
  },
  customTextInput: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    borderRadius: RFPercentage(10),
    width: RFPercentage(38),
    fontFamily: "Poppins_400Regular",
    // backgroundColor:'red'
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    position: "absolute",
    right: 0,
    // backgroundColor:'red',
    top: RFPercentage(-0.8),
  },
  dateText: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.6),
    backgroundColor: Colors.chat,
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(20),
    paddingHorizontal: RFPercentage(1.2),
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
  noProfileInner: { color: Colors.primary, fontSize: RFPercentage(2.2), fontFamily: "Poppins_500Medium" },
  profile: { width: RFPercentage(7), height: RFPercentage(7), borderRadius: RFPercentage(100), borderWidth: 2, borderColor: Colors.primary },
  profileContainer: { width: "100%", alignItems: "center", flexDirection: "row", height: RFPercentage(10), borderBottomWidth: 1, borderBottomColor: Colors.lightGrey },
});

export default Chat;
