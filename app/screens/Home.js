import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, FlatList, Dimensions, RefreshControl } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import InputField from "../components/common/AuthInputField";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { getRequestList } from "../services/Post.service";
import { useFocusEffect } from "@react-navigation/native";
import { getFormatedDate } from "../services/Shared.service";

function Home({ navigation }) {
  const user = useUser();
  const profileImgUrl = user?.profileImage || "";
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Search",
      value: "",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskRecords, setTaskRecords] = useState([]);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const carts = [
    {
      images: [require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png")],
      category: "Gardening",
      user: "Emma Stone",
      date: "Posted on: 07-08-2024",
      task: "Help in Gardening...",
      compensation: "25$",
      dp: require("../../assets/Images/dp.png"),
    },
    {
      images: [require("../../assets/Images/cover.png"), require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png")],
      category: "Cleaning",
      user: "John Doe",
      date: "Posted on: 08-08-2024",
      task: "Help with Lawn...",
      compensation: "30$",
      dp: require("../../assets/Images/jhon.png"),
    },
  ];

  const [activeIndices, setActiveIndices] = useState(carts.map(() => 0));

  useFocusEffect(
    useCallback(() => {
      fetchRequests(null);
      
      return () => {
        console.log("unmounting: Home");
      };
    }, [activeFilter]),
  );

  const fetchRequests = async (islastVisiblePost = undefined) => {
    setLoading(true);
    // setTaskRecords([]);
    // setLastVisiblePost(null);
    try {
      let isLastVisible = lastVisiblePost
      if (typeof islastVisiblePost !== 'undefined') {
        isLastVisible = islastVisiblePost
      }
      const { tasksArray: newRecords, lastVisible } = await getRequestList(activeFilter, searchQuery, isLastVisible);
      setTaskRecords(newRecords);
      setLastVisiblePost(lastVisible);
      setHasMore(newRecords.length > 0);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const { tasksArray: newRecords, lastVisible } = await getRequestList(activeFilter, searchQuery, lastVisiblePost);
      setTaskRecords([...taskRecords, ...newRecords]);
      setLastVisiblePost(lastVisible);
      setHasMore(newRecords.length > 0);
    } catch (error) {
      console.error("Error loading more posts:", error);
    }
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMorePosts();
    }
  };

  const refreshRequests = async () => {
    setRefreshing(true);
    await fetchRequests(null);
    setRefreshing(false);
  };

  const handleChange = (text, i) => {
    let tempFields = [...inputField];
    tempFields[i].value = text;
    SetInputField(tempFields);
    setSearchQuery(text);
  };

  const filteredCarts = carts.filter((cart) => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return cart.category.toLowerCase().includes(lowercasedQuery) || cart.user.toLowerCase().includes(lowercasedQuery) || cart.task.toLowerCase().includes(lowercasedQuery);
  });

  const handleScrollEnd = (event, cartIndex) => {
    const index = Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    const newActiveIndices = [...activeIndices];
    newActiveIndices[cartIndex] = index;
    setActiveIndices(newActiveIndices);
  };

  const handleCommonSearch = () => {
    if (searchQuery === '') {
      setHasMore(true);
    }
    fetchRequests(null);
  }

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
        <Nav crown={true} marginTop={RFPercentage(7.5)} profileImage={profileImgUrl} leftLogo={true} navigation={navigation} title="Home" />

        <View style={styles.inputFieldContainer}>
          {inputField.map((item, i) => (
            <View key={i} style={styles.inputFieldWrapper}>
              <InputField
                placeholder={item.placeholder}
                placeholderColor={"#6B7280"}
                height={RFPercentage(6.4)}
                backgroundColor={Colors.white}
                borderWidth={RFPercentage(0.1)}
                borderColor={"#E5E7EB"}
                secure={item.secure}
                borderRadius={RFPercentage(1.2)}
                color={Colors.black}
                fontSize={RFPercentage(1.7)}
                fontFamily={"Poppins_400Regular"}
                handleFeild={(text) => handleChange(text, i)}
                value={item.value}
                width={"97%"}
                onSubmitEditing={()=>{
                  handleCommonSearch();
                }}
              />
            </View>
          ))}
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesText}>Categories</Text>
        </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtonsContainer}>
          {["All", "Cleaning", "Moving", "Gardening", "Others"].map((title, index) => (
            <FilterButton key={title} title={title} isActive={activeFilter === title} isFirst={index === 0} />
          ))}
        </ScrollView>

        <View style={[styles.categoriesContainer, styles.recentRequestsContainer]}>
          <Text style={styles.categoriesText}>Recent Requests</Text>
        </View>

        {/* Carts */}
        {taskRecords.map((cart, cartIndex) => (
          <View activeOpacity={0.8} key={cartIndex} style={[styles.cartContainer, { marginTop: cartIndex === 1 ? RFPercentage(3) : RFPercentage(2) }]}>
            <FlatList
              data={cart.imageUrls}
              horizontal
              pagingEnabled
              onEndReached={handleLoadMore}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => handleScrollEnd(event, cartIndex)}
              renderItem={({ item }) => (
                <ImageBackground style={styles.cartImageBackground} imageStyle={styles.cartImage} source={{uri: item}}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{cart.category}</Text>
                  </View>
                </ImageBackground>
              )}
              keyExtractor={(item, index) => index.toString()}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshRequests} colors={[Colors.primary]} tintColor={Colors.primary} />}
            />

            <View style={styles.dotsContainer}>
              {cart.imageUrls.map((_, imageIndex) => (
                <View key={imageIndex} style={[styles.dot, imageIndex === activeIndices[cartIndex] ? styles.activeDot : styles.inactiveDot]} />
              ))}
            </View>

            {/* Info */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("OfferDetail", { postRequest: cart })} style={styles.cartInfoContainer}>
              <TouchableOpacity activeOpacity={0.8}>
                <Image style={styles.userImage} source={{uri: cart.user.profileImage}} />
              </TouchableOpacity>

              <Text style={styles.userName}>{cart.user.userName}</Text>
              <Text style={styles.postDate}>Posted on {getFormatedDate(cart.createdAt)}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("OfferDetail", { postRequest: cart })} style={styles.taskInfoContainer}>
              <Text style={styles.taskText}>{cart.description?.substr(0, 15) + (cart.description?.length > 15 ? '...' : '')}</Text>
              <Text style={styles.compensationText}>
                Compensation: <Text style={styles.compensationAmount}>{cart.compensationType === 'Monitarely' ? cart.monitarily : cart.otherCompensation?.substr(0, 20) + (cart.otherCompensation?.length > 20 ? '...' : '')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {(loading || loadingMore) && <View>
          <Text>Loading...</Text>
        </View>}

        {!loading && taskRecords.length === 0 && <View>
          <Text>No record found!</Text>
        </View>}
        <View style={styles.bottomSpacing} />
      </ScrollView>

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
  inputFieldContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  inputFieldWrapper: {
    marginTop: RFPercentage(3.6),
  },
  categoriesContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    marginTop: RFPercentage(2),
  },
  categoriesText: {
    color: Colors.heading,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
  },
  filterButtonsContainer: {
    paddingHorizontal: RFPercentage(2.2),
    marginTop: RFPercentage(1.4),
  },
  filterButton: {
    width: RFPercentage(11.5),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(2),
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
  recentRequestsContainer: {
    marginTop: RFPercentage(2.5),
  },
  cartContainer: {
    width: "90%",
    height: RFPercentage(40),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "hidden",
  },
  cartImageBackground: {
    width: RFPercentage(45.3),
    height: RFPercentage(24.5),
  },
  cartImage: {
    borderTopLeftRadius: RFPercentage(2),
    borderTopRightRadius: RFPercentage(2),
  },
  categoryBadge: {
    borderBottomLeftRadius: RFPercentage(1),
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: RFPercentage(0.8),
  },
  categoryText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  dotsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    top: RFPercentage(-1),
  },
  dot: {
    height: RFPercentage(0.9),
    width: RFPercentage(0.9),
    borderRadius: RFPercentage(0.5),
    margin: RFPercentage(0.5),
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    backgroundColor: "#D3D3D3",
  },
  cartInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    marginTop: RFPercentage(1),
    top: RFPercentage(-0.5),
  },
  userImage: {
    width: RFPercentage(4.9),
    height: RFPercentage(4.9),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(100),
  },
  userName: {
    marginLeft: RFPercentage(1.4),
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  postDate: {
    fontSize: RFPercentage(1.6),
    position: "absolute",
    right: 0,
    fontFamily: "Poppins_400Regular",
  },
  taskInfoContainer: {
    bottom: RFPercentage(1.8),
    marginTop: RFPercentage(3),
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
  },
  taskText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  compensationText: {
    fontSize: RFPercentage(1.8),
    position: "absolute",
    right: 0,
    fontFamily: "Poppins_500Medium",
  },
  compensationAmount: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  bottomSpacing: {
    marginBottom: RFPercentage(6),
  },
});

export default Home;
