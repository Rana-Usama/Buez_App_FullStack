// eslint-disable-next-line import/no-unresolved
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
// FIREBASE config
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
// shared
import { uploadImage } from "./Shared.service";

const db = FIREBASE_DB;

export const addUser = async (id: any, { userName, email, phoneNumber = "", profileImage = "", isSubscribed, token, isFreeTrial }) => {
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
      userId : id
    };

    await setDoc(doc(db, "users", id), user);
  } catch (error) {
    console.log("add user error", error);
    throw error;
  }
};

// export const subscribeToUserData = (userId: any, callback: any) => {
//   if (userId) {
//     const docRef = doc(db, "users", userId);

//     const unsubscribe = onSnapshot(docRef, async (docSnap) => {
//       if (docSnap.exists()) {
//         console.log("User data updated:", docSnap.data());
//         callback({ ...docSnap.data(), id: userId });
//       } else {
//         console.log("No such document, creating a new one...");
//         const defaultUserData = {
//           userName: "",
//           bio: "",
//           phoneNumber: "",
//           profileTier: "Basic",
//           profileImage: "",
//         };
//         try {
//           // Create a new document with default empty values
//           await setDoc(docRef, defaultUserData);
//           console.log("New user document created with default data.");
//           callback(defaultUserData);
//         } catch (error) {
//           console.error("Error creating user document:", error);
//           callback(null); // You might want to return an error or handle it
//         }
//       }
//     });

//     return unsubscribe;
//   } else {
//     console.log("No user ID provided");
//     callback(null);
//   }
// };


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
