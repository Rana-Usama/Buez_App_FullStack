import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  MaterialIcons,
  Feather,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Notifications from "expo-notifications";

// components
import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";
import { savePost, updatePost, repostTask } from "../services/Post.service";
import { useFocusEffect } from "@react-navigation/native";
import { REQUEST_STATUS } from "../utils/gloabals";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import InputFieldNew from "../components/common/NewField";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setLocation as setReduxLocation } from "../redux/Actions";
import { fetchMyReviewsFromFirebase } from "../services/Review.service";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";

import {
  formatCurrency,
  getCurrencySymbolFromLocation,
  extractNumericValue,
  getCurrencyInfo,
} from "../utils/currencyChange";
import { useLocation } from "../utils/useLocation";
import CustomNav from "../components/common/CustomNav";

import DateTimePicker from "@react-native-community/datetimepicker";

const { width } = Dimensions.get("window");

const TASK_IMAGE_KEYS: Record<string, string> = {
  "Pet Care": "Pet",
  "Event Setup": "Event",
  Cleaning: "Cleaning",
  Moving: "Moving",
  Gardening: "Gardening",
  Gaming: "Gaming",
  Plumbing: "Plumbing",
  Electrical: "Electrical",
  Carpentry: "Carpentry",
  Painting: "Painting",
  Delivery: "Delivery",
  Tutoring: "Tutoring",
  Photography: "Photography",
  Other: "Other",
};

function PostRequest({ navigation, route }) {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const profileImgUrl = user?.profileImage || "";
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [showCompensationDropdown, setShowCompensationDropdown] =
    useState(false);
  const [selectedCompensation, setSelectedCompensation] = useState("");
  const [imageUris, setImageUris] = useState([null, null, null]);
  const [indicator, showIndicator] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    name?: string;
    countryCode?: string;
  }>({});
  const [budget, setBudget] = useState("");
  const [numericBudget, setNumericBudget] = useState("");
  const { location: currentLocation, getCurrentLocation } = useLocation();
  const [compensation, setCompensation] = useState("");
  const [reviews, setReviews] = useState([]);
  const { theme } = useAppTheme();
  const selectedLocation = useSelector((state: any) => state.location);
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  // Edit mode hydration guards:
  // - hydratedEditRef: prefill the form from the task ONCE per mount, so
  //   returning from the Location picker (re-focus) doesn't wipe in-progress
  //   edits by re-hydrating from the original task.
  // - isHydratingRef: prevents the "clear sub-tasks on task type change"
  //   effect from wiping the sub-tasks we just hydrated.
  const hydratedEditRef = useRef(false);
  const isHydratingRef = useRef(false);
  const [customTaskTitle, setCustomTaskTitle] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState("date");
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  // New state for sub-tasks
  const [selectedSubTasks, setSelectedSubTasks] = useState([]);
  const [showSubTaskDropdown, setShowSubTaskDropdown] = useState(false);
  const [customSubTask, setCustomSubTask] = useState("");

  const [translatedTaskOptions, setTranslatedTaskOptions] = useState([]);
  const [translatedCompensationOptions, setTranslatedCompensationOptions] =
    useState([]);
  const [originalTaskType, setOriginalTaskType] = useState("");
  const [originalCompensationType, setOriginalCompensationType] = useState("");

  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [translatedSubTasks, setTranslatedSubTasks] = useState([]);
  const [translatedDurationOptions, setTranslatedDurationOptions] = useState(
    [],
  );
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const durationOptions = [
    { label: "Less than 1 hour", value: "less_than_1" },
    { label: "1-2 hours", value: "1_2_hours" },
    { label: "2-4 hours", value: "2_4_hours" },
    { label: "4-6 hours", value: "4_6_hours" },
    { label: "6-8 hours", value: "6_8_hours" },
    { label: "Full day (8+ hours)", value: "full_day" },
    { label: "Multiple days", value: "multiple_days" },
  ];

  // Expanded task options with icons
  const taskOptions = [
    { id: 1, name: "Cleaning", icon: "broom" },
    { id: 2, name: "Moving", icon: "truck" },
    { id: 3, name: "Gardening", icon: "seedling" },
    { id: 4, name: "Gaming", icon: "gamepad" },
    { id: 5, name: "Plumbing", icon: "wrench" },
    { id: 6, name: "Electrical", icon: "bolt" },
    { id: 7, name: "Carpentry", icon: "hammer" },
    { id: 8, name: "Painting", icon: "paint-brush" },
    { id: 9, name: "Delivery", icon: "shipping-fast" },
    { id: 10, name: "Tutoring", icon: "chalkboard-teacher" },
    { id: 11, name: "Event Setup", icon: "calendar-alt" },
    { id: 12, name: "Photography", icon: "camera" },
    { id: 13, name: "Pet Care", icon: "paw" },
    { id: 14, name: "Other", icon: "ellipsis-h" },
  ];

  // Sub-tasks by task type
  const subTaskOptions = {
    Cleaning: [
      { id: "clean_1", name: "Deep Clean", icon: "broom" },
      { id: "clean_2", name: "Dusting", icon: "feather" },
      { id: "clean_3", name: "Vacuuming", icon: "wind" },
      { id: "clean_4", name: "Mopping", icon: "bitbucket" },
      { id: "clean_5", name: "Window Cleaning", icon: "window-maximize" },
      { id: "clean_6", name: "Carpet Cleaning", icon: "square" },
      { id: "clean_7", name: "Bathroom Cleaning", icon: "toilet" },
      { id: "clean_8", name: "Kitchen Cleaning", icon: "glass-cheers" },
    ],
    Moving: [
      { id: "move_1", name: "Packing", icon: "box" },
      { id: "move_2", name: "Loading", icon: "truck-loading" },
      { id: "move_3", name: "Unloading", icon: "truck" },
      { id: "move_4", name: "Furniture Assembly", icon: "tools" },
      { id: "move_5", name: "Furniture Disassembly", icon: "hammer" },
      { id: "move_6", name: "Heavy Lifting", icon: "dumbbell" },
      { id: "move_7", name: "Transport", icon: "shipping-fast" },
      { id: "move_8", name: "Piano Moving", icon: "music" },
    ],
    Gardening: [
      { id: "garden_1", name: "Planting", icon: "seedling" },
      { id: "garden_2", name: "Weeding", icon: "leaf" },
      { id: "garden_3", name: "Lawn Mowing", icon: "cut" },
      { id: "garden_4", name: "Trimming", icon: "cut" },
      { id: "garden_5", name: "Pruning", icon: "cut" },
      { id: "garden_6", name: "Hedge Trimming", icon: "cut" },
      { id: "garden_7", name: "Leaf Blowing", icon: "wind" },
      { id: "garden_8", name: "Tree Planting", icon: "tree" },
      { id: "garden_9", name: "Mulching", icon: "info-circle" },
      { id: "garden_10", name: "Fertilizing", icon: "flask" },
    ],
    Gaming: [
      { id: "game_1", name: "Game Testing", icon: "gamepad" },
      { id: "game_2", name: "Streaming Setup", icon: "video" },
      { id: "game_3", name: "Tournament", icon: "trophy" },
      { id: "game_4", name: "LAN Party Setup", icon: "network-wired" },
    ],
    Plumbing: [
      { id: "plumb_1", name: "Leak Repair", icon: "water" },
      { id: "plumb_2", name: "Pipe Installation", icon: "water" },
      { id: "plumb_3", name: "Drain Cleaning", icon: "bath" },
      { id: "plumb_4", name: "Fixture Installation", icon: "faucet" },
      { id: "plumb_5", name: "Water Heater", icon: "water" },
      { id: "plumb_6", name: "Toilet Repair", icon: "toilet" },
    ],
    Electrical: [
      { id: "elec_1", name: "Light Installation", icon: "lightbulb" },
      { id: "elec_2", name: "Outlet Repair", icon: "plug" },
      { id: "elec_3", name: "Ceiling Fan", icon: "fan" },
      { id: "elec_4", name: "Switch Replacement", icon: "toggle-on" },
      { id: "elec_5", name: "Circuit Breaker", icon: "bolt" },
    ],
    Carpentry: [
      { id: "carp_1", name: "Furniture Repair", icon: "chair" },
      { id: "carp_2", name: "Cabinet Installation", icon: "house-user" },
      { id: "carp_3", name: "Shelving", icon: "book" },
      { id: "carp_4", name: "Deck Repair", icon: "home" },
    ],
    Painting: [
      { id: "paint_1", name: "Wall Painting", icon: "paint-roller" },
      { id: "paint_2", name: "Ceiling Painting", icon: "arrow-up" },
      { id: "paint_3", name: "Trim Painting", icon: "grip-lines-vertical" },
      { id: "paint_4", name: "Cabinet Painting", icon: "house-user" },
      { id: "paint_5", name: "Touch-ups", icon: "brush" },
    ],
    Delivery: [
      { id: "del_1", name: "Package Delivery", icon: "box" },
      { id: "del_2", name: "Food Delivery", icon: "pizza-slice" },
      { id: "del_3", name: "Grocery Delivery", icon: "shopping-bag" },
      { id: "del_4", name: "Furniture Delivery", icon: "couch" },
    ],
    Tutoring: [
      { id: "tutor_1", name: "Math", icon: "calculator" },
      { id: "tutor_2", name: "Science", icon: "flask" },
      { id: "tutor_3", name: "English", icon: "book" },
      { id: "tutor_4", name: "Languages", icon: "language" },
      { id: "tutor_5", name: "Test Prep", icon: "graduation-cap" },
    ],
    "Event Setup": [
      { id: "event_1", name: "Table Setup", icon: "table" },
      { id: "event_2", name: "Chair Setup", icon: "chair" },
      { id: "event_3", name: "Decoration", icon: "star-of-david" },
      { id: "event_4", name: "Lighting", icon: "lightbulb" },
      { id: "event_5", name: "Sound System", icon: "volume-up" },
      { id: "event_6", name: "Cleanup", icon: "broom" },
    ],
    Photography: [
      { id: "photo_1", name: "Event Photography", icon: "camera" },
      { id: "photo_2", name: "Portrait", icon: "portrait" },
      { id: "photo_3", name: "Product", icon: "box" },
      { id: "photo_4", name: "Editing", icon: "pen" },
    ],
    "Pet Care": [
      { id: "pet_1", name: "Dog Walking", icon: "dog" },
      { id: "pet_2", name: "Pet Sitting", icon: "cat" },
      { id: "pet_3", name: "Grooming", icon: "cut" },
      { id: "pet_4", name: "Feeding", icon: "utensil-spoon" },
    ],

    Other: [],
  };

  useEffect(() => {
    let isMounted = true;

    const translateSubTasks = async () => {
      if (!originalTaskType || originalTaskType === "Other") {
        setTranslatedSubTasks([]);
        return;
      }
      const subs = subTaskOptions?.[originalTaskType] || [];
      const translated = await Promise.all(
        subs.map(async (st) => ({
          ...st,
          originalName: st.name, // keep original
          name: await cachedTranslate(st.name), // translated for UI
        })),
      );

      if (isMounted) setTranslatedSubTasks(translated);
    };
    translateSubTasks();
    return () => {
      isMounted = false;
    };
  }, [originalTaskType]);

  useEffect(() => {
    let isMounted = true;
    const translateDurations = async () => {
      const translated = await Promise.all(
        durationOptions.map(async (d) => ({
          ...d,
          originalLabel: d.label, // keep original
          label: await cachedTranslate(d.label), // translated for UI
        })),
      );

      if (isMounted) setTranslatedDurationOptions(translated);
    };
    translateDurations();
    return () => {
      isMounted = false;
    };
  }, []);

  const compensationOptions = [
    { id: 1, type: "Monitarely", icon: "money-bill-wave" },
    { id: 2, type: "Other", icon: "exchange-alt" },
  ];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const title = route.params?.title;
  const isEditing = !!route.params?.postRequest;
  const currentPostRequest = route.params?.postRequest;
  // Repost mode: reactivate a completed/cancelled task as a fresh request.
  // Applicants/acceptedBy are reset on submit (the data object always does
  // that), and we force the user to choose a NEW schedule by not prefilling it.
  const isRepost = !!route.params?.repost;
  const [numberOfWorkers, setNumberOfWorkers] = useState(1);
  const MAX_WORKERS = 10;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      setFormattedDate(dateStr);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setFormattedTime(timeStr);
    }
  }, [selectedTime]);

  // Clear sub-tasks when task type changes (skipped while hydrating an
  // existing task, so prefilled sub-tasks aren't wiped)
  useEffect(() => {
    if (isHydratingRef.current) return;
    setSelectedSubTasks([]);
    setCustomSubTask("");
  }, [originalTaskType]);

  const getLocationForCurrency = () => {
    return selectedLocation?.name ? selectedLocation : currentLocation;
  };

  const currencyInfo = getCurrencyInfo(getLocationForCurrency());
  const currentCurrencySymbol = getCurrencySymbolFromLocation(
    getLocationForCurrency(),
  );

  useEffect(() => {
    if (numericBudget) {
      const locationToUse = getLocationForCurrency();
      const formatted = formatCurrency(numericBudget, locationToUse);
      setBudget(formatted);
    }
  }, [selectedLocation, currentLocation, numericBudget]);

  const handleBudgetChange = (text) => {
    const numericValue = text.replace(/[^\d]/g, "");
    setNumericBudget(numericValue);
    if (numericValue) {
      const locationToUse = getLocationForCurrency();
      if (locationToUse) {
        const formatted = formatCurrency(numericValue, locationToUse);
        setBudget(formatted);
      } else {
        const formatted = `$ ${new Intl.NumberFormat().format(numericValue)}`;
        setBudget(formatted);
      }
    } else {
      setBudget("");
    }
  };

  const fetchMyReviews = async () => {
    try {
      const records = await fetchMyReviewsFromFirebase();
      setReviews(records);
    } catch (err) {
      console.log("Error loading reviews:", err);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const currentPostRequest = route.params?.postRequest;
      const translateAndSet = async () => {
        const translatedTasks = await Promise.all(
          taskOptions.map(async (option) => ({
            ...option,
            name: await cachedTranslate(option.name),
          })),
        );
        setTranslatedTaskOptions(translatedTasks);

        const translatedCompensations = await Promise.all(
          compensationOptions.map(async (option) => ({
            ...option,
            type: await cachedTranslate(option.type),
          })),
        );
        setTranslatedCompensationOptions(translatedCompensations);

        if (currentPostRequest && !hydratedEditRef.current) {
          hydratedEditRef.current = true;
          isHydratingRef.current = true;
          try {
            setOriginalTaskType(currentPostRequest.taskType);
            setSelectedTask(await cachedTranslate(currentPostRequest.taskType));
            setOriginalCompensationType(currentPostRequest.compensationType);
            setSelectedCompensation(
              await cachedTranslate(currentPostRequest.compensationType),
            );

            // Prefill the location display AND sync it into redux: submit
            // reads the redux location, so without this the task's address
            // would be lost/corrupted unless the user re-picked it.
            if (currentPostRequest.address) {
              setLocation(currentPostRequest.address);
              dispatch(setReduxLocation(currentPostRequest.address));
            }

            if (currentPostRequest.otherCompensation) {
              setCompensation(
                await cachedTranslate(currentPostRequest.otherCompensation),
              );
            }
            if (
              currentPostRequest.monitarily &&
              currentPostRequest.monitarily.toString() !== "0"
            ) {
              const numericValue = extractNumericValue(
                currentPostRequest.monitarily.toString(),
              );
              setNumericBudget(numericValue.toString());
              setBudget(
                formatCurrency(
                  numericValue,
                  selectedLocation?.name
                    ? selectedLocation
                    : currentPostRequest.address,
                ),
              );
            }
            if (currentPostRequest.taskType === "Other") {
              setCustomTaskTitle(currentPostRequest.customTaskTitle || "");
            }

            // Load sub-tasks if they exist
            if (currentPostRequest.selectedSubTasks?.length) {
              const hydrated = await Promise.all(
                currentPostRequest.selectedSubTasks.map(async (st) => ({
                  ...st,
                  originalName: st.originalName || st.name,
                  translatedName: st.isCustom
                    ? st.name
                    : await cachedTranslate(st.name),
                })),
              );
              setSelectedSubTasks(hydrated);
            }

            // On repost, do NOT prefill the previous schedule — the user must
            // pick a fresh date/time/duration for the reposted task.
            if (!route.params?.repost) {
              // Saved tasks store the schedule as scheduledDate/scheduledTime
              // (legacy tasks used selectedDate/selectedTime); support both,
              // with scheduledDateTime as a last resort.
              const rawDate =
                currentPostRequest.scheduledDate ??
                currentPostRequest.selectedDate ??
                currentPostRequest.scheduledDateTime;
              const rawTime =
                currentPostRequest.scheduledTime ??
                currentPostRequest.selectedTime ??
                currentPostRequest.scheduledDateTime;
              if (rawDate) {
                const parsedDate = new Date(rawDate);
                if (!isNaN(parsedDate.getTime())) setSelectedDate(parsedDate);
              }
              if (rawTime) {
                const parsedTime = new Date(rawTime);
                if (!isNaN(parsedTime.getTime())) setSelectedTime(parsedTime);
              }
              if (currentPostRequest.estimatedDuration) {
                setSelectedDuration(currentPostRequest.estimatedDuration);
              } else if (currentPostRequest.durationLabel) {
                // Fallback for tasks that only stored the label
                const match = durationOptions.find(
                  (d) => d.label === currentPostRequest.durationLabel,
                );
                if (match) setSelectedDuration(match.value);
              }
            }

            const savedImages = (currentPostRequest.imageUrls || []).slice(
              0,
              3,
            );
            if (savedImages.length) {
              const temp = [null, null, null];
              savedImages.forEach((imgUrl, i) => {
                temp[i] = imgUrl;
              });
              setImageUris(temp);
            }
            if (currentPostRequest.description) {
              setDescription(
                await cachedTranslate(currentPostRequest.description),
              );
            }
            setNumberOfWorkers(currentPostRequest.numberOfWorkers || 1);
          } finally {
            isHydratingRef.current = false;
          }
        }
      };
      translateAndSet();
    }, [route.params?.postRequest]),
  );

  const toggleDropdown = (dropdownType) => {
    if (dropdownType === "task") {
      setShowTaskDropdown(!showTaskDropdown);
      if (showCompensationDropdown) setShowCompensationDropdown(false);
      setShowDurationDropdown(false);
      setShowSubTaskDropdown(false);
    } else if (dropdownType === "compensation") {
      setShowCompensationDropdown(!showCompensationDropdown);
      if (showTaskDropdown) setShowTaskDropdown(false);
      setShowDurationDropdown(false);
      setShowSubTaskDropdown(false);
    } else if (dropdownType === "duration") {
      setShowDurationDropdown(!showDurationDropdown);
      if (showTaskDropdown) setShowTaskDropdown(false);
      if (showCompensationDropdown) setShowCompensationDropdown(false);
      setShowSubTaskDropdown(false);
    } else if (dropdownType === "subtask") {
      setShowSubTaskDropdown(!showSubTaskDropdown);
      if (showTaskDropdown) setShowTaskDropdown(false);
      if (showCompensationDropdown) setShowCompensationDropdown(false);
      if (showDurationDropdown) setShowDurationDropdown(false);
    }
  };

  const selectTask = (task) => {
    setSelectedTask(task.name);
    const original = taskOptions.find((t) => t.id === task.id)?.name;
    setOriginalTaskType(original);
    if (original !== "Other") {
      setCustomTaskTitle("");
    }
    setShowTaskDropdown(false);
  };

  const toggleSubTask = (subTask) => {
    setSelectedSubTasks((prev) => {
      const exists = prev.find((st) => st.id === subTask.id);
      if (exists) {
        return prev.filter((st) => st.id !== subTask.id);
      } else {
        return [...prev, subTask];
      }
    });
  };

  const addCustomSubTask = () => {
    if (customSubTask.trim()) {
      const newSubTask = {
        id: `custom_${Date.now()}`,
        name: customSubTask.trim(),
        icon: "tag",
        isCustom: true,
      };
      setSelectedSubTasks((prev) => [...prev, newSubTask]);
      setCustomSubTask("");
    }
  };

  const removeSubTask = (subTaskId) => {
    setSelectedSubTasks((prev) => prev.filter((st) => st.id !== subTaskId));
  };

  const selectCompensation = (type) => {
    setSelectedCompensation(type.type);
    const original = compensationOptions.find((c) => c.id === type.id)?.type;
    setOriginalCompensationType(original);
    setShowCompensationDropdown(false);
  };

  const selectDuration = (duration) => {
    setSelectedDuration(duration.value);
    setShowDurationDropdown(false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  const pickImage = async (index) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      const selectedImage = result.assets[0];
      const compressedImage = await ImageManipulator.manipulateAsync(
        selectedImage.uri,
        [],
        {
          compress: 0.2,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );
      let tempImageUris = [...imageUris];
      tempImageUris[index] = compressedImage.uri;
      setImageUris(tempImageUris);
    }
  };

  const deleteImage = (index) => {
    let tempImageUris = [...imageUris];
    tempImageUris[index] = null;
    setImageUris(tempImageUris);
  };

  const DEFAULT_IMAGES = {
    Gardening: [
      "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1611843467160-25afb8df1074?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1678652879435-5d1de0d521d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1457530378978-8bac673b8062?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1621272156568-7306716648df?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1582012107971-5aae799a70f2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1586281010691-f9da4be5b1f7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Cleaning: [
      "https://plus.unsplash.com/premium_photo-1663011218145-c1d0c3ba3542?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1642505172378-a6f5e5b15580?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1661662917928-b1a42a08d094?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1669101602124-f5b78895d91c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1683141120496-f5921a97f5c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1593174260957-b4eba7b3820c?q=80&w=2107&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1668600418844-5b3d2e381e10?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Gaming: [
      "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1615680022647-99c397cbcaea?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1628867578000-236840cc19d3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1716703435691-1e5205044c8e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1642056446408-b674d89a2133?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1723478555114-2bebac948a50?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1685366454253-cb705836c5a8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1584304474795-74fb0b42e66a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Moving: [
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=3775&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1614359835514-92f8ba196357?q=80&w=3544&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1714647211902-bb711d643a17?q=80&w=3732&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1580709839515-54b8991e2813?q=80&w=3829&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Plumbing: [
      "https://plus.unsplash.com/premium_photo-1661884973994-d7625e52631a?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1663045495725-89f23b57cfc5?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1674726253061-baba094ad8c7?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?q=80&w=3774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Electrical: [
      "https://plus.unsplash.com/premium_photo-1661960643553-ccfbf7d921f6?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1682148175448-8e418fcfbaa7?q=80&w=3544&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1770121696405-cd23f3c0cf22?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=3569&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Carpentry: [
      "https://plus.unsplash.com/premium_photo-1683140664559-f6b9372a7a0a?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1723867252384-9e4809c2fdd5?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1605125626499-e2c7efbd1ab3?q=80&w=3732&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1645651964715-d200ce0939cc?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],

    Painting: [
      "https://plus.unsplash.com/premium_photo-1664013263421-91e3a8101259?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?q=80&w=3690&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1678812165213-12dc8d1f3e19?q=80&w=3584&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=3449&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Delivery: [
      "https://plus.unsplash.com/premium_photo-1682146662576-900a71864a11?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1661342486992-2a08d4b466ef?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1548695607-9c73430ba065?q=80&w=3725&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1695654390723-479197a8c4a3?q=80&w=3608&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Tutoring: [
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1620919235663-61eb4a25bb51?q=80&w=2768&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Event: [
      "https://plus.unsplash.com/premium_photo-1722168614154-60badae538c1?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1711061959382-0de7a4bddccf?q=80&w=3732&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1681841713733-7b5d6cb95137?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1759306221569-028a35bc8c66?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Photography: [
      "https://plus.unsplash.com/premium_photo-1674389991678-0836ca77c7f7?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1682097066897-209d0d9e9ae5?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?q=80&w=3732&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Pet: [
      "https://plus.unsplash.com/premium_photo-1663040477032-0cb4ee5402bc?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1625321150203-cea4bee44b54?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1663047910718-c8758a6785e9?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1663011219208-418276022b35?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    Other: [
      "https://images.unsplash.com/photo-1461595520627-42e3c83019bc?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1681494711931-8efcb94ce9a0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1593037515490-c4d56a9ff5ff?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1522410818928-5522dacd5066?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1547357812-4a336d835928?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1596364725424-7673f05f64b1?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1610558128766-64f6b95ba135?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1660129071363-d13390de351f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  };

  function getRandomImage(taskType: string) {
    const defaultType = t("postRequest.txt6");
    const key = TASK_IMAGE_KEYS[taskType] || TASK_IMAGE_KEYS[defaultType];
    const images = DEFAULT_IMAGES?.[key];
    if (!Array.isArray(images) || images.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  // Shrink the (large) Unsplash default URLs for faster loading. The URL is
  // stored directly — no upload — so this just trims width/quality params.
  function optimizeRemoteImage(url: string) {
    try {
      if (/unsplash\.com/.test(url)) {
        return url
          .replace(/([?&])w=\d+/, "$1w=800")
          .replace(/([?&])q=\d+/, "$1q=60");
      }
    } catch {}
    return url;
  }

  async function scheduleTaskReminder(postId, userToken) {
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const triggerDate = new Date(Date.now() + twoDaysInMs);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t("pushNotifications.txt6"),
        body: t("pushNotifications.txt7"),
        data: { postId, userToken },
      },
      trigger: {
        date: triggerDate,
        repeats: false,
        type: "date",
      },
    });
  }

  const submitPostData = async () => {
    if (
      !selectedTask ||
      !selectedCompensation ||
      !description ||
      !location ||
      (!compensation && !budget) ||
      (originalTaskType === "Other" && !customTaskTitle) ||
      !selectedDate ||
      !selectedTime ||
      !selectedDuration
    ) {
      Toast.show({
        type: "info",
        text1: `Error`,
        text2: `Please fill all fields including date, time, and estimated duration`,
      });
      return;
    }
    if (numberOfWorkers < 1 || numberOfWorkers > MAX_WORKERS) {
      Toast.show({
        type: "info",
        text1: "Error",
        text2: `Number of workers must be between 1 and ${MAX_WORKERS}`,
      });
      return;
    }

    try {
      showIndicator(true);
      const keywords = description.toLowerCase().split(" ");

      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0,
      );

      const data = {
        taskType: originalTaskType,
        compensationType: originalCompensationType,
        description: description,
        descriptionKeywords: keywords,
        address: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          name: selectedLocation.name,
          countryCode: selectedLocation.countryCode,
        },
        otherCompensation: compensation,
        monitarily: numericBudget || "0",
        status: REQUEST_STATUS.Active,
        acceptedBy: null,
        reviews: reviews || null,
        customTaskTitle: originalTaskType === "Other" ? customTaskTitle : "",
        currencyInfo: {
          code: currencyInfo.code,
          symbol: currencyInfo.symbol,
          locale: currencyInfo.locale,
        },
        numberOfWorkers: numberOfWorkers,
        slotsAvailable: numberOfWorkers,
        confirmedWorkers: [],
        appliedWorkers: [],
        isBulkRequest: numberOfWorkers > 1,

        // New fields for sub-tasks
        selectedSubTasks: selectedSubTasks.map((st) => ({
          id: st.id,
          name: st.name,
          isCustom: st.isCustom || false,
        })),

        scheduledDate: selectedDate.toISOString(),
        scheduledTime: selectedTime.toISOString(),
        scheduledDateTime: scheduledDateTime.toISOString(),
        estimatedDuration: selectedDuration,
        durationLabel:
          durationOptions.find((d) => d.value === selectedDuration)?.label ||
          "",
      };
      const imgs = imageUris?.filter((img) => Boolean(img));
      if (imgs?.length === 0) {
        // No photo uploaded → use a default category image URL directly.
        // savePost keeps http(s) URLs as-is (no re-upload), so we skip the
        // slow download → compress → upload round-trip entirely.
        const defaultImageUrl = getRandomImage(originalTaskType);
        if (defaultImageUrl) {
          imgs.push(optimizeRemoteImage(defaultImageUrl));
        }
      }
      if (!isEditing) {
        const savedPost = await savePost(data, imgs);
        console.log("savedPost...............", savedPost);
        const taskDataForSuccess = {
          id: savedPost.id,
          taskType:
            originalTaskType === "Other" ? customTaskTitle : originalTaskType,
          description: description,
          compensationType: originalCompensationType,
          monitarily: numericBudget || "0",
          currencyInfo: currencyInfo,
          otherCompensation: compensation,
          address: selectedLocation,
          numberOfWorkers: numberOfWorkers,
          isBulkRequest: numberOfWorkers > 1,
          imageUrls: savedPost.imageUrls || [],
          createdAt: savedPost.createdAt || new Date().toISOString(),
          user: user?.userData || {},
        };

        // Navigate with task data
        navigation.navigate("SuccessScreen", {
          taskData: taskDataForSuccess,
        });
        if (user?.token) {
          await scheduleTaskReminder(savedPost?.id, user?.token);
        }
      } else if (isRepost) {
        // Repost = a completely new posting. A brand-new document (fresh ID)
        // is created with only the task details, so it starts with a clean
        // lifecycle: no applicants, no confirmed helpers, no review state,
        // no group chat, and no ties to the previous run — which stays
        // intact as history under the old ID.
        const savedPost = await repostTask(currentPostRequest.id, data, imgs);

        navigation.navigate("SuccessScreen", {
          taskData: {
            id: savedPost.id,
            taskType:
              originalTaskType === "Other" ? customTaskTitle : originalTaskType,
            description: description,
            compensationType: originalCompensationType,
            monitarily: numericBudget || "0",
            currencyInfo: currencyInfo,
            otherCompensation: compensation,
            address: selectedLocation,
            numberOfWorkers: numberOfWorkers,
            isBulkRequest: numberOfWorkers > 1,
            imageUrls: savedPost.imageUrls || imgs || [],
            createdAt: savedPost.createdAt || new Date().toISOString(),
            user: user?.userData || {},
          },
        });
        if (user?.token) {
          await scheduleTaskReminder(savedPost?.id, user?.token);
        }
      } else {
        // Normal edit (not a repost) — update in place and confirm via
        // SuccessScreen with the "edited" copy.
        await updatePost(currentPostRequest.id, data, imgs);
        navigation.navigate("SuccessScreen", {
          isEdit: true,
          taskData: {
            id: currentPostRequest.id,
            taskType:
              originalTaskType === "Other" ? customTaskTitle : originalTaskType,
            description: description,
            compensationType: originalCompensationType,
            monitarily: numericBudget || "0",
            currencyInfo: currencyInfo,
            otherCompensation: compensation,
            address: selectedLocation,
            numberOfWorkers: numberOfWorkers,
            isBulkRequest: numberOfWorkers > 1,
            imageUrls: imgs || [],
            createdAt: currentPostRequest.createdAt || new Date().toISOString(),
            user: user?.userData || {},
          },
        });
      }
    } catch (error) {
      console.log("Error stack:", error?.stack);
      Toast.show({
        type: "error",
        text1: `Error`,
        text2: `${error}`,
      });
    } finally {
      showIndicator(false);
    }
  };

  // Get current sub-tasks based on selected task
  const currentSubTasks = originalTaskType
    ? subTaskOptions[originalTaskType] || []
    : [];

  const dismissAll = () => {
    Keyboard.dismiss();
    setShowTaskDropdown(false);
    setShowCompensationDropdown(false);
    setShowDurationDropdown(false);
    setShowSubTaskDropdown(false);
  };

  // ── MULTI-STEP WIZARD ──
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);
  const isLastStep = step === TOTAL_STEPS;

  // Validate the fields that belong to the current step before advancing.
  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!selectedTask) return t("postRequest.validateStep1");
      if (originalTaskType === "Other" && !customTaskTitle)
        return t("postRequest.validateStep1");
      if (!selectedCompensation) return t("postRequest.validateStep1");
      return null;
    }
    if (currentStep === 2) {
      if (!selectedDate || !selectedTime || !selectedDuration)
        return t("postRequest.validateStep2");
      if (numberOfWorkers < 1 || numberOfWorkers > MAX_WORKERS)
        return t("postRequest.workersHelperText", { max: MAX_WORKERS });
      return null;
    }
    if (currentStep === 3) {
      if (!description) return t("postRequest.validateStep3");
      if (!(location?.name || selectedLocation?.name))
        return t("postRequest.validateStep3");
      if (!compensation && !budget) return t("postRequest.validateStep3");
      return null;
    }
    return null;
  };

  const goNext = () => {
    dismissAll();
    const error = validateStep(step);
    if (error) {
      Toast.show({ type: "info", text1: "Error", text2: error });
      return;
    }
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    dismissAll();
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const stepTitles = [
    t("postRequest.step1Title"),
    t("postRequest.step2Title"),
    t("postRequest.step3Title"),
  ];

  return (
    <>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav
        showBack
        title={
          isRepost
            ? `${t("postRequest.repostTitle")}`
            : title === `${t("postRequest.txt2")}`
              ? `${t("postRequest.txt2")}`
              : `${t("postRequest.txt1")}`
        }
      />
      <TouchableWithoutFeedback >
        <ScrollView
          style={[styles.screen, { backgroundColor: theme.white }]}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          // onScrollBeginDrag={dismissAll}
        >
          <Pressable onPress={dismissAll} style={{ flex: 1 }}>
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Step Progress Header */}
              <View style={styles.stepperWrap}>
                <View style={styles.progressHeaderRow}>
                  <Text
                    style={[styles.stepTitle, { color: theme.mode === "dark" ? Colors.white : Colors.primary }]}
                    numberOfLines={1}
                  >
                    {stepTitles[step - 1]}
                  </Text>
                  <Text style={[styles.stepIndicator, { color: theme.mode === "dark" ? Colors.white : Colors.primary }]}>
                    {t("postRequest.stepIndicator", {
                      current: step,
                      total: TOTAL_STEPS,
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: theme.lightGrey },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${(step / TOTAL_STEPS) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {step === 1 && (
                <>
              {/* Task Type */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="category"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : theme.primary}
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.txt3")}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.selectField,
                    {
                      backgroundColor: theme.primary + "10",
                      borderColor: showTaskDropdown
                        ? theme.primary
                        : theme.lightWhite,
                      borderWidth:  1,
                    },
                  ]}
                  onPress={() => toggleDropdown("task")}
                >
                  <View style={styles.selectFieldContent}>
                    {selectedTask ? (
                      <View style={styles.selectedOption}>
                        <FontAwesome5
                          name={
                            taskOptions.find((t) => t.name === originalTaskType)
                              ?.icon || "tasks"
                          }
                          size={RFPercentage(1.8)}
                          color={theme.lightGrey}
                          style={styles.optionIcon}
                        />
                        <Text
                          style={[styles.selectedText, { color: theme.black }]}
                        >
                          {selectedTask}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.placeholderText,
                          { color: theme.heading },
                        ]}
                      >
                        {t("postRequest.txt3")}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name={
                      showTaskDropdown
                        ? "keyboard-arrow-up"
                        : "keyboard-arrow-down"
                    }
                    size={RFPercentage(2.5)}
                    color={theme.mode === "dark" ? Colors.white : theme.primary}
                  />
                </TouchableOpacity>

                {showTaskDropdown && (
                  <View
                    style={[
                      styles.dropdownContainer,
                      {
                        backgroundColor: theme.white,
                        borderColor: theme.lightWhite,
                        shadowColor: theme.black,
                        maxHeight: RFPercentage(38),
                      },
                    ]}
                  >
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {translatedTaskOptions.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => selectTask(item)}
                          style={[
                            styles.optionItem,
                            selectedTask === item.name && {
                              backgroundColor: `${theme.primary}10`,
                            },
                          ]}
                        >
                          <FontAwesome5
                            name={
                              taskOptions.find((t) => t.id === item.id)?.icon ||
                              "circle"
                            }
                            size={RFPercentage(1.8)}
                            color={theme.lightGrey}
                          />
                          <Text
                            style={[
                              styles.optionText,
                              { color: theme.darkGrey },
                            ]}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {originalTaskType === "Other" && (
                  <View style={styles.customTaskContainer}>
                    <InputFieldNew
                      placeholder={t("postRequest.customTaskTitle")}
                      value={customTaskTitle}
                      onChangeText={setCustomTaskTitle}
                      maxLength={20}
                      customStyle={{
                        width: "100%",
                        borderRadius: RFPercentage(1.2),
                        backgroundColor: theme.white,
                        borderColor: theme.lightWhite,
                        height: RFPercentage(6),
                        marginTop: 0,
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Sub-Tasks Section */}
              {originalTaskType &&
                originalTaskType !== "Other" &&
                currentSubTasks.length > 0 && (
                  <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                    <View style={styles.sectionHeader}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: `${theme.primary}15` },
                        ]}
                      >
                        <MaterialIcons
                          name="list"
                          size={RFPercentage(2)}
                          color={theme.mode === "dark" ? Colors.white : theme.primary}
                        />
                      </View>
                      <Text
                        style={[styles.sectionTitle, { color: theme.darkGrey }]}
                      >
                        {t("postRequest.sub-task")}
                      </Text>
                    </View>

                    {/* Selected sub-tags display */}
                    {selectedSubTasks.length > 0 && (
                      <View style={styles.selectedTagsContainer}>
                        {selectedSubTasks.map((subTask) => (
                          <View
                            key={subTask.id}
                            style={[
                              styles.selectedTag,
                              { backgroundColor: `${theme.primary}15` },
                            ]}
                          >
                            <FontAwesome5
                              name={subTask.icon || "tag"}
                              size={RFPercentage(1.2)}
                              color={
                                theme.mode === "dark"
                                  ? Colors.darkGrey
                                  : Colors.primary
                              }
                            />
                            <Text
                              style={[
                                styles.selectedTagText,
                                {
                                  color:
                                    theme.mode === "dark"
                                      ? Colors.darkGrey
                                      : Colors.primary,
                                },
                              ]}
                            >
                              {subTask.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeSubTask(subTask.id)}
                              style={styles.removeTagButton}
                            >
                              <MaterialIcons
                                name="close"
                                size={RFPercentage(1.2)}
                                color={
                                  theme.mode === "dark"
                                    ? Colors.darkGrey
                                    : Colors.primary
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Sub-tasks dropdown */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.selectField,
                        {
                          backgroundColor:  theme.primary + "10",
                          borderColor: showSubTaskDropdown
                            ? theme.primary
                            : theme.lightWhite,
                          borderWidth:  1,
                          marginBottom: RFPercentage(1),
                        },
                      ]}
                      onPress={() => toggleDropdown("subtask")}
                    >
                      <View style={styles.selectFieldContent}>
                        <Text
                          style={[
                            styles.placeholderText,
                            { color: theme.heading },
                          ]}
                        >
                          {t("postRequest.sub-2")}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={
                          showSubTaskDropdown
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={RFPercentage(2.5)}
                        color={theme.mode === "dark" ? Colors.white : Colors.primary }
                      />
                    </TouchableOpacity>

                    {showSubTaskDropdown && (
                      <View
                        style={[
                          styles.dropdownContainer,
                          {
                            backgroundColor: theme.white,
                            borderColor: theme.lightWhite,
                            shadowColor: theme.black,
                            maxHeight: RFPercentage(30),
                            position: "relative",
                            top: 0,
                            marginBottom: RFPercentage(2),
                          },
                        ]}
                      >
                        <ScrollView
                          nestedScrollEnabled
                          showsVerticalScrollIndicator={false}
                        >
                          {translatedSubTasks.map((subTask) => {
                            const isSelected = selectedSubTasks.find(
                              (st) => st.id === subTask.id,
                            );
                            return (
                              <TouchableOpacity
                                key={subTask.id}
                                onPress={() => toggleSubTask(subTask)}
                                style={[
                                  styles.optionItem,
                                  isSelected && {
                                    backgroundColor: `${theme.primary}10`,
                                  },
                                ]}
                              >
                                <FontAwesome5
                                  name={subTask.icon}
                                  size={RFPercentage(1.8)}
                                  color={
                                    isSelected ? theme.mode === "dark" ? Colors.white : theme.primary : theme.lightGrey
                                  }
                                />
                                <Text
                                  style={[
                                    styles.optionText,
                                    {
                                      color: isSelected
                                        ? theme.mode === "dark" ? Colors.white : theme.primary
                                        : theme.darkGrey,
                                      fontWeight: isSelected ? "600" : "400",
                                    },
                                  ]}
                                >
                                  {subTask.name}
                                </Text>
                                {isSelected && (
                                  <MaterialIcons
                                    name="check"
                                    size={RFPercentage(1.8)}
                                    color={theme.mode === "dark" ? Colors.white : Colors.primary }
                                    style={styles.checkIcon}
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Custom sub-task input */}
                    <View style={styles.customSubTaskContainer}>
                      <TextInput
                        style={[
                          styles.customSubTaskInput,
                          {
                            backgroundColor: theme.primary + "10",
                            borderColor: theme.lightWhite,
                            color: theme.black,
                          },
                        ]}
                        placeholder={t("postRequest.sub-3")}
                        placeholderTextColor={theme.heading}
                        value={customSubTask}
                        onChangeText={setCustomSubTask}
                        onSubmitEditing={addCustomSubTask}
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        onPress={addCustomSubTask}
                        style={[
                          styles.addCustomButton,
                          { backgroundColor: theme.primary },
                        ]}
                        disabled={!customSubTask.trim()}
                      >
                        <MaterialIcons
                          name="add"
                          size={RFPercentage(2)}
                          color={theme.mode === "dark" ? Colors.white : Colors.white }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {/* Compensation Type */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="attach-money"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.txt7")}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.selectField,
                    {
                      backgroundColor: theme.primary + "10",
                      borderColor: showCompensationDropdown
                        ? theme.primary
                        : theme.lightWhite,
                      borderWidth:  1,
                    },
                  ]}
                  onPress={() => toggleDropdown("compensation")}
                >
                  <View style={styles.selectFieldContent}>
                    {selectedCompensation ? (
                      <View style={styles.selectedOption}>
                        <FontAwesome5
                          name={
                            compensationOptions.find(
                              (c) => c.type === originalCompensationType,
                            )?.icon || "dollar-sign"
                          }
                          size={RFPercentage(1.8)}
                          color={theme.mode === "dark" ? Colors.white : Colors.primary }
                          style={styles.optionIcon}
                        />
                        <Text
                          style={[styles.selectedText, { color: theme.black }]}
                        >
                          {selectedCompensation}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.placeholderText,
                          { color: theme.heading },
                        ]}
                      >
                        {t("postRequest.txt7")}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name={
                      showCompensationDropdown
                        ? "keyboard-arrow-up"
                        : "keyboard-arrow-down"
                    }
                    size={RFPercentage(2.5)}
                    color={theme.mode === "dark" ? Colors.white : Colors.primary }
                  />
                </TouchableOpacity>

                {showCompensationDropdown && (
                  <View
                    style={[
                      styles.dropdownContainer,
                      {
                        backgroundColor: theme.white,
                        borderColor: theme.lightWhite,
                        shadowColor: theme.black,
                      },
                    ]}
                  >
                    {translatedCompensationOptions.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => selectCompensation(item)}
                        style={[
                          styles.optionItem,
                          selectedCompensation === item.type && {
                            backgroundColor: `${theme.primary}10`,
                          },
                        ]}
                      >
                        <FontAwesome5
                          name={
                            compensationOptions.find((c) => c.id === item.id)
                              ?.icon || "circle"
                          }
                          size={RFPercentage(1.8)}
                          color={theme.mode === "dark" ? Colors.white : Colors.primary }
                        />
                        <Text
                          style={[styles.optionText, { color: theme.darkGrey }]}
                        >
                          {item.type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

                </>
              )}

              {step === 2 && (
                <>
              {/* Number of Workers */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="people"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.numberOfWorkers") ||
                      "Number of helpers needed"}
                  </Text>
                </View>

                <View style={styles.numberInputContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      if (numberOfWorkers > 1) {
                        setNumberOfWorkers(numberOfWorkers - 1);
                      }
                    }}
                    style={[
                      styles.numberButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: numberOfWorkers <= 1 ? 0.5 : 1,
                      },
                    ]}
                    disabled={numberOfWorkers <= 1}
                  >
                    <MaterialIcons
                      name="remove"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.white }
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={[
                      styles.numberInput,
                      {
                        backgroundColor: theme.white,
                        borderColor: theme.border,
                        color: theme.black,
                      },
                    ]}
                    value={numberOfWorkers.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^\d]/g, "")) || 1;
                      if (num >= 1 && num <= MAX_WORKERS) {
                        setNumberOfWorkers(num);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />

                  <TouchableOpacity
                    onPress={() => {
                      if (numberOfWorkers < MAX_WORKERS) {
                        setNumberOfWorkers(numberOfWorkers + 1);
                      }
                    }}
                    style={[
                      styles.numberButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: numberOfWorkers >= MAX_WORKERS ? 0.5 : 1,
                      },
                    ]}
                    disabled={numberOfWorkers >= MAX_WORKERS}
                  >
                    <MaterialIcons
                      name="add"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.white }
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.helperText, { color: theme.darkGrey }]}>
                  {t("postRequest.workersHelperText", { max: MAX_WORKERS }) ||
                    `Select number of helpers needed (1-${MAX_WORKERS})`}
                </Text>
              </View>

              {/* Date Selection */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="date-range"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.date")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(19, 19, 21, 1)"
                        : "rgba(239, 239, 250, 0.66)",
                    width: "45%",
                    height: RFPercentage(4),
                    borderRadius: RFPercentage(1),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => {
                    setTempDate(selectedDate);
                    setShowDatePicker(true);
                  }}
                >
                  <Text
                    style={{
                      color: theme.darkGrey,
                      fontSize: RFPercentage(1.7),
                      fontFamily: "Poppins_400Regular",
                      textAlign: "center",
                    }}
                  >
                    {formattedDate || "Select Date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker &&
                  (Platform.OS === "android" ? (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      themeVariant={theme.mode === "dark" ? "dark" : "light"}
                      minimumDate={new Date()}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setSelectedDate(date);
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor:
                          theme.mode === "dark"
                            ? "rgba(23, 24, 33, 1)"
                            : "rgba(239, 239, 250, 0.66)",
                        borderRadius: RFPercentage(1.5),
                        alignItems: "center",
                        marginTop: RFPercentage(1),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "90%",
                          marginTop: RFPercentage(2),
                        }}
                      >
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={{
                            backgroundColor:
                              theme.mode === "dark"
                                ? Colors.primary + "40"
                                : Colors.primary + "10",
                            padding: RFPercentage(0.7),
                            borderRadius: RFPercentage(100),
                            paddingHorizontal: RFPercentage(1.5),
                          }}
                          onPress={() => {
                            setSelectedDate(tempDate);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text
                            style={{
                              color:
                                theme.mode === "dark"
                                  ? Colors.white
                                  : Colors.primary,
                              fontFamily: "Poppins_600SemiBold",
                              fontSize: RFPercentage(1.4),
                            }}
                            numberOfLines={1}
                          >
                            {t("postRequest.date1")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Ionicons
                            name="close-circle"
                            color={
                              theme.mode === "dark"
                                ? Colors.darkGrey + "50"
                                : Colors.primary + "30"
                            }
                            size={RFPercentage(3.5)}
                          />
                        </TouchableOpacity>
                      </View>

                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        themeVariant={theme.mode === "dark" ? "dark" : "light"}
                        minimumDate={new Date()}
                        onChange={(event, date) => {
                          if (date) setTempDate(date);
                        }}
                      />
                    </View>
                  ))}
              </View>

              {/* Time Selection */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="access-time"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.time")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(19, 19, 21, 1)"
                        : "rgba(239, 239, 250, 0.66)",
                    width: "40%",
                    height: RFPercentage(4),
                    borderRadius: RFPercentage(1),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => {
                    setTempTime(selectedTime);
                    setShowTimePicker(true);
                  }}
                >
                  <Text
                    style={{
                      color: theme.darkGrey,
                      fontSize: RFPercentage(1.7),
                      fontFamily: "Poppins_400Regular",
                      textAlign: "center",
                    }}
                  >
                    {formattedTime || "Select Time"}
                  </Text>
                </TouchableOpacity>

                {showTimePicker &&
                  (Platform.OS === "android" ? (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      minuteInterval={5}
                      display="default"
                      themeVariant={theme.mode === "dark" ? "dark" : "light"}
                      onChange={(event, time) => {
                        setShowTimePicker(false);
                        if (time) setSelectedTime(time);
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor:
                          theme.mode === "dark"
                            ? "rgba(23, 24, 33, 1)"
                            : "rgba(235, 236, 251, 1)",
                        borderRadius: RFPercentage(1.5),
                        alignItems: "center",
                        marginTop: RFPercentage(1),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "90%",
                          marginTop: RFPercentage(2),
                        }}
                      >
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={{
                            backgroundColor:
                              theme.mode === "dark"
                                ? Colors.primary + "40"
                                : Colors.primary + "10",
                            padding: RFPercentage(0.7),
                            borderRadius: RFPercentage(100),
                            paddingHorizontal: RFPercentage(1.5),
                          }}
                          onPress={() => {
                            setSelectedTime(tempTime);
                            setShowTimePicker(false);
                          }}
                        >
                          <Text
                            style={{
                              color:
                                theme.mode === "dark"
                                  ? Colors.white
                                  : Colors.primary,
                              fontFamily: "Poppins_600SemiBold",
                              fontSize: RFPercentage(1.4),
                            }}
                            numberOfLines={1}
                          >
                            {t("postRequest.time1")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowTimePicker(false)}
                        >
                          <Ionicons
                            name="close-circle"
                            color={
                              theme.mode === "dark"
                                ? Colors.darkGrey + "50"
                                : Colors.primary + "30"
                            }
                            size={RFPercentage(3.5)}
                          />
                        </TouchableOpacity>
                      </View>

                      <DateTimePicker
                        value={tempTime}
                        mode="time"
                        minuteInterval={5}
                        display="spinner"
                        themeVariant={theme.mode === "dark" ? "dark" : "light"}
                        onChange={(event, time) => {
                          if (time) setTempTime(time);
                        }}
                      />
                    </View>
                  ))}
              </View>

              {/* Estimated Duration */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="hourglass-empty"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.duration")}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.selectField,
                    {
                      backgroundColor: theme.primary + "10",
                      borderColor: showDurationDropdown
                        ? theme.primary
                        : theme.lightWhite,
                      borderWidth: showDurationDropdown ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => toggleDropdown("duration")}
                >
                  <View style={styles.selectFieldContent}>
                    {selectedDuration ? (
                      <Text
                        style={[styles.selectedText, { color: theme.black }]}
                      >
                        {
                          translatedDurationOptions.find(
                            (d) => d.value === selectedDuration,
                          )?.label
                        }
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.placeholderText,
                          { color: theme.heading },
                        ]}
                      >
                        {t("postRequest.duration-1")}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name={
                      showDurationDropdown
                        ? "keyboard-arrow-up"
                        : "keyboard-arrow-down"
                    }
                    size={RFPercentage(2.5)}
                    color={theme.mode === "dark" ? Colors.white : Colors.primary }
                  />
                </TouchableOpacity>

                {showDurationDropdown && (
                  <View
                    style={[
                      styles.dropdownContainer,
                      {
                        backgroundColor: theme.white,
                        borderColor: theme.lightWhite,
                        shadowColor: theme.black,
                        maxHeight: RFPercentage(38),
                      },
                    ]}
                  >
                    {translatedDurationOptions.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => selectDuration(item)}
                        style={[
                          styles.optionItem,
                          selectedDuration === item.value && {
                            backgroundColor: `${theme.primary}10`,
                          },
                        ]}
                      >
                        <FontAwesome5
                          name="clock"
                          size={RFPercentage(1.8)}
                          color={theme.mode === "dark" ? Colors.darkGrey : Colors.lightGrey }
                        />
                        <Text
                          style={[styles.optionText, { color: theme.darkGrey }]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

                </>
              )}

              {step === 3 && (
                <>
              {/* Description */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="description"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {t("postRequest.txt8")}
                  </Text>
                </View>

                <Pressable
                  onPress={() => inputRef.current?.focus()}
                  style={[
                    styles.descriptionContainer,
                    {
                      backgroundColor: theme.white,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    ref={inputRef}
                    placeholder={t("postRequest.txt8")}
                    placeholderTextColor={theme.heading}
                    value={description}
                    multiline
                    onChangeText={setDescription}
                    maxLength={250}
                    style={[styles.desc, { color: theme.black }]}
                  />
                  <View style={styles.charCountContainer}>
                    <Text style={[styles.charCount, { color: theme.darkGrey }]}>
                      {description.length}/250
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Location */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {"Location"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Location", { home: false })
                  }
                  activeOpacity={0.7}
                  style={[
                    styles.locationField,
                    {
                      backgroundColor: theme.primary + "10",
                      borderColor: theme.lightWhite,
                    },
                  ]}
                >
                  <View style={styles.locationContent}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.locationText,
                        {
                          color:
                            location?.name || selectedLocation?.name
                              ? theme.black
                              : theme.heading,
                        },
                      ]}
                    >
                      {selectedLocation?.name ||
                        location?.name ||
                        t("postRequest.txt9")}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={RFPercentage(2.5)}
                    color={theme.mode === "dark" ? Colors.white : Colors.darkGrey }
                  />
                </TouchableOpacity>
              </View>

              {/* Budget/Compensation */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="monetization-on"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {originalCompensationType === "Other"
                      ? `Compensation Details`
                      : t("postRequest.pr")}
                  </Text>
                </View>

                {originalCompensationType === "Other" ? (
                  <InputFieldNew
                    placeholder={t("postRequest.txt10")}
                    value={compensation}
                    onChangeText={setCompensation}
                    customStyle={{
                      width: "100%",
                      borderRadius: RFPercentage(1.2),
                      backgroundColor: theme.white,
                      borderColor: theme.border,
                      height: RFPercentage(6),
                      marginTop: 0,
                    }}
                  />
                ) : (
                  <>
                    <InputFieldNew
                      placeholder={t("postRequest.pr")}
                      value={budget}
                      onChangeText={handleBudgetChange}
                      customStyle={{
                        width: "100%",
                        borderRadius: RFPercentage(1.2),
                        backgroundColor: theme.white,
                        borderColor: theme.border,
                        height: RFPercentage(6),
                        marginTop: 0,
                      }}
                      keyboardType="numeric"
                    />
                    {selectedLocation?.name && (
                      <Text
                        style={[
                          styles.currencyNote,
                          {
                            color:
                              theme.mode === "dark"
                                ? Colors.darkGrey
                                : Colors.primary,
                          },
                        ]}
                      >
                        {`${t("profileRank.txt46")}`} {currentCurrencySymbol} (
                        {currencyInfo.code}){`${t("profileRank.txt47")}`}{" "}
                        {selectedLocation.name}
                      </Text>
                    )}
                  </>
                )}
              </View>

              {/* Images */}
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.white : Colors.pureWhite,
                    borderColor:
                      theme.mode === "dark" ? theme.border : "#ECEFF9",
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <MaterialIcons
                      name="photo-library"
                      size={RFPercentage(2)}
                      color={theme.mode === "dark" ? Colors.white : Colors.primary }
                    />
                  </View>
                  <Text
                    style={[styles.sectionTitle, { color: theme.darkGrey }]}
                  >
                    {`Upload Photos`}
                  </Text>
                  <Text style={[styles.optionalText, { color: theme.heading }]}>
                    ({t("postRequest.photo-1")})
                  </Text>
                  <Text style={[styles.optionalText, { color: theme.heading }]}>
                    ({t("postRequest.photo-2")})
                  </Text>
                </View>

                <View style={styles.imageGrid}>
                  {[0, 1, 2].map((index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => pickImage(index)}
                      style={[
                        styles.imageContainer,
                        {
                          backgroundColor: theme.white,
                          borderColor: imageUris[index]
                            ? theme.primary
                            : theme.border,
                          borderWidth: imageUris[index] ? 1.5 : 1,
                        },
                      ]}
                    >
                      {imageUris[index] ? (
                        <>
                          <Image
                            style={styles.selectedImage}
                            source={{ uri: imageUris[index] }}
                          />
                          <TouchableOpacity
                            onPress={() => deleteImage(index)}
                            style={[
                              styles.deleteButton,
                              { backgroundColor: Colors.red },
                            ]}
                          >
                            <MaterialIcons
                              name="close"
                              size={RFPercentage(1.8)}
                              color={theme.mode === "dark" ? Colors.white : Colors.white }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => pickImage(index)}
                            style={[
                              styles.editButton,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <MaterialIcons
                              name="edit"
                              size={RFPercentage(1.5)}
                              color={theme.mode === "dark" ? Colors.white : Colors.white }
                            />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <MaterialIcons
                            name="add-a-photo"
                            size={RFPercentage(3)}
                            color={theme.heading}
                          />
                          <Text
                            style={[
                              styles.addPhotoText,
                              { color: theme.heading },
                            ]}
                          >
                            {t("postRequest.photo")}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

                </>
              )}

              <View style={styles.bottomSpace} />
            </Animated.View>
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Step Navigation Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              theme.mode === "dark" ? theme.white : Colors.pureWhite,
            borderTopColor: theme.mode === "dark" ? theme.border : "#ECEFF9",
          },
        ]}
      >
        {step > 1 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={[
              styles.backStepButton,
              {
                backgroundColor:
                  theme.mode === "dark" ? theme.white : `${theme.primary}10`,
                borderColor: theme.border,
              },
            ]}
          >
            <MaterialIcons
              name="arrow-back"
              size={RFPercentage(2.2)}
              color={ theme.mode === "dark" ? Colors.white : Colors.primary}
            />
            <Text style={[styles.backStepText, { color: theme.mode === "dark" ? Colors.white : Colors.primary }]}>
              {t("postRequest.back")}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerPrimary}>
          <MyAppButton
            disabled={isLastStep ? indicator : false}
            loading={isLastStep ? indicator : false}
            title={
              isLastStep
                ? isEditing
                  ? t("postRequest.txt13")
                  : t("postRequest.txt14")
                : t("buttons.next")
            }
            width={step > 1 ? "100%" : "100%"}
            marginTop={0}
            onPress={isLastStep ? submitPostData : goNext}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  numberInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  numberButton: {
    width: RFPercentage(4.8),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1.4),
    justifyContent: "center",
    alignItems: "center",
  },
  numberInput: {
    width: RFPercentage(8),
    height: RFPercentage(5.8),
    borderRadius: RFPercentage(1.4),
    borderWidth: 1,
    marginHorizontal: RFPercentage(2),
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
  },
  helperText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: RFPercentage(1),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: RFPercentage(2),
    paddingTop: Platform.OS === "ios" ? RFPercentage(6) : RFPercentage(3),
    paddingBottom: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "30",
    // elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: RFPercentage(1),
  },
  headerTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: RFPercentage(6),
    alignItems: "flex-end",
  },
  profileImage: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
    paddingBottom:RFPercentage(10)
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: RFPercentage(2.2),
    paddingTop: RFPercentage(2),
  },
  section: {
    marginBottom: RFPercentage(1.8),
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.6),
  },
  iconContainer: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(1.2),
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(1.3),
  },
  sectionTitle: {
    fontSize: RFPercentage(1.85),
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
  },
  optionalText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(1),
  },
  selectField: {
    width: "100%",
    height: RFPercentage(6.2),
    borderRadius: RFPercentage(1.5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: RFPercentage(1.8),
  },
  selectFieldContent: {
    flex: 1,
  },
  selectedOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    marginRight: RFPercentage(1.2),
  },
  selectedText: {
    fontSize: RFPercentage(1.65),
    fontFamily: "Poppins_500Medium",
  },
  placeholderText: {
    fontSize: RFPercentage(1.65),
    fontFamily: "Poppins_400Regular",
  },
  dropdownContainer: {
    width: "100%",
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    marginTop: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.8),
    // elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.3),
    paddingHorizontal: RFPercentage(1.6),
    marginHorizontal: RFPercentage(0.6),
    borderRadius: RFPercentage(1),
  },
  optionText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(1.2),
    flex: 1,
  },
  checkIcon: {
    marginLeft: "auto",
  },
  customTaskContainer: {
    marginTop: RFPercentage(2),
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: RFPercentage(1.5),
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.3),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(2.5),
    marginRight: RFPercentage(1),
    marginBottom: RFPercentage(1),
  },
  selectedTagText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.6),
    marginRight: RFPercentage(0.3),
  },
  removeTagButton: {
    marginLeft: RFPercentage(0.3),
  },
  customSubTaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  customSubTaskInput: {
    flex: 1,
    height: RFPercentage(6),
    borderWidth: 1,
    borderRadius: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1.8),
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginRight: RFPercentage(1),
  },
  addCustomButton: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionContainer: {
    width: "100%",
    height: RFPercentage(16),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    padding: RFPercentage(1.8),
  },
  desc: {
    flex: 1,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    textAlignVertical: "top",
  },
  charCountContainer: {
    position: "absolute",
    bottom: RFPercentage(1),
    right: RFPercentage(1.5),
  },
  charCount: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
  },
  locationField: {
    width: "100%",
    height: RFPercentage(6.2),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: RFPercentage(1.8),
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    // marginLeft: RFPercentage(1.2),
    flex: 1,
  },
  currencySymbol: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginRight: RFPercentage(1),
  },
  currencyNote: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.5),
    textAlign: "center",
  },
  imageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: RFPercentage(1),
  },
  imageContainer: {
    width: (width - RFPercentage(15)) / 3,
    height: (width - RFPercentage(15)) / 3,
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  deleteButton: {
    position: "absolute",
    top: RFPercentage(0.6),
    right: RFPercentage(0.6),
    width: RFPercentage(2.9),
    height: RFPercentage(2.9),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    top: RFPercentage(0.6),
    left: RFPercentage(0.6),
    width: RFPercentage(2.9),
    height: RFPercentage(2.9),
    borderRadius: RFPercentage(1.45),
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
  },
  submitButton: {
    borderRadius: RFPercentage(1.2),
    height: RFPercentage(6.5),
  },
  bottomSpace: {
    marginBottom: RFPercentage(3),
  },
  stepperWrap: {
    marginBottom: RFPercentage(2.2),
    width: "100%",
    // height:RFPercentage(6),
    // backgroundColor:"red"
  },
  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: RFPercentage(1),
       width: "100%",
  },
  progressTrack: {
    width: "100%",
    height: RFPercentage(0.9),
    borderRadius: RFPercentage(0.6),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RFPercentage(0.6),
  },
  stepTitle: {
    flex: 1,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
  },
  stepIndicator: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(1),
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2.2),
    paddingTop: RFPercentage(1.6),
    paddingBottom:
      Platform.OS === "ios" ? RFPercentage(3.5) : RFPercentage(3),
    borderTopWidth: 1,
    gap: RFPercentage(1.4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // elevation: 12,
  },
  backStepButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Platform.OS === "android" ? RFPercentage(6.2) : RFPercentage(6.5),
    paddingHorizontal: RFPercentage(2.2),
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    gap: RFPercentage(0.5),
  },
  backStepText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  footerPrimary: {
    flex: 1,
    alignItems:"center"
    
  },
});

export default PostRequest;
