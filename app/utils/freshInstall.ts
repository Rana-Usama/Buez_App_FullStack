import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// iOS Keychain (expo-secure-store) survives app uninstall; AsyncStorage does not.
// On the first launch after a (re)install, wipe Keychain leftovers so a deleted
// app doesn't come back "half logged in" (stale creds, no Firebase session).
const INSTALL_MARKER_KEY = "app_installed_v1";
const STALE_SECURE_KEYS = [
  "email",
  "password",
  "loggedOut",
  "pendingDeepLinkJobId",
];

let cleanupPromise: Promise<void> | null = null;

const runCleanup = async (): Promise<void> => {
  try {
    const marker = await AsyncStorage.getItem(INSTALL_MARKER_KEY);
    if (marker) return;

    if (Platform.OS === "ios") {
      await Promise.all(
        STALE_SECURE_KEYS.map((key) =>
          SecureStore.deleteItemAsync(key).catch(() => undefined),
        ),
      );
    }

    await AsyncStorage.setItem(INSTALL_MARKER_KEY, "1");
  } catch (error) {
    console.warn("[FreshInstall] Cleanup failed:", error);
  }
};

// Memoised: safe to await from multiple callers; runs once per JS session.
export const ensureFreshInstallCleanup = (): Promise<void> => {
  if (!cleanupPromise) cleanupPromise = runCleanup();
  return cleanupPromise;
};
