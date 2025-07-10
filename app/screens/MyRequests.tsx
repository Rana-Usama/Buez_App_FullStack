import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, Platform, FlatList, Dimensions, RefreshControl, ActivityIndicator, StatusBar } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../config/Colors";
import Nav from "../components/common/Nav";
import { getMyReuqests, updateReqestStatus } from "../services/Post.service";
import { useFocusEffect } from "@react-navigation/native";
import { getFormatedDate } from "../services/Shared.service";
import { REQUEST_STATUS } from "../utils/gloabals";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import NotFound from "../components/common/NotFound";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { translateText } from "../translation/googleTranslation";
import { useExitAppOnBack } from "../utils/appBack";
import { useAppTheme } from "../contexts/themeContext";
import ConfirmationModal from "../components/common/ConfirmationModal";

const { width: screenWidth } = Dimensions.get("window");

function MyRequests({ navigation }) {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const [activeFilter, setActiveFilter] = useState(`${t("myRequests.txt2")}`);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskRecords, setTaskRecords] = useState([]);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState(null);
  const [selectedRequestItem, setSelectedRequestItem] = useState(null);
  const [activeIndices, setActiveIndices] = useState({});
  useExitAppOnBack();
  const { theme } = useAppTheme();

  const param = activeFilter === `${t("myRequests.txt2")}` ? REQUEST_STATUS.Active : activeFilter === `${t("myRequests.txt3")}` ? REQUEST_STATUS.Completed : REQUEST_STATUS.Cancelled;

  useFocusEffect(
    useCallback(() => {
      setTaskRecords([]);
      setLastVisiblePost(null);
      fetchRequests(null);
    }, [param])
  );

  const fetchRequests = async (islastVisiblePost = undefined) => {
    setLoading(true);
    try {
      let isLastVisible = lastVisiblePost;
      if (typeof islastVisiblePost !== "undefined") {
        isLastVisible = islastVisiblePost;
      }
      const { tasksArray: newRecords, lastVisible } = await getMyReuqests(param, isLastVisible);
      const translatedRecords = await Promise.all(
        newRecords.map(async (item) => {
          const translatedTitle = await translateText(item.title || "");
          const translatedDescription = await translateText(item.description || "");
          const translatedTaskType = await translateText(item.taskType || "");
          const otherCompensation = await translateText(item.otherCompensation || "");
          return {
            ...item,
            title: translatedTitle,
            description: translatedDescription,
            taskType: translatedTaskType,
            otherCompensation,
          };
        })
      );

      setTaskRecords(translatedRecords);
      setLastVisiblePost(lastVisible);
      setHasMore(newRecords.length > 0);
    } catch (error) {
      console.log("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { tasksArray: newRecords, lastVisible } = await getMyReuqests(param, lastVisiblePost);
      setTaskRecords([...taskRecords, ...newRecords]);
      setLastVisiblePost(lastVisible);
      setHasMore(newRecords.length > 0);
    } catch (error) {
      console.log("Error loading more posts:", error);
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
    await fetchRequests();
    setRefreshing(false);
  };

  const [loader, setLoader] = useState(false);

  const changeReqestStatus = async (i, status, item) => {
    setLoader(true);
    try {
      await updateReqestStatus(item.id, status, item);
      setTaskRecords((p) => {
        const newRecords = [...p];
        newRecords.splice(i, 1);
        return newRecords;
      });

      let action;
      if (status === REQUEST_STATUS.Completed) {
        action = `${t("toast.myRequests.three")}`;
      } else if (status === REQUEST_STATUS.Cancelled) {
        action = `${t("toast.myRequests.cancelled")}`;
      } else {
        action = `${t("toast.myRequests.four")}`;
      }

      Toast.show({
        type: "success",
        text1: `${t("toast.myRequests.one")}`,
        text2: `${t("toast.myRequests.two")} ${action}`,
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: `${t("toast.myRequests.five")}`,
        text2: `${t("toast.myRequests.six")}`,
      });
    } finally {
      setLoader(false);
    }
  };

  const FilterButton = ({ title, isActive, isFirst }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.filterButton, { borderColor: isActive ? "transparent" : theme.border }, isFirst && styles.firstFilterButton]}
      onPress={() => setActiveFilter(title)}
    >
      {isActive ? (
        <LinearGradient colors={[Colors.primary, "#4557B0"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          <Text style={styles.filterButtonTextActive}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.filterButtonTextInactive, { color: theme.heading }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );

  const postEditHandler = (cart) => {
    navigation.navigate("PostRequest", { title: "Edit Request", postRequest: cart });
  };

  const handleImageScroll = (event, cardIndex) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const currentIndex = Math.floor(contentOffsetX / viewSize);
    setActiveIndices((prev) => ({
      ...prev,
      [cardIndex]: currentIndex,
    }));
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} backgroundColor={theme.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshRequests} colors={[theme.primary]} tintColor={theme.primary} />}
      >
        <Nav marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} profileImage={profileImgUrl} leftLogo navigation={navigation} title={`${t("myRequests.txt1")}`} />

        {/* Updated Filter Tabs: Active, Completed, Cancelled */}
        <View style={styles.filterContainer}>
          {[`${t("myRequests.txt2")}`, `${t("myRequests.txt3")}`, `${t("myRequests.txt8")}`].map((title, index) => (
            <FilterButton key={title} title={title} isActive={activeFilter === title} isFirst={index === 0} />
          ))}
        </View>

        {/* Cards */}
        {taskRecords.map((cart, index) => (
          <View key={index} style={[styles.cartContainer, { borderColor: theme.border }]}>
            <FlatList
              data={cart.imageUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => handleImageScroll(event, index)}
              scrollEventThrottle={16}
              onEndReached={handleLoadMore}
              renderItem={({ item }) => (
                <ImageBackground style={styles.cartImageBackground} imageStyle={styles.cartImage} source={{ uri: item }} resizeMode="cover">
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{cart.taskType}</Text>
                  </View>
                  {cart.status === REQUEST_STATUS.Active && (
                    <View style={styles.cartWrapper}>
                      <TouchableOpacity activeOpacity={0.8} onPress={() => postEditHandler(cart)}>
                        <Image style={styles.edit} source={Icons.editRequest} />
                      </TouchableOpacity>
                    </View>
                  )}
                </ImageBackground>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
            {cart.imageUrls.length > 1 && (
              <View style={styles.dotsContainer}>
                {cart.imageUrls.map((_, imageIndex) => (
                  <View key={imageIndex} style={[styles.dot, { backgroundColor: (activeIndices[index] ?? 0) === imageIndex ? theme.primary : theme.border }]} />
                ))}
              </View>
            )}
            {/* User Info */}
            <View style={styles.cartInfoContainer}>
              <TouchableOpacity activeOpacity={0.8}>
                <Image style={styles.userImage} source={cart?.user?.profileImage ? { uri: cart?.user?.profileImage } : Icons.dp} />
              </TouchableOpacity>
              <Text style={[styles.userName, { color: theme.heading }]}>{cart.user.userName}</Text>
              <Text style={[styles.postDate, { color: theme.darkGrey }]}>{`${t("myRequests.txt4")} ${getFormatedDate(cart?.createdAt)}`}</Text>
            </View>

            {/* Description */}
            <View style={styles.taskInfoContainer}>
              <Text style={[styles.taskText, { color: theme.darkGrey }]}>{cart?.description?.substr(0, 30) + (cart?.description?.length > 15 ? "..." : "")}</Text>
            </View>

            {/* Compensation */}
            <View style={styles.taskInfoContainer}>
              <Text style={[styles.compensation, { color: theme.heading }]}>
                {`${t("home.txt10")}`}:{" "}
                <Text style={[styles.compensationAmount, { color: theme.primary }]}>
                  {cart.compensationType === "Monitarely" ? `${cart.monitarily}$` : cart.otherCompensation?.substr(0, 20) + (cart.otherCompensation?.length > 20 ? "..." : "")}
                </Text>
              </Text>
            </View>

            {/* Actions (only for active posts) */}
            {cart?.status === REQUEST_STATUS.Active && (
              <View style={styles.cartContainer2}>
                <TouchableOpacity disabled={loader} style={styles.markButton} onPress={() => changeReqestStatus(index, REQUEST_STATUS.Completed, cart)}>
                  <Text style={styles.text2}>{`${t("myRequests.txt5")}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={loader}
                  onPress={() => {
                    setSelectedRequestIndex(index);
                    setSelectedRequestItem(cart);
                    setIsModalVisible(true);
                  }}
                  style={[styles.cancel, { borderColor: theme.mode === "dark" ? theme.lightGrey : theme.lightGrey }]}
                >
                  <Text style={[styles.text3, { color: theme.mode === "dark" ? theme.lightGrey : theme.lightGrey }]}>{`${t("myRequests.txt6")}`}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {(loading || loadingMore) && (
          <View style={{ marginTop: RFPercentage(34) }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loading && taskRecords.length === 0 && <NotFound title={`${t("home.txt11")}`} />}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <ConfirmationModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onConfirm={() => {
          if (selectedRequestIndex !== null && selectedRequestItem) {
            changeReqestStatus(selectedRequestIndex, REQUEST_STATUS.Cancelled, selectedRequestItem);
            setIsModalVisible(false);
          }
        }}
        title={t("myRequests.txt7")}
        theme={theme}
        t={t}
      />
    </View>
  );
}

export default MyRequests;

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
    paddingBottom: RFPercentage(10),
  },
  filterButton: {
    width: RFPercentage(13),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(2),
    alignSelf: "flex-start",
    borderWidth: 1,
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
    fontFamily: "Poppins_500Medium",
  },
  filterButtonTextInactive: {
    color: Colors.heading,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  cartContainer: {
    width: "90%",
    // height: RFPercentage(50),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: RFPercentage(2),
    marginTop: RFPercentage(3.6),
  },
  cartImageBackground: {
    width: screenWidth * 0.9,
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
    // top: RFPercentage(-9),
  },
  edit: {
    width: RFPercentage(3.7),
    height: RFPercentage(3.7),
  },
  compensation: { fontSize: RFPercentage(1.8), fontFamily: "Poppins_500Medium", marginTop: RFPercentage(1) },
  dot: {
    height: RFPercentage(0.9),
    width: RFPercentage(0.9),
    borderRadius: RFPercentage(0.5),
    margin: RFPercentage(0.5),
    marginTop: RFPercentage(3),
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
    marginVertical: RFPercentage(2),
    // top: RFPercentage(-7),
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
  text2: { color: Colors.white, fontFamily: "Poppins_500Medium", fontSize: RFPercentage(1.6), textAlign: "center" },
  postDate: {
    fontSize: RFPercentage(1.6),
    position: "absolute",
    right: 0,
    fontFamily: "Poppins_400Regular",
  },
  taskInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    // top: RFPercentage(-5),
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
    fontSize: RFPercentage(1.8),
  },
  bottomSpacing: {
    marginBottom: RFPercentage(6),
  },

  filterContainer: {
    marginTop: RFPercentage(5),
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
    width: "90%",
  },
  cartWrapper: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
    left: RFPercentage(2),
    top: RFPercentage(2),
  },
  markButton: {
    borderRadius: RFPercentage(100),
    height: RFPercentage(5.2),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    width: RFPercentage(18),
    paddingVertical: RFPercentage(1),
  },
  cancel: {
    borderRadius: RFPercentage(100),
    width: RFPercentage(18),
    height: RFPercentage(5.2),
    borderColor: "rgb(204, 204, 216)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
    backgroundColor: "transparent",
  },
  notFoundWrapper: { marginTop: RFPercentage(24), justifyContent: "center", alignItems: "center" },
  notFoundIcon: { borderRadius: RFPercentage(1), width: RFPercentage(20), height: RFPercentage(20), marginBottom: RFPercentage(2) },
  notFoundText: { color: Colors.darkGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
  cartContainer2: { width: "92%", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", marginTop: RFPercentage(1.5) },
  text3: { color: Colors.white, fontFamily: "Poppins_500Medium", fontSize: RFPercentage(1.7), textAlign: "center" },
});
