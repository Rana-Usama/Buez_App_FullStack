import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { subscribeToUserData } from "../services/User.service";
import { FIREBASE_AUTH } from "../../firebaseConfig";

interface UserData {
  uid: string;
  email?: string;
  displayName?: string;
  [key: string]: any;
}

interface UserContextType {
  userData: UserData | null;
  authUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      try {
        if (user) {
          console.log("🔥 User data from Firestore:", user);
          setAuthUser(user);
        } else {
          setAuthUser(null);
          setUserData(null);
        }
      } catch (err) {
        setError((err as Error).message);
        console.log("🔥 User data from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeUserData: (() => void) | undefined;

    if (authUser) {
      try {
        unsubscribeUserData = subscribeToUserData(authUser.uid, setUserData);
      } catch (err) {
        setError((err as Error).message);
      }
    }

    return () => {
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
    };
  }, [authUser]);

  const isAuthenticated = !!authUser;

  return (
    <UserContext.Provider
      value={{ userData, authUser, loading, error, isAuthenticated }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
