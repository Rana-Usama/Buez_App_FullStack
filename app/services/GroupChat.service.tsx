import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";

const db = FIREBASE_DB;

// Creates group chat if not exists, or adds member if exists
export const createOrUpdateGroupChat = async (
  taskId: string,
  taskOwner: {
    userId: string;
    userName: string;
    profileImage: string;
    token: string;
  },
  worker: {
    userId: string;
    userName: string;
    profileImage: string;
    token: string;
  },
  taskType: string,
  customTaskTitle?: string,
  description? : string
) => {
  try {
    const groupRef = doc(db, "groupChats", taskId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      // 🔥 Create new group
      await setDoc(groupRef, {
        groupId: taskId,
        taskId,
        taskType,
        customTaskTitle: customTaskTitle || "",
        taskOwnerId: taskOwner.userId,
        description,

        // NEW: memberIds array (CRITICAL)
        memberIds: [taskOwner.userId, worker.userId],

        members: [
          {
            userId: taskOwner.userId,
            userName: taskOwner.userName,
            profileImage: taskOwner.profileImage || "",
            token: taskOwner.token || "",
            role: "owner",
            joinedAt: new Date().toISOString(),
          },
          {
            userId: worker.userId,
            userName: worker.userName,
            profileImage: worker.profileImage || "",
            token: worker.token || "",
            role: "worker",
            joinedAt: new Date().toISOString(),
          },
        ],

        createdAt: Timestamp.now(),
        lastMessage: null,
        lastMessageTimestamp: null,

        unreadCounts: {
          [taskOwner.userId]: 0,
          [worker.userId]: 0,
        },
      });
    } else {
      // Group exists — add worker if not already member
      const existingData = groupSnap.data();

      const alreadyMember = existingData.members?.some(
        (m: any) => m.userId === worker.userId
      );

      if (!alreadyMember) {
        await updateDoc(groupRef, {
          members: arrayUnion({
            userId: worker.userId,
            userName: worker.userName,
            profileImage: worker.profileImage || "",
            token: worker.token || "",
            role: "worker",
            joinedAt: new Date().toISOString(),
          }),

          memberIds: arrayUnion(worker.userId),

          [`unreadCounts.${worker.userId}`]: 0,
        });
      }
    }
  } catch (error) {
    console.error("createOrUpdateGroupChat error:", error);
    throw error;
  }
};



// Remove a member from group chat
export const removeMemberFromGroupChat = async (
  taskId: string,
  worker: {
    userId: string;
    userName: string;
    profileImage: string;
    token: string;
  }
) => {
  try {
    const groupRef = doc(db, "groupChats", taskId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) return;

    const data = groupSnap.data();

    const updatedMembers = data.members.filter(
      (m: any) => m.userId !== worker.userId
    );

    const updatedMemberIds = data.memberIds?.filter(
      (id: string) => id !== worker.userId
    );

    await updateDoc(groupRef, {
      members: updatedMembers,
      memberIds: updatedMemberIds, 
      [`unreadCounts.${worker.userId}`]: 0,
    });
  } catch (error) {
    console.error("removeMemberFromGroupChat error:", error);
    throw error;
  }
};

// Check if group chat exists
export const groupChatExists = async (taskId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, "groupChats", taskId);
    const groupSnap = await getDoc(groupRef);
    return groupSnap.exists();
  } catch (error) {
    return false;
  }
};

// Reset unread count for a member when they open the chat
export const resetUnreadCount = async (taskId: string, userId: string) => {
  try {
    const groupRef = doc(db, "groupChats", taskId);
    await updateDoc(groupRef, {
      [`unreadCounts.${userId}`]: 0,
    });
  } catch (error) {
    console.error("resetUnreadCount error:", error);
  }
};

// Increment unread count for all members except sender
export const incrementUnreadForAll = async (
  taskId: string,
  senderId: string,
  members: any[]
) => {
  try {
    const groupRef = doc(db, "groupChats", taskId);
    const updates: Record<string, any> = {};
    members.forEach((m) => {
      if (m.userId !== senderId) {
        updates[`unreadCounts.${m.userId}`] = (m.unreadCount || 0) + 1;
      }
    });
    if (Object.keys(updates).length > 0) {
      await updateDoc(groupRef, updates);
    }
  } catch (error) {
    console.error("incrementUnreadForAll error:", error);
  }
};