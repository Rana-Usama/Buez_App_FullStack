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
  getCurrencyInfo,
  convertCurrency,
  getLiveExchangeRates, // Add this import
} from "../utils/currencyChange";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import { updateUserLocation } from "../services/User.service";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
  FontAwesome6,
} from "@expo/vector-icons";
import { BlurView } from "expo-blur";

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
    } catch (error) {
      console.log("Error updating user location:", error);
    }
  };

  // Update location when currentLocation changes
  useEffect(() => {
    if (currentLocation && user?.userId) {
      updateUserLocationInDB(currentLocation);
    }
    // getLiveExchangeRates()
  }, [currentLocation, user?.userId]);

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

  // Tasks By Location ----------------
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

  // Tasks To Dispaly
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
    if (displayTasks?.length === Object.keys(activeIndices).length) return;
    const idx = {};
    displayTasks.forEach((_, i) => (idx[i] = 0));
    setActiveIndices(idx);
  }, [displayTasks?.length]);

  // Top Rated Users
  const [users, setUsers] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchUsers = async () => {
        const res = await fetchUsersWithTaskStats();
        setUsers(res);
      };
      fetchUsers();
      return () => {
        setUsers([]);
      };
    }, [])
  );

  // Compensation Conversion - Only use currentLocation
  const getConvertedCompensation = (item: any) => {
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

  const users2 = [
    {
      id: 1,
      name: "Alex Johnson",
      username: "alexj",
      profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
      category: "Top Rated",
      activeCount: 12,
      completedCount: 47,
      isOnline: true,
      rating: 4.9,
      description: "Expert in home services with 5 years experience",
    },
    {
      id: 2,
      name: "Sarah Miller",
      username: "sarahm",
      profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
      category: "Rising Talent",
      activeCount: 8,
      completedCount: 23,
      isOnline: false,
      rating: 4.7,
      description: "Quick learner with excellent customer service",
    },
    {
      id: 3,
      name: "David Chen",
      username: "davidc",
      profileImage: "https://randomuser.me/api/portraits/men/67.jpg",
      category: "Beginner",
      activeCount: 3,
      completedCount: 5,
      isOnline: true,
      rating: 4.5,
      description: "New but highly motivated professional",
    },
    {
      id: 4,
      name: "Emily Wilson",
      username: "emilyw",
      profileImage: "https://randomuser.me/api/portraits/women/68.jpg",
      category: "Top Rated",
      activeCount: 15,
      completedCount: 89,
      isOnline: true,
      rating: 4.9,
      description: "Top performer with 100+ completed tasks",
    },
    {
      id: 5,
      name: "Michael Brown",
      username: "michaelb",
      profileImage: "https://randomuser.me/api/portraits/men/75.jpg",
      category: "Rising Talent",
      activeCount: 6,
      completedCount: 18,
      isOnline: false,
      rating: 4.6,
      description: "Specializes in gardening and outdoor services",
    },
    {
      id: 6,
      name: "Jessica Lee",
      username: "jessical",
      profileImage: "https://randomuser.me/api/portraits/women/26.jpg",
      category: "Beginner",
      activeCount: 2,
      completedCount: 4,
      isOnline: true,
      rating: 4.4,
      description: "Dedicated and reliable service provider",
    },
    {
      id: 7,
      name: "Daniel Martinez",
      username: "danielm",
      profileImage: "https://randomuser.me/api/portraits/men/81.jpg",
      category: "Top Rated",
      activeCount: 10,
      completedCount: 65,
      isOnline: false,
      rating: 4.8,
      description: "Professional mover with specialized equipment",
    },
    {
      id: 8,
      name: "Sophia Garcia",
      username: "sophiag",
      profileImage: "https://randomuser.me/api/portraits/women/33.jpg",
      category: "Rising Talent",
      activeCount: 7,
      completedCount: 21,
      isOnline: true,
      rating: 4.7,
      description: "Creative problem solver and organizer",
    },
  ];

  return (
    <View style={{ backgroundColor: theme.white, flex: 1 }}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      {/* Nav */}
      <Nav
        gradient
        gradientColors={[Colors.primary, "#0b1544ff"]}
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
                    placeholderColor={theme.grey}
                    height={RFPercentage(6)}
                    backgroundColor={
                      theme.mode === "dark" ? "#131214ff" : "#F1F3F5"
                    }
                    borderWidth={0}
                    borderRadius={10}
                    color={theme.heading}
                    handleFeild={(text) => handleChange(text, i)}
                    value={item.value}
                    icon={true}
                    fontSize={RFPercentage(1.7)}
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
              renderItem={({ item }) => {
                // Get icon based on original English category (use filterMap to map back)
                const getIcon = (filterText) => {
                  const originalCategory = filterMap[filterText] || filterText;

                  switch (originalCategory) {
                    case "All":
                      return (
                        <Ionicons
                          name="apps"
                          size={RFPercentage(2)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                    case "Cleaning":
                      return (
                        <MaterialCommunityIcons
                          name="broom"
                          size={RFPercentage(3)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                    case "Moving":
                      return (
                        <MaterialIcons
                          name="video-library"
                          size={RFPercentage(2.5)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                    case "Gardening":
                      return (
                        <FontAwesome5
                          name="seedling"
                          size={RFPercentage(2.4)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                    case "Gaming":
                      return (
                        <Ionicons
                          name="game-controller"
                          size={RFPercentage(2.5)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                    case "Other":
                      return (
                        <MaterialIcons
                          name="category"
                          size={RFPercentage(2.5)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                    default:
                      return (
                        <MaterialIcons
                          name="category"
                          size={RFPercentage(2)}
                          color={
                            activeFilter === item ? "white" : Colors.lightGrey
                          }
                        />
                      );
                  }
                };

                return (
                  <TouchableOpacity onPress={() => setActiveFilter(item)}>
                    <>
                      {activeFilter === item ? (
                        <LinearGradient
                          colors={[Colors.primary, "#4557B0"]}
                          style={[styles.gradient, styles.filterButtonWithIcon]}
                        >
                          {getIcon(item)}
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.nonGradient,
                            styles.filterButtonWithIcon,
                            { borderColor: theme.border },
                          ]}
                        >
                          {getIcon(item)}
                        </View>
                      )}
                      <Text
                        style={{
                          fontFamily: "Poppins_500Medium",
                          color:
                            activeFilter === item
                              ? Colors.primary
                              : Colors.lightGrey,
                          fontSize: RFPercentage(1.5),
                          textAlign: "center",
                          marginTop: RFPercentage(0.7),
                        }}
                      >
                        {item.length > 6 ? `${item.substring(0, 6)}..` : item}
                      </Text>
                    </>
                  </TouchableOpacity>
                );
              }}
            />
            {users?.length > 0 ? (
              <>
                <View style={styles.wrap}>
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
                      const getGradientColors = () => {
                        switch (item.category) {
                          case "Top Rated":
                            return ["#e2ce5dff", "#efeaceff", "#d39345ff"];
                          case "Rising Talent":
                            return ["#6A11CB", "#cdafecff", "#A8CABA"]; // Blue/Purple Mesh
                          case "Beginner":
                            return ["#00B09B", "#bceee8ff", "#50C878"]; // Green Mesh
                          default:
                            return ["#7c8cdd", "#b4bde9ff", "#4c669f"];
                        }
                      };

                      const getGradientColors2 = () => {
                        switch (item.category) {
                          case "Top Rated":
                            return ["#e2ce5dff", "#1b1919ff", "#d39345ff"];
                          case "Rising Talent":
                            return ["#6A11CB", "#1b1919ff", "#A8CABA"]; // Blue/Purple Mesh
                          case "Beginner":
                            return ["#00B09B", "#1b1919ff", "#50C878"]; // Green Mesh
                          default:
                            return ["#7c8cdd", "#1b1919ff", "#4c669f"];
                        }
                      };

                      const getCategoryIcon = () => {
                        const icons = {
                          "Top Rated": { name: "trophy", color: "#FFD700" },
                          "Rising Talent": {
                            name: "trending-up",
                            color: "#FF9800",
                          },
                          Beginner: { name: "leaf", color: "#4CAF50" },
                        };
                        const icon = icons[item.category] || {
                          name: "person",
                          color: "#FFF",
                        };
                        return (
                          <Ionicons
                            name={icon.name as any}
                            size={RFPercentage(1.8)}
                            color={icon.color}
                          />
                        );
                      };

                      const gradientColors = getGradientColors();
                      const gradientColors2 = getGradientColors2();

                      return (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() =>
                            navigation.navigate("TopRatedUserProfile", {
                              user: item,
                            })
                          }
                          style={[
                            styles.cardWrapper,
                            { borderColor: gradientColors[0] },
                          ]}
                        >
                          {/* BASE GRADIENT LAYER */}
                          <LinearGradient
                            colors={
                              theme.mode === "dark"
                                ? gradientColors2
                                : gradientColors
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.topRatedCard}
                          >
                            {/* MESH OVERLAY 1 (Highlight) */}
                            <LinearGradient
                              colors={["rgba(255,255,255,0.4)", "transparent"]}
                              style={[
                                StyleSheet.absoluteFill,
                                { transform: [{ rotate: "45deg" }], top: -50 },
                              ]}
                              start={{ x: 0.5, y: 0 }}
                              end={{ x: 0.5, y: 1 }}
                            />

                            {/* MESH OVERLAY 2 (Shadow Depth) */}
                            <LinearGradient
                              colors={["transparent", "rgba(0,0,0,0.15)"]}
                              style={StyleSheet.absoluteFill}
                              start={{ x: 1, y: 0 }}
                              end={{ x: 0, y: 1 }}
                            />

                            <View style={styles.cardContent}>
                              {/* CATEGORY BADGE */}
                              <View style={styles.categoryBadgeContainer}>
                                <BlurView
                                  intensity={40}
                                  tint="light"
                                  style={styles.blurBadge}
                                >
                                  <View style={styles.badgeInner}>
                                    {getCategoryIcon()}
                                    <Text style={styles.categoryText}>
                                      {item.category === "Top Rated"
                                        ? t("profileRank.txt5")
                                        : item.category === "Rising Talent"
                                        ? t("profileRank.txt4")
                                        : t("profileRank.txt3")}
                                    </Text>
                                  </View>
                                </BlurView>
                              </View>

                              {/* AVATAR WITH GLOW */}
                              <View style={styles.avatarWrapper}>
                                <View style={styles.avatarShadow}>
                                  <Image
                                    source={
                                      item?.profileImage
                                        ? { uri: item.profileImage }
                                        : Icons.dp
                                    }
                                    style={styles.avatar}
                                  />
                                </View>
                              </View>

                              {/* NAME & HANDLE */}
                              <View style={styles.nameContainer}>
                                <Text style={styles.userName} numberOfLines={1}>
                                  {item.name || "User"}
                                </Text>
                                <Text style={styles.userHandle}>
                                  @{item?.name?.split(" ")[0] || "user"}
                                </Text>
                              </View>

                              {/* GLASS BUTTON */}
                              <TouchableOpacity
                                style={styles.viewProfileButton}
                                onPress={() =>
                                  navigation.navigate("TopRatedUserProfile", {
                                    user: item,
                                  })
                                }
                              >
                                <BlurView
                                  intensity={60}
                                  tint="light"
                                  style={styles.buttonBlur}
                                >
                                  <Text style={styles.viewProfileText}>
                                    {t("profileRank.txt8")}
                                  </Text>
                                  <Ionicons
                                    name="chevron-forward-circle"
                                    size={18}
                                    color="#FFF"
                                  />
                                </BlurView>
                              </TouchableOpacity>
                            </View>
                          </LinearGradient>
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
                <Text style={styles.txt}>{t("home.txt12")}</Text>
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
                            style={[
                              styles.userName,
                              {
                                color: theme.heading,
                                marginLeft: RFPercentage(2),
                              },
                            ]}
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
    color: Colors.primary,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  filterButtonsContainer: {
    marginTop: RFPercentage(1.4),
    gap: 26,
    paddingHorizontal: RFPercentage(2),
    // backgroundColor: "red",
  },
  filterButton: {
    // width: RFPercentage(11.5),
    height: RFPercentage(5),
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RFPercentage(100),
    height: RFPercentage(7),
    width: RFPercentage(7),
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

  postDate: {
    fontSize: RFPercentage(1.3),
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
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: Colors.darkGrey2,
    width: "100%",
  },
  compensationText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey2,
    marginLeft: RFPercentage(1),
  },
  compensationAmount: {
    color: Colors.primary,
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.6),
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

  avatarContainer: {
    position: "relative",
    marginBottom: RFPercentage(1),
    marginTop: RFPercentage(2),
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
    fontSize: RFPercentage(1.5),
    marginBottom: RFPercentage(1.5),
    opacity: 0.8,
  },

  statColumn: {
    flex: 1,
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
    justifyContent: "center",
  },

  // Beginner Badge
  beginnerBadge: {
    backgroundColor: "rgba(47, 255, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#4CAF50",
    position: "absolute",
    right: 8,
    top: 8,
  },
  beginnerText: {
    color: "#2E7D32",
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
    lineHeight: RFPercentage(1.2),
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
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
    lineHeight: RFPercentage(1.2),
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
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.3),
    lineHeight: RFPercentage(1.2),
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
    lineHeight: RFPercentage(1),
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
  txt: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(0.5),
  },
  wrap: {
    width: "90%",
    alignSelf: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(3),
    marginBottom: RFPercentage(1),
  },

  nonGradient: {
    borderRadius: 100,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: RFPercentage(7),
    width: RFPercentage(7),
  },

  filterButtonWithIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  cardWrapper: {
    width: RFPercentage(22), // Adjust based on your layout
    marginRight: 15,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: RFPercentage(0.1),
  },
  topRatedCard: {
    height: RFPercentage(30),
    padding: 15,
    borderRadius: 24,
    position: "relative",
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  categoryBadgeContainer: {
    alignSelf: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
  },
  blurBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatarWrapper: {
    marginVertical: 10,
  },
  avatarShadow: {
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatar: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
  },
  nameContainer: {
    alignItems: "center",
  },
  userName: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    color: "#FFF",
  },
  userHandle: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.8)",
    textTransform: "lowercase",
  },
  viewProfileButton: {
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
  },
  buttonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  viewProfileText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
  },
  ratingContainer: {
    flexDirection: "row",
    position: "absolute",
    top: RFPercentage(1),
    right: RFPercentage(1),
    gap: 1,
  },
  rankBadge: {
    position: "absolute",
    top: -RFPercentage(0.8),
    left: -RFPercentage(0.8),
    borderRadius: RFPercentage(1.5),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rankGradient: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_800ExtraBold",
    color: "#333",
  },
  topRatedContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
  },
});

export default Home;
