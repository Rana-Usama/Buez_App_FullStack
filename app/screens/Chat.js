import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import { Avatar } from "react-native-elements";
import Nav from "../components/common/Nav";
import { collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, Timestamp, startAfter, doc, updateDoc, where, writeBatch, getDoc } from "firebase/firestore";

import { RFPercentage } from "react-native-responsive-fontsize";

import Colors from "../config/Colors";
import { FIREBASE_DB } from "../../firebaseConfig";
const Chat = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const { chatId, senderId, senderName, receiver } = route.params;
  console.log({ chatId, senderId, senderName, receiver });

  useEffect(() => {
    const listenForNewMessages = () => {
      const lastLoadedTimestamp = messages.length > 0 ? Timestamp.fromDate(messages[messages.length - 1].createdAt) : Timestamp.now();
      console.log("WHERE", messages, lastLoadedTimestamp, Timestamp.now());
      const q = query(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
        where("timestamp", ">", lastLoadedTimestamp), // Listen only for new messages
        orderBy("timestamp", "asc"),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => {
          const firebaseMessage = doc.data();
          return {
            _id: doc.id,
            text: firebaseMessage.text,
            createdAt: firebaseMessage.timestamp.toDate(),
            user: {
              _id: firebaseMessage.senderId,
              name: firebaseMessage.senderName,
            },
          };
        });
        console.log(newMessages);
        setMessages((prevMessages) => {
          const messagesMap = new Map();
          prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
          newMessages.forEach((msg) => messagesMap.set(msg._id, msg));
          console.log(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt));
          return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean);
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
      const q = query(
        collection(FIREBASE_DB, `chats/${chatId}/messages`),
        /// where('text', '!=', ''), // Dummy where clause to make the query work
        orderBy("timestamp", "desc"),
        limit(100),
      );

      const snapshot = await getDocs(q);
      const initialMessages = snapshot.docs.map((doc) => {
        const firebaseMessage = doc.data();
        return {
          _id: doc.id,
          text: firebaseMessage.text,
          createdAt: firebaseMessage.timestamp.toDate(),
          user: {
            _id: firebaseMessage.senderId,
            name: firebaseMessage.senderName,
          },
        };
      });
      console.log("INITIAL CHAT", initialMessages);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]); // Update last visible
      setMessages((prevMessages) => {
        const messagesMap = new Map();
        prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
        initialMessages.forEach((msg) => messagesMap.set(msg._id, msg));
        console.log(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt));
        return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean);
      });
    };

    fetchInitialMessages();
  }, [chatId]);

  // useEffect(() => {
  // 	const fetchInitialMessages = () => {
  // 		const q = query(
  // 			collection(FIREBASE_DB, `chats/${chatId}/messages`),
  // 			orderBy('timestamp', 'desc'),
  // 			limit(100)
  // 		);

  // 		const unsubscribe = onSnapshot(q, (snapshot) => {
  // 			const newMessages = snapshot.docs.map((doc) => {
  // 				const firebaseMessage = doc.data();
  // 				return {
  // 					_id: doc.id,
  // 					text: firebaseMessage.text,
  // 					createdAt: firebaseMessage.timestamp.toDate(),
  // 					user: {
  // 						_id: firebaseMessage.senderId,
  // 						name: firebaseMessage.senderName,
  // 					},
  // 				};
  // 			});

  // 			setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));
  // 			setLastVisible(snapshot.docs[snapshot.docs.length - 1]); // Track last visible message
  // 		});

  // 		return unsubscribe;
  // 	};

  // 	return fetchInitialMessages();
  // }, [chatId]);

  const fetchMoreMessages = async () => {
    if (!lastVisible) return;

    const q = query(collection(FIREBASE_DB, `chats/${chatId}/messages`), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(100));

    const snapshot = await getDocs(q);
    const newMessages = snapshot.docs.map((doc) => {
      const firebaseMessage = doc.data();
      return {
        _id: doc.id,
        text: firebaseMessage.text,
        createdAt: firebaseMessage.timestamp.toDate(),
        user: {
          _id: firebaseMessage.senderId,
          name: firebaseMessage.senderName,
        },
      };
    });

    setMessages((prevMessages) => {
      const messagesMap = new Map();
      prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
      newMessages.forEach((msg) => messagesMap.set(msg._id, msg));
      return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean);
    });
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
  };

  const onSend = useCallback(async (messages = []) => {
    const message = messages[0];
    const newMessage = {
      text: message.text,
      timestamp: Timestamp.now(),
      senderId: senderId,
      senderName: senderName,
      unread: true,
    };

    // Save message to Firestore
    try {
      await addDoc(collection(FIREBASE_DB, `chats/${chatId}/messages`), newMessage);
      const chatRef = doc(FIREBASE_DB, "chats", chatId);
      await updateDoc(chatRef, {
        ...message,
        unread: true,
        senderId: senderId,
        senderName: senderName,
        lastMessage: message,
        lastMessageTimestamp: Timestamp.now(),
      });
    } catch (e) {
      console.log(e);
    }
  }, []);

  // Add a new useEffect to mark messages as read when the chat is opened
  useEffect(() => {
    if (!chatId || !senderId) return;

    const markMessagesAsRead = async () => {
      try {
        // Get unread messages sent by the other user
        const q = query(collection(FIREBASE_DB, `chats/${chatId}/messages`), where("unread", "==", true), where("senderId", "!=", senderId));

        const snapshot = await getDocs(q);

        // Update each unread message
        const batch = writeBatch(FIREBASE_DB);
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { unread: false });
        });

        // Update the last message unread status if it was from the other user
        const chatRef = doc(FIREBASE_DB, "chats", chatId);
        const chatDoc = await getDoc(chatRef);
        const chatData = chatDoc.data();

        if (chatData?.lastMessage?.senderId !== senderId && chatData?.lastMessage?.unread) {
          batch.update(chatRef, {
            "lastMessage.unread": false,
          });
        }

        await batch.commit();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
  }, [chatId, senderId]);

  console.log(messages);
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? RFPercentage(7.9) : RFPercentage(-25)}>
      <View style={styles.screen}>
        {/* Nav */}
        <View style={{ width: "100%", justifyContent: "center", alignItems: "center" }}>
          <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={receiver?.userName} />
        </View>

        <View style={styles.messageContainer}>
          <GiftedChat
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{
              _id: senderId,
              name: senderName,
            }}
            loadEarlier={!!lastVisible}
            onLoadEarlier={fetchMoreMessages}
            bottomOffset={RFPercentage(2)} // Adjusted bottomOffset
            renderLoadEarlier={(props) => (
              <TouchableOpacity style={styles.loadMessages} onPress={props.onLoadEarlier}>
                <Text style={{ color: Colors.white, fontWeight: "bold" }}>Load earlier messages</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingLeft: RFPercentage(1),
    paddingRight: RFPercentage(1),
    // justifyContent: 'flex-start',
    // alignItems: 'center',
    backgroundColor: Colors.white,
  },
  messageContainer: {
    flex: 1,
    width: "100%",
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: "white",
    marginBottom: RFPercentage(1),
    borderRadius: RFPercentage(1),
  },
  loadMessages: {
    backgroundColor: Colors.chat,
    padding: RFPercentage(1.3),
    borderRadius: RFPercentage(100),
    alignSelf: "center",
    marginBottom: 10,
    paddingHorizontal: RFPercentage(2.6),
  },
});

export default Chat;
