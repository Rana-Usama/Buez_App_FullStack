import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";

const db = FIREBASE_DB;

// ── Founder program constants ────────────────────────────────────────────────
export const FOUNDER_DURATION_DAYS = 60;
const FOUNDER_DEVICES_COLLECTION = "founderDevices";
const DAY_MS = 24 * 60 * 60 * 1000;

export type FounderStatus = "active" | "expired";

/**
 * Founder enrollment fields persisted on the user document. Field names follow
 * the project's existing camelCase convention (isSubscribed / subscriptionStart
 * …) rather than introducing snake_case.
 */
export interface FounderInfo {
  isFounder: boolean;
  founderStartedAt: any; // Firestore Timestamp | ISO string | null
  founderExpiresAt: any; // Firestore Timestamp | ISO string | null
  founderDurationDays: number;
  founderStatus: FounderStatus;
  founderNumber?: number | null;
}

export type FounderClaimReason =
  | "claimed"
  | "already_founder"
  | "device_claimed"
  | "no_user"
  | "error";

export interface FounderClaimResult {
  success: boolean;
  reason: FounderClaimReason;
  data?: FounderInfo;
  message?: string;
}

// ── Helpers (future-proofing: badge / countdown / expiry handling) ───────────
const parseDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  if (typeof value === "string") return new Date(value);
  if (value instanceof Date) return value;
  return null;
};

/**
 * Extracts the founder fields from a user record (or null if not a founder).
 * Useful for the founder badge and other read-only consumers.
 */
export const getFounderInfo = (userData: any): FounderInfo | null => {
  if (!userData || userData.isFounder !== true) return null;
  return {
    isFounder: true,
    founderStartedAt: userData.founderStartedAt ?? null,
    founderExpiresAt: userData.founderExpiresAt ?? null,
    founderDurationDays: userData.founderDurationDays ?? FOUNDER_DURATION_DAYS,
    founderStatus: (userData.founderStatus as FounderStatus) ?? "active",
    founderNumber: userData.founderNumber ?? null,
  };
};

/**
 * Whether the user's founder benefits are currently active (not expired).
 * Future consumers: countdown, gating, renewal/conversion prompts.
 */
export const isFounderActive = (userData: any): boolean => {
  if (!userData || userData.isFounder !== true) return false;
  if (userData.founderStatus && userData.founderStatus !== "active") {
    return false;
  }
  const expires = parseDate(userData.founderExpiresAt);
  if (!expires) return userData.founderStatus === "active";
  return Date.now() < expires.getTime();
};

/**
 * Remaining founder days (>= 0). Future consumer: countdown UI.
 */
export const getFounderDaysRemaining = (userData: any): number => {
  const expires = parseDate(userData?.founderExpiresAt);
  if (!expires) return 0;
  const ms = expires.getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
};

/**
 * Claims a Founder Spot for the current user.
 *
 * Enforcement:
 *  - Per account: a user who is already a founder keeps their existing
 *    enrollment (no new record is written).
 *  - Per device: a device that already claimed a spot for a different account
 *    cannot be used to claim again.
 *
 * The user document and the device claim are written together in a single
 * atomic batch so the user is never left in a partially-enrolled state.
 */
export const claimFounderSpot = async (
  deviceId?: string | null,
): Promise<FounderClaimResult> => {
  try {
    const userId = getAuth()?.currentUser?.uid;
    if (!userId) {
      return {
        success: false,
        reason: "no_user",
        message: "No authenticated user.",
      };
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;

    // ── Per account: already enrolled → preserve existing founder info ──
    if (userData?.isFounder === true) {
      return {
        success: true,
        reason: "already_founder",
        data: getFounderInfo(userData) ?? undefined,
      };
    }

    // ── Per device: block if another account already claimed on this device ──
    let deviceRef: ReturnType<typeof doc> | null = null;
    if (deviceId) {
      deviceRef = doc(db, FOUNDER_DEVICES_COLLECTION, deviceId);
      const deviceSnap = await getDoc(deviceRef);
      if (deviceSnap.exists() && deviceSnap.data()?.userId !== userId) {
        return {
          success: false,
          reason: "device_claimed",
          message: "A Founder Spot has already been claimed on this device.",
        };
      }
    }

    // ── Build the founder enrollment (client time; start + 60 days) ──
    const now = new Date();
    const expiresAt = new Date(now.getTime() + FOUNDER_DURATION_DAYS * DAY_MS);

    const founderInfo: FounderInfo = {
      isFounder: true,
      founderStartedAt: Timestamp.fromDate(now),
      founderExpiresAt: Timestamp.fromDate(expiresAt),
      founderDurationDays: FOUNDER_DURATION_DAYS,
      founderStatus: "active",
    };

    // ── Atomic write: user enrollment + device claim together ──
    const batch = writeBatch(db);
    batch.set(userRef, founderInfo, { merge: true });
    if (deviceRef) {
      batch.set(deviceRef, {
        userId,
        deviceId,
        claimedAt: serverTimestamp(),
      });
    }
    await batch.commit();

    return { success: true, reason: "claimed", data: founderInfo };
  } catch (error) {
    console.log("[Founder] claimFounderSpot error:", error);
    return {
      success: false,
      reason: "error",
      message: "Failed to claim Founder Spot.",
    };
  }
};
