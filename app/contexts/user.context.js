import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToUserData } from '../services/user';
import { FIREBASE_AUTH } from '../../firebaseConfig';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setAuthUser(user);
      } else {
        setAuthUser(null);
        setUserData(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);


  useEffect(() => {
    let unsubscribeUserData;
    if (authUser) {
      unsubscribeUserData = subscribeToUserData(authUser?.uid, setUserData);
    }

    return () => {
      unsubscribeUserData && unsubscribeUserData();
    };
  }, [authUser]);

  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to access user data
export const useUser = () => {
  return useContext(UserContext);
};
