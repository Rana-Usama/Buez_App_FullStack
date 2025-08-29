import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import {
  sendEmailVerification,
  signOut,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { deleteUser } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";

import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";

export const resetPassword = async (email: any) => {
  try {
    await sendPasswordResetEmail(FIREBASE_AUTH, email);
    console.log("Password reset email sent successfully!");
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    throw error;
  }
};

export const emailVerification = async (user: any) => {
  if (!user) {
    alert("Unable to complete the process, please try again");
    return;
  }

  try {
    sendEmailVerification(user, {
      handleCodeInApp: true,
      url: "https://socially-1720865151833.firebaseapp.com/",
      android: {
        packageName: "com.WildLife_ID.android",
        installApp: true,
        minimumVersion: "1",
      },
      iOS: {
        bundleId: "com.WildLife_ID.ios",
      },
    })
      .then(() => {
        alert("Verification email to1 " + user.email);
      })
      .catch((e) => console.log("Verification email failed2", e));
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Email verification failed1", errorCode, errorMessage);
    throw error;
  }
};

// Function to update user password
export const updatePassword = async (
  currentPassword: any,
  newPassword: any
) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      // Reauthenticate the user first
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      console.log("User re-authenticated");

      // Update the password
      await firebaseUpdatePassword(user, newPassword);
      console.log("Password updated successfully");
    } else {
      console.log("No user is logged in to update password");
    }
  } catch (error) {
    console.log("Error updating password:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(FIREBASE_AUTH);
  await SecureStore.setItemAsync("loggedOut", "true");
  Toast.show({
    type: "success",
    text1: "Logout",
    text2: "You have been successfully logged out from your account!",
  });
};

// Remember me
// Save credentials
export async function saveCredentials(email: any, password: any) {
  await SecureStore.setItemAsync("email", email);
  await SecureStore.setItemAsync("password", password);
}

// Retrieve credentials
export async function getCredentials() {
  const email = await SecureStore.getItemAsync("email");
  const password = await SecureStore.getItemAsync("password");
  return { email, password };
}

export async function removeCredentials() {
  await SecureStore.deleteItemAsync("email");
  await SecureStore.deleteItemAsync("password");
}

export const deleteCurrentUser = async () => {
  const user = FIREBASE_AUTH.currentUser;
  if (!user) return;
  try {
    const userId = user.uid;

    await deleteDoc(doc(FIREBASE_DB, "users", userId));

    const batchDelete = async (colName, field, op, value) => {
      const q = query(
        collection(FIREBASE_DB, colName),
        where(field, op, value)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(FIREBASE_DB);
        snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      } else {
        console.log(`No docs found in '${colName}'`);
      }
    };

    await batchDelete("taskRequests", "userId", "==", userId);
    await batchDelete("chats", "participants", "array-contains", userId);
    await batchDelete("completedTask", "taskOwnerId", "==", userId);
    await deleteUser(user);
  } catch (error) {
    console.log("Error deleting user and Firestore data:", error);
  }
};


export const saveLocationToSecureStore = async (location) => {
  try {
    await SecureStore.setItemAsync("user_location", JSON.stringify(location));
  } catch (e) {
    console.log("Error saving location:", e);
  }
};

export const getLocationFromSecureStore = async () => {
  try {
    const data = await SecureStore.getItemAsync("user_location");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.log("Error reading location:", e);
    return null;
  }
};
