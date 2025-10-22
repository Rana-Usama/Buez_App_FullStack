// services/ReviewService.js
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
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

      console.log("taskUser..", taskUser);

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
