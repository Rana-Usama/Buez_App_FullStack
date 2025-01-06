import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { Avatar } from 'react-native-elements';
import Nav from '../components/common/Nav';
import CustomTabBar from '../components/common/CustomTabBar';

import { RFPercentage } from 'react-native-responsive-fontsize';

import Colors from '../config/Colors';
import { FIREBASE_AUTH } from '../../firebaseConfig';
const auth = FIREBASE_AUTH;
const Chat = ({ navigation }) => {
	const [messages, setMessages] = useState([]);
	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<View style={{ marginLeft: 20 }}>
					<Avatar
						rounded
						source={{
							uri: auth?.currentUser?.photoURL,
						}}
					/>
				</View>
			),
			headerRight: () => (
				<TouchableOpacity
					style={{
						marginRight: 10,
					}}>
					<Text>logout</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	useEffect(() => {
		setMessages([
			{
				_id: 1,
				text: 'Hello developer',
				createdAt: new Date(),
				user: {
					_id: 2,
					name: 'React Native',
					avatar: 'https://placeimg.com/140/140/any',
				},
			},
		]);
  }, []);

	const onSend = useCallback((messages = []) => {
		setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
	}, []);

	return (
		<View style={styles.screen}>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
				{/* Nav */}
				<Nav marginTop={RFPercentage(7.5)} leftLogo={false} navigation={navigation} title='Messages' />
        <View style={styles.messageContainer}>
          <GiftedChat
            style={{}}
						messages={messages}
						showAvatarForEveryMessage={true}
						onSend={(messages) => onSend(messages)}
						user={{
							_id: auth?.currentUser?.email,
							name: auth?.currentUser?.displayName,
							avatar: auth?.currentUser?.photoURL,
						}}
					/>
				</View>
				<View style={styles.bottomSpacing} />
			</ScrollView>

			{/* Bottom Tab */}
			<CustomTabBar messagesTab={true} navigation={navigation} />
		</View>
	);
};

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		backgroundColor: Colors.white,
	},
	scrollView: {
    width: '100%',
	},
	scrollViewContent: {
		alignItems: 'center',
	},
  messageContainer: {
    width: '90%',
    backgroundColor: 'lightgreen',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
		marginTop: RFPercentage(3),
	},
	bottomSpacing: {
		marginBottom: RFPercentage(6),
	},
});

export default Chat;
