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
    isFreeTrial,
  }
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
      isFreeTrial,
      userId: id,
    };

    await setDoc(doc(db, "users", id), user);
  } catch (error) {
    console.log("add user error", error);
    throw error;
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

// Top Rated User Profile Data
export const fetchUserDetailedProfile = async (userId) => {
  console.log(userId);
  try {
    // Fetch user basic info
    const userDocRef = doc(FIREBASE_DB, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    let userData = null;
    if (userDocSnap.exists()) {
      userData = userDocSnap.data();
      console.log("User data found:", userData);
    } else {
      console.log("No user found with ID:", userId);
    }
    console.log("............", userDocSnap);

    // Fetch user's tasks from completedTask collection
    const tasksQuery = query(
      collection(FIREBASE_DB, "completedTask"),
      where("acceptedBy.userId", "==", userId)
    );
    const tasksSnap = await getDocs(tasksQuery);
    const reviewsQuery = query(
      collection(FIREBASE_DB, "reviews"),
      where("taskOwnerId", "==", userId)
    );
    const reviewsSnap = await getDocs(reviewsQuery);

    let completedTasks = [];
    let activeTasks = [];
    let totalEarnings = 0;
    let reviews = [];

    tasksSnap.docs.forEach((doc) => {
      const taskData = doc.data();
      if (taskData.status === "Completed") {
        completedTasks.push(taskData);
        // Calculate earnings if you have compensation field
        if (taskData.compensation) {
          totalEarnings +=
            parseFloat(taskData.compensation.replace("$", "")) || 0;
        }
      } else if (taskData.status === "pending") {
        activeTasks.push(taskData);
      }
    });

    reviewsSnap.docs.forEach((doc) => {
      const reviewData = doc.data();
      reviews.push({
        id: doc.id,
        ...reviewData,
      });
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
          reviews.length
        : 0;

    // Calculate success rate
    const totalTasks = completedTasks.length + activeTasks.length;

    const calculateSuccessRate = (reviews, completedTasks, totalTasks) => {
      // If no tasks at all, success rate is 0
      if (totalTasks === 0) {
        return 0;
      }
      // If user has reviews, use Bayesian average
      if (reviews.length > 0) {
        const platformAverageRating = 4.0; // Assume platform average is 4 stars
        const platformWeight = 5; // Number of "virtual" platform reviews for smoothing
        const userTotalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const userReviewCount = reviews.length;
        // Bayesian calculation: (user_rating * user_reviews + platform_avg * platform_weight) / (user_reviews + platform_weight)
        const bayesianRating =
          (userTotalRating + platformAverageRating * platformWeight) /
          (userReviewCount + platformWeight);
        // Convert to percentage (5 stars = 100%, 4 stars = 80%, etc.)
        const successRate = Math.min(
          100,
          Math.round((bayesianRating / 5) * 100)
        );
        return successRate;
      }
      const completionRate = completedTasks.length / totalTasks;
      const newUserPenalty = 0.7; // 30% penalty for users without reviews
      const adjustedRate = Math.round(completionRate * newUserPenalty * 100);

      return Math.max(0, Math.min(100, adjustedRate));
    };

    let successRate = calculateSuccessRate(reviews, completedTasks, totalTasks);

    // Get member since date
    const memberSince = userData?.freeTrialStartedAt
      ? new Date(userData.freeTrialStartedAt.seconds * 1000).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )
      : "Recently";

    return {
      userBasic: userData,
      stats: {
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        successRate: successRate,
        totalEarnings: totalEarnings,
        memberSince: memberSince,
        totalTasks: totalTasks,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      tasks: {
        completed: completedTasks,
        active: activeTasks,
      },
      reviews: reviews,
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
