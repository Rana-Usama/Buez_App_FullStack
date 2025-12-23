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
import { MaterialIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Notifications from "expo-notifications";
import RNFS from "react-native-fs";

// components
import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";
import { savePost, updatePost } from "../services/Post.service";
import { useFocusEffect } from "@react-navigation/native";
import { REQUEST_STATUS } from "../utils/gloabals";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import InputFieldNew from "../components/common/NewField";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
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

const { width } = Dimensions.get("window");

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
  const [location, setLocation] = useState({});
  const [budget, setBudget] = useState("");
  const [numericBudget, setNumericBudget] = useState("");
  const { location: currentLocation, getCurrentLocation } = useLocation();
  const [compensation, setCompensation] = useState("");
  const [reviews, setReviews] = useState([]);
  const { theme } = useAppTheme();
  const selectedLocation = useSelector((state: any) => state.location);
  const inputRef = useRef(null);
  const [customTaskTitle, setCustomTaskTitle] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const title = route.params?.title;
  const isEditing = !!route.params?.postRequest;
  const currentPostRequest = route.params?.postRequest;

  const taskOptions = [
    { id: 1, name: "Cleaning", icon: "broom" },
    { id: 2, name: "Moving", icon: "dot-circle" },
    { id: 3, name: "Gardening", icon: "seedling" },
    { id: 4, name: "Gaming", icon: "gamepad" },
    { id: 5, name: "Other", icon: "ellipsis-h" },
  ];

  const compensationOptions = [
    { id: 1, type: "Monitarely", icon: "money-bill-wave" },
    { id: 2, type: "Other", icon: "exchange-alt" },
  ];

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

  const [translatedTaskOptions, setTranslatedTaskOptions] = useState([]);
  const [translatedCompensationOptions, setTranslatedCompensationOptions] =
    useState([]);
  const [originalTaskType, setOriginalTaskType] = useState("");
  const [originalCompensationType, setOriginalCompensationType] = useState("");

  const getLocationForCurrency = () => {
    return selectedLocation?.name ? selectedLocation : currentLocation;
  };

  const currencyInfo = getCurrencyInfo(getLocationForCurrency());
  const currentCurrencySymbol = getCurrencySymbolFromLocation(
    getLocationForCurrency()
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
          }))
        );
        setTranslatedTaskOptions(translatedTasks);

        const translatedCompensations = await Promise.all(
          compensationOptions.map(async (option) => ({
            ...option,
            type: await cachedTranslate(option.type),
          }))
        );
        setTranslatedCompensationOptions(translatedCompensations);

        if (currentPostRequest) {
          setOriginalTaskType(currentPostRequest.taskType);
          setSelectedTask(await cachedTranslate(currentPostRequest.taskType));
          setOriginalCompensationType(currentPostRequest.compensationType);
          setSelectedCompensation(
            await cachedTranslate(currentPostRequest.compensationType)
          );
          setLocation(currentPostRequest.address);
          setCompensation(
            await cachedTranslate(currentPostRequest.otherCompensation)
          );
          if (currentPostRequest.monitarily) {
            const numericValue = extractNumericValue(
              currentPostRequest.monitarily.toString()
            );
            setNumericBudget(numericValue.toString());
            setBudget(formatCurrency(numericValue, selectedLocation));
          }
          if (currentPostRequest.taskType === "Other") {
            setCustomTaskTitle(currentPostRequest.customTaskTitle || "");
          }
          const temp = [...imageUris];
          currentPostRequest.imageUrls.forEach((imgUrl, i) => {
            temp[i] = imgUrl;
          });
          setImageUris(temp);
          setDescription(await cachedTranslate(currentPostRequest.description));
        }
      };
      translateAndSet();
    }, [route.params?.postRequest])
  );

  const toggleDropdown = (dropdownType) => {
    if (dropdownType === "task") {
      setShowTaskDropdown(!showTaskDropdown);
      if (showCompensationDropdown) setShowCompensationDropdown(false);
    } else {
      setShowCompensationDropdown(!showCompensationDropdown);
      if (showTaskDropdown) setShowTaskDropdown(false);
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

  const selectCompensation = (type) => {
    setSelectedCompensation(type.type);
    const original = compensationOptions.find((c) => c.id === type.id)?.type;
    setOriginalCompensationType(original);
    setShowCompensationDropdown(false);
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
        }
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
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1514899706957-d22ee867a77b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1615986201152-7686a4867f30?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1600660792241-240f01455c6f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1485095329183-d0797cdc5676?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1643208589889-0735ad7218f0?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1608170825938-a8ea0305d46c?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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

  function getRandomImage(taskType) {
    const defaultType = t("postRequest.txt6");
    const images = DEFAULT_IMAGES?.[taskType] || DEFAULT_IMAGES?.[defaultType];
    if (!Array.isArray(images) || images.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
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
      (originalTaskType === "Other" && !customTaskTitle)
    ) {
      Toast.show({
        type: "info",
        text1: `Error`,
        text2: `Fill all fields`,
      });
      return;
    }
    try {
      showIndicator(true);
      const keywords = description.toLowerCase().split(" ");
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
      };
      const imgs = imageUris?.filter((img) => Boolean(img));
      if (imgs?.length === 0) {
        const defaultImageUrl = getRandomImage(originalTaskType);
        if (defaultImageUrl) {
          const localFile = `${RNFS.CachesDirectoryPath}/default.jpg`;
          await RNFS.downloadFile({
            fromUrl: defaultImageUrl,
            toFile: localFile,
          }).promise;

          const compressed = await ImageManipulator.manipulateAsync(
            localFile,
            [],
            { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG }
          );
          imgs.push(compressed.uri);
        }
      }
      if (!isEditing) {
        const savedPost = await savePost(data, imgs);
        if (user?.token) {
          await scheduleTaskReminder(savedPost?.id, user?.token);
        }
      } else {
        await updatePost(currentPostRequest.id, data, imgs);
      }
      navigation.navigate("SuccessScreen");
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

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss(),
          setShowTaskDropdown(false),
          setShowCompensationDropdown(false);
      }}
    >
      <View style={[styles.screen, { backgroundColor: theme.white }]}>
        <StatusBar
          barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
          backgroundColor={"transparent"}
          translucent
        />

        <Nav
          profileImage={profileImgUrl}
          leftLogo
          gradient
          gradientColors={[Colors.primary, "#0b1544ff"]}
          title={
            title === `${t("postRequest.txt2")}`
              ? `${t("postRequest.txt2")}`
              : `${t("postRequest.txt1")}`
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Task Type */}
            <View style={styles.section}>
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
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkGrey }]}>
                  {t("postRequest.txt3")}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.selectField,
                  {
                    backgroundColor: theme.white,
                    borderColor: showTaskDropdown
                      ? theme.primary
                      : theme.border,
                    borderWidth: showTaskDropdown ? 1.5 : 1,
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
                      style={[styles.placeholderText, { color: theme.heading }]}
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
                  color={theme.primary}
                />
              </TouchableOpacity>

              {showTaskDropdown && (
                <View
                  style={[
                    styles.dropdownContainer,
                    {
                      backgroundColor: theme.white,
                      borderColor: theme.border,
                      shadowColor: theme.black,
                    },
                  ]}
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
                        style={[styles.optionText, { color: theme.darkGrey }]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                      borderColor: theme.border,
                      height: RFPercentage(6),
                      marginTop: 0,
                    }}
                  />
                </View>
              )}
            </View>

            {/* Compensation Type */}
            <View style={styles.section}>
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
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkGrey }]}>
                  {t("postRequest.txt7")}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.selectField,
                  {
                    backgroundColor: theme.white,
                    borderColor: showCompensationDropdown
                      ? theme.primary
                      : theme.border,
                    borderWidth: showCompensationDropdown ? 1.5 : 1,
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
                            (c) => c.type === originalCompensationType
                          )?.icon || "dollar-sign"
                        }
                        size={RFPercentage(1.8)}
                        color={theme.lightGrey}
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
                      style={[styles.placeholderText, { color: theme.heading }]}
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
                  color={theme.primary}
                />
              </TouchableOpacity>

              {showCompensationDropdown && (
                <View
                  style={[
                    styles.dropdownContainer,
                    {
                      backgroundColor: theme.white,
                      borderColor: theme.border,
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
                        color={theme.lightGrey}
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

            {/* Description */}
            <View style={styles.section}>
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
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkGrey }]}>
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
            <View style={styles.section}>
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
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkGrey }]}>
                  {"Location"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("Location", { home: false })}
                activeOpacity={0.7}
                style={[
                  styles.locationField,
                  {
                    backgroundColor: theme.white,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.locationContent}>
                  <Text
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
                    {location?.name ||
                      selectedLocation?.name ||
                      t("postRequest.txt9")}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={RFPercentage(2.5)}
                  color={theme.darkGrey}
                />
              </TouchableOpacity>
            </View>

            {/* Budget/Compensation */}
            <View style={styles.section}>
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
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkGrey }]}>
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
                      style={[styles.currencyNote, { color: theme.primary }]}
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
            <View style={styles.section}>
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
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.darkGrey }]}>
                  {`Upload Photos`}
                </Text>
                <Text style={[styles.optionalText, { color: theme.heading }]}>
                  ({`Optional`})
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
                            color={theme.white}
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
                            color={theme.white}
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
                          {`Add Photo`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <View style={{ alignItems: "center" }}>
              <MyAppButton
                disabled={indicator}
                loading={indicator}
                title={
                  isEditing ? t("postRequest.txt13") : t("postRequest.txt14")
                }
                marginTop={RFPercentage(4)}
                onPress={submitPostData}
              />
            </View>
            <View style={styles.bottomSpace} />
          </Animated.View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
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
    elevation: 2,
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
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: RFPercentage(2.5),
    paddingTop: RFPercentage(2),
  },
  section: {
    marginBottom: RFPercentage(3),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  iconContainer: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(1.2),
  },
  sectionTitle: {
    fontSize: RFPercentage(1.8),
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
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: RFPercentage(2),
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
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  placeholderText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  dropdownContainer: {
    width: "100%",
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    marginTop: RFPercentage(0.5),
    paddingVertical: RFPercentage(1),
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(2),
  },
  optionText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(1.2),
  },
  customTaskContainer: {
    marginTop: RFPercentage(2),
  },
  descriptionContainer: {
    width: "100%",
    height: RFPercentage(18),
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    padding: RFPercentage(2),
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
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: RFPercentage(2),
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(1.2),
    flex: 1,
  },
  currencySymbol: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginRight: RFPercentage(1),
  },
  currencyNote: {
    fontSize: RFPercentage(1.2),
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
    width: (width - RFPercentage(8)) / 3,
    height: (width - RFPercentage(8)) / 3,
    borderRadius: RFPercentage(1.2),
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
    top: RFPercentage(0.5),
    right: RFPercentage(0.5),
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    top: RFPercentage(0.5),
    left: RFPercentage(0.5),
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(1.25),
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
    marginBottom: RFPercentage(6),
  },
});

export default PostRequest;
