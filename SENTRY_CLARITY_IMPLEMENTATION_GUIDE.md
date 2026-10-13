# Buez — Sentry + Microsoft Clarity Implementation Blueprint

**Status: PLAN ONLY. Nothing in the repository has been created, modified, installed or run.**
Date: 2026-09-17 · Project: `/Users/ReactNativeProjects/Buez/Buez_App_FullStack`
Supersedes `SENTRY_CLARITY_INTEGRATION_PLAN.md` (same repo root) — that file can be deleted once you've read this one.

Legend:
**[DOC]** confirmed from official Sentry / Microsoft docs or the published npm package · **[REPO]** confirmed by reading your files · **[REC]** my recommendation · **[VERIFY]** you must check this yourself

---

## 1. Inspection of the existing project

Everything below was read from the actual repo, not assumed.

### 1.1 Confirmed stack [REPO]

| | |
|---|---|
| React Native | `0.76.9` |
| React | `18.3.1` |
| Expo SDK | `~52.0.46` |
| TypeScript | `^5.3.3` (`tsconfig.json` extends `expo/tsconfig.base`, empty `compilerOptions`) |
| Engine | Hermes (`ios/Podfile.properties.json → expo.jsEngine: hermes`, `android/gradle.properties → hermesEnabled=true`) |
| New Architecture | **Enabled** — all three places agree: `app.json newArchEnabled:true`, `android/gradle.properties newArchEnabled=true`, `ios/Podfile.properties.json "newArchEnabled":"true"` |
| Native folders | `ios/` and `android/` committed |
| Build | `npx expo run:ios` / `npx expo run:android`, archive + upload via **Xcode Organizer**. `eas.json` exists but is dead config — `eas build` is never run |
| Auth/data | Firebase **JS SDK** (`firebase@^11.9.1`) for Auth + Firestore; `@react-native-firebase/messaging` for FCM only |
| Navigation | React Navigation 7, native-stack, single `NavigationContainer` |
| OTA updates | none (`expo-updates` not installed) |

### 1.2 Entry point chain [REPO]

```
index.js
  import './app/utils/consoleGuard';     ← line 3, must stay first
  import { registerRootComponent } from 'expo';
  import App from './App';
  registerRootComponent(App);
```

`App.tsx` top-level, in order:
1. `LogBox.ignoreAllLogs()`
2. `applyGlobalFontScaling()`
3. **global `ErrorUtils` handler** (module scope) — captures the previous handler as `_defaultHandler` and calls it after logging
4. `SplashScreen.preventAutoHideAsync()`
5. `Notifications.setNotificationHandler(...)`

Provider tree in `App.tsx`:
```
ThemeProvider > UserProvider > PostProvider > UnreadMessagesProvider
  > NotificationProvider > ExpoStripeProvider > redux Provider
    > MainApp → <StackNavigator/>   (owns NavigationContainer)
    > LanguageOnboardingModal
  > Toast
```

### 1.3 Navigation [REPO]

- `app/router/StackNavigator.tsx` — the only `NavigationContainer`, at line ~96: `<NavigationContainer ref={navigationRef}>`, `initialRouteName="Decider"`, **43 `Stack.Screen`s**.
- `app/router/navigationRef.ts` — `createNavigationContainerRef<ParamListBase>()` plus a `navigate()` helper with a 300 ms retry.
- `app/router/BottomNavigator.tsx` — exports a **Drawer** navigator (`DrawerNavigator`) containing one `Drawer.Screen name="MainTabs"` which renders `MainTabNavigator` (5 tabs).
- `app/router/InitialRoute.tsx` — `useInitialRoute` hook deciding OnBoarding / Login / Subscription / TabNavigator.

**Actual stack route names (all 43):**
```
AcceptedTasks, AddReview, AddReviewToAccepter, CancelSubscription, ChangePassword,
Chat, CompletedTasks, ConfirmedHelpers, Decider, EditProfile, EmailVerification, FAQ,
FacebookLoginWebView, ForgotPassword, FounderIntro, GroupChat, GroupDetails,
InstagramLoginWebView, InterestSelection, Language, Location, Login, MainApp, Messages,
Notifications, OTPInput, OfferDetail, OnBoarding, PostRequest, PrivacyPolicy, Profile,
Reviews, SetNewPassword, Signup, Subscription, SubscriptionV2, SuccessScreen,
TabNavigator, TaskApplicantsScreen, TermsAndConditions, TopRatedUserProfile,
TopRatedUsers, UpgradePlan
```

> ⚠️ **Finding #1 — the tab route names are translated strings.**
> In `BottomNavigator.tsx`, `MainTabNavigator` registers its tabs as
> `<Tab.Screen name={`${t("bottomTab.txt1")}`} component={MyRequests} />` … through `txt5`.
> In English those resolve to **"My Req", "Post Req", "Home", "Messages", "Settings"** — and you ship **7 locales** (`en, es, fr, it, de, de-DE, de-CH`).
> So `navigationRef.getCurrentRoute().name` returns a *localized* string whenever the user is inside the tabs. Left alone, Clarity screen names and Sentry transaction names would fragment into 7 different sets for the same 5 screens. §16 gives the fix. This is the single most important project-specific detail in this document.

### 1.4 Existing error handling [REPO]

`app/utils/logger.ts` — already built for this integration:
```ts
export type ErrorReporter = (error: unknown, context?: LogContext) => void;
export const setErrorReporter = (reporter: ErrorReporter | null): void => { ... }
```
`logger.error(error, ...context)` calls `console.error(...)` and then `report(error, context)`, where `report` is a no-op until `setErrorReporter` is called. The file's own JSDoc shows the exact Sentry wiring. **It has never been connected.**

`app/utils/consoleGuard.ts` — at runtime in release (`!__DEV__`) replaces `log/info/debug/trace/table/dir/group/time/count/assert/profile…` with a no-op. **Deliberately preserves `console.error` and `console.warn`.**

`babel.config.js` — build-time twin: `transform-remove-console` with `exclude: ["error","warn"]`, gated on `NODE_ENV === "production"`.

**No `ErrorBoundary` anywhere** (grep for `componentDidCatch` / `ErrorBoundary` returns nothing across `app/`).

### 1.5 Identity [REPO]

`app/contexts/user.context.tsx` exposes `{ userData, authUser, loading, error, isAuthenticated }`. Two effects: one `onAuthStateChanged(FIREBASE_AUTH, ...)` setting `authUser`, one subscribing to `subscribeToUserData(authUser.uid, ...)`.

> ⚠️ **Finding #2 — logout never calls `signOut`.**
> `app/services/Auth.service.tsx` line 85 defines `logout()` which does call `signOut(FIREBASE_AUTH)` — but a repo-wide grep shows **`logout()` is never imported or called anywhere**. It is dead code.
> The real logout is `handleLogout` inside `CustomDrawerContent` in `app/router/BottomNavigator.tsx`: it deletes the FCM `token` field in Firestore, calls `removeCredentials()`, sets `SecureStore "loggedOut" = "true"`, and `navigation.navigate("Login")`. **It never touches Firebase auth state.**
> Consequence: `onAuthStateChanged` does **not** fire on logout, so you cannot clear the Sentry/Clarity user from `user.context.tsx`. Identity clearing must be hooked into `handleLogout` (and `handleDeleteAccount`) in `BottomNavigator.tsx`. §15 handles this.

### 1.6 Native configuration [REPO]

**iOS** — `ios/Podfile`: `platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'`; `use_frameworks! :linkage => :static` (from `app.json → expo-build-properties → ios.useFrameworks: "static"`); privacy-manifest aggregation on. Bundle `com.adamburg.Buez`, Team `34G27X37J4`. `app.json`: `version 1.0.1`, `ios.buildNumber "4"`.

**Android** — `android/build.gradle` ext: `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36`, `kotlinVersion 1.9.25`, `buildToolsVersion 36.0.0`, `ndkVersion 26.1.10909125` (but `app.json` says `27.1.12297006` — prebuild writes the app.json value). AGP resolved to **8.6** (pinned by RN 0.76.9; `android.suppressUnsupportedCompileSdk=36` acknowledges compileSdk 36 on that toolchain). `android/app/build.gradle`: **`minifyEnabled` = `enableProguardInReleaseBuilds` which is unset → false**; `shrinkResources` false; `versionCode 7`, `versionName "2.0"`. `org.gradle.jvmargs=-Xmx6144m`.

### 1.7 Environment & bundler [REPO]

- `.env` at root, gitignored, `EXPO_PUBLIC_*` vars (Stripe publishable key, FB app id, Google client ids, translation key, app secret).
- `.gitignore` already covers `.env` and `.env*.local`.
- **No `metro.config.js`** — the project relies on `@expo/metro-config`'s implicit default.
- `patches/expo-localization+15.0.3.patch` applied via `patch-package` postinstall.

### 1.8 Data access shape [REPO]

Firestore-native. `axios` appears in only 3 files and there is **no `axios.create` instance**. ~18 raw `fetch()` sites, mostly to `https://buez-server-khaki.vercel.app` (payment sheet, cancel subscription, notifications). This matters: there is no single network chokepoint to instrument, and Firestore failures are thrown promise rejections inside services, not HTTP breadcrumbs.

### 1.9 Current monitoring [REPO]

**None.** No Sentry, Crashlytics, Clarity, Amplitude or OpenTelemetry anywhere.

---

## 2. Architecture — in plain words

### What each tool is for

**Sentry answers: "What broke, and why?"**
It sits underneath the app catching failures. When something throws, crashes or takes too long, Sentry records the stack trace, the device, the app version, the user's id, and the trail of events leading up to it. You read Sentry when something is wrong.

**Clarity answers: "What was the user actually doing?"**
It records the session — taps, scrolls, screen changes — and replays it. It shows you where people tap repeatedly in frustration (rage taps), where they tap something that isn't tappable (dead taps), and where they drop out of a flow. You read Clarity when something is confusing, not broken.

### Ownership split — no duplication

| Responsibility | Owner | Notes |
|---|---|---|
| Native crashes (iOS/Android) | **Sentry** | Clarity cannot do this at all |
| JS exceptions | **Sentry** | |
| Unhandled promise rejections | **Sentry** | |
| Render errors | **Sentry** (via ErrorBoundary) | |
| API / `fetch` errors | **Sentry** | automatic breadcrumbs + spans |
| Firestore errors | **Sentry** | only via `logger.error` — see §14 |
| App startup performance | **Sentry** | |
| Navigation performance | **Sentry** | |
| Slow / frozen frames | **Sentry** | |
| Release health, crash-free rate | **Sentry** | |
| **Session replay** | **Clarity** | ⚠️ Sentry Replay stays **OFF** — see below |
| Taps, rage taps, dead taps | **Clarity** | |
| Heatmaps | **Clarity** | |
| Funnels, drop-off, user-flow analysis | **Clarity** | |
| "Show me what happened before the crash" | **Clarity** (replay) + Sentry breadcrumbs | linked via §22 |

**Why Sentry Replay is off:** the Sentry free plan includes **50 replays per month** [DOC] — statistically useless — and Clarity does replay better, for free, unlimited. Running both means paying twice in bundle size and frame time for one feature. Set `replaysSessionSampleRate: 0` and `replaysOnErrorSampleRate: 0`.

### One-line rule

> Sentry captures **failures**. Clarity captures **behaviour**. Breadcrumbs in Sentry are a *summary* of behaviour for debugging — they are not a second analytics system, and you should not try to make them one.

---

## 3. Create the Sentry project from zero

### 3.1 Steps

1. Go to **https://sentry.io** → *Get Started* (or *Sign In* if you already have an account).
2. Sign up with email or GitHub/Google SSO.
3. **Create an organization** if you don't have one. The slug you pick here is `<org-slug>` — e.g. `tiletime`. You'll need it verbatim later.
4. *Projects* → **Create Project**.
5. Platform: search for and select **React Native** (under Mobile). Not "React", not "JavaScript".
6. Project name: **`buez`**. The slug becomes `<project-slug>` — e.g. `buez`.
7. Alert frequency: choose *Alert me on every new issue* to start; you can relax it later.
8. Click **Create Project**. Sentry shows you a setup wizard page with your DSN. **Ignore its install instructions** — §6/§7 of this guide replace them for your prebuild setup.

### 3.2 One Sentry project or two? [REC]

**One project for both platforms.** Reasons:
- Sentry tags every event with `os.name`, `device.family`, `release` and `dist`, so iOS vs Android is a one-click filter, not a project boundary.
- The free plan's 5,000 errors/month is a **per-organization** budget. Two projects don't double it, they just split your attention.
- Cross-platform regressions (a bad JS change affecting both) would appear as two unrelated issues in two projects.
- Alert rules, ownership rules and dashboards would all need duplicating.

**Recommended setup for Buez:** one project `buez`, separated by **environment** (`development` / `production`) and filtered by platform tag when needed.

### 3.3 Where to find each value

| Value | Where | Example shape |
|---|---|---|
| **DSN** | *Settings → Projects → buez → Client Keys (DSN)* | `https://abc123@o4507....ingest.sentry.io/4507...` |
| **Organization slug** | URL bar: `sentry.io/organizations/<org-slug>/` — also *Settings → General* | `tiletime` |
| **Project slug** | URL bar, or *Settings → Projects → buez → General* | `buez` |
| **Project ID** | the trailing number of the DSN, and *Settings → Projects → buez → General* | `4507123456789` |
| **Auth token** | *Settings → Auth Tokens* → **Create New Token** | `sntrys_...` |

For the auth token, the scopes you need are **`project:releases`** and **`org:read`** (Sentry's "release" preset covers both). Do not create an org-wide admin token.

### 3.4 Which values are safe in the app, which are secret

**Sentry DSN — SAFE to ship in the app.**
It is a write-only ingest endpoint. It is designed to live in client code; it cannot read your data. Anyone can find it by decompiling any app that uses Sentry. You put it in `EXPO_PUBLIC_SENTRY_DSN` and read it from JS at runtime. The only real abuse is someone spamming your quota, which Sentry's inbound filters and rate limits handle.

**`SENTRY_AUTH_TOKEN` — SECRET. Never in the app.**
This token can create releases, upload source maps and read project data on your behalf. It is used **only at build time**, by the Xcode build phase and the Gradle task that upload source maps and dSYMs. It must never be an `EXPO_PUBLIC_*` variable, because Expo inlines every `EXPO_PUBLIC_*` value into the JS bundle at build time — it would ship inside your app and be extractable from the IPA/APK.

### 3.5 Where the auth token must live for *your* build setup

This is where Buez differs from the standard guide. You build locally and archive from Xcode Organizer.

| Build path | How the token is found |
|---|---|
| `npx expo run:ios` (terminal) | reads your shell env / `.env.local` → works |
| `npx expo run:android` (terminal) | same → works |
| **Xcode → Product → Archive** | ❌ **does NOT inherit your shell environment.** The Xcode GUI launches with a minimal env, so `SENTRY_AUTH_TOKEN` from `.env.local` is invisible to the build phase and the dSYM upload silently no-ops |

**Therefore:** put the token inline in `ios/sentry.properties`:
```properties
defaults.url=https://sentry.io/
defaults.org=<org-slug>
defaults.project=buez
auth.token=sntrys_xxxxxxxx
```

### 3.6 Should `sentry.properties` be committed?

**No — gitignore both.** [REC]

`ios/sentry.properties` will contain a live auth token (§3.5), so committing it publishes a credential. `android/sentry.properties` should match for consistency and because you may need to add a token there too.

Add to `.gitignore`:
```
ios/sentry.properties
android/sentry.properties
```

Both files are generated by the Sentry Expo config plugin at prebuild, so a fresh clone regenerates them; only the `auth.token=` line has to be re-added by hand (document that in your README). Keep a `sentry.properties.example` committed if you want the team to know the shape.

---

## 4. Create the Microsoft Clarity project from zero

### 4.1 Steps

1. Go to **https://clarity.microsoft.com**.
2. *Sign up* / *Sign in* — Microsoft, Google or Facebook account.
3. Click **+ New project**.
4. Name: **`Buez`** (or `Buez Mobile` if you may add a web property later).
5. **Project type / platform:** choose the **mobile app** option (Android / iOS), not "Website". If the form asks for a website URL, that's the web flow — back out and pick the app flow.
6. Create.
7. **Project ID:** *Settings → Overview* (or *Settings → Setup*). It's a short alphanumeric string, e.g. `abcd1234ef`.

### 4.2 One Clarity project for both platforms? [REC]

**Yes — one.** Clarity mobile has no per-platform project split, the SDK takes a single `projectId` on both Android and iOS, and the dashboard filters by platform. Two projects would split your session data for no benefit.

### 4.3 Where the Project ID goes, and is it safe?

**Safe to ship.** Like the Sentry DSN, the Clarity Project ID is a write-only ingest identifier. Put it in `EXPO_PUBLIC_CLARITY_PROJECT_ID` and read it at runtime.

### 4.4 The four identifiers, side by side

| Value | What it is | Secret? | Where it lives | Used by |
|---|---|---|---|---|
| **Sentry DSN** | write-only ingest URL for your Sentry project | ❌ public | `EXPO_PUBLIC_SENTRY_DSN` in `.env`, bundled into the app | the app at runtime, `Sentry.init()` |
| **Sentry auth token** | API credential that can create releases & upload maps | ✅ **SECRET** | `.env.local` (terminal builds) **and** `ios/sentry.properties` (Xcode archives), both gitignored | build tooling only, never the app |
| **Clarity Project ID** | write-only ingest id for your Clarity project | ❌ public | `EXPO_PUBLIC_CLARITY_PROJECT_ID` in `.env`, bundled | the app at runtime, `Clarity.initialize()` |
| **Firebase UID** | the signed-in user's opaque id, e.g. `8Kd0...` | ⚠️ not secret, but **is** personal data | never stored in env; read from `authUser.uid` at runtime | sent to Sentry as `user.id` and to Clarity as `customUserId` — and **nothing else about the user is ever sent** |

---

## 5. Compatibility checks — do these BEFORE installing

Run through this list and record the answers. Two of them can change which package version you install.

| # | Check | Command / where | Buez value [REPO] | Needed by Sentry v8 [DOC] | Needed by Clarity 4.9 [DOC] | Status |
|---|---|---|---|---|---|---|
| 1 | React Native | `package.json` | 0.76.9 | `>= 0.65.0` | `>= 0.64` | ✅ |
| 2 | Expo SDK | `package.json` | ~52.0.46 | `expo >= 49` (optional peer) | n/a | ✅ |
| 3 | New Architecture | `app.json` / `gradle.properties` | **on** | supported | has new-arch codepaths | ⚠️ see §5.2 |
| 4 | Hermes | `Podfile.properties.json` / `gradle.properties` | on | supported | supported | ✅ |
| 5 | iOS deployment target | `ios/Podfile` | **15.1** | **iOS 15.0+** | podspec `ios 13.0` | ✅ builds |
| 6 | Android `minSdk` | `android/build.gradle` | **24** | — | — | ✅ builds (⚠️ §21) |
| 7 | Android compile/target SDK | `android/build.gradle` | 36 / 36 | — | reads `rootProject.ext` | ✅ |
| 8 | **Xcode version** | **`xcodebuild -version`** | **[VERIFY]** | **16.4+** | — | ❓ **decides the Sentry version** |
| 9 | Java | RN 0.76 toolchain | 17 | 17 | plugin sets `VERSION_17` | ✅ |
| 10 | Kotlin | `android/build.gradle` ext | **1.9.25** | **1.8+** | reads `rootProject.ext.kotlinVersion` | ✅ |
| 11 | AGP | pinned by RN 0.76.9 | **8.6** | **7.4.0+** | plugin buildscript uses 8.6.1 | ✅ |
| 12 | `react-native-svg` | `package.json` | **15.8.0** | — | **peer `>= 14.0.0`** | ✅ |

### 5.1 Why the Xcode version decides the Sentry package version

`@sentry/react-native@8.x` bumped its iOS floor and **requires Xcode 16.4 or newer to compile** [DOC]. You archive locally from Xcode, so this is *your* Xcode, not a CI image. If you are below 16.4, the iOS build will fail at compile time — not at runtime, not with a helpful message.

**Run this first, before anything else:**
```bash
xcodebuild -version
```

| Result | Decision |
|---|---|
| `Xcode 16.4` or higher | ✅ install `@sentry/react-native@^8.27.0` |
| `Xcode 16.0` – `16.3` | either upgrade Xcode, **or** install `@sentry/react-native@7.13.0` |
| below `Xcode 16.0` | install `@sentry/react-native@7.13.0` (min Expo SDK for v7 is 50, so SDK 52 is fine) [DOC] |

I could not run this for you — the session's bridge shell is a Linux VM, not your macOS host.

**If you end up on v7**, everything in this guide applies unchanged except two API names: `captureFeedback()` is `captureUserFeedback()`, and `enableAutoSessionTracking` is `autoSessionTracking`.

### 5.2 New Architecture caveat [DOC]

Sentry documents that on RN's New Architecture "you might be missing the Java stack trace". Buez runs New Arch on both platforms. **JS errors and iOS native crashes are unaffected.** Treat Android *native* crash fidelity as best-effort and validate it explicitly in the QA pass (§28) before you rely on it.

Clarity's RN package has new-arch codepaths (`RCT_NEW_ARCH_ENABLED` compiler flag in the podspec; `com.facebook.react` gradle plugin applied when `newArchEnabled`), so it builds — but **[VERIFY]** recording fidelity on a real device, since Clarity reconstructs sessions from the view hierarchy and Fabric changes how that hierarchy is built.

---

## 6. Package installation

**Do not run these yet.** This is the guide only.

### 6.1 Sentry

```bash
npx expo install @sentry/react-native
```

**Use `npx expo install`, not `npm install`.** Expo checks the package against your SDK version and installs a version known to work with SDK 52. Bare `npm install` would grab `latest` with no compatibility check.

Version: `^8.27.0` **if** `xcodebuild -version` ≥ 16.4; otherwise pin `@sentry/react-native@7.13.0`.

> **[REPO] Known failure mode:** `npx expo install` has failed in this repo before, on a blocked call to Expo's compatibility API, even when the npm registry was reachable. If that happens, read the SDK-pinned version from `node_modules/expo/bundledNativeModules.json` and run `npm install @sentry/react-native@<that version>` directly.

**Do NOT run `npx @sentry/wizard@latest -i reactNative`.** The wizard writes manual edits into `ios/` and `android/` — which `expo prebuild` reverts on your very next build (§7) — and it also rewrites `metro.config.js` and `App.tsx` in ways you'd have to unpick.

### 6.2 Clarity

```bash
npm install @microsoft/react-native-clarity
```

**Use `npm install` here, not `npx expo install`.** Clarity is not in Expo's compatibility database, so `expo install` has nothing to check against and will just pass through — but it may also warn or fail on the lookup. Plain `npm install` is the documented path [DOC].

Version: `^4.9.0` (current latest).

> ⚠️ **Use the scoped package.** Two packages exist and are the same code:
> - `react-native-clarity@4.9.0` — its own README opens with *"This package is on the path to deprecation. Please use `@microsoft/react-native-clarity` instead for new projects or future updates."*
> - **`@microsoft/react-native-clarity@4.9.0`** ← use this.

### 6.3 Pods

```bash
cd ios && pod install
```

**[REC]** Do a clean install the first time: `rm -rf ios/Pods ios/Podfile.lock` first. You are adding two binary pods (`Sentry`, and Clarity's `Clarity 4.1.0`) into a project that uses `use_frameworks! :linkage => :static`, and this repo has already hit one static-framework pod conflict before (SDWebImage, resolved with `pod update SDWebImage/Core`).

### 6.4 Post-install warning [REPO]

Expect trouble from `npm install` in this repo for two known reasons:
1. `node_modules` contains stale `.{package}-{8charhash}` temp directories from a botched June install, at all depths. They cause `ENOTEMPTY` on rename. Fix: `rm -rf <exact path from the error>` and retry the same command — typically 3–5 times.
2. `patches/expo-localization+15.0.3.patch` runs through `patch-package` on postinstall and is known to break a clean install.

Budget real time for this step.

---

## 7. Expo / prebuild configuration — the most important section

### 7.1 Why manual native edits will not survive

Your build command is `npx expo run:ios`. That command **runs `expo prebuild` first**, which regenerates and force-syncs native configuration from `app.json` into `ios/` and `android/`. Known effects in this repo: `CFBundleShortVersionString` ← `expo.version`, `CFBundleVersion` ← `expo.ios.buildNumber`, and any Info.plist key declared in `app.json` overwrites the hand-edited value.

So if you open Xcode and add a Sentry build phase by hand, it works exactly once. The next `npx expo run:ios` removes it, and your source maps quietly stop uploading. Nothing fails loudly — you just get unsymbolicated stack traces forever.

### 7.2 The source of truth

**`app.json` + Expo config plugins.** Everything native must be expressed there, and the native folders must be treated as build output you never hand-edit.

### 7.3 Sentry config plugin — exactly what to add

In `app.json`, inside `expo.plugins`, **append at the end of the array**:

```jsonc
{
  "expo": {
    "plugins": [
      "expo-secure-store",
      ["expo-router", { "origin": "https://buez.expo.app" }],
      ["@stripe/stripe-react-native", { /* ...unchanged... */ }],
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }],
      ["react-native-fbsdk-next", { /* ...unchanged... */ }],
      "@react-native-google-signin/google-signin",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      ["expo-build-properties", { /* ...unchanged... */ }],
      "expo-localization",
      "expo-font",

      // ↓↓↓ ADD THIS, LAST IN THE ARRAY ↓↓↓
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "organization": "<org-slug>",
          "project": "buez"
        }
      ]
    ]
  }
}
```

**Why last:** Sentry documents a build-phase ordering conflict when its Expo plugin runs alongside other plugins that also modify the iOS bundle phase, and the workaround depends on plugin ordering [DOC]. Putting Sentry last is the safest default.

**What the plugin does at the next prebuild:**
- iOS: rewrites the *Bundle React Native code and images* phase to call `sentry-xcode.sh`; adds an *Upload Debug Symbols to Sentry* run-script phase; creates `ios/sentry.properties`.
- Android: adds `apply from: "../../node_modules/@sentry/react-native/sentry.gradle"` to `android/app/build.gradle`; creates `android/sentry.properties`.

**After the first prebuild, diff `ios/` and `android/` and confirm:**
- [ ] The Sentry build phases exist in `ios/Buez.xcodeproj`.
- [ ] `android/gradle.properties` still has `org.gradle.jvmargs=-Xmx6144m …` and `android.suppressUnsupportedCompileSdk=36`.
- [ ] `ios/Buez/Info.plist` still has `ITSAppUsesNonExemptEncryption = false`.
- [ ] `android/app/build.gradle` has the `sentry.gradle` apply line.

Then add `auth.token=` to `ios/sentry.properties` and gitignore both properties files.

### 7.4 Does Clarity need a config plugin?

**No.** `@microsoft/react-native-clarity` ships a standard RN native module with an Android `build.gradle` and an iOS podspec, and is picked up by autolinking. `expo prebuild` handles it automatically. Its Android gradle file reads `compileSdkVersion`, `minSdkVersion`, `targetSdkVersion` and `kotlinVersion` from `rootProject.ext` — all four of which `android/build.gradle` already defines [REPO].

**Clarity requires zero native configuration.** The only command is `npm install` + `pod install`.

---

## 8. Environment variables

### 8.1 What goes where

**`.env`** (already gitignored, already in use) — append:
```properties
EXPO_PUBLIC_SENTRY_DSN=https://<key>@o<orgId>.ingest.sentry.io/<projectId>
EXPO_PUBLIC_CLARITY_PROJECT_ID=<clarity-project-id>
```

**`.env.local`** (new file; already covered by `.gitignore`'s `.env*.local`) — build-time only:
```properties
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxx
```

**`ios/sentry.properties`** (generated by the plugin, then edited, then gitignored):
```properties
defaults.url=https://sentry.io/
defaults.org=<org-slug>
defaults.project=buez
auth.token=sntrys_xxxxxxxxxxxxxxxx
```

### 8.2 The `EXPO_PUBLIC_` rule — say it out loud

> Every variable prefixed `EXPO_PUBLIC_` is **inlined into the JavaScript bundle at build time** and ships inside the app. Anyone with the IPA or APK can read it.

That is fine for the DSN and the Clarity Project ID (both are write-only ingest identifiers). It is **catastrophic for `SENTRY_AUTH_TOKEN`**, which can create releases and read project data.

**`SENTRY_AUTH_TOKEN` must never carry the `EXPO_PUBLIC_` prefix. Ever.**

### 8.3 How each value is accessed

| Value | Accessed by | How |
|---|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | your JS, at runtime | `process.env.EXPO_PUBLIC_SENTRY_DSN` |
| `EXPO_PUBLIC_CLARITY_PROJECT_ID` | your JS, at runtime | `process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID` |
| `SENTRY_AUTH_TOKEN` | `sentry-xcode.sh` / `sentry.gradle`, at build time | shell env, `.env.local`, or `sentry.properties` |

### 8.4 Per build path

| Build path | DSN / Clarity ID | Auth token |
|---|---|---|
| **Development** (`npx expo start`) | from `.env`, but Sentry is **disabled** anyway (`enabled: !__DEV__`) | not needed — no upload in dev |
| **`npx expo run:ios`** (terminal) | from `.env` | from shell env or `ios/sentry.properties` |
| **`npx expo run:android`** (terminal) | from `.env` | from shell env or `android/sentry.properties` |
| **Xcode → Archive** | baked into the bundle at the previous bundling step | ❗ **only from `ios/sentry.properties`** — Xcode GUI does not inherit your shell env |
| **Android release** (`assembleRelease`/`bundleRelease`) | from `.env` | from shell env or `android/sentry.properties` |

### 8.5 Never bundled

`SENTRY_AUTH_TOKEN`, `STRIPE_SECRET_KEY`, any Firebase admin credential. And a standing note: `EXPO_PUBLIC_APP_SECRET` is already client-bundled in this repo — a pre-existing issue, out of scope here, but make sure it never ends up inside a Sentry error context.

---

## 9. Observability folder structure

Create one folder. Nothing outside it ever imports `@sentry/react-native` or `@microsoft/react-native-clarity` — this preserves the project's existing rule that third-party SDKs live in a service layer, never in screens.

```
app/observability/
├── index.ts               // public API + init orchestration
├── config.ts              // env reading, enable flags, sampling constants
├── sentry.ts              // Sentry.init, beforeSend scrubbing, tag helpers
├── clarity.ts             // Clarity.initialize, screen/event/tag helpers
├── identity.ts            // setObservabilityUser / clearObservabilityUser
├── navigationTracking.ts  // onReady + onStateChange handlers, route-name normalisation
├── screenPolicy.ts        // the excluded/sensitive screen list, single source of truth
└── ErrorBoundary.tsx      // Sentry.ErrorBoundary + themed fallback UI
```

| File | Responsibility | Imports SDKs? |
|---|---|---|
| `index.ts` | Exports `initObservability()`, `setObservabilityUser()`, `clearObservabilityUser()`, `trackScreen()`, `trackEvent()`, `captureError()`. **This is the only module the rest of the app imports.** | no (re-exports) |
| `config.ts` | Reads `process.env.EXPO_PUBLIC_*`; computes `SENTRY_ENABLED`, `CLARITY_ENABLED`, `ENVIRONMENT`, sample rates. Pure, no side effects. | no |
| `sentry.ts` | `initSentry()`, `beforeSend` scrubber, `setSentryUser`, `setSentryTag`, `captureException` wrapper, `addBreadcrumb` wrapper. | Sentry |
| `clarity.ts` | `initClarity()`, `setClarityUser`, `setClarityScreen`, `sendClarityEvent`, `setClarityTag`, `resetClaritySession`. All calls guarded so a missing project id or a disabled flag is a silent no-op. | Clarity |
| `identity.ts` | The one place that knows a Firebase UID becomes `Sentry.setUser({id})` + `Clarity.setCustomUserId(uid)` + shared tags. Enforces "UID only". | no (uses sentry.ts/clarity.ts) |
| `navigationTracking.ts` | `onNavigationReady(navigationRef)` and `onNavigationStateChange(navigationRef)`. Owns the **localized-tab-name normalisation** (§16). | no |
| `screenPolicy.ts` | `SENSITIVE_SCREENS: readonly string[]` and `isSensitiveScreen(name)`. Used by navigation tracking and referenced in the Clarity dashboard config. One list, one place. | no |
| `ErrorBoundary.tsx` | Class/wrapper around `Sentry.ErrorBoundary` with a fallback that uses `useAppTheme()` tokens and offers a retry. | Sentry |

---

## 10. Exactly how Sentry initializes

### 10.1 Where, and why there

**`Sentry.init()` is called from `app/observability/index.ts`, which is imported by `index.js` immediately after `consoleGuard`.**

Why `index.js` and not `App.tsx`:
- `index.js` runs before `App.tsx`'s module body. Anything that throws at `App.tsx` module scope — the `ErrorUtils` setup, `applyGlobalFontScaling()`, an import cycle — happens *after* Sentry is live and therefore gets captured.
- `consoleGuard` must still be first (it is the guard that stops release logging), so Sentry goes second.
- Sentry's `ReactNativeErrorHandlers` integration installs the global JS error handler at `init()` time. Installing it before `App.tsx` runs is exactly what makes the existing handler chain work (§13).

### 10.2 The order inside `index.js`

```js
// index.js — proposed, 1 added line
import './app/utils/consoleGuard';          // 1. unchanged, stays first
import './app/observability';               // 2. NEW — runs initObservability()
import { registerRootComponent } from 'expo';
import App from './App';                    // 3. App.tsx module body runs here
registerRootComponent(App);                 // 4.
```

### 10.3 Implementation-level sketch — `app/observability/config.ts`

```ts
export const ENVIRONMENT = __DEV__ ? "development" : "production";

export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
export const CLARITY_PROJECT_ID = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID ?? "";

// Disabled in dev on purpose: the free plan is 5k errors/month and a week of
// Metro reloads would consume it. Flip SENTRY_FORCE_DEV to true locally when
// you are specifically testing the integration.
const SENTRY_FORCE_DEV = false;
const CLARITY_FORCE_DEV = false;

export const SENTRY_ENABLED  = Boolean(SENTRY_DSN)        && (!__DEV__ || SENTRY_FORCE_DEV);
export const CLARITY_ENABLED = Boolean(CLARITY_PROJECT_ID) && (!__DEV__ || CLARITY_FORCE_DEV);

export const TRACES_SAMPLE_RATE = __DEV__ ? 1.0 : 0.1;
```

### 10.4 Implementation-level sketch — `app/observability/sentry.ts`

```ts
import * as Sentry from "@sentry/react-native";
import {
  SENTRY_DSN, SENTRY_ENABLED, ENVIRONMENT, TRACES_SAMPLE_RATE,
} from "./config";

// Created once at module load so StackNavigator can register the container.
export const sentryNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

const SENSITIVE_KEY = /pass|pwd|token|secret|auth|apikey|api_key|key|card|cvv|cvc|iban|email|phone|otp/i;

const scrub = (value: unknown, depth = 0): unknown => {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : scrub(v, depth + 1);
  }
  return out;
};

export const initSentry = (): void => {
  if (!SENTRY_ENABLED) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    debug: false,

    // release / dist are auto-derived from the native bundle version.
    // Do NOT set them by hand — see §24.

    // --- privacy ---
    sendDefaultPii: false,          // Sentry's own docs example sets this true. Do not copy it.

    // --- errors ---
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    enableAutoSessionTracking: true,   // v7: `autoSessionTracking`

    // --- performance ---
    tracesSampleRate: TRACES_SAMPLE_RATE,
    profilesSampleRate: 0,             // free plan doesn't meaningfully cover it
    tracePropagationTargets: ["buez-server-khaki.vercel.app"],

    // --- replay: OFF, Clarity owns this ---
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    integrations: [sentryNavigationIntegration],

    ignoreErrors: [
      "Network request failed",
      "AbortError",
      "Non-Error promise rejection captured",
      /Firebase: Error \(auth\/network-request-failed\)/,
      /auth\/user-cancelled/,
      /SIGN_IN_CANCELLED/,        // Google Sign-In user backed out
      /ASAuthorizationError.*1001/, // Apple Sign-In user cancelled
    ],

    beforeSend(event) {
      // Second line of defence. See §19 — prefer never adding the data at all.
      if (event.user) event.user = { id: event.user.id };   // drop email/ip/username
      if (event.extra)    event.extra    = scrub(event.extra) as typeof event.extra;
      if (event.contexts) event.contexts = scrub(event.contexts) as typeof event.contexts;
      if (event.request)  delete event.request.cookies;
      return event;
    },

    beforeBreadcrumb(crumb) {
      // Strip query strings from HTTP breadcrumbs — they carry tokens and ids.
      if (crumb.category === "xhr" || crumb.category === "fetch") {
        const url = crumb.data?.url;
        if (typeof url === "string") crumb.data!.url = url.split("?")[0];
      }
      // Never let a console breadcrumb carry a raw object we haven't scrubbed.
      if (crumb.category === "console" && crumb.data) crumb.data = {};
      return crumb;
    },
  });
};

export const setSentryUser = (uid: string | null): void => {
  if (!SENTRY_ENABLED) return;
  Sentry.setUser(uid ? { id: uid } : null);
};

export const setSentryTag = (key: string, value: string): void => {
  if (!SENTRY_ENABLED) return;
  Sentry.setTag(key, value);
};

export const captureError = (error: unknown, context?: Record<string, unknown>): void => {
  if (!SENTRY_ENABLED) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
};

export const addBreadcrumb = (message: string, category = "app"): void => {
  if (!SENTRY_ENABLED) return;
  Sentry.addBreadcrumb({ message, category, level: "info" });
};

export const wrapApp = Sentry.wrap;
```

### 10.5 `Sentry.wrap` in `App.tsx`

```ts
// App.tsx — last line changes from:
//   export default function App() { ... }
// to a named function plus:
export default Sentry.wrap(App);
```
`Sentry.wrap` enables automatic touch-event breadcrumbs and the app-start / TTID instrumentation. It is the only reason to import Sentry into `App.tsx` at all — and even that can go through `app/observability` (`export const wrapApp = Sentry.wrap`) to keep the one-folder rule.

---

## 11. Exactly how Clarity initializes

### 11.1 Where

**`Clarity.initialize()` is called from `app/observability/index.ts`, in the same `initObservability()` call as Sentry, right after `initSentry()`.**

Microsoft's own README shows initialization inside `NavigationContainer`'s `onReady` [DOC], because their example needs the navigation ref for screen names. **Don't copy that for Buez.** Initializing at `index.js` time starts recording at process launch, so you capture the splash → Decider → OnBoarding/Login path, which is exactly where your first-run drop-off lives. Screen naming is handled separately in §16 and does not require init to live inside the container.

### 11.2 Implementation-level sketch — `app/observability/clarity.ts`

```ts
import * as Clarity from "@microsoft/react-native-clarity";
import { CLARITY_ENABLED, CLARITY_PROJECT_ID } from "./config";

let started = false;

export const initClarity = (onSessionStarted?: () => void): void => {
  if (!CLARITY_ENABLED) return;   // covers both __DEV__ and a missing project id

  // initialize() is ASYNCHRONOUS — it returns before Clarity is ready. [DOC]
  Clarity.initialize(CLARITY_PROJECT_ID, {
    logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.None,
  });

  // Identity, tags and the Sentry cross-link MUST be set inside this callback,
  // or they may attach to the wrong session. [DOC]
  Clarity.setOnSessionStartedCallback(() => {
    started = true;
    onSessionStarted?.();
  });
};

export const setClarityUser = (uid: string): void => {
  if (!CLARITY_ENABLED) return;
  Clarity.setCustomUserId(uid).catch(() => {});   // 1–255 chars, no PII [DOC]
};

export const setClarityTag = (key: string, value: string): void => {
  if (!CLARITY_ENABLED) return;
  Clarity.setCustomTag(key, value).catch(() => {});
};

export const setClarityScreen = (screenName: string): void => {
  if (!CLARITY_ENABLED) return;
  Clarity.setCurrentScreenName(screenName).catch(() => {});
};

export const sendClarityEvent = (name: string): void => {
  if (!CLARITY_ENABLED) return;
  Clarity.sendCustomEvent(name).catch(() => {});   // name only, ≤254 chars, NO payload
};

export const resetClaritySession = (): void => {
  if (!CLARITY_ENABLED) return;
  Clarity.startNewSession(() => {});
};

export const getClaritySessionUrl = async (): Promise<string | undefined> => {
  if (!CLARITY_ENABLED) return undefined;
  try { return await Clarity.getCurrentSessionUrl(); } catch { return undefined; }
};

export const isClarityStarted = (): boolean => started;
```

### 11.3 What happens in each edge case

| Situation | Behaviour |
|---|---|
| **`__DEV__` is true** | `CLARITY_ENABLED` is false → `initialize()` is never called, every helper returns immediately. No dev sessions pollute your dashboard. Flip `CLARITY_FORCE_DEV` in `config.ts` when you're specifically testing. |
| **Project ID missing/empty** | `CLARITY_ENABLED` is false. All helpers no-op. **The app must not crash or warn the user** — this is why every helper has the guard rather than relying on the SDK. |
| **Unsupported OS** (Android < API 29, iOS < 16) [DOC] | `initialize()` is called, the native SDK declines to record, the app runs normally. No exception, no crash. You simply get no session. ~The affected slice of your users is real — see §21.~ |
| **Clarity disabled remotely** (dashboard, or low-end-device rule) | Same: init succeeds, no recording. |
| **`initialize()` throws** | Wrap the call in try/catch and swallow. Observability must never take the app down. |
| **Offline** | Android buffers on device and uploads later. **iOS does not buffer — the session is lost.** [DOC] |

### 11.4 `app/observability/index.ts` — orchestration

```ts
import { initSentry, setSentryTag } from "./sentry";
import { initClarity, getClaritySessionUrl } from "./clarity";

export const initObservability = (): void => {
  try { initSentry(); } catch { /* never break startup */ }

  try {
    initClarity(async () => {
      // Cross-link: attach the Clarity replay URL to every subsequent Sentry event.
      const url = await getClaritySessionUrl();
      if (url) setSentryTag("clarity_session_url", url);
    });
  } catch { /* never break startup */ }
};

// Side-effect on import, so `import './app/observability'` in index.js is enough.
initObservability();

export { setObservabilityUser, clearObservabilityUser } from "./identity";
export { onNavigationReady, onNavigationStateChange } from "./navigationTracking";
export { captureError, addBreadcrumb, wrapApp } from "./sentry";
export { sendClarityEvent as trackEvent } from "./clarity";
export { default as ObservabilityErrorBoundary } from "./ErrorBoundary";
```

---

## 12. Complete startup flow

```
index.js
   │
   ├─ 1. import './app/utils/consoleGuard'
   │       └─ if (!__DEV__) replaces console.log/info/debug/... with no-ops.
   │          console.error / console.warn survive on purpose.
   │
   ├─ 2. import './app/observability'
   │       └─ initObservability()
   │            ├─ initSentry()
   │            │    ├─ reads EXPO_PUBLIC_SENTRY_DSN
   │            │    ├─ Sentry.init({...})
   │            │    ├─ installs the global JS error handler (ReactNativeErrorHandlers)
   │            │    ├─ installs the native crash handler (sentry-cocoa / sentry-java)
   │            │    ├─ starts the app-start transaction
   │            │    └─ creates sentryNavigationIntegration (not yet attached)
   │            │
   │            └─ initClarity(onSessionStarted)
   │                 ├─ reads EXPO_PUBLIC_CLARITY_PROJECT_ID
   │                 ├─ Clarity.initialize(...)   ← ASYNC, returns immediately
   │                 └─ registers setOnSessionStartedCallback
   │                      └─ (later, when the session actually starts)
   │                           getCurrentSessionUrl() → Sentry.setTag("clarity_session_url")
   │
   ├─ 3. import App from './App'          ← App.tsx MODULE BODY runs now
   │       ├─ LogBox.ignoreAllLogs()
   │       ├─ applyGlobalFontScaling()
   │       ├─ ErrorUtils.setGlobalHandler(...)   ← captures SENTRY's handler as
   │       │                                        _defaultHandler and delegates to it
   │       ├─ SplashScreen.preventAutoHideAsync()
   │       └─ Notifications.setNotificationHandler(...)
   │          ── any throw in here is now captured by Sentry ──
   │
   └─ 4. registerRootComponent(Sentry.wrap(App))
           │
           └─ App()  renders
                ├─ useFonts(Poppins…)  → returns null until loaded
                ├─ useLanguageOnboarding() → returns null until checked
                └─ ThemeProvider
                     └─ ObservabilityErrorBoundary        ← NEW (§13)
                          └─ UserProvider
                               ├─ onAuthStateChanged fires
                               │    └─ user → setObservabilityUser(uid, userData)
                               │              ├─ Sentry.setUser({ id: uid })
                               │              ├─ Clarity.setCustomUserId(uid)
                               │              └─ shared tags (is_subscribed, plan_type, …)
                               └─ PostProvider → UnreadMessagesProvider
                                    → NotificationProvider → ExpoStripeProvider
                                      → redux Provider
                                           └─ MainApp
                                                ├─ useDeepLinking(...)
                                                ├─ SplashScreen.hideAsync()
                                                ├─ markFirstScreenReady()
                                                └─ <StackNavigator/>
                                                     └─ NavigationContainer
                                                          ├─ onReady
                                                          │    ├─ registerNavigationContainer(navigationRef)
                                                          │    └─ trackScreen(initial route = "Decider")
                                                          └─ onStateChange
                                                               └─ trackScreen(new route)
```

**Why this order matters:** Sentry is live before `App.tsx` exists, so module-scope failures are caught. Clarity is live before the first screen paints, so onboarding and login are recorded. Both are *initialized* before, and *identified* after, the user is known.

---

## 13. Sentry ErrorBoundary

### 13.1 Does Buez need one? **Yes.**

Right now, a render-time throw in any of the 43 screens unmounts the React tree and leaves a **white screen with no recovery and no report**. There is no `componentDidCatch` anywhere in the project [REPO]. This is the single highest-value user-facing improvement in this whole integration.

### 13.2 Where to create it

`app/observability/ErrorBoundary.tsx` — a thin wrapper over `Sentry.ErrorBoundary` with a fallback that uses `useAppTheme()` so it matches light/dark mode, shows a translated message via `useTranslation()`, and offers a "Try again" button calling the `resetError` callback.

### 13.3 Where to wrap

In `App.tsx`, **inside `ThemeProvider`** (so the fallback can be themed) and **outside every other provider** (so a crash in `UserProvider`, `PostContext`, Stripe, redux or navigation is still caught):

```
ThemeProvider
  └─ <ObservabilityErrorBoundary>     ← NEW
       └─ UserProvider
            └─ PostProvider
                 └─ ... existing tree unchanged ...
```

Putting it *outside* `ThemeProvider` would mean the fallback has no theme. Putting it *inside* `UserProvider` would mean a `UserProvider` crash bypasses it.

### 13.4 What it catches / does not catch

| Catches ✅ | Does **not** catch ❌ |
|---|---|
| Errors thrown during render | Errors in event handlers (`onPress`) |
| Errors in lifecycle methods | Errors inside `setTimeout` / `setInterval` |
| Errors in constructors of child components | Errors in `async` functions / promise rejections |
| | Errors in the boundary's own fallback |
| | Server-side / native crashes |

The gaps are covered elsewhere: async and event-handler errors reach the **global `ErrorUtils` handler** and Sentry's unhandled-rejection tracking; caught service errors reach Sentry through `logger.error` (§14). The ErrorBoundary is not a catch-all, it is specifically the white-screen fix.

### 13.5 Coexistence with the existing global handler — **read this twice**

`App.tsx` currently has, at module scope:

```ts
const _ErrorUtils: any = typeof (global as any).ErrorUtils !== "undefined"
  ? (global as any).ErrorUtils : undefined;

if (_ErrorUtils?.setGlobalHandler && _ErrorUtils?.getGlobalHandler) {
  const _defaultHandler = _ErrorUtils.getGlobalHandler();   // ← captures whoever is installed
  _ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error("Global error:", isFatal ? "[FATAL]" : "", error?.message || error);
    if (_defaultHandler) _defaultHandler(error, isFatal);   // ← THE CRITICAL LINE
  });
}
```

**How it will behave once Sentry is added:**

1. `index.js` imports `app/observability` → `Sentry.init()` runs → Sentry installs **its** global handler.
2. `index.js` then imports `App` → `App.tsx` module body runs → `getGlobalHandler()` returns **Sentry's handler**, stored as `_defaultHandler`.
3. The app's handler is installed on top. On an unhandled error it logs, then calls `_defaultHandler(error, isFatal)` → **Sentry receives the error.**

**The chain works — but only because of that one delegation line.**

> ⛔ **Do NOT remove the existing `ErrorUtils` handler, and do NOT remove the `_defaultHandler(error, isFatal)` call, during this integration.**
> If that line goes, unhandled JS errors stop reaching Sentry entirely — and the failure is invisible. The dashboard just looks healthy. This is the worst possible failure mode for a crash reporter: silent, and indistinguishable from "our app is stable".

**Verification (QA item #4 in §28):** throw an error from a `setTimeout` outside React, and confirm it appears in Sentry. That single test proves the chain is intact.

**Future cleanup [REC], not part of this work:** once Sentry is proven in production for a release or two, you can delete the hand-rolled handler entirely and let Sentry own the global handler. Do that as its own change, with the same verification test, not bundled into this integration.

---

## 14. Existing logger integration

### 14.1 What's already there [REPO]

`app/utils/logger.ts` is already designed for this. It has:
- `setErrorReporter(reporter: ErrorReporter | null)` — a module-level slot, currently `null`
- `report(error, extra)` — invoked by `logger.error`, wrapped in try/catch so "telemetry never breaks the calling flow"
- `createLogger(scope)` for scoped loggers, e.g. `createLogger("Auth.service")`
- `logger.debug/log/info` → dev only; `logger.warn/error` → always

**No structural change is needed. One line connects it.**

### 14.2 The wiring

In `app/observability/index.ts`, inside `initObservability()`, after `initSentry()`:

```ts
import { setErrorReporter } from "../utils/logger";
import { captureError } from "./sentry";

setErrorReporter((error, context) => captureError(error, context));
```

### 14.3 The flow

```
service / screen code
        │
        ├─ logger.error(err, { taskId, step: "confirm" })
        │        │
        │        ├─ console.error("[Post.service]", err, {...})   ← survives in release
        │        │                                                  (consoleGuard keeps error/warn)
        │        └─ report(err, [{...}])
        │                 └─ errorReporter(err, { extra: [...] })
        │                          └─ captureError(err, ctx)
        │                                   └─ Sentry.captureException(err, { extra: ctx })
        │
        └─ logger.log("fetched 20 tasks")  → dev only, stripped in release, never sent
```

### 14.4 What to capture vs what to only log

> **Do not blindly pipe every log into Sentry.** With 5,000 errors/month, a chatty log line on a hot screen will exhaust the budget in a day and then you are blind for three weeks.

| Use | When | Reaches Sentry? |
|---|---|---|
| `logger.error(err, ctx)` | a real failure: a Firestore write rejected, a payment call failed, a parse blew up, an invariant broke | ✅ yes |
| `logger.warn(msg)` | something unexpected but handled: missing optional field, retry succeeded on attempt 2 | ❌ no (logged only) |
| `logger.log / info / debug` | development tracing | ❌ no, and stripped from release bundles |

**Specifically do NOT capture:**
- User-cancelled flows (Google/Apple sign-in dismissal, Stripe sheet dismissal) — those are `ignoreErrors` entries, not errors
- Network-offline failures — the app already has a `NetworkError` screen and NetInfo handling; offline is a state, not a bug
- Validation failures (Formik/Yup) — expected user input, not a defect
- Firestore `permission-denied` on a signed-out user — expected during logout races

**[REC] follow-up, out of scope here:** the service layer still uses raw `console.log("Failed to ...", error)` in places — e.g. `updateSubscriptionStatus` in `app/services/Subscription.service.tsx` and the `cancelUserSubscription` catch in `BottomNavigator.tsx`. Those are stripped in release and will never reach Sentry. Converting them to `logger.error` is a separate mechanical pass; do it *after* this integration is verified, so you can see the error volume change in isolation.

---

## 15. Firebase user identity

### 15.1 The rule

**Send the Firebase UID and nothing else.**

| Send ✅ | Never send ❌ |
|---|---|
| `authUser.uid` | email |
| derived non-identifying tags (`is_subscribed`, `plan_type`, `is_founder`, `app_language`, `theme_mode`) | display name / `userName` |
| | phone number |
| | password, `password2` from SecureStore |
| | Firebase ID token / refresh token |
| | precise coordinates from `useLocation` |
| | profile image URL |

The UID is opaque — it means nothing to anyone without access to your Firestore. That's the point: you can look up a user internally, but a Sentry event or a Clarity session is not itself a personal record.

### 15.2 Setting identity on login

**File: `app/contexts/user.context.tsx`** [REPO] — inside the second effect, the one that already reacts to `authUser` and subscribes to `subscribeToUserData`.

Add an effect (or extend the existing one) that fires when both `authUser` and `userData` are available:

```
Firebase login succeeds (email / Google / Apple)
        ↓
onAuthStateChanged fires  →  setAuthUser(user)
        ↓
subscribeToUserData(uid) delivers userData
        ↓
setObservabilityUser(authUser.uid, userData)
        ├─ Sentry.setUser({ id: uid })
        ├─ Clarity.setCustomUserId(uid)
        ├─ setTag("is_subscribed", String(!!userData.isSubscribed))   → both tools
        ├─ setTag("plan_type", userData.planType ?? "free")           → both tools
        └─ setTag("app_language", i18n.language)                      → both tools
```

**Why `user.context.tsx` and not `Login.tsx`:** there are four ways into the app — email (`Login.tsx handleLogin`), Google (`app/utils/googleLogin.tsx`), Apple (`app/utils/appleLogin.tsx`) and Facebook (`app/utils/facebookLogin.tsx`), plus silent re-auth from SecureStore credentials on cold start. `onAuthStateChanged` is the one place all five converge. Hooking the screens would miss the cold-start path entirely.

**Timing note:** `Clarity.setCustomUserId` must run after Clarity's session has started. Two safe options: call it inside `setOnSessionStartedCallback`, or have `identity.ts` cache the pending uid and flush it when `isClarityStarted()` flips true. `identity.ts` owns this detail so no caller has to think about it.

### 15.3 Clearing identity on logout — **this is not where you'd expect**

> ⚠️ **Re-read Finding #2 in §1.5.** The real logout path never calls `signOut()`, so `onAuthStateChanged` never fires with `null`. You cannot clear identity from `user.context.tsx`.

**File: `app/router/BottomNavigator.tsx`** [REPO] — inside `CustomDrawerContent`.

**`handleLogout`** — currently: delete FCM token field → `removeCredentials()` → `SecureStore.setItemAsync("loggedOut","true")` → `navigation.navigate("Login")`. Add `clearObservabilityUser()` immediately before the navigate:

```
User taps Logout in the drawer → confirms in ConfirmationModal
        ↓
handleLogout()
        ├─ updateDoc(users/{uid}, { token: deleteField() })
        ├─ removeCredentials()
        ├─ SecureStore.setItemAsync("loggedOut", "true")
        ├─ clearObservabilityUser()          ← ADD HERE
        │     ├─ Sentry.setUser(null)
        │     ├─ Sentry.setTag("is_subscribed", "unknown")   (or clear the tags)
        │     └─ Clarity.startNewSession()   ← stops the next user's activity being
        │                                        stitched onto this user's session
        └─ navigation.navigate("Login")
```

**`handleDeleteAccount`** — same treatment, immediately before `navigation.navigate("OnBoarding")`.

**Why `Clarity.startNewSession()` matters:** without it, if a second person signs in on the same device, their taps continue the previous user's Clarity session and inherit the previous `customUserId`. That is both a data-quality bug and a privacy problem.

**[REC] separate follow-up:** `Auth.service.logout()` exists, calls `signOut(FIREBASE_AUTH)`, and is dead code. That the real logout never signs out of Firebase is a pre-existing correctness issue worth a look on its own — but fixing it inside this integration would change auth behaviour, so don't. Just hook the path that actually runs today.

---

## 16. Navigation tracking

### 16.1 The localized-route-name problem — solve this first

[REPO] `MainTabNavigator` in `app/router/BottomNavigator.tsx` registers tabs with translated names:

```tsx
<Tab.Screen name={`${t("bottomTab.txt1")}`} component={MyRequests} />   // EN: "My Req"
<Tab.Screen name={`${t("bottomTab.txt2")}`} component={PostDashboard} />// EN: "Post Req"
<Tab.Screen name={`${t("bottomTab.txt3")}`} component={Home} />        // EN: "Home"
<Tab.Screen name={`${t("bottomTab.txt4")}`} component={Messages} />    // EN: "Messages"
<Tab.Screen name={`${t("bottomTab.txt5")}`} component={Settings} />    // EN: "Settings"
```

You ship 7 locales (`en, es, fr, it, de, de-DE, de-CH`). So `navigationRef.getCurrentRoute().name` returns a **different string per language** for the same screen. Unfixed, your Clarity funnel for "Home" would be 7 separate funnels, and your Sentry navigation transactions would be 7 separate transaction names — making both datasets almost useless for the five most-visited screens in the app.

**Fix — normalise in `navigationTracking.ts`:**

```ts
import i18n from "../translation/i18n";

// Map the 5 translated tab names back to stable English keys, for EVERY locale.
const TAB_KEYS = ["txt1", "txt2", "txt3", "txt4", "txt5"] as const;
const STABLE_TAB_NAMES: Record<(typeof TAB_KEYS)[number], string> = {
  txt1: "MyRequests",
  txt2: "PostDashboard",
  txt3: "Home",
  txt4: "Messages",
  txt5: "Settings",
};

const buildTabAliasMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const lng of i18n.languages ?? [i18n.language]) {
    for (const key of TAB_KEYS) {
      const translated = i18n.getFixedT(lng)(`bottomTab.${key}`);
      if (translated) map[translated] = STABLE_TAB_NAMES[key];
    }
  }
  return map;
};

export const normaliseRouteName = (raw?: string): string => {
  if (!raw) return "Unknown";
  return buildTabAliasMap()[raw] ?? raw;   // cache the map in practice
};
```

Simpler and more robust alternative **[REC]**: give each `Tab.Screen` a stable `name` and move the translated string to `options.tabBarLabel`. That is the correct React Navigation pattern anyway — route names are identifiers, labels are UI. **But it touches navigation behaviour** (`CustomTabBar` compares `route.name === t("bottomTab.txt3")` in four places, and `handleDeleteBlockedCta` navigates with `params: { screen: t("bottomTab.txt1") }`), so it must be its own reviewed change, **not** part of this integration. Use the alias map now; schedule the rename separately.

### 16.2 Sentry navigation integration

**File: `app/router/StackNavigator.tsx`**, at the existing `<NavigationContainer ref={navigationRef}>` (line ~96).

```tsx
<NavigationContainer
  ref={navigationRef}
  onReady={() => onNavigationReady(navigationRef)}
  onStateChange={() => onNavigationStateChange(navigationRef)}
>
```

And in `navigationTracking.ts`:

```ts
import { sentryNavigationIntegration } from "./sentry";
import { setClarityScreen } from "./clarity";
import { addBreadcrumb } from "./sentry";
import { isSensitiveScreen } from "./screenPolicy";

let lastRouteName: string | undefined;

export const onNavigationReady = (ref: NavigationContainerRefType): void => {
  // Required so Sentry can create navigation transactions.
  sentryNavigationIntegration.registerNavigationContainer(ref);

  const initial = normaliseRouteName(ref.getCurrentRoute()?.name);  // "Decider"
  lastRouteName = initial;
  trackScreen(initial);
};

export const onNavigationStateChange = (ref: NavigationContainerRefType): void => {
  const current = normaliseRouteName(ref.getCurrentRoute()?.name);
  if (!current || current === lastRouteName) return;
  lastRouteName = current;
  trackScreen(current);
};

const trackScreen = (name: string): void => {
  // Clarity: starts a new "page" each time the screen name changes. [DOC]
  setClarityScreen(name);
  // Sentry: a lightweight breadcrumb; the transaction is created by the integration.
  addBreadcrumb(`navigate → ${name}`, "navigation");
};
```

**What this gives you:**

| | |
|---|---|
| **Navigation container** | registered once in `onReady` — the integration needs the ref to hook route changes |
| **Initial route** | `"Decider"` [REPO] — captured in `onReady`, otherwise the first screen is missing from every session |
| **Screen changes** | `onStateChange` fires on every route change including tab switches and drawer navigations |
| **Screen names** | normalised (§16.1) so all 7 locales report the same names |
| **Performance transactions** | Sentry creates one navigation transaction per route change, plus time-to-initial-display when `enableTimeToInitialDisplay: true` |

**Real Buez screen names you'll see in both dashboards:**
`Decider · OnBoarding · Login · Signup · EmailVerification · InterestSelection · Subscription · SubscriptionV2 · TabNavigator · Home · MyRequests · PostDashboard · Messages · Settings · PostRequest · OfferDetail · TaskApplicantsScreen · ConfirmedHelpers · AcceptedTasks · CompletedTasks · Chat · GroupChat · Reviews · AddReview · Profile · EditProfile · UpgradePlan · CancelSubscription · FounderIntro · SuccessScreen · …`

### 16.3 Which file holds what

| Logic | File |
|---|---|
| The two `NavigationContainer` props | `app/router/StackNavigator.tsx` (2 lines) |
| Everything else — normalisation, Sentry registration, Clarity screen name, breadcrumb | `app/observability/navigationTracking.ts` |

`StackNavigator.tsx` stays clean: no SDK imports, no tracking logic, just two handler references.

---

## 17. Clarity custom events

`Clarity.sendCustomEvent(name)` takes **a name only** — no parameters, no payload, max 254 characters [DOC]. So every event name must be a fixed constant. **Never interpolate a task id, user id, amount or any other variable into the name** — it would both explode cardinality and leak data into a field that has no masking.

Define them once in `app/observability/events.ts` as a frozen constant object, and call `trackEvent(EVENTS.TASK_POSTED)`.

| Event | Where to call it | What triggers it | Parameters | Sensitive data to exclude |
|---|---|---|---|---|
| `signin_success` | `app/contexts/user.context.tsx`, in the identify path | any successful auth (email/Google/Apple/FB) reaches `onAuthStateChanged` | none | never append the provider's email; if you want the provider, use a **tag** `auth_provider`, not the event name |
| `signup_success` | `app/screens/Signup.tsx` → `handleSignup` (~line 97), after `createUserWithEmailAndPassword` resolves | new account created | none | no email, no password |
| `email_verification_sent` | `app/screens/EmailVerificationScreen.tsx` | verification mail dispatched | none | no email |
| `onboarding_completed` | `app/screens/InterestSelection.tsx`, on submit | interests chosen, first-run finished | none | interests are non-sensitive but still don't put them in the name |
| `language_selected` | `app/translation/OnBoardingSelection.tsx` → `handleDone` | language onboarding modal completes | none | use a **tag** `app_language` for the value |
| `task_posted` | `app/screens/PostRequest.tsx`, at the `navigation.navigate("SuccessScreen", …)` calls (~lines 1043 / 1057 / 1096) | a request is successfully created | none | **never the task description, budget or location** |
| `task_applied` | `app/hooks/useWorkerActions.ts`, on a successful apply | a helper applies to a task | none | no task id in the name |
| `task_confirmed` | `app/services/Post.service.tsx` → `updateReqestStatus`, on success | poster confirms a helper | none | no names |
| `task_completed` | `app/services/Post.service.tsx` → `createCompletedTaskForWorkers`, on success | task marked complete | none | |
| `task_cancelled` | `app/services/Post.service.tsx` → `cancelConfirmedTask`, on success | confirmed task cancelled | none | no cancellation reason text |
| `review_submitted` | `app/screens/AddReview.tsx` and `app/screens/AddReviewToAccepter.tsx`, after write succeeds | a review is saved | none | **never the review text or rating** in the name |
| `chat_opened` | `app/screens/Chat.tsx`, on mount | a 1:1 chat is opened | none | no participant names. ⚠️ also see §18 — `Chat` should be excluded from recording entirely |
| `group_chat_opened` | `app/screens/GroupChat.tsx`, on mount | group chat opened | none | same |
| `paywall_viewed` | `app/screens/SubscriptionV2.tsx` and `app/screens/Subscription.tsx`, on mount | subscription screen shown | none | |
| `subscription_started` | `app/services/Subscription.service.tsx` → `updateSubscriptionStatus`, on success | payment completed and Firestore updated | none | **no amount, no Stripe ids, no card data** — plan goes in a tag |
| `subscription_upgrade_viewed` | `app/screens/UpgradePlan.tsx`, on mount | upgrade screen shown | none | |
| `subscription_cancelled` | `app/screens/CancelSubscription.tsx`, after the cancel API returns success | subscription cancelled | none | no subscription id |
| `founder_intro_viewed` | `app/screens/FounderIntro.tsx`, on mount | founder intro shown | none | |
| `deep_link_opened` | `app/job-sharing/useDeepLinking.ts` → `resolveAndNavigate` | a `buez://job/<id>` link or share link resolves | none | ⚠️ **never the jobId or the full URL** in the name |
| `network_error_shown` | `app/screens/NetworkError.tsx`, on mount | connectivity lost screen shown | none | |

**Pattern to follow for anything variable:** the *fact* goes in the event name, the *value* goes in a `setCustomTag`. `subscription_started` + tag `plan_type=monthly` — never `subscription_started_monthly_7_90`.

---

## 18. Privacy and sensitive screens

### 18.1 Never send to Sentry or Clarity — hard list

| Data | Where it lives in Buez [REPO] |
|---|---|
| Passwords | `Login.tsx`, `Signup.tsx`, `SetNewPassword.tsx`, `ChangePassword.tsx`; `SecureStore` keys `password`, `password2`; `deleteCurrentUser(currentPassword)` |
| OTP codes | `OTPInput.tsx` |
| Firebase ID / refresh tokens | auth errors, `users/{uid}.token` (FCM) |
| Email addresses | `user.context`, `EditProfile.tsx`, `Login.tsx`, drawer header |
| Phone numbers | `EditProfile.tsx`, profile documents |
| Card data, CVV, Stripe payloads | `UpgradePlan.tsx`, `SubscriptionV2.tsx`, `Subscription.service.tsx` → `handlePaymentSheet` |
| Stripe secrets | `STRIPE_SECRET_KEY` (server-only), and note the `pk_test_` key currently hardcoded in `app.json` |
| Private messages / chat content | `Chat.tsx`, `GroupChat.tsx`, `Chat.service.tsx`, `react-native-gifted-chat` views |
| Precise location | `app/utils/useLocation.tsx`, `Location.tsx`, `haversine` distance inputs |
| Free-text task descriptions | `PostRequest.tsx`, `OfferDetail.tsx` |
| Private profile info | `Profile.tsx`, `EditProfile.tsx`, `TopRatedUserProfile.tsx` |
| App secrets | `EXPO_PUBLIC_APP_SECRET`, `EXPO_PUBLIC_TRANSLATION_KEY`, Google/FB client ids |

### 18.2 Clarity masking limitations — the important constraint

I read the published type definitions of `@microsoft/react-native-clarity@4.9.0`. The **entire** exported API is:

```
initialize · pause · resume · isPaused · startNewSession · setCustomUserId ·
setCustomSessionId · setCustomTag · setCustomTags · sendCustomEvent ·
setOnSessionStartedCallback · setCurrentScreenName · getCurrentSessionId (deprecated) ·
getCurrentSessionUrl · consent
```

And `ClarityConfig` has exactly two fields: `userId` (deprecated) and `logLevel`.

**There is no `maskView` / `unmaskView` in the React Native SDK.** The native Android SDK has them; React Native does not surface them.

Since Clarity 3.0, masking level, WebView capture, allowed/disallowed screens, network limits and low-end-device disabling are **configured in the Clarity dashboard, not in code** [DOC].

**What this means practically:**

| Can do ✅ | Cannot do ❌ |
|---|---|
| Set the global masking level (dashboard) | Mask one `TextInput` on an otherwise-visible screen |
| Exclude an entire screen (dashboard) | Mask a single `<Text>` showing an email |
| Turn WebView capture off (dashboard) | Unmask a specific element for debugging |
| `pause()` / `resume()` around a sensitive flow (code) | Per-component masking of any kind |
| `consent(false,false)` to stop collection (code) | |

**Design consequence: your only granular tool is screen-level exclusion plus `pause()`/`resume()`.** If a screen contains anything sensitive, exclude the whole screen. Do not try to build a partial solution.

### 18.3 Buez screens to exclude from Clarity recording

Configure these in the Clarity dashboard's disallowed-screens setting, using the **normalised** names from §16 so they match what `setCurrentScreenName` sends.

| Screen | Verdict | Reason |
|---|---|---|
| `Login` | **Exclude** | password field, email |
| `Signup` | **Exclude** | password, email, name |
| `OTPInput` | **Exclude** | one-time codes |
| `SetNewPassword` | **Exclude** | password |
| `ChangePassword` | **Exclude** | current + new password |
| `ForgotPassword` | **Exclude** | email |
| `EmailVerification` | **Exclude** | email |
| `EditProfile` | **Exclude** | email, phone, name, image |
| `UpgradePlan` | **Exclude** | payment entry point |
| `SubscriptionV2`, `Subscription` | **[REC] Keep** — but see note | the paywall is your key funnel and the Stripe sheet itself is a native modal Clarity can't capture anyway. Keep them recorded so you can see drop-off, and verify in a replay that no card field is visible before you commit to this |
| `CancelSubscription` | **[REC] Keep** | churn funnel; no PII on screen — verify |
| `Chat` | **Exclude** | private message content |
| `GroupChat` | **Exclude** | private message content |
| `GroupDetails` | **Exclude** | member names |
| `Messages` | **[REC] Exclude** | conversation list shows names and message previews |
| `InstagramLoginWebView`, `FacebookLoginWebView` | **Exclude + WebView capture OFF** | third-party credential entry |
| `Profile`, `TopRatedUserProfile` | **[REC] Exclude** | other users' names, photos, reviews |
| `PostRequest` | **[REC] Keep, with strictest masking** | the core conversion flow; you need the funnel. But it contains free-text descriptions and a location picker — **verify a real replay before deciding.** If text is legible, exclude it |
| `OfferDetail` | **[REC] Keep, verify** | shows other users' task descriptions |
| `Location` | **[REC] Exclude** | address / map with precise position |
| `Home`, `MyRequests`, `PostDashboard`, `AcceptedTasks`, `CompletedTasks`, `Settings`, `Notifications`, `Reviews`, `TaskApplicantsScreen`, `ConfirmedHelpers`, `OnBoarding`, `InterestSelection`, `FounderIntro`, `SuccessScreen`, `FAQ`, `PrivacyPolicy`, `TermsAndConditions` | **Keep** | this is where the behavioural value is |

**Also set in the dashboard:**
- Masking level → **strictest available** (mask all text) as the baseline, everywhere.
- WebView capture → **OFF**.
- Disable on low-end devices → **ON** (§21).

**Belt and braces [REC]:** have `navigationTracking.ts` call `Clarity.pause()` when entering a screen in `SENSITIVE_SCREENS` and `Clarity.resume()` when leaving. That gives you a code-side guarantee that doesn't depend on the dashboard config being right, and it's the only per-screen control the RN SDK actually offers. `screenPolicy.ts` holds the list so code and dashboard stay in sync.

---

## 19. Sentry PII scrubbing

### 19.1 The principle, stated first

> **`beforeSend` is the second layer, not the first.** The primary defence is never putting sensitive data into an event: don't pass request bodies to `logger.error`, don't set an email tag, don't attach a Stripe response as `extra`, keep `sendDefaultPii: false`.
>
> A scrubber only catches what you thought of. Assume your deny-list is incomplete, because it is.

### 19.2 `beforeSend` sketch

```ts
const SENSITIVE_KEY =
  /pass|pwd|token|secret|auth|apikey|api_key|\bkey\b|card|cvv|cvc|iban|email|phone|otp|credential/i;

const REDACTED = "[redacted]";

const scrub = (value: unknown, depth = 0): unknown => {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? REDACTED : scrub(v, depth + 1);
  }
  return out;
};

beforeSend(event) {
  // 1. user: id only, always. Drops email/username/ip_address even if something set them.
  if (event.user) event.user = { id: event.user.id };

  // 2. deep-scrub the free-form containers
  if (event.extra)    event.extra    = scrub(event.extra)    as typeof event.extra;
  if (event.contexts) event.contexts = scrub(event.contexts) as typeof event.contexts;

  // 3. request: no cookies, no bodies, no query strings
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.headers;
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
  }

  // 4. last resort: if the message itself contains something that looks like a JWT
  //    or an email, drop the event rather than ship it.
  const serialized = JSON.stringify(event.exception ?? {}) + (event.message ?? "");
  if (/eyJ[A-Za-z0-9_-]{10,}\./.test(serialized)) return null;       // JWT
  if (/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(serialized)) return null;    // email address

  return event;
}
```

Returning `null` drops the event entirely. That is the right trade: losing one error report is better than storing a user's email or a live token in a third-party system.

### 19.3 Also scrub breadcrumbs

`beforeSend` does not cover breadcrumb URLs. Use `beforeBreadcrumb` (sketched in §10.4) to strip query strings from `fetch`/`xhr` breadcrumbs — the ~18 `fetch` calls in this app pass ids and, in some flows, tokens as parameters.

---

## 20. Sentry performance

| Setting | Recommendation [REC] | Why |
|---|---|---|
| `tracesSampleRate` (prod) | **0.1** | Free plan gives 5M spans/month [DOC], which sounds enormous — but one navigation-heavy session in a 43-screen app produces hundreds of spans. Start low; you can always raise it. Raising a rate is easy, recovering a blown quota is not. |
| `tracesSampleRate` (dev) | 1.0 | irrelevant anyway since Sentry is disabled in dev |
| **App startup** | automatic via `Sentry.wrap` | gives cold/warm start with device and OS breakdown. **[REC]** keep `app/utils/launchMetrics.ts` running in parallel for a release or two and cross-check the two numbers before trusting either |
| **Navigation performance** | via `reactNavigationIntegration` (§16) | one transaction per route change; enable `enableTimeToInitialDisplay` |
| **API performance** | automatic HTTP instrumentation | covers the `fetch`/axios calls. Set `tracePropagationTargets: ["buez-server-khaki.vercel.app"]` so trace headers are **not** attached to Google, Stripe or Firebase requests — sending them there is noise at best and a CORS/auth problem at worst |
| **Firestore performance** | ❌ **not instrumented, and don't try** | the Firebase JS SDK uses its own transport; Sentry has no Firestore integration. If you need Firestore timing, wrap specific service calls in manual spans — but only for the 2–3 queries you actually suspect, not everywhere |
| **Profiling** | **off** (`profilesSampleRate: 0`) | not meaningfully covered by the free plan, adds startup cost, and you have a frame-time budget problem already (§21) |
| `enableAutoSessionTracking` | **true** | this is what produces crash-free-rate / release health, which is the most useful single number Sentry gives you |

**Why start low:** with a 5,000-error and single-seat free plan, the failure mode you want to avoid is discovering mid-incident that you've been rate-limited for two weeks. Ship at 0.1, watch the quota page for a week, then tune.

---

## 21. Clarity performance and device coverage

### 21.1 Supported OS versions vs Buez's floor [DOC + REPO]

| | Clarity supports | Buez ships to | Gap |
|---|---|---|---|
| Android | **API 29 – 36** | `minSdk 24` | **API 24–28 (Android 7.0 – 9.0) produce no recordings** |
| iOS | **16 – 26** | deployment target **15.1** | **iOS 15 produces no recordings** |

The app runs normally on those devices — Clarity simply doesn't capture. But it means **your Clarity dataset is a biased sample that excludes older, cheaper Android hardware** — which is exactly where the known performance problems in this app (the un-virtualised `.map()`-in-`ScrollView` lists in `MyRequests.tsx` at 2,469 lines and `AcceptedTasks.tsx` at 925 lines) hurt most. Do not read "no rage taps on MyRequests" as "MyRequests is fine".

**[VERIFY]** Pull your actual Android API-level and iOS-version distribution from Play Console / App Store Connect so you know what fraction of users you're blind to.

### 21.2 New Architecture validation [VERIFY]

Clarity reconstructs sessions from low-level drawing commands and the view hierarchy. Fabric changes how that hierarchy is built. The package has new-arch codepaths and should work, but this is not something to assume — **watch a real replay on a New-Arch build on both platforms** and confirm the UI is recognisable, before you rely on Clarity for anything.

### 21.3 Measured overhead [DOC]

| Metric | Cost |
|---|---|
| Initialization | 1–2 ms |
| **Frame time (P95)** | **+3–5%** |
| Bandwidth | ~10 KiB per second of recording |
| Binary size | **+400 KB Android, +900 KB iOS** |

### 21.4 Should Clarity auto-disable on weak devices? **Yes.** [REC]

Turn on **"Disable on low-end devices"** in the Clarity dashboard. Rationale specific to Buez: you already have a documented frame-time problem on two of the largest screens, and a 3–5% P95 regression lands hardest exactly where the app is already struggling. The sessions you'd lose are from devices where the recording would be degraded anyway.

**[REC]** Also consider a code-side guard: skip `Clarity.initialize()` entirely on devices below your threshold using `react-native-device-info` (already a dependency) — e.g. `DeviceInfo.getTotalMemory()` under ~2 GB. That's belt-and-braces over the dashboard rule and gives you a kill switch you control from a release rather than a dashboard.

### 21.5 Other limits [DOC]

- Notifications, system nav bars and **the keyboard** are never captured.
- iOS keyboard extensions unsupported.
- **iOS has no offline buffering** — a session recorded with no network is lost. Android buffers and uploads later.
- Completed sessions take **~2 hours** to appear in the dashboard; the real-time view shows in-progress sessions immediately.

---

## 22. Sentry + Clarity cross-linking

### 22.1 The shared key

```
Firebase UID (authUser.uid)
        │
        ├──→ Sentry.setUser({ id: uid })
        └──→ Clarity.setCustomUserId(uid)
```

Both tools now index the same user by the same opaque token. You can jump from a Sentry issue to that user's Clarity sessions by searching the UID, and vice versa — without either system holding a name, email or phone number.

### 22.2 The session-URL link (the high-value one)

```
Clarity session starts
        ↓
setOnSessionStartedCallback fires
        ↓
await Clarity.getCurrentSessionUrl()
        ↓
Sentry.setTag("clarity_session_url", url)
        ↓
every subsequent Sentry event in this app run carries a one-click link
to the replay of the session that produced it
```

This turns "TypeError: undefined is not an object on MyRequests" into "…and here is the 40-second video of exactly what the user tapped to get there". It is the single most useful thing in this integration.

**[REC]** Also tag the reverse direction so you can slice Clarity by build:
```
Clarity.setCustomTag("sentry_release", "com.adamburg.Buez@1.0.1+4")
```

### 22.3 When it is safe — and the real concern

**Safe, because:**
- Only the UID and an opaque session URL cross the boundary. No email, name, phone or content.
- The UID is meaningless without access to your Firestore.
- Both values are already inside systems your team controls.

**The concern you must accept deliberately:**

> ⚠️ **Putting the Clarity session URL in Sentry means anyone with Sentry access can watch the replay.**
> The two access-control systems become one, at the level of the weaker one.

That is fine **only if §18.3 holds** — i.e. every replay is already safe for anyone on your team to watch, because chat, auth, payment and profile screens are excluded and the masking level is strict. If you skip the exclusion work, this cross-link turns a Sentry login into a window onto users' private messages.

**Do §18 first. Then §22.**

Also: on the free plan Sentry has **one seat**, so "anyone with Sentry access" is currently you. That changes the day you move to Team — revisit this then.

---

## 23. Build / release configuration

### 23.1 iOS

| Artefact | How it gets to Sentry |
|---|---|
| **JS source maps (Hermes)** | the *Bundle React Native code and images* build phase, rewritten by the Sentry Expo plugin to call `sentry-xcode.sh`. Handles the Hermes bytecode → JS map composition automatically |
| **dSYMs** | the *Upload Debug Symbols to Sentry* run-script phase calling `sentry-xcode-debug-files.sh` |
| **Credentials** | `ios/sentry.properties` — `defaults.org`, `defaults.project`, and **`auth.token`** |

**The Xcode Organizer trap, again:** Archive builds launched from the Xcode GUI do not inherit your shell environment. `SENTRY_AUTH_TOKEN` in `.env.local` is invisible to them. The upload phase will run, find no credentials, and **skip silently**. Your release will look fine and every stack trace will be minified forever.

**→ The token must be inline in `ios/sentry.properties`, and that file must be gitignored.**

**Verification after every release archive:** open *Sentry → Releases → `com.adamburg.Buez@1.0.1+4`* and confirm it lists uploaded source maps and a non-zero dSYM count. If it says 0, the archive didn't see the token.

### 23.2 Android

| Artefact | How |
|---|---|
| **JS source maps** | `sentry.gradle`, applied to `android/app/build.gradle` by the Expo plugin, hooks the bundle task |
| **ProGuard/R8 mapping** | **N/A today** — see below |
| **Native (NDK) symbols** | only if you explicitly enable the Sentry Android Gradle Plugin |
| **Credentials** | `android/sentry.properties` or the shell env |

### 23.3 What `minifyEnabled false` means for you [REPO]

`android/app/build.gradle` has `minifyEnabled enableProguardInReleaseBuilds`, and `android.enableProguardInReleaseBuilds` is not set in `gradle.properties` → **it resolves to `false`**. `shrinkResources` is likewise false.

Consequences:

1. **No ProGuard/R8 mapping file is produced, so there is nothing to upload.** Java/Kotlin frames in Android crash reports arrive already readable. One less thing to configure.
2. **Your APK/AAB is larger and your Java code is not obfuscated.** That's a pre-existing decision, out of scope here.
3. **If you ever turn ProGuard on**, you must at that moment enable the Sentry Android Gradle Plugin's mapping upload — otherwise every Android native stack trace becomes `a.b.c(Unknown Source)` overnight. Write that down in whatever ticket eventually enables minification.

**If you do enable the Sentry Android Gradle Plugin** (for NDK symbols, say), Sentry v8 requires `autoInstallation { enabled = false }` — leaving it on causes version conflicts that can crash the app [DOC].

### 23.4 A note on JS source maps in both platforms

Source maps are only generated and uploaded for **Release** builds. Every source-map-related QA item must be run against a release build; a debug build proves nothing about symbolication.

---

## 24. Version / release consistency

### 24.1 Current state [REPO]

| Source | Version | Build |
|---|---|---|
| `app.json` → `expo.version` | `1.0.1` | — |
| `app.json` → `expo.ios.buildNumber` | — | `4` |
| `app.json` → `expo.android.versionCode` | — | **not set** |
| `android/app/build.gradle` | `versionName "2.0"` | `versionCode 7` |
| `ios/Buez.xcodeproj` | `MARKETING_VERSION = 2.0`, `CURRENT_PROJECT_VERSION = 1` | orphaned — the plist uses literal strings, nothing reads these |

> ⚠️ **Finding #3 — the Android and iOS release identifiers disagree.**
> iOS reports `1.0.1 (4)`. Android's gradle file says `2.0 (7)`.

### 24.2 How Sentry derives a release

Sentry auto-detects release and dist from the **native** bundle version at runtime:

```
release = com.adamburg.Buez@<CFBundleShortVersionString>+<CFBundleVersion>   (iOS)
release = com.adamburg.buez@<versionName>+<versionCode>                      (Android)
dist    = <build number / versionCode>
```

So with today's values you would get:
- iOS → `com.adamburg.Buez@1.0.1+4`
- Android → `com.adamburg.buez@2.0+7`

**Two different releases for the same commit.** Release health, regression detection, "which build introduced this", and source-map matching all break, because Sentry thinks these are unrelated versions.

### 24.3 What to do

**Do not set `release` / `dist` manually in `Sentry.init()`.** Manual values drift from the binary and then source maps stop matching. Let Sentry auto-detect, and fix the underlying mismatch instead.

**[REC] Reconcile before the first Sentry-enabled build**, as its own small change:
- Add `expo.android.versionCode` to `app.json` so prebuild owns it, matching the iOS build number.
- Let prebuild write `versionName` / `versionCode` into `android/app/build.gradle` rather than keeping hardcoded values there.
- Confirm after a prebuild that both platforms report the same `version`.

**[VERIFY]** Which value actually wins on Android today — `app.json` (via prebuild) or the hardcoded gradle values — needs one prebuild run and a look at the generated file. Do that during Phase 3 of §30 and record the answer.

This is **not** changing your versioning scheme, and it is **not** part of the Sentry work per se — it is a prerequisite for Sentry's release data being meaningful at all.

---

## 25. File-by-file change list

### 25.1 Modify (8 files)

| File | Action | Purpose | Size of change |
|---|---|---|---|
| `package.json` | modify | add `@sentry/react-native`, `@microsoft/react-native-clarity` | 2 lines |
| `app.json` | modify | append `["@sentry/react-native/expo", {...}]` **last** in `expo.plugins`; **[REC]** add `expo.android.versionCode` (§24) | ~8 lines |
| `index.js` | modify | `import './app/observability';` after `consoleGuard` | 1 line |
| `App.tsx` | modify | `export default Sentry.wrap(App)`; mount `<ObservabilityErrorBoundary>` inside `ThemeProvider`. **Leave the `ErrorUtils` handler and its `_defaultHandler` delegation exactly as they are** | ~5 lines |
| `app/router/StackNavigator.tsx` | modify | add `onReady` + `onStateChange` to the existing `<NavigationContainer ref={navigationRef}>` | 2 lines |
| `app/contexts/user.context.tsx` | modify | call `setObservabilityUser(uid, userData)` once auth + user data resolve | ~8 lines |
| `app/router/BottomNavigator.tsx` | modify | call `clearObservabilityUser()` in `handleLogout` and `handleDeleteAccount` (§15.3) | 2 lines |
| `.gitignore` | modify | add `ios/sentry.properties`, `android/sentry.properties` | 2 lines |

> Note: `app/utils/logger.ts` needs **no change** — `setErrorReporter` already exists and is called from `app/observability/index.ts`.

### 25.2 Create (10 files)

| File | Purpose |
|---|---|
| `metro.config.js` | `getSentryExpoConfig(__dirname)` — required for source maps |
| `.env.local` | `SENTRY_AUTH_TOKEN` (already gitignored by `.env*.local`) |
| `app/observability/index.ts` | public API + init orchestration + `setErrorReporter` wiring |
| `app/observability/config.ts` | env reading, enable flags, sample rates |
| `app/observability/sentry.ts` | `Sentry.init`, scrubbing, tag/capture helpers |
| `app/observability/clarity.ts` | `Clarity.initialize`, screen/event/tag helpers |
| `app/observability/identity.ts` | `setObservabilityUser` / `clearObservabilityUser` |
| `app/observability/navigationTracking.ts` | `onNavigationReady` / `onNavigationStateChange` + route-name normalisation |
| `app/observability/screenPolicy.ts` | `SENSITIVE_SCREENS` list, single source of truth |
| `app/observability/events.ts` | frozen `EVENTS` constants (§17) |
| `app/observability/ErrorBoundary.tsx` | `Sentry.ErrorBoundary` + themed fallback |

### 25.3 Generated by tooling — never hand-edit

`ios/sentry.properties` · `android/sentry.properties` · `ios/Buez.xcodeproj` build phases · the `sentry.gradle` apply line in `android/app/build.gradle` · `ios/Podfile.lock`

### 25.4 Do NOT touch

`babel.config.js` · `app/utils/consoleGuard.ts` · `app/utils/logger.ts` (internals) · `firebaseConfig.js` · anything in `patches/` · the `ErrorUtils` block in `App.tsx` · any file inside `ios/` or `android/` by hand

---

## 26. Exact call map

| Function | Defined in | Called from | When |
|---|---|---|---|
| `initObservability()` | `app/observability/index.ts` | `index.js` (via side-effect import) | app startup, after `consoleGuard`, before `App` is imported |
| ↳ `initSentry()` | `app/observability/sentry.ts` | `initObservability()` | first — installs the global + native error handlers |
| ↳ `initClarity(cb)` | `app/observability/clarity.ts` | `initObservability()` | second — async, returns immediately |
| ↳ `setErrorReporter(...)` | `app/utils/logger.ts` (existing) | `initObservability()` | right after `initSentry()` |
| `Sentry.wrap(App)` | SDK | `App.tsx` default export | module load |
| `<ObservabilityErrorBoundary>` | `app/observability/ErrorBoundary.tsx` | `App.tsx`, inside `ThemeProvider` | render |
| `setObservabilityUser(uid, userData)` | `app/observability/identity.ts` | `app/contexts/user.context.tsx` | when `authUser` **and** `userData` are both available (covers email, Google, Apple, FB and cold-start re-auth) |
| ↳ `setSentryUser(uid)` | `sentry.ts` | `identity.ts` | same |
| ↳ `setClarityUser(uid)` | `clarity.ts` | `identity.ts` | same, deferred until the Clarity session has started |
| `clearObservabilityUser()` | `identity.ts` | **`app/router/BottomNavigator.tsx`** → `handleLogout` and `handleDeleteAccount` | ⚠️ **not** `user.context.tsx` — see §15.3 |
| ↳ `Sentry.setUser(null)` | `sentry.ts` | `identity.ts` | on logout |
| ↳ `resetClaritySession()` | `clarity.ts` | `identity.ts` | on logout — prevents session stitching across users |
| `onNavigationReady(ref)` | `navigationTracking.ts` | `app/router/StackNavigator.tsx` → `<NavigationContainer onReady>` | once, when navigation mounts |
| ↳ `registerNavigationContainer(ref)` | SDK | `onNavigationReady` | same |
| ↳ `trackScreen("Decider")` | `navigationTracking.ts` | `onNavigationReady` | same — captures the initial route |
| `onNavigationStateChange(ref)` | `navigationTracking.ts` | `<NavigationContainer onStateChange>` | every route change, incl. tab switches |
| ↳ `setClarityScreen(name)` | `clarity.ts` | `trackScreen` | on change (normalised name) |
| ↳ `addBreadcrumb("navigate → X")` | `sentry.ts` | `trackScreen` | on change |
| `captureError(err, ctx)` | `sentry.ts` | `app/utils/logger.ts` via the reporter; directly from `Subscription.service.tsx` for payment failures | on handled errors worth reporting |
| `trackEvent(EVENTS.X)` | `clarity.ts` (as `sendClarityEvent`) | the ~20 call sites in §17 | on meaningful user actions |
| `setSentryTag(k, v)` | `sentry.ts` | `identity.ts`, and the Clarity session-started callback for `clarity_session_url` | on identify, on Clarity session start |
| `setClarityTag(k, v)` | `clarity.ts` | `identity.ts` | on identify |

---

## 27. Complete runtime flows

### App launch
```
index.js
 ↓
consoleGuard applied          (release: log/info/debug silenced; error/warn kept)
 ↓
initObservability()
 ├─ Sentry.init()             → JS handler + native handler installed, app-start txn begins
 ├─ setErrorReporter()        → logger.error now routes to Sentry
 └─ Clarity.initialize()      → async; recording begins shortly after
 ↓
App.tsx module body           (ErrorUtils handler installed ON TOP of Sentry's, delegating to it)
 ↓
registerRootComponent(Sentry.wrap(App))
 ↓
ThemeProvider → ErrorBoundary → UserProvider → …providers… → MainApp
 ↓
NavigationContainer onReady
 ├─ sentryNavigationIntegration.registerNavigationContainer(navigationRef)
 └─ trackScreen("Decider")    → Clarity screen name + Sentry breadcrumb
 ↓
Clarity session starts (async)
 └─ getCurrentSessionUrl() → Sentry.setTag("clarity_session_url", …)
```

### Login
```
User signs in (email / Google / Apple / Facebook)  —or— cold start re-auth from SecureStore
 ↓
Firebase onAuthStateChanged fires  →  setAuthUser(user)
 ↓
subscribeToUserData(uid) delivers userData
 ↓
setObservabilityUser(uid, userData)
 ├─ Sentry.setUser({ id: uid })
 ├─ Clarity.setCustomUserId(uid)
 └─ tags on both: is_subscribed, plan_type, is_founder, app_language, theme_mode
 ↓
trackEvent("signin_success")      → Clarity custom event
addBreadcrumb("signin_success")   → Sentry breadcrumb
 ↓
useInitialRoute decides → TabNavigator / Subscription / OnBoarding
 ↓
trackScreen(<normalised route>)
```

### Error
```
Something fails
 │
 ├─ render error       → ObservabilityErrorBoundary → Sentry.captureException + themed fallback UI
 ├─ unhandled JS error → App.tsx ErrorUtils handler → console.error → _defaultHandler (Sentry's) → Sentry
 ├─ unhandled rejection→ Sentry ReactNativeErrorHandlers → Sentry
 ├─ native crash       → sentry-cocoa / sentry-java → reported on NEXT app launch
 └─ handled error      → logger.error(err, ctx) → errorReporter → Sentry.captureException
 ↓
Sentry event assembled
 ├─ user: { id: uid }                     (nothing else — beforeSend enforces it)
 ├─ tags: release, environment, is_subscribed, plan_type, clarity_session_url, …
 ├─ breadcrumbs: last 50 (navigation, fetch, touch, console.error/warn)
 ├─ contexts + extra: deep-scrubbed by beforeSend
 └─ stack trace symbolicated via uploaded source maps / dSYMs
 ↓
You open the issue → click clarity_session_url → watch what the user was doing
```

### Logout
```
User taps Logout in the drawer → confirms
 ↓
BottomNavigator.tsx → handleLogout()
 ├─ updateDoc(users/{uid}, { token: deleteField() })
 ├─ removeCredentials()
 ├─ SecureStore.setItemAsync("loggedOut", "true")
 ├─ clearObservabilityUser()
 │    ├─ Sentry.setUser(null)
 │    └─ Clarity.startNewSession()   ← next user gets a fresh session, no stitching
 └─ navigation.navigate("Login")
 ↓
trackScreen("Login") → but "Login" is in SENSITIVE_SCREENS → Clarity.pause()
```

---

## 28. Testing / QA checklist

Run everything on a **physical** Android device (API 29+) and a **physical** iPhone (iOS 16+). Items marked 🔴 must be run on a **Release** build.

### Sentry

| # | Test | How to trigger | Where to confirm |
|---|---|---|---|
| 1 | JS exception | temp debug button → `Sentry.captureException(new Error("Buez smoke test"))` | *Issues* — appears within ~30 s |
| 2 | Unhandled promise rejection | `Promise.reject(new Error("unhandled test"))` with no `.catch` | *Issues* — mechanism marked unhandled |
| 3 | ErrorBoundary error | `throw new Error("render test")` inside a screen's render | fallback UI shows **and** event appears |
| 4 | **Global `ErrorUtils` chain** | `setTimeout(() => { throw new Error("global test") }, 0)` — outside React | event appears → **proves `_defaultHandler` delegation is intact (§13.5)** |
| 5 | Native crash iOS 🔴 | `Sentry.nativeCrash()`, then **kill and relaunch the app** | *Issues* — symbolicated with method names |
| 6 | Native crash Android 🔴 | same | appears; ⚠️ Java frames may be degraded on New Arch (§5.2) — record what you see |
| 7 | API error | point a `fetch` at a 500 endpoint | error event + HTTP breadcrumb with **no query string** |
| 8 | Firestore error | call a Firestore query the rules deny, routed through `logger.error` | event with your `extra` context |
| 9 | Breadcrumbs | navigate 5 screens, then trigger test #1 | the navigation trail is in the event |
| 10 | User ID | log in, then trigger test #1 | `user.id` = Firebase UID; **no email, no username, no ip_address** |
| 11 | Release 🔴 | any event from a release build | tagged `com.adamburg.Buez@1.0.1+4` — **and identical on both platforms (§24)** |
| 12 | Environment | dev vs release | `development` / `production`; ideally *no* dev events at all since Sentry is disabled in `__DEV__` |
| 13 | Source maps 🔴 | inspect any JS stack trace | `.tsx` filenames and line numbers, **not** `index.android.bundle:1:284910` |
| 14 | iOS symbolication 🔴 | test #5 | *Releases → Artifacts* shows a non-zero dSYM count |
| 15 | Android symbolication 🔴 | test #6 | JS frames readable; Java frames readable (minify is off, so no mapping needed) |
| 16 | **PII scrubbing** 🔴 | type a real password into `Login`, force a failure, trigger an error | **search the raw event JSON for the password, the email, and `sntrys_`. All three must be absent.** |
| 17 | Performance | cold start + navigate 5 screens | *Performance* shows an app-start transaction and navigation transactions |
| 18 | Quota sanity | after 48 h in production | *Stats* — error volume well under 5,000/month pace |

### Clarity

| # | Test | How | Where to confirm |
|---|---|---|---|
| 19 | Initialization | run with `logLevel: Verbose` | logcat / Xcode console shows Clarity init with no errors |
| 20 | Recording arrives | use the app for 2 min | **Real-time recordings** immediately; the completed session after **~2 hours** |
| 21 | Screen names | navigate Home → MyRequests → PostRequest → Settings | replay shows `Home`, `MyRequests`, `PostRequest`, `Settings` — **not** `UIViewController` and **not** `"My Req"` |
| 22 | **Localized names** | switch the app to German, repeat test #21 | ⚠️ names must be **identical** to the English run — this proves §16.1's normalisation works |
| 23 | User ID | log in | session shows the Firebase UID as custom user id |
| 24 | Custom events | post a task, view the paywall | `task_posted`, `paywall_viewed` visible on the session timeline |
| 25 | Taps | tap around | taps visible in the replay and on the heatmap |
| 26 | Rage taps | tap a dead area 5× rapidly | flagged as a rage tap |
| 27 | Dead taps | tap non-interactive whitespace | flagged as a dead tap |
| 28 | **Excluded screens** | open `Login`, `Chat`, `EditProfile`, then watch the replay | **no readable password, message text, email or phone anywhere** |
| 29 | WebView | open the Instagram/Facebook login WebView | WebView content is **not** captured |
| 30 | Logout → new session | log out, log in as a second user | two distinct sessions with different custom user ids; no stitching |
| 31 | Unsupported OS | run on an Android API 28 device and/or an iOS 15 device | app works normally, **no crash**; no Clarity session (expected) |
| 32 | Offline | airplane mode, use the app, reconnect | Android: session uploads later. iOS: session lost (expected, documented) |
| 33 | Overhead | compare `[launch] cold start` from `launchMetrics.ts` before/after | **[REC]** investigate if the regression exceeds ~50 ms |
| 34 | Binary size | compare IPA/AAB before/after | ~+1 MB iOS, ~+0.5 MB Android expected |

### Cross-tool

| # | Test | Confirm |
|---|---|---|
| 35 | Session link | trigger an error mid-session | the Sentry event has a `clarity_session_url` tag that opens **the right replay** |
| 36 | Shared identity | search the Firebase UID in both dashboards | the same user resolves in both |

**Before shipping: remove every temporary test trigger** (the debug button, the deliberate throws, `nativeCrash` calls).

---

## 29. Development vs production

### Development

| | Setting | Why |
|---|---|---|
| Sentry | **disabled** (`enabled: !__DEV__`) | 5,000 errors/month is small; a week of Metro reloads and deliberate crashes would eat it. Flip `SENTRY_FORCE_DEV` in `config.ts` when you are specifically testing the integration |
| Sentry `debug` | `true` **only** when force-enabled | prints what the SDK is doing; noisy otherwise |
| Sentry `tracesSampleRate` | `1.0` when force-enabled | you want to see every transaction while wiring it up |
| Clarity | **disabled** (`CLARITY_ENABLED` false in `__DEV__`) | keeps developer sessions out of your behavioural data; otherwise your funnels are polluted by you |
| Clarity `logLevel` | `Verbose` when force-enabled | this is how you diagnose "no sessions appearing" |
| Console logging | full (`consoleGuard` only acts in release) | unchanged |
| `LogBox.ignoreAllLogs()` | **[REC] comment it out while testing** | you will not see RN warnings during integration work otherwise |

### Production

| | Setting |
|---|---|
| Sentry `enabled` | `true` |
| Sentry `environment` | `production` |
| Sentry `debug` | `false` |
| Sentry `tracesSampleRate` | **0.1** |
| Sentry `profilesSampleRate` | **0** |
| Sentry `replaysSessionSampleRate` / `replaysOnErrorSampleRate` | **0 / 0** — Clarity owns replay |
| Sentry `sendDefaultPii` | **`false`** |
| Sentry `beforeSend` / `beforeBreadcrumb` | active (§19) |
| Sentry `ignoreErrors` | offline + user-cancellation noise |
| Sentry spike protection | **configured in project settings on day one** |
| Clarity `logLevel` | `None` (the default) |
| Clarity masking | strictest available |
| Clarity disallowed screens | the §18.3 list applied |
| Clarity WebView capture | **OFF** |
| Clarity low-end-device disabling | **ON** |
| Console logging | `log/info/debug` stripped by Babel **and** neutered by `consoleGuard`; `error`/`warn` preserved |

---

## 30. Final implementation order

**Phase 0 — gates** (these can change the plan; do them first)
1. `xcodebuild -version` → decide Sentry v8 vs v7.13.0 (§5.1)
2. Decide: is Clarity replacing Firebase Analytics for funnels, or joining it? (§31)
3. Create a branch. Commit a clean baseline of `ios/` and `android/` so you can diff prebuild's output.
4. Pull your Android API-level / iOS-version distribution to size the Clarity coverage gap (§21.1)

**Phase 1 — accounts**
5. Create the Sentry org + `buez` project; copy DSN, org slug, project slug
6. Create the Sentry auth token (`project:releases`, `org:read`)
7. **Configure Sentry spike protection / rate limits immediately**
8. Create the Clarity mobile project; copy the Project ID
9. **Configure Clarity masking, disallowed screens, WebView-off and low-end-device-off in the dashboard — before the first build**

**Phase 2 — environment**
10. Add `EXPO_PUBLIC_SENTRY_DSN` and `EXPO_PUBLIC_CLARITY_PROJECT_ID` to `.env`
11. Create `.env.local` with `SENTRY_AUTH_TOKEN`
12. Add `ios/sentry.properties` and `android/sentry.properties` to `.gitignore`

**Phase 3 — packages & native config**
13. `npx expo install @sentry/react-native` (expect the ENOTEMPTY / patch-package trouble from §6.4)
14. `npm install @microsoft/react-native-clarity`
15. `rm -rf ios/Pods ios/Podfile.lock && cd ios && pod install`
16. Create `metro.config.js`; run `npx expo start -c` and confirm the dev bundle still builds — **highest-blast-radius change**
17. Add the Sentry plugin to `app.json`, last in `plugins`
18. **[REC]** reconcile the version mismatch (§24) — add `expo.android.versionCode`
19. `npx expo prebuild` once, on its own. **Diff `ios/` and `android/`** against the §7.3 checklist
20. Add `auth.token=` to `ios/sentry.properties`

**Phase 4 — observability layer**
21. Create `app/observability/` (`config`, `sentry`, `clarity`, `screenPolicy`, `events`)
22. Wire `initSentry()` + `setErrorReporter()` in `index.ts`
23. Wire `initClarity()` + the session-URL cross-link
24. `index.js`: one import after `consoleGuard`
25. `App.tsx`: `Sentry.wrap(App)` — **verify the `ErrorUtils` delegation still reads `_defaultHandler(error, isFatal)`**
26. Create `ErrorBoundary.tsx`; mount it inside `ThemeProvider`

**Phase 5 — instrumentation**
27. `navigationTracking.ts` incl. the localized-tab-name alias map (§16.1); wire the two `NavigationContainer` props
28. `identity.ts`; call `setObservabilityUser` from `user.context.tsx`
29. Call `clearObservabilityUser()` from `handleLogout` **and** `handleDeleteAccount` in `BottomNavigator.tsx`
30. Add the P0 custom events + breadcrumbs (auth, paywall, task lifecycle) — §17
31. Add the `pause()`/`resume()` guard for sensitive screens

**Phase 6 — build & test**
32. Debug build, both platforms, physical devices, Clarity `Verbose`
33. Run the §28 checklist (non-🔴 items)
34. Release build, both platforms
35. Re-run the full §28 checklist including all 🔴 items
36. Verify the Sentry release page: source maps uploaded, dSYM count > 0, release string identical across platforms
37. Verify Clarity: session present after ~2 h with screen names, custom user id, tags and events
38. **Personally watch one replay each of a chat session and a paywall session, looking for leakage**

**Phase 7 — production**
39. Verbose logging off; test triggers removed; production sampling set
40. Update `PrivacyPolicy.tsx`, the App Store privacy questionnaire and the Play Data Safety form (§31)
41. Work the production checklist
42. Bump versions in `app.json`, `npx expo run:ios`, archive, upload via Organizer
43. Watch error volume against the 5,000/month budget for 48 h; tighten `ignoreErrors` / sampling if needed

---

## 31. Restrictions honoured, and open decisions

### What I did and did not do

✅ Inspected the repo (package.json, app.json, eas.json, index.js, App.tsx, babel.config.js, tsconfig.json, .env keys, .gitignore, Podfile, Podfile.properties.json, android/build.gradle, android/app/build.gradle, gradle.properties, StackNavigator.tsx, BottomNavigator.tsx, navigationRef.ts, InitialRoute.tsx, user.context.tsx, logger.ts, consoleGuard.ts, Auth.service.tsx, Subscription.service.tsx, Post.service.tsx, Review.service.tsx, useDeepLinking.ts, locales) and read the published Sentry and Clarity documentation and packages.

❌ Did **not**: modify any file, install any package, run any command, create any config file, hand-edit `ios/` or `android/`, or change existing architecture. The only new file in the repo is this guide. `git status` shows no changes to code (the modified files it lists were already dirty before this session started).

### Restrictions this plan respects

| Restriction | How |
|---|---|
| Prefer Expo config/plugin configuration | Sentry via `@sentry/react-native/expo`; Clarity needs none. Zero hand-edits to native folders (§7) |
| Preserve existing architecture | one new folder; SDKs never imported from screens or services |
| Do not remove existing logging | `logger.ts` untouched; `consoleGuard` and `babel.config.js` untouched |
| Do not remove existing `ErrorUtils` handling | §13.5 explains why the delegation must stay, with a specific test to prove it |
| Do not introduce another navigation system / Expo Router | uses the existing `navigationRef` and the single `NavigationContainer`. Note: `expo-router` is installed and registered as a plugin but is **not** the entry — do not follow Sentry's expo-router docs |
| Do not add unnecessary analytics | two SDKs only; event list is 20 named events, no payloads |
| Do not expose secrets | §3.4, §8.2, §8.5 |
| Do not collect unnecessary PII | UID only; §15, §18, §19 |
| Do not use Sentry Replay alongside Clarity | both replay rates `0`, with the reason stated (§2) |

### Open decisions — I need your answers before implementation

1. **`xcodebuild -version`?** Decides Sentry v8 vs v7.13.0. Everything else is ready.
2. **Clarity vs Firebase Analytics.** Your August 2026 observability decision was explicitly *"Firebase Analytics for CTA/funnel/drop-off tracking (**replaces Clarity**)"*. Adding Clarity means the two overlap on funnels and drop-off. That's a reasonable change of mind — Clarity gives you replay and rage-tap detection that Firebase Analytics cannot — but **pick one owner for funnel data** or you'll have two dashboards that disagree. My suggestion: Clarity owns qualitative (replay, heatmaps, rage/dead taps), Firebase Analytics owns quantitative (retention, cohorts, conversion counts) — or drop Firebase Analytics from the plan entirely.
3. **EU users?** If yes, Clarity's `consent(adsStorage, analyticsStorage)` must be gated behind a consent banner, with `pause()` as the default state. Microsoft puts the burden of collecting consent entirely on you [DOC].
4. **Version mismatch (§24)** — fix it as part of Phase 3, or as a separate change first?
5. **One Sentry seat** — workable, or do you need Team ($26/mo, 50k errors, unlimited users) from day one?
6. **PostRequest and OfferDetail in Clarity** — keep them recorded (with strict masking) for the conversion funnel, or exclude them because they show free-text task descriptions? I'd keep them and verify with a real replay, but it's your call on the data.

### Also required before production (not code)

- Update `app/screens/PrivacyPolicy.tsx` — the app ships an in-app privacy policy and it becomes inaccurate the moment these SDKs ship.
- Update the **App Store** privacy questionnaire: both SDKs collect *Diagnostics*; Clarity also collects *Product Interaction*. Neither requires ATT with the configuration in this plan, but the nutrition label must change.
- Update the **Play Console** Data Safety form for the same reasons.
- Verify the aggregated iOS privacy manifest after prebuild (`apple.privacyManifestAggregationEnabled` is already `true`).
