// eslint-disable-next-line import/no-unresolved
import { getAuth } from "firebase/auth";
import {
  serverTimestamp,
  doc,
  setDoc,
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
} from "firebase/firestore";
// FIREBASE config
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// shared
import { uploadImage } from "./Shared.service";
import { translateText } from "../translation/googleTranslation";

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
      })
    );
    const userId = getAuth().currentUser?.uid;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    await addDoc(collection(db, "taskRequests"), {
      ...data,
      status: "Active",
      imageUrls,
      createdAt: Timestamp.now(),
      userId: userId,
      user: { ...userData },
    });

    return true;
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
      })
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
  pageSize = PAGE_SIZE
) => {
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) throw new Error("User is not logged in");

    let q = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "==", postStatus),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastVisiblePost) {
      q = query(
        collection(FIREBASE_DB, "taskRequests"),
        where("status", "==", postStatus),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisiblePost),
        limit(pageSize)
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
      })
    );

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    return { tasksArray, lastVisible };
  } catch (error) {
    console.log("GET_MY_POSTS: ", error);
    throw error;
  }
};

// export const getRequestList = async (
//   taskType = "",
//   searchQuery = "",
//   lastVisiblePost = null,
//   pageSize = PAGE_SIZE
// ) => {
//   try {
//     const userId = getAuth().currentUser?.uid;
//     if (!userId) throw new Error("User is not logged in");

//     let q = query(
//       collection(FIREBASE_DB, "taskRequests"),
//       where("status", "==", "Active"),
//       where("userId", "!=", userId),
//       where("acceptedBy", "==", null),
//       orderBy("createdAt", "desc"),
//       limit(pageSize)
//     );

//     if (lastVisiblePost) {
//       q = query(q, startAfter(lastVisiblePost));
//     }

//     if (taskType && taskType !== "All") {
//       q = query(q, where("taskType", "==", taskType));
//     }

//     if (searchQuery) {
//       const keywords = searchQuery
//         .trim()
//         .split(" ")
//         .map((k) => k.toLowerCase());
//       q = query(
//         q,
//         where("descriptionKeywords", "array-contains-any", keywords)
//       );
//     }

//     const snapshot = await getDocs(q);

//     const tasksArray = snapshot.docs.map((docSnapshot) => ({
//       id: docSnapshot.id,
//       ...docSnapshot.data(),
//     }));

//     const lastVisible = snapshot.docs[snapshot.docs.length - 1];
//     return { tasksArray, lastVisible };

//   } catch (error) {
//     console.log("GET_POSTS_LIST: ", error);
//     throw error;
//   }
// };

// real-time version of getRequestList

export const getRequestList = (
  taskType = "",
  searchQuery = "",
  lastVisiblePost = null,
  callback,
  errorCallback
) => {
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) throw new Error("User is not logged in");

    let q = query(
      collection(FIREBASE_DB, "taskRequests"),
      where("status", "==", "Active"),
      where("userId", "!=", userId),
      where("acceptedBy", "==", null),
      orderBy("createdAt", "desc")
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
              (task?.taskType || "").toLowerCase().includes(qLower)
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
      }
    );

    return unsubscribe;
  } catch (err) {
    console.log("GET_POSTS_LIST:", err);
    errorCallback && errorCallback(err);
    return () => {};
  }
};

export const updateReqestStatus = async (id: any, status: any, data: any) => {
  try {
    const userRef = doc(db, "taskRequests", id);
    await updateDoc(userRef, {
      ...data,
      status: status,
    });

    const q = query(collection(db, "completedTask"), where("taskId", "==", id));
    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map((docSnap) =>
      updateDoc(doc(db, "completedTask", docSnap.id), {
        status,
        completedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return true;
  } catch (error) {
    console.error("Error_saving_post: ", error);
    throw error;
  }
};
