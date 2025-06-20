import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, FlatList, Dimensions, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getAuth } from "firebase/auth";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";

// config
import Colors from "../config/Colors";
import MyAppButton from "../components/common/MyAppButton";
import { getDateTime } from "../services/Shared.service";
import { createNewChat } from "../services/Chat.service";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { translateText } from "../translation/googleTranslation";

const screenWidth = Dimensions.get("window").width;

function OfferDetail({ navigation, route }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;
  const postRequest = route.params?.postRequest;

  const [isExpanded, setIsExpanded] = useState(false);

  const [translatedOffer, setTranslatedOffer] = useState({
    taskType: "",
    description: "",
    otherCompensation: "",
  });

  useEffect(() => {
    const translateOfferData = async () => {
      const [translatedTaskType, translatedDescription, translatedCompensation] = await Promise.all([
        translateText(postRequest.taskType || ""),
        translateText(postRequest.description || ""),
        translateText(postRequest.otherCompensation || ""),
      ]);

      setTranslatedOffer({
        taskType: translatedTaskType,
        description: translatedDescription,
        otherCompensation: translatedCompensation,
      });
    };

    if (postRequest) {
      translateOfferData();
    }
  }, [postRequest]);

  const handleStartChat = async () => {
    const chatId = await createNewChat(currentUserId, postRequest.userId);
    navigation.navigate("Chat", {
      chatId: chatId,
      senderId: currentUserId,
      senderName: currentUser.userData.userName,
      receiver: postRequest.user,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`${t("details.txt1")}`} />

        {/* Image Carousel */}
        <View style={styles.carousal}>
          <FlatList
            data={postRequest.imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setActiveIndex(Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width));
            }}
            renderItem={({ item }) => <ImageBackground style={styles.imageBackground} imageStyle={styles.image} source={{ uri: item }} />}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {postRequest?.imageUrls?.length > 1 && postRequest.imageUrls.map((_, index) => <View key={index} style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]} />)}
        </View>

        {/* Translated Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{translatedOffer.taskType}</Text>
          <Text style={styles.description}>
            {isExpanded || translatedOffer.description.length <= 120 ? translatedOffer.description : translatedOffer.description.slice(0, 120) + "... "}
            {translatedOffer.description.length > 120 && (
              <Text onPress={() => setIsExpanded(!isExpanded)} style={styles.readMoreText}>
                {isExpanded ? `${t("details.txt2")}` : `${t("details.txt3")}`}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Image style={styles.icon} source={Icons.location} />
          <Text style={styles.infoText}>{`${t("details.txt4")}`}</Text>
          <Text style={styles.infoDetail}>{postRequest.address}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Image style={styles.icon} source={Icons.cal} />
          <Text style={styles.infoText}>{`${t("details.txt5")}`}</Text>
          <Text style={styles.infoDetail}>{getDateTime(postRequest.createdAt)}</Text>
        </View>

        <View style={styles.compensationContainer}>
          <Text style={styles.compensationTitle}>{`${t("details.txt6")}`}:</Text>
          <Text style={styles.description}>{postRequest.compensationType === "Monitarely" ? `${postRequest.monitarily}$` : translatedOffer.otherCompensation}</Text>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.chatButton} disabled={currentUserId === postRequest.userId} onPress={handleStartChat}>
          <Text style={styles.text}>{`${t("details.txt7")}`}</Text>
        </TouchableOpacity>

        <MyAppButton title={`${t("details.txt8")}`} marginTop={RFPercentage(0)} onPress={() => navigation.navigate("MyRequests")} />
      </View>
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
  carousal: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(0.5),
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
  readMoreText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
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
  chatButton: {
    marginRight: RFPercentage(2),
    backgroundColor: "#F8FAFC",
    width: RFPercentage(21),
    height: RFPercentage(6.2),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  buttonWrapper: {
    position: "absolute",
    bottom: RFPercentage(15),
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
});

export default OfferDetail;
