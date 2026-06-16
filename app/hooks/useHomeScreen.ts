import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../contexts/user.context";
import { usePostContext } from "../contexts/PostContext";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "../utils/useLocation";
import { selectLocation } from "../redux/Actions";
import { cachedTranslate } from "../utils/cachedTranslations";
import { getRequestList } from "../services/Post.service";
import { updateUserLocation } from "../services/User.service";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import haversine from "haversine";
import { FilterOption, Task, TopRatedUser } from "../types/home.types";

export const useHomeScreen = () => {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const { theme } = useAppTheme();
  const dispatch = useDispatch();
  const { location: currentLocation, getCurrentLocation } = useLocation();
  const selectedLocation = useSelector((state: any) => state.location);

  // Get loading from post context
  const {
    setTaskRecords,
    setLastVisiblePost,
    setHasMore,
    loading, // Add this line to GET loading
    setLoading,
    setRefreshing,
    scrollPosition,
  } = usePostContext();

  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [filterMap, setFilterMap] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [topRatedUsers, setTopRatedUsers] = useState<TopRatedUser[]>([]);
  const [activeIndices, setActiveIndices] = useState<Record<number, number>>(
    {},
  );


  useEffect(() => {
  if (currentLocation) {
    updateUserLocationInDB(currentLocation); // sync to Firestore on app open
  }
}, [currentLocation]);



  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update user location in database
  const updateUserLocationInDB = useCallback(async (location: any) => {
    try {
      if (!location?.latitude || !location?.longitude) return;
      await updateUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error("Error updating user location:", error);
    }
  }, []);

  const translateTask = useCallback(async (task: Task): Promise<Task> => {
    // Translate each sub-task name
    const translatedSubTasks = await Promise.all(
      (task.selectedSubTasks || []).map(async (subTask) => ({
        ...subTask,
        name: await cachedTranslate(subTask.name),
      })),
    );

    // Translate duration label
    const translatedDurationLabel = task.durationLabel
      ? await cachedTranslate(task.durationLabel)
      : task.durationLabel;

    return {
      ...task,
      description: await cachedTranslate(task.description || ""),
      otherCompensation: await cachedTranslate(task.otherCompensation || ""),
      taskType: await cachedTranslate(task.taskType || ""),
      selectedSubTasks: translatedSubTasks,
      durationLabel: translatedDurationLabel,
    };
  }, []);

  // Initialize filters
  useEffect(() => {
    const initializeFilters = async () => {
      const originalFilters = [
        {
          value: "All",
          label: "All",
          icon: "apps",
          iconType: "ionicons" as const,
        },
        {
          value: "Cleaning",
          label: "Cleaning",
          icon: "broom",
          iconType: "material-community" as const,
        },
        {
          value: "Moving",
          label: "Moving",
          icon: "truck",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Gardening",
          label: "Gardening",
          icon: "seedling",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Gaming",
          label: "Gaming",
          icon: "game-controller",
          iconType: "ionicons" as const,
        },

        {
          value: "Plumbing",
          label: "Plumbing",
          icon: "wrench",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Electrical",
          label: "Electrical",
          icon: "bolt",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Carpentry",
          label: "Carpentry",
          icon: "hammer",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Painting",
          label: "Painting",
          icon: "paint-brush",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Delivery",
          label: "Delivery",
          icon: "shipping-fast",
          iconType: "fontawesome5" as const,
        },

        {
          value: "Tutoring",
          label: "Tutoring",
          icon: "chalkboard-teacher",
          iconType: "fontawesome5" as const,
        },

        {
          value: "Event Setup",
          label: "Event Setup",
          icon: "calendar-alt",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Photography",
          label: "Photography",
          icon: "camera",
          iconType: "fontawesome5" as const,
        },
        {
          value: "Pet Care",
          label: "Pet Care",
          icon: "paw",
          iconType: "ionicons" as const,
        },
        {
          value: "Other",
          label: "Other",
          icon: "category",
          iconType: "material" as const,
        },
      ];

      // Translate labels
      const translatedFilters = await Promise.all(
        originalFilters.map(async (filter) => ({
          ...filter,
          label: await cachedTranslate(filter.label),
        })),
      );

      // Create filter map
      const map: Record<string, string> = {};
      translatedFilters.forEach((translated, i) => {
        map[translated.label] = originalFilters[i].value;
      });

      setFilterOptions(translatedFilters);
      setFilterMap(map);
      setActiveFilter(translatedFilters[0].label);
    };

    initializeFilters();
  }, []);

  // Load tasks based on location and filters
  useEffect(() => {
    if (!currentLocation) return;

    let mounted = true;

    const loadTasks = async () => {
      setLoading(true);

      const referenceLocation =
        selectedLocation?.latitude2 && selectedLocation?.longitude2
          ? {
              latitude: selectedLocation.latitude2,
              longitude: selectedLocation.longitude2,
            }
          : currentLocation;

      // Clean up previous listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = getRequestList(
        filterMap[activeFilter] || "",
        searchQuery,
        null,
        async ({ tasksArray, lastVisible }) => {
          if (!mounted) return;

          const now = Date.now();

          // Filter by distance (100km radius) and hide expired tasks
          const filteredTasks = tasksArray.filter((task: Task) => {
            // Exclude tasks whose scheduled date/time has already passed.
            // Tasks without a schedule (legacy posts) are always kept.
            const scheduled = task.scheduledDateTime || task.scheduledDate;
            if (scheduled) {
              const scheduledTs = new Date(scheduled).getTime();
              if (!isNaN(scheduledTs) && scheduledTs < now) return false;
            }

            const taskLocation = task.address;
            if (!taskLocation?.latitude || !taskLocation?.longitude)
              return false;

            return (
              haversine(
                referenceLocation,
                {
                  latitude: taskLocation.latitude,
                  longitude: taskLocation.longitude,
                },
                { unit: "km" },
              ) <= 100
            );
          });

          // Translate task fields
          const translatedTasks = await Promise.all(
            filteredTasks.map(translateTask),
          );

          // Update state only if tasks changed
          setAllTasks((prevTasks) => {
            const prevIds = prevTasks.map((t) => t.id).join(",");
            const newIds = translatedTasks.map((t) => t.id).join(",");

            if (prevIds !== newIds) {
              setTaskRecords(translatedTasks);
              setLastVisiblePost(lastVisible);
              setHasMore(translatedTasks.length > 0);
              return translatedTasks;
            }
            return prevTasks;
          });

          setLoading(false);
        },
        (error) => {
          console.error("GET_POSTS_LIST Error:", error);
          setLoading(false);
        },
      );

      unsubscribeRef.current = unsubscribe;
    };

    loadTasks();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [activeFilter, searchQuery, selectedLocation, filterMap, currentLocation]);

  // Load top rated users
  useEffect(() => {
    const loadTopRatedUsers = async () => {
      try {
        const users = await fetchUsersWithTaskStats();
        setTopRatedUsers(users);
      } catch (error) {
        console.error("Error loading top rated users:", error);
      }
    };

    loadTopRatedUsers();
  }, []);

  // Update active indices for image carousels
  useEffect(() => {
    if (allTasks.length === Object.keys(activeIndices).length) return;

    const indices: Record<number, number> = {};
    allTasks.forEach((_, index) => {
      indices[index] = 0;
    });
    setActiveIndices(indices);
  }, [allTasks.length]);

  // Filter tasks for display
  const displayTasks = allTasks.filter((task) => {
    // Category filter
    if (filterMap[activeFilter] !== "All") {
      if (
        task.taskType?.toLowerCase() !== filterMap[activeFilter]?.toLowerCase()
      ) {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = (task.description || "")
        .toLowerCase()
        .includes(query);
      const matchesUserName = (task.user?.userName || "")
        .toLowerCase()
        .includes(query);
      const matchesTaskType = (task.taskType || "")
        .toLowerCase()
        .includes(query);
      const matchesCustomTitle =
        task.taskType?.toLowerCase() === "other"
          ? (task.customTaskTitle || "").toLowerCase().includes(query)
          : false;

      return (
        matchesDescription ||
        matchesUserName ||
        matchesTaskType ||
        matchesCustomTitle
      );
    }

    return true;
  });

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    setRefreshing(false);
  }, [setRefreshing]);

  // Handle location clear
  const handleClearLocation = useCallback(async () => {
    dispatch(selectLocation(null));
    await getCurrentLocation();
  }, [dispatch, getCurrentLocation]);

  // Return everything including loading
  return {
    t,
    user,
    theme,
    currentLocation,
    selectedLocation,
    filterOptions,
    activeFilter,
    searchQuery,
    setSearchQuery,
    setActiveFilter,
    allTasks,
    topRatedUsers,
    displayTasks,
    activeIndices,
    setActiveIndices,
    loading,
    handleRefresh,
    handleClearLocation,
    updateUserLocationInDB,
  };
};
