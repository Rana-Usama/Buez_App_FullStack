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
import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import { translateText } from "../translation/googleTranslation";
import { useAppTheme } from "../contexts/themeContext";

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
  };
  const taskId = task?.taskId || task?.id || "";
  const originalDesc = task?.taskDetails?.description ?? "";
  const completedOn = moment(
    task?.completedAt?.toDate?.() ?? task?.completedAt ?? new Date()
  ).format("MMM-D-YYYY");

  const [lang, setLang] = useState("en");
  const [tr, setTr] = useState<Partial<Translations>>({});
  const [taskDesc, setTaskDesc] = useState(originalDesc);

  const [rating, setRating] = useState([false, false, false, false, false]);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      };
      const vals = await Promise.all(
        Object.values(phrases).map((txt) => translateText(txt))
      );
      const map = Object.keys(phrases).reduce((acc, k, i) => {
        acc[k] = vals[i] || phrases[k];
        return acc;
      }, {});
      setTr(map);
    })();
  }, []);

  useEffect(() => {
    if (!originalDesc) return;
    (async () => {
      try {
        const translated = await translateText(originalDesc);
        setTaskDesc(translated || originalDesc);
      } catch {
        setTaskDesc(originalDesc);
      }
    })();
  }, [originalDesc, lang]);

  const toggleStar = (idx) => setRating(rating.map((_, i) => i <= idx));

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
      await addDoc(collection(FIREBASE_DB, "reviews"), {
        reviewer: {
          userId: currentUser?.uid || "",
          userName: userData?.userName || "Anonymous",
          profileImage: userData?.profileImage || null,
        },
        recipient: recipientUser,
        taskId,
        rating: stars,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp(),
        taskOwnerId: task?.taskOwnerId,
      });
      const q = query(
        collection(FIREBASE_DB, "completedTask"),
        where("taskId", "==", taskId)
      );
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) =>
          updateDoc(doc(FIREBASE_DB, "completedTask", d.id), {
            reviewed: true,
            reviewText: reviewText.trim(),
            rating: stars,
          })
        )
      );
      Toast.show({
        type: "success",
        text1: tr.success || "Success",
        text2: tr.reviewSubmitted || "Review submitted!",
      });
      navigation.goBack();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: tr.error || "Error",
        text2: tr.couldNotSubmit || "Could not submit review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.screen, { backgroundColor: theme.white }]}>
          <View style={styles.navContainer}>
            <Nav
              dpNull
              marginTop={
                Platform.OS === "android"
                  ? RFPercentage(4.5)
                  : RFPercentage(7.9)
              }
              leftLogo={false}
              navigation={navigation}
              title={tr.addReview || "Add Review"}
            />
          </View>

          <View style={styles.profileContainer}>
            <Image
              source={
                recipientUser?.profileImage
                  ? { uri: recipientUser?.profileImage }
                  : Icons.dp
              }
              resizeMode="cover"
              style={styles.profileImage}
            />
            <View style={styles.nameRow}>
              <Text style={[styles.nameText, { color: theme.heading }]}>
                {recipientUser.userName}
              </Text>
            </View>
            <Text style={[styles.descText, { color: theme.darkGrey }]}>
              {taskDesc || tr.translating || "Translating..."}
            </Text>
            {!!completedOn && (
              <Text
                style={[styles.completedText, { color: theme.darkGrey }]}
              >{`${tr.completedOn || "Completed on"}: ${completedOn}`}</Text>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <Text style={[styles.experienceText, { color: theme.heading }]}>
              {tr.howExperience || "How Was Your Experience?"}
            </Text>
            <View style={styles.starRow}>
              {rating.map((sel, idx) => (
                <TouchableOpacity key={idx} onPress={() => toggleStar(idx)}>
                  <FontAwesome
                    name="star"
                    size={RFPercentage(3)}
                    color={sel ? Colors.star : Colors.stroke}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.reviewContainer}>
            <TextInput
              value={reviewText}
              onChangeText={(txt) => txt.length <= 150 && setReviewText(txt)}
              placeholder={tr.shareThoughts || "Share your thoughts..."}
              multiline
              placeholderTextColor={theme.inputFieldPlaceholder}
              maxLength={150}
              style={[styles.reviewInput, { borderColor: theme.border , color:theme.heading}]}
            />
            <View style={styles.charCounterContainer}>
              <Text
                style={[
                  styles.charCounterText,
                  {
                    color:
                      reviewText.length === 150 ? theme.red : theme.lightGrey,
                  },
                ]}
              >
                {reviewText.length} / 150
              </Text>
            </View>

            <MyAppButton
              title={tr.addReview || "Add Review"}
              disabled={submitting}
              loading={submitting}
              onPress={submitReview}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: { width: "100%" },
  scrollViewContent: { width: "100%", paddingBottom: RFPercentage(5) },
  navContainer: {},
  profileContainer: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(4),
  },
  profileImage: {
    width: RFPercentage(14),
    height: RFPercentage(14),
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: RFPercentage(100),
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: RFPercentage(2),
  },
  nameText: {
    color: Colors.darkGrey2,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(2.3),
  },
  descText: {
    color: Colors.grey,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.8),
    marginTop: RFPercentage(1),
  },
  completedText: {
    color: Colors.grey,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(0.5),
  },
  ratingContainer: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: RFPercentage(6),
  },
  experienceText: {
    color: Colors.darkGrey2,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(2),
    marginBottom: RFPercentage(2),
    textAlign: "center",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginHorizontal: 5,
  },
  reviewContainer: {
    width: "90%",
    alignItems: "center",
    alignSelf: "center",
    marginTop: RFPercentage(4),
  },
  reviewInput: {
    borderWidth: 1,
    width: "100%",
    height: RFPercentage(15),
    borderRadius: RFPercentage(1.3),
    borderColor: "rgba(169,166,166,0.7)",
    padding: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    textAlignVertical: "top",
    fontSize: RFPercentage(1.8),
  },
  charCounterContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: RFPercentage(0.8),
    bottom: RFPercentage(3.5),
    right: RFPercentage(1),
  },
  charCounterText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
});

export default AddReview;
