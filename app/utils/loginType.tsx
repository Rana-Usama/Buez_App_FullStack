import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";

/**
 * Converts an email to a safe Firestore document ID
 */
const getEmailDocId = (email) => email.replace(/\./g, "_").toLowerCase();

/**
 * Check if the email is already registered with a different login type.
 * @param {string} email - The user's email.
 * @param {"facebook" | "instagram"} currentType - The login method the user is trying to use.
 * @returns {Promise<string|null>} - Returns the conflicting login type or null if allowed.
 */
export const checkExistingEmailLoginType = async (email, currentType) => {
  const emailKey = getEmailDocId(email);
  const userDoc = await getDoc(doc(FIREBASE_DB, "emails", emailKey));

  if (userDoc.exists()) {
    const data = userDoc.data();
    if (data.loginType !== currentType) {
      return data.loginType;
    }
  }
  return null;
};

/**
 * Save the login type for a specific email to Firestore.
 * @param {string} email - The user's email.
 * @param {"facebook" | "instagram"} loginType - The login method used.
 */
export const saveEmailLoginType = async (email, loginType) => {
  const emailKey = getEmailDocId(email);
  await setDoc(doc(FIREBASE_DB, "emails", emailKey), {
    loginType,
    updatedAt: new Date().toISOString(),
  });
};
