// src/screens/AddReview.js
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

/* components */
import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";

/* config / utils */
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { FIREBASE_DB } from "../../firebaseConfig";
import { useUser } from "../contexts/user.context";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import { translateText } from "../translation/googleTranslation";

/* ---------- helpers ---------- */
const getTargetLanguage = async () => {
  try {
    const stored = await SecureStore.getItemAsync("appLanguage");
    return stored || Localization.locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
};

function AddReview() {
  /* nav / params */
  const navigation = useNavigation();
  const { params } = useRoute();
  const { userData } = useUser();

  /* task basics */
  const task = params?.task || {};
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

  /* lang + translations */
  const [lang, setLang] = useState("en");
  const [tr, setTr] = useState({});
  const [taskDesc, setTaskDesc] = useState(originalDesc); // translated desc

  /* local ui state */
  const [rating, setRating] = useState([false, false, false, false, false]);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------- load language & static translations ---------- */
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

  /* ---------- translate task description ---------- */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalDesc, lang]);

  /* ---------- handlers ---------- */
  const toggleStar = (idx) =>
    setRating(rating.map((_, i) => i <= idx));

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
      /* save review */
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

      /* mark completedTask as reviewed */
      const q = query(
        collection(FIREBASE_DB, "completedTask"),
        where("taskId", "==", taskId)
      );
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) =>
          updateDoc(doc(FIREBASE_DB, "completedTask", d.id), {
            reviewed: true,
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
      console.log("Review save error:", e);
      Toast.show({
        type: "error",
        text1: tr.error || "Error",
        text2: tr.couldNotSubmit || "Could not submit review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- ui ---------- */
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Nav */}
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          <Nav
            dpNull
            marginTop={
              Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)
            }
            leftLogo={false}
            navigation={navigation}
            title={tr.addReview || "Add Review"}
          />
        </View>

        {/* Profile */}
        <View
          style={{
            width: "90%",
            alignSelf: "center",
            marginTop: RFPercentage(4),
          }}
        >
          <Image
            source={
              recipientUser.profileImage
                ? { uri: recipientUser.profileImage }
                : Icons.profile2
            }
            resizeMode="cover"
            style={{
              width: RFPercentage(14),
              height: RFPercentage(14),
              borderWidth: 1.5,
              borderColor: Colors.primary,
              borderRadius: RFPercentage(100),
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: RFPercentage(2),
            }}
          >
            <Text style={styles.nameText}>{recipientUser.userName}</Text>
          </View>

          <Text style={styles.descText}>
            {taskDesc || tr.translating || "Translating..."}
          </Text>

          {!!completedOn && (
            <Text style={styles.completedText}>
              {`${tr.completedOn || "Completed on"}: ${completedOn}`}
            </Text>
          )}
        </View>

        {/* Stars */}
        <View style={styles.ratingContainer}>
          <Text style={styles.experienceText}>
            {tr.howExperience || "How Was Your Experience?"}
          </Text>
          <View style={styles.starRow}>
            {rating.map((sel, idx) => (
              <TouchableOpacity key={idx} onPress={() => toggleStar(idx)}>
                <FontAwesome
                  name="star"
                  size={30}
                  color={sel ? "#F3CF2C" : "#D1D5DB"}
                  style={{ marginHorizontal: 5 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Review input */}
        <View
          style={{
            width: "90%",
            alignItems: "center",
            alignSelf: "center",
            marginTop: RFPercentage(4),
          }}
        >
          <TextInput
            value={reviewText}
            onChangeText={(txt) => txt.length <= 150 && setReviewText(txt)}
            placeholder={tr.shareThoughts || "Share your thoughts..."}
            multiline
            placeholderTextColor={"rgba(169,166,166,0.7)"}
            maxLength={150}
            style={{
              borderWidth: 1,
              width: "100%",
              height: RFPercentage(15),
              borderRadius: RFPercentage(1.6),
              borderColor: "rgba(169,166,166,0.7)",
              padding: RFPercentage(1.4),
              fontFamily: "Poppins_400Regular",
              textAlignVertical: "top",
            }}
          />
          <View
            style={{
              width: "100%",
              alignItems: "flex-end",
              marginTop: RFPercentage(0.8),
              bottom: RFPercentage(3.5),
              right: RFPercentage(1),
            }}
          >
            <Text
              style={{
                fontSize: RFPercentage(1.7),
                color:
                  reviewText.length === 150 ? "red" : Colors.lightGrey,
                fontFamily: "Poppins_400Regular",
              }}
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
      </ScrollView>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: { width: "100%" },
  scrollViewContent: { width: "100%" },
  nameText: {
    color: Colors.darkGrey2,
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(2.3),
  },
  descText: {
    color: Colors.grey,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.9),
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
    fontSize: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
    textAlign:'center'
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default AddReview;
