import { AppState, AppStateStatus } from "react-native";

// Captured the instant this module is evaluated -- the earliest point JS can
// measure from. Native process start happens slightly before this and isn't
// visible from JS; for a true native cold-start trace use Android Studio
// Profiler's "App Startup" trace or Xcode Instruments' "App Launch"
// template, or the automatic cold/warm start classification Sentry's RN SDK
// provides once it's integrated (see PERFORMANCE_AUDIT.md, Sections 3 & 5).
const jsLoadTimestamp = Date.now();

let coldStartLogged = false;
let backgroundedAt: number | null = null;

/**
 * Call once, the moment the first real (non-splash) screen is ready to be
 * seen/used. Only the first call after a fresh JS load is treated as the
 * cold-start mark -- later calls are ignored.
 */
export function markFirstScreenReady(): void {
  if (coldStartLogged) return;
  coldStartLogged = true;
  const durationMs = Date.now() - jsLoadTimestamp;
  console.log(`[launch] cold start: JS load -> first screen = ${durationMs}ms`);
}

// Approximates a "warm" re-engagement: time from the app being backgrounded
// to it becoming active again while the JS context stayed alive. This is
// NOT the OS-level "warm start" metric (which also covers Activity/View
// recreation before JS resumes) -- it's a same-process foreground-resume
// timer, useful as a relative trend even before native tooling is wired up.
AppState.addEventListener("change", (nextState: AppStateStatus) => {
  if (nextState === "background" || nextState === "inactive") {
    backgroundedAt = Date.now();
  } else if (nextState === "active" && backgroundedAt !== null) {
    const resumeMs = Date.now() - backgroundedAt;
    console.log(`[launch] warm resume: background -> active = ${resumeMs}ms`);
    backgroundedAt = null;
  }
});
