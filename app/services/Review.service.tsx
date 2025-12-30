// services/ReviewService.js
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import haversine from "haversine";

export const fetchMyReviewsFromFirebase = async () => {
  try {
    const currentUserId = getAuth().currentUser?.uid;
    if (!currentUserId) return [];

    const q = query(
      collection(FIREBASE_DB, "reviews"),
      where("taskOwnerId", "==", currentUserId)
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};


export const fetchCompletedTasksFromFirebase = async () => {
  const currentUserId = getAuth().currentUser?.uid;
  if (!currentUserId) return [];

  try {
    // 1. Fetch tasks from completedTask collection
    const completedTaskQuery = query(
      collection(FIREBASE_DB, "completedTask"),
      where("acceptedBy.userId", "==", currentUserId),
      where("status", "==", "Completed")
    );

    const completedTaskSnap = await getDocs(completedTaskQuery);

    // 2. Fetch bulk tasks from taskRequests
    const bulkTaskQuery = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "==", "Completed"),
      where("confirmedWorkers", "array-contains", {
        userId: currentUserId,
      })
    );

    const bulkTaskSnap = await getDocs(bulkTaskQuery);

    // Process completedTask collection results
    const completedTasks = completedTaskSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isBulkTask: data.isBulkTask || false,
        isConfirmedHelper: data.isConfirmedHelper || false,
        completedAt: data.completedAt || data.acceptedAt || new Date().toISOString(),
        taskDetails: {
          ...data.taskDetails,
          id: data.taskId || data.taskDetails?.id,
          user: data.taskDetails?.user ||
            data.taskDetails?.requester || { 
              userId: data.taskOwnerId || data.taskDetails?.userId,
              userName: "Unknown User" 
            },
          isBulkRequest:
            data.taskDetails?.numberOfWorkers > 1 ||
            data.taskDetails?.isBulkRequest,
        },
      };
    });

    // Process bulk tasks
    const bulkTasks = bulkTaskSnap.docs.map((doc) => {
      const data = doc.data();
      const userConfirmation = data.confirmedWorkers?.find(
        (worker) => worker && worker.userId === currentUserId
      );

      return {
        id: doc.id,
        taskId: doc.id,
        acceptedBy: {
          userId: currentUserId,
          name: userConfirmation?.userName || userConfirmation?.name || "Worker",
          email: userConfirmation?.email || "",
          image: userConfirmation?.profileImage || userConfirmation?.image || null,
        },
        completedAt: data.completedAt ||
          userConfirmation?.confirmedAt ||
          new Date().toISOString(),
        status: "Completed",
        taskDetails: {
          ...data,
          id: doc.id,
          user: data.user || data.requester || { 
            userId: data.userId,
            userName: "Unknown User" 
          },
          isBulkRequest: true,
          numberOfWorkers: data.numberOfWorkers || 1,
          confirmedWorkers: data.confirmedWorkers || [],
          appliedWorkers: data.appliedWorkers || [],
        },
        isBulkTask: true,
        isConfirmedHelper: true,
        userConfirmation: userConfirmation,
      };
    });

    // Combine and deduplicate
    let allTasks = [...completedTasks, ...bulkTasks];
    const uniqueTasks = [];
    const seenTaskIds = new Set();

    allTasks.forEach((task) => {
      const taskId = task.taskId || task.id;
      if (!seenTaskIds.has(taskId)) {
        seenTaskIds.add(taskId);
        uniqueTasks.push(task);
      }
    });

    // Fetch personal review status for each task
    const tasksWithReviewStatus = await Promise.all(
      uniqueTasks.map(async (task) => {
        const taskId = task.taskId || task.id;
        const taskOwnerId = task.taskDetails?.user?.userId;
        
        // Check if this specific helper has reviewed this specific task owner for this task
        const reviewQuery = query(
          collection(FIREBASE_DB, "reviews"),
          where("reviewer.userId", "==", currentUserId),
          where("taskId", "==", taskId),
          where("taskOwnerId", "==", taskOwnerId)
        );

        const reviewSnap = await getDocs(reviewQuery);
        
        if (!reviewSnap.empty) {
          // User has reviewed this task owner for this task
          const reviewData = reviewSnap.docs[0].data();
          return {
            ...task,
            reviewed: true,
            rating: reviewData.rating || 0,
            reviewText: reviewData.reviewText || "",
            reviewId: reviewSnap.docs[0].id,
            // Mark that this is the user's personal review
            isPersonalReview: true
          };
        }
        
        // Also check helperReviews collection
        const helperReviewQuery = query(
          collection(FIREBASE_DB, "helperReviews"),
          where("helperId", "==", currentUserId),
          where("taskId", "==", taskId),
          where("taskOwnerId", "==", taskOwnerId)
        );

        const helperReviewSnap = await getDocs(helperReviewQuery);
        
        if (!helperReviewSnap.empty) {
          const helperReviewData = helperReviewSnap.docs[0].data();
          return {
            ...task,
            reviewed: true,
            rating: helperReviewData.reviewData?.rating || 0,
            reviewText: helperReviewData.reviewData?.reviewText || "",
            reviewId: helperReviewSnap.docs[0].id,
            isPersonalReview: true
          };
        }
        
        // No review found for this helper
        return {
          ...task,
          reviewed: false,
          rating: undefined,
          reviewText: undefined,
          isPersonalReview: false
        };
      })
    );

    // Sort by completion date
    return tasksWithReviewStatus.sort((a, b) => {
      const dateA = new Date(a.completedAt || 0).getTime();
      const dateB = new Date(b.completedAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (err) {
    console.error("Error fetching completed tasks:", err);
    return [];
  }
};



export const fetchActiveTasksFromFirebase = async () => {
  const currentUserId = getAuth().currentUser?.uid;
  console.log("currentUserId..", currentUserId);
  if (!currentUserId) return [];
  try {
    const q = query(
      collection(FIREBASE_DB, "completedTask"),
      where("acceptedBy.userId", "==", currentUserId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    console.log("snap..", snap);

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching active tasks:", err);
    return [];
  }
};

export const fetchCompletedTasksByUserFromFirebase = async (id: any) => {
  if (!id) return [];

  try {
    const q = query(
      collection(FIREBASE_DB, "completedTask"),
      where("acceptedBy.userId", "==", id),
      where("status", "==", "Completed")
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching completed tasks:", err);
    return [];
  }
};

// services/Review.service.js
export const fetchUsersWithTaskStats = async (customLocation = null) => {
  try {
    // Get current user at the start
    const currentUser = getAuth().currentUser;
    const currentUserId = currentUser?.uid;

    // Fetch current user's location from Firestore
    let currentUserLocation = null;
    if (customLocation) {
      // Use custom location if provided
      currentUserLocation = customLocation;
    } else if (currentUserId) {
      // Otherwise use current user's location from Firestore
      const currentUserDoc = await getDoc(
        doc(FIREBASE_DB, "users", currentUserId)
      );
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        if (currentUserData.latitude && currentUserData.longitude) {
          currentUserLocation = {
            latitude: currentUserData.latitude,
            longitude: currentUserData.longitude,
          };
        }
      }
    }

    const completedTasksSnap = await getDocs(
      collection(FIREBASE_DB, "completedTask")
    );

    // Fetch users data
    const usersSnap = await getDocs(collection(FIREBASE_DB, "users"));
    const reviewsSnap = await getDocs(collection(FIREBASE_DB, "reviews"));

    const usersMap = {};
    const usersDataMap = {};

    const reviewsByHelper = {};
    reviewsSnap.docs.forEach((doc) => {
      const reviewData = doc.data();
      const helperId =
        reviewData.helperId || reviewData.taskOwnerId || reviewData.userId;
      if (!helperId) return;
      if (!reviewsByHelper[helperId]) reviewsByHelper[helperId] = [];
      reviewsByHelper[helperId].push({
        id: doc.id,
        ...reviewData,
      });
    });

    // First, create a map of all users for quick lookup
    usersSnap.docs.forEach((doc) => {
      const userData = doc.data();
      usersDataMap[userData.userId] = {
        userName: userData.userName || "Unknown",
        email: userData.email || "",
        profileImage: userData.profileImage || null,
        isSubscribed: userData.isSubscribed || false,
        subscriptionEnd: userData.subscriptionEnd || null,
        token: userData?.token,
        userId: userData?.userId,
        freeTrialStartedAt: userData.freeTrialStartedAt,
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        memberSince: userData?.freeTrialStartedAt
          ? new Date(
              userData.freeTrialStartedAt.seconds * 1000
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Recently",
      };
    });

    // Process completed tasks to count stats
    completedTasksSnap.docs.forEach((doc) => {
      const data = doc.data();
      const taskUser = data?.acceptedBy; // This is the helper who accepted the task
      // Only process if there's a user who accepted the task (helper)
      if (!taskUser?.userId) return;

      const helperUserId = taskUser.userId;

      // Skip current user if exists
      if (currentUserId && helperUserId === currentUserId) {
        return; // Skip processing tasks for current user
      }
      // Only include users who are helpers (not task owners)
      // In your data structure, taskOwnerId is the requester, acceptedBy.userId is the helper
      const taskOwnerId = data.taskOwnerId || data.user?.userId;

      // Make sure we're only counting the helper's stats, not the task owner's
      if (helperUserId === taskOwnerId) {
        return; // Skip if the user is the task owner (self-accepted task)
      }

      // Check if helper user is within 100km of current user
      if (currentUserLocation) {
        const helperUserData = usersDataMap[helperUserId];
        if (helperUserData?.latitude && helperUserData?.longitude) {
          const helperLocation = {
            latitude: helperUserData.latitude,
            longitude: helperUserData.longitude,
          };

          const distance = haversine(currentUserLocation, helperLocation, {
            unit: "km",
          });
          if (distance > 100) {
            return; // Skip users outside 100km radius
          }
        } else {
          return; // Skip users without location data
        }
      }

      if (!currentUserLocation) {
        return []; // or prompt user to enable location
      }

      // Initialize helper user if not exists
      if (!usersMap[helperUserId]) {
        usersMap[helperUserId] = {
          userId: helperUserId,
          name:
            usersDataMap[helperUserId]?.userName || taskUser.name || "Unknown",
          profileImage:
            usersDataMap[helperUserId]?.profileImage || taskUser.image || null,
          completedCount: 0,
          activeCount: 0,
          category: "Beginner",
          email: usersDataMap[helperUserId]?.email || "",
          isSubscribed: usersDataMap[helperUserId]?.isSubscribed || false,
          memberSince: usersDataMap[helperUserId]?.memberSince || "Recently",
          latitude: usersDataMap[helperUserId]?.latitude || null,
          longitude: usersDataMap[helperUserId]?.longitude || null,
          reviews: reviewsByHelper[helperUserId] || [],
        };
      }

      // Count completed & active tasks for the helper
      if (data.status === "Completed") {
        usersMap[helperUserId].completedCount += 1;
      } else if (data.status === "pending") {
        usersMap[helperUserId].activeCount += 1;
      }
    });

    // Convert to array, assign category, and filter out users with no completed tasks
    const usersArray = Object.values(usersMap)
      .map((u) => {
        const completedCount = Number(u.completedCount) || 0;

        if (completedCount >= 3) u.category = "Top Rated";
        else if (completedCount >= 2) u.category = "Rising Talent";

        return u;
      })
      .filter((user) => {
        // Only include users who have completed at least one task AND exist in users collection
        return user?.completedCount > 0 && usersDataMap[user?.userId];
      });

    return usersArray;
  } catch (err) {
    console.log("Error fetching user stats:", err);
    return [];
  }
};

export const fetchConfirmedTasksAsWorker = async (userId) => {
  try {
    const db = getFirestore();
    const taskRequestsRef = collection(db, "taskRequests");
    // Query tasks where user is in confirmedWorkers array
    const q = query(
      taskRequestsRef,
      where("confirmedWorkers", "array-contains", { userId: userId })
    );

    const querySnapshot = await getDocs(q);
    const tasks = [];

    querySnapshot.forEach((doc) => {
      const taskData = doc.data();
      // Check if user is actually in confirmedWorkers (exact match)
      const userConfirmed = taskData.confirmedWorkers?.some(
        (worker) => worker.userId === userId
      );

      if (userConfirmed) {
        tasks.push({
          id: doc.id,
          ...taskData,
          isBulkRequest: true,
          workerConfirmed: true,
          // Get the user's confirmation details
          userConfirmation: taskData.confirmedWorkers.find(
            (worker) => worker.userId === userId
          ),
        });
      }
    });

    return tasks;
  } catch (error) {
    console.error("Error fetching confirmed worker tasks:", error);
    return [];
  }
};

// Alternative approach: Fetch all tasks and filter in memory
export const fetchAllConfirmedTasksAsWorker = async (userId) => {
  try {
    const db = getFirestore();
    const taskRequestsRef = collection(db, "taskRequests");

    // Get all task requests (since array-contains doesn't work with complex objects)
    const querySnapshot = await getDocs(taskRequestsRef);
    const tasks = [];

    querySnapshot.forEach((doc) => {
      const taskData = doc.data();
      const taskId = doc.id;

      // Check if user is in confirmedWorkers
      const confirmedWorkers = taskData.confirmedWorkers || [];
      const userConfirmed = confirmedWorkers.some(
        (worker) => worker && worker.userId === userId
      );

      if (userConfirmed) {
        tasks.push({
          id: taskId,
          ...taskData,
          isBulkRequest: true,
          workerConfirmed: true,
          userConfirmation: confirmedWorkers.find(
            (worker) => worker.userId === userId
          ),
        });
      }
    });

    return tasks;
  } catch (error) {
    console.error("Error fetching all confirmed worker tasks:", error);
    return [];
  }
};
