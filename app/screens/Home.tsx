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
import {
  formatCurrency,
  getCurrencySymbolFromLocation,
  extractNumericValue,
  getCurrencyInfo,
  convertCurrency, // Add this import
} from "../utils/currencyChange";
import { Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import { updateUserLocation } from "../services/User.service";

const { width } = Dimensions.get("window");

function Home({ navigation }) {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const dispatch = useDispatch();
  const { location: currentLocation, getCurrentLocation } = useLocation();
  const { theme } = useAppTheme();
  const selectedLocation = useSelector((state: any) => state.location);
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

  const updateUserLocationInDB = async (location) => {
    try {
      if (!location || !location.latitude || !location.longitude) return;

      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      await updateUserLocation(locationData);
      console.log("User location updated successfully");
    } catch (error) {
      console.log("Error updating user location:", error);
    }
  };

  // Update location when currentLocation changes
  useEffect(() => {
    if (currentLocation && user?.userId) {
      updateUserLocationInDB(currentLocation);
    }
  }, [currentLocation, user?.userId]);

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

      // For "Other" tasks, also check customTaskTitle
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

  const getConvertedCompensation = (item) => {
    if (item.compensationType !== "Monitarely") return null;
    try {
      const originalAmount = parseFloat(item.monitarily) || 0;
      if (!currentLocation) {
        return item.currencyInfo
          ? `${item.currencyInfo.symbol}${originalAmount.toLocaleString()}`
          : `$${originalAmount.toLocaleString()}`;
      }
      if (!item.currencyInfo) {
        return formatCurrency(originalAmount, currentLocation);
      }
      const targetCurrency = getCurrencyInfo(currentLocation).code;
      const convertedAmount = convertCurrency(
        originalAmount,
        item.currencyInfo.code,
        targetCurrency
      );
      return formatCurrency(convertedAmount, currentLocation);
    } catch (error) {
      console.log("Currency conversion error:", error);
      return item.currencyInfo
        ? `${item.currencyInfo.symbol}${parseFloat(item.monitarily) || 0}`
        : `$${parseFloat(item.monitarily) || 0}`;
    }
  };

  return (
    <View style={{ backgroundColor: theme.white, flex: 1 }}>
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
            {users?.length > 0 ? (
              <>
                <View
                  style={{
                    width: "90%",
                    alignSelf: "center",
                    justifyContent: "space-between",
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: RFPercentage(3),
                    marginBottom: RFPercentage(1),
                  }}
                >
                  <Text
                    style={[styles.categoriesText, { color: theme.heading }]}
                  >
                    {t("profileRank.txt1")}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("TopRatedUsers")}
                  >
                    <Text
                      style={[
                        styles.categoriesText,
                        {
                          color: theme.primary,
                          fontSize: RFPercentage(1.7),
                          fontFamily: "Poppins_600SemiBold",
                        },
                      ]}
                    >
                      {t("profileRank.txt2")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: "100%", alignSelf: "flex-start" }}>
                  <FlatList
                    horizontal
                    data={users}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.topRatedContainer}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                      return (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            navigation.navigate("TopRatedUserProfile", {
                              user: item,
                            });
                          }}
                          style={[
                            styles.topRatedCard,
                            {
                              backgroundColor: theme.white,
                              borderColor: theme.border,
                              shadowColor:
                                theme.mode === "dark"
                                  ? "#000"
                                  : "rgba(0,0,0,0.1)",
                            },
                          ]}
                        >
                          {/* Premium Badges */}
                          {item.category === "Beginner" && (
                            <View style={[styles.badge, styles.beginnerBadge]}>
                              <Ionicons
                                name="leaf"
                                size={RFPercentage(1.2)}
                                color="#4CAF50"
                              />
                              <Text style={styles.beginnerText}>
                                {t("profileRank.txt3")}
                              </Text>
                            </View>
                          )}

                          {item.category === "Rising Talent" && (
                            <View style={[styles.badge, styles.risingBadge]}>
                              <Ionicons
                                name="trending-up"
                                size={RFPercentage(1.2)}
                                color="#FF9800"
                              />
                              <Text style={styles.risingText}>
                                {t("profileRank.txt4")}
                              </Text>
                            </View>
                          )}

                          {item.category === "Top Rated" && (
                            <View style={[styles.badge, styles.topRatedBadge]}>
                              <Ionicons
                                name="trophy"
                                size={RFPercentage(1.2)}
                                color="#FFD700"
                              />
                              <Text style={styles.topRatedText}>
                                {t("profileRank.txt5")}
                              </Text>
                            </View>
                          )}

                          {/* User Avatar */}
                          <View style={styles.avatarContainer}>
                            <Image
                              source={
                                item?.profileImage
                                  ? { uri: item.profileImage }
                                  : Icons.dp
                              }
                              resizeMode="cover"
                              style={[styles.avatar]}
                            />
                          </View>

                          {/* User Name */}
                          <Text
                            style={[styles.userName2, { color: theme.heading }]}
                          >
                            {item?.name?.length > 10
                              ? `${item.name.substring(0, 10)}...`
                              : item.name || "User"}
                          </Text>

                          {/* User Title */}
                          <Text
                            style={[styles.userTitle, { color: theme.primary }]}
                          >
                            {item.category === "Top Rated"
                              ? `${t("profileRank.txt5")}`
                              : item.category === "Rising Talent"
                              ? `${t("profileRank.txt4")}`
                              : `${t("profileRank.txt3")}`}
                          </Text>

                          {/* Stats Container */}
                          <View style={styles.statsContainer}>
                            <View style={styles.statColumn}>
                              <View style={styles.statItem}>
                                <View style={styles.statInfo}>
                                  <Text
                                    style={[
                                      styles.statValue,
                                      { color: theme.heading },
                                    ]}
                                  >
                                    {item.activeCount || 0}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.statLabel,
                                      { color: theme.darkGrey },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {t("profileRank.txt6")}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.statDivider,
                                { borderColor: theme.border },
                              ]}
                            />

                            <View style={styles.statColumn}>
                              <View style={styles.statItem}>
                                <View style={styles.statInfo}>
                                  <Text
                                    style={[
                                      styles.statValue,
                                      { color: theme.heading },
                                    ]}
                                  >
                                    {item.completedCount || 0}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.statLabel,
                                      { color: theme.darkGrey },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {t("profileRank.txt7")}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* View Profile Button */}
                          <TouchableOpacity
                            style={[
                              styles.viewProfileButton,
                              {
                                backgroundColor: Colors.primary,
                              },
                            ]}
                            activeOpacity={0.8}
                            onPress={() => {
                              navigation.navigate("TopRatedUserProfile", {
                                user: item,
                              });
                            }}
                          >
                            <Text style={styles.viewProfileText}>
                              {t("profileRank.txt8")}
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={RFPercentage(1.6)}
                              color={Colors.white}
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("TopRatedUsers")}
                style={styles.exploreContainer}
              >
                <View style={styles.exploreContent}>
                  <Text style={[styles.exploreText, { color: Colors.primary }]}>
                   {`${t("profileRank.txt45")}`}
                  </Text>
                  <FontAwesome6
                    name="arrow-right"
                    size={RFPercentage(1.8)}
                    color={Colors.primary}
                  />
                </View>
              </TouchableOpacity>
            )}

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
                                  ? getConvertedCompensation(item)
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
    paddingBottom: RFPercentage(13),
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
    marginTop: RFPercentage(2.5),
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

  topRatedContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.5),
  },
  topRatedCard: {
    width: RFPercentage(22),
    height: RFPercentage(29.5),
    borderRadius: RFPercentage(2.1),
    alignItems: "center",
    marginHorizontal: RFPercentage(0.7),
    padding: RFPercentage(2),
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },

  avatarContainer: {
    position: "relative",
    marginBottom: RFPercentage(1),
    marginTop: RFPercentage(1),
  },
  avatar: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    borderWidth: 2,
    borderColor: Colors.primary + "30",
  },
  onlineStatus: {
    position: "absolute",
    bottom: RFPercentage(0.5),
    right: RFPercentage(0.5),
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(0.75),
    backgroundColor: "#45B356",
    borderWidth: 2,
  },
  userName2: {
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.7),
    marginBottom: RFPercentage(0.3),
  },
  userTitle: {
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.3),
    marginBottom: RFPercentage(1.5),
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(0.5),
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statIcon: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(0.5),
  },
  statInfo: {
    alignItems: "center",
  },
  statValue: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(0.2),
  },
  statLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: RFPercentage(4),
    marginHorizontal: RFPercentage(1),
  },
  successRateContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(1),
    marginBottom: RFPercentage(1.5),
  },
  successRateText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    width: "100%",
  },
  viewProfileText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
    marginRight: RFPercentage(0.5),
  },
  risingTalentBadge: {
    position: "absolute",
    top: RFPercentage(1),
    right: RFPercentage(1),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.15)", // Orange background
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.3)",
  },
  risingTalentText: {
    color: "#FF6B35",
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(1),
    marginLeft: RFPercentage(0.5),
  },

  // Beginner Badge
  beginnerBadge: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#4CAF50",
    position: "absolute",
    right: 8,
    top: 8,
  },
  beginnerText: {
    color: "#2E7D32",
    fontSize: RFPercentage(0.8),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
  },

  // Rising Talent Badge
  risingBadge: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FF9800",
    position: "absolute",
    right: 8,
    top: 8,
  },
  risingText: {
    color: "#FF9800",
    fontSize: RFPercentage(0.8),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
  },

  // Top Rated Badge
  topRatedBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FFD700",
    position: "absolute",
    right: 8,
    top: 8,
  },
  topRatedText: {
    color: "#cdb114ff",
    fontSize: RFPercentage(0.8),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
  },

  // Premium Badge (existing)
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDE7",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    borderColor: "#FFD700",
    marginLeft: RFPercentage(0.5),
  },
  premiumText: {
    color: "#F57F17",
    fontSize: RFPercentage(1),
    fontWeight: "bold",
    marginLeft: RFPercentage(0.3),
  },
  exploreContainer: {
    marginTop: RFPercentage(2),
    width: "90%",
    alignSelf: "flex-start",
    marginLeft: RFPercentage(2.2),
  },
  exploreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderColor: Colors.primary + "30",
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.primary + "08",
  },
  exploreText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.6),
    marginRight: RFPercentage(1),
  },
});

export default Home;
