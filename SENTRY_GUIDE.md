# Sentry in Buez — Team Guide

> How crash & error reporting is set up in the Buez app, how to read the Sentry
> dashboard, and how to find and fix problems. Written in plain language.
>
> Dashboard: **https://sana-asghar.sentry.io** → project **buez-app**
> Last updated: October 2026 · SDK: `@sentry/react-native` 8.30.0

---

## Contents

1. [What Sentry does](#1-what-sentry-does)
2. [How it is built into the app](#2-how-it-is-built-into-the-app)
3. [Privacy — what is and isn't sent](#3-privacy--what-is-and-isnt-sent)
4. [Readable stack traces (build-time uploads)](#4-readable-stack-traces-build-time-uploads)
5. [Settings you control](#5-settings-you-control)
6. [Using the Sentry dashboard](#6-using-the-sentry-dashboard)
7. [Finding what went wrong — step by step](#7-finding-what-went-wrong--step-by-step)
8. [Resolving issues](#8-resolving-issues)
9. [Alerts](#9-alerts)
10. [Troubleshooting](#10-troubleshooting)
11. [Rules for developers](#11-rules-for-developers)
12. [Release checklist](#12-release-checklist)
13. [Setting up on a new machine](#13-setting-up-on-a-new-machine)

---

## 1. What Sentry does

Sentry is a **crash and error reporter**. Whenever something goes wrong in the
app — on any user's phone — Sentry sends a report to the dashboard telling us:

- **What** broke — the error message
- **Where** in the code — file name and line number
- **Who** it happened to — an anonymous Firebase user ID only
- **What the user did just before** — screens visited, buttons tapped, actions taken
- **On which phone, OS version and app version**

We no longer need to wait for users to complain or guess what happened.

> **Sentry vs Clarity:** Sentry answers *"what technically went wrong?"*.
> Microsoft Clarity (planned next) will answer *"what was the user doing?"* with
> session recordings. Both will share the same user ID so an error can be
> linked to its recording.

---

## 2. How it is built into the app

### 2.1 Where the code lives

All monitoring code is in **`app/observability/`**. Screens and services never
import `@sentry/react-native` directly — they use this folder.

| File | Purpose |
|---|---|
| `config.ts` | On/off switch, environment (`development` / `production`), tracing settings |
| `sentry.ts` | Starts Sentry, connects `logger.error` to it, wraps the root component |
| `init.ts` | Runs the start-up as early as possible |
| `scrub.ts` | **Privacy filter** — removes emails, tokens, passwords, query strings before sending |
| `ErrorBoundary.tsx` | Shows a translated "Something went wrong / Try again" screen instead of a blank app, and reports the crash |
| `screens.ts` | Converts screen names to fixed, language-independent names (`Inicio` → `home`) |
| `navigation.ts` | Records every screen change |
| `identity.ts` | Attaches the user ID after login, removes it on logout |
| `events.ts` | Records important business actions (login, task posted, subscription…) |
| `index.ts` | Public entry point — import from here |

Other files touched:

| File | Change |
|---|---|
| `index.js` | Starts Sentry right after `consoleGuard`, before the app loads; wraps `App` |
| `App.tsx` | `<AppErrorBoundary>` around all screens; identity sync hook |
| `app/router/StackNavigator.tsx` | `onReady` / `onStateChange` → screen tracking |
| `app/utils/logger.ts` | (existing) `logger.error` now reports to Sentry |
| Login / Signup / Google / Apple / Facebook / Instagram login | Set user ID + `login_success` / `signup_success` |
| `app/router/BottomNavigator.tsx` | Logout + delete account clear the user ID |
| `metro.config.js` | Adds Sentry's source-map support to the JS bundler |
| `ios/Buez.xcodeproj` | Build phases that upload source maps + debug symbols |
| `android/app/build.gradle` | Applies `sentry.gradle.kts` (source-map upload) |
| `package.json` | `expo.autolinking.exclude` for Sentry (prevents double linking on Android) |

### 2.2 What happens when the app starts

```
index.js
  ├─ consoleGuard        (silences console.log in release)
  ├─ observability/init  → Sentry.init(...)  ← starts listening immediately
  └─ registerRootComponent(wrapRootComponent(App))
        └─ App.tsx
             └─ ThemeProvider
                  └─ AppErrorBoundary   ← catches screen crashes
                       └─ providers → NavigationContainer → screens
```

### 2.3 What is caught automatically

| Situation | How it reaches Sentry |
|---|---|
| A screen crashes while rendering | Error boundary → fallback screen → report |
| Any uncaught JavaScript error | Sentry's global error handler (the old handler in `App.tsx` passes errors on to it — **do not remove it**) |
| Every `logger.error(...)` in services | Forwarded automatically, with its context |
| Native iOS / Android crash | Sentry native SDK |
| Promise rejected with no `catch` | Reported as an error |

### 2.4 The "trail" before each error (breadcrumbs)

Every error comes with a timeline of what happened just before it:

| Breadcrumb | Example |
|---|---|
| `navigation` | `home → offer_detail` (stable names, **never** screen params) |
| `touch` | Taps — labelled only by `accessibilityLabel` / `testID`, **never** visible text |
| `xhr` / `fetch` | Network calls — URL without query string, status code |
| `app.event` | `login_success`, `task_posted`, `subscription_started`… |
| `console` | `console.warn` / `console.error` messages |

### 2.5 Business events we track

Defined once in `app/observability/events.ts`. Always use these exact names.

| Event | Where it fires |
|---|---|
| `login_success` (with `method`: email / google / apple / facebook / instagram) | Each login flow |
| `signup_success` | `Signup.tsx` |
| `logout`, `account_deleted` | Settings drawer |
| `subscription_started` (with `plan`) | `Subscription.service.tsx` → `handlePaymentSheet` |
| `subscription_upgraded`, `subscription_cancelled` | `UpgradePlan.tsx`, `CancelSubscription.tsx` |
| `task_posted`, `task_reposted`, `task_edited` | `PostRequest.tsx` |

Not yet wired (planned with Clarity): `task_applied`, `task_completed`.

### 2.6 Stable screen names

The bottom tabs are named with translated text, so the same tab is "Home",
"Inicio", "Accueil"… `screens.ts` maps them all to one fixed name:

| Tab | Screen key |
|---|---|
| My Requests | `my_requests` |
| Post Request | `post_dashboard` |
| Home | `home` |
| Messages | `messages` |
| Settings | `settings` |

All other screens use their route name in snake_case: `OfferDetail` →
`offer_detail`, `OTPInput` → `otp_input`. If you add a new tab or a new
language, update `screens.ts` (it reads all locale files automatically).

---

## 3. Privacy — what is and isn't sent

| ✅ Sent | ❌ Never sent |
|---|---|
| Firebase UID (anonymous ID) | Email, name, phone number |
| Device model, OS version | IP address (`sendDefaultPii: false`) |
| App version / build | Passwords, tokens, cookies, auth headers |
| Screen names | Screenshots, screen contents, view hierarchy |
| Error message + stack trace | URL query strings (e.g. Firestore session IDs) |
| Breadcrumbs (as above) | Screen parameters (task IDs, user data) |

`scrub.ts` runs on **every** event and breadcrumb as a second safety net: any
field whose name looks like `password`, `token`, `secret`, `email`, `phone`,
`card`, `otp`… is replaced with `[Filtered]`, and email addresses inside text
are removed.

---

## 4. Readable stack traces (build-time uploads)

Release builds are **minified** — the code is squashed into one file. Without
help, Sentry would show `index.android.bundle:1:928374`.

So every **release build** uploads:

- **Source maps** — translate the squashed JavaScript back to real file + line
- **Debug files (dSYMs, iOS)** — the same for native iOS crashes

This happens automatically in:

| Platform | Command |
|---|---|
| iOS | Xcode **Product → Archive**, or `npx expo run:ios --configuration Release` |
| Android | `cd android && ./gradlew assembleRelease` (or `bundleRelease`) |

Debug / dev builds skip the upload.

**Release names** link each crash to the right files:

- iOS: `com.adamburg.Buez@2.0+3` (version 2.0, build 3)
- Android: `com.adamburg.buez@2.0+7` (version 2.0, versionCode 7)

**Check it worked:** Sentry → **Settings → buez-app → Source Maps** (one upload
per platform per release) and **Debug Files** (iOS dSYMs).

> ⚠️ If the upload fails (no internet, invalid token), **the release build
> fails on purpose** — so we never ship a version with unreadable crashes.
> Emergency bypass: run the build with `SENTRY_ALLOW_FAILURE=true`.

---

## 5. Settings you control

In `.env` (not committed):

| Variable | Meaning |
|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | Where errors are sent. Copy **only** from Sentry → Settings → buez-app → **Client Keys (DSN)** |
| `EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV` | `true` = dev builds also report (environment `development`). **Set `false` before store releases.** Store builds always report regardless |

After changing `.env`: `npx expo start --clear`.

In `ios/sentry.properties` and `android/sentry.properties` (**gitignored —
never commit**):

```
defaults.url=https://sentry.io
defaults.org=sana-asghar
defaults.project=buez-app
auth.token=<organization auth token>
```

---

## 6. Using the Sentry dashboard

### 6.1 Main pages

| Page | What it shows |
|---|---|
| **Issues** | All errors, grouped. 100 users hitting the same bug = 1 issue with 100 events |
| **Projects → buez-app** / **Releases** | Each app version and its **crash-free sessions %** (stability) |
| **Settings → buez-app → Source Maps** | Uploaded source maps per release |
| **Settings → buez-app → Debug Files** | iOS dSYMs |
| **Alerts** | Email notifications |

### 6.2 Filters on the Issues page

- **Environment:** `production` = real users, `development` = our testing
- **Time range:** 24h / 7d / 14d / 30d
- **Sort:** *Users* (how many people) is usually the most useful

Search examples:

```
screen:offer_detail                      errors on one screen
user.id:<firebase uid>                   everything for one user (support tickets)
release:com.adamburg.Buez@2.0+3          errors in one version
os.name:Android                          one platform
is:unresolved                            open issues (default)
is:unhandled                             real crashes only
```

### 6.3 Reading one issue (top to bottom)

1. **Title / message** — e.g. `TypeError: Cannot read property 'id' of undefined`
2. **Events / Users** — how often, how many people. Prioritise by **users**
3. **First seen / Last seen / Release** — when it started, which version
4. **Stack trace** — our files are highlighted, library files greyed out. The
   first highlighted line is usually where to look
5. **Breadcrumbs** — the timeline just before the error, e.g.:
   ```
   navigation  home → offer_detail
   app.event   login_success (method: google)
   touch       Apply button
   http        POST buez-server-khaki.vercel.app/api/...   500
   error       TypeError ...
   ```
6. **Tags** — `screen`, `environment`, `release`, OS, device, `handled`
7. **User** — Firebase ID only
8. **Contexts** — device model, memory, OS, app version

---

## 7. Finding what went wrong — step by step

1. **Issues** → Environment `production` → **Sort by Users**. Biggest impact first.
2. Open the top issue and read the **title** — what kind of error?
3. **Stack trace** — find the first line in *our* code (`app/...`). Start there.
4. **Breadcrumbs** — read from the bottom up: which screen, what was tapped,
   did a network call fail just before?
5. **Tags** — patterns:
   - only Android / one OS version → platform-specific bug
   - only one `screen` → bug is in that screen
   - only one `release` → something changed in that version
6. **First seen / trend** — did it start with a new release? Is it growing?
7. **Reproduce** on the simulator by following the breadcrumbs. With
   `ENABLE_IN_DEV=true` your test errors appear under `development`.
8. **User reports a problem?** Search `user.id:<their uid>` to see exactly
   what they hit.

**Real example (already fixed):** Sentry reported
`watchPositionImplAsync … Location permission is required`. The stack trace
pointed to `app/utils/useLocation.tsx`; it happened on every launch when
location permission was missing. Fix: check permission before watching
location, and catch errors.

---

## 8. Resolving issues

**In code:** fix → new build → release.

**In Sentry** (buttons at the top of an issue):

| Action | When |
|---|---|
| **Resolve → In the next release** | ✅ Best after a fix. Auto-reopens as **Regressed** if it happens again in a newer version |
| **Resolve** (now) | Test errors / one-off problems |
| **Archive / Ignore** | Known harmless noise. Can ignore "until it happens X more times" |
| **Assign** | Give to a developer (needs Team plan for multiple users) |
| **Merge** | Two issues that are the same bug |

Issue states: **New → Ongoing → Resolved**, then **Regressed** (came back) or
**Escalating** (suddenly increasing).

---

## 9. Alerts

Recommended (Sentry → **Alerts → Create Alert → Issues**):

- *"A new issue is created"*, environment `production` → email
- *"Issue changes state to escalating"* → email

**Spike protection** is enabled, so a sudden flood can't use up the free plan
quota (5,000 errors / month, 30-day retention, 1 user seat).

---

## 10. Troubleshooting

| Problem | Cause & fix |
|---|---|
| Nothing appears in Sentry | Wrong DSN → re-copy from **Client Keys**. For dev builds, `ENABLE_IN_DEV=true` + `npx expo start --clear`. The app may log "200 OK" even with a wrong DSN — Sentry silently drops it |
| Stack trace shows `index.bundle:1:9283` | No source maps for that release → check **Source Maps** page, rebuild |
| Release build fails at a Sentry step | Token missing / expired in `sentry.properties`, or offline → fix, or `SENTRY_ALLOW_FAILURE=true` |
| Wrong user on an issue | A login/logout flow is missing `identifyCurrentUser()` / `clearUserIdentity()` |
| `screen` tag is `unknown` | New tab label / language not in `screens.ts` |
| Dev errors eating the quota | `EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV=false` |
| `./gradlew clean` fails (CMake / codegen error) | Known New-Architecture issue. Use instead: `rm -rf android/app/.cxx android/app/build android/build node_modules/@sentry/react-native/android/build` |
| Android build: `:sentry-react-native` vs `:sentry_react-native` codegen error | Sentry is being linked twice. Keep `"expo": { "autolinking": { "exclude": ["@sentry/react-native"] } }` in `package.json` |
| Red screen "Requiring unknown module undefined" at start | Sentry's `ExpoUpdatesListener` integration — keep it disabled in `sentry.ts` (`expo-updates` isn't installed) |

---

## 11. Rules for developers

- **Use `logger.error(error, context)`** (from `app/utils/logger.ts`) instead of
  `console.error` in new code — it reaches Sentry with context.
- **Never import `@sentry/react-native`** in screens/services — use
  `app/observability`.
- **Never put personal data** in `trackEvent` data or error messages (no email,
  name, phone, free text, IDs of other users).
- **New business event?** Add it to the `AppEvent` list in `events.ts` first.
- **New login method?** Call `identifyCurrentUser()` after success.
  **New logout path?** Call `clearUserIdentity()`.
- **Never run `npx expo prebuild`** or **`npx @sentry/wizard`** in this
  project — both overwrite hand-made native changes (entitlements, manifest,
  icons, Sentry build phases).
- **Do not remove** the global error handler in `App.tsx` — it passes errors on
  to Sentry.

---

## 12. Release checklist

Before each App Store / Play Store release:

- [ ] `EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV=false` in `.env`
- [ ] Bump versions in **both** `app.json` and native files
      (`ios/Buez/Info.plist`, `android/app/build.gradle`) — each release needs a
      unique name in Sentry
- [ ] `ios/sentry.properties` and `android/sentry.properties` exist with a valid token
- [ ] After building: **Settings → Source Maps** shows the new release for both
      platforms; **Debug Files** shows new iOS dSYMs
- [ ] After release: watch **Issues** (production) and crash-free sessions for
      the new version for a few days
- [ ] Rotate the auth token periodically (Settings → Developer Settings →
      Organization Tokens)

---

## 13. Setting up on a new machine

1. `npm install`, `cd ios && pod install`
2. Add Sentry values to `.env` (DSN from Client Keys, `ENABLE_IN_DEV` as needed)
3. Create `ios/sentry.properties` and `android/sentry.properties` with the
   content shown in [section 5](#5-settings-you-control). Get an auth token from
   **https://sana-asghar.sentry.io/settings/auth-tokens/** (Organization Token)
4. Verify: `cd ios && SENTRY_PROPERTIES=sentry.properties npx sentry-cli info`
   → should show org `sana-asghar`, project `buez-app`
