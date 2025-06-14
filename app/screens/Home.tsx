import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, FlatList, KeyboardAvoidingView, RefreshControl, ActivityIndicator, Platform, Dimensions } from "react-native";
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
import { usePostContext } from "../contexts/PostContext";
import { Icons } from "../config/theme";
import NotFound from "../components/common/NotFound";

type InputFieldType = {
  placeholder: string;
  value: string;
  secure?: boolean;
};

const { width } = Dimensions.get("window");

function Home({ navigation }) {
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const [inputField, SetInputField] = useState<InputFieldType[]>([
    {
      placeholder: "Search",
      value: "",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [allTasks, setAllTasks] = useState([]);

  const {
    taskRecords,
    setTaskRecords,
    lastVisiblePost,
    setLastVisiblePost,
    hasMore,
    setHasMore,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    loadingMore,
    setLoadingMore,
    scrollPosition,
    unsubscribeRef,
  } = usePostContext();

  useEffect(() => {
    fetchRequests(null);
    return () => {
      console.log("unmounting: Home");
    };
  }, [activeFilter]);

  const [activeIndices, setActiveIndices] = useState({});

  const fetchRequests = async (islastVisiblePost = undefined) => {
    setLoading(true);
    try {
      let isLastVisible = lastVisiblePost;
      if (typeof islastVisiblePost !== "undefined") {
        isLastVisible = islastVisiblePost;
      }
      const { tasksArray: newRecords, lastVisible } = await getRequestList(activeFilter, "", isLastVisible); // fetch everything
      setAllTasks(newRecords);
      setTaskRecords(newRecords);
      setLastVisiblePost(lastVisible);
      setHasMore(newRecords?.length > 0);
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
    handleLoadMore();
    setRefreshing(false);
  };

  const handleChange = (text, i) => {
    let tempFields = [...inputField];
    tempFields[i].value = text;
    SetInputField(tempFields);
    setSearchQuery(text);
  };

  const getDisplayTasks = () => {
    let list = allTasks;

    if (activeFilter !== "All") {
      list = list.filter((task) => task.taskType?.toLowerCase() === activeFilter.toLowerCase());
    }

    if (searchQuery.trim() !== "") {
      list = list.filter(
        (task) =>
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.taskType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };
  const displayTasks = getDisplayTasks();

  useEffect(() => {
    // Ensure first image is active for every item
    const initialIndices = {};
    displayTasks.forEach((_, index) => {
      initialIndices[index] = 0;
    });
    setActiveIndices(initialIndices);
  }, [displayTasks]);

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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ScrollView
          onScroll={(e) => (scrollPosition.current = e.nativeEvent.contentOffset.y)}
          style={styles.scrollView}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshRequests} colors={[Colors.primary]} tintColor={Colors.primary} />}
        >
          {/* Nav */}
          <Nav crown={true} marginTop={Platform.OS === "android" ? RFPercentage(4) : RFPercentage(7.9)} profileImage={profileImgUrl} leftLogo={true} navigation={navigation} title="Home" />

          <View style={styles.inputFieldContainer}>
            {inputField?.map((item, i) => (
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
          {loading ? (
            <View style={{ marginTop: RFPercentage(20) }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              <FlatList
                data={displayTasks}
                keyExtractor={(item, index) => index.toString()}
                scrollEventThrottle={16}
                nestedScrollEnabled={true}
                renderItem={({ item, index }) => (
                  <TouchableOpacity onPress={() => navigation.navigate("OfferDetail", { postRequest: item })} activeOpacity={0.8} style={[styles.cartContainer]}>
                    <FlatList
                      data={item.imageUrls}
                      keyExtractor={(_, imgIndex) => imgIndex.toString()}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      scrollEnabled={true}
                      nestedScrollEnabled={true}
                      onScroll={(e) => {
                        const slideIndex = Math.round(e.nativeEvent.contentOffset.x / (width * 0.9));
                        setActiveIndices((prev) => ({ ...prev, [index]: slideIndex }));
                      }}
                      renderItem={({ item: imageUrl }) => (
                        <Image
                          resizeMode="cover"
                          source={{ uri: imageUrl }}
                          style={{
                            width: width * 0.9,
                            height: RFPercentage(35),
                            borderTopLeftRadius: RFPercentage(1),
                            borderTopRightRadius: RFPercentage(1),
                          }}
                        />
                      )}
                    />

                    {item?.imageUrls?.length > 1 && (
                      <View style={styles.dotsContainer}>
                        {item.imageUrls.map((_, imageIndex) => (
                          <View key={imageIndex} style={[styles.dot, imageIndex === activeIndices[index] ? styles.activeDot : styles.inactiveDot]} />
                        ))}
                      </View>
                    )}

                    <View style={styles.infoWrapper}>
                      <View style={styles.cartInfoContainer}>
                        <TouchableOpacity activeOpacity={0.8}>
                          <Image style={styles.userImage} source={item.user.profileImage ? { uri: item.user.profileImage } : require("../../assets/Images/dp.png")} />
                        </TouchableOpacity>

                        <Text style={styles.userName}>{item.user.userName}</Text>
                        <Text style={styles.postDate}>Posted on {getFormatedDate(item.createdAt)}</Text>
                      </View>

                      <View style={styles.taskInfoContainer}>
                        <Text style={styles.taskText}>{item.description?.substr(0, 35) + (item.description?.length > 8 ? "..." : "")}</Text>
                        <View style={styles.compensationWrapper}>
                          <Image tintColor={Colors.darkGrey} style={styles.compansationIcon} source={require("../../assets/Images/compensation.png")} />
                          <Text style={styles.compensationText}>
                            Compensation:{" "}
                            <Text style={styles.compensationAmount}>
                              {item.compensationType === "Monitarely" ? `$${item.monitarily}` : item.otherCompensation?.substr(0, 20) + (item.otherCompensation?.length > 20 ? "..." : "")}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {!loading && displayTasks?.length === 0 && <NotFound title="No Record Found!" />}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

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
    width: width * 0.9,
    height: RFPercentage(42),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(1),
    paddingBottom: RFPercentage(2),
    marginTop: 20,
  },
  cartImageBackground: {
    width: "100%",
    height: RFPercentage(26.5),
    // backgroundColor:'yellow'
  },
  cartImage: {
    borderTopLeftRadius: RFPercentage(2),
    borderTopRightRadius: RFPercentage(2),
  },
  categoryBadge: {
    borderBottomLeftRadius: RFPercentage(1),
    position: "absolute",
    right: RFPercentage(3),
    top: 0,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: RFPercentage(2),
  },
  categoryText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  dotsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "red",
    height: 20,
    top: 10,
  },

  dot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    marginHorizontal: RFPercentage(0.3),
  },

  activeDot: {
    backgroundColor: Colors.primary,
  },

  inactiveDot: {
    backgroundColor: "#D1D5DB",
  },

  cartInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    // top: RFPercentage(-6),
    // backgroundColor:'red',
    marginVertical: RFPercentage(2),
  },
  userImage: {
    width: RFPercentage(5.2),
    height: RFPercentage(5.2),
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
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "flex-start",

    // bottom: RFPercentage(3),
  },
  taskText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    // marginTop: RFPercentage(-1),
    color: Colors.darkGrey2,
  },
  compensationText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey2,
    marginLeft: RFPercentage(1),
  },
  compensationAmount: {
    color: Colors.primary,
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.8),
  },
  bottomSpacing: {
    marginBottom: RFPercentage(6),
  },
  infoWrapper: { width: "100%", justifyContent: "center", alignItems: "center" },
  compensationWrapper: {
    marginTop: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  compansationIcon: { width: RFPercentage(2.3), height: RFPercentage(2.3) },
  notFoundWrapper: { marginTop: RFPercentage(16), justifyContent: "center", alignItems: "center" },
  notFoundImg: { borderRadius: RFPercentage(1), width: RFPercentage(16), height: RFPercentage(16), marginBottom: RFPercentage(2) },
  notFoundText: { color: Colors.darkGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
});

export default Home;
