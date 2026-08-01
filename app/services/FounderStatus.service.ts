import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";

const db = FIREBASE_DB;

/**
 * Shared founder-status lookup for OTHER users.
 *
 * Why this exists: almost every place the app shows another user (task cards,
 * applicant lists, helper rows, chat list…) renders a DENORMALIZED snapshot
 * embedded in another document — `taskRequests.acceptedBy`,
 * `taskRequests.appliedWorkers[]`, `completedTask.acceptedBy`,
 * `reviews.reviewer`, `groupChats.members[]`, … Those snapshots are hand-built
 * field projections that do not include `isFounder`, and they'd go stale
 * anyway when someone claims a founder spot after the snapshot was written.
 * They do all carry a stable `userId`, so founder status is resolved here by
 * id instead of being plumbed through every write path.
 *
 * Only `isFounder` / `founderNumber` are kept — this is a badge lookup, not a
 * profile loader. Results (including "not a founder") are cached for the
 * session so each unique user costs at most one read no matter how many
 * screens or cards display them.
 */
export interface FounderBadgeInfo {
  isFounder: boolean;
  founderNumber: number | null;
}

const NOT_FOUNDER: FounderBadgeInfo = { isFounder: false, founderNumber: null };

// Resolved results, including negatives so non-founders aren't re-fetched.
const cache = new Map<string, FounderBadgeInfo>();
// In-flight reads, so N cards mounting at once share a single request per id.
const inFlight = new Map<string, Promise<void>>();

// Firestore caps `in` queries at 10 values.
const CHUNK_SIZE = 10;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Synchronous cache peek — no fetch. */
export const getCachedFounderStatus = (
  userId?: string | null,
): FounderBadgeInfo | undefined =>
  userId ? cache.get(userId) : undefined;

const fetchChunk = async (ids: string[]): Promise<void> => {
  try {
    const snap = await getDocs(
      query(collection(db, "users"), where(documentId(), "in", ids)),
    );
    snap.forEach((d) => {
      const data: any = d.data();
      cache.set(d.id, {
        isFounder: data?.isFounder === true,
        founderNumber:
          typeof data?.founderNumber === "number" ? data.founderNumber : null,
      });
    });
  } catch (error) {
    console.log("[FounderStatus] lookup failed:", error);
  } finally {
    // Anything still unresolved (missing doc, deleted account, read error) is
    // cached as "not a founder" so a failure shows no badge rather than
    // retrying on every render.
    ids.forEach((id) => {
      if (!cache.has(id)) cache.set(id, NOT_FOUNDER);
    });
  }
};

/**
 * Resolves founder status for a set of user ids, hitting Firestore only for
 * ids that are neither cached nor already being fetched.
 */
export const getFounderStatuses = async (
  userIds: (string | null | undefined)[],
): Promise<Record<string, FounderBadgeInfo>> => {
  const ids = Array.from(
    new Set(userIds.filter((id): id is string => !!id)),
  );
  if (ids.length === 0) return {};

  const missing = ids.filter((id) => !cache.has(id) && !inFlight.has(id));
  const pending = ids.map((id) => inFlight.get(id)).filter(Boolean) as Promise<void>[];

  if (missing.length > 0) {
    for (const group of chunk(missing, CHUNK_SIZE)) {
      const request = fetchChunk(group).finally(() => {
        group.forEach((id) => inFlight.delete(id));
      });
      group.forEach((id) => inFlight.set(id, request));
      pending.push(request);
    }
  }

  if (pending.length > 0) await Promise.all(pending);

  return ids.reduce<Record<string, FounderBadgeInfo>>((acc, id) => {
    acc[id] = cache.get(id) ?? NOT_FOUNDER;
    return acc;
  }, {});
};

/** Convenience single-id wrapper. */
export const getFounderStatus = async (
  userId?: string | null,
): Promise<FounderBadgeInfo> => {
  if (!userId) return NOT_FOUNDER;
  const map = await getFounderStatuses([userId]);
  return map[userId] ?? NOT_FOUNDER;
};

/**
 * Keeps the cache honest when we already hold a full user record that carries
 * the founder fields (e.g. a `users` doc read by Messages / ConfirmedHelpers /
 * TopRatedUserProfile), avoiding a redundant read for that user elsewhere.
 */
export const primeFounderStatus = (userData: any): void => {
  const id = userData?.userId ?? userData?.id;
  if (!id || typeof userData?.isFounder !== "boolean") return;
  cache.set(id, {
    isFounder: userData.isFounder === true,
    founderNumber:
      typeof userData?.founderNumber === "number" ? userData.founderNumber : null,
  });
};

/** Test/debug helper — clears the session cache. */
export const __resetFounderStatusCache = (): void => {
  cache.clear();
  inFlight.clear();
};
