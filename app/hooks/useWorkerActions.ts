import { useState } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { TaskData ,Worker} from "../types/TaskApplicants/types";
import {
  createOrUpdateGroupChat,
  removeMemberFromGroupChat,
} from "../services/GroupChat.service";
import { isUserDeleted } from "../services/User.service";
import { sendPushToUser } from "../utils/pushNotify";
import{ NOTIFICATION_TYPES, FIRESTORE_COLLECTIONS } from "../config/constants";

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
  // Routed through sendPushToUser so deleted accounts (and stale tokens) are
  // never notified.
  const sendConfirmationNotification = async (worker: Worker) => {
    await sendPushToUser({
      userId: worker.userId,
      token: worker.token,
      title: "🎉 Application Confirmed!",
      body: `You have been confirmed for "${taskData?.taskType}" task`,
      data: {
        type: NOTIFICATION_TYPES.CONFIRMATION,
        postId: taskId,
      },
    });
  };

  const sendRemovalNotification = async (worker: Worker) => {
    await sendPushToUser({
      userId: worker.userId,
      token: worker.token,
      title: "Helper Status Updated",
      body: `Your confirmation for task "${taskData?.taskType}" has been removed`,
      data: {
        type: NOTIFICATION_TYPES.REMOVAL,
        postId: taskId,
      },
    });
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

      // Guard: a helper who deleted their account must never be confirmable
      // (covers stale applicants lists and old application notifications).
      // Prune them from the task and abort.
      if (await isUserDeleted(worker.userId)) {
        try {
          await updateDoc(taskDocRef, {
            appliedWorkers: updatedApplied,
            appliedWorkerIds: arrayRemove(worker.userId),
          });
        } catch (pruneError) {
          console.log("Failed to prune deleted applicant:", pruneError);
        }
        Toast.show({
          type: "error",
          text1: t("taskApplicants.deletedUser.title"),
          text2: t("taskApplicants.deletedUser.message"),
        });
        setConfirmingWorker(null);
        return;
      }

      const confirmationData = {
        ...worker,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUserId,
      };
      const updatedConfirmed = [...confirmedWorkers, confirmationData];

      // Single-helper requests (numberOfWorkers <= 1): confirming the chosen
      // applicant also marks the task assigned via `acceptedBy` (so it leaves
      // the home feed and downstream completion/review flows keep working),
      // and we keep a 1:1 chat (no group chat).
      const isSingle = (taskData.numberOfWorkers || 1) <= 1;

      const updatePayload: any = {
        appliedWorkers: updatedApplied,
        appliedWorkerIds: arrayRemove(worker.userId),
        confirmedWorkers: updatedConfirmed,
        // Queryable mirror of confirmedWorkers (the array itself can't be
        // queried by userId) — lets account deletion reliably find every
        // task a user is a confirmed helper on, single-helper or bulk.
        confirmedWorkerIds: arrayUnion(worker.userId),
      };
      if (isSingle) {
        updatePayload.acceptedBy = {
          userId: worker.userId,
          userName: worker.userName,
          email: worker.email || null,
          profileImage: worker.profileImage || null,
          phone: worker.phone || null,
          token: worker.token || null,
        };
      }

      await updateDoc(taskDocRef, updatePayload);

      // ── GROUP CHAT INTEGRATION (bulk only — single keeps 1:1 chat) ──
      if (!isSingle) {
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
      }

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

      // Single-helper: removing the confirmed helper un-assigns the task
      // (clear acceptedBy so it returns to the feed); no group chat to update.
      const isSingle = (taskData.numberOfWorkers || 1) <= 1;

      const updatePayload: any = {
        appliedWorkers: updatedApplied,
        // Worker moves back to "applied" — restore it in the queryable
        // mirror too (was missing before, leaving this array stale after an
        // un-confirm).
        appliedWorkerIds: arrayUnion(worker.userId),
        confirmedWorkers: updatedConfirmed,
        confirmedWorkerIds: arrayRemove(worker.userId),
      };
      if (isSingle) {
        updatePayload.acceptedBy = null;
      }

      await updateDoc(taskDocRef, updatePayload);

      if (!isSingle) {
        await removeMemberFromGroupChat(taskId, worker);
      }
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