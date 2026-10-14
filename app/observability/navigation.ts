import * as Sentry from "@sentry/react-native";

import { navigationRef } from "../router/navigationRef";
import { toScreenKey } from "./screens";

let currentScreen: string | undefined;

/** Stable key of the screen the user is on (undefined before navigation is ready). */
export const getCurrentScreen = (): string | undefined => currentScreen;

const trackCurrentRoute = (): void => {
  if (!navigationRef.isReady()) return;

  const next = toScreenKey(navigationRef.getCurrentRoute()?.name);
  if (next === currentScreen) return;

  const previous = currentScreen;
  currentScreen = next;

  // Route params are deliberately never recorded — they carry ids and user data.
  Sentry.addBreadcrumb({
    category: "navigation",
    type: "navigation",
    message: previous ? `${previous} → ${next}` : next,
    data: { from: previous ?? null, to: next },
  });
  Sentry.setTag("screen", next);
};

export const onNavigationReady = (): void => trackCurrentRoute();

export const onNavigationStateChange = (): void => trackCurrentRoute();
