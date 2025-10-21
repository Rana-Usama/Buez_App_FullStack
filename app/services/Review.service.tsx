// services/ReviewService.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";

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
    const q = query(
      collection(FIREBASE_DB, "completedTask"),
      where("acceptedBy.userId", "==", currentUserId),
      where("status", "==", "Completed")
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
export const fetchUsersWithTaskStats = async () => {
  try {
    // Get current user at the start
    const currentUser = FIREBASE_AUTH.currentUser;
    const currentUserId = currentUser?.uid;

    const completedTasksSnap = await getDocs(
      collection(FIREBASE_DB, "completedTask")
    );

    // Fetch users data
    const usersSnap = await getDocs(collection(FIREBASE_DB, "users"));

    const usersMap = {};
    const usersDataMap = {};

    // First, create a map of all users for quick lookup
    usersSnap.docs.forEach((doc) => {
      const userData = doc.data();
      usersDataMap[userData.userId] = {
        userName: userData.userName || "Unknown",
        email: userData.email || "",
        profileImage: userData.profileImage || null,
        isSubscribed: userData.isSubscribed || false,
        subscriptionEnd: userData.subscriptionEnd || null,
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
      
      // Initialize helper user if not exists
      if (!usersMap[helperUserId]) {
        usersMap[helperUserId] = {
          userId: helperUserId,
          name: usersDataMap[helperUserId]?.userName || taskUser.name || "Unknown",
          profileImage: usersDataMap[helperUserId]?.profileImage || taskUser.image || null,
          completedCount: 0,
          activeCount: 0,
          category: "Normal",
          email: usersDataMap[helperUserId]?.email || "",
          isSubscribed: usersDataMap[helperUserId]?.isSubscribed || false,
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

        if (completedCount > 15) u.category = "Top Rated";
        else if (completedCount > 10) u.category = "Rising Talent";

        return u;
      })
      .filter(user => user.completedCount > 0); // Only show users who have completed at least one task

    return usersArray;
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return [];
  }
};
