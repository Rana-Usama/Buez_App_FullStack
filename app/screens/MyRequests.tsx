import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Platform,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from "react-native";
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
import { useExitAppOnBack } from "../utils/appBack";
import { useAppTheme } from "../contexts/themeContext";
import ConfirmationModal from "../components/common/ConfirmationModal";
import Feather from "@expo/vector-icons/Feather";
import { cachedTranslate } from "../utils/cachedTranslations";
import { createNewChat } from "../services/Chat.service";
const { width: screenWidth } = Dimensions.get("window");
import { getAuth } from "firebase/auth";
import { fetchActiveTasksFromFirebase } from "../services/Review.service";
import { formatCurrency } from "../utils/currencyChange";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import RepostSuccessModal from "../components/common/RepostModal";
import { Ionicons } from "@expo/vector-icons";

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
  const [markLoaderIndex, setMarkLoaderIndex] = useState(null);
  const [cancelLoaderIndex, setCancelLoaderIndex] = useState(null);

  const param =
    activeFilter === `${t("myRequests.txt2")}`
      ? REQUEST_STATUS.Active
      : activeFilter === `${t("myRequests.txt3")}`
      ? REQUEST_STATUS.Completed
      : activeFilter === `${t("myRequests.txt8")}`
      ? REQUEST_STATUS.Cancelled
      : null; // 👈 Accepted will be handled separately

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [repostingIndex, setRepostingIndex] = useState(null);
  const [repostModalVisible, setRepostModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setInitialLoadDone(false); // reset when param changes
      setTaskRecords([]);
      setLastVisiblePost(null);
      fetchRequests(null).then(() => setInitialLoadDone(true));
    }, [param])
  );

  const fetchRequests = async (islastVisiblePost = null) => {
    setLoading(true);

    try {
      let newRecords = [];
      let lastVisible;

      // ✅ Completed requests (example: your "Completed" filter)
      if (activeFilter === `${t("myRequests.txt10")}`) {
        newRecords = await fetchActiveTasksFromFirebase();
        console.log("newRecords.........", newRecords);
        newRecords = newRecords.map((item) => ({
          ...item.taskDetails,
          acceptedBy: item.acceptedBy,
          status: item.status,
          completedTaskId: item.id,
        }));
      }

      // ✅ All other filters (My own tasks: Active, Cancelled, etc.)
      else {
        const { tasksArray, lastVisible: lv } = await getMyReuqests(
          param,
          islastVisiblePost
        );
        newRecords = tasksArray;
        lastVisible = lv;
      }

      // 🔹 Translate fields
      const translatedRecords = await Promise.all(
        newRecords.map(async (item) => ({
          ...item,
          title: await cachedTranslate(item?.title || ""),
          description: await cachedTranslate(item?.description || ""),
          taskType: await cachedTranslate(item?.taskType || ""),
          customTaskTitle: await cachedTranslate(item?.customTaskTitle || ""),
          otherCompensation: await cachedTranslate(
            item?.otherCompensation || ""
          ),
        }))
      );

      // 🔹 Append or replace list
      if (islastVisiblePost) {
        setTaskRecords((prev) => [...prev, ...translatedRecords]);
      } else {
        setTaskRecords(translatedRecords);
      }

      setLastVisiblePost(lastVisible);
      setHasMore(newRecords.length > 0);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRequests = async () => {
    setRefreshing(true);
    setLastVisiblePost(null); // reset cursor
    setTaskRecords([]); // clear old data
    await fetchRequests(null); // explicitly fetch from start
    setRefreshing(false);
  };

  const fetchMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { tasksArray: newRecords, lastVisible } = await getMyReuqests(
        param,
        lastVisiblePost
      );

      const translatedRecords = await Promise.all(
        newRecords.map(async (item) => ({
          ...item,
          title: await cachedTranslate(item?.title || ""),
          description: await cachedTranslate(item?.description || ""),
          taskType: await cachedTranslate(item?.taskType || ""),
          otherCompensation: await cachedTranslate(
            item?.otherCompensation || ""
          ),
        }))
      );

      setTaskRecords([...taskRecords, ...translatedRecords]);
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
        if (item.acceptedBy) {
          await sendTaskCompletionNotification(item);
        }
      } else if (status === REQUEST_STATUS.Cancelled) {
        action = `${t("toast.myRequests.four")}`;
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

  const repostRequest = async (index, item) => {
    setRepostingIndex(index); // mark the current request as reposting
    try {
      const updatedData = {
        ...item,
        acceptedBy: null,
        status: REQUEST_STATUS.Active,
      };

      await updateReqestStatus(item.id, REQUEST_STATUS.Active, updatedData);
      setTaskRecords((prev) => {
        const newRecords = [...prev];
        newRecords[index] = { ...newRecords[index], ...updatedData };
        return newRecords;
      });
      setActiveFilter(t("myRequests.txt2"));
      setRepostModalVisible(true);
    } catch (e) {
      console.log("e.........", e);
      Toast.show({
        type: "error",
        text1: t("toast.myRequests.five"),
        text2: t("toast.myRequests.six"),
      });
    } finally {
      setRepostingIndex(null); // reset when done
    }
  };

  const FilterButton = ({ title, isActive, isFirst }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.filterButton,
        { borderColor: isActive ? "transparent" : theme.border },
        isFirst && styles.firstFilterButton,
      ]}
      onPress={() => setActiveFilter(title)}
    >
      {isActive ? (
        <LinearGradient
          colors={[Colors.primary, "#4557B0"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.filterButtonTextActive}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text
          style={[styles.filterButtonTextInactive, { color: theme.heading }]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  const postEditHandler = (cart) => {
    navigation.navigate("PostRequest", {
      title: "Edit Request",
      postRequest: cart,
    });
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

  const currentUserId = getAuth().currentUser?.uid;
  const currentUser = useUser();

  const handleStartChat = useCallback(
    async (receiverUser) => {
      try {
        const chatId = await createNewChat(currentUserId, receiverUser.userId);
        navigation.navigate("Chat", {
          chatId,
          senderId: currentUserId,
          senderName: currentUser?.userData?.userName,
          receiver: receiverUser,
        });
      } catch (err) {
        console.log("Chat start error:", err);
      }
    },
    [currentUserId, currentUser?.userData?.userName]
  );

  // Function to send push notification to task accepter
  async function sendTaskCompletionPushNotification(task) {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: task.acceptedBy?.token,
            title: t("pushNotifications.txt3"),
            body: `${t("pushNotifications.txt4")} "${task.taskType}" ${t(
              "pushNotifications.txt5"
            )} ${task.user?.userName}`,
          }),
        }
      );
      const data = await response.text();
      return data;
    } catch (error) {
      console.log("sendTaskCompletionPushNotification error:", error);
      throw error;
    }
  }

  // Function to save notification to Firestore
  const saveTaskCompletionNotification = async (task) => {
    try {
      const db = getFirestore();
      await addDoc(collection(db, "notifications"), {
        sender: {
          userId: task.userId,
          userName: task.user?.userName,
          email: task.user?.email,
          profileImage: task.user?.profileImage || null,
          token: task.user?.token,
        },
        receiver: {
          userId: task.acceptedBy?.userId,
          name: task.acceptedBy?.userName,
          email: task.acceptedBy?.email,
          token: task.acceptedBy?.token,
        },
        task: {
          taskId: task.id,
          taskType: task.taskType,
          description: task.description,
        },
        type: "task_completion",
        title: "Task Completed",
        message: `Your task "${task.taskType}" has been marked as completed`,
        timestamp: new Date().toISOString(),
        isRead: false,
      });
      console.log("Task completion notification saved successfully.");
    } catch (error) {
      console.log("Error saving task completion notification:", error);
    }
  };

  // Main function to handle task completion notifications
  const sendTaskCompletionNotification = async (task) => {
    try {
      // Send push notification
      await sendTaskCompletionPushNotification(task);
      // Save notification to database
      await saveTaskCompletionNotification(task);
      console.log(
        "Task completion notification process completed successfully."
      );
    } catch (error) {
      console.log("Error in task completion notification process:", error);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />
      <Nav
        profileImage={profileImgUrl}
        leftLogo
        navigation={navigation}
        title={`${t("myRequests.txt1")}`}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshRequests}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {[
            `${t("myRequests.txt2")}`,
            `${t("myRequests.txt10")}`,
            `${t("myRequests.txt3")}`,
            `${t("myRequests.txt8")}`,
          ].map((title, index) => (
            <FilterButton
              key={title}
              title={title}
              isActive={activeFilter === title}
              isFirst={index === 0}
            />
          ))}
        </ScrollView>

        {/* Cards */}
        {taskRecords.map((cart, index) => (
          <View
            key={index}
            style={[styles.cartContainer, { borderColor: theme.border }]}
          >
            <FlatList
              data={cart.imageUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => handleImageScroll(event, index)}
              scrollEventThrottle={16}
              onEndReached={handleLoadMore}
              renderItem={({ item }) => (
                <ImageBackground
                  style={styles.cartImageBackground}
                  imageStyle={styles.cartImage}
                  source={{ uri: item }}
                  resizeMode="cover"
                >
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {cart?.taskType === "Other"
                        ? cart.customTaskTitle
                        : cart?.taskType}
                    </Text>
                  </View>
                  {cart.status === REQUEST_STATUS.Active && (
                    <View style={styles.cartWrapper}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => postEditHandler(cart)}
                      >
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
                  <View
                    key={imageIndex}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          (activeIndices[index] ?? 0) === imageIndex
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            {/* User Info */}
            <View style={styles.cartInfoContainer}>
              <TouchableOpacity activeOpacity={0.8}>
                <Image
                  style={styles.userImage}
                  source={
                    cart?.user?.profileImage
                      ? { uri: cart?.user?.profileImage }
                      : Icons.dp
                  }
                />
              </TouchableOpacity>
              <Text style={[styles.userName, { color: theme.heading }]}>
                {cart?.user?.userName}
              </Text>
              <Text style={[styles.postDate, { color: theme.darkGrey }]}>{`${t(
                "myRequests.txt4"
              )} ${getFormatedDate(cart?.createdAt)}`}</Text>
            </View>

            {/* Description */}
            <View style={styles.taskInfoContainer}>
              <Text style={[styles.taskText, { color: theme.darkGrey }]}>
                {cart?.description?.substr(0, 34) +
                  (cart?.description?.length > 34 ? "..." : "")}
              </Text>
            </View>

            {/* Compensation + Repost */}
            <View style={styles.taskInfoContainer}>
              <Text style={[styles.compensation, { color: theme.heading }]}>
                {`${t("home.txt10")}`}:{" "}
                <Text
                  style={[styles.compensationAmount, { color: theme.primary }]}
                >
                  {cart.compensationType === "Monitarely"
                    ? `${formatCurrency(cart.monitarily)}`
                    : cart.otherCompensation?.substr(0, 15) +
                      (cart.otherCompensation?.length > 15 ? "..." : "")}
                </Text>
              </Text>

              {/* Repost only for Completed or Cancelled filter and active after someone accepted */}
              {(activeFilter === `${t("myRequests.txt3")}` ||
                activeFilter === `${t("myRequests.txt8")}` ||
                (activeFilter === `${t("myRequests.txt2")}` &&
                  cart?.acceptedBy)) &&
                (repostingIndex === index ? (
                  <View
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: 2,
                      height: RFPercentage(2.8),
                      width: RFPercentage(12),
                      borderRadius: RFPercentage(100),
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator size="small" color={theme.heading} />
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => repostRequest(index, cart)}
                    activeOpacity={0.8}
                    style={{
                      position: "absolute",
                      right: 0,
                      flexDirection: "row",
                      bottom: 2,
                      alignItems: "center",
                      backgroundColor: Colors.primary,
                      borderRadius: RFPercentage(100),
                      paddingHorizontal: RFPercentage(1.5),
                      height: RFPercentage(2.8),
                      justifyContent: "center",
                    }}
                    disabled={markLoaderIndex === index}
                  >
                    <Text
                      style={{
                        color: Colors.white,
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: RFPercentage(1.4),
                        marginRight: RFPercentage(0.5),
                      }}
                    >
                      {t("myRequests.txt9")}
                    </Text>
                    <Feather
                      name="repeat"
                      size={RFPercentage(1.3)}
                      color={Colors.white}
                    />
                  </TouchableOpacity>
                ))}
            </View>
            {cart?.acceptedBy && (
              <>
                <View
                  style={{
                    width: "90%",
                    height: RFPercentage(0.1),
                    backgroundColor: theme.border,
                    alignSelf: "center",
                    marginVertical: RFPercentage(2),
                  }}
                ></View>

                <View
                  style={{
                    width: "92%",
                    alignSelf: "center",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={[
                      styles.compensation,
                      { color: theme.heading, marginTop: 0 },
                    ]}
                  >
                    {t("myRequests.txt11")}
                  </Text>
                  <Text
                    style={[
                      styles.taskText,
                      { color: theme.darkGrey, marginLeft: RFPercentage(0.6) },
                    ]}
                  >
                    { activeFilter === `${t("myRequests.txt10")}` ? `${t("common.you")}`  : cart?.acceptedBy?.userName?.substr(0, 12) +
                      (cart?.acceptedBy?.userName?.length > 12 ? "..." : "")}
                  </Text>
                  {/* {activeFilter === `${t("myRequests.txt3")}` ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={
                      markLoaderIndex === index || repostingIndex === index
                    }
                    onPress={() =>
                      navigation.navigate("AddReview", { task: cart })
                    }
                    style={{
                      position: "absolute",
                      right: 0,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="star"
                      size={RFPercentage(1.8)}
                      color={Colors.primary}
                    />
                    <Text
                      style={{
                        color: Colors.primary,
                        fontFamily: "Poppins_500Medium",
                        fontSize: RFPercentage(1.5),
                        marginLeft: RFPercentage(0.4),
                      }}
                    >
                      Add Review
                    </Text>
                  </TouchableOpacity>
                ) : ( */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={
                      markLoaderIndex === index || repostingIndex === index
                    }
                    onPress={() => {
                      if (activeFilter === `${t("myRequests.txt10")}`) {
                        handleStartChat(cart?.user);
                      } else {
                        handleStartChat(cart?.acceptedBy);
                      }
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={Icons.messages}
                      resizeMode="contain"
                      style={{
                        width: RFPercentage(2.3),
                        height: RFPercentage(2.3),
                      }}
                    />
                    <Text
                      style={{
                        color: Colors.primary,
                        fontFamily: "Poppins_500Medium",
                        fontSize: RFPercentage(1.5),
                        marginLeft: RFPercentage(0.4),
                      }}
                    >
                      {t("details.txt9")}
                    </Text>
                  </TouchableOpacity>
                  {/* )} */}
                </View>
              </>
            )}

            {/* Actions (only when Active filter is selected) */}
            {activeFilter === `${t("myRequests.txt2")}` &&
              cart?.status === REQUEST_STATUS.Active && (
                <View style={styles.cartContainer2}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={
                      markLoaderIndex === index || repostingIndex === index
                    }
                    style={[
                      styles.markButton,
                      {
                        opacity:
                          markLoaderIndex === index || repostingIndex === index
                            ? 0.5
                            : 1,
                      },
                    ]}
                    onPress={async () => {
                      setMarkLoaderIndex(index);
                      await changeReqestStatus(
                        index,
                        REQUEST_STATUS.Completed,
                        cart
                      );
                      setMarkLoaderIndex(null);
                    }}
                  >
                    {markLoaderIndex === index ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.text2}>{t("myRequests.txt5")}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={
                      cancelLoaderIndex === index || repostingIndex === index
                    }
                    onPress={async () => {
                      setCancelLoaderIndex(index); // start loader for this button
                      setSelectedRequestIndex(index);
                      setSelectedRequestItem(cart);
                      setIsModalVisible(true); // modal will handle the cancel
                      setCancelLoaderIndex(null); // stop loader after action (or after modal confirm)
                    }}
                    style={[
                      styles.cancel,
                      {
                        borderColor:
                          theme.mode === "dark"
                            ? theme.lightGrey
                            : theme.lightGrey,
                      },
                    ]}
                  >
                    {cancelLoaderIndex === index ? (
                      <ActivityIndicator size="small" color={theme.lightGrey} />
                    ) : (
                      <Text
                        style={[
                          styles.text3,
                          {
                            color:
                              theme.mode === "dark"
                                ? theme.lightGrey
                                : theme.lightGrey,
                          },
                        ]}
                      >
                        {t("myRequests.txt6")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
          </View>
        ))}

        {(loading || loadingMore) && (
          <View style={{ marginTop: RFPercentage(28) }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text
              style={{
                color: Colors.primary,
                fontSize: RFPercentage(1.8),
                fontFamily: "Poppins_500Medium",
                marginTop: RFPercentage(0.5),
              }}
            >
              {t("myRequests.txt13")}
            </Text>
          </View>
        )}

        {!loading && taskRecords.length === 0 && (
          <NotFound title={`${t("home.txt11")}`} />
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <ConfirmationModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onConfirm={() => {
          if (selectedRequestIndex !== null && selectedRequestItem) {
            changeReqestStatus(
              selectedRequestIndex,
              REQUEST_STATUS.Cancelled,
              selectedRequestItem
            );
            setIsModalVisible(false);
          }
        }}
        title={t("myRequests.txt7")}
        theme={theme}
        t={t}
        loading={loader}
      />

      <RepostSuccessModal
        isVisible={repostModalVisible}
        onClose={() => setRepostModalVisible(false)}
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
    height: RFPercentage(4.6),
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
  filterScrollContainer: {
    paddingHorizontal: RFPercentage(2),
    alignItems: "center",
    marginTop: RFPercentage(3),
  },

  edit: {
    width: RFPercentage(3.7),
    height: RFPercentage(3.7),
  },
  compensation: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(0.7),
  },
  dot: {
    height: RFPercentage(0.9),
    width: RFPercentage(0.9),
    borderRadius: RFPercentage(0.5),
    margin: RFPercentage(0.5),
    marginTop: RFPercentage(3),
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
  text2: {
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    textAlign: "center",
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
    alignItems: "center",
    flexDirection: "row",
    // top: RFPercentage(-5),
  },
  taskText: {
    fontSize: RFPercentage(1.6),
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
    fontSize: RFPercentage(1.5),
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
    borderRadius: RFPercentage(1),
    height: RFPercentage(5),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    width: "45%",
    paddingVertical: RFPercentage(1),
  },
  cancel: {
    borderRadius: RFPercentage(1),
    width: "45%",
    height: RFPercentage(5),
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
    backgroundColor: "transparent",
  },
  notFoundWrapper: {
    marginTop: RFPercentage(24),
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundIcon: {
    borderRadius: RFPercentage(1),
    width: RFPercentage(20),
    height: RFPercentage(20),
    marginBottom: RFPercentage(2),
  },
  notFoundText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  cartContainer2: {
    width: "92%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },
  text3: {
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.6),
    textAlign: "center",
  },
  acceptedCancelButton: {
    borderRadius: RFPercentage(100),
    height: RFPercentage(5.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    width: "45%",
    alignSelf: "center",
  },
});
