import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Nav from "../components/common/Nav";
import InputField from "../components/common/AuthInputField";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { getRequestList } from "../services/Post.service";
import { useFocusEffect } from "@react-navigation/native";
import { getFormatedDate } from "../services/Shared.service";
import { usePostContext } from "../contexts/PostContext";
import { Icons } from "../config/theme";
import NotFound from "../components/common/NotFound";
import { useTranslation } from "react-i18next";
import { useExitAppOnBack } from "../utils/appBack";
import { useAppTheme } from "../contexts/themeContext";
import haversine from "haversine";
import { useDispatch, useSelector } from "react-redux";
import { AntDesign } from "@expo/vector-icons";
import { selectLocation } from "../redux/Actions";
import { cachedTranslate } from "../utils/cachedTranslations";
import { useLocation } from "../utils/useLocation";
import { formatCurrency } from "../utils/currencyChange";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { fetchUsersWithTaskStats } from "../services/Review.service";

const { width } = Dimensions.get("window");

function Home({ navigation }) {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const dispatch = useDispatch();
  const { location: currentLocation, getCurrentLocation } = useLocation();
  const { theme } = useAppTheme();
  const selectedLocation = useSelector((state) => state.location);
  useExitAppOnBack();
  const [filterOptions, setFilterOptions] = useState([]);
  const [filterMap, setFilterMap] = useState({});
  const [activeFilter, setActiveFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputField, SetInputField] = useState([
    { placeholder: t("home.txt2"), value: "" },
  ]);

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
    scrollPosition,
  } = usePostContext();

  const [allTasks, setAllTasks] = useState([]);
  const [activeIndices, setActiveIndices] = useState({});
  const unsubscribeRef = useRef(null);

  const isWithin100km = (userLoc, taskLoc) =>
    haversine(userLoc, taskLoc, { unit: "km" }) <= 100;

  const translateTask = async (task) => ({
    ...task,
    description: await cachedTranslate(task.description || ""),
    otherCompensation: await cachedTranslate(task.otherCompensation || ""),
    taskType: await cachedTranslate(task.taskType || ""),
  });

  // Translate filter buttons once
  useFocusEffect(
    useCallback(() => {
      const originalFilters = [
        "All",
        "Cleaning",
        "Moving",
        "Gardening",
        "Gaming",
        "Other",
      ];
      const loadFilters = async () => {
        const tr = await Promise.all(originalFilters.map(cachedTranslate));
        const map = {};
        originalFilters.forEach((o, i) => (map[tr[i]] = o));
        setFilterOptions(tr);
        setFilterMap(map);
        setActiveFilter(tr[0]);
      };
      loadFilters();
    }, [])
  );

  useEffect(() => {
    if (!currentLocation) return;

    let unsubscribe;
    let mounted = true;

    const startListening = async () => {
      setLoading(true);

      const refLoc =
        selectedLocation?.latitude2 && selectedLocation?.longitude2
          ? {
              latitude: selectedLocation.latitude2,
              longitude: selectedLocation.longitude2,
            }
          : currentLocation;

      if (unsubscribeRef.current) unsubscribeRef.current();

      unsubscribe = getRequestList(
        filterMap[activeFilter] || "",
        searchQuery,
        null,
        async ({ tasksArray, lastVisible }) => {
          if (!mounted) return;

          const filtered = tasksArray.filter((task) => {
            const loc = task?.address;
            if (!loc?.latitude || !loc?.longitude) return false;
            return (
              haversine(
                refLoc,
                { latitude: loc.latitude, longitude: loc.longitude },
                { unit: "km" }
              ) <= 100
            );
          });

          const translated = await Promise.all(filtered.map(translateTask));

          // Only update if changed
          setAllTasks((prev) => {
            const prevIds = prev.map((t) => t.id).join(",");
            const newIds = translated.map((t) => t.id).join(",");
            if (prevIds !== newIds) {
              setTaskRecords(translated);
              setLastVisiblePost(lastVisible);
              setHasMore(translated.length > 0);
            }
            return translated;
          });

          setLoading(false);
        },
        (err) => console.log("GET_POSTS_LIST Error:", err)
      );

      unsubscribeRef.current = unsubscribe;
    };

    startListening();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [activeFilter, searchQuery, selectedLocation, filterMap, currentLocation]);

  const refreshRequests = async () => {
    setRefreshing(true);
    // just restart listener
    if (unsubscribeRef.current) unsubscribeRef.current();
    setRefreshing(false);
  };

  const handleChange = (text, i) => {
    const tmp = [...inputField];
    tmp[i].value = text;
    SetInputField(tmp);
    setSearchQuery(text);
  };

  const displayTasks = allTasks.filter((task) => {
    // Category filter
    if (filterMap[activeFilter] !== "All") {
      if (
        task.taskType?.toLowerCase() !== filterMap[activeFilter]?.toLowerCase()
      )
        return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      const descriptionMatch = (task.description || "")
        .toLowerCase()
        .includes(q);
      const userNameMatch = (task.user?.userName || "")
        .toLowerCase()
        .includes(q);
      const taskTypeMatch = (task.taskType || "").toLowerCase().includes(q);

      // 🔥 For "Other" tasks, also check customTaskTitle
      const customTitleMatch =
        task.taskType?.toLowerCase() === "other"
          ? (task.customTaskTitle || "").toLowerCase().includes(q)
          : false;

      return (
        descriptionMatch || userNameMatch || taskTypeMatch || customTitleMatch
      );
    }

    return true;
  });

  useEffect(() => {
    if (displayTasks.length === Object.keys(activeIndices).length) return;
    const idx = {};
    displayTasks.forEach((_, i) => (idx[i] = 0));
    setActiveIndices(idx);
  }, [displayTasks.length]);

  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetchUsersWithTaskStats();
      setUsers(res);
    };
    fetchUsers();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
        translucent
      />
      {/* Nav */}
      <Nav
        crown={true}
        marginTop={RFPercentage(6)}
        profileImage={profileImgUrl}
        leftLogo={true}
        navigation={navigation}
        title={`${t("home.txt1")}`}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          onScroll={(e) =>
            (scrollPosition.current = e.nativeEvent.contentOffset.y)
          }
          style={[styles.scrollView, { backgroundColor: theme.white }]}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={[
            styles.scrollViewContent,
            { backgroundColor: theme.white },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshRequests}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={[styles.screen, { backgroundColor: theme.white }]}>
            <View style={styles.inputFieldContainer}>
              {inputField?.map((item, i) => (
                <View key={i} style={styles.inputFieldWrapper}>
                  <InputField
                    placeholder={item.placeholder}
                    placeholderColor={"#6B7280"}
                    height={
                      Platform.OS === "android"
                        ? RFPercentage(6.4)
                        : RFPercentage(5.5)
                    }
                    backgroundColor={theme.white}
                    borderWidth={RFPercentage(0.1)}
                    borderColor={theme.border}
                    secure={item.secure}
                    borderRadius={RFPercentage(1.2)}
                    color={theme.black}
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
              <Text
                style={[styles.categoriesText, { color: theme.heading }]}
              >{`${t("home.txt3")}`}</Text>
              <View></View>
            </View>

            {/* Filter Buttons */}
            <FlatList
              horizontal
              data={filterOptions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.filterButtonsContainer}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setActiveFilter(item)}>
                  {activeFilter === item ? (
                    <LinearGradient
                      colors={[Colors.primary, "#4557B0"]}
                      style={styles.gradient}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins_500Medium",
                          color: "white",
                          fontSize: RFPercentage(1.7),
                        }}
                      >
                        {item}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.nonGradient,
                        { borderColor: theme.border },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          color: Colors.heading,
                          fontSize: RFPercentage(1.7),
                        }}
                      >
                        {item}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />

            <View
              style={{
                width: "90%",
                alignSelf: "center",
                justifyContent: "space-between",
                flexDirection: "row",
                alignItems: "center",
                marginTop: RFPercentage(3),
              }}
            >
              <Text style={[styles.categoriesText, { color: theme.heading }]}>
                Top Rated
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("TopRatedUsers")}
              >
                <Text
                  style={[
                    styles.categoriesText,
                    {
                      color: theme.heading,
                      fontSize: RFPercentage(1.7),
                      fontFamily: "Poppins_600SemiBold",
                    },
                  ]}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={users}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.filterButtonsContainer}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate("TopRatedUserProfile");
                    }}
                    style={[
                      {
                        width: RFPercentage(18),
                        height: RFPercentage(21),
                        borderWidth: 1,
                        borderRadius: RFPercentage(1.8),
                        alignItems: "center",
                        marginLeft: RFPercentage(1.2),
                      },
                      {
                        backgroundColor: theme.white,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={{ width: "90%", alignSelf: "center" }}>
                      <View
                        style={{
                          alignSelf: "center",
                          marginTop: RFPercentage(2),
                        }}
                      >
                        <Image
                          source={Icons.dp}
                          resizeMode="contain"
                          style={{
                            width: RFPercentage(5.8),
                            height: RFPercentage(5.8),
                            borderRadius: RFPercentage(100),
                            alignSelf: "center",
                          }}
                        />
                        <View
                          style={{
                            width: RFPercentage(5.5),
                            height: RFPercentage(1.6),
                            borderRadius: RFPercentage(100),
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#45B356",
                            alignSelf: "center",
                            marginTop: RFPercentage(0.8),
                          }}
                        >
                          <Text
                            style={{
                              color: Colors.white,
                              fontSize: RFPercentage(0.7),
                              fontFamily: "Poppins_500Medium",
                            }}
                          >
                            Top Rated
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          {
                            textAlign: "center",
                            fontFamily: "Poppins_600SemiBold",
                            fontSize: RFPercentage(1.6),
                            marginTop: RFPercentage(0.6),
                          },
                          { color: theme.darkGrey },
                        ]}
                      >
                        Sana Asghar
                      </Text>
                      <View
                        style={[
                          {
                            width: "100%",
                            height: RFPercentage(0.1),
                            marginTop: RFPercentage(1.2),
                          },
                          { backgroundColor: theme.border },
                        ]}
                      ></View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: RFPercentage(1),
                          width: "95%",
                          alignSelf: "center",
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {/* <MaterialIcons
                            name="pending-actions"
                            size={RFPercentage(1.5)}
                            color={theme.primary}
                          /> */}
                          <Text
                            style={[
                              {
                                fontFamily: "Poppins_500Medium",
                                fontSize: RFPercentage(1.2),
                                marginLeft: RFPercentage(0.5),
                              },
                              { color: theme.primary },
                            ]}
                          >
                            Active
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={[
                              {
                                fontFamily: "Poppins_600SemiBold",
                                fontSize: RFPercentage(1.4),
                              },
                              { color: theme.primary },
                            ]}
                          >
                            3
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: RFPercentage(0.5),
                          width: "95%",
                          alignSelf: "center",
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {/* <FontAwesome5
                            name="tasks"
                            size={RFPercentage(1.1)}
                            color={theme.darkGrey}
                          /> */}
                          <Text
                            style={[
                              {
                                fontFamily: "Poppins_500Medium",
                                fontSize: RFPercentage(1.2),
                                marginLeft: RFPercentage(0.5),
                              },
                              { color: theme.darkGrey },
                            ]}
                          >
                            Completed
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={[
                              {
                                fontFamily: "Poppins_600SemiBold",
                                fontSize: RFPercentage(1.4),
                              },
                              { color: theme.darkGrey },
                            ]}
                          >
                            22
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <View
              style={[
                styles.categoriesContainer,
                styles.recentRequestsContainer,
              ]}
            >
              <Text
                style={[styles.categoriesText, { color: theme.heading }]}
              >{`${t("home.txt9")}`}</Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("Location", { home: true })
                  }
                >
                  <Text
                    style={[
                      styles.categoriesText,
                      {
                        color: theme.primary,
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: RFPercentage(1.8),
                      },
                    ]}
                  >
                    {selectedLocation.name2
                      ? selectedLocation.name2.length > 15
                        ? `${selectedLocation.name2.slice(0, 15)}...`
                        : selectedLocation.name2
                      : `${t("location.by")}`}
                  </Text>
                </TouchableOpacity>

                {/* Show cross icon only if location is selected */}
                {selectedLocation.name2 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      marginLeft: RFPercentage(1),
                      bottom: RFPercentage(0.3),
                    }}
                    onPress={async () => {
                      dispatch(selectLocation(null)); // clears redux
                      await getCurrentLocation(); // refresh GPS
                    }}
                  >
                    <AntDesign
                      name="closecircle"
                      size={RFPercentage(2.5)}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Carts */}
            {loading ? (
              <View style={{ marginTop: RFPercentage(18) }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: RFPercentage(1.8),
                    fontFamily: "Poppins_500Medium",
                    marginTop: RFPercentage(0.5),
                  }}
                >
                  {t("home.txt12")}
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={displayTasks}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEventThrottle={16}
                  nestedScrollEnabled={true}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("OfferDetail", {
                          postRequest: item,
                        })
                      }
                      activeOpacity={0.8}
                      style={[
                        styles.cartContainer,
                        { borderColor: theme.border },
                      ]}
                    >
                      <FlatList
                        data={item.imageUrls}
                        keyExtractor={(_, imgIndex) => imgIndex.toString()}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        onScroll={(e) => {
                          const slideIndex = Math.round(
                            e.nativeEvent.contentOffset.x / (width * 0.9)
                          );
                          setActiveIndices((prev) => ({
                            ...prev,
                            [index]: slideIndex,
                          }));
                        }}
                        renderItem={({ item: imageUrl }) => (
                          <Image
                            resizeMode="cover"
                            source={{ uri: imageUrl }}
                            style={styles.img}
                          />
                        )}
                      />

                      {/* {item?.imageUrls?.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {item.imageUrls.map((_, imageIndex) => (
                        <View
                          key={imageIndex}
                          style={[
                            styles.dot,
                            {
                              backgroundColor:
                                imageIndex === activeIndices[index]
                                  ? theme.primary
                                  : theme.stroke,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )} */}

                      <View style={styles.infoWrapper}>
                        <View style={styles.cartInfoContainer}>
                          <View>
                            <Image
                              style={styles.userImage}
                              source={
                                item?.user?.profileImage
                                  ? { uri: item?.user?.profileImage }
                                  : Icons.dp
                              }
                            />
                          </View>
                          <Text
                            style={[styles.userName, { color: theme.heading }]}
                          >
                            {item?.user?.userName?.length > 12
                              ? `${item?.user?.userName.substring(0, 12)}...`
                              : item?.user?.userName}
                          </Text>
                          <Text
                            style={[styles.postDate, { color: theme.darkGrey }]}
                          >
                            {t("myRequests.txt4")}{" "}
                            <Text style={{ fontFamily: "Poppins_400Regular" }}>
                              {" "}
                              {getFormatedDate(item.createdAt)}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.taskInfoContainer}>
                          <Text
                            style={[
                              styles.taskText,
                              { color: theme.darkGrey2 },
                            ]}
                          >
                            {item.description?.substr(0, 90) +
                              (item.description?.length > 90 ? "..." : "")}
                          </Text>
                          <View style={styles.compensationWrapper}>
                            <Image
                              tintColor={theme.darkGrey}
                              style={styles.compansationIcon}
                              source={require("../../assets/Images/compensation.png")}
                            />
                            <Text
                              style={[
                                styles.compensationText,
                                { color: theme.darkGrey2 },
                              ]}
                            >
                              {`${t("home.txt10")}`}:{" "}
                              <Text
                                style={[
                                  styles.compensationAmount,
                                  { color: theme.primary },
                                ]}
                              >
                                {item.compensationType === "Monitarely"
                                  ? `${formatCurrency(item.monitarily)}`
                                  : item.otherCompensation?.substr(0, 20) +
                                    (item.otherCompensation?.length > 20
                                      ? "..."
                                      : "")}
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

            {!loading && displayTasks?.length === 0 && (
              <View style={{ bottom: RFPercentage(10) }}>
                <NotFound title={`${t("home.txt11")}`} />
              </View>
            )}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </>
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
    paddingBottom: RFPercentage(9),
  },
  inputFieldContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  inputFieldWrapper: {
    marginTop: RFPercentage(2),
  },
  categoriesContainer: {
    width: "90%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginTop: RFPercentage(2),
    // backgroundColor:'red'
  },
  categoriesText: {
    color: Colors.heading,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
  },
  filterButtonsContainer: {
    marginTop: RFPercentage(1.4),
    paddingHorizontal: RFPercentage(1.5),
    // backgroundColor: "red",
  },
  filterButton: {
    // width: RFPercentage(11.5),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    // marginLeft: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
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
    paddingHorizontal: RFPercentage(2),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RFPercentage(1),
    height: RFPercentage(5),
    marginHorizontal: RFPercentage(1),
  },
  nonGradient: {
    height: RFPercentage(5),
    paddingHorizontal: RFPercentage(2),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "lightgrey",
    borderRadius: RFPercentage(1),
    marginHorizontal: RFPercentage(1),
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  filterButtonTextInactive: {
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  recentRequestsContainer: {
    marginTop: RFPercentage(3.5),
  },
  cartContainer: {
    width: width * 0.9,
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(1),
    paddingBottom: RFPercentage(2),
    marginTop: 20,
  },
  img: {
    width: width * 0.895,
    height: RFPercentage(25),
    borderTopLeftRadius: RFPercentage(1),
    borderTopRightRadius: RFPercentage(1),
  },
  cartImageBackground: {
    width: "100%",
    height: RFPercentage(28.5),
    backgroundColor: "yellow",
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
    width: RFPercentage(6.2),
    height: RFPercentage(6.2),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(100),
  },
  userName: {
    marginLeft: RFPercentage(1.4),
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  postDate: {
    fontSize: RFPercentage(1.5),
    position: "absolute",
    right: 0,
    fontFamily: "Poppins_600SemiBold",
  },
  taskInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  taskText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    color: Colors.darkGrey2,
    width: "100%",
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
  infoWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  compensationWrapper: {
    marginTop: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  compansationIcon: { width: RFPercentage(2.3), height: RFPercentage(2.3) },
  notFoundWrapper: {
    marginTop: RFPercentage(16),
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundImg: {
    borderRadius: RFPercentage(1),
    width: RFPercentage(16),
    height: RFPercentage(16),
    marginBottom: RFPercentage(2),
  },
  notFoundText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
});

export default Home;
