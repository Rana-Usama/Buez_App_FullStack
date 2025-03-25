// PostContext.js
import React, { createContext, useContext, useRef, useState } from 'react';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
	const [taskRecords, setTaskRecords] = useState([]);
	const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const scrollPosition = useRef(0); // Store scroll position
  const unsubscribeRef = useRef(null);
  
  const resetPostsData = () => {
    setTaskRecords([]);
    setLastVisiblePost(null);
    setHasMore(true);
    setRefreshing(false);
    setLoadingMore(false);
    setLoading(true);
  }

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
        resetPostsData
			}}
		>
			{children}
		</PostContext.Provider>
	);
};

export const usePostContext = () => useContext(PostContext);
