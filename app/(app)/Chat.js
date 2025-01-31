import { StyleSheet, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { Avatar } from 'react-native-elements';
import Nav from '../../components/common/Nav';
import { collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, Timestamp, startAfter, doc, updateDoc, where, writeBatch, getDoc } from 'firebase/firestore';

import { RFPercentage } from 'react-native-responsive-fontsize';

import Colors from '../../config/Colors';
import { FIREBASE_DB } from '../../firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
const Chat = ({ navigation, route }) => {
	const [messages, setMessages] = useState([]);
	const [lastVisible, setLastVisible] = useState(null);
	const params = useLocalSearchParams();
	const { chatId, senderId, senderName, receiver } = JSON.parse(params.data);
	console.log({ chatId, senderId, senderName, receiver });

	useEffect(() => {
		const listenForNewMessages = () => {
			const lastLoadedTimestamp = messages.length > 0 ? Timestamp.fromDate(messages[messages.length - 1].createdAt) : Timestamp.now();
			console.log('WHERE', messages, lastLoadedTimestamp, Timestamp.now());
			const q = query(
				collection(FIREBASE_DB, `chats/${chatId}/messages`),
				where('timestamp', '>', lastLoadedTimestamp), // Listen only for new messages
				orderBy('timestamp', 'asc')
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
					return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean)
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
				orderBy('timestamp', 'desc'),
				limit(100)
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
				return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean)
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

		const q = query(
			collection(FIREBASE_DB, `chats/${chatId}/messages`),
			orderBy('timestamp', 'desc'),
			startAfter(lastVisible),
			limit(100)
		);

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
			return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean)
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
			const chatRef = doc(FIREBASE_DB, 'chats', chatId);
			await updateDoc(chatRef, {
				lastMessage: {
					...message,
					unread: true,
					senderId: senderId,
				},
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
				const q = query(
					collection(FIREBASE_DB, `chats/${chatId}/messages`),
					where('unread', '==', true),
					where('senderId', '!=', senderId)
				);

				const snapshot = await getDocs(q);
				
				// Update each unread message
				const batch = writeBatch(FIREBASE_DB);
				snapshot.docs.forEach((doc) => {
					batch.update(doc.ref, { unread: false });
				});

				// Update the last message unread status if it was from the other user
				const chatRef = doc(FIREBASE_DB, 'chats', chatId);
				const chatDoc = await getDoc(chatRef);
				const chatData = chatDoc.data();
				
				if (chatData?.lastMessage?.senderId !== senderId && chatData?.lastMessage?.unread) {
					batch.update(chatRef, {
						'lastMessage.unread': false
					});
				}

				await batch.commit();
			} catch (error) {
				console.error('Error marking messages as read:', error);
			}
		};

		markMessagesAsRead();
	}, [chatId, senderId]);

	console.log(messages);
	return (
		<View style={styles.screen}>
			{/* Nav */}
			<Nav marginTop={RFPercentage(7.5)} leftLogo={false} navigation={navigation} title={receiver?.userName} />
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
					bottomOffset={RFPercentage(10)}
				/>
			</View>

			{/* Bottom Tab */}
			{/* <CustomTabBar messagesTab={true} navigation={navigation} /> */}
		</View>
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
		width: '100%',
		// justifyContent: 'center',
		// alignItems: 'center',
		backgroundColor: 'lightgreen',
		marginBottom: RFPercentage(1),
	}
});

export default Chat;
