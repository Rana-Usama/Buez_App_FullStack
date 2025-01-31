import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToUserData } from '../services/User.service';
import { FIREBASE_AUTH } from '../firebaseConfig';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      try {
        if (user) {
          setAuthUser(user);
        } else {
          setAuthUser(null);
          setUserData(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeUserData;
    if (authUser) {
      try {
        unsubscribeUserData = subscribeToUserData(authUser?.uid, setUserData);
      } catch (err) {
        setError(err.message);
      }
    }

    return () => {
      unsubscribeUserData && unsubscribeUserData();
    };
  }, [authUser]);

  return (
    <UserContext.Provider value={{ 
      userData, 
      authUser, 
      loading, 
      error,
      isAuthenticated: !!authUser 
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to access user data
export const useUser = () => {
  return useContext(UserContext);
};
