/* eslint-disable import/no-unresolved */
import { FIREBASE_AUTH } from '../../firebaseConfig';
import {
	sendEmailVerification,
	signOut,
	updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
	reauthenticateWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';

import * as SecureStore from 'expo-secure-store';

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(FIREBASE_AUTH, email);
    console.log('Password reset email sent successfully!');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw error;
  }
};

export const emailVerification = async (user) => {
	if (!user) {
		alert('Unable to complete the process, please try again');
		return;
	}

	try {
		sendEmailVerification(user, {
			handleCodeInApp: true,
			url: 'https://socially-1720865151833.firebaseapp.com/',
			android: {
				packageName: 'com.WildLife_ID.android',
				installApp: true,
				minimumVersion: '1',
			},
			iOS: {
				bundleId: 'com.WildLife_ID.ios',
			},
		}).then(() => {
			alert('Verification email to1 ' + user.email);
		}).catch(e => console.log('Verification email failed2', e));
	} catch (error) {
		const errorCode = error.code;
		const errorMessage = error.message;
		console.error('Email verification failed1', errorCode, errorMessage);
		throw error;
	}
};

// Function to update user password
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      // Reauthenticate the user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
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
};

// Remember me
// Save credentials
export async function saveCredentials(email, password) {
  await SecureStore.setItemAsync('email', email);
  await SecureStore.setItemAsync('password', password);
}

// Retrieve credentials
export async function getCredentials() {
  const email = await SecureStore.getItemAsync('email');
  const password = await SecureStore.getItemAsync('password');
  return { email, password };
}
