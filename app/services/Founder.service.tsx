import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";

const db = FIREBASE_DB;

// ── Founder program constants ────────────────────────────────────────────────
export const FOUNDER_DURATION_DAYS = 60;
export const FOUNDER_TOTAL_SPOTS = 100;
const FOUNDER_DEVICES_COLLECTION = "founderDevices";
// Single authoritative counter for the program. `claimedCount` is only ever
// incremented inside the claim transaction, so it always equals the number of
// founder spots actually taken and drives both stats and number assignment.
const FOUNDER_CONFIG_COLLECTION = "config";
const FOUNDER_CONFIG_DOC = "founderProgram";
const DAY_MS = 24 * 60 * 60 * 1000;

export type FounderStatus = "active" | "expired";

/**
 * Founder enrollment fields persisted on the user document. Field names follow
 * the project's existing camelCase convention (isSubscribed / subscriptionStart
 * …) rather than introducing snake_case.
 */
export interface FounderInfo {
  isFounder: boolean;
  founderNumber: number | null;
  founderStartedAt: any; // Firestore Timestamp | ISO string | null
  founderExpiresAt: any; // Firestore Timestamp | ISO string | null
  founderDurationDays: number;
  founderStatus: FounderStatus;
}

export interface FounderStats {
  total: number;
  filled: number;
  remaining: number;
}

export type FounderClaimReason =
  | "claimed"
  | "already_founder"
  | "device_claimed"
  | "sold_out"
  | "no_user"
  | "error";

export interface FounderClaimResult {
  success: boolean;
  reason: FounderClaimReason;
  data?: FounderInfo;
  message?: string;
}

const configRef = () => doc(db, FOUNDER_CONFIG_COLLECTION, FOUNDER_CONFIG_DOC);

const readStats = (data: any): FounderStats => {
  const total =
    typeof data?.limit === "number" ? data.limit : FOUNDER_TOTAL_SPOTS;
  const filled =
    typeof data?.claimedCount === "number" && data.claimedCount > 0
      ? data.claimedCount
      : 0;
  return {
    total,
    filled: Math.min(filled, total),
    remaining: Math.max(total - filled, 0),
  };
};

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
 */
export const getFounderInfo = (userData: any): FounderInfo | null => {
  if (!userData || userData.isFounder !== true) return null;
  return {
    isFounder: true,
    founderNumber: userData.founderNumber ?? null,
    founderStartedAt: userData.founderStartedAt ?? null,
    founderExpiresAt: userData.founderExpiresAt ?? null,
    founderDurationDays: userData.founderDurationDays ?? FOUNDER_DURATION_DAYS,
    founderStatus: (userData.founderStatus as FounderStatus) ?? "active",
  };
};

/**
 * Whether the user's founder benefits are currently active (not expired).
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
 * One-off read of the live founder stats (total / filled / remaining).
 */
export const getFounderStats = async (): Promise<FounderStats> => {
  try {
    const snap = await getDoc(configRef());
    return readStats(snap.exists() ? snap.data() : null);
  } catch (error) {
    console.log("[Founder] getFounderStats error:", error);
    return {
      total: FOUNDER_TOTAL_SPOTS,
      filled: 0,
      remaining: FOUNDER_TOTAL_SPOTS,
    };
  }
};

/**
 * Real-time subscription to the founder stats. Returns an unsubscribe fn.
 */
export const subscribeFounderStats = (
  onChange: (stats: FounderStats) => void,
): (() => void) => {
  try {
    return onSnapshot(
      configRef(),
      (snap) => onChange(readStats(snap.exists() ? snap.data() : null)),
      (error) => {
        console.log("[Founder] subscribeFounderStats error:", error);
        onChange({
          total: FOUNDER_TOTAL_SPOTS,
          filled: 0,
          remaining: FOUNDER_TOTAL_SPOTS,
        });
      },
    );
  } catch (error) {
    console.log("[Founder] subscribeFounderStats setup error:", error);
    onChange({
      total: FOUNDER_TOTAL_SPOTS,
      filled: 0,
      remaining: FOUNDER_TOTAL_SPOTS,
    });
    return () => {};
  }
};

/**
 * Claims a Founder Spot for the current user and assigns the next available
 * founder number.
 *
 * Everything runs inside a single Firestore transaction so the operation is
 * atomic and gap-free:
 *  - Per account: an existing founder keeps their number (no re-assignment,
 *    counter untouched).
 *  - Per device: a device that already claimed for another account is blocked.
 *  - Number assignment: the founder number is `claimedCount + 1`, and the
 *    counter is only incremented on a successful claim — so a number that is
 *    never claimed stays available for the next user who claims first.
 *  - Capacity: no claim is allowed once the counter reaches the limit.
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
    const deviceRef = deviceId
      ? doc(db, FOUNDER_DEVICES_COLLECTION, deviceId)
      : null;
    const cfgRef = configRef();

    const outcome = await runTransaction(db, async (tx) => {
      // ── Reads first (Firestore requires all reads before writes) ──
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      // Per account: already enrolled → keep existing enrollment/number.
      if (userData?.isFounder === true) {
        return {
          success: true,
          reason: "already_founder" as FounderClaimReason,
          data: getFounderInfo(userData) ?? undefined,
        };
      }

      // Per device: another account already claimed on this device.
      if (deviceRef) {
        const deviceSnap = await tx.get(deviceRef);
        if (deviceSnap.exists() && deviceSnap.data()?.userId !== userId) {
          return {
            success: false,
            reason: "device_claimed" as FounderClaimReason,
            message: "A Founder Spot has already been claimed on this device.",
          };
        }
      }

      const cfgSnap = await tx.get(cfgRef);
      const cfgData = cfgSnap.exists() ? cfgSnap.data() : null;
      const limit =
        typeof cfgData?.limit === "number"
          ? cfgData.limit
          : FOUNDER_TOTAL_SPOTS;
      const claimedCount =
        typeof cfgData?.claimedCount === "number" && cfgData.claimedCount > 0
          ? cfgData.claimedCount
          : 0;

      // Capacity: program is full.
      if (claimedCount >= limit) {
        return {
          success: false,
          reason: "sold_out" as FounderClaimReason,
          message: "All founder spots have been claimed.",
        };
      }

      // ── Assign the next available number ──
      const founderNumber = claimedCount + 1;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + FOUNDER_DURATION_DAYS * DAY_MS);

      const founderInfo: FounderInfo = {
        isFounder: true,
        founderNumber,
        founderStartedAt: Timestamp.fromDate(now),
        founderExpiresAt: Timestamp.fromDate(expiresAt),
        founderDurationDays: FOUNDER_DURATION_DAYS,
        founderStatus: "active",
      };

      // ── Writes: user enrollment + device claim + counter, atomically ──
      tx.set(userRef, founderInfo, { merge: true });
      if (deviceRef) {
        tx.set(deviceRef, {
          userId,
          deviceId,
          founderNumber,
          claimedAt: serverTimestamp(),
        });
      }
      tx.set(cfgRef, { limit, claimedCount: founderNumber }, { merge: true });

      return {
        success: true,
        reason: "claimed" as FounderClaimReason,
        data: founderInfo,
      };
    });

    return outcome;
  } catch (error) {
    console.log("[Founder] claimFounderSpot error:", error);
    return {
      success: false,
      reason: "error",
      message: "Failed to claim Founder Spot.",
    };
  }
};
