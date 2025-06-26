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
