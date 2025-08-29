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
  KeyboardAvoidingView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
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
  const [compensation, setCompensation] = useState("");
  const [reviews, setReviews] = useState([]);
  const { theme } = useAppTheme();
  const selectedLocation = useSelector((state) => state.location);

  const title = route.params?.title;
  const isEditing = !!route.params?.postRequest;
  const currentPostRequest = route.params?.postRequest;

  const taskOptions = [
    { id: 1, name: "Cleaning" },
    { id: 2, name: "Moving" },
    { id: 3, name: "Gardening" },
    { id: 4, name: "Gaming" },
    { id: 5, name: "Other" },
  ];

  const compensationOptions = [
    { id: 1, type: "Monitarely" },
    { id: 2, type: "Other" },
  ];

  const [translatedTaskOptions, setTranslatedTaskOptions] = useState([]);
  const [translatedCompensationOptions, setTranslatedCompensationOptions] =
    useState([]);
  const [originalTaskType, setOriginalTaskType] = useState("");
  const [originalCompensationType, setOriginalCompensationType] = useState("");

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
        // Translate compensation options
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
          setBudget(`$${currentPostRequest.monitarily}`);
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
    setSelectedTask(task.name); // Translated
    const original = taskOptions.find((t) => t.id === task.id)?.name;
    setOriginalTaskType(original); // Store original
    setShowTaskDropdown(false);
  };

  const selectCompensation = (type) => {
    setSelectedCompensation(type.type); // Translated
    const original = compensationOptions.find((c) => c.id === type.id)?.type;
    setOriginalCompensationType(original); // Store original
    setShowCompensationDropdown(false);
  };

  // Image Picker
  const pickImage = async (index) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // get original quality for picking
    });
    if (!result.canceled && result.assets) {
      const selectedImage = result.assets[0];
      // Compress the image
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
      console.log("No images found for taskType:", taskType);
      return null;
    }
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  async function scheduleTaskReminder(postId, userToken) {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: "You posted a task 2 days ago. Did you complete it?",
        data: { postId, userToken },
      },
      trigger: twoDaysLater,
    });
  }

  const submitPostData = async () => {
    if (
      !selectedTask ||
      !selectedCompensation ||
      !description ||
      !location ||
      (!compensation && !budget)
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
        },
        otherCompensation: compensation,
        monitarily: budget.replace(/^\$/, ""),
        status: REQUEST_STATUS.Active,
        acceptedBy: null,
        reviews: reviews || null,
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
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Nav */}
        <Nav
          marginTop={
            Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)
          }
          leftLogo={isEditing ? false : true}
          profileImage={profileImgUrl}
          dpNull={isEditing}

          navigation={navigation}
          title={
            title === `${t("postRequest.txt2")}`
              ? `${t("postRequest.txt2")}`
              : `${t("postRequest.txt1")}`
          }
        />

        {/* Task Type Dropdown */}
        <TouchableOpacity
          style={[
            styles.dropdownHeader,
            {
              marginTop: RFPercentage(4),
              borderBottomLeftRadius: showTaskDropdown ? 0 : RFPercentage(1),
              borderBottomRightRadius: showTaskDropdown ? 0 : RFPercentage(1),
              backgroundColor: theme.white,
              borderColor: theme.border,
            },
          ]}
          onPress={() => toggleDropdown("task")}
        >
          <Text
            style={[
              styles.dropdownHeaderText,
              {
                color: selectedTask ? theme.black : theme.heading,
              },
            ]}
          >
            {selectedTask || `${t("postRequest.txt3")}`}
          </Text>
          <MaterialIcons
            name={
              showTaskDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"
            }
            style={styles.dropdownIcon}
            color={theme.inputFieldPlaceholder}
          />
        </TouchableOpacity>

        {showTaskDropdown && (
          <FlatList
            data={translatedTaskOptions}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyExtractor={(item) => item.id.toString()}
            style={[
              styles.dropdown,
              {
                maxHeight: RFPercentage(24),
                borderTopLeftRadius: showTaskDropdown ? 0 : RFPercentage(1),
                borderTopRightRadius: showTaskDropdown ? 0 : RFPercentage(1),
                paddingVertical: RFPercentage(1),
                backgroundColor: theme.white,
                borderColor: theme.border,
              },
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectTask(item)}
                style={styles.dropdownItem}
              >
                <Text
                  style={[styles.dropdownItemText, { color: theme.darkGrey }]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.typeWrapper}>
          <TouchableOpacity
            style={[
              styles.dropdownHeader,
              {
                marginTop: RFPercentage(2.2),
                borderBottomLeftRadius: showCompensationDropdown
                  ? 0
                  : RFPercentage(1),
                borderBottomRightRadius: showCompensationDropdown
                  ? 0
                  : RFPercentage(1),
                backgroundColor: theme.white,
                borderColor: theme.border,
              },
            ]}
            onPress={() => toggleDropdown("compensation")}
          >
            <Text
              style={[
                styles.dropdownHeaderText,
                {
                  color: selectedCompensation ? theme.black : theme.heading,
                },
              ]}
            >
              {selectedCompensation || `${t("postRequest.txt7")}`}
            </Text>
            <MaterialIcons
              name={
                showCompensationDropdown
                  ? "keyboard-arrow-up"
                  : "keyboard-arrow-down"
              }
              style={styles.dropdownIcon}
              color={theme.inputFieldPlaceholder}
            />
          </TouchableOpacity>

          {showCompensationDropdown && (
            <FlatList
              data={translatedCompensationOptions}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              style={[
                styles.dropdown,
                {
                  maxHeight: RFPercentage(20),
                  borderTopLeftRadius: showCompensationDropdown
                    ? 0
                    : RFPercentage(1),
                  borderTopRightRadius: showCompensationDropdown
                    ? 0
                    : RFPercentage(1),
                  paddingVertical: RFPercentage(1),
                  backgroundColor: theme.white,
                  borderColor: theme.border,
                },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectCompensation(item)}
                  style={styles.dropdownItem}
                >
                  <Text
                    style={[styles.dropdownItemText, { color: theme.darkGrey }]}
                  >
                    {item.type}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* decsription */}
        <View
          style={[styles.descriptionContainer, { borderColor: theme.border }]}
        >
          <TextInput
            placeholder={`${t("postRequest.txt8")}`}
            placeholderTextColor={theme.heading}
            value={description}
            multiline
            onChangeText={(e) => setDescription(e)}
            maxLength={250}
            style={[styles.desc, { color: theme.black }]}
          />
          <Text style={[styles.charCount, { color: theme.darkGrey }]}>
            {description.length}/250
          </Text>
        </View>

        {/* Input field */}
        <View style={styles.typeWrapper}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Location", { home: false })}
            activeOpacity={0.8}
            style={{
              width: "90%",
              borderRadius: RFPercentage(0.9),
              backgroundColor: theme.white,
              borderColor: theme.border,
              alignSelf: "center",
              height: RFPercentage(6.6),
              borderWidth: 1,
              paddingHorizontal: RFPercentage(2),
              justifyContent: "center",
              marginTop: RFPercentage(2.5),
            }}
          >
            <Text
              style={{
                fontSize: RFPercentage(1.7),
                fontFamily: "Poppins_400Regular",
                color: selectedLocation?.name ? theme.black : theme.heading,
              }}
            >
              {location.name
                ? location.name
                : selectedLocation.name
                ? selectedLocation?.name
                : `${t("postRequest.txt9")}`}
            </Text>
          </TouchableOpacity>

          {originalCompensationType === `Other` ? (
            <>
              <InputFieldNew
                placeholder={`${t("postRequest.txt10")}`}
                value={compensation}
                onChangeText={setCompensation}
                customStyle={{
                  width: "90%",
                  borderRadius: RFPercentage(1),
                  backgroundColor: theme.white,
                  borderColor: theme.border,
                }}
              />
            </>
          ) : (
            <>
              <InputFieldNew
                placeholder={`e.g; 90$`}
                value={budget}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, "");
                  setBudget(numeric ? `$${numeric}` : "");
                }}
                customStyle={{
                  width: "90%",
                  borderRadius: RFPercentage(1),
                  backgroundColor: theme.white,
                  borderColor: theme.border,
                }}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Image Picker */}
        <View style={styles.imageWrapper}>
          <Text style={[styles.imgText, { color: theme.darkGrey }]}>{`${t(
            "postRequest.txt12"
          )}`}</Text>
          <View style={styles.imgContainer}>
            {[0, 1, 2].map((index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => pickImage(index)}
                style={[
                  styles.imgPick,
                  {
                    backgroundColor: theme.white,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
              >
                {imageUris[index] ? (
                  <>
                    <Image
                      style={styles.img2}
                      source={{ uri: imageUris[index] }}
                    />
                    <TouchableOpacity
                      onPress={() => [deleteImage(index), pickImage(index)]}
                      style={{ position: "absolute", top: 5, right: 5 }}
                    >
                      <Image style={styles.img3} source={Icons.edit} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Image
                    style={styles.img3}
                    source={Icons.gal}
                    tintColor={theme.darkGrey}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/*Login Button */}
        <MyAppButton
          disabled={indicator}
          loading={indicator}
          title={
            isEditing
              ? `${t("postRequest.txt13")}`
              : `${t("postRequest.txt14")}`
          }
          marginTop={RFPercentage(6)}
          onPress={() => submitPostData()}
        />

        <View style={styles.space} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
    // paddingBottom: RFPercentage(1),
  },
  charCount: {
    alignSelf: "flex-end",
    right: 10,
    color: Colors.grey,
    fontSize: RFPercentage(1.6),
    bottom: 10,
    position: "absolute",
  },
  dropdownHeader: {
    marginTop: RFPercentage(3),
    width: "90%",
    height: RFPercentage(6.2),
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1),
  },
  dropdownHeaderText: {
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    left: RFPercentage(-0.5),
  },
  dropdownIcon: {
    fontSize: RFPercentage(2.8),
  },
  dropdown: {
    width: "90%",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(1),
  },
  dropdownItem: {
    padding: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1.5),
    // backgroundColor:'red'
  },
  dropdownItemText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    color: Colors.heading,
  },
  typeWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionContainer: {
    width: "90%",
    height: RFPercentage(20),
    borderRadius: RFPercentage(1.2),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(2.5),
  },
  desc: {
    width: "90%",
    color: Colors.black,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.8),
    top: RFPercentage(1.5),
    left: RFPercentage(1.5),
  },
  imageWrapper: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: RFPercentage(2.3),
  },
  imgText: {
    marginBottom: RFPercentage(1),
    color: "#57534E",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  imgContainer: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: RFPercentage(0.8),
    flexDirection: "row",
  },
  imgPick: {
    width: "32%",
    height: RFPercentage(14),
    borderRadius: RFPercentage(1.4),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  img2: { width: "100%", height: "100%", borderRadius: RFPercentage(1.4) },
  img3: { width: RFPercentage(3), height: RFPercentage(3) },
  space: { marginBottom: RFPercentage(13) },
});

export default PostRequest;
