import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, FlatList, Dimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";

// components
import Nav from "../../components/common/Nav";
import CustomTabBar from "../../components/common/CustomTabBar";

// config
import Colors from "../../config/Colors";
import MyAppButton from "../../components/common/MyAppButton";
import { getDateTime } from "../../services/Shared.service";
import { createNewChat } from "../../services/Chat.service";
import { useUser } from "../../contexts/user.context";
import { router, useLocalSearchParams } from "expo-router";
import { getPostById } from "../../services/Post.service";

const screenWidth = Dimensions.get("window").width;

function OfferDetail({ navigation, route }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [postRequest, setPostRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;
  const images = [require("../../assets/Images/cover.png"), require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png")];
  const params = useLocalSearchParams();
  const postRequestId = params?.postRequest;
  console.log('user',currentUser)
  const handleStartChat = async () => {
    const chatId = await createNewChat(currentUserId, postRequest.userId);
    router.push({pathname: '/Chat', params: {data: JSON.stringify({chatId: chatId, senderId: currentUserId, senderName: currentUser.userName, receiver: postRequest.user })}  });
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await getPostById(postRequestId);
        console.log('post', post)
        setPostRequest(post);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching post: ', error);
        setError(error);
        setLoading(false);
      }
    }
    fetchPost();
  }, [postRequestId])
  

  return (
    <View style={styles.screen}>
      {loading && <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <Text>Loading...</Text>
      </View>}
      {error && <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <Text>Error fetching post: {error.message}</Text>
      </View>}
      {!loading && !error && <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.5)} leftLogo={false} navigation={navigation} title="Details" />

        {/* Image Carousel */}
        <View style={{ width: "90%", justifyContent: "center", alignItems: "center" }}>
          <FlatList
            data={postRequest.imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setActiveIndex(Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width));
            }}
            renderItem={({ item }) => <ImageBackground style={styles.imageBackground} imageStyle={styles.image} source={{uri: item}} />}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {/* Three dots */}
        <View style={styles.dotsContainer}>
          {postRequest.imageUrls.map((_, index) => (
            <View key={index} style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]} />
          ))}
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{postRequest.taskType}</Text>
          <Text style={styles.description}>{postRequest.description}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Image style={styles.icon} source={require("../../assets/Images/location.png")} />
          <Text style={styles.infoText}>Location</Text>
          <Text style={styles.infoDetail}>{postRequest.address}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Image style={styles.icon} source={require("../../assets/Images/cal.png")} />
          <Text style={styles.infoText}>Date/Time</Text>
          <Text style={styles.infoDetail}>{getDateTime(postRequest.createdAt)}</Text>
        </View>

        <View style={styles.compensationContainer}>
          <Text style={styles.compensationTitle}>Compensation:</Text>
          <Text style={styles.description}>{postRequest.compensationType === 'Monitarely' ? postRequest.monitarily : postRequest.otherCompensation}</Text>
        </View>

        {/* Buttons */}
        <View style={{ marginTop: RFPercentage(14), width: "100%", justifyContent: "center", alignItems: "center", flexDirection: "row" }}>
          <TouchableOpacity
            style={{
              marginRight: RFPercentage(2),
              backgroundColor: "#F8FAFC",
              width: RFPercentage(21),
              height: RFPercentage(6.2),
              borderRadius: RFPercentage(100),
              borderColor: Colors.primary,
              borderWidth: RFPercentage(0.1),
              justifyContent: "center",
              alignItems: "center",
            }}
            disabled={currentUserId === postRequest.userId}
            onPress={handleStartChat}
          >
            <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.8), fontFamily: "Poppins_500Medium" }}>Message Requester</Text>
          </TouchableOpacity>

          <MyAppButton title={"View My Task"} marginTop={RFPercentage(0)} onPress={() => router.navigate('/Home')} />
        </View>
      </ScrollView>}

      {/* Bottom Tab */}
      <CustomTabBar homeTab={true} navigation={navigation} />
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
  imageBackground: {
    width: screenWidth * 0.9,
    height: RFPercentage(24),
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    marginTop: RFPercentage(2.8),
  },
  image: {
    borderRadius: RFPercentage(2),
  },
  dotsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: RFPercentage(2.5),
    justifyContent: "center",
  },
  dot: {
    height: RFPercentage(1),
    width: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    marginHorizontal: RFPercentage(0.5),
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    backgroundColor: "#D3D3D3",
  },
  detailsContainer: {
    width: "90%",
    marginTop: RFPercentage(2.2),
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    color: Colors.heading,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  description: {
    textAlign: "justify",
    marginTop: RFPercentage(0.8),
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  infoContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: RFPercentage(2),
  },
  icon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
  },
  infoText: {
    top: RFPercentage(-0.2),
    marginLeft: RFPercentage(0.6),
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  infoDetail: {
    top: RFPercentage(-0.2),
    position: "absolute",
    right: 0,
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  compensationContainer: {
    width: "90%",
    marginTop: RFPercentage(2.1),
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  compensationTitle: {
    color: Colors.heading,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
});

export default OfferDetail;
