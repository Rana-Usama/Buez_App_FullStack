import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { RFPercentage } from "react-native-responsive-fontsize";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRoute, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  updateDoc,
  getDocs,
  doc,
  where,
} from "firebase/firestore";
import moment from "moment";
import MyAppButton from "../components/common/MyAppButton";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";
import { useTranslation } from "react-i18next";
import CustomNav from "../components/common/CustomNav";
import AvatarInitials from "../components/common/DefaultAvatars";
import { getAvatarColors } from "../config/avatarColors";

const getTargetLanguage = async () => {
  try {
    const stored = await SecureStore.getItemAsync("appLanguage");
    return stored || Localization.locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
};

type Translations = {
  addReview: string;
  howExperience: string;
  shareThoughts: string;
  completedOn: string;
  translating: string;
  pleaseWrite: string;
  addingReview: string;
  success: string;
  reviewSubmitted: string;
  error: string;
  couldNotSubmit: string;
  taskCompleted: string;
  writeReview: string;
  characters: string;
  tap: string;
};

interface ParamsType {
  task?: any;
}

function AddReview() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { userData } = useUser();
  const { theme } = useAppTheme();
  const typedParams = params as ParamsType;
  const task = typedParams.task || {};
  const recipientUser = task?.taskDetails?.user ?? {
    userId: "",
    userName: "User",
    profileImage: null,
    token: null,
    email: null,
  };
  const taskId = task?.taskId || "";
  const originalDesc = task?.taskDetails?.description ?? "";
  const completedOn = moment(
    task?.completedAt?.toDate?.() ?? task?.completedAt ?? new Date(),
  ).format("MMM D, YYYY");
  const { t } = useTranslation();
  const [lang, setLang] = useState("en");
  const [tr, setTr] = useState<Partial<Translations>>({});
  const [taskDesc, setTaskDesc] = useState(originalDesc);
  const [rating, setRating] = useState([false, false, false, false, false]);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [starAnimations] = useState(
    Array(5)
      .fill(null)
      .map(() => new Animated.Value(1)),
  );

  const animateStar = (index: number) => {
    Animated.sequence([
      Animated.timing(starAnimations[index], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starAnimations[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  //Save Review in Notification DB
  const saveReviewNotification = async () => {
    try {
      await addDoc(collection(FIREBASE_DB, "notifications"), {
        sender: {
          userId: userData?.userId,
          userName: userData?.userName,
          email: userData?.email || null,
          profileImage: userData?.profileImage || null,
          token: userData?.token || null,
        },
        receiver: {
          userId: recipientUser?.userId,
          name: recipientUser?.userName,
          email: recipientUser?.email || null,
          profileImage: recipientUser?.profileImage || null,
          token: recipientUser?.token || null,
        },
        task: {
          taskId,
          description: originalDesc,
        },
        review: {
          text: reviewText,
          rating: rating.filter(Boolean).length,
        },
        type: "review_added",
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    } catch (err) {
      console.log("Error saving review notification:", err);
    }
  };

  // Sending Push Notification
  const sendReviewPushNotification = async () => {
    if (!recipientUser?.token) return;
    try {
      const translatedReview = reviewText
        ? await cachedTranslate(reviewText)
        : await cachedTranslate("No review text");

      const previewText =
        translatedReview.length > 50
          ? translatedReview.substring(0, 50) + "..."
          : translatedReview;
      const response = await fetch(
        "https://buez-server-khaki.vercel.app/api/send-notification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fcmToken: recipientUser?.token,
            title: `${userData?.userName} left you a review on your task!`,
            body: `${previewText}`,
          }),
        },
      );
      const data = await response.text();
      console.log("Push notification sent:", data);
    } catch (error) {
      console.log("sendReviewPushNotification error:", error);
    }
  };

  // Translations
  useEffect(() => {
    (async () => {
      const l = await getTargetLanguage();
      setLang(l);
      const phrases = {
        addReview: "Add Review",
        howExperience: "How Was Your Experience?",
        shareThoughts: "Share your thoughts...",
        completedOn: "Completed on",
        translating: "Translating...",
        pleaseWrite: "Please write a review.",
        addingReview: "Adding Review",
        success: "Success",
        reviewSubmitted: "Review submitted!",
        error: "Error",
        couldNotSubmit: "Could not submit review.",
        taskCompleted: "Task Completed",
        writeReview: "Write your review",
        characters: "characters",
        tap: "Tap to rate",
      };
      const vals = await Promise.all(
        Object.values(phrases).map((txt) => cachedTranslate(txt)),
      );
      const map = Object.keys(phrases).reduce((acc, k, i) => {
        acc[k as keyof Translations] =
          vals[i] || phrases[k as keyof Translations];
        return acc;
      }, {} as Translations);
      setTr(map);
    })();
  }, []);

  useEffect(() => {
    if (!originalDesc) return;
    (async () => {
      try {
        const translated = await cachedTranslate(originalDesc);
        setTaskDesc(translated || originalDesc);
      } catch {
        setTaskDesc(originalDesc);
      }
    })();
  }, [originalDesc, lang]);

  // Selecting Star Rating
  const toggleStar = (idx: number) => {
    const newRating = rating.map((_, i) => i <= idx);
    setRating(newRating);
    newRating.forEach((selected, index) => {
      if (selected && index <= idx) {
        animateStar(index);
      }
    });
  };

  const submitReview = async () => {
    const stars = rating.filter(Boolean).length;
    if (reviewText.trim() === "") {
      Toast.show({
        type: "info",
        text1: tr.addingReview || "Adding Review",
        text2: tr.pleaseWrite || "Please write a review.",
      });
      return;
    }
    try {
      setSubmitting(true);
      const currentUser = getAuth().currentUser;
      const currentUserId = currentUser?.uid;
      const isBulkTask = task?.isBulkTask || false;
      const taskOwnerId = recipientUser?.userId;
      const reviewKey = `${currentUserId}_${taskId}_${taskOwnerId}`;
      const existingReviewQuery = query(
        collection(FIREBASE_DB, "reviews"),
        where("reviewKey", "==", reviewKey),
      );
      const existingReviewSnap = await getDocs(existingReviewQuery);

      if (!existingReviewSnap.empty) {
        Toast.show({
          type: "info",
          text1: "Already Reviewed",
          text2: "You have already reviewed this task owner.",
        });
        setSubmitting(false);
        return;
      }
      // Create review data
      const reviewData = {
        reviewer: {
          userId: currentUserId || "",
          userName: userData?.userName || "Anonymous",
          profileImage: userData?.profileImage || null,
        },
        recipient: recipientUser,
        taskId,
        rating: stars || 0,
        reviewText: reviewText.trim() || "",
        createdAt: serverTimestamp(),
        isBulkTask: isBulkTask,
        taskOwnerId: taskOwnerId,
        reviewedByHelper: task?.isConfirmedHelper || false,
        reviewKey: reviewKey,
        helperId: currentUserId,
        helperInfo:
          isBulkTask && task?.isConfirmedHelper
            ? {
                userId: currentUserId,
                userName: userData?.userName,
                wasConfirmed: true,
              }
            : null,
      };

      await addDoc(collection(FIREBASE_DB, "reviews"), reviewData);
      if (isBulkTask && currentUserId) {
        await addDoc(collection(FIREBASE_DB, "helperReviews"), {
          helperId: currentUserId,
          taskId: taskId,
          taskOwnerId: taskOwnerId,
          reviewed: true,
          reviewData: {
            rating: stars,
            reviewText: reviewText.trim(),
            createdAt: serverTimestamp(),
          },
          reviewKey: reviewKey,
        });
      }

      await sendReviewPushNotification();
      await saveReviewNotification();

      Toast.show({
        type: "success",
        text1: tr.success || "Success",
        text2: tr.reviewSubmitted || "Review submitted!",
      });
      navigation.goBack();
    } catch (e) {
      console.log("Review submission error:", e);
      Toast.show({
        type: "error",
        text1: tr.error || "Error",
        text2: tr.couldNotSubmit || "Could not submit review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Star Color
  const getStarColor = (selected: boolean) => {
    return selected
      ? Colors.star
      : theme.mode === "dark"
        ? Colors.darkGrey
        : Colors.stroke;
  };

  const isDark = theme.mode === "dark";
  const firstLetter = recipientUser?.userName.trim()?.[0];
  const [, groupTextColor] = getAvatarColors(firstLetter, isDark);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.white }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav title={tr.addReview || "Add Review"} showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Recipient & Task Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.white,
                borderColor: isDark ? theme.border2 : Colors.cardBorderLight,
              },
            ]}
          >
            <View style={styles.userHeader}>
              {recipientUser?.profileImage ? (
                <Image
                  source={{ uri: recipientUser?.profileImage }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  style={styles.profileImage}
                />
              ) : (
                <AvatarInitials
                  name={recipientUser.userName}
                  style={[styles.profileImage, { borderColor: groupTextColor }]}
                />
              )}

              <View style={styles.userInfo}>
                <Text
                  numberOfLines={1}
                  style={[styles.userName, { color: theme.heading }]}
                >
                  {recipientUser.userName}
                </Text>
                <View style={styles.locationRow}>
                  <FontAwesome
                    name="map-marker"
                    size={RFPercentage(1.7)}
                    color={theme.lightGrey}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.locationText, { color: theme.darkGrey }]}
                  >
                    {task?.taskDetails?.address?.name ||
                      "Location not specified"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark
                    ? theme.border2
                    : Colors.cardBorderLight,
                },
              ]}
            />

            <View style={styles.taskSection}>
              <Text
                style={[
                  styles.taskLabel,
                  { color: isDark ? Colors.white : Colors.primary },
                ]}
              >
                {tr.taskCompleted || "Task Completed"}
              </Text>
              <Text style={[styles.taskDescription, { color: theme.heading }]}>
                {taskDesc || tr.translating || "Translating..."}
              </Text>
              <View
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: isDark
                      ? Colors.primary + "35"
                      : Colors.primary + "10",
                  },
                ]}
              >
                <FontAwesome
                  name="calendar"
                  size={RFPercentage(1.6)}
                  color={isDark ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: isDark ? Colors.white : Colors.primary },
                  ]}
                >
                  {completedOn}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating Section */}
          <View
            style={[
              styles.card,
              styles.ratingCard,
              {
                backgroundColor: theme.white,
                borderColor: isDark ? theme.border2 : Colors.cardBorderLight,
              },
            ]}
          >
            <Text style={[styles.ratingTitle, { color: theme.heading }]}>
              {tr.howExperience || "How Was Your Experience?"}
            </Text>
            <View style={styles.starsContainer}>
              {rating.map((selected, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => toggleStar(index)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Animated.View
                    style={{ transform: [{ scale: starAnimations[index] }] }}
                  >
                    <FontAwesome
                      name="star"
                      size={RFPercentage(4.2)}
                      color={getStarColor(selected)}
                      style={styles.star}
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
            <View
              style={[
                styles.ratingHintChip,
                {
                  backgroundColor: isDark
                    ? Colors.whiteAlpha08
                    : Colors.lightWhite,
                },
              ]}
            >
              <Text style={[styles.ratingHint, { color: theme.lightGrey }]}>
                {tr.tap} {rating.filter(Boolean).length}/5
              </Text>
            </View>
          </View>

          {/* Review Input Section */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.white,
                borderColor: isDark ? theme.border2 : Colors.cardBorderLight,
              },
            ]}
          >
            <Text style={[styles.reviewTitle, { color: theme.heading }]}>
              {tr.writeReview || "Write your review"}
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.white,
                  borderColor: isDark ? theme.border2 : Colors.cardBorderLight,
                },
              ]}
            >
              <TextInput
                value={reviewText}
                onChangeText={(txt) => txt.length <= 150 && setReviewText(txt)}
                placeholder={tr.shareThoughts || "Share your thoughts..."}
                placeholderTextColor={theme.inputFieldPlaceholder}
                multiline
                maxLength={150}
                style={[styles.reviewInput, { color: theme.heading }]}
              />
              <View style={styles.counterContainer}>
                <Text
                  style={[
                    styles.counterText,
                    {
                      color:
                        reviewText.length === 150
                          ? Colors.red
                          : theme.lightGrey,
                    },
                  ]}
                >
                  {reviewText.length}/150 {tr.characters || "characters"}
                </Text>
              </View>
            </View>
            <MyAppButton
              title={tr.addReview || "Add Review"}
              disabled={submitting || reviewText.trim().length === 0}
              loading={submitting}
              onPress={submitReview}
              marginTop={RFPercentage(1.5)}
              width={"100%"}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: RFPercentage(3),
  },
  content: {
    flex: 1,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
  },
  card: {
    borderRadius: RFPercentage(2.2),
    padding: RFPercentage(2.2),
    marginBottom: RFPercentage(1.8),
    borderWidth: 1,
    shadowColor: Colors.pureBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: RFPercentage(7.5),
    height: RFPercentage(7.5),
    borderRadius: RFPercentage(3.75),
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userInfo: {
    marginLeft: RFPercentage(1.8),
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    flex: 1,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(0.7),
  },
  divider: {
    height: 1,
    marginVertical: RFPercentage(1.8),
  },
  taskSection: {},
  taskLabel: {
    fontSize: RFPercentage(1.35),
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: RFPercentage(0.8),
  },
  taskDescription: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.6),
    marginBottom: RFPercentage(1.5),
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(5),
    alignSelf: "flex-start",
  },
  dateText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.7),
    lineHeight: RFPercentage(2),
  },
  ratingCard: {
    alignItems: "center",
    paddingVertical: RFPercentage(2.8),
  },
  ratingTitle: {
    fontSize: RFPercentage(2.1),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(2),
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: RFPercentage(1.6),
  },
  star: {
    marginHorizontal: RFPercentage(0.7),
  },
  ratingHintChip: {
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(5),
  },
  ratingHint: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  reviewTitle: {
    fontSize: RFPercentage(2.1),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1.4),
  },
  inputContainer: {
    borderRadius: RFPercentage(1.8),
    borderWidth: 1,
    overflow: "hidden",
  },
  reviewInput: {
    minHeight: RFPercentage(14),
    padding: RFPercentage(1.8),
    paddingTop: RFPercentage(1.8),
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.5),
    textAlignVertical: "top",
  },
  counterContainer: {
    paddingHorizontal: RFPercentage(1.8),
    paddingBottom: RFPercentage(1.2),
    alignItems: "flex-end",
  },
  counterText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
  },
});

export default AddReview;
