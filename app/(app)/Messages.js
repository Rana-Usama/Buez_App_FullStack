import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, FlatList, ActivityIndicator } from "react-native";
import { collection, query, where, orderBy, limit, onSnapshot, startAfter, getDocs, getDoc, doc } from 'firebase/firestore';
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../../config/Colors";

// components
import Nav from "../../components/common/Nav";
import CustomTabBar from "../../components/common/CustomTabBar";

import { FIREBASE_DB } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useUser } from "../../contexts/user.context";
import { router } from "expo-router";

function Messages({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [chats, setChats] = useState([]);
  const [lastVisible, setLastVisible] = useState(null); // Tracks last document for pagination
  const [loading, setLoading] = useState(false); // Loading state for fetching chats
  const [isRefreshing, setIsRefreshing] = useState(false); // State for pull-to-refresh
  const pageSize = 10; // Number of chats to fetch per batch
  const userId = getAuth().currentUser?.uid;
  const { userData, loading: userLoading, error: userError } = useUser();

  const filters = ["All", "Unread"];

  useEffect(() => {
    fetchInitialChats();
    listenForNewChats();
  }, []);

  const getChatData = async (d) => {
    const chatData = d.data();
    const otherUser = chatData.participants.find(u => u !== userId);
    const userRef = doc(FIREBASE_DB, "users", otherUser);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;
    return { id: d.id, ...chatData, user: userData };
  }

  const listenForNewChats = () => {
    const q = query(
      collection(FIREBASE_DB, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const updates = snapshot.docChanges().map(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            return await getChatData(change.doc);
          }
          if (change.type === 'removed') {
            return { id: change.doc.id, removed: true };
          }
          return null;
        });

        const resolvedUpdates = (await Promise.all(updates)).filter(Boolean);

        setChats(prevChats => {
          const updatedChats = [...prevChats];
          
          resolvedUpdates.forEach(data => {
            if (data.removed) {
              return updatedChats.filter(chat => chat.id !== data.id);
            }
            
            const chatIndex = updatedChats.findIndex(chat => chat.id === data.id);
            if (chatIndex !== -1) {
              updatedChats.splice(chatIndex, 1);
            }
            updatedChats.unshift(data);
          });

          return updatedChats;
        });
      } catch (error) {
        console.error('Error processing chat updates:', error);
      }
    });

    return unsubscribe;
  };

  const fetchInitialChats = async () => {
    setLoading(true);
		try {
			const q = query(
				collection(FIREBASE_DB, 'chats'),
				where('participants', 'array-contains', userId),
				orderBy('lastMessageTimestamp', 'desc'),
				limit(pageSize)
			);

      const snapshot = await getDocs(q);
      const chatData = [];
      for await (const doc of snapshot.docs) {
        const data = await getChatData(doc);
        chatData.push(data);
      }

      console.log('CHATS', chatData);
      setChats(chatData);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]); // Set last visible document
      setLoading(false);
		} catch (e) {
			console.log('Chat Error', e);
		}
  };

  const fetchMoreChats = async () => {
    if (!lastVisible || loading) return;

    setLoading(true);

    const q = query(
      collection(FIREBASE_DB, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc'),
      startAfter(lastVisible),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);

    const chatData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setChats((prevChats) => [...prevChats, ...chatData]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setLoading(false);
  };


  const refreshChats = async () => {
    setIsRefreshing(true);
    await fetchInitialChats();
    setIsRefreshing(false);
  };

  const FilterButton = ({ title, isActive, isFirst }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.filterButton, isActive ? styles.activeFilterButton : styles.inactiveFilterButton, isFirst && styles.firstFilterButton]}
      onPress={() => setActiveFilter(title)}
    >
      {isActive ? (
        <LinearGradient colors={[Colors.primary, "#4557B0"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          <Text style={styles.filterButtonTextActive}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.filterButtonTextInactive}>{title}</Text>
      )}
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({pathname: '/Chat', params: {data: JSON.stringify({chatId: item.id, senderId: userId, senderName: userData.userName, receiver: item.user })}})}
      activeOpacity={0.8}
      style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <View key={item.id} style={[
        styles.messageContainer,
        item.lastMessage?.unread && item.lastMessage?.senderId !== userId && styles.unreadMessage
      ]}>
        <Image style={styles.messageImage} source={{uri: item.user.profileImage}} />
        <View style={styles.messageTextContainer}>
          <Text style={[
            styles.messageUserName,
            item.lastMessage?.unread && item.lastMessage?.senderId !== userId && styles.unreadText
          ]}>
            {item.user.userName}
          </Text>
          <Text style={[
            styles.messageText,
            item.lastMessage?.unread && item.lastMessage?.senderId !== userId && styles.unreadText
          ]}>
            {item.lastMessage.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>{item.time}</Text>
        {item.lastMessage?.unread && item.lastMessage?.senderId !== userId && (
          <View style={styles.unreadDot} />
        )}
      </View>
      <View style={styles.separator} />
    </TouchableOpacity>
  );

  // Add filtered chats computation
  const filteredChats = useMemo(() => {
    if (activeFilter === "Unread") {
      return chats.filter(
        chat => 
          chat.lastMessage?.unread && 
          chat.lastMessage?.senderId !== userId
      );
    }
    return chats;
  }, [chats, activeFilter, userId]);

  return (
		<View style={styles.screen}>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
				{/* Nav */}
				<Nav marginTop={RFPercentage(7.5)} leftLogo={false} navigation={navigation} title='Messages' />

				{/* Filter Buttons */}
				<View style={styles.filterContainer}>
					{filters.map((title, index) => (
						<FilterButton
							key={title}
							title={title}
							isActive={activeFilter === title}
							isFirst={index === 0}
						/>
					))}
				</View>

				{/* Messages List */}
        <FlatList
          style={{ width: '100%' }}
					data={filteredChats}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					onEndReached={fetchMoreChats}
					onEndReachedThreshold={0.5}
					refreshing={isRefreshing}
					onRefresh={refreshChats}
					ListEmptyComponent={() => (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>
								{activeFilter === "Unread" 
									? "No unread messages" 
									: "No messages yet"}
							</Text>
						</View>
					)}
					ListFooterComponent={loading && <ActivityIndicator size='large' color='#0000ff' />}
				/>
				{/* <FlatList
					data={messages}
					pagingEnabled
					onEndReached={() => console.log('end reached')}
					showsHorizontalScrollIndicator={false}
					onMomentumScrollEnd={() => console.log('end')}
					style={{ width: '100%' }}
					renderItem={({ item }) => (
						<TouchableOpacity
							onPress={() => navigation.navigate('Chat', { id: item.id })}
							activeOpacity={0.8}
							style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
							<View key={item.id} style={styles.messageContainer}>
								<Image style={styles.messageImage} source={item.imageSource} />
								<View style={styles.messageTextContainer}>
									<Text style={styles.messageUserName}>{item.userName}</Text>
									<Text style={styles.messageText}>{item.messageText}</Text>
								</View>
								<Text style={styles.messageTime}>{item.time}</Text>
							</View>
							<View style={styles.separator} />
						</TouchableOpacity>
					)}
				/> */}
				{/* {messages.map((message) => (
          <TouchableOpacity activeOpacity={0.8} style={{ justifyContent: "center", alignItems: "center", width: "100%" }}>
            <View key={message.id} style={styles.messageContainer}>
              <Image style={styles.messageImage} source={message.imageSource} />
              <View style={styles.messageTextContainer}>
                <Text style={styles.messageUserName}>{message.userName}</Text>
                <Text style={styles.messageText}>{message.messageText}</Text>
              </View>
              <Text style={styles.messageTime}>{message.time}</Text>
            </View>
            <View style={styles.separator} />
          </TouchableOpacity>
        ))} */}

				<View style={styles.bottomSpacing} />
			</ScrollView>

			{/* Bottom Tab */}
			<CustomTabBar messagesTab={true} navigation={navigation} />
		</View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
  },
  filterContainer: {
    marginTop: RFPercentage(3.2),
    flexDirection: "row",
    width: "90%",
  },
  filterButton: {
    width: RFPercentage(13),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(2),
    alignSelf: "flex-start",
  },
  activeFilterButton: {
    borderColor: "transparent",
  },
  inactiveFilterButton: {
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
  },
  firstFilterButton: {
    marginLeft: 0,
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    borderRadius: RFPercentage(1),
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  filterButtonTextInactive: {
    color: Colors.heading,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  messageContainer: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(3),
  },
  messageImage: {
    width: RFPercentage(5.4),
    height: RFPercentage(5.4),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
  },
  messageTextContainer: {
    marginLeft: RFPercentage(1.5),
    justifyContent: "flex-start",
  },
  messageUserName: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
  },
  messageText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  messageTime: {
    position: "absolute",
    right: 0,
    top: 0,
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  separator: {
    width: "90%",
    height: RFPercentage(0.1),
    backgroundColor: Colors.border,
    marginTop: RFPercentage(2),
  },
  bottomSpacing: {
    marginBottom: RFPercentage(6),
  },
  unreadMessage: {
    backgroundColor: Colors.lightGrey,
  },
  unreadText: {
    fontFamily: "Poppins_500Medium",
    color: Colors.heading,
  },
  unreadDot: {
    position: 'absolute',
    right: RFPercentage(1),
    top: RFPercentage(1),
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: RFPercentage(10),
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(2),
    color: Colors.darkGrey,
    textAlign: 'center',
  },
});

export default Messages;
