// eslint-disable-next-line import/no-unresolved
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  where,
  query,
  getDocs,
} from "firebase/firestore";
// FIREBASE config
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// shared
import { uploadImage } from "./Shared.service";

const db = FIREBASE_DB;

export const addUser = async (
  id: any,
  {
    userName,
    email,
    phoneNumber = "",
    profileImage = "",
    isSubscribed,
    token,
    createdAt,
  },
) => {
  try {
    console.log("ADD_USER");
    const user = {
      userName,
      phoneNumber,
      profileImage,
      email,
      isSubscribed,
      token,
      createdAt,
      userId: id,
    };

    await setDoc(doc(db, "users", id), user);
  } catch (error) {
    console.log("add user error", error);
    throw error;
  }
};

// Returns true only when the user's account has been explicitly deleted
// (anonymized profile carries `isDeleted: true`). Fails open on transient
// read errors / missing docs so a flaky read never blocks a valid action.
export const isUserDeleted = async (
  userId?: string | null,
): Promise<boolean> => {
  if (!userId) return false;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data()?.isDeleted === true : false;
  } catch (error) {
    console.log("isUserDeleted check failed:", error);
    return false;
  }
};

export const subscribeToUserData = (userId: any, callback: any) => {
  if (userId) {
    const docRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log("User data updated:", docSnap.data());
        callback({ ...docSnap.data(), id: userId });
      } else {
        console.log("No such document for this user.");
        callback(null); // don’t auto-create user
      }
    });

    return unsubscribe;
  } else {
    console.log("No user ID provided");
    callback(null);
  }
};

export const getLoggedInUser = async () => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    console.log("get uid", user?.uid);
    if (user) {
      const docRef = doc(db, "users", user?.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        return docSnap.data();
      } else {
        console.log("No such document!");
      }
    } else {
      console.log("No user is not logged in");
    }
    return null;
  } catch (e) {
    console.log("Error getting cached document:", e);
    throw e;
  }
};

export const updateProfile = async (updatedData: any, imageUri: any) => {
  try {
    const userData = {
      ...updatedData,
    };

    if (imageUri && !imageUri?.startsWith("http")) {
      const profileUrl = await uploadImage(imageUri);
      userData.profileImage = profileUrl;
    }

    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      const userRef = doc(db, "users", user?.uid);
      await updateDoc(userRef, userData);
      console.log("User profile updated");
    } else {
      console.log("No user is logged in to update profile");
    }
  } catch (error) {
    console.log("Error updating profile:", error);
    throw error;
  }
};

export const saveSubscription = async (userId: any, subscriptionId: any) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { subscriptionId });
  } catch (error) {
    console.log("Error saving subscription:", error);
    throw error;
  }
};

export const updateUserToken = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { token });
    console.log("Push token updated for user:", userId);
  } catch (error) {
    console.error("Error updating push token:", error);
    throw error;
  }
};

type Review = {
  id: string;
  rating: number;
  reviewText?: string;
  createdAt?: any;
  reviewer?: {
    userId: string;
    userName: string;
    profileImage?: string;
  };
};

// Top Rated User Profile Data
export const fetchUserDetailedProfile = async (userId) => {
  try {
    /* ----------------------------------
       1. USER BASIC INFO
    ---------------------------------- */
    const userDocRef = doc(FIREBASE_DB, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : null;

    /* ----------------------------------
       2. NORMAL TASKS (single tasks)
    ---------------------------------- */
    const normalTasksQuery = query(
      collection(FIREBASE_DB, "completedTask"),
      where("acceptedBy.userId", "==", userId),
    );
    const normalTasksSnap = await getDocs(normalTasksQuery);

    /* ----------------------------------
       3. BULK TASKS (taskRequests)
    ---------------------------------- */
    const bulkCompletedQuery = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "==", "Completed"),
      where("confirmedWorkers", "array-contains", { userId }),
    );

    const bulkActiveQuery = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "in", ["pending", "Active"]),
      where("confirmedWorkers", "array-contains", { userId }),
    );

    const [bulkCompletedSnap, bulkActiveSnap] = await Promise.all([
      getDocs(bulkCompletedQuery),
      getDocs(bulkActiveQuery),
    ]);

    /* ----------------------------------
       4. REVIEWS
    ---------------------------------- */
    const reviewsQuery = query(
      collection(FIREBASE_DB, "reviews"),
      where("recipient.userId", "==", userId),
    );
    const reviewsSnap = await getDocs(reviewsQuery);

    /* ----------------------------------
       5. NORMALIZE BULK TASK
    ---------------------------------- */
    const normalizeBulkTask = (doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        isBulk: true,
        status: data.status,
        taskDetails: {
          taskType: data.taskType,
          description: data.description,
          imageUrls: data.images || [],
        },
        completedAt: data.completedAt || data.updatedAt,
        raw: data,
      };
    };

    /* ----------------------------------
       6. MERGE TASKS
    ---------------------------------- */
    let completedTasks = [];
    let activeTasks = [];
    let totalEarnings = 0;

    // Normal tasks
    normalTasksSnap.docs.forEach((doc) => {
      const data = doc.data();

      if (data.status === "Completed") {
        completedTasks.push({ ...data, isBulk: false });
      } else if (data.status === "pending") {
        activeTasks.push({ ...data, isBulk: false });
      }

      if (data.compensation) {
        totalEarnings += parseFloat(data.compensation.replace("$", "")) || 0;
      }
    });

    // Bulk completed tasks
    bulkCompletedSnap.docs.forEach((doc) => {
      completedTasks.push(normalizeBulkTask(doc));
    });

    // Bulk active tasks
    bulkActiveSnap.docs.forEach((doc) => {
      activeTasks.push(normalizeBulkTask(doc));
    });

    /* ----------------------------------
       7. REVIEWS DATA
    ---------------------------------- */
    const reviews: Review[] = reviewsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Review, "id">),
    }));

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    /* ----------------------------------
       8. SUCCESS RATE
    ---------------------------------- */
    const totalTasks = completedTasks.length + activeTasks.length;

    const calculateSuccessRate = () => {
      if (totalTasks === 0) return 0;

      if (reviews.length > 0) {
        const platformAvg = 4;
        const weight = 5;
        const totalRating = reviews.reduce((s, r) => s + r?.rating, 0);

        const bayesian =
          (totalRating + platformAvg * weight) / (reviews.length + weight);

        return Math.min(100, Math.round((bayesian / 5) * 100));
      }

      return Math.round((completedTasks.length / totalTasks) * 70);
    };

    const successRate = calculateSuccessRate();

    /* ----------------------------------
       9. MEMBER SINCE
    ---------------------------------- */
    const memberSince = userData?.createdAt
      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" },
        )
      : "Recently";

    /* ----------------------------------
       10. FINAL RESPONSE
    ---------------------------------- */
    return {
      userBasic: userData,
      stats: {
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        successRate,
        totalEarnings,
        memberSince,
        totalTasks,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      tasks: {
        active: activeTasks,
        completed: completedTasks,
      },
      reviews,
    };
  } catch (error) {
    console.error("Error fetching user detailed profile:", error);
    return null;
  }
};

export const updateUserLocation = async (locationData) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      const userRef = doc(db, "users", user?.uid);
      await updateDoc(userRef, {
        ...locationData,
        lastLocationUpdate: new Date().toISOString(),
      });
    } else {
      console.log("No user is logged in to update location");
    }
  } catch (error) {
    console.log("Error updating user location:", error);
    throw error;
  }
};
