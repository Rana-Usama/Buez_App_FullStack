import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { TaskData ,Worker} from "../types/TaskApplicants/types";
import {
  createOrUpdateGroupChat,
  removeMemberFromGroupChat,
} from "../services/GroupChat.service";
import{ NOTIFICATION_ENDPOINTS, NOTIFICATION_TYPES, FIRESTORE_COLLECTIONS } from "../config/constants";

interface UseWorkerActionsProps {
  taskId: string;
  taskData: TaskData | null;
  currentUserId: string;
  currentUserName: string;
  currentUserProfileImage?: string;
  currentUserToken?: string;
}

export const useWorkerActions = ({
  taskId,
  taskData,
  currentUserId,
  currentUserName,
  currentUserProfileImage,
  currentUserToken,
}: UseWorkerActionsProps) => {
  const { t } = useTranslation();
  const db = FIREBASE_DB;
  const [confirmingWorker, setConfirmingWorker] = useState<string | null>(null);
  const [removingWorker, setRemovingWorker] = useState<string | null>(null);

  // ── SEND NOTIFICATIONS ──
  const sendConfirmationNotification = async (worker: Worker) => {
    try {
      const response = await fetch(NOTIFICATION_ENDPOINTS.SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcmToken: worker.token,
          title: "🎉 Application Confirmed!",
          body: `You have been confirmed for "${taskData?.taskType}" task`,
          data: {
            type: NOTIFICATION_TYPES.CONFIRMATION,
            postId: taskId,
          },
        }),
      });
      return await response.text();
    } catch (error) {
      console.log("Confirmation notification error:", error);
    }
  };

  const sendRemovalNotification = async (worker: Worker) => {
    try {
      const response = await fetch(NOTIFICATION_ENDPOINTS.SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcmToken: worker.token,
          title: "Helper Status Updated",
          body: `Your confirmation for task "${taskData?.taskType}" has been removed`,
          data: {
            type: NOTIFICATION_TYPES.REMOVAL,
            postId: taskId,
          },
        }),
      });
      return await response.text();
    } catch (error) {
      console.log("Removal notification error:", error);
    }
  };

  // ── CONFIRM WORKER ──
  const confirmWorker = async (
    worker: Worker,
    appliedWorkers: Worker[],
    confirmedWorkers: Worker[],
  ) => {
    if (!taskData || !worker) return;

    if (taskData.numberOfWorkers && confirmedWorkers.length >= taskData.numberOfWorkers) {
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
      const taskDocRef = doc(db, FIRESTORE_COLLECTIONS.TASK_REQUESTS, taskId);

      const updatedApplied = appliedWorkers.filter((w) => w.userId !== worker.userId);
      const confirmationData = {
        ...worker,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUserId,
      };
      const updatedConfirmed = [...confirmedWorkers, confirmationData];

      await updateDoc(taskDocRef, {
        appliedWorkers: updatedApplied,
        confirmedWorkers: updatedConfirmed,
      });

      // ── GROUP CHAT INTEGRATION ──
      await createOrUpdateGroupChat(
        taskId,
        {
          userId: currentUserId,
          userName: currentUserName,
          profileImage: currentUserProfileImage || "",
          token: currentUserToken || "",
        },
        {
          userId: worker.userId,
          userName: worker.userName,
          profileImage: worker.profileImage || "",
          token: worker.token || "",
        },
        taskData.taskType,
        taskData.customTaskTitle,
        taskData.description,
      );

      await sendConfirmationNotification(worker);

      Toast.show({
        type: "success",
        text1: t("taskApplicants.toast.success.helperConfirmed"),
        text2: t("taskApplicants.toast.success.confirmedMessage", {
          name: worker.userName,
          current: updatedConfirmed.length,
          total: taskData.numberOfWorkers || 1,
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

  // ── REMOVE WORKER ──
  const removeWorker = async (
    worker: Worker,
    appliedWorkers: Worker[],
    confirmedWorkers: Worker[],
  ) => {
    if (!taskData || !worker) return;

    try {
      setRemovingWorker(worker.userId);
      const taskDocRef = doc(db, FIRESTORE_COLLECTIONS.TASK_REQUESTS, taskId);

      const updatedConfirmed = confirmedWorkers.filter((w) => w.userId !== worker.userId);
      const updatedApplied = [...appliedWorkers, worker];

      await updateDoc(taskDocRef, {
        appliedWorkers: updatedApplied,
        confirmedWorkers: updatedConfirmed,
      });

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

  return {
    confirmingWorker,
    removingWorker,
    confirmWorker,
    removeWorker,
    setConfirmingWorker,
    setRemovingWorker,
  };
};