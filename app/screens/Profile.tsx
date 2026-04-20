import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Animated,
  Easing,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { fetchCompletedTasksFromFirebase } from "../services/Review.service";
import { cachedTranslate } from "../utils/cachedTranslations";
import CustomNav from "../components/common/CustomNav";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import Toast from "react-native-toast-message";

// ─── Category master list (always English — source of truth) ──────────────────
const taskOptions = [
  { id: 1, name: "Cleaning", icon: "broom", color: "#4ECDC4" },
  { id: 2, name: "Moving", icon: "truck", color: "#FF6B6B" },
  { id: 3, name: "Gardening", icon: "seedling", color: "#95E06C" },
  { id: 4, name: "Gaming", icon: "gamepad", color: "#A78BFA" },
  { id: 5, name: "Plumbing", icon: "wrench", color: "#60A5FA" },
  { id: 6, name: "Electrical", icon: "bolt", color: "#FBBF24" },
  { id: 7, name: "Carpentry", icon: "hammer", color: "#F97316" },
  { id: 8, name: "Painting", icon: "paint-brush", color: "#EC4899" },
  { id: 9, name: "Delivery", icon: "shipping-fast", color: "#14B8A6" },
  { id: 10, name: "Tutoring", icon: "chalkboard-teacher", color: "#8B5CF6" },
  { id: 11, name: "Event Setup", icon: "calendar-alt", color: "#F43F5E" },
  { id: 12, name: "Photography", icon: "camera", color: "#06B6D4" },
  { id: 13, name: "Pet Care", icon: "paw", color: "#D97706" },
];

// ─── Modal Chip ────────────────────────────────────────────────────────────────
// Receives English `item` for icon/color, and `translatedLabel` for display.
// Selection logic inside parent still uses English keys.
const ModalChip = ({
  item,
  translatedLabel,
  isSelected,
  onPress,
  index,
}: {
  item: (typeof taskOptions)[0];
  translatedLabel: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const selectScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 35,
      easing: Easing.out(Easing.back(1.3)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(selectScale, {
        toValue: 0.88,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(selectScale, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: Animated.multiply(scaleAnim, selectScale) }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          modalStyles.chip,
          isSelected && {
            borderColor: item.color,
            backgroundColor: item.color + "18",
          },
        ]}
      >
        <View
          style={[
            modalStyles.chipIcon,
            { backgroundColor: isSelected ? item.color : item.color + "22" },
          ]}
        >
          <FontAwesome5
            name={item.icon}
            size={RFPercentage(1.5)}
            color={isSelected ? "#fff" : item.color}
            solid
          />
        </View>
        <Text
          style={[
            modalStyles.chipText,
            isSelected && {
              color: item.color,
              fontFamily: "Poppins_600SemiBold",
            },
          ]}
        >
          {translatedLabel}
        </Text>
        {isSelected && (
          <View
            style={[modalStyles.checkBadge, { backgroundColor: item.color }]}
          >
            <FontAwesome5
              name="check"
              size={RFPercentage(0.8)}
              color="#fff"
              solid
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Custom Tag ────────────────────────────────────────────────────────────────
const CustomTag = ({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) => {
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      tension: 180,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{ transform: [{ scale: enterAnim }], opacity: enterAnim }}
    >
      <LinearGradient
        colors={["#0c1246ff", "#292493ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={modalStyles.customTag}
      >
        <Text style={modalStyles.customTagText}>{name}</Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={modalStyles.customTagRemove}
        >
          <FontAwesome5
            name="times"
            size={RFPercentage(1)}
            color="rgba(255,255,255,0.8)"
            solid
          />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Interest Pill (profile display) ──────────────────────────────────────────

const InterestPill = ({
  displayName,
  originalName,
  isCustom,
  theme,
}: {
  displayName: string;
  originalName: string;
  isCustom?: boolean;
  theme: any;
}) => {
  const meta = isCustom
    ? null
    : taskOptions.find((t) => t.name === originalName);
  const color = isCustom ? "#3e4797ff" : meta?.color || "#7C3AED";
  const icon = isCustom ? "tag" : meta?.icon || "tag";

  const darkBg = isCustom ? "#17171bcd" : color + "15";
  const lightBg = isCustom ? "#eff1ffcd" : color + "12";
  const darkBdr = isCustom ? "#242529cd" : color + "40";
  const lightBdr = isCustom ? "#b4b8d6cd" : color + "40";
  const iconBg = isCustom
    ? theme.mode === "dark"
      ? "#1b1c22cd"
      : "#dbdcf1cd"
    : color + "22";

  return (
    <View
      style={[
        pillStyles.pill,
        {
          borderColor: theme.mode === "dark" ? darkBdr : lightBdr,
          backgroundColor: theme.mode === "dark" ? darkBg : lightBg,
        },
      ]}
    >
      <View style={[pillStyles.iconWrap, { backgroundColor: iconBg }]}>
        <FontAwesome5
          name={icon}
          size={RFPercentage(1.2)}
          color={color}
          solid
        />
      </View>
      <Text style={[pillStyles.text, { color }]}>{displayName}</Text>
    </View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
function Profile({ navigation }: any) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const profileImgUrl = user?.profileImage || "";
  const userName = user?.userName || "";
  const userBio = user?.biography || "";

  // ── General UI state ──────────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [userBadge, setUserBadge] = useState<any>(null);
  const [translatedTasksText, setTranslatedTasksText] = useState("");
  const [translatedReadMore, setTranslatedReadMore] = useState({
    readMore: "",
    readLess: "",
  });
  const [translatedAddBio, setTranslatedAddBio] = useState("");
  const [translatedBiography, setTranslatedBiography] = useState("");

  // ── Interests state ───────────────────────────────────────────────────────
  const [interests, setInterests] = useState<{
    selectedCategories: string[];
    customInterests: string[];
    allInterests: string[];
  } | null>(null);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const [translatedPills, setTranslatedPills] = useState<{
    categories: { original: string; display: string }[];
    custom: { original: string; display: string }[];
  }>({ categories: [], custom: [] });

  const [modalChipLabels, setModalChipLabels] = useState<
    Record<string, string>
  >({});

  const [modalTx, setModalTx] = useState({
    title: "Edit Interests",
    selectedSuffix: "selected",
    categoriesLabel: "CATEGORIES",
    customLabel: "CUSTOM INTERESTS",
    placeholder: "e.g. Pool Cleaning...",
    saveBtn: "Save Interests",
    savingBtn: "Saving...",
    alreadyAdded: "Already added!",
    alreadyInList: "is already in your list.",
    minOne: "Select at least 1 interest.",
    savedToast: "Interests Updated! 🎉",
    failedToast: "Failed to save. Try again.",
    myInterests: "My Interests",
    edit: "Edit",
    addInterests: "Add your interests",
    addInterestsSub: "Tell us what services you love",
    loading: "Loading...",
  });

  // ── Modal selection state ─────────────────────────────────────────────────
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());
  const [modalCustom, setModalCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [saving, setSaving] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;

  const needsReadMore = userBio.length > 80;
  const displayBioText = isExpanded
    ? translatedBiography
    : translatedBiography.slice(0, 80) + (needsReadMore ? "..." : "");

  // ── Translate ALL modal static strings + chip labels once on mount ────────
  useEffect(() => {
    const translateAll = async () => {
      try {
        // 1. Static UI strings
        const [
          title,
          selectedSuffix,
          categoriesLabel,
          customLabel,
          placeholder,
          saveBtn,
          savingBtn,
          alreadyAdded,
          alreadyInList,
          minOne,
          savedToast,
          failedToast,
          myInterests,
          edit,
          addInterests,
          addInterestsSub,
          loading,
        ] = await Promise.all([
          cachedTranslate("Edit Interests"),
          cachedTranslate("selected"),
          cachedTranslate("CATEGORIES"),
          cachedTranslate("CUSTOM INTERESTS"),
          cachedTranslate("e.g. Pool Cleaning..."),
          cachedTranslate("Save Interests"),
          cachedTranslate("Saving..."),
          cachedTranslate("Already added!"),
          cachedTranslate("is already in your list."),
          cachedTranslate("Select at least 1 interest."),
          cachedTranslate("Interests Updated! 🎉"),
          cachedTranslate("Failed to save. Try again."),
          cachedTranslate("My Interests"),
          cachedTranslate("Edit"),
          cachedTranslate("Add your interests"),
          cachedTranslate("Tell us what services you love"),
          cachedTranslate("Loading..."),
        ]);
        setModalTx({
          title,
          selectedSuffix,
          categoriesLabel,
          customLabel,
          placeholder,
          saveBtn,
          savingBtn,
          alreadyAdded,
          alreadyInList,
          minOne,
          savedToast,
          failedToast,
          myInterests,
          edit,
          addInterests,
          addInterestsSub,
          loading,
        });

        // 2. Chip labels: English name → translated label
        const chipEntries = await Promise.all(
          taskOptions.map(
            async (opt) =>
              [opt.name, await cachedTranslate(opt.name)] as [string, string],
          ),
        );
        setModalChipLabels(Object.fromEntries(chipEntries));
      } catch (e) {
        console.log("Modal/chip translation error:", e);
      }
    };
    translateAll();
  }, []);

  // ── Fetch interests ────────────────────────────────────────────────────────
  const fetchInterests = async () => {
    try {
      const uid = FIREBASE_AUTH.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(FIREBASE_DB, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setInterests(data?.interests || null);
      }
    } catch (e) {
      console.log("Error fetching interests:", e);
    } finally {
      setLoadingInterests(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  // ── Translate pill labels whenever stored interests change ────────────────
  useEffect(() => {
    if (!interests) return;
    const translatePills = async () => {
      try {
        const cats = await Promise.all(
          (interests.selectedCategories || []).map(async (original) => ({
            original,
            display: await cachedTranslate(original),
          })),
        );
        const custom = await Promise.all(
          (interests.customInterests || []).map(async (original) => ({
            original,
            display: await cachedTranslate(original),
          })),
        );
        setTranslatedPills({ categories: cats, custom });
      } catch {
        setTranslatedPills({
          categories: (interests.selectedCategories || []).map((n) => ({
            original: n,
            display: n,
          })),
          custom: (interests.customInterests || []).map((n) => ({
            original: n,
            display: n,
          })),
        });
      }
    };
    translatePills();
  }, [interests]);

  // ── Modal open/close ───────────────────────────────────────────────────────
  const openEditModal = () => {
    setModalSelected(new Set(interests?.selectedCategories || []));
    setModalCustom(interests?.customInterests || []);
    setShowEditModal(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowEditModal(false));
  };

  // ── Modal actions ──────────────────────────────────────────────────────────
  const toggleCategory = (englishName: string) => {
    setModalSelected((prev) => {
      const next = new Set(prev);
      next.has(englishName) ? next.delete(englishName) : next.add(englishName);
      return next;
    });
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (modalCustom.includes(trimmed) || modalSelected.has(trimmed)) {
      Toast.show({
        type: "error",
        text1: modalTx.alreadyAdded,
        text2: `"${trimmed}" ${modalTx.alreadyInList}`,
      });
      return;
    }
    setModalCustom((prev) => [...prev, trimmed]);
    setCustomInput("");
  };

  const removeCustom = (name: string) =>
    setModalCustom((prev) => prev.filter((i) => i !== name));

  // ── Save — always persist English keys to Firestore ───────────────────────
  const saveInterests = async () => {
    if (modalSelected.size + modalCustom.length < 1) {
      Toast.show({ type: "info", text1: modalTx.minOne });
      return;
    }
    setSaving(true);
    try {
      const uid = FIREBASE_AUTH.currentUser?.uid;
      if (!uid) throw new Error("No user");
      const updated = {
        selectedCategories: Array.from(modalSelected), // English keys
        customInterests: modalCustom,
        allInterests: [...Array.from(modalSelected), ...modalCustom],
        updatedAt: serverTimestamp(),
      };
      await setDoc(
        doc(FIREBASE_DB, "users", uid),
        { interests: updated },
        { merge: true },
      );
      setInterests(updated as any);
      Toast.show({ type: "success", text1: modalTx.savedToast });
      closeModal();
    } catch (e) {
      Toast.show({ type: "error", text1: modalTx.failedToast });
    }
    setSaving(false);
  };

  // ── Badge & stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const records = await fetchCompletedTasksFromFirebase();
        const count = records?.length || 0;
        setCompletedTasksCount(count);
        let badge: any = null;
        if (count >= 3)
          badge = {
            icon: "trophy",
            text: `${t("profileRank.txt5")}`,
            color: "#FFD700",
            bgColor: "#41403462",
            borderColor: "#FFD700",
            bgColor2: "#b6b38e62",
          };
        else if (count >= 2)
          badge = {
            icon: "trending-up",
            text: `${t("profileRank.txt4")}`,
            color: "#FF9800",
            bgColor: "#a4937685",
            borderColor: "#FF9800",
            bgColor2: "#cabda673",
          };
        else if (count >= 1)
          badge = {
            icon: "leaf",
            text: `${t("profileRank.txt3")}`,
            color: "#4CAF50",
            bgColor: "#679d6793",
            borderColor: "#4CAF50",
            bgColor2: "#a9cfa993",
          };
        setUserBadge(badge);
      } catch (e) {
        console.log("Error fetching user stats:", e);
      }
    };
    fetchUserStats();
  }, []);

  // ── General UI text translations ───────────────────────────────────────────
  useEffect(() => {
    const translateTexts = async () => {
      try {
        setTranslatedTasksText(await cachedTranslate("tasks completed"));
        setTranslatedReadMore({
          readMore: await cachedTranslate("Read more"),
          readLess: await cachedTranslate("Read less"),
        });
        setTranslatedAddBio(await cachedTranslate("Add professional bio"));
        if (userBio) setTranslatedBiography(await cachedTranslate(userBio));
      } catch {
        setTranslatedTasksText("tasks completed");
        setTranslatedReadMore({ readMore: "Read more", readLess: "Read less" });
        setTranslatedAddBio("Add professional bio");
        setTranslatedBiography(userBio);
      }
    };
    translateTexts();
  }, [userBio]);

  useEffect(() => {
    const translateBio = async () => {
      if (userBio) {
        try {
          setTranslatedBiography(await cachedTranslate(userBio));
        } catch {
          setTranslatedBiography(userBio);
        }
      } else {
        setTranslatedBiography("");
      }
    };
    translateBio();
  }, [userBio]);

  const navigationsList = [
    {
      iconSource: Icons.editP,
      title: `${t("profile.txt2")}`,
      navigation: () => navigation.navigate("EditProfile"),
    },
    {
      iconSource: Icons.receipt,
      title: `${t("profile.txt3")}`,
      navigation: () => navigation.navigate("Reviews"),
    },
    {
      iconSource: Icons.map2,
      title: `${t("profile.txt4")}`,
      navigation: () => navigation.navigate("CompletedTasks"),
    },
  ];

  const hasInterests =
    interests &&
    (interests.selectedCategories?.length > 0 ||
      interests.customInterests?.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <CustomNav title={`${t("profile.txt1")}`} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.white,
              borderWidth: 1,
              borderColor:
                theme.mode === "dark" ? theme.border : "rgba(238,238,238,1)",
            },
          ]}
        >
          <View style={styles.imageSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View
                style={[styles.imageContainer, { borderColor: theme.primary }]}
              >
                <Image
                  style={styles.profileImage}
                  source={profileImgUrl ? { uri: profileImgUrl } : Icons.dp}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.userName, { color: theme.heading }]}>
              {userName}
            </Text>

            {userBadge && (
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? userBadge.bgColor
                        : userBadge.bgColor2,
                    borderColor: userBadge.borderColor,
                  },
                ]}
              >
                <Ionicons
                  name={userBadge.icon}
                  size={RFPercentage(1.4)}
                  color={userBadge.color}
                />
                <Text style={[styles.badgeText, { color: userBadge.color }]}>
                  {userBadge.text}
                </Text>
              </View>
            )}

            {completedTasksCount > 0 && (
              <View style={styles.tasksCountContainer}>
                <Ionicons
                  name="checkmark-done-circle"
                  size={RFPercentage(1.6)}
                  color={Colors.primary}
                />
                <Text
                  style={[styles.tasksCountText, { color: theme.darkGrey }]}
                >
                  {completedTasksCount}{" "}
                  {translatedTasksText || "tasks completed"}
                </Text>
              </View>
            )}

            {userBio ? (
              <View style={styles.biographySection}>
                <Text style={[styles.biographyText, { color: theme.darkGrey }]}>
                  {displayBioText}
                </Text>
                {needsReadMore && (
                  <TouchableOpacity
                    onPress={() => setIsExpanded(!isExpanded)}
                    style={styles.readMoreButton}
                  >
                    <Text
                      style={[styles.readMoreText, { color: theme.primary }]}
                    >
                      {isExpanded
                        ? translatedReadMore.readLess || "Read less"
                        : translatedReadMore.readMore || "Read more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfile")}
                style={[styles.addBioButton, { borderColor: theme.border }]}
              >
                <MaterialIcons
                  name="add"
                  size={RFPercentage(2)}
                  color={theme.primary}
                />
                <Text style={[styles.addBioText, { color: theme.primary }]}>
                  {translatedAddBio || "Add professional bio"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Interests Card ── */}
        <View
          style={[
            styles.interestsCard,
            {
              backgroundColor: theme.white,
              borderColor:
                theme.mode === "dark" ? theme.border : "rgba(238,238,238,1)",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.interestsHeader}>
            <View style={styles.interestsTitleRow}>
              <LinearGradient
                colors={["#233496ff", "#4F46E5"]}
                style={styles.interestsIconBg}
              >
                <FontAwesome5
                  name="heart"
                  size={RFPercentage(1.4)}
                  color="#fff"
                  solid
                />
              </LinearGradient>
              <Text style={[styles.interestsTitle, { color: theme.heading }]}>
                {modalTx.myInterests}
              </Text>
            </View>
            <TouchableOpacity
              onPress={openEditModal}
              style={[
                styles.editInterestsBtn,
                {
                  borderColor: theme.primary + "30",
                  backgroundColor: theme.primary + "10",
                },
              ]}
            >
              <FontAwesome5
                name="pen"
                size={RFPercentage(1.2)}
                color={theme.primary}
                solid
              />
              <Text
                numberOfLines={1}
                style={[styles.editInterestsBtnText, { color: theme.primary }]}
              >
                {modalTx.edit}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pills or empty state */}
          {loadingInterests ? (
            <Text style={[styles.interestsEmpty, { color: theme.darkGrey }]}>
              {modalTx.loading}
            </Text>
          ) : hasInterests ? (
            <View style={styles.pillsWrap}>
              {/* Category pills — English originalName drives icon/color */}
              {translatedPills.categories.map((item) => (
                <InterestPill
                  key={`cat-${item.original}`}
                  displayName={item.display}
                  originalName={item.original}
                  theme={theme}
                />
              ))}
              {/* Custom interest pills */}
              {translatedPills.custom.map((item) => (
                <InterestPill
                  key={`custom-${item.original}`}
                  displayName={item.display}
                  originalName={item.original}
                  isCustom
                  theme={theme}
                />
              ))}
            </View>
          ) : (
            <TouchableOpacity
              onPress={openEditModal}
              style={[styles.emptyInterests, { borderColor: theme.border }]}
            >
              <FontAwesome5
                name="plus-circle"
                size={RFPercentage(2.2)}
                color={theme.primary}
              />
              <Text
                style={[styles.emptyInterestsText, { color: theme.darkGrey }]}
              >
                {modalTx.addInterests}
              </Text>
              <Text
                style={[styles.emptyInterestsSub, { color: theme.darkGrey }]}
              >
                {modalTx.addInterestsSub}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Navigation Menu ── */}
        <View style={styles.navigationSection}>
          <View
            style={[
              styles.navigationList,
              { borderRadius: RFPercentage(1.5), overflow: "hidden" },
            ]}
          >
            {navigationsList.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={item.navigation}
                activeOpacity={1}
                style={[
                  styles.navigationItem,
                  {
                    backgroundColor: theme.white,
                    borderBottomColor: theme.border,
                    borderBottomWidth: i === navigationsList.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <View style={styles.navigationContent}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${theme.primary}15` },
                      ]}
                    >
                      <Image
                        style={styles.navigationIcon}
                        source={item.iconSource}
                        tintColor={theme.primary}
                      />
                    </View>
                    <Text
                      style={[styles.navigationTitle, { color: theme.heading }]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={RFPercentage(2.2)}
                    color={theme.darkGrey}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: RFPercentage(4) }} />
      </ScrollView>

      {/* ── Edit Interests Modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Backdrop */}
          <Animated.View
            style={[
              modalStyles.overlay,
              { opacity: modalAnim, backgroundColor: "rgba(0,0,0,0.55)" },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={closeModal}
            />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              modalStyles.sheet,
              {
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={modalStyles.handle} />

            {/* Header */}
            <View style={modalStyles.modalHeader}>
              <View>
                <Text style={modalStyles.modalTitle}>{modalTx.title}</Text>
                <Text style={modalStyles.modalSubtitle}>
                  {modalSelected.size + modalCustom.length}{" "}
                  {modalTx.selectedSuffix}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                style={modalStyles.closeBtn}
              >
                <FontAwesome5
                  name="times"
                  size={RFPercentage(1.6)}
                  color="rgba(255,255,255,0.6)"
                  solid
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={modalStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
             
              <Text style={modalStyles.sectionLabel}>
                {modalTx.categoriesLabel}
              </Text>
              <View style={modalStyles.chipsGrid}>
                {taskOptions.map((item, index) => (
                  <ModalChip
                    key={item.id}
                    item={item} // English obj → icon & color
                    translatedLabel={modalChipLabels[item.name] || item.name} // translated label
                    isSelected={modalSelected.has(item.name)} // English key for selection
                    onPress={() => toggleCategory(item.name)}
                    index={index}
                  />
                ))}
              </View>

              {/* ── Custom Interests ── */}
              <Text
                style={[
                  modalStyles.sectionLabel,
                  { marginTop: RFPercentage(2.5) },
                ]}
              >
                {modalTx.customLabel}
              </Text>

              {modalCustom.length > 0 && (
                <View style={modalStyles.customTagsWrap}>
                  {modalCustom.map((name) => (
                    <CustomTag
                      key={name}
                      name={name}
                      onRemove={() => removeCustom(name)}
                    />
                  ))}
                </View>
              )}

              {/* Input */}
              <View style={modalStyles.inputRow}>
                <View style={modalStyles.inputWrap}>
                  <FontAwesome5
                    name="pencil-alt"
                    size={RFPercentage(1.4)}
                    color="rgba(167,139,250,0.5)"
                    solid
                    style={{ marginLeft: RFPercentage(1.3) }}
                  />
                  <TextInput
                    style={modalStyles.textInput}
                    placeholder={modalTx.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.22)"
                    value={customInput}
                    onChangeText={setCustomInput}
                    onSubmitEditing={addCustom}
                    returnKeyType="done"
                    maxLength={40}
                  />
                </View>
                <TouchableOpacity
                  onPress={addCustom}
                  disabled={!customInput.trim()}
                  style={[
                    modalStyles.addBtn,
                    !customInput.trim() && { opacity: 0.4 },
                  ]}
                >
                  <LinearGradient
                    colors={["#868ca5ff", "#4F46E5"]}
                    style={modalStyles.addBtnGradient}
                  >
                    <FontAwesome5
                      name="arrow-right"
                      size={RFPercentage(1.5)}
                      color="#fff"
                      solid
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={{ height: RFPercentage(12) }} />
            </ScrollView>

            {/* Save Button */}
            <View style={modalStyles.saveContainer}>
              <TouchableOpacity
                onPress={saveInterests}
                disabled={saving}
                activeOpacity={0.9}
                style={{
                  width: "55%",
                  alignSelf: "center",
                  borderRadius: RFPercentage(100),
                }}
              >
                <LinearGradient
                  colors={["#232e7eff", "#1c1662ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={modalStyles.saveBtn}
                >
                  <Text style={modalStyles.saveBtnText} numberOfLines={1}>
                    {saving ? modalTx.savingBtn : modalTx.saveBtn}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1, width: "100%" },
  scrollContent: { paddingBottom: RFPercentage(3) },

  profileCard: {
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageSection: { alignItems: "center", marginBottom: RFPercentage(2) },
  imageContainer: {
    borderWidth: RFPercentage(0.3),
    borderRadius: RFPercentage(10),
    padding: RFPercentage(0.1),
  },
  profileImage: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(6),
  },
  infoSection: { alignItems: "center" },
  userName: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
    textAlign: "center",
  },

  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    marginBottom: RFPercentage(1),
  },
  badgeText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.3),
  },
  tasksCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  tasksCountText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },

  biographySection: { width: "100%", alignItems: "center" },
  biographyText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.1),
    textAlign: "center",
  },
  readMoreButton: { marginTop: RFPercentage(0.5) },
  readMoreText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  addBioButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: RFPercentage(1),
  },
  addBioText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(1),
  },

  // Interests card
  interestsCard: {
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(2.5),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  interestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1.8),
  },
  interestsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.9),
  },
  interestsIconBg: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(0.8),
    justifyContent: "center",
    alignItems: "center",
  },
  interestsTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  editInterestsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(5),
    borderWidth: 1,
  },
  editInterestsBtnText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: RFPercentage(0.9) },
  interestsEmpty: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    opacity: 0.5,
    paddingVertical: RFPercentage(1),
  },
  emptyInterests: {
    alignItems: "center",
    paddingVertical: RFPercentage(2.5),
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  emptyInterestsText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  emptyInterestsSub: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    opacity: 0.6,
  },

  // Nav
  navigationSection: {
    marginTop: RFPercentage(2.5),
    marginHorizontal: RFPercentage(2),
  },
  navigationList: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  navigationItem: {
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2.5),
  },
  navigationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(2),
  },
  navigationIcon: { width: RFPercentage(2), height: RFPercentage(2) },
  navigationTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RFPercentage(10),
    paddingVertical: RFPercentage(0.5),
    paddingLeft: RFPercentage(0.9),
    paddingRight: RFPercentage(1.5),
    gap: RFPercentage(0.6),
  },
  iconWrap: {
    width: RFPercentage(2.8),
    height: RFPercentage(2.8),
    borderRadius: RFPercentage(5),
    justifyContent: "center",
    alignItems: "center",
  },
  text: { fontSize: RFPercentage(1.5), fontFamily: "Poppins_500Medium" },
});

const modalStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "85%",
    backgroundColor: "#0a0a28ff",
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
    overflow: "hidden",
  },
  handle: {
    width: RFPercentage(5),
    height: RFPercentage(0.5),
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: RFPercentage(1),
    alignSelf: "center",
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(0.5),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  modalTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  modalSubtitle: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginTop: RFPercentage(0.2),
  },
  closeBtn: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: RFPercentage(2.5),
    paddingTop: RFPercentage(2),
  },
  sectionLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    marginBottom: RFPercentage(1.5),
    textTransform: "uppercase",
  },
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: RFPercentage(1) },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: RFPercentage(10),
    paddingVertical: RFPercentage(0.6),
    paddingLeft: RFPercentage(0.7),
    paddingRight: RFPercentage(1.4),
    gap: RFPercentage(0.7),
  },
  chipIcon: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(5),
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  checkBadge: {
    width: RFPercentage(1.7),
    height: RFPercentage(1.7),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(0.2),
  },
  customTagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(0.9),
    marginBottom: RFPercentage(1.5),
  },
  customTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RFPercentage(5),
    paddingVertical: RFPercentage(0.6),
    paddingLeft: RFPercentage(1.2),
    paddingRight: RFPercentage(0.7),
    gap: RFPercentage(0.6),
  },
  customTagText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    color: "#fff",
  },
  customTagRemove: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    borderRadius: RFPercentage(1),
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    gap: RFPercentage(1),
    marginTop: RFPercentage(0.5),
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(87,84,93,0.3)",
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  textInput: {
    flex: 1,
    height: RFPercentage(5.2),
    color: "#fff",
    fontSize: RFPercentage(1.55),
    fontFamily: "Poppins_400Regular",
    paddingRight: RFPercentage(1.5),
  },
  addBtn: { },
  addBtnGradient: {
    width: RFPercentage(5.2),
    height: RFPercentage(5.2),
    justifyContent: "center",
    alignItems: "center",
     borderRadius: RFPercentage(1.5),
  },
  saveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: RFPercentage(2.5),
    paddingBottom: Platform.OS === "ios" ? RFPercentage(4) : RFPercentage(2.5),
    paddingTop: RFPercentage(1.5),
    backgroundColor: "rgba(15,12,41,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  saveBtn: {
    width: "100%",
    borderRadius: RFPercentage(100),
    paddingVertical: RFPercentage(1.5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1),
  },
  saveBtnText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
});

export default Profile;
