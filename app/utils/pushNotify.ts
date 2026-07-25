import { doc, getDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { NOTIFICATION_ENDPOINTS } from "../config/constants";

// Push tokens are cached inline across task/notification docs. Those copies go
// stale (or belong to deleted accounts), so we resolve the recipient's *live*
// status/token from their profile before sending.
//
// Returns null when the user must NOT be notified (account deleted, or no token
// on file). Otherwise returns the freshest token: the one on the profile,
// falling back to the caller-supplied (cached) token.
export const resolveActivePushToken = async (
  userId?: string | null,
  fallbackToken?: string | null,
): Promise<string | null> => {
  if (!userId) return fallbackToken || null;
  try {
    const snap = await getDoc(doc(FIREBASE_DB, "users", userId));
    if (!snap.exists()) return fallbackToken || null;
    const data: any = snap.data();
    if (data?.isDeleted === true) return null; // deleted account → never notify
    return data?.token || fallbackToken || null;
  } catch (error) {
    console.log("resolveActivePushToken failed:", error);
    // Fail open on transient read errors so valid notifications aren't lost.
    return fallbackToken || null;
  }
};

interface SendPushArgs {
  userId?: string | null;
  token?: string | null;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Sends a push to a user, skipping deleted accounts and stale/empty tokens.
// Returns true only if a send was actually attempted.
export const sendPushToUser = async ({
  userId,
  token,
  title,
  body,
  data,
}: SendPushArgs): Promise<boolean> => {
  const activeToken = await resolveActivePushToken(userId, token);
  if (!activeToken) {
    console.log(
      "sendPushToUser: skipped (deleted account or no active token)",
    );
    return false;
  }
  try {
    await fetch(NOTIFICATION_ENDPOINTS.SEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fcmToken: activeToken, title, body, data }),
    });
    return true;
  } catch (error) {
    console.log("sendPushToUser: send failed:", error);
    return false;
  }
};
