import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as Sentry from "@sentry/react-native";

import { FIREBASE_AUTH } from "../../firebaseConfig";

// Bumped on every explicit identify/clear so a slower async check started
// earlier can't overwrite a newer decision.
let identitySequence = 0;

export const identifyUser = (uid?: string | null): void => {
  identitySequence += 1;
  if (!uid) return;
  Sentry.setUser({ id: uid });
};

/** Call right after a successful login/signup (Firebase is signed in by then). */
export const identifyCurrentUser = (): void => {
  identifyUser(FIREBASE_AUTH.currentUser?.uid);
};

/** Call on logout and account deletion, before navigating away. */
export const clearUserIdentity = (): void => {
  identitySequence += 1;
  Sentry.setUser(null);
};


export const useObservabilityIdentity = (uid?: string | null): void => {
  useEffect(() => {
    const sequenceAtStart = identitySequence;
    let cancelled = false;

    const sync = async () => {
      if (!uid) {
        clearUserIdentity();
        return;
      }
      let loggedOut: string | null = null;
      try {
        loggedOut = await SecureStore.getItemAsync("loggedOut");
      } catch {
        // Unreadable flag — treat as logged in (Firebase has a session).
      }
      if (cancelled || sequenceAtStart !== identitySequence) return;

      if (loggedOut === "true") clearUserIdentity();
      else identifyUser(uid);
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, [uid]);
};
