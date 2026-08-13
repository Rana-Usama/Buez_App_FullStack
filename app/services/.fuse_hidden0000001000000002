import { FIREBASE_AUTH } from "../../firebaseConfig";
import {
  sendEmailVerification,
  signOut,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { deleteUser } from "firebase/auth";
import { purgeUserAccountData } from "./AccountDeletion.service";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { appleAuth } from "@invertase/react-native-apple-authentication"; // ✅ Needed for Apple login
import { Linking } from "react-native";
import { AnyObject } from "yup";

export const resetPassword = async (email: any) => {
  try {
    await sendPasswordResetEmail(FIREBASE_AUTH, email);
    return true;
  } catch (error: any) {
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
  } catch (error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Email verification failed1", errorCode, errorMessage);
    throw error;
  }
};

// Function to update user password
export const updatePassword = async (
  currentPassword: any,
  newPassword: any,
) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      // Reauthenticate the user first
      const credential = EmailAuthProvider.credential(
        user?.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
    } else {
      console.log("No user is logged in to update password");
    }
  } catch (error: any) {
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

export const deleteCurrentUser = async (currentPassword: string) => {
  const user = FIREBASE_AUTH.currentUser;
  if (!user) return;
  try {
    // 🔑 Step 1: Re-authenticate the user
    const credential = EmailAuthProvider.credential(
      user?.email,
      currentPassword,
    );
    await reauthenticateWithCredential(user, credential);
    const userId = user.uid;

    // 🧹 Step 2: Clean up Firestore/Storage data. Deletes private data and
    // active tasks, cancels active acceptances (owners are notified), and
    // anonymizes everything other users still rely on (chats, completed task
    // history, reviews written) as "Deleted User".
    await purgeUserAccountData(userId);

    // 🚀 Step 3: Delete the auth account
    await deleteUser(user);
    console.log("User account deleted successfully");
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

export async function deleteGoogleAccount() {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) throw new Error("No user signed in");
    const userInfo = await GoogleSignin.signIn();
    const { idToken }: any = userInfo?.data;
    const googleCredential = GoogleAuthProvider.credential(idToken);
    await reauthenticateWithCredential(user, googleCredential);
    const userId = user.uid;

    // Clean up Firestore/Storage data (delete + anonymize strategy), then
    // remove the auth account.
    await purgeUserAccountData(userId);
    await deleteUser(user);
    console.log("Google account deleted ✅");
  } catch (error: any) {
    console.log("Error deleting Google user:", error.message);
  }
}

export async function deleteAppleAccount() {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) throw new Error("No user signed in");

    // 1️⃣ Perform Apple Sign-In request again for reauthentication
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const { identityToken, nonce, authorizationCode } =
      appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error("No identity token from Apple Sign-In");
    }

    // 2️⃣ Reauthenticate user with Apple credentials
    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });

    await reauthenticateWithCredential(user, credential);

    const userId = user.uid;

    // 3️⃣ Clean up Firestore/Storage data (delete + anonymize strategy)
    await purgeUserAccountData(userId);

    // if (authorizationCode) {
    //   await revokeToken(FIREBASE_AUTH, authorizationCode);
    // }
    await Linking.openURL("https://appleid.apple.com/account/manage");

    // 5️⃣ Delete user from Firebase Authentication
    await deleteUser(user);

    console.log("🍎 Apple account deleted successfully ✅");
  } catch (error: any) {
    console.log("❌ Error deleting Apple user:", error.message || error);
    throw error;
  }
}
