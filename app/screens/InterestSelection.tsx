import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../firebaseConfig";
import { useAppTheme } from "../contexts/themeContext";
import Toast from "react-native-toast-message";
import Colors from "../config/Colors";
import Feather from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { cachedTranslate } from "../utils/cachedTranslations";

// ─── Data ──────────────────────────────────────────────────────────────────────

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

const translateTaskOptions = async () => {
  const translatedOptions = await Promise.all(
    taskOptions.map(async (item) => ({
      ...item,
      name: await cachedTranslate(item.name),
    })),
  );

  return translatedOptions;
};

// ─── Animated Chip ────────────────────────────────────────────────────────────

const AnimatedChip = ({
  item,
  isSelected,
  onPress,
  index,
  theme,
}: {
  item: any;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  theme: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const selectScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 40,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(selectScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(selectScale, {
        toValue: 1,
        duration: 180,
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
          styles.chip,
          {
            backgroundColor:
              theme.mode === "light"
                ? "rgba(200, 203, 221, 0.47)"
                : "rgba(65, 66, 79, 0.47)",
            borderColor:
              theme.mode === "light"
                ? "rgba(179, 183, 205, 0.47)"
                : "rgba(65, 66, 79, 0.47)",
          },
          isSelected && {
            borderColor: item.color,
            backgroundColor: item.color + "22",
          },
        ]}
      >
        {isSelected && (
          <View
            style={[
              styles.chipSelectedGlow,
              { backgroundColor: item.color + "15" },
            ]}
          />
        )}
        <View
          style={[
            styles.chipIcon,
            { backgroundColor: isSelected ? item.color : item.color + "40" },
          ]}
        >
          <FontAwesome5
            name={item.icon}
            size={RFPercentage(1.8)}
            color={isSelected ? "#fff" : item.color}
            solid
          />
        </View>
        <Text
          style={[
            styles.chipText,
            {
              color:
                theme.mode === "light"
                  ? "rgba(74, 78, 100, 1)"
                  : "rgba(217, 218, 233, 0.47)",
            },
            isSelected && {
              color: item.color,
              fontFamily: "Poppins_600SemiBold",
            },
          ]}
        >
          {item.displayName || item.name}
        </Text>
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: item.color }]}>
            <FontAwesome5
              name="check"
              size={RFPercentage(0.9)}
              color="#fff"
              solid
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Custom Interest Tag ──────────────────────────────────────────────────────

const CustomTag = ({
  name,
  onRemove,
  index,
}: {
  name: string;
  onRemove: () => void;
  index: number;
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
        colors={["#1d277eff", "#342fa0ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.customTag}
      >
        <Text style={styles.customTagText}>{name}</Text>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.customTagRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome5
            name="times"
            size={RFPercentage(1.1)}
            color="rgba(255,255,255,0.8)"
            solid
          />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InterestSelectionScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const totalSelected = selected.size + customInterests.length;
  const MIN_SELECTIONS = 3;

  const { t } = useTranslation();
  const [translatedOptions, setTranslatedOptions] = useState<
    typeof taskOptions
  >([]);

  useEffect(() => {
    const loadTranslatedTasks = async () => {
      const translated = await Promise.all(
        taskOptions.map(async (item) => ({
          ...item,
          displayName: await cachedTranslate(item.name), // new property for display
        })),
      );
      setTranslatedOptions(translated);
    };
    loadTranslatedTasks();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(totalSelected / MIN_SELECTIONS, 1),
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [totalSelected]);

  const toggleInterest = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const addCustomInterest = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    if (customInterests.includes(trimmed) || selected.has(trimmed)) {
      Toast.show({
        type: "error",
        text1: t("interestSelection.alreadyAdded"),
        text2: t("interestSelection.alreadyAddedDesc", { interest: trimmed }),
      });
      return;
    }
    setCustomInterests((prev) => [...prev, trimmed]);
    setInputText("");
  };

  const removeCustom = (name: string) => {
    setCustomInterests((prev) => prev.filter((i) => i !== name));
  };

  const handleSave = async () => {
    if (totalSelected < MIN_SELECTIONS) {
      Toast.show({
        type: "info",
        text1: t("interestSelection.pickAFewMore"),
        text2: t("interestSelection.minSelectionDesc", { min: MIN_SELECTIONS }),
      });
      return;
    }

    setSaving(true);
    try {
      const uid = FIREBASE_AUTH.currentUser?.uid;
      if (!uid) throw new Error("No user");

      const interestsData = {
        selectedCategories: Array.from(selected),
        customInterests,
        allInterests: [...Array.from(selected), ...customInterests],
        updatedAt: serverTimestamp(),
      };

      await setDoc(
        doc(FIREBASE_DB, "users", uid),
        { interests: interestsData },
        { merge: true },
      );

      Toast.show({
        type: "success",
        text1: t("interestSelection.continueCTA"),
        text2: t("interestSelection.personalizeExperience"),
      });

      navigation.replace("TabNavigator");
    } catch (error) {
      console.log("Save interests error:", error);
      Toast.show({
        type: "error",
        text1: t("interestSelection.oops") || "Oops!",
        text2:
          t("interestSelection.failedToSave") ||
          "Failed to save interests. Please try again.",
      });
    }
    setSaving(false);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const isReady = totalSelected >= MIN_SELECTIONS;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={
          theme.mode === "dark"
            ? ["#000000ff", "#201b36ff", "#1b1929ff"]
            : ["#ffffffff", "#dbd7ecff", "#ffffffff"]
        }
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: RFPercentage(2),
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={[
                styles.back,
                {
                  backgroundColor:
                    theme.mode === "light"
                      ? "rgba(163, 165, 188, 0.47)"
                      : "rgba(65, 66, 79, 0.47)",
                },
              ]}
            >
              <Feather
                name="arrow-left"
                color="white"
                size={RFPercentage(2.4)}
              />
            </TouchableOpacity>
            <View style={styles.headerBadge}>
              <FontAwesome5
                name="magic"
                size={RFPercentage(1.4)}
                color="#ffffffff"
                solid
              />
              <Text style={styles.headerBadgeText}>
                {t("interestSelection.personalizeExperience")}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.darkGrey }]}>
            {t("interestSelection.whatAreYouInterested")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.lightGrey }]}>
            {t("interestSelection.pickYourFavorites")}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                {
                  color:
                    theme.mode === "light" ? Colors.primary : Colors.lightGrey,
                },
              ]}
            >
              {totalSelected < MIN_SELECTIONS
                ? t("interestSelection.selectInterestsPrompt")
                : t("interestSelection.selectedInterests", {
                    total: totalSelected,
                  })}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.chipsSection, { opacity: fadeAnim }]}>
          <View style={styles.chipsGrid}>
            {translatedOptions.map((item, index) => (
              <AnimatedChip
                key={item.id}
                item={item}
                isSelected={selected.has(item.name)}
                onPress={() => toggleInterest(item.name)}
                index={index}
                theme={theme}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.customSection,
            {
              opacity: fadeAnim,
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(20, 19, 22, 0.52)"
                  : "rgba(227, 226, 242, 1)",
              borderColor:
                theme.mode === "dark"
                  ? "rgba(20, 19, 22, 0.52)"
                  : "rgba(224, 212, 236, 1)",
            },
          ]}
        >
          <View style={styles.customHeader}>
            <View style={styles.customTitleRow}>
              <LinearGradient
                colors={["#19195dff", "#3c36aeff"]}
                style={styles.customIconBg}
              >
                <FontAwesome5
                  name="plus"
                  size={RFPercentage(1.4)}
                  color="#fff"
                  solid
                />
              </LinearGradient>
              <Text style={[styles.customTitle, { color:theme.mode === "dark" ? Colors.white : theme.primary }]}>
                {t("interestSelection.addCustomInterestTitle")}
              </Text>
            </View>
            <Text style={[styles.customSubtitle, { color: theme.lightGrey }]}>
              {t("interestSelection.addCustomInterestSubtitle")}
            </Text>
          </View>

          {customInterests?.length > 0 && (
            <View style={styles.customTagsWrap}>
              {customInterests.map((name, index) => (
                <CustomTag
                  key={name}
                  name={name}
                  onRemove={() => removeCustom(name)}
                  index={index}
                />
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: theme.black }]}
                placeholder={t("interestSelection.customInterestPlaceholder")}
                placeholderTextColor="rgba(173, 174, 178, 0.94)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={addCustomInterest}
                returnKeyType="done"
                maxLength={40}
              />
            </View>
            <TouchableOpacity
              onPress={addCustomInterest}
              style={[
                styles.addBtn,
                !inputText.trim() && styles.addBtnDisabled,
              ]}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={
                  inputText.trim()
                    ? ["#1e206eff", "#2a267cff"]
                    : ["#9c9cacff", "#9f9fbdff"]
                }
                style={styles.addBtnGradient}
              >
                <FontAwesome5
                  name="arrow-right"
                  size={RFPercentage(1.6)}
                  color={
                    inputText.trim() ? "#fff" : "rgba(255, 255, 255, 0.76)"
                  }
                  solid
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: RFPercentage(14) }} />

        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
            style={{ width: "60%" }}
          >
            <LinearGradient
              colors={
                isReady
                  ? ["#161f59ff", "#221b6eff"]
                  : theme.mode === "dark"
                    ? ["#31314fff", "#2d2d45ff"]
                    : ["#b4b4c6ff", "#bfbfd2ff"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              {saving ? (
                <View style={styles.ctaContent}>
                  <FontAwesome5
                    name="circle-notch"
                    size={RFPercentage(2)}
                    color="#fff"
                  />
                  <Text style={styles.ctaText}>
                    {t("interestSelection.saving")}
                  </Text>
                </View>
              ) : (
                <View style={styles.ctaContent}>
                  <Text
                    style={[
                      styles.ctaText,
                      !isReady && { color: "rgba(255, 255, 255, 0.97)" },
                    ]}
                    numberOfLines={1}
                  >
                    {isReady
                      ? t("interestSelection.continueCTA")
                      : t("interestSelection.selectMoreCTA", {
                          remaining: MIN_SELECTIONS - totalSelected,
                        })}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.replace("TabNavigator")}
            style={styles.skipBtn}
          >
            <Text style={[styles.skipText, { color: theme.grey }]}>
              {t("interestSelection.skipForNow")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? RFPercentage(8) : RFPercentage(9),
    paddingBottom: RFPercentage(8),
  },

  // Decorative orbs
  orb1: {
    position: "absolute",
    width: RFPercentage(40),
    height: RFPercentage(40),
    borderRadius: RFPercentage(20),
    backgroundColor: "#7C3AED",
    opacity: 0.08,
    top: -RFPercentage(10),
    right: -RFPercentage(10),
  },
  orb2: {
    position: "absolute",
    width: RFPercentage(30),
    height: RFPercentage(30),
    borderRadius: RFPercentage(15),
    backgroundColor: "#4F46E5",
    opacity: 0.06,
    bottom: RFPercentage(20),
    left: -RFPercentage(10),
  },
  orb3: {
    position: "absolute",
    width: RFPercentage(20),
    height: RFPercentage(20),
    borderRadius: RFPercentage(10),
    backgroundColor: "#EC4899",
    opacity: 0.05,
    top: RFPercentage(40),
    right: RFPercentage(5),
  },

  // Header
  header: {
    paddingHorizontal: RFPercentage(3),
    marginBottom: RFPercentage(3),
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(5),
    alignSelf: "flex-start",

    gap: RFPercentage(0.7),
    marginLeft: RFPercentage(1),
    top: 5,
  },
  headerBadgeText: {
    color: "#ffffffff",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  title: {
    fontSize: RFPercentage(3.2),
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    lineHeight: RFPercentage(5),
    marginBottom: RFPercentage(1.2),
  },
  subtitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.45)",
    lineHeight: RFPercentage(2.8),
    marginBottom: RFPercentage(2.5),
  },

  // Progress
  progressContainer: {
    gap: RFPercentage(0.8),
  },
  progressTrack: {
    height: RFPercentage(0.5),
    backgroundColor: "rgba(81, 73, 73, 0.08)",
    borderRadius: RFPercentage(1),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.primary,
    // Gradient-like effect
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  progressText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(255,255,255,0.4)",
    marginTop: 5,
  },

  // Chips
  chipsSection: {
    paddingHorizontal: RFPercentage(2.5),
    marginBottom: RFPercentage(3),
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(1.1),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(65, 66, 79, 0.47)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: RFPercentage(10),
    paddingVertical: RFPercentage(0.5),
    paddingLeft: RFPercentage(0.8),
    paddingRight: RFPercentage(1.5),
    gap: RFPercentage(0.8),
    position: "relative",
    overflow: "hidden",
  },
  chipSelectedGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RFPercentage(10),
  },
  chipIcon: {
    width: RFPercentage(3.4),
    height: RFPercentage(3.4),
    borderRadius: RFPercentage(5),
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  checkBadge: {
    width: RFPercentage(1.9),
    height: RFPercentage(1.9),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(0.3),
  },

  // Custom Section
  customSection: {
    marginHorizontal: RFPercentage(2.5),
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(206, 204, 208, 0.52)",
    borderRadius: RFPercentage(2.5),
    padding: RFPercentage(2.5),
    borderBottomWidth: RFPercentage(0.2),
  },
  customHeader: {
    marginBottom: RFPercentage(2),
  },
  customTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
    marginBottom: RFPercentage(0.5),
  },
  customIconBg: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
  },
  customTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  customSubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.35)",
    marginLeft: RFPercentage(4.2),
  },
  customTagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(0.9),
    marginBottom: RFPercentage(2),
  },
  customTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RFPercentage(5),
    paddingVertical: RFPercentage(0.7),
    paddingLeft: RFPercentage(1.4),
    paddingRight: RFPercentage(0.8),
    gap: RFPercentage(0.7),
  },
  customTagText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    color: "#fff",
  },
  customTagRemove: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderRadius: RFPercentage(1.1),
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    gap: RFPercentage(1),
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(161, 159, 165, 0.3)",
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  textInput: {
    flex: 1,
    height: RFPercentage(5.5),
    color: "#fff",
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    paddingHorizontal: RFPercentage(1.5),
  },
  addBtn: {
    borderRadius: RFPercentage(1.5),
    overflow: "hidden",
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnGradient: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(1.5),
  },

  back: {
    // position: "absolute",
    // top: RFPercentage(6),
    // left: RFPercentage(2),
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(72, 70, 70, 0.3)",
  },
  // CTA
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: RFPercentage(3),
    paddingBottom: Platform.OS === "ios" ? RFPercentage(2.5) : RFPercentage(3),
    paddingTop: RFPercentage(2),
    // backgroundColor: "rgba(15,12,41,0.95)",
    // borderTopWidth: 1,
    // borderTopColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    gap: RFPercentage(1),
  },
  ctaButton: {
    width: "100%",
    borderRadius: RFPercentage(100),
    paddingVertical: RFPercentage(1.5),
    alignItems: "center",
    justifyContent: "center",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
  },
  ctaText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  ctaArrow: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipBtn: {
    paddingVertical: RFPercentage(0.5),
  },
  skipText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.3)",
  },
});
