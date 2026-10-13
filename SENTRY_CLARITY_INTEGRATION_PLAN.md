# Buez — Sentry + Microsoft Clarity Integration Plan

**Status:** plan only. Nothing in the repo has been modified.
**Date:** 2026-09-17
**Scope:** `@sentry/react-native` + `@microsoft/react-native-clarity` for the Buez React Native app.

Legend used throughout:
- **[DOC]** — confirmed from official Sentry / Microsoft documentation or the published npm package itself.
- **[REPO]** — confirmed by reading this repository.
- **[REC]** — my recommendation / judgement call, not documentation.
- **[VERIFY]** — something I could not confirm from here and you must check on your machine or in a dashboard.

---

## 1. Current Buez setup

### 1.1 Core versions [REPO]

| Item | Value |
|---|---|
| React Native | `0.76.9` |
| React | `18.3.1` |
| Expo SDK | `~52.0.46` |
| TypeScript | `^5.3.3` |
| JS engine | Hermes (both platforms) |
| New Architecture | **Enabled** (`app.json → newArchEnabled: true`, `android/gradle.properties → newArchEnabled=true`, `ios/Podfile.properties.json → "newArchEnabled": "true"`) |

### 1.2 Expo / prebuild configuration [REPO]

This is the single most important fact for this integration:

- `ios/` and `android/` **are committed** to the repo.
- But the build command is `npx expo run:ios` / `npx expo run:android`, and **`expo run:*` runs `expo prebuild` first**, which force-syncs native config from `app.json` into the native folders.
- Therefore `app.json` + Expo config plugins are the source of truth for native config, **not** hand edits to `ios/` and `android/`.

Consequence: **any manual native edit you make for Sentry will be silently reverted on the next build.** The Sentry Expo config plugin is not optional here — it is the only durable way to apply the native changes.

### 1.3 iOS setup [REPO]

- Deployment target: **15.1** (`ios/Podfile`)
- `use_frameworks! :linkage => :static` (from `app.json → expo-build-properties → ios.useFrameworks: "static"`)
- Bundle ID `com.adamburg.Buez`, Apple Team `34G27X37J4`
- `expo.version = 1.0.1`, `expo.ios.buildNumber = 4`
- Privacy manifest aggregation enabled (`apple.privacyManifestAggregationEnabled: true`)

### 1.4 Android setup [REPO]

| Item | Value |
|---|---|
| `minSdkVersion` | **24** |
| `compileSdk` / `targetSdk` | 36 (with `android.suppressUnsupportedCompileSdk=36`) |
| Android Gradle Plugin | **8.6** (pinned by RN 0.76.9) |
| Kotlin | `1.9.25` |
| NDK | `26.1.10909125` in `android/build.gradle`; `27.1.12297006` in `app.json` (prebuild writes the app.json value) |
| `minifyEnabled` (release) | **false** (`android.enableProguardInReleaseBuilds` unset) |
| `shrinkResources` | false |
| Gradle JVM | `-Xmx6144m -XX:MaxMetaspaceSize=1024m` |

### 1.5 Navigation structure [REPO]

- **React Navigation v7**, single `NavigationContainer` in `app/router/StackNavigator.tsx` line ~96, already wired with `ref={navigationRef}` from `app/router/navigationRef.ts`.
- `createNativeStackNavigator`, **43 `Stack.Screen` entries**, `initialRouteName="Decider"`.
- `app/router/BottomNavigator.tsx` holds the tab/drawer layer.
- **`expo-router` is installed and registered as a plugin in `app.json`, but it is not the app entry** — `index.js` uses `registerRootComponent(App)` and routing is pure React Navigation. Treat expo-router as dead weight for this work; do not follow Sentry's expo-router docs.

### 1.6 Current analytics / error monitoring [REPO]

**None.** No Sentry, no Crashlytics, no Clarity, no Amplitude, no OpenTelemetry. Specifically:

- No `ErrorBoundary` anywhere in `app/` (grep for `componentDidCatch` returns nothing).
- `LogBox.ignoreAllLogs()` at the top of `App.tsx`.
- A **global `ErrorUtils` handler is already installed** in `App.tsx` (module scope). It logs and then delegates to the previous handler via `_defaultHandler(error, isFatal)`. This matters — see §2.20.
- `app/utils/logger.ts` already exposes `setErrorReporter(reporter)` and its JSDoc literally shows the Sentry wiring. The integration point exists; it has never been connected.
- `app/utils/consoleGuard.ts` + `babel.config.js` strip `console.log/info/debug/...` in release but **deliberately preserve `console.error` and `console.warn`** — done specifically so a crash reporter could hook them later.

### 1.7 App entry points [REPO]

```
index.js
  └─ import './app/utils/consoleGuard'   ← must stay first
  └─ registerRootComponent(App)          ← from ./App.tsx
App.tsx
  └─ ThemeProvider > UserProvider > PostProvider > UnreadMessagesProvider
       > NotificationProvider > ExpoStripeProvider > redux Provider
         > MainApp → <StackNavigator/>  (owns NavigationContainer)
```

### 1.8 Build / release configuration [REPO + memory]

- **Local builds, not EAS.** `npx expo run:ios` → archive → upload via Xcode Organizer. `npx expo run:android` for Android.
- `eas.json` exists but is **dead config** — `appVersionSource: "remote"` and `autoIncrement` never fire because `eas build` is never run. Ignore all EAS-specific Sentry guidance.
- No `expo-updates` / EAS Update → no OTA. A release is exactly one native binary.
- Versions are bumped **only** in `app.json` (`expo.version`, `expo.ios.buildNumber`, `expo.android.versionCode`).

### 1.9 Environment configuration [REPO]

- `.env` at repo root, **gitignored**, consumed via Expo's `EXPO_PUBLIC_*` inlining (Stripe publishable key, FB app id, Google client ids, translation key, etc.).
- `.gitignore` already covers `.env` and `.env*.local`.
- `EXPO_PUBLIC_APP_SECRET` is currently client-bundled — pre-existing issue, unrelated but worth remembering when you decide what may be sent to Sentry.
- **There is no `metro.config.js`.** The project relies on `@expo/metro-config`'s implicit default transformer. Sentry source maps require adding one (see §2.7) — that is a real, if small, change to an area that has so far been untouched.
- `babel.config.js` exists (added 2026-08-31) with `transform-remove-console` gated on `NODE_ENV === "production"`, excluding `error`/`warn`.

### 1.10 Data layer [REPO]

- **Firestore-native, not REST-heavy.** Firebase JS SDK (`firebase@^11.9.1`) for Auth + Firestore across ~49 files; `@react-native-firebase/messaging` for FCM only.
- `axios` used in only 3 files (`app/utils/useLocation.tsx`, `app/utils/currencyChange.tsx`, `app/screens/Location.tsx`) and there is **no shared axios instance** (`axios.create` returns nothing).
- ~18 raw `fetch()` call sites, mostly against `https://buez-server-khaki.vercel.app` (payments, notifications, sharing).

This shapes §2.14: there is no single network chokepoint to instrument. Sentry's automatic HTTP instrumentation will catch the `fetch`/XHR traffic; **Firestore errors will not be network breadcrumbs**, they surface as thrown errors from the service layer.

### 1.11 Native modules that could affect Sentry or Clarity [REPO]

| Module | Relevance |
|---|---|
| `@react-native-firebase/app,auth,messaging` `^23.3.1` | Native Firebase. Coexists with Sentry fine. If Crashlytics is ever added it would fight Sentry for the native crash handler — don't. |
| `@stripe/stripe-react-native` `0.38.6` | Payment sheet is a **native modal**. Clarity will not meaningfully record inside it, and you must not log card data. |
| `react-native-svg` `15.8.0` | **Clarity peer dependency is `>=14.0.0` — satisfied.** [DOC] v13.x is known-broken with Clarity. |
| `react-native-maps` `1.18.0` + Google Maps pod | Heavy native view; Clarity captures it as drawing commands. Watch frame time on map screens. |
| `react-native-webview` `13.12.5` | Used for Instagram/Facebook login. **WebView capture is a Clarity dashboard toggle** — leave it OFF, those are third-party login screens. |
| `expo-image` (SDWebImage pods) | Introduced the first binary pod dependency; a past `pod install` conflict was resolved with `pod update SDWebImage/Core`. Adding Clarity's binary `Clarity` pod under `use_frameworks! :static` is the same class of risk. |
| `react-native-gifted-chat`, `lottie-react-native`, `react-native-keyboard-controller`, `reanimated 3.16.1` | Normal RN views; no known conflict. |
| `patches/expo-localization+15.0.3.patch` via `patch-package` postinstall | **Known broken on a clean install.** Any `npm install` you run for these SDKs will trip the postinstall. See §12. |

---

## 2. Sentry integration plan

### 2.1 Create / configure the Sentry project [DOC]

1. Sign up at sentry.io (Developer plan is free).
2. Create an organization — this becomes `<org-slug>`.
3. Create a project: platform **React Native**, name `buez`. This gives you a **DSN** and `<project-slug>`.
4. Generate an **auth token** under *Settings → Auth Tokens* (or *Organization Settings → Developer Settings*) with `project:releases` and `org:read` scope. This is for source-map / debug-symbol upload at build time only — it is **not** the DSN and must never be bundled into the app.

### 2.2 One project or two? [REC]

**One Sentry project for both platforms.** Sentry tags every event with `os.name`, `device.family` and `dist`, so iOS vs Android is a filter, not a project boundary. Two projects would split your 5k/month error quota, duplicate every alert rule, and make cross-platform regressions invisible. Use a single `buez` project and separate by **environment** (`production` / `development`) instead.

### 2.3 Which package/version for RN 0.76.9 [DOC]

| | Version | Verdict |
|---|---|---|
| Latest | `@sentry/react-native@8.27.0` | **Recommended, if Xcode ≥ 16.4** |
| Previous major | `@sentry/react-native@7.13.0` | Fallback if Xcode < 16.4 |

Published requirements for v8 [DOC]:

- `react-native >= 0.65.0` (package README + `peerDependencies`) → **0.76.9 is fine.**
- `expo >= 49.0.0` (optional peer) → **SDK 52 is fine.**
- iOS **15.0+** → project is 15.1 ✅
- Android Gradle Plugin **7.4.0+** → project is 8.6 ✅
- Kotlin **1.8+** → project is 1.9.25 ✅
- **Xcode 16.4+ required** ⚠️ **[VERIFY]** — run `xcodebuild -version` on your Mac. I cannot check this from here. If you are below 16.4, install `@sentry/react-native@7.13.0` instead; everything else in this plan applies unchanged except the `captureFeedback`/`enableAutoSessionTracking` API names.
- Ships Sentry Android Gradle Plugin 6.0.0 and Sentry JS SDK v10 internally.

### 2.4 Installation [DOC]

```bash
npx expo install @sentry/react-native
```

Use `npx expo install`, not bare `npm install`, so Expo can pin an SDK-52-compatible version. **[REPO note]** `npx expo install` has failed in this repo before on a blocked call to Expo's compat API; if it does, read the pinned version from `node_modules/expo/bundledNativeModules.json` and `npm install @sentry/react-native@<version>` directly.

Do **not** run `npx @sentry/wizard@latest -i reactNative`. The wizard writes manual native changes into `ios/` and `android/`, which `expo prebuild` will revert on your next `expo run:ios`. It also rewrites `metro.config.js` and `App.tsx` in ways you'd have to unpick.

### 2.5 Native iOS setup [DOC]

**Do not hand-edit Xcode.** Add the config plugin to `app.json → expo.plugins`:

```json
[
  "@sentry/react-native/expo",
  {
    "url": "https://sentry.io/",
    "project": "<project-slug>",
    "organization": "<org-slug>"
  }
]
```

At the next `expo prebuild` (i.e. the next `npx expo run:ios`) the plugin:
- rewrites the *Bundle React Native code and images* build phase to call `sentry-xcode.sh`,
- adds a *Upload Debug Symbols to Sentry* run-script phase calling `sentry-xcode-debug-files.sh`,
- wires `ios/sentry.properties`.

**[VERIFY] Two iOS-specific things to confirm after the first prebuild:**

1. **Auth token in Xcode Organizer archives.** Because you archive from the Xcode GUI, the build phase does **not** inherit your shell's `SENTRY_AUTH_TOKEN`. Put `auth.token=<token>` into `ios/sentry.properties` and **add `ios/sentry.properties` to `.gitignore`**, or the archive step will skip the symbol upload silently.
2. **Build-phase ordering conflict.** Sentry documents a known conflict between its Expo plugin and other config plugins that also touch the bundle phase, with an "unstable" workaround involving plugin ordering and `.xcode.env` [DOC]. Put the Sentry plugin **last** in the `plugins` array and check the generated `Buez.xcodeproj` build phases after prebuild.
3. **`use_frameworks! :linkage => :static`** — Sentry's troubleshooting docs do not flag this for RN ≥ 0.75, but this project has already been bitten once by a static-framework pod conflict (SDWebImage). Do a clean `pod install` on the first integration build. **[REC]**

### 2.6 Native Android setup [DOC]

The same config plugin adds `apply from: "../../node_modules/@sentry/react-native/sentry.gradle"` to `android/app/build.gradle` and writes `android/sentry.properties` at prebuild. Nothing to hand-edit.

Two project-specific notes:

- **`minifyEnabled` is false** in release builds, so there is **no ProGuard mapping file to upload**. Android JS stack traces come from source maps; Java/Kotlin frames are already unobfuscated. If you ever turn ProGuard on, you must then enable the Sentry Android Gradle Plugin's mapping upload.
- If you do enable the Sentry Android Gradle Plugin explicitly in `android/build.gradle`, you **must** set `autoInstallation { enabled = false }` — Sentry v8 documents that leaving it on causes version conflicts that can crash the app [DOC]. The Expo plugin's default path avoids this.
- ⚠️ **Known issue on New Architecture:** Sentry documents that with RN's new architecture "you might be missing the Java stack trace" [DOC]. Buez runs New Arch on both platforms. JS errors and iOS native crashes are unaffected; expect degraded Android *native* stack traces. **[REC]** treat Android native crash fidelity as "best effort" and validate it in step 15 of §7 before relying on it.

### 2.7 Metro / source maps [DOC]

Create `metro.config.js` at the repo root:

```js
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
module.exports = getSentryExpoConfig(__dirname);
```

`getSentryExpoConfig` wraps `expo/metro-config`'s `getDefaultConfig`, so it preserves the implicit behaviour the project has relied on until now (including babel-preset-expo and the automatic reanimated plugin). **[REC]** After adding it, run one dev build and one release build and confirm nothing about bundling changed — this file has never existed in this repo, so it is the highest-blast-radius change in the whole plan.

Source maps for Release builds are uploaded automatically by the native build phases [DOC]. With Hermes, the build script handles the Hermes bytecode → JS map composition.

### 2.8 Initialization location [REC]

Sentry must initialise before any application code runs, and `index.js` is the only place earlier than `App.tsx`'s module scope.

```
index.js
  1. import './app/utils/consoleGuard'      ← unchanged, stays first
  2. import './app/observability'            ← NEW: calls Sentry.init() + Clarity.initialize()
  3. registerRootComponent(App)
App.tsx
  export default Sentry.wrap(App);          ← NEW: enables touch tracking + auto instrumentation
```

Proposed new files (none of these exist yet):

```
app/observability/
  index.ts             // orchestrates init order, exported as a side-effect module
  sentry.ts            // Sentry.init + beforeSend scrubbing + tag helpers
  clarity.ts           // Clarity.initialize + screen/tag helpers
  identity.ts          // setUser / setCustomUserId, called from user.context
  navigationTracking.ts// shared onReady/onStateChange handlers
  ErrorBoundary.tsx    // Sentry.ErrorBoundary wrapper with a Buez-styled fallback
```

Keeping all of it under one folder means neither SDK gets imported from screens or services, which matches the project's service-layer rule.

### 2.9 Environment configuration [REC]

The DSN is **not** a secret — it is designed to be shipped in the client. But keep it out of the source tree anyway so staging/prod can diverge:

```
# .env  (already gitignored)
EXPO_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>

# .env.local  (already gitignored by `.env*.local`) — build-time only, NEVER EXPO_PUBLIC_
SENTRY_AUTH_TOKEN=<token>
```

Rule of thumb: anything prefixed `EXPO_PUBLIC_` ends up in the JS bundle. `SENTRY_AUTH_TOKEN` must never carry that prefix.

Environment value: `__DEV__ ? "development" : "production"`. There is no staging build variant in this project [REPO], so two environments is the honest model.

### 2.10 Dev vs production configuration [REC]

| Option | Development | Production |
|---|---|---|
| `enabled` | `false` (or a separate dev DSN) | `true` |
| `environment` | `development` | `production` |
| `debug` | `true` | `false` |
| `tracesSampleRate` | `1.0` | `0.1` |
| `sampleRate` (errors) | `1.0` | `1.0`, drop via `beforeSend` instead |
| `profilesSampleRate` | `0` | `0` |
| `replaysSessionSampleRate` | `0` | `0` (Clarity does this job) |
| `attachStacktrace` | `true` | `true` |
| `sendDefaultPii` | **`false`** | **`false`** |

**[REC] Disable Sentry entirely in `__DEV__`.** With a 5k/month error budget, a week of Metro hot reloads will eat it. Gate on `!__DEV__` and use a local `debug: true` run only when you are specifically testing the integration.

Note Sentry's own docs example sets `sendDefaultPii: true` [DOC]. **Do not copy that.** It attaches IP addresses and request bodies. See §11.

### 2.11 Crash / error tracking coverage [DOC]

Out of the box, after `Sentry.init` + `Sentry.wrap(App)`:

- **Native crashes** — iOS via sentry-cocoa, Android via sentry-java/NDK. Caveat on Android New Arch per §2.6.
- **JavaScript errors** — via `@sentry/browser` internals.
- **Unhandled JS exceptions and unhandled promise rejections** — via `ReactNativeErrorHandlers`.
- **App hangs / ANRs** — iOS app hangs and (since 8.24.0) Android NDK app-hang tracking.
- **Touch events** — from `Sentry.wrap`.
- **Automatic breadcrumbs** — HTTP (`fetch`/XHR), console, app lifecycle, touch.

Not covered automatically, needs work:

- **React render errors** → add `Sentry.ErrorBoundary` (§2.16).
- **Caught errors in the service layer** → wire `logger.ts` (§2.15).
- **Firestore errors** → these are caught promise rejections inside services; they only reach Sentry if you log them via `logger.error`.

### 2.12 Breadcrumbs [REC]

Automatic breadcrumbs are on by default. Add manual ones at the decision points that actually explain a crash in this app:

- auth transitions (`signin_start`, `signin_success`, `signin_failed` — provider name only, never credentials)
- subscription flow (`paywall_viewed`, `stripe_sheet_presented`, `stripe_sheet_result`)
- task lifecycle (`task_posted`, `task_applied`, `task_confirmed`, `task_completed`)
- deep-link handling (`app/job-sharing/useDeepLinking` — link *type*, not the full URL)
- navigation (automatic once React Navigation integration is added)

⚠️ `consoleGuard.ts` + `transform-remove-console` strip `console.log` in release. If you enable Sentry's console breadcrumb integration, **release builds will only ever show `warn` and `error` breadcrumbs** [REPO]. That's a feature, not a bug — but don't be surprised by the asymmetry vs dev.

### 2.13 User identification [REC]

The natural hook is `app/contexts/user.context.tsx`, inside the existing `onAuthStateChanged` effect:

```
onAuthStateChanged → user present  → Sentry.setUser({ id: user.uid })      // UID only
                   → user null     → Sentry.setUser(null)
```

**Send `uid` only.** No email, no displayName, no phone. The Firebase UID is an opaque identifier you can resolve internally; putting `email` in Sentry means every error event is a PII record. See §11.

### 2.14 Useful custom tags / context [REC]

Tags (indexed, searchable, low cardinality):

| Tag | Value | Why |
|---|---|---|
| `is_subscribed` | `true` / `false` | `userData.isSubscribed` — subscription bugs are your highest-value crashes |
| `plan_type` | `userData.planType` | separates founder / monthly / promo cohorts |
| `app_language` | i18next active language | the app is multi-language; layout bugs are language-specific |
| `theme_mode` | `light` / `dark` | theme system is a known source of UI bugs |
| `is_founder` | from `useFounderStatus` | founder-phase users are a distinct code path |
| `clarity_session_url` | see §4 | the cross-tool link |

Context (unindexed structured blobs): current screen name, network reachability (you already track it via NetInfo in `StackNavigator.tsx`), and — for payment errors — Stripe intent **id** only.

**Never a tag:** email, display name, phone, location coordinates, chat content, task descriptions.

### 2.15 Network / API error tracking [REC]

Because there is no shared axios instance and most data is Firestore, take three separate paths:

1. **`fetch`/XHR** → automatic. Sentry's HTTP instrumentation records breadcrumbs and (with tracing on) spans for the ~18 `fetch` sites and the 3 axios files. **[REC]** Configure `tracePropagationTargets` to only `buez-server-khaki.vercel.app` so you don't attach trace headers to Google/Stripe/Firebase requests.
2. **Firestore** → wire `app/utils/logger.ts`'s existing `setErrorReporter` once, at init:
   ```
   setErrorReporter((error, context) => Sentry.captureException(error, { extra: context }));
   ```
   Then the service layer reaches Sentry by using `logger.error(...)` instead of `console.log`. This is already the documented intent of that file [REPO] — the hook exists and is unconnected.
3. **Stripe** → wrap the payment-sheet calls in `app/services/Subscription.service.tsx` with explicit `Sentry.captureException` plus a `payment_step` tag. Never capture the response body.

**[REC] Migration note, not part of this task:** the service layer still uses raw `console.log("Failed to ...", error)` in places (e.g. `updateSubscriptionStatus`). Those are stripped in release and will never reach Sentry. Converting them to `logger.error` is a separate, mechanical follow-up.

### 2.16 React error boundary [REC]

Add `Sentry.ErrorBoundary` immediately inside `ThemeProvider` in `App.tsx` (so the fallback UI can be themed) and outside every other provider, with a fallback that renders a "Something went wrong" screen using the existing theme tokens and a reload action. Today a render error in any of 43 screens white-screens the app with no report.

### 2.17 Performance monitoring / tracing [REC]

Worth turning on, at low sample rate:

- **App start (cold/warm)** — automatic, and you already instrument this manually in `app/utils/launchMetrics.ts`. Sentry will give you the same signal with device/OS breakdown. **[REC]** Keep `launchMetrics.ts`; cross-check the two for a release or two.
- **Slow/frozen frames** — automatic, and directly relevant to the known un-virtualised `.map()`-in-`ScrollView` lists in `MyRequests.tsx` and `AcceptedTasks.tsx`.
- **Navigation transactions** — requires `Sentry.reactNavigationIntegration()` wired to the existing `navigationRef` in `StackNavigator.tsx`.
- **Time-to-initial-display / time-to-full-display** — optional, useful on `Home` and `MyRequests`.

**Skip profiling** (`profilesSampleRate: 0`). It is not usefully covered by the free plan and adds startup cost.

`tracesSampleRate: 0.1` in production. The free plan gives 5M spans/month [DOC], which sounds enormous but a single navigation-heavy session generates hundreds of spans.

### 2.18 Release / version tracking [REC]

No `expo-updates` in this project, so a release is exactly one binary. Sentry auto-derives:

```
release = com.adamburg.Buez@1.0.1+4
dist    = 4
```

from the native bundle version. **Do not set these manually** — and keep bumping versions **only in `app.json`**, because `expo prebuild` overwrites `Info.plist`/`build.gradle` from it on every `expo run:*`.

**[REC]** Because `android/app/build.gradle` currently has `versionCode 7` / `versionName "2.0"` hardcoded while `app.json` says `1.0.1`, confirm after your next prebuild which one wins — a mismatch means iOS and Android report different releases to Sentry for the same code.

### 2.19 Source maps and native symbolication [DOC]

| Artefact | How it gets uploaded |
|---|---|
| JS source maps (Hermes) | Xcode *Bundle React Native code and images* phase (rewritten by the plugin) / Gradle `sentry.gradle` |
| iOS dSYMs | *Upload Debug Symbols to Sentry* run-script phase |
| Android native (NDK) symbols | Sentry Android Gradle Plugin, if enabled |
| ProGuard mapping | N/A — `minifyEnabled=false` |

The auth token must be resolvable at build time in **both** environments: your terminal (`npx expo run:ios`) *and* Xcode Organizer archives. That's why `ios/sentry.properties` with an inline `auth.token` is the practical answer here, and why it must be gitignored.

**Verification:** after a release build, the Sentry release page should list "Source Maps: uploaded" and the dSYM count. If it says 0, the archive step didn't see the token.

### 2.20 Interaction with the existing global error handler [REPO + REC]

`App.tsx` installs a global `ErrorUtils` handler at module scope. Sentry's `ReactNativeErrorHandlers` integration installs one too, at `Sentry.init` time in `index.js` — i.e. **earlier**. So the existing handler will capture Sentry's handler as `_defaultHandler` and delegate to it.

**This works, but only because it calls `_defaultHandler(error, isFatal)`. Do not remove that call.** If you drop the delegation, every unhandled JS error stops reaching Sentry and you will believe the app is crash-free.

**[REC]** Once Sentry is proven, simplify: delete the hand-rolled handler and let Sentry own it.

### 2.21 How to verify errors are reaching Sentry [DOC + REC]

1. **JS error:** add a temporary debug-only button calling `Sentry.captureException(new Error("Buez Sentry smoke test"))`, then `throw new Error(...)` from a render to test the error boundary.
2. **Unhandled rejection:** `Promise.reject(new Error("unhandled test"))` with no catch.
3. **Native crash:** `Sentry.nativeCrash()`. ⚠️ **Native crashes are only reported on the *next* app launch** — kill and relaunch the app before checking the dashboard.
4. **Source maps:** confirm the stack trace in Sentry shows your TypeScript file names and line numbers, not `index.android.bundle:1:284910`.
5. **Release/dist:** confirm the event is tagged `com.adamburg.Buez@1.0.1+4`.
6. Remove all test triggers before shipping.

Run the whole list on a **release build**, not just debug — source maps and symbol upload only happen in Release.

### 2.22 Recommended production configuration [REC]

```
enabled:                   !__DEV__
environment:               __DEV__ ? "development" : "production"
debug:                     false
tracesSampleRate:          0.1
profilesSampleRate:        0
replaysSessionSampleRate:  0
replaysOnErrorSampleRate:  0
sendDefaultPii:            false
attachStacktrace:          true
maxBreadcrumbs:            50
enableAutoSessionTracking: true
tracePropagationTargets:   ["buez-server-khaki.vercel.app"]
ignoreErrors:              [ "Network request failed",
                             "AbortError",
                             /Firebase: Error \(auth\/network-request-failed\)/,
                             "Non-Error promise rejection captured" ]
beforeSend:                scrubbing function (see §11)
beforeBreadcrumb:          drop breadcrumbs whose URL contains a token/key query param
```

Rationale for `replaysSessionSampleRate: 0`: the free plan allows **50 replays/month** [DOC], which is statistically useless, and Clarity is being added specifically to cover session replay. Paying the bundle size and frame cost for both is waste.

### 2.23 What must NOT be sent to Sentry [REC — treat as a hard rule]

| Never | Where it would leak from |
|---|---|
| Passwords, `currentPassword` | `Auth.service.tsx` (`updatePassword`, `deleteCurrentUser`) |
| Firebase ID tokens / refresh tokens | auth errors, request headers |
| `EXPO_PUBLIC_APP_SECRET`, `EXPO_PUBLIC_TRANSLATION_KEY`, Google/FB client ids | env-derived values in error context |
| `STRIPE_SECRET_KEY` | must never be client-side at all |
| Card numbers, CVV, full Stripe payloads | `Subscription.service.tsx`, `UpgradePlan.tsx` |
| Email, display name, phone | `user.context`, `EditProfile` |
| Precise coordinates from `useLocation` | location error contexts |
| Chat message bodies | `Chat.tsx`, `GroupChat.tsx`, `Chat.service.tsx` |
| Free-text task descriptions | `PostRequest.tsx` |
| IP address | suppressed by `sendDefaultPii: false` |

Enforce with a `beforeSend` that walks `event.request`, `event.extra`, `event.contexts` and redacts any key matching `/pass|token|secret|auth|key|card|cvv|email|phone/i`. Assume the deny-list will be incomplete and prefer never putting the value in the event in the first place.

### 2.24 Sentry free plan — what you get and where it bites [DOC]

| Quota (Developer / free) | Amount |
|---|---|
| Errors | **5,000 / month** |
| Tracing spans | 5,000,000 / month |
| Session replays | 50 / month |
| Logs | 5 GB / month |
| Attachments | 1 GB / month |
| Cron monitors | 1 |
| Seats | **1 user** |
| Data retention | **30 days** |
| Custom dashboards | 10 |

Team plan is $26/mo for 50k errors and unlimited users.

**The two that will actually hurt:**

1. **5k errors/month with one seat.** A single repeating error on a popular screen can burn the whole month's quota in a day, after which you are blind. Mitigate with `ignoreErrors`, `beforeSend` dedupe, and a **spike-protection / rate-limit rule configured in the Sentry project settings** on day one.
2. **One user.** You cannot invite a teammate. If anyone else needs access you are on Team.

30-day retention also means "what changed since last quarter" questions are unanswerable on free.

---

## 3. Microsoft Clarity integration plan

### 3.1 Create the Clarity project [DOC]

1. Sign in at clarity.microsoft.com.
2. Create a new project, **type: Mobile app / Android + iOS**.
3. Copy the **Project ID** from *Settings*. Same project ID serves both platforms — Clarity mobile has no per-platform project split.

### 3.2 React Native package — important [DOC]

Two packages exist on npm and they are **the same code**:

| Package | Version | Use it? |
|---|---|---|
| `react-native-clarity` | 4.9.0 | ❌ Its own README says: *"This package is on the path to deprecation. Please use `@microsoft/react-native-clarity` instead for new projects or future updates."* |
| `@microsoft/react-native-clarity` | **4.9.0** | ✅ **Use this one.** |

### 3.3 Compatibility with the current Buez setup [DOC + REPO]

| Requirement | Clarity | Buez | Verdict |
|---|---|---|---|
| React Native | `>= 0.64` | 0.76.9 | ✅ |
| `react-native-svg` | `>= 14.0.0` (peer) | 15.8.0 | ✅ |
| Android Gradle Plugin (plugin's own buildscript) | 8.6.1 | 8.6 | ✅ |
| Kotlin | reads `rootProject.ext.kotlinVersion` | 1.9.25 declared in `android/build.gradle` ext | ✅ |
| Java | 17 | RN 0.76 toolchain is 17 | ✅ |
| iOS podspec platform | `ios 13.0`, depends on binary pod `Clarity 4.1.0` | target 15.1 | ✅ builds |
| Expo Go | not supported | not used (native builds) | ✅ irrelevant |
| New Architecture | plugin has new-arch codepaths (`RCT_NEW_ARCH_ENABLED` flag, `com.facebook.react` plugin applied when `newArchEnabled`) | New Arch on | ⚠️ **[VERIFY]** builds, but validate recording fidelity — see §3.14 |

⚠️ **The real compatibility gap is device coverage, not build compatibility** [DOC]:

| | Clarity supported range | Buez minimum | Gap |
|---|---|---|---|
| Android | **API 29 – 36** | `minSdk 24` | **Android 7.0–9.0 (API 24–28) users produce no recordings** |
| iOS | **16 – 26** | deployment target **15.1** | **iOS 15 users produce no recordings** |

The app will still run normally on those devices — Clarity just won't capture. But your Clarity data is a **biased sample that excludes older/cheaper Android hardware**, which is exactly where most performance and layout problems live. Know this before drawing conclusions from it.

### 3.4 Installation [DOC]

```bash
npm install @microsoft/react-native-clarity
cd ios && pod install
```

No Expo config plugin exists and none is needed — the package is picked up by autolinking, so `expo prebuild` handles it. This is the opposite of Sentry: **Clarity requires zero native configuration.**

### 3.5 iOS setup [DOC]

Nothing beyond `pod install`. **[REC]** The one thing to watch: the podspec pulls the binary `Clarity` pod `4.1.0` under this project's `use_frameworks! :linkage => :static`. Do a clean `pod install` (`rm -rf ios/Pods ios/Podfile.lock` first) on the integration build; this repo has already hit one static-framework pod conflict with SDWebImage.

### 3.6 Android setup [DOC]

Nothing. The plugin's `build.gradle` reads `compileSdkVersion` / `minSdkVersion` / `targetSdkVersion` / `kotlinVersion` from `rootProject.ext`, all of which `android/build.gradle` already defines.

### 3.7 Initialization and where it goes [DOC + REC]

Clarity's own docs show initialization inside `NavigationContainer`'s `onReady`, because screen-name tracking needs the navigation ref [DOC]. **[REC]** Split it:

- **`Clarity.initialize(projectId, { logLevel })`** → in `app/observability/index.ts`, called from `index.js`, so recording starts at process launch and you capture the splash/auth path.
- **`Clarity.setCurrentScreenName(...)`** → in `StackNavigator.tsx` via `NavigationContainer`'s `onReady` + `onStateChange`, using the **existing `navigationRef`**. No new ref needed.

Note `initialize` is **asynchronous** — it returns before Clarity is ready. Anything that must land on the session (user id, tags) goes inside `setOnSessionStartedCallback`, not straight after `initialize` [DOC].

### 3.8 Session recordings, heatmaps, interactions [DOC]

All automatic once initialized. Mobile Clarity supports:
- session recordings (reconstructed from low-level drawing commands, not video)
- heatmaps
- interaction insights: taps, double taps, **rage taps, dead taps**
- funnels and smart events

No code needed for any of it. Rage taps on `MyRequests` / `AcceptedTasks` would be a direct, independent confirmation of the un-virtualised list problem already flagged in the performance audit.

### 3.9 Screen / page tracking [DOC]

```
NavigationContainer
  onReady        → Clarity.setCurrentScreenName(navigationRef.getCurrentRoute().name)
  onStateChange  → if route changed, Clarity.setCurrentScreenName(newName)
```

Clarity starts a new "page" each time the screen name changes [DOC]. With 43 stack screens plus the tab layer, this turns Clarity's funnel/heatmap views from "UIViewController" soup into real screen names. **[REC]** This is mandatory, not optional — without it the data is close to unusable.

### 3.10 Custom events [DOC]

`Clarity.sendCustomEvent(name)` — name only, max 254 chars, no payload. Mirror the Sentry breadcrumb list so the two tools tell the same story:

`signin_success`, `onboarding_language_selected`, `interests_selected`, `task_posted`, `task_applied`, `task_confirmed`, `task_completed`, `review_submitted`, `chat_opened`, `paywall_viewed`, `subscription_started`, `subscription_cancelled`, `founder_intro_viewed`, `deep_link_opened`.

Because there is no payload, **encode nothing variable in the name** — `paywall_viewed` not `paywall_viewed_user_abc`.

### 3.11 User / session identification [DOC]

```
Clarity.setOnSessionStartedCallback(sessionId => {
  Clarity.setCustomUserId(firebaseUid);   // 1–255 chars
  Clarity.setCustomTag("is_subscribed", String(isSubscribed));
  ...
});
```

Set identity inside the callback, not after `initialize`, or it may attach to the wrong session [DOC]. Microsoft explicitly recommends **not** putting PII in `customUserId` [DOC] — so, again, **Firebase UID only**.

Call `Clarity.startNewSession()` on logout so the next user's activity isn't stitched onto the previous user's session.

### 3.12 Custom tags [DOC]

`setCustomTag(key, value)` / `setCustomTags(key, values[])`, both strings, ≤255 chars, dashboard-filterable. Use the same set as the Sentry tags in §2.14 (`is_subscribed`, `plan_type`, `app_language`, `theme_mode`, `is_founder`) plus `sentry_release`.

### 3.13 Which Buez screens and actions matter most [REC]

| Priority | Screen / flow | What you're looking for |
|---|---|---|
| P0 | `SubscriptionV2` → `UpgradePlan` → Stripe sheet | where paying users drop out; the paywall is the revenue path |
| P0 | `Login` / `Signup` / `OTPInput` / `EmailVerificationScreen` | auth funnel drop-off across Google / Apple / email |
| P0 | `PostRequest` | the core creation action — abandonment here is lost supply |
| P1 | `MyRequests`, `AcceptedTasks` | rage/dead taps on the two un-virtualised lists |
| P1 | `Home` | nested-FlatList-in-ScrollView scroll friction |
| P1 | `TaskApplicantsScreen` → `ConfirmedHelpers` | the matching flow |
| P2 | `Onboarding`, `InterestSelection`, language onboarding modal | first-run completion rate |
| P2 | `FounderIntro` | founder-phase conversion |
| — | `Chat`, `GroupChat` | **[REC] treat as sensitive — see §11** |

### 3.14 Privacy / masking — read this carefully [DOC]

This is the biggest functional caveat in the Clarity half of the plan.

- **The React Native SDK exposes no masking API.** I read the published `@microsoft/react-native-clarity@4.9.0` type definitions: the full surface is `initialize`, `pause`, `resume`, `isPaused`, `startNewSession`, `setCustomUserId`, `setCustomSessionId`, `setCustomTag`, `setCustomTags`, `sendCustomEvent`, `setOnSessionStartedCallback`, `setCurrentScreenName`, `getCurrentSessionId` (deprecated), `getCurrentSessionUrl`, `consent`. **There is no `maskView` / `unmaskView`.** The native Android SDK has them; React Native does not surface them.
- **`ClarityConfig` only has `userId` (deprecated) and `logLevel`.** Everything else moved to the dashboard in Clarity 3.0+ [DOC]: masking level, WebView capture, allowed/disallowed screens, network limits, low-end-device disabling.
- **So all masking decisions for Buez are made in the Clarity dashboard, not in code.** **[VERIFY]** Configure these before the first production build, and confirm the exact option names in your dashboard since I could not reach the masking doc page.

**[REC] Masking policy for Buez:**

| Setting | Value | Why |
|---|---|---|
| Masking level | **Strictest available (mask all text)** | the app carries chat, emails, addresses, free-text task descriptions |
| WebView capture | **OFF** | `InstagramLogin.tsx` / `facebookLogin.tsx` are third-party credential screens |
| Disallowed screens | `Chat`, `GroupChat`, `Login`, `Signup`, `SetNewPassword`, `ChangePassword`, `OTPInput`, `EditProfile`, `UpgradePlan` | private messages, credentials, payment |
| Disable on low-end devices | **ON** | Buez already has known frame-time issues; don't add 3–5% P95 frame cost on weak hardware |

Because you cannot mask a single `TextInput` from code, **screen-level exclusion is your only tool.** Design around that: if a screen has anything sensitive on it, exclude the whole screen.

Also: `Clarity.consent(adsStorage, analyticsStorage)` exists and **you are responsible for collecting consent yourself** [DOC]. If Buez has EU users, wire consent to a banner and default to not capturing until it's given. `Clarity.pause()` / `resume()` give you the runtime switch.

### 3.15 Verifying recordings arrive [DOC]

1. Set `logLevel: Clarity.LogLevel.Verbose` on the first build and read logcat / Xcode console for initialization errors.
2. Confirm the device is on a supported OS (Android 29+ / iOS 16+) — this is the #1 cause of "nothing shows up".
3. Use **Clarity real-time recordings** to see the in-progress session immediately.
4. Completed sessions take **~2 hours** to appear in the dashboard [DOC]. Don't conclude it's broken at the 20-minute mark.
5. Check the custom user id, tags and screen names are populated, not just that a session exists.
6. Drop `logLevel` to `None` (the default) before shipping.

### 3.16 Mobile / React Native limitations [DOC]

- Notifications, system navigation bars and the **keyboard** are not captured.
- iOS keyboard extensions unsupported.
- **iOS has no offline buffering** — sessions recorded without network are lost. Android buffers and uploads periodically.
- Feature parity varies by SDK and is still moving.
- No per-view masking from React Native (§3.14).
- Performance cost [DOC]: init 1–2 ms, **P95 frame time +3–5%**, ~10 KiB/s of recording bandwidth, binary size **+400 KB Android / +900 KB iOS**.
- Native code → requires a new build; nothing works in Expo Go.

### 3.17 Pricing [DOC]

Microsoft Clarity is **free**, with no paid tier — that's the whole product positioning. The pricing page states no traffic, session or project caps. **[VERIFY]** Confirm any fair-use limit in your project's dashboard; historically Clarity has applied sampling on very high-traffic projects rather than charging.

The real cost of Clarity is not money — it's the ~900 KB iOS binary, the 3–5% P95 frame cost, and the privacy surface.

---

## 4. Using Sentry + Clarity together

### 4.1 Division of responsibility [REC]

| | Sentry | Clarity |
|---|---|---|
| Native crashes | ✅ owner | ❌ |
| JS exceptions / unhandled rejections | ✅ owner | ❌ |
| API & Firestore errors | ✅ owner | ❌ |
| Performance traces, slow/frozen frames, app start | ✅ owner | partial (frame data only) |
| Release health / crash-free rate | ✅ owner | ❌ |
| Session replay | ⛔ **deliberately off** (50/mo) | ✅ owner |
| Taps, rage taps, dead taps | touch breadcrumbs only | ✅ owner |
| Heatmaps | ❌ | ✅ owner |
| Funnels / drop-off | ❌ | ✅ owner |
| "What was the user doing?" | breadcrumbs | ✅ owner |

One rule: **Sentry answers "what broke and why", Clarity answers "what was the user doing when it broke".** Don't duplicate — that's why replay stays off in Sentry.

### 4.2 Correlating the two without leaking PII [REC]

Two links, both using opaque identifiers only:

**Clarity → Sentry (the useful direction).** Clarity exposes `getCurrentSessionUrl()` [DOC]. Inside `setOnSessionStartedCallback`, push it onto the Sentry scope:

```
Clarity.setOnSessionStartedCallback(async () => {
  const url = await Clarity.getCurrentSessionUrl();
  if (url) Sentry.setTag("clarity_session_url", url);
});
```

Now every Sentry event carries a one-click link to the replay of the session that produced it. This is the single highest-value thing in this whole document.

**Sentry → Clarity.** Tag Clarity sessions with the release so you can filter Clarity by build:

```
Clarity.setCustomTag("sentry_release", `${bundleId}@${version}+${build}`);
```

**The shared key is the Firebase UID** — `Sentry.setUser({ id: uid })` and `Clarity.setCustomUserId(uid)`. Opaque on both sides, resolvable only against your own Firestore. No email, no name, ever, in either tool.

⚠️ **The Clarity session URL is itself a capability.** Anyone with the Sentry event can open the replay. That is exactly why §3.14's screen-exclusion list matters: the replay must be safe for anyone with Sentry access to watch.

---

## 5. Recommended Buez implementation architecture

### 5.1 Runtime flow

```
index.js
 ├─ import './app/utils/consoleGuard'              (unchanged, stays first)
 ├─ import './app/observability'
 │    ├─ Sentry.init({ ...config })                 ← errors captured from here on
 │    ├─ logger.setErrorReporter(Sentry.captureException adapter)
 │    ├─ Clarity.initialize(projectId, { logLevel })
 │    └─ Clarity.setOnSessionStartedCallback(async () => {
 │           const url = await Clarity.getCurrentSessionUrl();
 │           Sentry.setTag("clarity_session_url", url);
 │           Clarity.setCustomTag("sentry_release", release);
 │       })
 └─ registerRootComponent(App)                      // App is Sentry.wrap()'d

App.tsx
 └─ ThemeProvider
     └─ Sentry.ErrorBoundary  ← NEW
         └─ UserProvider
              └─ onAuthStateChanged:
                   user   → Sentry.setUser({ id: uid })
                            Clarity.setCustomUserId(uid)
                            both: setTag is_subscribed / plan_type / is_founder
                   logout → Sentry.setUser(null)
                            Clarity.startNewSession()
              └─ ... existing providers ...
                   └─ MainApp → StackNavigator

StackNavigator.tsx  (NavigationContainer, existing navigationRef)
 ├─ onReady       → sentryNavigationIntegration.registerNavigationContainer(navigationRef)
 │                  Clarity.setCurrentScreenName(currentRoute)
 └─ onStateChange → Sentry navigation transaction
                    Clarity.setCurrentScreenName(newRoute)
                    Sentry.addBreadcrumb({ category: "navigation" })

Runtime
 ├─ Firestore / fetch / Stripe error → logger.error → Sentry.captureException
 ├─ user taps / scrolls / rages      → Clarity (automatic)
 └─ funnel milestones                → Clarity.sendCustomEvent + Sentry breadcrumb
```

### 5.2 Where each piece lives in the existing structure

| Concern | File | New or existing |
|---|---|---|
| SDK init orchestration | `app/observability/index.ts` | **new** |
| Sentry config + scrubbing | `app/observability/sentry.ts` | **new** |
| Clarity config + helpers | `app/observability/clarity.ts` | **new** |
| Identity (uid + tags, both SDKs) | `app/observability/identity.ts` | **new** |
| Navigation/screen tracking | `app/observability/navigationTracking.ts` | **new** |
| Error boundary + themed fallback | `app/observability/ErrorBoundary.tsx` | **new** |
| Wiring the error reporter | `app/utils/logger.ts` | existing — **no structural change**, the hook is already there |
| Init call site | `index.js` | existing — 1 import line |
| `Sentry.wrap` + boundary mount | `App.tsx` | existing — 2 small edits |
| Screen tracking hook-up | `app/router/StackNavigator.tsx` | existing — 2 props on `NavigationContainer` |
| Identify on auth | `app/contexts/user.context.tsx` | existing — inside the existing `onAuthStateChanged` effect |

This keeps the project's rule that third-party SDKs never get imported from screens. Only `app/observability/*` imports `@sentry/react-native` or `@microsoft/react-native-clarity`; everything else goes through `logger.ts` or thin helpers.

---

## 6. Exact files that will change, and exact packages

### 6.1 Files to be modified (7)

| File | Change |
|---|---|
| `package.json` | +2 dependencies |
| `app.json` | add `@sentry/react-native/expo` to `expo.plugins` (last in the array) |
| `index.js` | +1 import of `./app/observability` |
| `App.tsx` | `export default Sentry.wrap(App)`; mount `ErrorBoundary`; keep the `_defaultHandler` delegation |
| `app/router/StackNavigator.tsx` | `onReady` + `onStateChange` on the existing `NavigationContainer` |
| `app/contexts/user.context.tsx` | identify/clear user inside the existing `onAuthStateChanged` effect |
| `.gitignore` | add `ios/sentry.properties`, `android/sentry.properties` |

### 6.2 Files to be created (8)

```
metro.config.js                           ← getSentryExpoConfig
.env.local                                ← SENTRY_AUTH_TOKEN (gitignored already)
app/observability/index.ts
app/observability/sentry.ts
app/observability/clarity.ts
app/observability/identity.ts
app/observability/navigationTracking.ts
app/observability/ErrorBoundary.tsx
```

### 6.3 Files written by tooling, not by hand

```
ios/sentry.properties        ← config plugin at prebuild (add auth.token, gitignore it)
android/sentry.properties    ← config plugin at prebuild
ios/Buez.xcodeproj           ← build phases rewritten at prebuild
android/app/build.gradle     ← sentry.gradle apply line at prebuild
ios/Podfile.lock             ← pod install (Sentry + Clarity pods)
```

### 6.4 Files explicitly NOT to touch

`babel.config.js`, `app/utils/consoleGuard.ts`, `firebaseConfig.js`, anything under `patches/`, and any file inside `ios/` or `android/` by hand.

### 6.5 Packages to install

```bash
npx expo install @sentry/react-native          # 8.27.0, or 7.13.0 if Xcode < 16.4
npm install @microsoft/react-native-clarity    # 4.9.0
cd ios && pod install
```

Two packages. No `@sentry/wizard`, no `sentry-expo` (deprecated), no `react-native-clarity` (deprecated).

---

## 7. Step-by-step implementation order

Adjusted for this project's local-build, prebuild-on-every-run reality.

**Phase 0 — gates (do first, they can change the plan)**
1. **[VERIFY]** Run `xcodebuild -version`. ≥16.4 → Sentry v8. <16.4 → Sentry v7.13.0 or upgrade Xcode.
2. Decide the Clarity question in §12.1 (it contradicts the August decision).
3. Create a git branch. Commit a clean baseline of `ios/` and `android/` so you can diff what prebuild changes.

**Phase 1 — accounts**
4. Create the Sentry org + `buez` project; copy the DSN; create an auth token.
5. **Configure Sentry spike protection / rate limits immediately** (5k errors is small).
6. Create the Clarity mobile project; copy the Project ID.
7. **Configure Clarity masking, disallowed screens and WebView capture in the dashboard before the first build** (§3.14).

**Phase 2 — dependencies**
8. Install both packages. Expect `patch-package` postinstall trouble and stale `node_modules/.{pkg}-{hash}` dirs (§12.4).
9. `rm -rf ios/Pods ios/Podfile.lock && cd ios && pod install`.

**Phase 3 — build configuration**
10. Add `metro.config.js`. Run `npx expo start -c` and confirm the dev bundle still builds — this is the riskiest single change.
11. Add the Sentry plugin to `app.json` (last in `plugins`).
12. Add `SENTRY_AUTH_TOKEN` to `.env.local`; add `EXPO_PUBLIC_SENTRY_DSN` and `EXPO_PUBLIC_CLARITY_PROJECT_ID` to `.env`.
13. Run `npx expo prebuild` once on its own and **diff `ios/` and `android/`**. Confirm: Sentry build phases present; `android/gradle.properties` JVM heap settings and `suppressUnsupportedCompileSdk` survived; `Info.plist` export-compliance key survived.
14. Add `auth.token` to `ios/sentry.properties`; gitignore both `sentry.properties` files.

**Phase 4 — code**
15. Create `app/observability/*` (Sentry init with the §2.22 config, Clarity init, scrubbing, identity, error boundary).
16. Wire `logger.setErrorReporter` — one line, and the whole service layer becomes reportable.
17. `index.js`: import the observability module after `consoleGuard`.
18. `App.tsx`: `Sentry.wrap`, mount `ErrorBoundary`, verify the existing `ErrorUtils` handler still delegates.
19. `StackNavigator.tsx`: navigation integration + `Clarity.setCurrentScreenName`.
20. `user.context.tsx`: identify on login, clear + `Clarity.startNewSession()` on logout.
21. Add breadcrumbs + Clarity custom events at the P0 funnels from §3.13.
22. Wire the Clarity→Sentry session URL tag (§4.2).

**Phase 5 — test**
23. Debug build on a physical Android device (API 29+) and an iPhone (iOS 16+). Verbose Clarity logging on.
24. Run the full §8 verification matrix.
25. Release build on both platforms. Re-run the matrix — **source maps and symbol upload only exist in Release**.
26. Confirm in the Sentry release page: source maps uploaded, dSYMs present, release string correct and identical across platforms.
27. Confirm in Clarity: session appears (wait 2 hours), with screen names, custom user id and tags.

**Phase 6 — ship**
28. Verbose logging off, test triggers removed, sampling at production values.
29. Work the §9 checklist.
30. Bump `app.json` versions, `npx expo run:ios`, archive, upload via Organizer.
31. Watch the first 48 hours of error volume against the 5k budget and tighten `ignoreErrors` / sampling if needed.

---

## 8. Testing and verification plan

| # | Test | How | Pass criteria |
|---|---|---|---|
| 1 | JS exception | temp button → `captureException` | event in Sentry within ~30s |
| 2 | Unhandled rejection | `Promise.reject(new Error("x"))` | event appears, marked unhandled |
| 3 | Render error | throw in a screen's render | ErrorBoundary fallback shows **and** event is sent |
| 4 | Global handler still delegates | throw outside React | event appears (proves `_defaultHandler` chain intact) |
| 5 | Native crash iOS | `Sentry.nativeCrash()`, kill, relaunch | crash appears, symbolicated |
| 6 | Native crash Android | same | crash appears; ⚠️ Java frames may be degraded on New Arch |
| 7 | Source maps | inspect any JS stack trace | `.tsx` filenames + line numbers, not `bundle:1:284910` |
| 8 | Release/dist | check event tags | `com.adamburg.Buez@1.0.1+4`, same on both platforms |
| 9 | PII scrubbing | trigger a login failure with a real password typed | **no password, token or email anywhere in the event** |
| 10 | Breadcrumbs | navigate 5 screens then error | navigation trail present in the event |
| 11 | User identity | log in, then error | `user.id` = Firebase UID, nothing else |
| 12 | Performance | cold start + navigate | app-start transaction and navigation transactions in Sentry |
| 13 | Clarity init | verbose logs | "Clarity initialized" with no errors |
| 14 | Clarity real-time | real-time recordings view | live session visible |
| 15 | Clarity screen names | navigate several screens | real names (`Home`, `MyRequests`), not `UIViewController` |
| 16 | Clarity identity | log in | custom user id + tags on the session |
| 17 | **Clarity masking** | open `Chat`, `Login`, `UpgradePlan`, then watch the replay | **no readable message text, email, password field content or card data** |
| 18 | WebView exclusion | open Instagram/Facebook login, watch replay | WebView content not captured |
| 19 | Old-device behaviour | Android API 28 device / iOS 15 device | app runs normally, no crash; no Clarity session (expected) |
| 20 | Cross-link | trigger an error mid-session | Sentry event has `clarity_session_url` that opens the right replay |
| 21 | Startup cost | compare `[launch] cold start` from `launchMetrics.ts` before/after | **[REC]** no more than ~50 ms regression; investigate if worse |
| 22 | Binary size | compare IPA/AAB before/after | ~+1 MB iOS, ~+0.5 MB Android expected |
| 23 | Offline | airplane mode, error, then reconnect | Sentry event delivered on reconnect; ⚠️ Clarity iOS session lost by design |

Tests 5–8 and 17 **must** be run on Release builds.

---

## 9. Production checklist

**Sentry**
- [ ] `enabled: !__DEV__`, `debug: false`
- [ ] `environment` correct
- [ ] `tracesSampleRate: 0.1`, `profilesSampleRate: 0`, both replay rates `0`
- [ ] `sendDefaultPii: false` (do **not** copy Sentry's docs example)
- [ ] `beforeSend` scrubbing in place and tested against a real login failure
- [ ] `ignoreErrors` covers offline/network noise
- [ ] `tracePropagationTargets` limited to your own backend
- [ ] `Sentry.setUser` sends **uid only**
- [ ] spike protection / rate limits configured in project settings
- [ ] alert rule: new issue + crash-free rate drop, to email (only 1 seat on free)
- [ ] source maps + dSYMs confirmed uploaded on the release page
- [ ] `sentry.properties` files gitignored; auth token not in git history
- [ ] test triggers removed

**Clarity**
- [ ] `logLevel` back to default (`None`)
- [ ] masking level set to the strictest option in the dashboard
- [ ] disallowed screens list applied (chat, auth, payment, profile edit)
- [ ] WebView capture OFF
- [ ] "disable on low-end devices" ON
- [ ] `setCustomUserId` = Firebase UID, never email
- [ ] `startNewSession()` on logout
- [ ] screen names verified on a real build
- [ ] replay of a chat + a paywall session personally reviewed for leakage
- [ ] consent flow decided if you have EU users

**Shared / build**
- [ ] `metro.config.js` verified against a dev *and* release bundle
- [ ] prebuild diff reviewed; gradle heap settings and Info.plist keys survived
- [ ] release string identical on iOS and Android
- [ ] cold-start regression measured
- [ ] `.env` / `.env.local` not committed
- [ ] `patches/` still applies cleanly after install
- [ ] rollback plan: both SDKs are removable by reverting `app.json` + `index.js` and re-running prebuild

---

## 10. Free-plan and usage limitations summary

| | Sentry Developer (free) | Microsoft Clarity |
|---|---|---|
| Price | $0 | $0 (no paid tier) |
| Errors | **5,000 / month** | n/a |
| Spans | 5M / month | n/a |
| Replays | 50 / month (we're not using them) | **unlimited** (no published cap) [VERIFY] |
| Seats | **1** | unlimited users on a project |
| Retention | **30 days** | Clarity's standard retention [VERIFY] |
| Biggest constraint | error quota + single seat | device coverage (Android 29+, iOS 16+) and no per-view masking |

**[REC]** The realistic path: run Sentry free until either the quota or the single seat bites, then move to Team ($26/mo). Clarity stays free indefinitely.

---

## 11. Privacy and security considerations

**Hard rules**
1. Identify users by **Firebase UID only**, in both tools. No email, name, phone.
2. `sendDefaultPii: false` in Sentry — overrides the docs example.
3. `beforeSend` scrubs anything matching `/pass|token|secret|auth|key|card|cvv|email|phone/i` in `extra`, `contexts`, `request`.
4. Clarity masking is **dashboard-only** for React Native. Exclude whole screens; you cannot mask one field.
5. Exclude from Clarity recording: `Chat`, `GroupChat`, `Login`, `Signup`, `SetNewPassword`, `ChangePassword`, `OTPInput`, `EditProfile`, `UpgradePlan`, and all WebView login screens.
6. Never send Stripe payloads, card data, or the auth token to either tool.
7. `EXPO_PUBLIC_APP_SECRET` is client-bundled today — make sure it never lands in an error context, and treat fixing that as a separate task.
8. Location: `useLocation.tsx` handles coordinates. Send a coarse region at most, never lat/lng.
9. The Clarity session URL in a Sentry tag means Sentry access ⇒ replay access. Only safe if rule 5 holds.

**Compliance**
- Add Sentry and Clarity to `app/screens/PrivacyPolicy.tsx` before shipping — the app has an in-app privacy policy and it will become inaccurate the moment these ship.
- **App Store:** update the App Privacy questionnaire. Both SDKs collect "Diagnostics"; Clarity collects "Product Interaction". The app already declares `NSUserTrackingUsageDescription` and SKAdNetwork ids for the Facebook SDK — neither Sentry nor Clarity needs ATT with the configuration above, but the privacy nutrition label must change.
- **Play Console:** update the Data Safety form for the same reasons.
- **GDPR:** Clarity's `consent(adsStorage, analyticsStorage)` exists but Microsoft puts the burden of collecting consent on you [DOC]. If you have EU users, gate Clarity behind consent and use `pause()` as the default state.
- Both SDKs' iOS privacy manifests are aggregated automatically (`apple.privacyManifestAggregationEnabled: true` is already set) — verify the aggregated manifest after prebuild.

---

## 12. Risks and compatibility issues found in the current project

Ordered by how likely they are to bite you.

### 12.1 This contradicts the August 2026 decision [REPO]
The performance/observability audit landed on an explicit stack: **"Sentry (client crashes + JS errors + RN perf), SigNoz scoped to backend only, Firebase Analytics for CTA/funnel/drop-off tracking (replaces Clarity)."** Clarity was considered and dropped.

Adding Clarity now means Clarity and Firebase Analytics overlap on funnels and drop-off. That's fine if the decision has changed — Clarity gives you session replay and rage-tap detection that Firebase Analytics cannot — but **pick one owner for funnel data** or you will have two dashboards that disagree. **[REC]** If Clarity is in, Firebase Analytics becomes optional; if you want both, let Clarity own qualitative (replay, heatmaps, rage taps) and Firebase Analytics own quantitative (retention, cohorts, conversion counts).

### 12.2 Xcode 16.4 gate for Sentry v8 [DOC] [VERIFY]
Sentry v8 requires Xcode 16.4+. You build and archive locally. If your Xcode is older, v8 will not compile and the fallback is `@sentry/react-native@7.13.0`. **Check this before anything else.**

### 12.3 `metro.config.js` does not exist today [REPO]
The project has relied on `@expo/metro-config`'s implicit default since forever — a documented repo fact. Source maps require introducing one. `getSentryExpoConfig` wraps the Expo default so behaviour should be preserved, but this is a first-time change to bundling, which affects every build. Test dev **and** release bundles right after adding it.

### 12.4 `npm install` is unreliable in this repo [REPO]
Two known problems: (a) leftover `node_modules/.{package}-{8charhash}` temp dirs from a botched June install cause `ENOTEMPTY` failures — delete the exact dir named in the error and retry, typically 3–5 times; (b) `patches/expo-localization+15.0.3.patch` is known to break a clean install via the `patch-package` postinstall. Budget real time for step 8.

### 12.5 Prebuild runs on every build [REPO]
Any manual native edit for Sentry is temporary. Everything must go through the config plugin. Also diff `android/gradle.properties` (custom 6 GB JVM heap, `suppressUnsupportedCompileSdk=36`) and `ios/Buez/Info.plist` (export compliance, `UIUserInterfaceStyle`) after the first prebuild.

### 12.6 Clarity device coverage is narrower than the app's [DOC + REPO]
Clarity needs Android API 29+ / iOS 16+. Buez ships to `minSdk 24` and iOS 15.1. Your Clarity dataset systematically excludes older Android hardware — the exact devices where the known `.map()`-in-`ScrollView` performance problems are worst. Don't treat Clarity data as representative of your whole user base.

### 12.7 No per-view masking in the RN Clarity SDK [DOC]
Confirmed by reading the published type definitions. Screen-level exclusion is the only control, and it lives in the dashboard. For an app with chat, emails and free-text task descriptions this is the most serious privacy constraint in the plan.

### 12.8 New Architecture may degrade Android native stack traces [DOC]
Sentry documents missing Java stack traces on RN New Arch. Buez runs New Arch on both platforms. JS and iOS are unaffected. Validate before you rely on Android native crash data.

### 12.9 The existing global `ErrorUtils` handler [REPO]
`App.tsx` installs one at module scope and delegates via `_defaultHandler`. Sentry installs its handler first (from `index.js`), so delegation is what keeps unhandled errors flowing to Sentry. **Removing that delegation silently breaks unhandled-error reporting** — the most dangerous kind of failure, because the dashboard will simply look healthy.

### 12.10 Static frameworks + two new binary pods [REPO]
`use_frameworks! :linkage => :static` plus Sentry's and Clarity's binary pods. This repo already hit one static-framework pod conflict (SDWebImage, resolved with `pod update SDWebImage/Core`). Do a clean pod install and expect to spend time here.

### 12.11 Frame-time budget [DOC + REPO]
Clarity costs 3–5% P95 frame time. Buez has known list-virtualisation problems on `MyRequests.tsx` (2,469 lines) and `AcceptedTasks.tsx` (925 lines), both rendering with `.map()` inside a `ScrollView`. Clarity will make those screens measurably worse on weak devices. **[REC]** Turn on Clarity's "disable on low-end devices", and consider fixing the virtualisation before or alongside this work.

### 12.12 Version mismatch between `app.json` and `android/app/build.gradle` [REPO]
`app.json` says `1.0.1` / iOS build 4. `android/app/build.gradle` has `versionCode 7` / `versionName "2.0"` hardcoded. Whichever survives prebuild determines the Sentry release string — and if they differ, iOS and Android events land under different releases for the same code, breaking release health. Reconcile before the first Sentry-enabled build.

### 12.13 `expo-router` is installed but unused for routing [REPO]
It's in `dependencies` and registered as a plugin, but the entry is `registerRootComponent(App)` with pure React Navigation. Do not follow Sentry's expo-router integration docs; use the React Navigation integration against the existing `navigationRef`.

### 12.14 `LogBox.ignoreAllLogs()` [REPO]
Doesn't affect either SDK, but it means you will not see RN warnings during integration testing. **[REC]** Comment it out temporarily while testing.

---

## Open questions for you

1. **Xcode version?** Decides Sentry v8 vs v7.
2. **Is Clarity replacing Firebase Analytics, or joining it?** (§12.1)
3. **EU users → do you need a consent gate for Clarity?**
4. **Do you want the version mismatch in §12.12 fixed as part of this, or separately?**
5. **Single Sentry seat** — is that workable, or do you need Team from day one?
