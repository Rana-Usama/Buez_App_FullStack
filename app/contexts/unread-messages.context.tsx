import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB } from "../../firebaseConfig";


type UnreadCtx = {
  unreadCount: number;        // 1:1 chat unread (same as before — no breaking change)
  groupUnreadCount: number;   // group chat unread total across all groups
  totalUnreadCount: number;   // combined total — use this for the tab badge
};

const UnreadMessagesContext = createContext<UnreadCtx>({
  unreadCount: 0,
  groupUnreadCount: 0,
  totalUnreadCount: 0,
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);


export const UnreadMessagesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);

  // 1:1 chats unread
  const [unreadCount, setUnreadCount] = useState(0);

  // group chats unread
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });
    return unsubscribeAuth;
  }, []);

  // ── 1:1 Chat unread listener (unchanged logic) ────────────────────────────
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(FIREBASE_DB, "chats"),
      where("participants", "array-contains", userId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data: any = doc.data();
        if (
          data.unread === true &&
          data.senderId !== userId &&
          data.participants.includes(userId)
        ) {
          count += 1;
        }
      });
      setUnreadCount(count);
    });

    return unsubscribe;
  }, [userId]);

  // ── Group Chat unread listener ────────────────────────────────────────────
  // Listens to all groupChats where current user is a member via memberIds array.
  // Reads unreadCounts.{userId} from each group doc and sums them up.
  useEffect(() => {
    if (!userId) {
      setGroupUnreadCount(0);
      return;
    }

    const q = query(
      collection(FIREBASE_DB, "groupChats"),
      where("memberIds", "array-contains", userId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data: any = doc.data();
        // unreadCounts is a map: { userId: number }
        const myUnread = data?.unreadCounts?.[userId];
        if (typeof myUnread === "number" && myUnread > 0) {
          count += myUnread;
        }
      });
      setGroupUnreadCount(count);
    });

    return unsubscribe;
  }, [userId]);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCount,
        groupUnreadCount,
        totalUnreadCount: unreadCount + groupUnreadCount,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
};
