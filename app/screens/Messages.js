import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, FlatList } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../config/Colors";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

function Messages({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Unread"];
  const messages = [
    {
      id: 1,
      userName: "Usama",
      messageText: "Hey, will be available...",
      time: "9:17 PM",
      imageSource: require("../../assets/Images/message.png"),
    },
    {
      id: 2,
      userName: "Jhon Smith",
      messageText: "Hey, will be available...",
      time: "9:17 PM",
      imageSource: require("../../assets/Images/dp.png"),
    },
    {
      id: 3,
      userName: "Emma Stone",
      messageText: "Hey, will be available...",
      time: "9:17 PM",
      imageSource: require("../../assets/Images/profilePic.png"),
    },
    {
      id: 4,
      userName: "Alex Rock",
      messageText: "Hey, will be available...",
      time: "9:17 PM",
      imageSource: require("../../assets/Images/profile2.png"),
    },
  ];

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
					data={messages}
					pagingEnabled
					onEndReached={() => console.log('end reached')}
					showsHorizontalScrollIndicator={false}
					onMomentumScrollEnd={() => console.log('end')}
					style={{ width: '100%' }}
					renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Chat", {id: item.id})}
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
				/>
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
});

export default Messages;
