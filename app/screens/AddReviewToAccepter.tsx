import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  StatusBar,
} from "react-native";
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
  bulk: string;
};

interface ParamsType {
  task?: any;
}

interface NotificationData {
  sender: {
    userId: string | undefined;
    userName: string | undefined;
    email: string | null;
    profileImage: string | null;
    token: string | null;
  };
  receiver: {
    userId: string | undefined;
    name: string | undefined;
    email: string | null;
    profileImage: string | null;
    token: string | null;
  };
  task: {
    taskId: string;
    description: string;
    taskType: string;
  };
  review: {
    text: string;
    rating: number;
  };
  type: string;
  timestamp: string;
  isRead: boolean;
  isBulkTask?: boolean;
  bulkWorkerId?: string;
}

function AddReviewToAccepter() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { userData } = useUser();
  const { theme } = useAppTheme();
  const typedParams = params as ParamsType;
  const task = typedParams.task || {};
  const recipientUser = task?.acceptedBy ?? {
    userId: "",
    userName: "User",
    profileImage: null,
    token: null,
    email: null,
  };
  const taskId = task?.taskId || "";
  const originalDesc = task?.description ?? "";
  const completedOn = moment(
    task?.createdAt?.toDate?.() ?? task?.createdAt ?? new Date(),
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

  // Rating Star Animation
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

  // Saving Review In Notifications DB
  const saveReviewNotification = async () => {
    try {
      const notificationData: NotificationData = {
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
          taskType: task.taskType || "Task",
        },
        review: {
          text: reviewText,
          rating: rating.filter(Boolean).length,
        },
        type: "review_added",
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      if (task.isBulkRequest) {
        notificationData.isBulkTask = true;
        notificationData.bulkWorkerId = task.bulkWorkerId;
      }

      await addDoc(collection(FIREBASE_DB, "notifications"), notificationData);
      console.log("Review notification saved to database");
    } catch (err) {
      console.log("Error saving review notification:", err);
    }
  };

  // Sending Push Notification with proper error handling
  const sendReviewPushNotification = async () => {
    if (!recipientUser?.token) {
      console.log("No FCM token available for recipient");
      return;
    }

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
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            fcmToken: recipientUser?.token,
            title: `${userData?.userName} left you a review!`,
            body: `${previewText}`,
            data: {
              type: "review_added",
              taskId: taskId,
              reviewerName: userData?.userName,
              reviewRating: rating.filter(Boolean).length,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Server error response:", errorText);
        if (response.status === 500 && errorText.includes("not found")) {
          console.log(
            "FCM token is invalid. User may have uninstalled the app.",
          );
        }
        return;
      }

      const data = await response.text();
      console.log("Push notification sent:", data);
    } catch (error) {
      console.log("sendReviewPushNotification fetch error:", error);
    }
  };

  // Translations-----
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
        taskCompleted: "Your Task Completed By",
        writeReview: "Write your review",
        characters: "characters",
        tap: "Tap to rate",
        bulk: "Bulk Task Helper",
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

  const toggleStar = (idx: number) => {
    const newRating = rating.map((_, i) => i <= idx);
    setRating(newRating);
    newRating.forEach((selected, index) => {
      if (selected && index <= idx) {
        animateStar(index);
      }
    });
  };

  // Review Submission with improved error handling
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

      if (!currentUserId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "You must be logged in to submit a review.",
        });
        setSubmitting(false);
        return;
      }

      // For bulk tasks: use the specific worker ID
      const reviewedUserId =
        task.isBulkRequest && task.bulkWorkerId
          ? task.bulkWorkerId
          : recipientUser.userId;

      // Validate we have a valid user to review
      if (!reviewedUserId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Cannot submit review: Invalid user.",
        });
        setSubmitting(false);
        return;
      }

      // 1. Save review to database
      const reviewData = {
        reviewerId: currentUserId,
        reviewerName: userData?.userName || "Anonymous",
        reviewerProfileImage: userData?.profileImage || null,
        reviewedUserId: reviewedUserId,
        reviewedUserName: recipientUser.userName,
        reviewedUserProfileImage: recipientUser.profileImage,
        taskId,
        taskTitle: task.taskType || task.title || "Task",
        taskDescription: task.description || "",
        rating: stars,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp(),
        taskOwnerId: task.userId,
        isBulkTask: task.isBulkRequest || false,
        bulkWorkerId: task.bulkWorkerId || null,
      };
      const reviewRef = await addDoc(
        collection(FIREBASE_DB, "reviews"),
        reviewData,
      );
      const reviewId = reviewRef.id;
      console.log("Review saved with ID:", reviewId);

      // 2. Update task reviewed status
      try {
        if (task.isBulkRequest && task.confirmedWorkers) {
          // Check if all helpers have been reviewed
          const reviewsRef = collection(FIREBASE_DB, "reviews");
          const reviewQuery = query(
            reviewsRef,
            where("taskId", "==", task.id),
            where("reviewerId", "==", currentUserId),
          );
          const reviewSnapshot = await getDocs(reviewQuery);

          const reviewedWorkers = new Set(
            reviewSnapshot.docs.map((doc) => doc.data().reviewedUserId),
          );

          const allConfirmedWorkersReviewed = task.confirmedWorkers.every(
            (worker) => reviewedWorkers.has(worker.userId),
          );

          if (allConfirmedWorkersReviewed) {
            const taskDocRef = doc(FIREBASE_DB, "taskRequests", task.id);
            await updateDoc(taskDocRef, {
              reviewedAccepter: true,
              lastReviewUpdate: serverTimestamp(),
            });
          }
        } else {
          // For single tasks
          const taskDocRef = doc(FIREBASE_DB, "taskRequests", task.id);
          await updateDoc(taskDocRef, {
            reviewedAccepter: true,
            reviewedAt: serverTimestamp(),
          });
          console.log("Single task marked as reviewed");
        }
      } catch (updateError) {
        console.log("Error updating task status (non-critical):", updateError);
      }

      // 3. Save notification to database
      try {
        await saveReviewNotification();
      } catch (notificationSaveError) {
        console.log(
          "Error saving notification (non-critical):",
          notificationSaveError,
        );
      }

      // 4. Try to send push notification (but don't fail if it doesn't work)
      try {
        await sendReviewPushNotification();
      } catch (notificationError) {
        console.log(
          "Push notification failed (non-critical):",
          notificationError,
        );
      }

      Toast.show({
        type: "success",
        text1: tr.success || "Success",
        text2: `${tr.reviewSubmitted || "Review submitted successfully!"}`,
      });

      // Navigate back after a delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (e) {
      console.log("Review submission error:", e);
      Toast.show({
        type: "error",
        text1: tr.error || "Error",
        text2: e.message || tr.couldNotSubmit || "Could not submit review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
          <View
            style={[
              styles.userCard,
              {
                backgroundColor: theme.white,
                borderColor:
                  theme.mode === "dark" ? theme.border : Colors.cardBorderLight,
              },
            ]}
          >
            <View style={styles.userHeader}>
              {recipientUser?.profileImage ? (
                <Image
                  source={{ uri: recipientUser?.profileImage }}
                  resizeMode="cover"
                  style={styles.profileImage}
                />
              ) : (
                <AvatarInitials
                  name={recipientUser.userName}
                  style={[styles.profileImage, { borderColor: groupTextColor }]}
                />
              )}

              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.heading }]}>
                  {recipientUser.userName}
                </Text>
                {/* Task type badge */}
                {task.isBulkRequest && (
                  <View style={[styles.bulkBadge, {backgroundColor: theme.mode === "dark" ?  "rgba(255,255,255,0.3)" :  Colors.primary + "20"}]}>
                    <Text style={[styles.bulkBadgeText,{color:theme.mode === "dark" ?  "rgba(255, 255, 255, 1)" :  Colors.primary }]}>{tr.bulk}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.taskSection}>
              <Text style={[styles.taskLabel, { color:theme.mode === "dark" ?  "rgba(255, 255, 255, 1)" :  Colors.primary}]}>
                {tr.taskCompleted || "Task Completed"} {recipientUser.userName}
              </Text>
              <Text style={[styles.taskDescription, { color: theme.heading }]}>
                {taskDesc || tr.translating || "Translating..."}
              </Text>
              <View
                style={[
                  styles.dateContainer,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.darkGrey + "20"
                        : Colors.primary + "10",
                  },
                ]}
              >
                <FontAwesome
                  name="calendar"
                  size={RFPercentage(1.6)}
                  color={theme.mode === "dark" ?  "rgba(255, 255, 255, 1)" :  Colors.primary}
                />
                <Text style={[styles.dateText, { color: theme.mode === "dark" ?  "rgba(255, 255, 255, 1)" :  Colors.primary }]}>
                  {completedOn}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating Section */}
          <View
            style={[
              styles.ratingCard,
              {
                backgroundColor: theme.white,
                borderColor:
                  theme.mode === "dark" ? theme.border : Colors.cardBorderLight,
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
                >
                  <Animated.View
                    style={{ transform: [{ scale: starAnimations[index] }] }}
                  >
                    <FontAwesome
                      name="star"
                      size={RFPercentage(4)}
                      color={getStarColor(selected)}
                      style={{ margin: 2 }}
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingHint, { color: theme.lightGrey }]}>
              {tr.tap} {rating.filter(Boolean).length}/5
            </Text>
          </View>

          {/* Review Input Section */}
          <View style={[styles.reviewCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.reviewTitle, { color: theme.heading }]}>
              {tr.writeReview || "Write your review"}
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.white,
                  borderColor: theme.border,
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
            <View style={{ alignSelf: "center" }}>
              <MyAppButton
                title={tr.addReview || "Add Review"}
                disabled={submitting || reviewText.trim().length === 0}
                loading={submitting}
                onPress={submitReview}
                marginTop={RFPercentage(1)}
              />
            </View>
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
  },
  header: {
    shadowColor: Colors.primary + "20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: RFPercentage(2),
  },
  userCard: {
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
    shadowColor: Colors.primary + "30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(2),
  },
  profileImage: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userInfo: {
    marginLeft: RFPercentage(2),
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  bulkBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(0.5),
    // marginTop: RFPercentage(0.3),
  },
  bulkBadgeText: {
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_500Medium",
    color: Colors.primary,
    lineHeight:RFPercentage(1.5)
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(0.5),
  },
  taskSection: {
    marginTop: RFPercentage(1),
  },
  taskLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    marginBottom: RFPercentage(0.5),
  },
  taskDescription: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(1.5),
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: RFPercentage(1.2),
    borderRadius: RFPercentage(1),
    alignSelf: "flex-start",
  },
  dateText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.5),
    lineHeight:RFPercentage(2)
  },
  ratingCard: {
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
    alignItems: "center",
    shadowColor: Colors.primary + "30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderBottomWidth: 1,
  },
  ratingTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(2),
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: RFPercentage(1),
  },
  ratingHint: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  reviewCard: {
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    shadowColor: Colors.primary + "30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  reviewTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1.5),
  },
  inputContainer: {
    borderRadius: RFPercentage(1.5),
    borderBottomWidth: 1,
    marginBottom: RFPercentage(1),
    overflow: "hidden",
  },
  reviewInput: {
    minHeight: RFPercentage(15),
    // padding: RFPercentage(2),
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    textAlignVertical: "top",
  },
  counterContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(1),
    alignItems: "flex-end",
  },
  counterText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  submitButton: {
    marginTop: RFPercentage(1),
  },
});

export default AddReviewToAccepter;
