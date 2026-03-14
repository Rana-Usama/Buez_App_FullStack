import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { TaskData, Worker } from "../types/TaskApplicants/types";
import { FIRESTORE_COLLECTIONS } from "../config/constants";

export const useTaskData = (taskId: string, onNavigateBack?: () => void) => {
  const { t } = useTranslation();
  const db = FIREBASE_DB;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [appliedWorkers, setAppliedWorkers] = useState<Worker[]>([]);
  const [confirmedWorkers, setConfirmedWorkers] = useState<Worker[]>([]);

  // ── FETCH TASK DATA ──
  const fetchTaskData = useCallback(async () => {
    try {
      setLoading(true);
      const taskDocRef = doc(db, FIRESTORE_COLLECTIONS.TASK_REQUESTS, taskId);
      const docSnap = await getDoc(taskDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as TaskData;
        setTaskData({ id: docSnap.id, ...data });
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
        onNavigateBack?.();
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
  }, [taskId, db, t, onNavigateBack]);

  // ── REAL-TIME UPDATES ──
  useEffect(() => {
    if (!taskId) return;

    const taskDocRef = doc(db, FIRESTORE_COLLECTIONS.TASK_REQUESTS, taskId);
    const unsubscribe = onSnapshot(taskDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as TaskData;
        setAppliedWorkers(
          Array.isArray(data.appliedWorkers) ? data.appliedWorkers : [],
        );
        setConfirmedWorkers(
          Array.isArray(data.confirmedWorkers) ? data.confirmedWorkers : [],
        );
      }
    });

    return () => unsubscribe();
  }, [taskId, db]);

  // ── INITIAL LOAD ──
  useEffect(() => {
    fetchTaskData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTaskData();
  };

  return {
    loading,
    refreshing,
    taskData,
    appliedWorkers,
    confirmedWorkers,
    fetchTaskData,
    onRefresh,
    setAppliedWorkers,
    setConfirmedWorkers,
  };
};
