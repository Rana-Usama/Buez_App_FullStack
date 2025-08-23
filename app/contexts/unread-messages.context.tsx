import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB } from "../../firebaseConfig";

type UnreadCtx = {
  unreadCount: number;
};

const UnreadMessagesContext = createContext<UnreadCtx>({ unreadCount: 0 });

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(FIREBASE_DB, "chats"),
      where("participants", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;

      snapshot.forEach((doc) => {
        const data: any = doc.data();
        const msg = data.lastMessage;

        if (
          msg?.unread &&
          msg?.receiver === userId &&
          msg?.senderId !== userId
        ) {
          count += 1;
        }
      });

      setUnreadCount(count);
    });

    return unsubscribe;
  }, [userId]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
