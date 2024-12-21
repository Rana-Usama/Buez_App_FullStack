// eslint-disable-next-line import/no-unresolved
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, addDoc, collection, Timestamp, query, getDocs, where, orderBy, limit, startAfter } from 'firebase/firestore';
// FIREBASE config
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// shared
import { uploadImage } from './Shared.service';

const db = FIREBASE_DB;
const PAGE_SIZE = 10;

export const savePost = async (data, imageUris) => {
  try {
    const imageUrls = await Promise.all(imageUris.map(uri => {
      if (uri && !uri?.startsWith('http')) {
        uploadImage(uri);
      }

      return uri;
    }));
    const userId = getAuth().currentUser?.uid;
    await addDoc(collection(db, 'taskRequests'), {
      ...data,
      status: 'Active',
      imageUrls,
      createdAt: Timestamp.now(),
      userId: userId
    });

    return true;
  } catch (error) {
    console.error("Error_saving_post: ", error);
    throw error
  }
};

export const updatePost = async (id, data, imageUris) => {
  try {
    const imageUrls = await Promise.all(imageUris.map(uri => {
      if (uri && !uri?.startsWith('http')) {
        uploadImage(uri);
      }

      return uri;
    }));
    const userId = getAuth().currentUser?.uid;
    const userRef = doc(db, "taskRequests", id);
    await updateDoc(userRef, {
      ...data,
      status: 'Active',
      imageUrls,
      updatedAt: Timestamp.now(),
      userId: userId
    });

    return true;
  } catch (error) {
    console.error("Error_saving_post: ", error);
    throw error
  }
};

export const getMyReuqests = async (postStatus, lastVisiblePost = null, pageSize = PAGE_SIZE) => {
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) {
      throw new Error("User is not logged in");
    }

    let q = query(
      collection(FIREBASE_DB, 'taskRequests'),
      where('status', '==', postStatus),
      where("userId", "==", userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize));

    if (lastVisiblePost) {
      q = query(
        collection(FIREBASE_DB, 'taskRequests'),
        where('status', '==', postStatus),
        where("userId", "==", userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisiblePost),
        limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const tasksArray = [];

    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data();

      // Get post creator details
      const userRef = doc(db, "users", postData.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      tasksArray.push({ id: docSnapshot.id, ...postData, user: userData });
    }

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    console.log('RECORDS:' ,tasksArray);
    return {tasksArray, lastVisible};
  } catch (error) {
    console.log('GET_MY_POSTS: ', error);
    throw error;
  }
}

export const getRequestList = async (taskType = '', searchQuery = '', lastVisiblePost = null, pageSize = PAGE_SIZE) => {
  try {
    const userId = getAuth().currentUser?.uid;
    if (!userId) {
      throw new Error("User is not logged in");
    }

    // const keywords = 'want help'.split(' ');
    let q = query(
      collection(FIREBASE_DB, 'taskRequests'),
      where("status", "==", 'Active'),
      orderBy('createdAt', 'desc'),
      // where('taskType', '==', 'Gardening'),
      // where('descriptionKeywords', 'array-contains-any', keywords),
      limit(pageSize));

    if (lastVisiblePost) {
      q = query(
        collection(FIREBASE_DB, 'taskRequests'),
        where("status", "==", 'Active'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisiblePost),
        limit(pageSize));
    }

    if (taskType && taskType !== 'All') {
      q = query(q, where('taskType', '==', taskType));
    }
    console.table({ taskType, searchQuery });
    if (searchQuery) {
      const keywords = searchQuery.split(' ');
      q = query(q, where('descriptionKeywords', 'array-contains-any', keywords));
    }

    const snapshot = await getDocs(q);
    const tasksArray = [];

    for (const docSnapshot of snapshot.docs) {
      const postData = docSnapshot.data();

      // Get post creator details
      const userRef = doc(db, "users", postData.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      tasksArray.push({ id: docSnapshot.id, ...postData, user: userData });
    }

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    console.log('HOME RECORDS:' ,tasksArray);
    return {tasksArray, lastVisible};
  } catch (error) {
    console.log('GET_MY_POSTS: ', error);
    throw error;
  }
}