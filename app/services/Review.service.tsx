// services/ReviewService.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB } from "../../firebaseConfig";

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

export const fetchUsersWithTaskStats = async () => {
  try {
    const snap = await getDocs(collection(FIREBASE_DB, "completedTask"));

    const usersMap = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const user = data?.acceptedBy;
      if (!user?.userId) return;

      if (!usersMap[user.userId]) {
        usersMap[user.userId] = {
          userId: user.userId,
          name: user.name || "Unknown",
          profileImage: user.profileImage || null,
          completedCount: 0,
          activeCount: 0,
          category: "Normal",
        };
      }

      // Count completed & active
      if (data.status === "Completed")
        usersMap[user.userId].completedCount += 1;
      if (data.status === "pending") usersMap[user.userId].activeCount += 1;
    });

    // Convert to array and assign category
    const usersArray = Object.values(usersMap).map((u) => {
      if (u?.completedCount > 15) u.category = "Top Rated";
      else if (u?.completedCount > 10 && u.completedCount <= 15)
        u.category = "Rising Talent";
      return u;
    });

    return usersArray;
  } catch (err) {
    console.error("Error fetching user stats:", err);
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
