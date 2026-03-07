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
} from "firebase/firestore";
// FIREBASE config
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// shared
import { uploadImage } from "./Shared.service";
import { REQUEST_STATUS } from "../utils/gloabals";

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

    if (!isBulkRequest || confirmedWorkers.length === 0) {
      return; // Not a bulk request or no confirmed workers
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
            isBulkRequest: true,
            status: "Completed", // IMPORTANT: Set status to Completed
            completedAt: new Date().toISOString(), // Add completion timestamp
          },
          reviewed: false,
          status: "Completed",
          completedAt: new Date().toISOString(),
          acceptedAt:
            worker.confirmedAt || task.createdAt || new Date().toISOString(),
          isBulkTask: true,
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

      // Check if this is a bulk request
      const isBulkRequest = task?.numberOfWorkers > 1 || task?.isBulkRequest;
      const confirmedWorkers = task?.confirmedWorkers || [];

      if (isBulkRequest && confirmedWorkers.length > 0) {
        // Create completedTask entries for all confirmed workers
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
          // Update existing entry
          const completedTaskDoc = completedTasks.docs[0];
          await updateDoc(completedTaskDoc.ref, {
            status: "Completed",
            completedAt: new Date().toISOString(),
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
