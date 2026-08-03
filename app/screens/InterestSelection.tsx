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
  Dimensions,
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

const { width } = Dimensions.get("window");

// ─── Data ──────────────────────────────────────────────────────────────────────

const taskOptions = [
  { id: 1, name: "Cleaning", icon: "broom", color: Colors.teal },
  { id: 2, name: "Moving", icon: "truck", color: Colors.red2 },
  { id: 3, name: "Gardening", icon: "seedling", color: Colors.green3 },
  { id: 4, name: "Gaming", icon: "gamepad", color: Colors.indigoLight2 },
  { id: 5, name: "Plumbing", icon: "wrench", color: Colors.blue5 },
  { id: 6, name: "Electrical", icon: "bolt", color: Colors.orange2 },
  { id: 7, name: "Carpentry", icon: "hammer", color: Colors.orange3 },
  { id: 8, name: "Painting", icon: "paint-brush", color: Colors.pink },
  { id: 9, name: "Delivery", icon: "shipping-fast", color: Colors.teal4 },
  { id: 10, name: "Tutoring", icon: "chalkboard-teacher", color: Colors.indigo2 },
  { id: 11, name: "Event Setup", icon: "calendar-alt", color: Colors.red3 },
  { id: 12, name: "Photography", icon: "camera", color: Colors.teal5 },
  { id: 13, name: "Pet Care", icon: "paw", color: Colors.orange4 },
];

// ─── Animated Chip ────────────────────────────────────────────────────────────

const AnimatedChip = ({
  item,
  isSelected,
  onPress,
  index,
  isDark,
}: {
  item: any;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  isDark: boolean;
}) => {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 380,
      delay: index * 35,
      easing: Easing.out(Easing.back(1.3)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, {
        toValue: 0.9,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(pressScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: Animated.multiply(mountAnim, pressScale) }],
        opacity: mountAnim,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          chipStyles.chip,
          {
            backgroundColor: isDark
              ? isSelected
                ? item.color + "1A"
                : "rgba(30,33,58,0.8)"
              : isSelected
                ? item.color + "15"
                : "rgba(240,242,255,0.9)",
            borderColor: isSelected
              ? item.color + "AA"
              : isDark
                ? Colors.primary2Alpha18
                : Colors.primaryAlpha10,
          },
        ]}
      >
        {/* Icon */}
        <LinearGradient
          colors={
            isSelected
              ? [item.color, item.color + "CC"]
              : [item.color + "30", item.color + "18"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={chipStyles.iconBg}
        >
          <FontAwesome5
            name={item.icon}
            size={RFPercentage(1.7)}
            color={isSelected ? Colors.white : item.color}
            solid
          />
        </LinearGradient>

        <Text
          style={[
            chipStyles.label,
            {
              color: isSelected
                ? item.color
                : isDark
                  ? "rgba(180,186,220,0.85)"
                  : Colors.skip,
              fontFamily: isSelected
                ? "Poppins_600SemiBold"
                : "Poppins_400Regular",
            },
          ]}
          numberOfLines={1}
        >
          {item.displayName || item.name}
        </Text>

        {/* Tick badge */}
        {isSelected && (
          <View style={[chipStyles.tick, { backgroundColor: item.color }]}>
            <FontAwesome5
              name="check"
              size={RFPercentage(0.8)}
              color={Colors.white}
              solid
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 100,
    paddingVertical: RFPercentage(0.65),
    paddingLeft: RFPercentage(0.65),
    paddingRight: RFPercentage(1.6),
    gap: RFPercentage(0.75),
  },
  iconBg: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: RFPercentage(1.55),
  },
  tick: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  scrollView: { flex: 1 },
  view: { backgroundColor: Colors.success2 },
  fontAwesome5: { marginLeft: RFPercentage(1.4) },
  view2: { height: RFPercentage(16) },
});

// ─── Custom Tag ───────────────────────────────────────────────────────────────

const CustomTag = ({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
  index: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: anim }], opacity: anim }}>
      <LinearGradient
        colors={[Colors.primary, Colors.success2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tagStyles.tag}
      >
        <Text style={tagStyles.label}>{name}</Text>
        <TouchableOpacity
          onPress={onRemove}
          style={tagStyles.remove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome5
            name="times"
            size={RFPercentage(1.0)}
            color={Colors.categoryBadgeText}
            solid
          />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const tagStyles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingVertical: RFPercentage(0.65),
    paddingLeft: RFPercentage(1.4),
    paddingRight: RFPercentage(0.7),
    gap: RFPercentage(0.6),
  },
  label: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_500Medium",
    color: Colors.white,
  },
  remove: {
    width: RFPercentage(2.1),
    height: RFPercentage(2.1),
    borderRadius: 100,
    backgroundColor: Colors.whiteAlpha18,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Progress Steps ────────────────────────────────────────────────────────────

const ProgressDots = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <View style={dotStyles.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          dotStyles.dot,
          i < current && dotStyles.dotFilled,
          i === current - 1 && dotStyles.dotActive,
        ]}
      />
    ))}
  </View>
);

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary2Alpha20,
  },
  dotFilled: { backgroundColor: Colors.success2 },
  dotActive: { width: 18, backgroundColor: Colors.secondary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InterestSelectionScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const isDark = theme.mode === "dark";

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [saving, setSaving] = useState(false);
  const [translatedOptions, setTranslatedOptions] = useState<
    typeof taskOptions
  >([]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const MIN_SELECTIONS = 3;
  const totalSelected = selected.size + customInterests.length;
  const isReady = totalSelected >= MIN_SELECTIONS;

  // ── Load translated task options 
  useEffect(() => {
    (async () => {
      const translated = await Promise.all(
        taskOptions.map(async (item) => ({
          ...item,
          displayName: await cachedTranslate(item.name),
        })),
      );
      setTranslatedOptions(translated);
    })();
  }, []);

  // ── Mount animations 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 750,
        delay: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Progress bar ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(totalSelected / MIN_SELECTIONS, 1),
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [totalSelected]);

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  // ── Save (Firebase — untouched) ───────────────────────────────────────────
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
          "Failed to save. Please try again.",
      });
    }
    setSaving(false);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── Render 
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ── Subtle top glow strip ── */}
      <LinearGradient
        colors={
          theme.mode === "dark"
            ? [Colors.primaryAlpha90, "transparent"]
            : [Colors.primaryAlpha92, Colors.white]
        }
        style={styles.topGlow}
        pointerEvents="none"
      />

      <ScrollView
        style={chipStyles.scrollView}
        contentContainerStyle={styles.scroll}
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
                    outputRange: [-24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Top row: back + badge */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark
                    ? Colors.primary2Alpha15
                    : Colors.primaryAlpha10,
                },
              ]}
            >
              <Feather
                name="arrow-left"
                size={RFPercentage(2.2)}
                color={Colors.white}
              />
            </TouchableOpacity>

            <View style={styles.badge}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badgeGradient}
              >
                <FontAwesome5
                  name="magic"
                  size={RFPercentage(1.2)}
                  color={Colors.white}
                  solid
                />
                <Text style={styles.badgeText}>
                  {t("interestSelection.personalizeExperience")}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: isDark ? Colors.white4 : Colors.blueDark }]}
          >
            {t("interestSelection.whatAreYouInterested")}
          </Text>

          {/* Gradient underline */}
          <LinearGradient
            colors={[Colors.primary, Colors.secondary, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />

          <Text
            style={[styles.subtitle, { color: isDark ? Colors.blue2 : Colors.desc }]}
          >
            {t("interestSelection.pickYourFavorites")}
          </Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressMeta}>
              <ProgressDots
                current={Math.min(totalSelected, MIN_SELECTIONS)}
                total={MIN_SELECTIONS}
              />
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color: isReady ? Colors.secondary : isDark ? Colors.success2 : Colors.blue21,
                  },
                ]}
              >
                {isReady
                  ? t("interestSelection.selectedInterests", {
                      total: totalSelected,
                    })
                  : t("interestSelection.selectInterestsPrompt")}
              </Text>
            </View>

            {/* Track */}
            <View
              style={[
                styles.track,
                {
                  backgroundColor: isDark
                    ? Colors.primary2Alpha15
                    : Colors.primaryAlpha08,
                },
              ]}
            >
              <Animated.View
                style={{
                  width: progressWidth,
                  height: "100%",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={
                    isReady ? [Colors.primary, Colors.secondary] : [Colors.primary, Colors.success2]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

     
        <Animated.View style={[styles.chipsWrap, { opacity: fadeAnim }]}>
          {/* Section label */}
          <View style={styles.sectionLabelRow}>
            <View
              style={[
                styles.sectionLabelDot,
                {
                  backgroundColor: isDark
                    ? Colors.primary2Alpha40
                    : Colors.primaryAlpha15,
                },
              ]}
            >
              <View
                style={[
                  styles.sectionLabelDotInner,
                  chipStyles.view,
                ]}
              />
            </View>
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? Colors.blue4 : Colors.inputFieldPlaceholder },
              ]}
            >
              CATEGORIES
            </Text>
          </View>

          <View style={styles.chipsGrid}>
            {translatedOptions.map((item, index) => (
              <AnimatedChip
                key={item.id}
                item={item}
                isSelected={selected.has(item.name)}
                onPress={() => toggleInterest(item.name)}
                index={index}
                isDark={isDark}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            paddingHorizontal: RFPercentage(2.5),
            marginBottom: RFPercentage(2),
          }}
        >
          <View
            style={[
              styles.customCard,
              {
                backgroundColor: isDark
                  ? "rgba(11, 13, 24, 1)"
                  : "rgba(255,255,255,0.92)",
                borderColor: isDark
                  ? "rgba(69,87,176,0.22)"
                  : Colors.primaryAlpha12,
              },
            ]}
          >
            {/* Card accent bar */}
            <LinearGradient
              colors={[Colors.primary, Colors.success2, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardBar}
            />

            <View style={styles.customCardBody}>
              {/* Header row */}
              <View style={styles.customCardHeader}>
                <LinearGradient
                  colors={[Colors.primary, Colors.success2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.customIconBg}
                >
                  <FontAwesome5
                    name="plus"
                    size={RFPercentage(1.3)}
                    color={Colors.white}
                    solid
                  />
                </LinearGradient>
                <View style={chipStyles.scrollView}>
                  <Text
                    style={[
                      styles.customCardTitle,
                      { color: isDark ? Colors.blueLight : Colors.blueDark },
                    ]}
                  >
                    {t("interestSelection.addCustomInterestTitle")}
                  </Text>
                  <Text
                    style={[
                      styles.customCardSubtitle,
                      { color: isDark ? Colors.blue4 : Colors.inputFieldPlaceholder },
                    ]}
                  >
                    {t("interestSelection.addCustomInterestSubtitle")}
                  </Text>
                </View>
              </View>

              {/* Custom tags */}
              {customInterests.length > 0 && (
                <View style={styles.tagsWrap}>
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

              {/* Input row */}
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: isDark
                        ? Colors.primaryAlpha12
                        : "rgba(37,50,117,0.05)",
                      borderColor: isDark
                        ? Colors.primary2Alpha25
                        : Colors.primaryAlpha12,
                    },
                  ]}
                >
                  <FontAwesome5
                    name="pen"
                    size={RFPercentage(1.4)}
                    color={isDark ? Colors.success2 : Colors.blue21}
                    solid
                    style={chipStyles.fontAwesome5}
                  />
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      { color: isDark ? Colors.blueLight : Colors.blueDark },
                    ]}
                    placeholder={t(
                      "interestSelection.customInterestPlaceholder",
                    )}
                    placeholderTextColor={isDark ? "#374070" : Colors.inputFieldPlaceholder}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={addCustomInterest}
                    returnKeyType="done"
                    maxLength={40}
                  />
                </View>

                <TouchableOpacity
                  onPress={addCustomInterest}
                  disabled={!inputText.trim()}
                  activeOpacity={0.85}
                  style={styles.addBtn}
                >
                  <LinearGradient
                    colors={
                      inputText.trim()
                        ? [Colors.primary, Colors.success2]
                        : ["#333a61ff", "#60678cff"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.addBtnInner,
                      !inputText.trim() && { opacity: 0.4 },
                    ]}
                  >
                    <FontAwesome5
                      name="arrow-right"
                      size={RFPercentage(1.8)}
                      color={Colors.white}
                      solid
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Spacer for floating CTA */}
        <View style={chipStyles.view2} />
      </ScrollView>

      <View
        style={[
          styles.cta,
          {
            backgroundColor: theme.white,
            borderTopColor: isDark
              ? Colors.primary2Alpha15
              : Colors.primaryAlpha08,
          },
        ]}
      >
        {/* Continue / Select more button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.88}
          style={styles.ctaBtn}
        >
          <LinearGradient
            colors={
              isReady
                ? [Colors.primary, Colors.success2]
                : isDark
                  ? ["#1c1f3a", "#22254a"]
                  : ["#d7dae8ff", "#ecf0ffff"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtnInner}
          >
            {saving ? (
              <>
                <FontAwesome5
                  name="circle-notch"
                  size={RFPercentage(1.9)}
                  color={Colors.white}
                />
                <Text style={styles.ctaBtnText} numberOfLines={1}>
                  {t("interestSelection.saving")}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.ctaBtnText,
                    !isReady && {
                      color: isDark
                        ? Colors.whiteAlpha50
                        : "rgba(37,50,117,0.5)",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {isReady
                    ? t("interestSelection.continueCTA")
                    : t("interestSelection.selectMoreCTA", {
                        remaining: MIN_SELECTIONS - totalSelected,
                      })}
                </Text>
                {isReady && (
                  <View style={styles.ctaArrow}>
                    <Feather
                      name="arrow-right"
                      size={RFPercentage(1.8)}
                      color={Colors.white}
                    />
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => navigation.replace("TabNavigator")}
          activeOpacity={0.7}
          style={styles.skip}
        >
          <Text
            style={[
              styles.skipText,
              { color: isDark ? "#9098b9ff" : Colors.inputFieldPlaceholder },
            ]}
            numberOfLines={1}
          >
            {t("interestSelection.skipForNow")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles 

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Platform.OS === "ios" ? RFPercentage(8) : RFPercentage(9),
    paddingBottom: RFPercentage(15),
  },

  // Background
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RFPercentage(25),
  },

  // Header
  header: {
    paddingHorizontal: RFPercentage(2.5),
    marginBottom: RFPercentage(3.5),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(2.8),
    gap: RFPercentage(1.2),
  },
  backBtn: {
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: 100,
    overflow: "hidden",
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.55),
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.35),
    color: Colors.white,
    letterSpacing: 0.2,
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(3.1),
    lineHeight: RFPercentage(4.4),
    letterSpacing: -0.5,
    marginBottom: RFPercentage(0.8),
  },
  titleUnderline: {
    height: 3,
    width: 56,
    borderRadius: 2,
    marginBottom: RFPercentage(1.4),
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.6),
    marginBottom: RFPercentage(2.5),
  },

  // Progress
  progressSection: { gap: RFPercentage(1.2) },
  progressMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.4),
  },
  track: {
    height: RFPercentage(0.55),
    borderRadius: 4,
    overflow: "hidden",
  },

  // Section label
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.6),
  },
  sectionLabelDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabelDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.1),
    letterSpacing: 2,
  },

  // Chips
  chipsWrap: {
    paddingHorizontal: RFPercentage(2.5),
    marginBottom: RFPercentage(3),
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(1),
  },

  // Custom card
  customCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    // elevation: 8,
  },
  cardBar: { height: 3, width: "100%" },
  customCardBody: { padding: RFPercentage(2.2) },
  customCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: RFPercentage(1.1),
    marginBottom: RFPercentage(1.8),
  },
  customIconBg: {
    width: RFPercentage(3.6),
    height: RFPercentage(3.6),
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  customCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.75),
    marginBottom: 2,
  },
  customCardSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.4),
    lineHeight: RFPercentage(2.2),
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.6),
  },

  // Input
  inputRow: {
    flexDirection: "row",
    gap: RFPercentage(1),
    alignItems: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    gap: RFPercentage(0.8),
    height: RFPercentage(5.8),
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.55),
    paddingRight: RFPercentage(1.4),
    height: "100%",
  },
  addBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // elevation: 6,
  },
  addBtnInner: {
    width: RFPercentage(5.8),
    height: RFPercentage(5.8),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  // Floating CTA
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // paddingHorizontal: RFPercentage(2.5),
    paddingTop: RFPercentage(1.8),
    paddingBottom: Platform.OS === "ios" ? RFPercentage(4) : RFPercentage(2.5),
    borderTopWidth: 1,
    alignItems: "center",
    gap: RFPercentage(0.8),
  },
  ctaBtn: {
    width: "90%",
    borderRadius: RFPercentage(2),
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    // elevation: 10,
    height: RFPercentage(6.4),
  },
  ctaBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(1),
    borderRadius: RFPercentage(2),
    height: RFPercentage(6.4),
  },
  ctaBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.7),
    color: Colors.white,
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: 100,
    backgroundColor: Colors.backBtnBg,
    alignItems: "center",
    justifyContent: "center",
  },
  skip: { paddingVertical: RFPercentage(0.6) },
  skipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
  },
});
