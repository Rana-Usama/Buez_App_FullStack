import React, {
  createContext,
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
    const authUnsub = getAuth().onAuthStateChanged((user) => {
      if (!user?.uid) return;

      const q = query(
        collection(db, "notifications"),
        where("receiver.userId", "==", user.uid),
      );

      const unsub = onSnapshot(q, (snap) => {
        const list: Notification[] = [];
        snap.forEach((doc) =>
          list.push({ id: doc.id, ...(doc.data() as Omit<Notification, "id">) })
        );
        setNotifications(list);
      });

      return unsub;
    });

    return () => authUnsub(); // cleanup on unmount
  }, [db]);

  const markAllRead = async () => {
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
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { isRead: true });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const value: Ctx = {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    markAllRead,
    markAsRead,
  };

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
