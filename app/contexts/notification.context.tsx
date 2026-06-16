import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB } from "../../firebaseConfig";

/* ---------- types ---------- */
type Notification = {
  id: string;
  sender: any;
  receiver: any;
  task: any;
  type: string;
  timestamp: string;
  isRead: boolean;
};

type Ctx = {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
};

const NotificationContext = createContext<Ctx | null>(null);

/* ---------- provider ---------- */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const db = FIREBASE_DB;

  useEffect(() => {
    // Holds the active Firestore listener so it can be torn down whenever the
    // auth state changes (previously this was leaked, stacking a new listener
    // on every token refresh / sign-in).
    let snapshotUnsub: (() => void) | null = null;

    const authUnsub = getAuth().onAuthStateChanged((user) => {
      // Always detach the previous notifications listener first.
      if (snapshotUnsub) {
        snapshotUnsub();
        snapshotUnsub = null;
      }

      if (!user?.uid) {
        setNotifications([]);
        return;
      }

      const q = query(
        collection(db, "notifications"),
        where("receiver.userId", "==", user.uid),
      );

      snapshotUnsub = onSnapshot(q, (snap) => {
        const list: Notification[] = [];
        snap.forEach((doc) =>
          list.push({ id: doc.id, ...(doc.data() as Omit<Notification, "id">) })
        );
        setNotifications(list);
      });
    });

    return () => {
      if (snapshotUnsub) snapshotUnsub();
      authUnsub();
    };
  }, [db]);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      const ref = doc(db, "notifications", n.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  }, [notifications, db]);

  const markAsRead = useCallback(
    async (id: string) => {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
    [db]
  );

  // Memoized so consumers don't re-render unless the data actually changes.
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const value = useMemo<Ctx>(
    () => ({ notifications, unreadCount, markAllRead, markAsRead }),
    [notifications, unreadCount, markAllRead, markAsRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside <NotificationProvider>"
    );
  return ctx;
};
