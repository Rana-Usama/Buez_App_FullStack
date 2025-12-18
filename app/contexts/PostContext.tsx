import React, { createContext, useContext, useRef, useState, ReactNode } from "react";

interface TaskRecord {
  id: string;
  [key: string]: any;
}

// Define the context value types
interface PostContextType {
  taskRecords: TaskRecord[];
  setTaskRecords: React.Dispatch<React.SetStateAction<TaskRecord[]>>;
  lastVisiblePost: any | null; 
  setLastVisiblePost: React.Dispatch<React.SetStateAction<any | null>>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshing: boolean;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMore: boolean;
  setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  scrollPosition: React.MutableRefObject<number>;
  unsubscribeRef: React.MutableRefObject<(() => void) | null>;
  resetPostsData: () => void;
}

// Create context with default as undefined (will enforce provider usage)
const PostContext = createContext<PostContextType | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);
  const [lastVisiblePost, setLastVisiblePost] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const scrollPosition = useRef<number>(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const resetPostsData = () => {
    setTaskRecords([]);
    setLastVisiblePost(null);
    setHasMore(true);
    setRefreshing(false);
    setLoadingMore(false);
    setLoading(false);
  };

  return (
    <PostContext.Provider
      value={{
        taskRecords,
        setTaskRecords,
        lastVisiblePost,
        setLastVisiblePost,
        hasMore,
        setHasMore,
        loading,
        setLoading,
        refreshing,
        setRefreshing,
        loadingMore,
        setLoadingMore,
        scrollPosition,
        unsubscribeRef,
        resetPostsData,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePostContext = (): PostContextType => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
};
