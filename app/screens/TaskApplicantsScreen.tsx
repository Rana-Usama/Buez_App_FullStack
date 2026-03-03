import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import CustomNav from "../components/common/CustomNav";
import Toast from "react-native-toast-message";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  getFirestore,
  collection,
  addDoc,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import {
  createOrUpdateGroupChat,
  removeMemberFromGroupChat,
} from "../services/GroupChat.service";

const { width } = Dimensions.get("window");

// Custom Modal Component
const ConfirmationModal = ({
  visible,
  onClose,
  title,
  message,
  type = "info",
  buttons,
}) => {
  const { theme } = useAppTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getTypeColors = () => {
    switch (type) {
      case "warning":
        return {
          primary: "#FF9800",
          gradient: ["#FF9800", "#F57C00"],
          icon: "alert-circle",
          iconColor: "#FF9800",
        };
      case "success":
        return {
          primary: "#4CAF50",
          gradient: ["#4CAF50", "#2E7D32"],
          icon: "checkmark-circle",
          iconColor: "#4CAF50",
        };
      case "error":
        return {
          primary: "#F44336",
          gradient: ["#F44336", "#D32F2F"],
          icon: "close-circle",
          iconColor: "#F44336",
        };
      case "info":
      default:
        return {
          primary: Colors.primary,
          gradient: [Colors.primary, "#314495"],
          icon: "information-circle",
          iconColor: Colors.primary,
        };
    }
  };

  const typeColors = getTypeColors();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          modalStyles.modalOverlay,
          {
            opacity: fadeAnim,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        ]}
      >
        <TouchableOpacity
          style={modalStyles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              modalStyles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: theme.white,
              },
            ]}
          >
            {/* Header with gradient */}
            <LinearGradient
              colors={typeColors.gradient}
              style={modalStyles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={modalStyles.headerContent}>
                <Ionicons
                  name={typeColors.icon}
                  size={RFPercentage(2.5)}
                  color="#FFF"
                />
                <Text style={modalStyles.modalTitle}>{title}</Text>
              </View>
            </LinearGradient>

            {/* Body */}
            <View style={modalStyles.modalBody}>
              <Text
                style={[modalStyles.modalMessage, { color: theme.heading }]}
              >
                {message}
              </Text>
            </View>

            {/* Buttons */}
            <View style={modalStyles.modalButtons}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    modalStyles.button,
                    button.style === "destructive" &&
                      modalStyles.destructiveButton,
                    button.style === "primary" && modalStyles.primaryButton,
                    buttons.length === 1 && modalStyles.singleButton,
                  ]}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      button.style === "primary"
                        ? typeColors.gradient
                        : button.style === "destructive"
                          ? ["#FF5252", "#D32F2F"]
                          : [theme.border, theme.border + "80"]
                    }
                    style={[
                      modalStyles.buttonGradient,
                      button.style === "cancel" &&
                        modalStyles.cancelButtonGradient,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text
                      style={[
                        modalStyles.buttonText,
                        button.style === "cancel" && { color: theme.heading },
                        (button.style === "primary" ||
                          button.style === "destructive") && {
                          color: "#FFF",
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: RFPercentage(2.5),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(3),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
  },
  modalTitle: {
    color: "#FFF",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    flex: 1,
  },
  modalBody: {
    padding: RFPercentage(3),
  },
  modalMessage: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2.2),
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(2),
    gap: RFPercentage(1),
  },
  button: {
    flex: 1,
    borderRadius: RFPercentage(1.5),
    overflow: "hidden",
    height: RFPercentage(5),
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonGradient: {
    backgroundColor: "transparent",
  },
  primaryButton: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destructiveButton: {
    shadowColor: "#F44336",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  singleButton: {
    width: "100%",
  },
  buttonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
});

const TaskApplicantsScreen = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { taskId } = route.params;
  const currentUser = useUser();
  const db = FIREBASE_DB;

  console.log("currentUser.............", currentUser.userData);

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [appliedWorkers, setAppliedWorkers] = useState([]);
  const [confirmedWorkers, setConfirmedWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState("applied"); // "applied" or "confirmed"
  const [confirmingWorker, setConfirmingWorker] = useState(null);
  const [removingWorker, setRemovingWorker] = useState(null);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  // Show Modal Function
  const showModal = (title, message, type = "info", buttons) => {
    setModalConfig({
      title,
      message,
      type,
      buttons,
    });
    setModalVisible(true);
  };

  // Hide Modal Function
  const hideModal = () => {
    setModalVisible(false);
  };

  // Fetch task data
  const fetchTaskData = async () => {
    try {
      setLoading(true);
      const taskDocRef = doc(db, "taskRequests", taskId);
      const docSnap = await getDoc(taskDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTaskData({
          id: docSnap.id,
          ...data,
        });

        // Set workers
        setAppliedWorkers(
          Array.isArray(data.appliedWorkers) ? data.appliedWorkers : [],
        );
        setConfirmedWorkers(
          Array.isArray(data.confirmedWorkers) ? data.confirmedWorkers : [],
        );
      } else {
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("taskApplicants.toast.error.taskNotFound"),
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("taskApplicants.toast.error.loadFailed"),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!taskId) return;
    const taskDocRef = doc(db, "taskRequests", taskId);
    const unsubscribe = onSnapshot(taskDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppliedWorkers(
          Array.isArray(data.appliedWorkers) ? data.appliedWorkers : [],
        );
        setConfirmedWorkers(
          Array.isArray(data.confirmedWorkers) ? data.confirmedWorkers : [],
        );
      }
    });

    return () => unsubscribe();
  }, [taskId]);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      fetchTaskData();
    }, [taskId]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTaskData();
  };

  // Send confirmation notification
  const sendConfirmationNotification = async (worker) => {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: worker.token,
            title: "🎉 Application Confirmed!",
            body: `You have been confirmed for "${taskData?.taskType}" task`,
            data: {
              type: "bulk_request_confirmation",
              postId: taskId,
            },
          }),
        },
      );
      return await response.text();
    } catch (error) {
      console.log("Confirmation notification error:", error);
    }
  };

  // Send removal notification
  const sendRemovalNotification = async (worker) => {
    try {
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: worker.token,
            title: "Helper Status Updated",
            body: `Your confirmation for task "${taskData?.taskType}" has been removed`,
            data: {
              type: "confirmation_removed",
              postId: taskId,
            },
          }),
        },
      );
      return await response.text();
    } catch (error) {
      console.log("Removal notification error:", error);
    }
  };

  const handleConfirmWorker = (worker) => {
    if (
      taskData?.numberOfWorkers &&
      confirmedWorkers.length >= taskData.numberOfWorkers
    ) {
      showModal(
        t("taskApplicants.limitReached.title"),
        t("taskApplicants.limitReached.message", {
          count: taskData.numberOfWorkers,
        }),
        "warning",
        [
          {
            text: t("common.ok"),
            style: "primary",
          },
        ],
      );
      return;
    }

    // Check if we're about to exceed the limit
    if (
      taskData?.numberOfWorkers &&
      confirmedWorkers.length + 1 > taskData.numberOfWorkers
    ) {
      showModal(
        t("taskApplicants.cannotConfirm.title"),
        t("taskApplicants.cannotConfirm.message", {
          required: taskData.numberOfWorkers,
          confirmed: confirmedWorkers.length,
        }),
        "warning",
        [
          {
            text: t("common.ok"),
            style: "primary",
          },
        ],
      );
      return;
    }

    // Check if worker is already confirmed
    const isAlreadyConfirmed = confirmedWorkers.some(
      (w) => w.userId === worker.userId,
    );
    if (isAlreadyConfirmed) {
      showModal(
        t("taskApplicants.alreadyConfirmed.title"),
        t("taskApplicants.alreadyConfirmed.message", {
          name: worker.userName,
        }),
        "info",
        [
          {
            text: t("common.ok"),
            style: "primary",
          },
        ],
      );
      return;
    }

    // Proceed with confirmation
    showModal(
      t("taskApplicants.confirmDialog.title"),
      t("taskApplicants.confirmDialog.message", {
        name: worker.userName,
        current: confirmedWorkers.length + 1,
        total: taskData?.numberOfWorkers || 1,
      }),
      "info",
      [
        {
          text: t("taskApplicants.confirmDialog.cancel"),
          style: "cancel",
          onPress: () => hideModal(),
        },
        {
          text: t("taskApplicants.confirmDialog.confirm"),
          style: "primary",
          onPress: () => {
            confirmWorker(worker);
            hideModal();
          },
        },
      ],
    );
  };

  const confirmWorker = async (worker) => {
    if (!taskData || !worker) return;

    if (
      taskData?.numberOfWorkers &&
      confirmedWorkers.length >= taskData.numberOfWorkers
    ) {
      Toast.show({
        type: "error",
        text1: t("taskApplicants.limitReached.title"),
        text2: t("taskApplicants.limitReached.message", {
          count: taskData.numberOfWorkers,
        }),
      });
      return;
    }

    try {
      setConfirmingWorker(worker.userId);
      const taskDocRef = doc(db, "taskRequests", taskId);

      const updatedApplied = appliedWorkers.filter(
        (w) => w.userId !== worker.userId,
      );

      const confirmationData = {
        ...worker,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUser?.userData?.userId,
      };
      const updatedConfirmed = [...confirmedWorkers, confirmationData];

      // Update Firestore task doc
      await updateDoc(taskDocRef, {
        appliedWorkers: updatedApplied,
        confirmedWorkers: updatedConfirmed,
      });

      // ── GROUP CHAT INTEGRATION ──────────────────────────────
      await createOrUpdateGroupChat(
        taskId,
        {
          userId: currentUser?.userData?.userId,
          userName: currentUser?.userData?.userName,
          profileImage: currentUser?.userData?.profileImage || "",
          token: currentUser?.userData?.token || "",
        },
        {
          userId: worker.userId,
          userName: worker.userName,
          profileImage: worker.profileImage || "",
          token: worker.token || "",
        },
        taskData?.taskType,
        taskData?.customTaskTitle,
        taskData?.description

      );
      // ────────────────────────────────────────────────────────

      await sendConfirmationNotification(worker);

      Toast.show({
        type: "success",
        text1: t("taskApplicants.toast.success.helperConfirmed"),
        text2: t("taskApplicants.toast.success.confirmedMessage", {
          name: worker.userName,
          current: updatedConfirmed.length,
          total: taskData?.numberOfWorkers || 1,
        }),
      });
    } catch (error) {
      console.error("Error confirming worker:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("taskApplicants.toast.error.confirmFailed"),
      });
    } finally {
      setConfirmingWorker(null);
    }
  };

  // Unconfirm/Remove worker
  const handleRemoveWorker = (worker) => {
    showModal(
      t("taskApplicants.removeDialog.title"),
      t("taskApplicants.removeDialog.message", {
        name: worker.userName,
      }),
      "primary",
      [
        {
          text: t("taskApplicants.removeDialog.cancel"),
          style: "cancel",
          onPress: () => hideModal(),
        },
        {
          text: t("taskApplicants.removeDialog.remove"),
          style: "destructive",
          onPress: () => {
            removeWorker(worker);
            hideModal();
          },
        },
      ],
    );
  };

  const removeWorker = async (worker) => {
    if (!taskData || !worker) return;

    try {
      setRemovingWorker(worker.userId);
      const taskDocRef = doc(db, "taskRequests", taskId);

      const updatedConfirmed = confirmedWorkers.filter(
        (w) => w.userId !== worker.userId,
      );
      const updatedApplied = [...appliedWorkers, worker];

      await updateDoc(taskDocRef, {
        appliedWorkers: updatedApplied,
        confirmedWorkers: updatedConfirmed,
      });

      // ── GROUP CHAT INTEGRATION ──────────────────────────────
      await removeMemberFromGroupChat(taskId, worker);

      await sendRemovalNotification(worker);

      Toast.show({
        type: "info",
        text1: t("taskApplicants.toast.info.helperRemoved"),
        text2: t("taskApplicants.toast.info.removedMessage", {
          name: worker.userName,
        }),
      });
    } catch (error) {
      console.error("Error removing worker:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("taskApplicants.toast.error.removeFailed"),
      });
    } finally {
      setRemovingWorker(null);
    }
  };

  // View worker profile
  const viewWorkerProfile = (worker, isConfirmed = false) => {
    navigation.navigate("TopRatedUserProfile", {
      user: worker,
      applier: !isConfirmed,
      postRequest: taskData,
    });
  };

  // Render worker item
  const renderWorkerItem = ({ item, index }) => {
    const isConfirmed = activeTab === "confirmed";
    const isConfirming = confirmingWorker === item.userId;
    const isRemoving = removingWorker === item.userId;
    const isLimitReached =
      taskData?.numberOfWorkers &&
      confirmedWorkers.length >= taskData.numberOfWorkers;

    return (
      <View
        style={[
          styles.workerCard,
          {
            backgroundColor: theme.white,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Worker Info */}
        <TouchableOpacity
          style={styles.workerInfo}
          onPress={() => viewWorkerProfile(item, isConfirmed)}
          activeOpacity={0.7}
        >
          <Image
            source={item.profileImage ? { uri: item.profileImage } : Icons.dp}
            style={styles.workerAvatar}
          />
          <View style={styles.workerDetails}>
            <Text style={[styles.workerName, { color: theme.heading }]}>
              {item.userName}
            </Text>
            <View style={styles.workerMeta}>
              <Ionicons
                name="mail"
                size={RFPercentage(1.4)}
                color={theme.darkGrey}
              />
              <Text
                style={[styles.workerEmail, { color: theme.darkGrey }]}
                numberOfLines={1}
              >
                {item.email || t("taskApplicants.noEmail")}
              </Text>
            </View>
            {isConfirmed && item.confirmedAt && (
              <View style={styles.workerMeta}>
                <Ionicons
                  name="time"
                  size={RFPercentage(1.4)}
                  color="#4CAF50"
                />
                <Text style={[styles.confirmedTime, { color: "#4CAF50" }]}>
                  {t("taskApplicants.confirmedTime")}{" "}
                  {new Date(item.confirmedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isConfirmed ? (
            // For confirmed workers: Remove button
            <TouchableOpacity
              style={[styles.removeButton, isRemoving && styles.buttonDisabled]}
              onPress={() => handleRemoveWorker(item)}
              disabled={isRemoving}
              activeOpacity={0.7}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons
                    name="close-circle"
                    size={RFPercentage(1.8)}
                    color="#FFF"
                  />
                  <Text style={styles.removeButtonText}>
                    {t("taskApplicants.remove")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            // For applied workers: Confirm button
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (isConfirming || isLimitReached) && styles.buttonDisabled,
              ]}
              onPress={() => handleConfirmWorker(item)}
              disabled={isConfirming || isLimitReached}
              activeOpacity={0.7}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons
                    name={
                      isLimitReached ? "checkmark-done" : "checkmark-circle"
                    }
                    size={RFPercentage(1.8)}
                    color="#FFF"
                  />
                  <Text style={styles.confirmButtonText}>
                    {isLimitReached
                      ? t("taskApplicants.allSlotsFilled")
                      : t("taskApplicants.confirm")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* View Profile Button */}
          <TouchableOpacity
            style={[styles.profileButton]}
            onPress={() => viewWorkerProfile(item, isConfirmed)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person"
              size={RFPercentage(1.8)}
              color={Colors.primary}
            />
            <Text style={[styles.profileButtonText, { color: Colors.primary }]}>
              {t("taskApplicants.profile")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Empty state component
  const EmptyState = ({ message, icon }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={icon}
        size={RFPercentage(6)}
        color={theme.darkGrey + "60"}
      />
      <Text style={[styles.emptyText, { color: theme.darkGrey }]}>
        {message}
      </Text>
    </View>
  );

  // Task header component
  const TaskHeader = () => {
    const requiredWorkers = taskData?.numberOfWorkers || 1;
    const isFull = confirmedWorkers.length >= requiredWorkers;
    const availableSpots = requiredWorkers - confirmedWorkers.length;

    return (
      <View style={[styles.taskHeader, { backgroundColor: theme.white }]}>
        <View style={styles.taskHeaderContent}>
          <View
            style={[
              styles.taskTypeBadge,
              { backgroundColor: Colors.primary + "20" },
            ]}
          >
            <Ionicons
              name="briefcase"
              size={RFPercentage(2)}
              color={Colors.primary}
            />
            <Text style={[styles.taskTypeText, { color: Colors.primary }]}>
              {taskData?.taskType === "Other"
                ? taskData?.customTaskTitle
                : taskData?.taskType}
            </Text>
          </View>

          <Text
            style={[styles.taskTitle, { color: theme.heading }]}
            numberOfLines={2}
          >
            {taskData?.description || t("taskApplicants.noDescription")}
          </Text>

          <View
            style={[
              styles.taskStats,
              {
                backgroundColor:
                  theme.mode === "dark" ? theme.primary + "20" : "#F8F9FA",
              },
            ]}
          >
            <View style={styles.statItem}>
              <Ionicons
                name="people"
                size={RFPercentage(2)}
                color={theme.darkGrey}
              />
              <Text style={[styles.statValue, { color: theme.heading }]}>
                {requiredWorkers}
              </Text>
              <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
                {t("taskApplicants.helpersNeeded")}
              </Text>
            </View>

            <View
              style={[styles.statDivider, { backgroundColor: theme.border }]}
            />

            <View style={styles.statItem}>
              <Ionicons
                name="checkmark-circle"
                size={RFPercentage(2)}
                color="#4CAF50"
              />
              <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                {confirmedWorkers.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
                {t("taskApplicants.confirmed")}
              </Text>
            </View>

            <View
              style={[styles.statDivider, { backgroundColor: theme.border }]}
            />

            <View style={styles.statItem}>
              <Ionicons
                name={isFull ? "checkmark-done-circle" : "alert-circle"}
                size={RFPercentage(2)}
                color={isFull ? "#4CAF50" : "#FF9800"}
              />
              <Text
                style={[
                  styles.statValue,
                  {
                    color: isFull ? "#4CAF50" : "#FF9800",
                  },
                ]}
              >
                {isFull
                  ? t("taskApplicants.full")
                  : t("taskApplicants.spotsLeft", { spots: availableSpots })}
              </Text>
              <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
                {t("taskApplicants.status")}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { backgroundColor: theme.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (confirmedWorkers.length / requiredWorkers) * 100,
                      100,
                    )}%`,
                    maxWidth: "100%",
                    backgroundColor: isFull ? "#4CAF50" : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.darkGrey }]}>
              {t("taskApplicants.progress", {
                current: confirmedWorkers.length,
                total: requiredWorkers,
              })}
            </Text>
          </View>

          {/* Status Alert */}
          {isFull && (
            <View
              style={[
                styles.statusAlert,
                { backgroundColor: "#4CAF50" + "20" },
              ]}
            >
              <Ionicons
                name="checkmark-done"
                size={RFPercentage(1.8)}
                color="#4CAF50"
              />
              <Text style={[styles.statusAlertText, { color: "#4CAF50" }]}>
                {t("taskApplicants.allHelpersConfirmed")}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.white }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
          {t("taskApplicants.loading")}
        </Text>
      </View>
    );
  }

  const currentWorkers =
    activeTab === "applied" ? appliedWorkers : confirmedWorkers;
  const emptyMessage =
    activeTab === "applied"
      ? t("taskApplicants.empty.applicants")
      : t("taskApplicants.empty.confirmed");
  const emptyIcon =
    activeTab === "applied" ? "person-add-outline" : "people-outline";

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />

      <CustomNav title={t("taskApplicants.title")} showBack />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={modalVisible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        buttons={modalConfig.buttons}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Task Header */}
        <TaskHeader />

        {/* Group Chat Button — shows when at least 1 worker confirmed */}
        {confirmedWorkers?.length > 0 && (
          <TouchableOpacity
            style={[
              groupChatButtonStyles.groupChatBtn,
              { backgroundColor: theme.secondary  },
            ]}
            onPress={() =>
              navigation.navigate("GroupChat", {
                groupChatId: taskId,
                currentUserId: currentUser?.userData?.userId,
                currentUserName: currentUser?.userData?.userName,
                taskType: taskData?.taskType,
                customTaskTitle: taskData?.customTaskTitle,
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={RFPercentage(2)} color="#FFF" />
            <Text numberOfLines={1} style={groupChatButtonStyles.groupChatBtnText}>
              {t("taskApplicants.group")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View
            style={[
              styles.tabsBackground,
              {
                backgroundColor: theme.mode === "dark" ? "#1A1A1A" : "#F1F3F5",
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === "applied" && styles.activeTab]}
              onPress={() => setActiveTab("applied")}
            >
              <LinearGradient
                colors={
                  activeTab === "applied"
                    ? ["#9ca0b4ff", "#a0a7c6ff"]
                    : ["transparent", "transparent"]
                }
                style={styles.tabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name="person-add"
                  size={RFPercentage(2)}
                  color={activeTab === "applied" ? "#FFF" : theme.darkGrey}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === "applied" ? "#FFF" : theme.darkGrey,
                    },
                  ]}
                >
                  {t("taskApplicants.applicantsTab")} ({appliedWorkers.length})
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "confirmed" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("confirmed")}
            >
              <LinearGradient
                colors={
                  activeTab === "confirmed"
                    ? ["#4CAF50", "#2E7D32"]
                    : ["transparent", "transparent"]
                }
                style={styles.tabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={RFPercentage(2)}
                  color={activeTab === "confirmed" ? "#FFF" : theme.darkGrey}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "confirmed" ? "#FFF" : theme.darkGrey,
                    },
                  ]}
                >
                  {t("taskApplicants.confirmedTab")} ({confirmedWorkers.length})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Workers List */}
        <View style={styles.listContainer}>
          {currentWorkers?.length > 0 ? (
            <FlatList
              data={currentWorkers}
              renderItem={renderWorkerItem}
              keyExtractor={(item, index) => `${item.userId}-${index}`}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState message={emptyMessage} icon={emptyIcon} />
          )}
        </View>

        {/* Help Text */}
        <View
          style={[
            styles.helpContainer,
            {
              backgroundColor: theme.mode === "dark" ? "#1A1A1A" : "#F8F9FA",
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={RFPercentage(2)}
            color={Colors.primary}
          />
          <Text style={[styles.helpText, { color: theme.darkGrey }]}>
            {activeTab === "applied"
              ? t("taskApplicants.help.applicants")
              : t("taskApplicants.help.confirmed")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const groupChatButtonStyles = StyleSheet.create({
  groupChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(3),
    borderRadius: RFPercentage(3),
    marginTop: RFPercentage(2),
    width: "40%",
    gap: RFPercentage(1),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // elevation: 5,
    alignSelf: "center",
  },
  groupChatBtnText: {
    color: "#FFF",
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: RFPercentage(2),
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: RFPercentage(4),
  },

  // Task Header
  taskHeader: {
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(4),
    paddingHorizontal: RFPercentage(3),
    borderBottomLeftRadius: RFPercentage(3),
    borderBottomRightRadius: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskHeaderContent: {
    alignItems: "center",
  },
  taskTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  taskTypeText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  taskTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(2),
    lineHeight: RFPercentage(2.4),
  },
  taskStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_700Bold",
    marginTop: RFPercentage(0.5),
    marginBottom: RFPercentage(0.3),
  },
  statLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
  },
  progressContainer: {
    width: "100%",
    marginTop: RFPercentage(1),
  },
  progressBar: {
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    overflow: "hidden",
    marginBottom: RFPercentage(0.5),
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: RFPercentage(0.5),
  },
  progressText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: RFPercentage(0.8),
  },
  statusAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1.5),
    marginTop: RFPercentage(2),
    gap: RFPercentage(0.8),
    width: "100%",
  },
  statusAlertText: {
    flex: 1,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  tabsBackground: {
    flexDirection: "row",
    borderRadius: RFPercentage(3),
    padding: RFPercentage(0.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    borderRadius: RFPercentage(3),
    overflow: "hidden",
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(2),
    gap: RFPercentage(0.8),
  },
  tabText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // List Container
  listContainer: {
    flex: 1,
    paddingHorizontal: RFPercentage(3),
  },
  listContent: {
    paddingBottom: RFPercentage(2),
  },

  // Worker Card
  workerCard: {
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  workerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  workerAvatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    marginRight: RFPercentage(1.5),
    borderWidth: 2,
    borderColor: Colors.primary + "40",
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  workerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(0.2),
    gap: RFPercentage(0.5),
  },
  workerEmail: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  confirmedTime: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: RFPercentage(1),
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.5),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5252",
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.5),
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButtonText: {
    color: "#FFF",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227, 227, 236, 0.61)",
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    gap: RFPercentage(0.5),
    borderColor: "rgba(227, 227, 236, 0.61)",
  },
  profileButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(8),
  },
  emptyText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(2),
    textAlign: "center",
    width: "80%",
  },

  // Help Container
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: RFPercentage(2),
    marginHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(1),
  },
  helpText: {
    flex: 1,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(1.8),
  },
});

export default TaskApplicantsScreen;
