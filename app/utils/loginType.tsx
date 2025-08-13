import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";


const getEmailDocId = (email) => email.replace(/\./g, "_").toLowerCase();

/**
 * @param {string} email 
 * @param {"facebook" | "instagram"} currentType 
 * @returns {Promise<string|null>} 
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

 * @param {string} email 
 * @param {"facebook" | "instagram"} loginType 
 */
export const saveEmailLoginType = async (email, loginType) => {
  const emailKey = getEmailDocId(email);
  await setDoc(doc(FIREBASE_DB, "emails", emailKey), {
    loginType,
    updatedAt: new Date().toISOString(),
  });
};
