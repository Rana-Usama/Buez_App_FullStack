import * as SecureStore from "expo-secure-store";
import { FIREBASE_AUTH } from "../../firebaseConfig";

/**
 * Tracks whether a user has already seen the Founder Phase Introduction
 * screen. The intro is a one-time, per-user experience shown right after a
 * successful sign-up / sign-in (email, Google or Apple), so users always get
 * the chance to claim their founder spot — even on a shared device.
 *
 * The completion flag is keyed by Firebase UID so that every account sees the
 * intro exactly once. If no user is available we fall back to a device-level
 * key so the screen still behaves sensibly.
 *
 * NOTE: this is intentionally backend-free. Live founder-slot data will be
 * wired up in a later step; this flag only controls the "show once" behaviour.
 */
const BASE_KEY = "founderIntroCompleted";

// SecureStore keys only allow [A-Za-z0-9._-]; Firebase UIDs are alphanumeric,
// so "<base>_<uid>" is always a valid key.
const buildKey = (userId?: string | null): string => {
  const uid = userId ?? FIREBASE_AUTH.currentUser?.uid;
  return uid ? `${BASE_KEY}_${uid}` : BASE_KEY;
};

/**
 * Returns true if the Founder Phase Introduction has already been completed by
 * this user. Fails safe (returns false) so the screen is shown if storage is
 * unavailable.
 */
export const hasCompletedFounderIntro = async (
  userId?: string | null,
): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(buildKey(userId));
    return value === "true";
  } catch (error) {
    console.log("[FounderIntro] Failed to read completion flag:", error);
    return false;
  }
};

/**
 * Marks the Founder Phase Introduction as completed for this user so it is
 * never shown to them again.
 */
export const markFounderIntroCompleted = async (
  userId?: string | null,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(buildKey(userId), "true");
  } catch (error) {
    console.log("[FounderIntro] Failed to persist completion flag:", error);
  }
};
