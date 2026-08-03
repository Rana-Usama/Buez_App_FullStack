import React, { useCallback, useState, useEffect, useRef } from "react";
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
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../config/Colors";
import Nav from "../components/common/Nav";
import { getMyReuqests, updateReqestStatus } from "../services/Post.service";
import { useFocusEffect } from "@react-navigation/native";
import {
  getFormatedDate,
  getFormatedConfirmedDate,
  getRelativeConfirmedTime,
} from "../services/Shared.service";
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
import { sendPushToUser } from "../utils/pushNotify";
import { createNewChat } from "../services/Chat.service";
const { width: screenWidth } = Dimensions.get("window");
import { getAuth } from "firebase/auth";
import {
  fetchActiveTasksFromFirebase,
  fetchAllConfirmedTasksAsWorker,
} from "../services/Review.service";
import {
  getFirestore,
  collection,
  addDoc,
  where,
  getDocs,
  query,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import RepostSuccessModal from "../components/common/RepostModal";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  formatCurrency,
  convertCurrency,
  getCurrencyInfo,
} from "../utils/currencyChange";
import { useLocation } from "../utils/useLocation";
import { ShareButton } from "../job-sharing/ShareButton";
import { groupChatExists } from "../services/GroupChat.service";
import AvatarInitials from "../components/common/DefaultAvatars";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TaskRecord = {
  id?: string;
  title?: string;
  description?: string;
  taskType?: string;
  customTaskTitle?: string;
  otherCompensation?: string;
  compensationType?: string;
  monitarily?: string;
  currencyInfo?: any;
  acceptedBy?: any;
  confirmedWorkers?: any[];
  appliedWorkers?: any[];
  numberOfWorkers?: number;
  isBulkRequest?: boolean;
  user?: any;
  status?: string;
  imageUrls?: string[];
  createdAt?: any;
  reviewedAccepter?: boolean;
  taskDetails?: any;
  isWorkerConfirmed?: boolean;
  workerStatus?: string;
  confirmedAt?: string;
  userId?: string;
  completedTaskId?: string;
  selectedSubTasks?: any[];
  scheduledDateTime?: string;
  estimatedDuration?: string;
  durationLabel?: string;
  slotsAvailable?: number;
  repostedTo?: string;
  repostedAt?: any;
};

function MyRequests({ navigation }) {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const [activeFilter, setActiveFilter] = useState(`${t("myRequests.txt2")}`);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState(null);
  const [selectedRequestItem, setSelectedRequestItem] = useState(null);
  const [activeIndices, setActiveIndices] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllSubTasks, setShowAllSubTasks] = useState({});
  const [groupChatMap, setGroupChatMap] = useState<Record<string, boolean>>({});
  // Animation values for each card
  const rotateAnims = useRef<{ [key: number]: Animated.Value }>({}).current;
  // Tracks the last loaded status filter so we only show the full-screen loader
  // (and clear the list) on first load or an actual filter change — not on every
  // re-focus, where we keep showing current data and refresh silently.
  const lastFilterRef = useRef<string | null>(null);

  const { location: currentLocation } = useLocation();
  useExitAppOnBack();
  const { theme } = useAppTheme();
  const [markLoaderIndex, setMarkLoaderIndex] = useState(null);
  const [cancelLoaderIndex, setCancelLoaderIndex] = useState(null);
  const [reviewedSingleTasks, setReviewedSingleTasks] = useState<
    Record<string, boolean>
  >({});

  const currentUserId = getAuth().currentUser?.uid;
  const db = getFirestore();

  // Initialize animation values for new cards
  useEffect(() => {
    taskRecords.forEach((_, index) => {
      if (!rotateAnims[index]) {
        rotateAnims[index] = new Animated.Value(0);
      }
    });
  }, [taskRecords.length]);

  const toggleExpand = (index: number, event?: any) => {
    // Stop propagation to prevent navigation when clicking expand button
    if (event) {
      event.stopPropagation();
    }

    // Toggle expanded state
    const newExpandedState = !expandedCards[index];
    setExpandedCards((prev) => ({ ...prev, [index]: newExpandedState }));

    // Animate chevron rotation
    if (rotateAnims[index]) {
      Animated.timing(rotateAnims[index], {
        toValue: newExpandedState ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Use LayoutAnimation for smooth height transition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const toggleSubTasks = (index: number, event?: any) => {
    if (event) {
      event.stopPropagation();
    }
    setShowAllSubTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getConvertedCompensation = (item) => {
    if (item.compensationType !== "Monitarely") return null;
    try {
      const originalAmount = parseFloat(item.monitarily) || 0;
      const locationToUse = currentLocation;
      if (!item.currencyInfo) {
        return formatCurrency(originalAmount, locationToUse);
      }
      const targetCurrency = getCurrencyInfo(locationToUse).code;
      const convertedAmount = convertCurrency(
        originalAmount,
        item.currencyInfo.code,
        targetCurrency,
      );
      return formatCurrency(convertedAmount, locationToUse);
    } catch (error) {
      console.log("Currency conversion error:", error);
      return formatCurrency(parseFloat(item.monitarily) || 0, currentLocation);
    }
  };

  const param =
    activeFilter === `${t("myRequests.txt2")}` ||
    activeFilter === `${t("myRequests.txt14")}`
      ? REQUEST_STATUS.Active
      : activeFilter === `${t("myRequests.txt3")}`
        ? REQUEST_STATUS.Completed
        : activeFilter === `${t("myRequests.txt8")}`
          ? REQUEST_STATUS.Cancelled
          : null;

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [repostingIndex, setRepostingIndex] = useState(null);
  const [repostModalVisible, setRepostModalVisible] = useState(false);

  // Format scheduled date and time
  const formatScheduledDateTime = (task) => {
    if (task?.scheduledDateTime) {
      const date = new Date(task.scheduledDateTime);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  // A task is "past" once its scheduled date/time has elapsed.
  // Tasks without a schedule (legacy posts) are never treated as past.
  const isPastTask = (task) => {
    const scheduled = task?.scheduledDateTime || task?.scheduledDate;
    if (!scheduled) return false;
    const ts = new Date(scheduled).getTime();
    return !isNaN(ts) && ts < Date.now();
  };

  // Get duration label
  const getDurationLabel = (task) => {
    if (task?.durationLabel) {
      return task.durationLabel;
    }
    if (task?.estimatedDuration) {
      const durationOptions = [
        { value: "less_than_1", label: "< 1 hour" },
        { value: "1_2_hours", label: "1-2 hours" },
        { value: "2_4_hours", label: "2-4 hours" },
        { value: "4_6_hours", label: "4-6 hours" },
        { value: "6_8_hours", label: "6-8 hours" },
        { value: "full_day", label: "Full day" },
        { value: "multiple_days", label: "Multiple days" },
      ];
      const duration = durationOptions.find(
        (d) => d.value === task.estimatedDuration,
      );
      return duration?.label || "Duration not specified";
    }
    return null;
  };

  // Helper function to check if user is confirmed in bulk request
  const checkUserConfirmedStatus = (task) => {
    if (!task || !currentUserId) return false;
    if (task.confirmedWorkers && Array.isArray(task.confirmedWorkers)) {
      return task.confirmedWorkers.some(
        (worker) => worker && worker.userId === currentUserId,
      );
    }
    return false;
  };

  // Helper function to check if user has applied
  const checkUserAppliedStatus = (task) => {
    if (!task || !currentUserId) return false;
    if (task.appliedWorkers && Array.isArray(task.appliedWorkers)) {
      return task.appliedWorkers.some(
        (worker) => worker && worker.userId === currentUserId,
      );
    }
    return false;
  };

  // Enhanced fetch function that includes confirmed worker tasks
  const fetchRequests = async (islastVisiblePost = null, showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      let newRecords = [];
      let lastVisible;
      if (activeFilter === `${t("myRequests.txt10")}`) {
        const acceptedTasks = await fetchActiveTasksFromFirebase();
        const confirmedWorkerTasks =
          await fetchAllConfirmedTasksAsWorker(currentUserId);

        // Combine both with proper mapping
        const singleAcceptedMapped = acceptedTasks.map((item) => ({
          ...item.taskDetails,
          acceptedBy: item?.acceptedBy,
          status: item?.status,
          completedTaskId: item.id,
          isWorkerConfirmed: false,
          isBulkRequest: false,
          workerStatus: "accepted",
        })) as TaskRecord[];

        const bulkConfirmedMapped = confirmedWorkerTasks.map((item) => ({
          ...item,
          user: item.user || item.requester || { userName: "Unknown User" },
          isWorkerConfirmed: true,
          workerStatus: "confirmed",
          isBulkRequest: true,
          acceptedBy: null,
          confirmedAt: item.userConfirmation?.confirmedAt || item.createdAt,
          userId: item.userId || item.requester?.userId,
        })) as TaskRecord[];
        newRecords = [...singleAcceptedMapped, ...bulkConfirmedMapped];
      } else {
        // Active & Past tabs both query Active status and then split
        // client-side by schedule date. Load a large page so past tasks
        // don't consume the page and hide future ones (keeps the Active
        // count consistent with the Post dashboard).
        const { tasksArray, lastVisible: lv } = await getMyReuqests(
          param,
          islastVisiblePost,
          param === REQUEST_STATUS.Active ? 200 : undefined,
        );
        newRecords = tasksArray;
        lastVisible = lv;
        // For tasks where user is the requester, check if they have confirmed workers
        newRecords = newRecords.map((task) => ({
          ...task,
          isWorkerConfirmed: false,
          workerStatus: "owner",
          isBulkRequest: task.numberOfWorkers > 1,
        }));
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
            item?.otherCompensation || "",
          ),
        })),
      );

      // 🔹 Append or replace list
      if (islastVisiblePost) {
        setTaskRecords((prev) => [...prev, ...translatedRecords]);
      } else {
        setTaskRecords(translatedRecords);
        translatedRecords.forEach((task) => {
          if (task.acceptedBy && !task.isBulkRequest) {
            checkIfSingleTaskReviewed(task);
          }
        });
      }

      setLastVisiblePost(lastVisible);
      setHasMore(newRecords.length > 0);
      return translatedRecords;
    } catch (error) {
      console.log("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const filterChanged = lastFilterRef.current !== param;
      lastFilterRef.current = param;
      setInitialLoadDone(false);
      setLastVisiblePost(null);
      setExpandedCards({});
      setGroupChatMap({});
      // Only clear + show loader on first load or a real filter change.
      // On a plain re-focus, keep current cards and refresh in the background.
      if (filterChanged) setTaskRecords([]);
      fetchRequests(null, filterChanged).then(async (records) => {
        setInitialLoadDone(true);
        // Check group chat existence for confirmed bulk tasks in Accepted tab
        if (activeFilter === `${t("myRequests.txt10")}`) {
          const map: Record<string, boolean> = {};
          await Promise.all(
            (records || []).map(async (task: TaskRecord) => {
              if (task.isBulkRequest && task.id) {
                map[task.id] = await groupChatExists(task.id);
              }
            }),
          );
          setGroupChatMap(map);
        }
      });
    }, [param]),
  );

  // Live-patch volatile fields on the owner's Active tasks so confirmations,
  // cancellations and completions reflect immediately without a manual refocus.
  // We only patch fields that change at runtime and never touch the translated
  // text fields produced by fetchRequests, and we don't add/remove rows (the
  // paginated list composition stays owned by fetchRequests).
  useFocusEffect(
    useCallback(() => {
      // param is REQUEST_STATUS.Active for both the Active and Past tabs.
      if (!currentUserId || param !== REQUEST_STATUS.Active) return;

      const liveQuery = query(
        collection(db, "taskRequests"),
        where("userId", "==", currentUserId),
        where("status", "==", REQUEST_STATUS.Active),
      );

      const unsubscribe = onSnapshot(
        liveQuery,
        (snap) => {
          const freshById: Record<string, any> = {};
          snap.forEach((d) => {
            freshById[d.id] = d.data();
          });
          setTaskRecords((prev) =>
            prev.map((rec) => {
              const fresh = freshById[rec.id];
              if (!fresh) return rec;
              return {
                ...rec,
                confirmedWorkers:
                  fresh.confirmedWorkers ?? rec.confirmedWorkers,
                appliedWorkers: fresh.appliedWorkers ?? rec.appliedWorkers,
                acceptedBy: fresh.acceptedBy ?? null,
                status: fresh.status ?? rec.status,
                slotsAvailable: fresh.slotsAvailable ?? rec.slotsAvailable,
                numberOfWorkers: fresh.numberOfWorkers ?? rec.numberOfWorkers,
              };
            }),
          );
        },
        (err) => console.log("MyRequests live-patch error:", err),
      );

      return () => unsubscribe();
    }, [currentUserId, param]),
  );

  const refreshRequests = async () => {
    setRefreshing(true);
    setLastVisiblePost(null);
    setTaskRecords([]);
    setExpandedCards({});
    await fetchRequests(null);
    setRefreshing(false);
  };

  const fetchMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { tasksArray: newRecords, lastVisible } = await getMyReuqests(
        param,
        lastVisiblePost,
      );
      const translatedRecords = await Promise.all(
        (newRecords as TaskRecord[]).map(async (item) => ({
          ...item,
          title: await cachedTranslate(item?.title || ""),
          description: await cachedTranslate(item?.description || ""),
          taskType: await cachedTranslate(item?.taskType || ""),
          customTaskTitle: await cachedTranslate(item?.customTaskTitle || ""),
          otherCompensation: await cachedTranslate(
            item?.otherCompensation || "",
          ),
        })),
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

  // Add this function to send notifications to all confirmed helpers
  const sendBulkTaskCompletionNotification = async (task) => {
    try {
      const hasConfirmedHelpers =
        task.confirmedWorkers && task.confirmedWorkers.length > 0;
      // Notify every confirmed helper regardless of single/multi-helper. Only
      // fall back to the acceptedBy path when there are no confirmed helpers.
      if (!hasConfirmedHelpers) {
        if (task.acceptedBy) {
          await sendTaskCompletionPushNotification(task);
          await saveTaskCompletionNotification(task);
        }
        return;
      }
      const notificationPromises = [];
      task?.confirmedWorkers.forEach((worker) => {
        if (worker && worker.token) {
          notificationPromises.push(
            sendPushToUser({
              userId: worker.userId,
              token: worker.token,
              title:
                t("pushNotifications.bulkTaskCompleted.title") ||
                "Task Completed!",
              body:
                t("pushNotifications.bulkTaskCompleted.body", {
                  taskName: task.taskType,
                  requesterName: task.user?.userName || "The requester",
                }) ||
                `The task "${
                  task.taskType
                }" has been marked as completed by ${
                  task.user?.userName || "the requester"
                }`,
              data: {
                type: "bulk_task_completion",
                taskId: task.id,
                taskType: task.taskType,
              },
            }),
          );
        }
      });

      // Save notifications to Firestore for each helper
      task?.confirmedWorkers.forEach((worker) => {
        if (worker && worker.userId) {
          notificationPromises.push(
            addDoc(collection(db, "notifications"), {
              sender: {
                userId: task.userId,
                userName: task.user?.userName,
                email: task.user?.email,
                profileImage: task.user?.profileImage || null,
                token: task.user?.token,
              },
              receiver: {
                userId: worker.userId,
                userName: worker.userName,
                email: worker.email,
                token: worker.token,
              },
              task: {
                taskId: task.id,
                taskType: task.taskType,
                description: task.description,
              },
              type: "bulk_task_completion",
              title:
                t("pushNotifications.bulkTaskCompleted.title") ||
                "Task Completed",
              message:
                t("pushNotifications.bulkTaskCompleted.message", {
                  taskName: task.taskType,
                }) ||
                `The task "${task.taskType}" has been marked as completed`,
              timestamp: new Date().toISOString(),
              isRead: false,
            }),
          );
        }
      });
      await Promise.all(notificationPromises);
    } catch (error) {
      console.log("Error sending bulk task completion notifications:", error);
    }
  };

  // Update the changeReqestStatus function to use the new notification logic
  const changeReqestStatus = async (i, status, item) => {
    setLoader(true);
    try {
      await updateReqestStatus(item.id, status, item);
      // Remove by id (the rendered list is filtered, so positional index
      // is not safe against the full taskRecords array).
      setTaskRecords((p) => p.filter((r) => r.id !== item.id));

      let action;
      if (status === REQUEST_STATUS.Completed) {
        action = `${t("toast.myRequests.three")}`;
        if (item.confirmedWorkers?.length > 0) {
          // Confirm-flow tasks (single- or multi-helper) notify each helper.
          await sendBulkTaskCompletionNotification(item);
        } else if (item.acceptedBy) {
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

  const repostRequest = (index, item) => {
    // Reposting opens the post form in "repost" mode so the user picks a NEW
    // schedule. On submit it reactivates this task fresh (status Active,
    // applicants/acceptedBy cleared) with the new date/time.
    navigation.navigate("PostRequest", {
      postRequest: item,
      title: `${t("postRequest.repostTitle")}`,
      repost: true,
    });
  };

  const FilterButton = ({ title, isActive, isFirst }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.filterButton,
        isActive && styles.activeFilterButton,
        isFirst && styles.firstFilterButton,
      ]}
      onPress={() => setActiveFilter(title)}
    >
      {isActive ? (
        <View style={styles.neonContainer}>
          <LinearGradient
            colors={[Colors.blue9, "#14225eff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.neonGradient}
          >
            <Text numberOfLines={1} style={styles.filterButtonTextActive}>
              {title}
            </Text>
          </LinearGradient>
          <View style={styles.neonGlow} />
        </View>
      ) : (
        <View
          style={[
            styles.inactiveButton,
            {
              borderColor: theme.border + "80",
              backgroundColor:
                theme.mode === "dark" ? theme.white + "05" : "white",
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.filterButtonTextInactive, { color: theme.heading }]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const postEditHandler = (cart, event) => {
    if (event) {
      event.stopPropagation();
    }
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

  const currentUser = useUser();

  const handleStartChat = useCallback(
    async (receiverUser, event) => {
      if (event) {
        event.stopPropagation();
      }
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
    [currentUserId, currentUser?.userData?.userName],
  );

  const handleOpenGroupChat = useCallback(
    (task: TaskRecord, event?: any) => {
      if (event) event.stopPropagation();
      navigation.navigate("GroupChat", {
        groupChatId: task.id,
        currentUserId,
        currentUserName: currentUser?.userData?.userName,
        taskType: task.taskType,
        customTaskTitle: task.customTaskTitle,
      });
    },
    [currentUserId, currentUser?.userData?.userName],
  );

  // Navigate to Task Applicants Screen
  const navigateToApplicantsScreen = (taskId, event) => {
    if (event) {
      event.stopPropagation();
    }
    navigation.navigate("TaskApplicantsScreen", {
      taskId: taskId,
    });
  };

  // Function to send push notification to task accepter (skips deleted accounts)
  async function sendTaskCompletionPushNotification(task) {
    try {
      await sendPushToUser({
        userId: task.acceptedBy?.userId,
        token: task.acceptedBy?.token,
        title: t("pushNotifications.txt3"),
        body: `${t("pushNotifications.txt4")} "${task.taskType}" ${t(
          "pushNotifications.txt5",
        )} ${task.user?.userName}`,
      });
    } catch (error) {
      console.log("sendTaskCompletionPushNotification error:", error);
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
    } catch (error) {
      console.log("Error saving task completion notification:", error);
    }
  };

  // Main function to handle task completion notifications
  const sendTaskCompletionNotification = async (task) => {
    try {
      await sendTaskCompletionPushNotification(task);
      await saveTaskCompletionNotification(task);
    } catch (error) {
      console.log("Error in task completion notification process:", error);
    }
  };

  const navigateToConfirmedHelpers = (task, event) => {
    if (event) {
      event.stopPropagation();
    }
    navigation.navigate("ConfirmedHelpers", {
      task: task,
    });
  };

  const checkIfSingleTaskReviewed = async (task) => {
    try {
      if (
        !task ||
        task.isBulkRequest ||
        !task.acceptedBy?.userId ||
        !currentUserId
      ) {
        return;
      }

      const reviewsRef = collection(db, "reviews");
      const reviewQuery = query(
        reviewsRef,
        where("taskId", "==", task.id),
        where("reviewedUserId", "==", task.acceptedBy.userId),
        where("reviewerId", "==", currentUserId),
      );

      const snapshot = await getDocs(reviewQuery);

      setReviewedSingleTasks((prev) => ({
        ...prev,
        [task.id]: !snapshot.empty,
      }));
    } catch (error) {
      console.log("Error checking single task review:", error);
    }
  };

  const navigateToOfferDetail = (task) => {
    navigation.navigate("OfferDetail", {
      postRequest: task,
      // Lets OfferDetail send its Back button here instead of Home — this
      // flag is only ever set on this navigation call, so every other route
      // into OfferDetail keeps its existing back behavior.
      fromMyRequests: true,
    });
  };

  // Active and Past share the same Active-status data; split it by schedule:
  // Active tab → upcoming/undated tasks, Past tab → tasks whose time elapsed.
  const isActiveTab = activeFilter === `${t("myRequests.txt2")}`;
  const isPastTab = activeFilter === `${t("myRequests.txt14")}`;
  const visibleRecords = taskRecords.filter((cart) => {
    if (isActiveTab) return !isPastTask(cart);
    if (isPastTab) return isPastTask(cart);
    return true;
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <Nav
        profileImage={profileImgUrl}
        leftLogo
        gradient
        gradientColors={[Colors.primary, Colors.blueDark3]}
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
            `${t("myRequests.txt14")}`,
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
        {visibleRecords.map((cart, index) => {
          const isConfirmedWorker = checkUserConfirmedStatus(cart);
          const isAppliedWorker = checkUserAppliedStatus(cart);
          const isTaskOwner = cart.userId === currentUserId;
          const isBulkRequest = cart.isBulkRequest || cart.numberOfWorkers > 1;
          const totalApplicants =
            (cart.appliedWorkers?.length || 0) +
            (cart.confirmedWorkers?.length || 0);
          const hasApplicants = totalApplicants > 0;

          // Bottom card actions (presentation grouping only — conditions unchanged)
          const canRepost =
            (activeFilter === `${t("myRequests.txt3")}` ||
              activeFilter === `${t("myRequests.txt8")}`) &&
            !isConfirmedWorker && // Workers can't repost
            !isAppliedWorker && // Applied workers can't repost
            !cart.repostedTo; // Already reposted — the new task exists
          const canViewHelpers =
            activeFilter === `${t("myRequests.txt3")}` && // Completed filter
            cart.status === REQUEST_STATUS.Completed &&
            isTaskOwner &&
            cart.confirmedWorkers?.length > 0;
          // Single-helper completed tasks (accepted via acceptedBy, not the
          // confirm flow) let the owner rate the one accepter directly.
          const canReviewSingleHelper =
            activeFilter === `${t("myRequests.txt3")}` && // Completed filter
            cart.status === REQUEST_STATUS.Completed &&
            isTaskOwner &&
            !!cart.acceptedBy?.userId &&
            !(cart.confirmedWorkers?.length > 0);
          const singleHelperReviewed = reviewedSingleTasks[cart.id];

          const scheduledDateTime = formatScheduledDateTime(cart);
          const durationLabel = getDurationLabel(cart);
          const selectedSubTasks = cart.selectedSubTasks || [];
          const displaySubTasks = showAllSubTasks[index]
            ? selectedSubTasks
            : selectedSubTasks.slice(0, 3);
          const hasMoreSubTasks = selectedSubTasks.length > 3;

          // Chevron rotation interpolation
          const rotate =
            rotateAnims[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "180deg"],
            }) || "0deg";

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigateToOfferDetail(cart)}
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
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {cart?.taskType === "Other"
                          ? cart.customTaskTitle
                          : cart?.taskType}
                      </Text>
                    </View>

                    {/* Reposted badge — this task was reposted as a new one;
                        this card is the preserved history of the previous run */}
                    {!!cart.repostedTo && (
                      <View style={styles.repostedBadge}>
                        <Ionicons
                          name="refresh-circle"
                          size={RFPercentage(1.5)}
                          color={Colors.white}
                          style={styles.ionicons}
                        />
                        <Text style={styles.repostedBadgeText}>
                          {t("myRequests.repostedBadge")}
                        </Text>
                      </View>
                    )}

                    {/* Worker Status Badge - Only for Accepted tab where user is worker */}
                    {activeFilter === `${t("myRequests.txt10")}` &&
                      (isConfirmedWorker || isAppliedWorker) && (
                        <View
                          style={[
                            styles.workerStatusBadge,
                            {
                              backgroundColor: isConfirmedWorker
                                ? Colors.green + "20"
                                : Colors.primary + "20",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              isConfirmedWorker
                                ? "checkmark-circle"
                                : "time-outline"
                            }
                            size={RFPercentage(1.5)}
                            color={
                              isConfirmedWorker ? Colors.green : Colors.primary
                            }
                            style={styles.ionicons}
                          />
                          <Text
                            style={[
                              styles.workerStatusText,
                              {
                                color: isConfirmedWorker
                                  ? Colors.green
                                  : Colors.primary,
                              },
                            ]}
                          >
                            {isConfirmedWorker
                              ? t("offerDetail.confirmed") || "Confirmed"
                              : t("offerDetail.applied") || "Applied"}
                          </Text>
                        </View>
                      )}

                    {cart.status === REQUEST_STATUS.Active &&
                      !isPastTask(cart) &&
                      !isConfirmedWorker &&
                      !isAppliedWorker &&
                      isTaskOwner && (
                        <View style={styles.cartWrapper}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={(event) => postEditHandler(cart, event)}
                          >
                            <Image
                              style={styles.edit}
                              source={Icons.editRequest}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                  </ImageBackground>
                )}
                keyExtractor={(item, index) => index.toString()}
              />

              {cart.imageUrls?.length > 1 && (
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

              {/* User Info with Expand/Collapse Button */}
              <View style={styles.cartInfoContainer}>
                <TouchableOpacity activeOpacity={1}>
                  {cart?.user?.profileImage ? (
                    <Image
                      style={styles.userImage}
                      source={{ uri: cart?.user?.profileImage }}
                    />
                  ) : (
                    <AvatarInitials
                      name={cart?.user?.userName}
                      textStyle={styles.avatarInitialsText}
                      style={[
                        styles.userImage,
                        styles.avatarInitials,
                      ]}
                    />
                  )}
                </TouchableOpacity>
                <Text
                  style={[styles.userName, { color: theme.heading }]}
                  numberOfLines={1}
                >
                  {cart?.user?.userName?.substr(0, 10) +
                    (cart?.user?.userName?.length > 10 ? "..." : "")}
                </Text>
                {activeFilter === `${t("myRequests.txt10")}` ? (
                  <Text style={[styles.postDate, { color: theme.darkGrey }]}>
                    {isConfirmedWorker && cart?.confirmedAt && (
                      <Text
                        style={styles.text}
                      >
                        {" "}
                        • {t("offerDetail.confirmedOn")}{" "}
                        {getRelativeConfirmedTime(cart?.confirmedAt)}
                      </Text>
                    )}
                  </Text>
                ) : (
                  <Text style={[styles.postDate, { color: theme.darkGrey }]}>
                    {`${t("myRequests.txt4")} ${getFormatedDate(
                      cart?.createdAt,
                    )}`}
                  </Text>
                )}

                {/* Expand/Collapse Button */}
                <TouchableOpacity
                  onPress={(event) => toggleExpand(index, event)}
                  style={[
                    styles.expandButton,
                    {
                      backgroundColor:
                        theme.mode === "light"
                          ? "rgba(222, 221, 224, 0.48)"
                          : "rgba(77, 77, 82, 0.33)",
                    },
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons
                      name="chevron-down"
                      size={RFPercentage(2.2)}
                      color={
                        theme.mode === "dark" ? Colors.darkGrey : Colors.primary
                      }
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>

              {/* Always Visible - Brief Description */}
              <View style={styles.briefDescriptionContainer}>
                <Text
                  style={[styles.briefDescription, { color: theme.darkGrey }]}
                >
                  {cart?.description?.substr(0, 100)}
                  {cart?.description?.length > 100 ? "..." : ""}
                </Text>
              </View>

              {/* Expandable Content */}
              {expandedCards[index] && (
                <View style={styles.expandableContent}>
                  {(scheduledDateTime || durationLabel) && (
                    <View style={styles.scheduledSection}>
                      {scheduledDateTime && (
                        <View style={styles.scheduledItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={RFPercentage(1.5)}
                            color={
                              theme.mode === "dark"
                                ? Colors.white
                                : theme.primary
                            }
                          />
                          <Text
                            style={[
                              styles.scheduledText,
                              { color: theme.darkGrey },
                            ]}
                          >
                            {scheduledDateTime}
                          </Text>
                        </View>
                      )}
                      {durationLabel && (
                        <View style={styles.scheduledItem}>
                          <Ionicons
                            name="time-outline"
                            size={RFPercentage(1.5)}
                            color={
                              theme.mode === "dark"
                                ? Colors.white
                                : theme.primary
                            }
                          />
                          <Text
                            style={[
                              styles.scheduledText,
                              { color: theme.darkGrey },
                            ]}
                          >
                            {durationLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Sub-Tasks */}
                  {selectedSubTasks?.length > 0 && (
                    <View style={styles.subTasksSection}>
                      <View style={styles.subTasksHeader}>
                        <Ionicons
                          name="list"
                          size={RFPercentage(1.5)}
                          color={
                            theme.mode === "dark" ? Colors.white : theme.primary
                          }
                        />
                        <Text
                          style={[
                            styles.subTasksTitle,
                            { color: theme.darkGrey },
                          ]}
                        >
                          {t("common.subTasks")}:
                        </Text>
                      </View>
                      <View style={styles.subTasksList}>
                        {displaySubTasks.map((subTask, idx) => (
                          <View
                            key={subTask.id || idx}
                            style={[
                              styles.subTaskTag,
                              {
                                backgroundColor:
                                  theme.mode === "dark"
                                    ? Colors.whiteAlpha10
                                    : `${Colors.primary}15`,
                              },
                            ]}
                          >
                            <FontAwesome5
                              name={subTask.icon || "tag"}
                              size={RFPercentage(1.1)}
                              color={
                                theme.mode === "dark"
                                  ? Colors.darkGrey
                                  : theme.primary
                              }
                            />
                            <Text
                              style={[
                                styles.subTaskText,
                                {
                                  color:
                                    theme.mode === "dark"
                                      ? Colors.darkGrey
                                      : Colors.primary,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {subTask.name}
                            </Text>
                          </View>
                        ))}
                        {hasMoreSubTasks && !showAllSubTasks[index] && (
                          <TouchableOpacity
                            onPress={(event) => toggleSubTasks(index, event)}
                            style={[
                              styles.subTaskTag,
                              { backgroundColor: theme.darkGrey + "10" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.subTaskText,
                                { color: theme.darkGrey },
                              ]}
                            >
                              +{selectedSubTasks.length - 3} {t("common.more")}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Bulk Request Info — "You are confirmed" badge only */}
                  {isBulkRequest && isConfirmedWorker && (
                    <View
                      style={[
                        styles.confirmedBadge,
                        styles.view,
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={RFPercentage(1.3)}
                        color={Colors.green}
                      />
                      <Text
                        style={[styles.confirmedText, styles.text4]}
                      >
                        {t("offerDetail.youAreConfirmed") ||
                          "You are confirmed"}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              

              {/* Compensation + Repost + View Applicants Button */}
              <View style={styles.taskInfoContainer}>
                <Text style={[styles.compensation, { color: theme.heading }]}>
                  {`${t("home.txt10")}`}:{" "}
                  <Text
                    style={[
                      styles.compensationAmount,
                      {
                        color:
                          theme.mode === "dark"
                            ? Colors.darkGrey
                            : Colors.primary,
                      },
                    ]}
                  >
                    {cart.compensationType === "Monitarely"
                      ? getConvertedCompensation(cart)
                      : cart.otherCompensation?.substr(0, 15) +
                        (cart.otherCompensation?.length > 15 ? "..." : "")}
                  </Text>
                </Text>
              </View>

              {/* Bottom card actions: View Helpers (secondary) + Repost (primary) */}
              {(canRepost || canViewHelpers || canReviewSingleHelper) && (
                <View style={styles.cardActionsRow}>
                  {canReviewSingleHelper &&
                    (singleHelperReviewed ? (
                      <View
                        style={[
                          styles.viewHelpersButton,
                          styles.view2,
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={RFPercentage(1.9)}
                          color={Colors.statusAlertSuccess}
                        />
                        <Text
                          style={[
                            styles.viewHelpersButtonText,
                            styles.text5,
                          ]}
                          numberOfLines={1}
                        >
                          {t("myRequests.reviewed")}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.viewHelpersButton,
                          {
                            borderColor: Colors.primary + "55",
                            backgroundColor:
                              theme.mode === "dark"
                                ? Colors.whiteAlpha10
                                : Colors.primary + "0D",
                          },
                        ]}
                        onPress={(event) => {
                          event.stopPropagation();
                          navigation.navigate("AddReviewToAccepter", {
                            // AddReviewToAccepter reads task.taskId; cart uses
                            // `id`, so pass it explicitly to link the review.
                            task: { ...cart, taskId: cart.id },
                          });
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="star"
                          size={RFPercentage(1.9)}
                          color={
                            theme.mode === "dark"
                              ? Colors.white
                              : Colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.viewHelpersButtonText,
                            {
                              color:
                                theme.mode === "dark"
                                  ? Colors.white
                                  : Colors.primary,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {t("myRequests.rateHelper")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  {canViewHelpers && (
                    <TouchableOpacity
                      style={[
                        styles.viewHelpersButton,
                        {
                          borderColor: Colors.primary + "55",
                          backgroundColor:
                            theme.mode === "dark"
                              ? Colors.whiteAlpha10
                              : Colors.primary + "0D",
                        },
                      ]}
                      onPress={(event) =>
                        navigateToConfirmedHelpers(cart, event)
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="people"
                        size={RFPercentage(1.9)}
                        color={
                          theme.mode === "dark" ? Colors.white : Colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.viewHelpersButtonText,
                          {
                            color:
                              theme.mode === "dark"
                                ? Colors.white
                                : Colors.primary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t("myRequests.viewConfirmedHelpers") || "View Helpers"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canRepost && (
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        repostRequest(index, cart);
                      }}
                      activeOpacity={0.85}
                      style={[
                        styles.repostButton,
                        (markLoaderIndex === index ||
                          repostingIndex === index) && { opacity: 0.7 },
                      ]}
                      disabled={
                        markLoaderIndex === index || repostingIndex === index
                      }
                    >
                      {repostingIndex === index ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Feather
                            name="repeat"
                            size={RFPercentage(1.9)}
                            color={Colors.white}
                          />
                          <Text
                            numberOfLines={1}
                            style={styles.repostButtonText}
                          >
                            {t("myRequests.txt9")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* For Accepted Tab - Show user's role */}
              {(cart?.acceptedBy || isConfirmedWorker) &&
                activeFilter === `${t("myRequests.txt10")}` && (
                  <>
                    <View
                      style={[styles.liner, { backgroundColor: theme.border }]}
                    />
                    <View style={styles.wrap2}>
                      <Text
                        style={[
                          styles.compensation,
                          { color: theme.heading, marginTop: 0, width: "45%" },
                        ]}
                      >
                        {isConfirmedWorker
                          ? t("offerDetail.youAreConfirmed") ||
                            "You are confirmed"
                          : `${t("myRequests.txt11")} ${
                              cart?.acceptedBy?.userName || t("common.you")
                            }`}
                      </Text>

                      <View style={styles.acceptedActions}>
                        {isBulkRequest &&
                        isConfirmedWorker &&
                        groupChatMap[cart.id] ? (
                          <>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              disabled={
                                markLoaderIndex === index ||
                                repostingIndex === index
                              }
                              style={[styles.abs]}
                              onPress={(event) =>
                                handleOpenGroupChat(cart, event)
                              }
                            >
                              <Ionicons
                                name="people"
                                size={RFPercentage(2.3)}
                                color={
                                  theme.mode === "dark"
                                    ? Colors.darkGrey
                                    : Colors.blueDark2
                                }
                              />
                              <Text
                                style={[
                                  styles.txt4,
                                  {
                                    color:
                                      theme.mode === "dark"
                                        ? Colors.darkGrey
                                        : Colors.blueDark2,
                                  },
                                ]}
                              >
                                {t("details.txt9")}
                              </Text>
                            </TouchableOpacity>
                            <ShareButton
                              jobId={cart.id}
                              jobTitle={
                                cart.taskType === "Other"
                                  ? cart.customTaskTitle
                                  : cart.taskType
                              }
                              jobDescription={cart.description}
                              companyName="Buez"
                              style={[
                                styles.shareButtonSmall,
                                {
                                  backgroundColor:
                                    theme.mode === "dark"
                                      ? Colors.black2
                                      : Colors.primary + "15",
                                  borderWidth: 1,
                                  borderColor:
                                    theme.mode === "dark"
                                      ? Colors.indigoAlpha20
                                      : Colors.primary + "30",
                                },
                              ]}
                              showLabel={false}
                              iconOnly={true}
                              color={
                                theme.mode === "dark"
                                  ? Colors.darkGrey
                                  : Colors.blueDark2
                              }
                            />
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              disabled={
                                markLoaderIndex === index ||
                                repostingIndex === index
                              }
                              onPress={(event) =>
                                handleStartChat(cart.user, event)
                              }
                              style={styles.abs}
                            >
                              <Image
                                source={Icons.messages}
                                resizeMode="contain"
                                style={styles.image}
                                tintColor={
                                  theme.mode === "dark"
                                    ? Colors.darkGrey
                                    : Colors.blueDark2
                                }
                              />
                              <Text
                                style={[
                                  styles.txt4,
                                  {
                                    color:
                                      theme.mode === "dark"
                                        ? Colors.darkGrey
                                        : Colors.blueDark2,
                                  },
                                ]}
                              >
                                {t("details.txt9")}
                              </Text>
                            </TouchableOpacity>

                            <ShareButton
                              jobId={cart.id}
                              jobTitle={
                                cart.taskType === "Other"
                                  ? cart.customTaskTitle
                                  : cart.taskType
                              }
                              jobDescription={cart.description}
                              companyName="Buez"
                              style={[
                                styles.shareButtonSmall,
                                {
                                  backgroundColor:
                                    theme.mode === "dark"
                                      ? Colors.black2
                                      : Colors.primary + "15",
                                  borderWidth: 1,
                                  borderColor:
                                    theme.mode === "dark"
                                      ? Colors.indigoAlpha20
                                      : Colors.primary + "30",
                                },
                              ]}
                              showLabel={false}
                              iconOnly={true}
                              color={
                                theme.mode === "dark"
                                  ? Colors.darkGrey
                                  : Colors.blueDark2
                              }
                            />
                          </>
                        )}
                      </View>
                    </View>
                  </>
                )}

              {activeFilter === `${t("myRequests.txt2")}` &&
                cart?.status === REQUEST_STATUS.Active &&
                isTaskOwner &&
                !isConfirmedWorker &&
                !isAppliedWorker && (
                  <View style={styles.cartContainer2}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.markButton]}
                      onPress={(event) =>
                        navigateToApplicantsScreen(cart.id, event)
                      }
                    >
                      <Text numberOfLines={1} style={styles.text2}>
                        {t("myRequests.view")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={
                        cancelLoaderIndex === index || repostingIndex === index
                      }
                      onPress={async (event) => {
                        event.stopPropagation();
                        setCancelLoaderIndex(index);
                        setSelectedRequestIndex(index);
                        setSelectedRequestItem(cart);
                        setIsModalVisible(true);
                        setCancelLoaderIndex(null);
                      }}
                      style={[
                        styles.cancel,
                        {
                          borderColor:
                            theme.mode === "dark"
                              ? theme.border
                              : theme.darkGrey,
                        },
                      ]}
                    >
                      {cancelLoaderIndex === index ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.lightGrey}
                        />
                      ) : (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.text3,
                            {
                              color: theme.darkGrey,
                            },
                          ]}
                        >
                          {t("myRequests.txt6")}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <ShareButton
                      jobId={cart.id}
                      jobTitle={
                        cart.taskType === "Other"
                          ? cart.customTaskTitle
                          : cart.taskType
                      }
                      jobDescription={cart.description}
                      companyName="Buez"
                      style={[
                        styles.shareButtonSmall,
                        {
                          backgroundColor:
                            theme.mode === "dark"
                              ? Colors.black2
                              : Colors.primary + "15",
                          borderWidth: 1,
                          borderColor:
                            theme.mode === "dark"
                              ? Colors.indigoAlpha20
                              : Colors.primary + "30",
                        },
                      ]}
                      showLabel={false}
                      iconOnly={true}
                      color={theme.mode === "dark" ? Colors.darkGrey : Colors.blueDark2}
                    />
                  </View>
                )}

              {/* Past tab actions: View Helpers + Mark as Done */}
              {activeFilter === `${t("myRequests.txt14")}` &&
                cart?.status === REQUEST_STATUS.Active &&
                isTaskOwner &&
                !isConfirmedWorker &&
                !isAppliedWorker && (
                  <View style={styles.cartContainer2}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.cancel,
                        { width: "48%", borderColor: theme.darkGrey },
                      ]}
                      onPress={(event) =>
                        navigateToConfirmedHelpers(cart, event)
                      }
                    >
                      <Text
                        numberOfLines={1}
                        style={[styles.text3, { color: theme.darkGrey }]}
                      >
                        {t("myRequests.viewConfirmedHelpers")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={markLoaderIndex === index}
                      style={[
                        styles.markButton,
                        {
                          width: "48%",
                          opacity: markLoaderIndex === index ? 0.5 : 1,
                        },
                      ]}
                      onPress={async (event) => {
                        event.stopPropagation();
                        setMarkLoaderIndex(index);
                        await changeReqestStatus(
                          index,
                          REQUEST_STATUS.Completed,
                          cart,
                        );
                        setMarkLoaderIndex(null);
                      }}
                    >
                      {markLoaderIndex === index ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text numberOfLines={1} style={styles.text2}>
                          {t("myRequests.txt5")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
            </TouchableOpacity>
          );
        })}

        {(loading || loadingMore) && (
          <View style={styles.view3}>
            <ActivityIndicator
              size="large"
              color={theme.mode === "dark" ? Colors.darkGrey : Colors.primary}
            />
            <Text
              style={[
                styles.empty,
                {
                  color:
                    theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
                },
              ]}
            >
              {t("myRequests.txt13")}
            </Text>
          </View>
        )}

        {!loading && visibleRecords.length === 0 && (
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
              selectedRequestItem,
            );
            setIsModalVisible(false);
          }
        }}
        title={t("myRequests.txt7")}
        theme={theme}
        t={t}
        loading={loader}
        message={""}
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
  // Add to your existing styles
  completedActionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: RFPercentage(1),
    // marginTop: RFPercentage(1),
    paddingHorizontal: RFPercentage(2),
    alignSelf: "flex-start",
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.green + "20",
    borderRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    gap: RFPercentage(0.5),
    marginTop: RFPercentage(1),
  },
  addReviewText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  cartContainer: {
    width: "90%",
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: RFPercentage(2),
    marginTop: RFPercentage(3.6),
    position: "relative",
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
  repostedBadge: {
    position: "absolute",
    left: 0,
    top: 0,
    borderBottomRightRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.6),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary2,
  },
  repostedBadgeText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  workerStatusBadge: {
    position: "absolute",
    left: 0,
    top: 0,
    borderBottomRightRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.6),
    flexDirection: "row",
    alignItems: "center",
  },
  workerStatusText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(0.5),
  },
  confirmedText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.5),
  },
  dotsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: RFPercentage(1),
  },
  filterScrollContainer: {
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
  },

  cartInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    marginVertical: RFPercentage(2),
    marginTop: RFPercentage(1),
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
    flex: 1,
  },
  text2: {
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    textAlign: "center",
  },
  postDate: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    marginRight: RFPercentage(1),
  },
  expandButton: {
    padding: RFPercentage(0.2),
    backgroundColor: Colors.greyLightAlpha48,
    borderRadius: RFPercentage(100),
  },
  briefDescriptionContainer: {
    width: "92%",
    marginBottom: RFPercentage(0.3),
    paddingHorizontal: RFPercentage(0.5),
  },
  briefDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
  },
  expandableContent: {
    width: "92%",
    marginTop: RFPercentage(1),
  },
  scheduledSection: {
    marginBottom: RFPercentage(1.5),
  },
  scheduledItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(0.5),
  },
  scheduledText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(0.8),
    flex: 1,
  },
  subTasksSection: {
    marginBottom: RFPercentage(1.5),
  },
  subTasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(0.8),
  },
  subTasksTitle: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },
  subTasksList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  subTaskTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(1.2),
    marginRight: RFPercentage(0.8),
    marginBottom: RFPercentage(0.5),
  },
  subTaskText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.4),
  },
  fullDescriptionContainer: {
    marginBottom: RFPercentage(1.5),
  },
  fullDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  taskInfoContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    marginTop: RFPercentage(0.5),
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
    fontSize: RFPercentage(1.6),
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
    borderRadius: RFPercentage(2),
    height: RFPercentage(5),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    width: "38%",
    paddingVertical: RFPercentage(1),
  },
  cancel: {
    borderRadius: RFPercentage(2),
    width: "38%",
    height: RFPercentage(5),
    borderWidth: RFPercentage(0.15),
    justifyContent: "center",
    alignItems: "center",
    // position: "absolute",
    // right: 0,
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
  cardActionsRow: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginTop: RFPercentage(1.5),
  },
  repostButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.8),
    backgroundColor: Colors.primary,
    height: RFPercentage(5.2),
    borderRadius: RFPercentage(1.8),
  },
  repostButtonText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.7),
  },
  viewHelpersButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.8),
    height: RFPercentage(5.2),
    borderRadius: RFPercentage(1.8),
    borderWidth: 1,
  },
  viewHelpersButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.6),
  },
  txt: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.4),
    marginRight: RFPercentage(0.5),
  },
  liner: {
    width: "90%",
    height: RFPercentage(0.1),
    alignSelf: "center",
    marginVertical: RFPercentage(2),
  },
  wrap2: {
    width: "92%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txt3: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    marginLeft: RFPercentage(0.4),
  },
  press: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: RFPercentage(1),
    borderRadius: RFPercentage(1),
  },
  abs: {
    // position: "absolute",
    // right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: RFPercentage(1.2),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(0.6),
  },
  txt4: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    marginLeft: RFPercentage(0.4),
  },
  empty: {
    color: Colors.primary,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(0.5),
  },

  // New styles for View Applicants button
  viewApplicantsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: RFPercentage(100),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    gap: RFPercentage(0.5),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: "flex-start",
    marginLeft: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  viewApplicantsText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },

  filterButton: {
    marginRight: RFPercentage(1.5),
    marginVertical: RFPercentage(0.5),
  },
  neonContainer: {
    position: "relative",
    borderRadius: 25,
    overflow: "hidden",
  },
  neonGradient: {
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(1.3),
    borderRadius: 25,
    position: "relative",
    zIndex: 2,
  },
  neonGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    backgroundColor: "#243683ff",
    opacity: 0.5,
    zIndex: 1,
    shadowColor: Colors.blue16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  inactiveButton: {
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(1.3),
    borderRadius: 25,
    borderWidth: 1.5,
  },
  filterButtonTextActive: {
    color: "white",
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    textShadowColor: Colors.blackAlpha30,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  filterButtonTextInactive: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
  },
  activeFilterButton: {
    transform: [{ scale: 1.05 }],
  },
  firstFilterButton: {
    marginLeft: RFPercentage(2),
  },
  reviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1.5),
    backgroundColor: Colors.green + "20",
    borderRadius: RFPercentage(1),
  },

  reviewedText: {
    marginLeft: RFPercentage(0.5),
    color: Colors.green,
    fontSize: RFPercentage(1.3),
    fontWeight: "500",
  },

  shareButtonSmall: {
    marginRight: RFPercentage(1),
    width: RFPercentage(5),
    height: RFPercentage(5),
  },

  cartContainer2: {
    width: "92%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },

  acceptedActions: {
    // position: "absolute",
    // right: 0,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    // backgroundColor: "red",
  },
  ionicons: { marginRight: RFPercentage(0.3) },
  avatarInitialsText: {
                        fontSize: RFPercentage(2),
                        lineHeight: RFPercentage(4),
                      },
  avatarInitials: { borderWidth: RFPercentage(0) },
  text: {
                          color: Colors.green,
                          fontSize: RFPercentage(1.2),
                        },
  view: { backgroundColor: Colors.green + "20" },
  text4: { color: Colors.green },
  view2: {
                            borderColor: Colors.statusAlertSuccess + "55",
                            backgroundColor: Colors.statusAlertSuccess + "12",
                          },
  text5: { color: Colors.statusAlertSuccess },
  image: {
                                  width: RFPercentage(2.3),
                                  height: RFPercentage(2.3),
                                },
  view3: { marginTop: RFPercentage(28) },
});
