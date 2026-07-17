import { getAuth } from "firebase/auth";
import {
  serverTimestamp,
  doc,
  setDoc,
  getFirestore,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  collection,
  Timestamp,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch, // Add this import
  deleteDoc,
} from "firebase/firestore";
// FIREBASE config
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// shared
import { uploadImage } from "./Shared.service";
import { REQUEST_STATUS } from "../utils/gloabals";
import { removeMemberFromGroupChat } from "./GroupChat.service";

const db = FIREBASE_DB;
const PAGE_SIZE = 10;

export const savePost = async (data: any, imageUris: any) => {
  try {
    const imageUrls = await Promise.all(
      imageUris.map((uri: any) => {
        if (uri && !uri?.startsWith("http")) {
          return uploadImage(uri);
        }
        return uri;
      }),
    );

    const userId = getAuth().currentUser?.uid;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // 👇 create document
    const docRef = await addDoc(collection(db, "taskRequests"), {
      ...data,
      status: "Active",
      imageUrls,
      createdAt: Timestamp.now(),
      userId,
      user: { ...userData },
    });

    //fetch created document
    const newDocSnap = await getDoc(docRef);

    return {
      id: docRef.id,
      ...(newDocSnap.exists() ? newDocSnap.data() : {}),
    };
  } catch (error) {
    console.error("Error_saving_post: ", error);
    throw error;
  }
};

export const getPostById = async (id: any) => {
  try {
    const docRef = doc(db, "taskRequests", id);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  } catch (error) {
    console.error("Error_getting_post: ", error);
    throw error;
  }
};

export const updatePost = async (id: any, data: any, imageUris: any) => {
  try {
    const imageUrls = await Promise.all(
      imageUris.map((uri: any) => {
        if (uri && !uri?.startsWith("http")) {
          return uploadImage(uri);
        }
        return uri;
      }),
    );
    const userId = getAuth().currentUser?.uid;
    const userRef = doc(db, "taskRequests", id);
    await updateDoc(userRef, {
      ...data,
      imageUrls,
      updatedAt: Timestamp.now(),
      userId: userId,
    });

    return true;
  } catch (error) {
    console.error("Error_saving_post: ", error);
    throw error;
  }
};

export const getMyReuqests = async (
  postStatus,
  lastVisiblePost = null,
  pageSize = PAGE_SIZE,
) => {
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) throw new Error("User is not logged in");

    let q = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "==", postStatus),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    );

    if (lastVisiblePost) {
      q = query(
        collection(FIREBASE_DB, "taskRequests"),
        where("status", "==", postStatus),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisiblePost),
        limit(pageSize),
      );
    }

    const snapshot = await getDocs(q);

    // fetch user data in parallel
    const tasksArray = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        const userRef = doc(db, "users", postData.userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : null;
        return { id: docSnapshot.id, ...postData, user: userData };
      }),
    );

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    return { tasksArray, lastVisible };
  } catch (error) {
    console.log("GET_MY_POSTS: ", error);
    throw error;
  }
};

// Counts of the current user's posted tasks, grouped by status.
// Used by the Post dashboard tab. Single query, tallied locally.
export const getMyRequestCounts = async () => {
  const empty = { total: 0, active: 0, completed: 0, cancelled: 0 };
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) return empty;

    const counts = { ...empty };
    const now = Date.now();

    // Total / completed / cancelled — whole collection for this user.
    const allSnap = await getDocs(
      query(
        collection(FIREBASE_DB, "taskRequests"),
        where("userId", "==", userId),
      ),
    );
    allSnap.forEach((d) => {
      const status = d.data()?.status;
      counts.total += 1;
      if (status === REQUEST_STATUS.Completed) counts.completed += 1;
      else if (status === REQUEST_STATUS.Cancelled) counts.cancelled += 1;
    });

    // Active (not past) — use the SAME query shape as the My Requests
    // "Active" tab (status == Active, ordered by createdAt) so the count
    // always matches the cards shown there, then drop past-scheduled tasks.
    const activeSnap = await getDocs(
      query(
        collection(FIREBASE_DB, "taskRequests"),
        where("status", "==", REQUEST_STATUS.Active),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      ),
    );
    activeSnap.forEach((d) => {
      const data = d.data();
      const scheduled = data?.scheduledDateTime || data?.scheduledDate;
      const ts = scheduled ? new Date(scheduled).getTime() : NaN;
      const isPast = !isNaN(ts) && ts < now;
      if (!isPast) counts.active += 1;
    });

    return counts;
  } catch (error) {
    console.log("GET_MY_REQUEST_COUNTS:", error);
    return empty;
  }
};

// real-time version of getRequestList
export const getRequestList = (
  taskType = "",
  searchQuery = "",
  lastVisiblePost = null,
  callback,
  errorCallback,
) => {
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) throw new Error("User is not logged in");

    let q = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "==", "Active"),
      where("userId", "!=", userId),
      where("acceptedBy", "==", null),
      orderBy("createdAt", "desc"),
    );

    if (lastVisiblePost) q = query(q, startAfter(lastVisiblePost));
    if (taskType && taskType !== "All")
      q = query(q, where("taskType", "==", taskType));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let tasksArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Hide tasks that already have every required helper confirmed.
        // Single-helper tasks are already excluded server-side via the
        // `acceptedBy == null` filter above; this covers bulk-request tasks
        // (acceptedBy is never set for those) so they disappear from the
        // browse feed the moment the last slot is confirmed — same behavior
        // as single tasks — instead of lingering as "All slots filled".
        tasksArray = tasksArray.filter((task: any) => {
          const requiredWorkers = task?.numberOfWorkers || 1;
          const confirmedCount = Array.isArray(task?.confirmedWorkers)
            ? task.confirmedWorkers.length
            : 0;
          return confirmedCount < requiredWorkers;
        });

        if (searchQuery.trim()) {
          const qLower = searchQuery.toLowerCase();
          tasksArray = tasksArray.filter(
            (task) =>
              (task?.description || "").toLowerCase().includes(qLower) ||
              (task?.user?.userName || "").toLowerCase().includes(qLower) ||
              (task?.taskType || "").toLowerCase().includes(qLower),
          );
        }

        const lastVisible =
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null;
        callback && callback({ tasksArray, lastVisible });
      },
      (err) => {
        console.log("GET_POSTS_LIST (onSnapshot):", err);
        errorCallback && errorCallback(err);
      },
    );

    return unsubscribe;
  } catch (err) {
    console.log("GET_POSTS_LIST:", err);
    errorCallback && errorCallback(err);
    return () => {};
  }
};

// Add this function to handle bulk task completion
export const createCompletedTaskForWorkers = async (taskId, taskData) => {
  try {
    // Use the existing db instance
    // Get the task document
    const taskDocRef = doc(db, "taskRequests", taskId);
    const taskDoc = await getDoc(taskDocRef);

    if (!taskDoc.exists()) {
      throw new Error("Task not found");
    }

    const task = { id: taskDoc.id, ...taskDoc.data() };

    // Check if this is a bulk request with confirmed workers
    const isBulkRequest = task.numberOfWorkers > 1 || task.isBulkRequest;
    const confirmedWorkers = task.confirmedWorkers || [];

    if (confirmedWorkers.length === 0) {
      return; // No confirmed workers → nothing to create
    }

    // Create completedTask entries for each confirmed worker
    const batch = writeBatch(db);

    for (const worker of confirmedWorkers) {
      if (worker && worker.userId) {
        const completedTaskRef = doc(collection(db, "completedTask"));

        const completedTaskData = {
          taskId: taskId,
          taskOwnerId: task.userId,
          acceptedBy: {
            userId: worker.userId,
            name: worker.userName || worker.name || "Unknown Worker",
            email: worker.email || "",
            image: worker.profileImage || worker.image || null,
            phone: worker.phone || "",
            token: worker.token || "",
          },
          taskDetails: {
            ...task,
            // Ensure all necessary fields are included
            id: taskId,
            user: task.user || { userName: "Unknown User" },
            requester: task.user, // Add requester for consistency
            confirmedWorkers: confirmedWorkers,
            appliedWorkers: task.appliedWorkers || [],
            // Reflect the real request type so the helper's Completed card
            // renders correctly (single-helper tasks must not show bulk UI).
            isBulkRequest: isBulkRequest,
            status: "Completed", // IMPORTANT: Set status to Completed
            completedAt: new Date().toISOString(), // Add completion timestamp
          },
          reviewed: false,
          status: "Completed",
          completedAt: new Date().toISOString(),
          acceptedAt:
            worker.confirmedAt || task.createdAt || new Date().toISOString(),
          isBulkTask: isBulkRequest,
          isConfirmedHelper: true,
          workerConfirmation: {
            confirmedAt: worker.confirmedAt,
            status: "confirmed",
          },
        };

        batch.set(completedTaskRef, completedTaskData);
      }
    }

    await batch.commit();
    console.log(
      `Created completedTask entries for ${confirmedWorkers.length} workers`,
    );
  } catch (error) {
    console.error("Error creating completed tasks for workers:", error);
    throw error;
  }
};

// Update your existing updateReqestStatus function
export const updateReqestStatus = async (taskId, status, taskData) => {
  try {
    const taskRef = doc(db, "taskRequests", taskId);

    // Update the task status
    await updateDoc(taskRef, {
      status: status,
      ...(status === REQUEST_STATUS.Completed && {
        completedAt: new Date().toISOString(),
      }),
    });

    // If marking as completed and it's a bulk request, create entries for workers
    if (status === REQUEST_STATUS.Completed) {
      const taskDoc = await getDoc(taskRef);
      const task = { id: taskDoc.id, ...taskDoc.data() };

      const confirmedWorkers = task?.confirmedWorkers || [];

      if (confirmedWorkers.length > 0) {
        // Create completedTask entries for every confirmed worker. This covers
        // BOTH multi-helper tasks and single-helper tasks that were filled via
        // the confirm flow (numberOfWorkers === 1, no acceptedBy).
        await createCompletedTaskForWorkers(taskId, task);
      } else if (task?.acceptedBy) {
        // For single tasks, ensure completedTask entry exists
        const completedTaskQuery = query(
          collection(db, "completedTask"),
          where("taskId", "==", taskId),
          where("acceptedBy.userId", "==", task.acceptedBy.userId),
        );

        const completedTasks = await getDocs(completedTaskQuery);

        if (completedTasks.empty) {
          // Create completedTask entry if it doesn't exist
          await addDoc(collection(db, "completedTask"), {
            taskId: taskId,
            taskOwnerId: task.userId,
            acceptedBy: task.acceptedBy,
            taskDetails: {
              ...task,
              status: "Completed", // IMPORTANT: Set status
              completedAt: new Date().toISOString(), // Add completion timestamp
            },
            reviewed: false,
            status: "Completed",
            completedAt: new Date().toISOString(),
            acceptedAt: task.acceptedAt || new Date().toISOString(),
            isBulkTask: false,
          });
        } else {
          // Update existing entry. Sync the nested taskDetails.status too so
          // the worker's record is internally consistent (UI labels / future
          // reads that look at taskDetails won't show a stale "Active").
          const completedTaskDoc = completedTasks.docs[0];
          const completedAt = new Date().toISOString();
          await updateDoc(completedTaskDoc.ref, {
            status: "Completed",
            completedAt,
            "taskDetails.status": "Completed",
            "taskDetails.completedAt": completedAt,
          });
        }
      }
    }

    console.log("Task status updated successfully");
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

// ─── Repost a task as a completely new posting ────────────────────────────────
// Creates a brand-new taskRequests document (fresh ID) carrying only the task
// details, so the repost starts with a clean lifecycle: no applicants, no
// confirmed/accepted helpers, no review state, no group chat, and no other
// association with the previous run. The previous task document is left
// untouched as history — its reviews, completed records, and chats all stay
// attached to the old ID — and receives a pointer to its repost.
export const repostTask = async (
  previousTaskId: string,
  data: any,
  imageUris: any,
) => {
  if (!previousTaskId) throw new Error("Missing task id for repost");

  // Create the new task first — if this fails, the old task is untouched.
  const savedPost = await savePost(data, imageUris);

  // Traceability marker on the old task (best-effort; never blocks the repost).
  try {
    await updateDoc(doc(db, "taskRequests", previousTaskId), {
      repostedTo: savedPost.id,
      repostedAt: Timestamp.now(),
    });
  } catch (error) {
    console.log("repostTask: could not mark previous task:", error);
  }

  return savedPost;
};

// ─── Cancel a confirmed/accepted task (worker withdraws) ──────────────────────
// Works for both single-helper (direct-accept via acceptedBy) and multi-helper
// (confirm flow via confirmedWorkers) tasks, keeping the task doc and the
// worker's completedTask entry in sync.
export const cancelConfirmedTask = async ({
  task,
  userId,
}: {
  task: any;
  userId: string;
}) => {
  if (!task?.id || !userId) {
    throw new Error("Missing task id or user id for cancellation");
  }

  const taskRef = doc(db, "taskRequests", task.id);
  const snap = await getDoc(taskRef);
  if (!snap.exists()) throw new Error("Task not found");
  const data: any = snap.data();

  const updates: any = {};

  // Capture the worker's stored details (for group-chat removal) before we
  // filter them out.
  const removedWorker = Array.isArray(data.confirmedWorkers)
    ? data.confirmedWorkers.find((w: any) => w?.userId === userId)
    : null;

  // Free the worker's slot by removing them from both arrays.
  const confirmedWorkers = Array.isArray(data.confirmedWorkers)
    ? data.confirmedWorkers.filter((w: any) => w?.userId !== userId)
    : [];
  const appliedWorkers = Array.isArray(data.appliedWorkers)
    ? data.appliedWorkers.filter((w: any) => w?.userId !== userId)
    : [];
  updates.confirmedWorkers = confirmedWorkers;
  updates.appliedWorkers = appliedWorkers;

  // Keep any stored slot count in sync (UI also derives this from the array).
  const totalWorkers = data.numberOfWorkers || 1;
  if (typeof data.slotsAvailable === "number") {
    updates.slotsAvailable = Math.max(0, totalWorkers - confirmedWorkers.length);
  }

  // Single-helper direct-accept: clear acceptedBy and reopen the task so it
  // becomes available to other helpers again.
  if (data.acceptedBy?.userId === userId) {
    updates.acceptedBy = null;
    updates.status = REQUEST_STATUS.Active;
  }

  await updateDoc(taskRef, updates);

  // Remove any pending completedTask entry this worker holds for the task so it
  // disappears from their Accepted list (and never surfaces as completed).
  const ctQuery = query(
    collection(db, "completedTask"),
    where("taskId", "==", task.id),
    where("acceptedBy.userId", "==", userId),
    where("status", "==", "pending"),
  );
  const ctSnap = await getDocs(ctQuery);
  await Promise.all(ctSnap.docs.map((d) => deleteDoc(d.ref)));

  // Remove the worker from the task's group chat (best-effort; no-op if the
  // group chat doesn't exist). Never let this block the cancellation.
  if (removedWorker) {
    try {
      await removeMemberFromGroupChat(task.id, {
        userId,
        userName: removedWorker.userName || removedWorker.name || "",
        profileImage:
          removedWorker.profileImage || removedWorker.image || "",
        token: removedWorker.token || "",
      });
    } catch (error) {
      console.log("cancelConfirmedTask group-chat removal error:", error);
    }
  }

  return { confirmedWorkers, appliedWorkers };
};

// ─── Notify the task owner that a confirmed worker has cancelled ──────────────
export const sendTaskCancellationNotification = async ({
  task,
  owner,
  canceller,
}: {
  task: any;
  owner: any;
  canceller: any;
}) => {
  const taskTitle =
    task?.taskType === "Other"
      ? task?.customTaskTitle || task?.taskType
      : task?.taskType || "your task";
  const message = `${
    canceller?.userName || "A helper"
  } has cancelled their confirmed spot for "${taskTitle}"`;

  // Push notification (best-effort; never block the cancel on this).
  try {
    if (owner?.token) {
      await fetch("https://buez-server-khaki.vercel.app/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcmToken: owner.token,
          title: "Spot Cancelled",
          body: message,
        }),
      });
    }
  } catch (error) {
    console.log("sendTaskCancellationNotification push error:", error);
  }

  // Persist the in-app notification for the owner.
  try {
    await addDoc(collection(db, "notifications"), {
      sender: {
        userId: canceller?.userId,
        userName: canceller?.userName,
        email: canceller?.email || "",
        profileImage: canceller?.profileImage || null,
        token: canceller?.token || "",
      },
      receiver: {
        userId: owner?.userId,
        name: owner?.userName,
        email: owner?.email || "",
        token: owner?.token || "",
      },
      task: {
        taskId: task?.id,
        taskType: task?.taskType,
        customTaskTitle: task?.customTaskTitle || "",
        description: task?.description || "",
      },
      type: "task_cancellation",
      title: "Spot Cancelled",
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
    });
  } catch (error) {
    console.log("sendTaskCancellationNotification save error:", error);
    throw error;
  }
};
