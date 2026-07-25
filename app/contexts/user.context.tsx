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
  const [authChecked, setAuthChecked] = useState<boolean>(false); // NEW
  const [userDataLoading, setUserDataLoading] = useState<boolean>(false); // NEW
  const [error, setError] = useState<string | null>(null);

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
        setError((err as Error).message);
      } finally {
        setAuthChecked(true); // mark auth as resolved, not "loading" directly
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    let unsubscribeUserData: (() => void) | undefined;
    if (authUser) {
      setUserDataLoading(true);
      try {
        unsubscribeUserData = subscribeToUserData(
          authUser.uid,
          (data: UserData | null) => {
            setUserData(data);
            setUserDataLoading(false);
          },
        );
      } catch (err) {
        setError((err as Error).message);
        setUserDataLoading(false);
      }
    } else {
      setUserData(null);
      setUserDataLoading(false);
    }
    return () => {
      if (unsubscribeUserData) unsubscribeUserData();
    };
  }, [authUser, authChecked]);

  const loading = !authChecked || userDataLoading;
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
