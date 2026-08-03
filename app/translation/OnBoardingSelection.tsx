import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  StatusBar,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import i18n from "./i18n";
import Colors from "../config/Colors";
import { setCurrentLanguage } from "../utils/cachedTranslations";
import { Ionicons } from "@expo/vector-icons";

// ─── Constants ────────────────────────────────────────────────────────────────
const LANGUAGE_SELECTED_KEY = "languageOnboardingDone";
const APP_LANGUAGE_KEY = "appLanguage";

const LANGUAGES = [
  { label: "Swiss German", code: "de-CH", flag: "🇨🇭", nativeLabel: "Schweizerdeutsch" },
  { label: "German",       code: "de-DE", flag: "🇩🇪", nativeLabel: "Deutsch" },
  { label: "French",       code: "fr",    flag: "🇫🇷", nativeLabel: "Français" },
  { label: "Italian",      code: "it",    flag: "🇮🇹", nativeLabel: "Italiano" },
  { label: "Spanish",      code: "es",    flag: "🇪🇸", nativeLabel: "Español" },
  { label: "English",      code: "en",    flag: "🇬🇧", nativeLabel: "English" },
];

// ─── Language Row Item ────────────────────────────────────────────────────────
const LanguageItem = memo(
  ({
    item,
    isSelected,
    onSelect,
  }: {
    item: (typeof LANGUAGES)[0];
    isSelected: boolean;
    onSelect: (code: string) => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.languageRow, isSelected && styles.languageRowSelected]}
      onPress={() => onSelect(item.code)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.languageLabels}>
        <Text
          style={[
            styles.languageLabel,
            isSelected && styles.languageLabelSelected,
          ]}
        >
          {item.label}
        </Text>
        <Text style={styles.nativeLabel}>{item.nativeLabel}</Text>
      </View>
      <View
        style={[
          styles.radioOuter,
          isSelected && styles.radioOuterSelected,
        ]}
      >
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  )
);

// ─── Main Modal Component ─────────────────────────────────────────────────────
const LanguageOnboardingModal = ({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) => {
  const [selected, setSelected] = useState("en");

  const handleSelect = useCallback((code: string) => {
    setSelected(code);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      i18n.changeLanguage(selected);
      setCurrentLanguage(selected);
      await SecureStore.setItemAsync(APP_LANGUAGE_KEY, selected);
      await SecureStore.setItemAsync(LANGUAGE_SELECTED_KEY, "true");
    } catch (e) {
      console.error("Language save error:", e);
    }
    onDone();
  }, [selected, onDone]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof LANGUAGES)[0] }) => (
      <LanguageItem
        item={item}
        isSelected={selected === item.code}
        onSelect={handleSelect}
      />
    ),
    [selected, handleSelect]
  );

  const keyExtractor = useCallback(
    (item: (typeof LANGUAGES)[0]) => item.code,
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.overlayDark}
        translucent
      />
      {/*
        A React Native <Modal> renders in its OWN native window, so it sits
        outside the app's safe-area context — useSafeAreaInsets() there would
        report zeros. Scoping a provider to the modal is the supported way to
        get real insets inside it, and keeps this fix local to this file
        (the app has no root SafeAreaProvider; screens get theirs from
        NavigationContainer, which this modal is mounted outside of).
      */}
      <SafeAreaProvider>
        <LanguageSheet
          selected={selected}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onConfirm={handleConfirm}
        />
      </SafeAreaProvider>
    </Modal>
  );
};

// ─── Sheet body (inside SafeAreaProvider so insets resolve) ───────────────────
const LanguageSheet = ({
  selected,
  renderItem,
  keyExtractor,
  onConfirm,
}: {
  selected: string;
  renderItem: ({ item }: { item: (typeof LANGUAGES)[0] }) => JSX.Element;
  keyExtractor: (item: (typeof LANGUAGES)[0]) => string;
  onConfirm: () => void;
}) => {
  const insets = useSafeAreaInsets();

  // Sit the CTA above the gesture bar / nav bar. targetSdk 35 (Android 15)
  // forces edge-to-edge, so the sheet now draws underneath the system nav
  // area — which is what was clipping the button on Samsung devices. The
  // floor keeps the previous spacing on devices that report no inset (older
  // Android with hardware keys), so nothing regresses.
  const bottomPadding = Math.max(
    insets.bottom + RFPercentage(2),
    Platform.OS === "ios" ? RFPercentage(5) : RFPercentage(3),
  );

  return (
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="language" size={RFPercentage(3)} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Choose Your Language</Text>
            <Text style={styles.subtitle}>
              Select the language you'd like to use in the app.{"\n"}
              You can change this anytime in Settings.
            </Text>
          </View>

          {/* Language list — allowed to shrink and scroll so that on short
              screens the list gives way instead of pushing the CTA off the
              bottom. On normal screens everything still fits and it never
              scrolls, so the layout is visually unchanged. */}
          <FlatList
            data={LANGUAGES}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            extraData={selected}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            bounces={false}
          />

          {/* Confirm button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.confirmButton}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>Continue</Text>
            <Ionicons
              name="arrow-forward"
              size={RFPercentage(2.2)}
              color={Colors.white}
              style={styles.ionicons}
            />
          </TouchableOpacity>
        </View>
      </View>
  );
};

// ─── Hook — use this in your root App component ───────────────────────────────
export const useLanguageOnboarding = () => {
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const done = await SecureStore.getItemAsync(LANGUAGE_SELECTED_KEY);
      if (!done) setShowModal(true);
      setChecked(true);
    };
    check();
  }, []);

  const handleDone = useCallback(() => setShowModal(false), []);

  return { showModal, checked, handleDone };
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    paddingHorizontal: RFPercentage(2.5),
    // paddingBottom is applied at runtime from the safe-area inset so the CTA
    // always clears the gesture bar / navigation bar.
    paddingTop: RFPercentage(1.5),
    // Never taller than the screen: on short devices the list scrolls instead
    // of the sheet growing and pushing the Continue button out of view.
    maxHeight: "92%",
  },
  handle: {
    width: RFPercentage(5),
    height: RFPercentage(0.6),
    backgroundColor: "#E0E0E0",
    borderRadius: RFPercentage(1),
    alignSelf: "center",
    marginBottom: RFPercentage(2),
  },
  header: {
    alignItems: "center",
    marginBottom: RFPercentage(2.5),
  },
  iconWrap: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(3.5),
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  title: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.tabsBackgroundDark,
    marginBottom: RFPercentage(0.8),
  },
  subtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    color: "#888",
    textAlign: "center",
    lineHeight: RFPercentage(2.3),
  },
  list: {
    marginBottom: RFPercentage(2),
    // Lets the list yield space to the CTA when the sheet hits its maxHeight.
    flexShrink: 1,
    flexGrow: 0,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1.5),
    marginBottom: RFPercentage(0.8),
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FAFAFA",
  },
  languageRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  flag: {
    fontSize: RFPercentage(3),
    marginRight: RFPercentage(1.5),
  },
  languageLabels: {
    flex: 1,
  },
  languageLabel: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
    color: Colors.greyDark3,
  },
  languageLabelSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  nativeLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    color: Colors.grey3,
    marginTop: 1,
  },
  radioOuter: {
    width: RFPercentage(2.8),
    height: RFPercentage(2.8),
    borderRadius: RFPercentage(1.4),
    borderWidth: 2,
    borderColor: Colors.greyLight3,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: RFPercentage(1.4),
    height: RFPercentage(1.4),
    borderRadius: RFPercentage(0.7),
    backgroundColor: Colors.primary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: RFPercentage(2),
    height: RFPercentage(6.5),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFPercentage(0.5),
  },
  confirmText: {
    color: Colors.white,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  ionicons: { marginLeft: RFPercentage(1) },
});

export default LanguageOnboardingModal;
