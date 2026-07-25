import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  writeBatch,
  deleteDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  Query,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { FIREBASE_DB } from "../../firebaseConfig";
import { REQUEST_STATUS } from "../utils/gloabals";
import {
  cancelConfirmedTask,
  sendTaskCancellationNotification,
} from "./Post.service";

const db = FIREBASE_DB;

export const DELETED_USER_NAME = "Deleted User";

// Firestore batches allow 500 ops; stay comfortably below.
const BATCH_LIMIT = 400;

type PendingOp =
  | { type: "delete"; ref: any }
  | { type: "update"; ref: any; data: Record<string, any> };

// ─── Small helpers ────────────────────────────────────────────────────────────

const safeGetDocs = async (q: Query, label: string) => {
  try {
    const snap = await getDocs(q);
    return snap.docs;
  } catch (error) {
    console.log(`purgeUserAccountData: query failed (${label}):`, error);
    return [];
  }
};

const commitOps = async (ops: PendingOp[], label: string) => {
  try {
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      ops.slice(i, i + BATCH_LIMIT).forEach((op) => {
        if (op.type === "delete") batch.delete(op.ref);
        else batch.update(op.ref, op.data);
      });
      await batch.commit();
    }
  } catch (error) {
    console.log(`purgeUserAccountData: batch commit failed (${label}):`, error);
  }
};

// Only delete files this app uploaded to its own Firebase Storage bucket —
// never remote/default (e.g. Unsplash) URLs.
const isAppStorageUrl = (url: any) =>
  typeof url === "string" && /firebasestorage\.googleapis\.com/.test(url);

const isFinishedStatus = (status: any) =>
  status === REQUEST_STATUS.Completed || status === REQUEST_STATUS.Cancelled;

// ─── Step 1: cancel active acceptances (tasks the user was helping on) ───────
// Active acceptance → free the slot / reopen the task and notify the owner so
// they can find another helper. Completed acceptances are preserved and
// anonymized in a later step.
const cancelActiveAcceptances = async (
  userId: string,
  userData: any,
): Promise<Set<string>> => {
  const handledTaskIds = new Set<string>();
  const canceller = {
    userId,
    userName: userData?.userName || DELETED_USER_NAME,
    email: userData?.email || "",
    profileImage: userData?.profileImage || null,
    token: userData?.token || "",
  };

  const cancelAndNotify = async (taskId: string, taskData: any) => {
    handledTaskIds.add(taskId);
    try {
      await cancelConfirmedTask({ task: { id: taskId, ...taskData }, userId });
    } catch (error) {
      console.log("purgeUserAccountData: cancel acceptance failed:", error);
      return;
    }
    try {
      await sendTaskCancellationNotification({
        task: { id: taskId, ...taskData },
        owner: { ...(taskData?.user || {}), userId: taskData?.userId },
        canceller,
      });
    } catch (error) {
      console.log("purgeUserAccountData: owner notification failed:", error);
    }
  };

  // 1a. Direct accepts (single-helper flow) — acceptedBy.userId is queryable.
  const acceptedDocs = await safeGetDocs(
    query(
      collection(db, "taskRequests"),
      where("acceptedBy.userId", "==", userId),
    ),
    "taskRequests acceptedBy",
  );
  for (const d of acceptedDocs) {
    const data: any = d.data();
    if (data?.userId === userId) continue; // own task; posted-tasks step handles it
    if (isFinishedStatus(data?.status)) {
      // Completed history: keep the record, anonymize the helper identity.
      try {
        await updateDoc(d.ref, {
          "acceptedBy.userName": DELETED_USER_NAME,
          "acceptedBy.name": DELETED_USER_NAME,
          "acceptedBy.profileImage": null,
          "acceptedBy.image": null,
          "acceptedBy.email": null,
          "acceptedBy.phone": null,
          "acceptedBy.token": null,
        });
      } catch (error) {
        console.log("purgeUserAccountData: anonymize acceptedBy failed:", error);
      }
      continue;
    }
    await cancelAndNotify(d.id, data);
  }

  // 1b. Confirm-flow acceptances (bulk & single confirm) — tracked via pending
  // completedTask entries, since confirmedWorkers arrays aren't queryable.
  const pendingCts = await safeGetDocs(
    query(
      collection(db, "completedTask"),
      where("acceptedBy.userId", "==", userId),
      where("status", "==", "pending"),
    ),
    "completedTask pending",
  );
  for (const ct of pendingCts) {
    const taskId = ct.data()?.taskId;
    if (!taskId || handledTaskIds.has(taskId)) continue;
    try {
      const taskSnap = await getDoc(doc(db, "taskRequests", taskId));
      const taskData: any = taskSnap.exists() ? taskSnap.data() : null;
      if (
        taskData &&
        taskData.userId !== userId &&
        !isFinishedStatus(taskData.status)
      ) {
        // cancelConfirmedTask also deletes this pending entry and removes the
        // user from the task's group chat.
        await cancelAndNotify(taskId, taskData);
      } else {
        await deleteDoc(ct.ref); // orphaned/stale pending entry
      }
    } catch (error) {
      console.log("purgeUserAccountData: pending acceptance cleanup:", error);
    }
  }

  return handledTaskIds;
};

// ─── Step 2: tasks posted by the user ─────────────────────────────────────────
// Active/open → delete (owner no longer exists); their uploaded images are
// queued for storage deletion and helpers' pending entries are removed.
// Completed/cancelled → keep for history, anonymize the inline owner identity.
const handlePostedTasks = async (
  userId: string,
  storageUrlsToDelete: string[],
) => {
  const docs = await safeGetDocs(
    query(collection(db, "taskRequests"), where("userId", "==", userId)),
    "taskRequests owned",
  );
  const ops: PendingOp[] = [];

  for (const d of docs) {
    const data: any = d.data();
    if (isFinishedStatus(data?.status)) {
      ops.push({
        type: "update",
        ref: d.ref,
        data: {
          ownerDeleted: true,
          "user.userName": DELETED_USER_NAME,
          "user.profileImage": null,
          "user.email": null,
          "user.phone": null,
          "user.token": null,
        },
      });
      continue;
    }

    // Active/open task: delete it, its uploaded images, and any helpers'
    // pending completedTask entries pointing at it.
    (data?.imageUrls || []).forEach((url: any) => {
      if (isAppStorageUrl(url)) storageUrlsToDelete.push(url);
    });
    ops.push({ type: "delete", ref: d.ref });

    const cts = await safeGetDocs(
      query(collection(db, "completedTask"), where("taskId", "==", d.id)),
      "completedTask for deleted task",
    );
    cts.forEach((ct) => {
      if (ct.data()?.status !== REQUEST_STATUS.Completed) {
        ops.push({ type: "delete", ref: ct.ref });
      }
    });
  }

  await commitOps(ops, "posted tasks");
};

// ─── Step 2b: remove the user from tasks they applied to (as an applicant) ───
// Applications are stored inline in `appliedWorkers` (an object array, not
// directly queryable), so we key off the `appliedWorkerIds` mirror. Removing
// the user here means they can no longer appear in — or be confirmed from — any
// task's Applicants list.
const removeUserFromApplications = async (userId: string) => {
  const docs = await safeGetDocs(
    query(
      collection(db, "taskRequests"),
      where("appliedWorkerIds", "array-contains", userId),
    ),
    "taskRequests applied",
  );
  const ops: PendingOp[] = [];
  for (const d of docs) {
    const data: any = d.data();
    if (data?.userId === userId) continue; // own task handled elsewhere
    const applied = Array.isArray(data?.appliedWorkers)
      ? data.appliedWorkers.filter((w: any) => w?.userId !== userId)
      : [];
    ops.push({
      type: "update",
      ref: d.ref,
      data: {
        appliedWorkers: applied,
        appliedWorkerIds: arrayRemove(userId),
      },
    });
  }
  await commitOps(ops, "remove from applications");
};

// ─── Step 3: completed-task history involving the user ───────────────────────
const anonymizeCompletedHistory = async (userId: string) => {
  const ops: PendingOp[] = [];

  // As helper: keep the record, display helper as "Deleted User".
  const asHelper = await safeGetDocs(
    query(
      collection(db, "completedTask"),
      where("acceptedBy.userId", "==", userId),
    ),
    "completedTask as helper",
  );
  asHelper.forEach((ct) => {
    ops.push({
      type: "update",
      ref: ct.ref,
      data: {
        "acceptedBy.name": DELETED_USER_NAME,
        "acceptedBy.userName": DELETED_USER_NAME,
        "acceptedBy.image": null,
        "acceptedBy.profileImage": null,
        "acceptedBy.email": null,
        "acceptedBy.phone": null,
        "acceptedBy.token": null,
      },
    });
  });

  // As task owner: helpers keep their completed history, owner shows as
  // "Deleted User".
  const asOwner = await safeGetDocs(
    query(
      collection(db, "completedTask"),
      where("taskOwnerId", "==", userId),
    ),
    "completedTask as owner",
  );
  asOwner.forEach((ct) => {
    ops.push({
      type: "update",
      ref: ct.ref,
      data: {
        ownerDeleted: true,
        "taskDetails.user.userName": DELETED_USER_NAME,
        "taskDetails.user.profileImage": null,
        "taskDetails.user.email": null,
        "taskDetails.user.phone": null,
        "taskDetails.user.token": null,
      },
    });
  });

  await commitOps(ops, "completed history");
};

// ─── Step 4: chats — preserve for other participants ─────────────────────────
// Nothing is deleted. The other participant's UI resolves this user's name and
// avatar from the (now anonymized) users doc, so history shows "Deleted User".
// A deletedUsers marker is added so the chat UI can disable new messages.
const markChatsUserDeleted = async (userId: string) => {
  const chats = await safeGetDocs(
    query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
    ),
    "chats",
  );
  const ops: PendingOp[] = chats.map((c) => ({
    type: "update",
    ref: c.ref,
    data: { deletedUsers: arrayUnion(userId) },
  }));
  await commitOps(ops, "chats");
};

// ─── Step 5: group chats — anonymize the stored member entry ─────────────────
// Group chats store member names/photos inline, so anonymize those entries.
const anonymizeGroupChatMembership = async (userId: string) => {
  const groups = await safeGetDocs(
    query(
      collection(db, "groupChats"),
      where("memberIds", "array-contains", userId),
    ),
    "groupChats",
  );
  for (const g of groups) {
    try {
      const data: any = g.data();
      const members = Array.isArray(data?.members)
        ? data.members.map((m: any) =>
            m?.userId === userId
              ? {
                  ...m,
                  userName: DELETED_USER_NAME,
                  profileImage: "",
                  token: "",
                }
              : m,
          )
        : [];
      await updateDoc(g.ref, {
        members,
        deletedUsers: arrayUnion(userId),
      });
    } catch (error) {
      console.log("purgeUserAccountData: group chat anonymize failed:", error);
    }
  }
};

// ─── Step 6: reviews ──────────────────────────────────────────────────────────
// Written by the user → keep (deleting would change other users' ratings),
// anonymize the author. Received by the user → delete (profile is gone).
const handleReviews = async (userId: string) => {
  const ops: PendingOp[] = [];
  const seen = new Set<string>();

  const anonymizeReviewer = (d: any) => {
    if (seen.has(d.id)) return;
    seen.add(d.id);
    ops.push({
      type: "update",
      ref: d.ref,
      data: {
        "reviewer.userName": DELETED_USER_NAME,
        "reviewer.profileImage": null,
        reviewerName: DELETED_USER_NAME,
        reviewerProfileImage: null,
      },
    });
  };

  // Reviews the user wrote (both stored shapes).
  (
    await safeGetDocs(
      query(collection(db, "reviews"), where("reviewer.userId", "==", userId)),
      "reviews written (nested)",
    )
  ).forEach(anonymizeReviewer);
  (
    await safeGetDocs(
      query(collection(db, "reviews"), where("reviewerId", "==", userId)),
      "reviews written (flat)",
    )
  ).forEach(anonymizeReviewer);

  // Reviews the user received → delete (also both stored shapes). Deletion
  // wins over anonymization if a doc matched both (self-reviews can't happen,
  // but be safe).
  const deleteSeen = new Set<string>();
  const deleteReview = (d: any) => {
    if (deleteSeen.has(d.id)) return;
    deleteSeen.add(d.id);
    ops.push({ type: "delete", ref: d.ref });
  };
  (
    await safeGetDocs(
      query(collection(db, "reviews"), where("recipient.userId", "==", userId)),
      "reviews received (nested)",
    )
  ).forEach(deleteReview);
  (
    await safeGetDocs(
      query(collection(db, "reviews"), where("reviewedUserId", "==", userId)),
      "reviews received (flat)",
    )
  ).forEach(deleteReview);

  // helperReviews markers: private bookkeeping — remove both directions.
  (
    await safeGetDocs(
      query(collection(db, "helperReviews"), where("helperId", "==", userId)),
      "helperReviews as helper",
    )
  ).forEach((d) => ops.push({ type: "delete", ref: d.ref }));
  (
    await safeGetDocs(
      query(
        collection(db, "helperReviews"),
        where("taskOwnerId", "==", userId),
      ),
      "helperReviews as owner",
    )
  ).forEach((d) => ops.push({ type: "delete", ref: d.ref }));

  await commitOps(ops, "reviews");
};

// ─── Step 7: notifications ────────────────────────────────────────────────────
// Received by the user → delete (belong only to them). Sent by the user →
// other users keep them; anonymize the sender identity.
const handleNotifications = async (userId: string) => {
  const ops: PendingOp[] = [];
  (
    await safeGetDocs(
      query(
        collection(db, "notifications"),
        where("receiver.userId", "==", userId),
      ),
      "notifications received",
    )
  ).forEach((d) => ops.push({ type: "delete", ref: d.ref }));
  (
    await safeGetDocs(
      query(
        collection(db, "notifications"),
        where("sender.userId", "==", userId),
      ),
      "notifications sent",
    )
  ).forEach((d) =>
    ops.push({
      type: "update",
      ref: d.ref,
      data: {
        "sender.userName": DELETED_USER_NAME,
        "sender.profileImage": null,
        "sender.email": null,
        "sender.token": null,
      },
    }),
  );
  await commitOps(ops, "notifications");
};

// ─── Step 8: storage files no longer referenced anywhere ─────────────────────
const deleteStorageFiles = async (urls: string[]) => {
  const storage = getStorage();
  const unique = Array.from(new Set(urls.filter(isAppStorageUrl)));
  await Promise.all(
    unique.map(async (url) => {
      try {
        await deleteObject(ref(storage, url));
      } catch (error) {
        console.log("purgeUserAccountData: storage delete failed:", error);
      }
    }),
  );
};

// ─── Step 9: profile — remove all PII, keep an anonymized shell ───────────────
// Full setDoc (no merge) intentionally wipes every personal field. The shell
// keeps chats/reviews resolving to "Deleted User" instead of breaking.
const anonymizeUserProfile = async (userId: string) => {
  try {
    await setDoc(doc(db, "users", userId), {
      userId,
      userName: DELETED_USER_NAME,
      profileImage: null,
      email: null,
      phone: null,
      token: null,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.log("purgeUserAccountData: profile anonymize failed:", error);
  }
};

// ─── Pre-deletion guard ───────────────────────────────────────────────────────
// A user must resolve active responsibilities before deleting their account:
//  • active tasks they own, and
//  • active tasks where they are a confirmed helper.
// Detection mirrors cancelActiveAcceptances: acceptedBy (single-helper accepts)
// plus pending completedTask entries (confirm-flow acceptances).
export interface DeletionBlockers {
  ownsActiveTasks: boolean;
  isConfirmedHelper: boolean;
  ownedActiveCount: number;
  confirmedHelperCount: number;
}

export const getActiveDeletionBlockers = async (
  userId: string,
): Promise<DeletionBlockers> => {
  const result: DeletionBlockers = {
    ownsActiveTasks: false,
    isConfirmedHelper: false,
    ownedActiveCount: 0,
    confirmedHelperCount: 0,
  };
  if (!userId) return result;

  // Active tasks owned by the user.
  const owned = await safeGetDocs(
    query(collection(db, "taskRequests"), where("userId", "==", userId)),
    "blockers owned",
  );
  owned.forEach((d) => {
    if (!isFinishedStatus(d.data()?.status)) result.ownedActiveCount += 1;
  });

  // Active tasks where the user is a confirmed helper.
  const handledTasks = new Set<string>();

  // Single-helper direct accepts.
  const accepted = await safeGetDocs(
    query(
      collection(db, "taskRequests"),
      where("acceptedBy.userId", "==", userId),
    ),
    "blockers acceptedBy",
  );
  accepted.forEach((d) => {
    const data: any = d.data();
    if (data?.userId === userId) return; // own task, already counted above
    if (isFinishedStatus(data?.status)) return;
    if (handledTasks.has(d.id)) return;
    handledTasks.add(d.id);
    result.confirmedHelperCount += 1;
  });

  // Confirm-flow acceptances (bulk & single confirm) via pending completedTask.
  const pendingCts = await safeGetDocs(
    query(
      collection(db, "completedTask"),
      where("acceptedBy.userId", "==", userId),
      where("status", "==", "pending"),
    ),
    "blockers pending completedTask",
  );
  for (const ct of pendingCts) {
    const taskId = ct.data()?.taskId;
    if (!taskId || handledTasks.has(taskId)) continue;
    try {
      const taskSnap = await getDoc(doc(db, "taskRequests", taskId));
      const taskData: any = taskSnap.exists() ? taskSnap.data() : null;
      if (
        taskData &&
        taskData.userId !== userId &&
        !isFinishedStatus(taskData.status)
      ) {
        handledTasks.add(taskId);
        result.confirmedHelperCount += 1;
      }
    } catch (error) {
      console.log("getActiveDeletionBlockers: pending completedTask read:", error);
    }
  }

  result.ownsActiveTasks = result.ownedActiveCount > 0;
  result.isConfirmedHelper = result.confirmedHelperCount > 0;
  return result;
};

// ─── Main entry point ─────────────────────────────────────────────────────────
// Cleans up all Firestore/Storage data for the account. Callers are
// responsible for re-authentication before and deleteUser(auth) after.
export const purgeUserAccountData = async (userId: string) => {
  if (!userId) return;

  // Snapshot the profile first — needed for the owner notifications and the
  // profile-photo storage cleanup below.
  let userData: any = {};
  try {
    const snap = await getDoc(doc(db, "users", userId));
    userData = snap.exists() ? snap.data() : {};
  } catch (error) {
    console.log("purgeUserAccountData: profile read failed:", error);
  }

  const storageUrlsToDelete: string[] = [];
  if (isAppStorageUrl(userData?.profileImage)) {
    storageUrlsToDelete.push(userData.profileImage);
  }

  // Order matters: cancellations use the (still intact) profile identity for
  // owner notifications; the profile is anonymized last.
  await cancelActiveAcceptances(userId, userData);
  await handlePostedTasks(userId, storageUrlsToDelete);
  await removeUserFromApplications(userId);
  await anonymizeCompletedHistory(userId);
  await markChatsUserDeleted(userId);
  await anonymizeGroupChatMembership(userId);
  await handleReviews(userId);
  await handleNotifications(userId);
  await deleteStorageFiles(storageUrlsToDelete);
  await anonymizeUserProfile(userId);
};
