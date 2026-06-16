import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import CustomNav from "../components/common/CustomNav";
import { useUser } from "../contexts/user.context";
import { cachedTranslate } from "../utils/cachedTranslations";

// ── COMPONENTS ──
import ConfirmationModal from "../components/TaskApplicants/ConfirmationModal";
import TaskHeader from "../components/TaskApplicants/TaskHeader";
import WorkerCard from "../components/TaskApplicants/WorkerCard";
import EmptyState from "../components/TaskApplicants/EmptyState";
import TabsSection from "../components/TaskApplicants/TabsSection";
import GroupChatButton from "../components/TaskApplicants/GroupChatButton";
import HelpText from "../components/TaskApplicants/HelpText";

import { useWorkerActions } from "../hooks/useWorkerActions";
import { useTaskData } from "../hooks/useTaskData";
import { TABS } from "../config/constants";
import { TranslatedTaskData, ModalConfig } from "../types/TaskApplicants/types";
import { RFPercentage } from "react-native-responsive-fontsize";
interface TaskApplicantsScreenProps {
  navigation: any;
  route: any;
}

const TaskApplicantsScreen: React.FC<TaskApplicantsScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { taskId } = route.params;
  const currentUser = useUser();

  // ── CUSTOM HOOKS ──
  const {
    loading,
    refreshing,
    taskData,
    appliedWorkers,
    confirmedWorkers,
    onRefresh,
    setAppliedWorkers,
    setConfirmedWorkers,
  } = useTaskData(taskId, () => navigation.goBack());

  const { confirmingWorker, removingWorker, confirmWorker, removeWorker } =
    useWorkerActions({
      taskId,
      taskData,
      currentUserId: currentUser?.userData?.userId || "",
      currentUserName: currentUser?.userData?.userName || "",
      currentUserProfileImage: currentUser?.userData?.profileImage,
      currentUserToken: currentUser?.userData?.token,
    });

  // ── LOCAL STATE ──
  const [activeTab, setActiveTab] = useState<"applied" | "confirmed">(
    TABS.APPLIED,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });
  const [translatedTaskData, setTranslatedTaskData] =
    useState<TranslatedTaskData>({
      taskType: "",
      customTaskTitle: "",
      description: "",
    });

  // ── TRANSLATION EFFECT ──
  useEffect(() => {
    const translateTaskHeader = async () => {
      if (!taskData) return;

      const [translatedTaskType, translatedCustomTitle, translatedDescription] =
        await Promise.all([
          cachedTranslate(taskData.taskType || ""),
          cachedTranslate(taskData.customTaskTitle || ""),
          cachedTranslate(taskData.description || ""),
        ]);

      setTranslatedTaskData({
        taskType: translatedTaskType,
        customTaskTitle: translatedCustomTitle,
        description: translatedDescription,
      });
    };

    translateTaskHeader();
  }, [taskData?.taskType, taskData?.customTaskTitle, taskData?.description]);

  // ── MODAL FUNCTIONS ──
  const showModal = useCallback(
    (
      title: string,
      message: string,
      type: "info" | "success" | "warning" | "error",
      buttons: any[],
    ) => {
      setModalConfig({ title, message, type, buttons });
      setModalVisible(true);
    },
    [],
  );

  const hideModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // ── WORKER CONFIRMATION HANDLER ──
  const handleConfirmWorker = useCallback(
    (worker: any) => {
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
          [{ text: t("common.ok"), style: "primary" }],
        );
        return;
      }

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
          [{ text: t("common.ok"), style: "primary" }],
        );
        return;
      }

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
          [{ text: t("common.ok"), style: "primary" }],
        );
        return;
      }

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
            onPress: hideModal,
          },
          {
            text: t("taskApplicants.confirmDialog.confirm"),
            style: "primary",
            onPress: async () => {
              await confirmWorker(worker, appliedWorkers, confirmedWorkers);
              hideModal();
            },
          },
        ],
      );
    },
    [
      taskData,
      confirmedWorkers,
      appliedWorkers,
      showModal,
      hideModal,
      confirmWorker,
      t,
    ],
  );

  // ── WORKER REMOVAL HANDLER ──
  const handleRemoveWorker = useCallback(
    (worker: any) => {
      showModal(
        t("taskApplicants.removeDialog.title"),
        t("taskApplicants.removeDialog.message", {
          name: worker.userName,
        }),
        "success",
        [
          {
            text: t("taskApplicants.removeDialog.cancel"),
            style: "cancel",
            onPress: hideModal,
          },
          {
            text: t("taskApplicants.removeDialog.remove"),
            style: "destructive",
            onPress: async () => {
              await removeWorker(worker, appliedWorkers, confirmedWorkers);
              hideModal();
            },
          },
        ],
      );
    },
    [appliedWorkers, confirmedWorkers, removeWorker, showModal, hideModal, t],
  );

  // ── PROFILE NAVIGATION ──
  const viewWorkerProfile = useCallback(
    (worker: any, isConfirmed: boolean) => {
      navigation.navigate("TopRatedUserProfile", {
        user: worker,
        applier: !isConfirmed,
        postRequest: taskData,
      });
    },
    [navigation, taskData],
  );

  // ── RENDER WORKER ITEM ──
  const renderWorkerItem = useCallback(
    ({ item }: any) => {
      const isConfirmed = activeTab === TABS.CONFIRMED;
      const isLimitReached =
        taskData?.numberOfWorkers &&
        confirmedWorkers.length >= taskData.numberOfWorkers;

      return (
        <WorkerCard
          worker={item}
          isConfirmed={isConfirmed}
          isConfirming={confirmingWorker === item.userId}
          isRemoving={removingWorker === item.userId}
          isLimitReached={isLimitReached}
          onConfirm={() => handleConfirmWorker(item)}
          onRemove={() => handleRemoveWorker(item)}
          onViewProfile={() => viewWorkerProfile(item, isConfirmed)}
          t={t}
        />
      );
    },
    [
      activeTab,
      taskData,
      confirmedWorkers.length,
      confirmingWorker,
      removingWorker,
      handleConfirmWorker,
      handleRemoveWorker,
      viewWorkerProfile,
      t,
    ],
  );

  // ── LOADING STATE ──
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.white }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── CURRENT DATA ──
  const currentWorkers =
    activeTab === TABS.APPLIED ? appliedWorkers : confirmedWorkers;
  const emptyMessage =
    activeTab === TABS.APPLIED
      ? t("taskApplicants.empty.applicants")
      : t("taskApplicants.empty.confirmed");
  const emptyIcon =
    activeTab === TABS.APPLIED ? "person-add-outline" : "people-outline";
  const helpMessage =
    activeTab === TABS.APPLIED
      ? t("taskApplicants.help.applicants")
      : t("taskApplicants.help.confirmed");

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* <CustomNav title={t("taskApplicants.title")} showBack /> */}

      {/* Modal */}
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
        <TaskHeader
          taskData={taskData}
          confirmedWorkers={confirmedWorkers}
          translatedTaskData={translatedTaskData}
          t={t}
          navigation={navigation}
          taskId={taskId}
          currentUser={currentUser}
        />

        {/* Tabs */}
        <TabsSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          appliedCount={appliedWorkers.length}
          confirmedCount={confirmedWorkers.length}
          t={t}
        />

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
        <HelpText message={helpMessage} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
});

export default TaskApplicantsScreen;
