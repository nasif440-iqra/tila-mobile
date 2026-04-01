# Domain Pitfalls

**Domain:** React Native / Expo app hardening for App Store submission
**Researched:** 2026-03-31

## Critical Pitfalls

Mistakes that cause App Store rejection or data loss.

### Pitfall 1: Database Initialization Hangs With No Recovery Path

**What goes wrong:** `getDatabase()` is a promise with no `.catch()` in `DatabaseProvider`. If SQLite fails to open (corrupted file, disk full, OS-level lock), the app shows the loading fallback forever. Apple reviewers see a frozen app and reject immediately under Guideline 2.1 (Performance: App Completeness).

**Why it happens:** The happy path works 99.9% of the time in development. The failure mode only appears on real devices under edge conditions (low storage, interrupted migration, OS upgrade changing SQLite behavior).

**Consequences:** Permanent loading screen. No way to recover. User must force-quit and hope for the best. Apple reviewer sees a broken app on first launch.

**Prevention:**
1. Add `.catch()` to `getDatabase()` in `DatabaseProvider` -- show an error screen with "Reset Data" and "Try Again" buttons
2. Add a timeout (e.g., 10 seconds) -- if DB hasn't initialized, show error state
3. Wrap migration steps individually so one failing migration doesn't block app launch

**Detection:** App stays on splash/loading screen for more than 5 seconds in production. Sentry should capture unhandled promise rejections from `expo-sqlite`.

**Phase:** Must be fixed in first phase -- blocks App Store submission.

---

### Pitfall 2: Missing "Restore Purchases" Button in Accessible Location

**What goes wrong:** Apple explicitly requires a visible "Restore Purchases" mechanism for all apps with auto-renewable subscriptions. The RevenueCat paywall handles restore internally, but if a user isn't on the paywall screen, there's no standalone restore button (e.g., in Settings or profile). Reviewers reject under Guideline 3.1.1 (In-App Purchase).

**Why it happens:** RevenueCat's paywall UI handles restore, so developers assume that's sufficient. Apple wants restore accessible *without* having to trigger the paywall flow.

**Consequences:** App Store rejection. Common enough that RevenueCat has a dedicated docs page about it.

**Prevention:**
1. Add a "Restore Purchases" button in a settings/account area (not just inside the paywall)
2. Wire it to `Purchases.restorePurchases()` from RevenueCat
3. Show success/failure feedback to the user
4. Test the flow: purchase on device A, install on device B, restore, verify unlock

**Detection:** Search the codebase for "restore" outside of paywall.ts. If it only exists inside the paywall flow, it's not sufficient.

**Phase:** Must be fixed before App Store submission. Part of monetization hardening.

---

### Pitfall 3: No Privacy Policy Link in App or App Store Connect

**What goes wrong:** Apple requires a privacy policy URL in App Store Connect metadata AND accessible within the app itself. Tila uses PostHog (analytics) and Sentry (crash reporting) -- both collect data. No `privacy policy` or `terms of service` references found anywhere in the codebase. Rejection under Guideline 5.1.1 (Data Collection and Storage).

**Why it happens:** Privacy policy feels like a legal task, not a code task, so it gets deferred until submission time -- then causes a rejection loop.

**Consequences:** Guaranteed rejection. Apple won't even look at the app without a privacy policy URL.

**Prevention:**
1. Write a privacy policy covering: PostHog analytics data, Sentry crash data, SQLite local storage, RevenueCat purchase data
2. Host it at a permanent URL (e.g., tilaapp.com/privacy)
3. Add a link in the app (settings screen or onboarding footer)
4. Fill in the App Store Connect privacy policy URL field
5. Complete the App Privacy questionnaire in App Store Connect (data types collected, purposes, linked to identity or not)

**Detection:** `grep -r "privacy" src/` returns zero results. This is missing.

**Phase:** Must be done before App Store submission. Can be done in parallel with code fixes.

---

### Pitfall 4: Unhandled Promise Rejections Crash Production Builds

**What goes wrong:** In development, unhandled promise rejections show yellow warnings. In production builds, they can crash the app silently or trigger iOS/Android crash handlers. Tila has multiple fire-and-forget async calls: `initRevenueCat()` (line 55 of _layout.tsx, no .catch), audio `play()` calls, and the SubscriptionProvider's `Purchases.getCustomerInfo()`.

**Why it happens:** Development builds are forgiving. `__DEV__` mode surfaces warnings instead of crashes. Production Hermes/JSC treats unhandled rejections differently.

**Consequences:** Random crashes during App Store review. Crash on launch if RevenueCat SDK isn't configured. Crash when playing audio on a device with audio session conflicts.

**Prevention:**
1. Audit every `.then()` call and ensure it has a `.catch()` or is in a try/catch async function
2. Add a global unhandled promise rejection handler: `global.ErrorUtils` or React Native's `LogBox` equivalent for production
3. Specifically fix: `initRevenueCat()` call in _layout.tsx (wrap in try/catch), audio playback (await + catch), DB initialization

**Detection:** Search for `.then(` without a corresponding `.catch(`. Search for `async` functions without try/catch around await calls to external SDKs.

**Phase:** First phase -- these cause crashes during review.

---

### Pitfall 5: SQLite Data Stored in iCloud-Backed Directory

**What goes wrong:** By default, iOS backs up app data (including Documents directory) to iCloud. Apple rejects apps that store regeneratable data (like caches or databases that can be reconstructed) in iCloud-backed locations, or that use excessive iCloud storage. Guideline 2.5.2 requires that apps store only user-created data in iCloud. Tila's SQLite DB contains learning progress (user-created) but also cached/computed mastery data.

**Why it happens:** `expo-sqlite` stores databases in the app's Documents directory by default. No `isExcludedFromBackup` flag is set anywhere in the codebase.

**Consequences:** Apple may reject for excessive iCloud backup usage. More commonly: if the DB grows large, users complain about iCloud storage consumption, leading to negative reviews.

**Prevention:**
1. This is lower risk for Tila since the DB is small and contains genuine user progress data (which is appropriate for backup)
2. If Apple raises this, set the `isExcludedFromBackup` attribute on the DB file -- but this means progress is lost on device reset
3. Monitor DB file size -- if it stays under a few MB, this is unlikely to be flagged

**Detection:** Check if Apple raises this during review. Pre-emptively, check `expo-sqlite` docs for backup exclusion options.

**Phase:** Monitor during submission. Only fix if Apple flags it.

---

### Pitfall 6: RevenueCat SDK Crashes When Not Configured

**What goes wrong:** `SubscriptionProvider` calls `Purchases.getCustomerInfo()` on mount. If `initRevenueCat()` returned early (no API key), the SDK is unconfigured and this call throws. The `.catch()` in the provider swallows the error and sets `loading: false`, but any subsequent call to `Purchases` methods (like during paywall presentation) will crash.

**Why it happens:** The init function silently skips configuration when API keys are missing, but the rest of the monetization layer assumes the SDK is ready.

**Consequences:** Crash when tapping "Upgrade" or encountering a premium lesson gate. During App Store review, if the reviewer's sandbox environment has issues, the paywall crashes.

**Prevention:**
1. Track initialization state: export an `isRevenueCatInitialized()` function
2. Guard all `Purchases.*` calls behind the initialization check
3. When SDK is not initialized, show graceful degradation (e.g., "Purchases unavailable" or treat as free tier)
4. Never present paywall if SDK isn't initialized

**Detection:** Set API key to empty string in .env and launch the app. Tap any premium lesson. If it crashes, this pitfall is active.

**Phase:** First phase -- crashes during review are fatal.

## Moderate Pitfalls

### Pitfall 7: Quiz Hook Ref Never Resets Between Lesson Transitions

**What goes wrong:** `useLessonQuiz` uses `generatedRef.current = true` to prevent re-generating questions. If the component unmounts and remounts with a different lesson (e.g., user goes back to home and picks another lesson), the ref persists if React reuses the fiber, and no questions are generated.

**Why it happens:** React refs don't reset on prop changes. The hook depends on `generatedRef` to gate question generation, but the ref is initialized once per component lifecycle. With Expo Router's screen caching behavior, the component may not fully unmount.

**Consequences:** User enters a lesson and sees the error state ("No questions could be generated") or blank screen. Not a crash, but a broken experience that a reviewer would flag.

**Prevention:**
1. Reset `generatedRef.current = false` when the `lesson` prop changes (add a second useEffect that watches `lesson.id`)
2. Or: use `lesson.id` as a key on the component to force full remount
3. Test: complete lesson 1, go to home, open lesson 2 -- verify questions appear

**Detection:** Navigate between lessons without fully killing the lesson screen. If second lesson shows no questions, this bug is active.

**Phase:** First phase -- directly impacts the review experience.

---

### Pitfall 8: Streak Counter Race Condition Under Rapid Taps

**What goes wrong:** The `handleAnswer` callback in `useLessonQuiz` reads `questions[qIndex]` and then calls `setQIndex` inside a `setQuestions` updater function. Under rapid taps, multiple `handleAnswer` calls can fire before React processes the state updates, causing the same question to be answered twice or questions to be skipped.

**Why it happens:** React state updates are batched. `qIndex` is read from closure, not from the latest state. The `setQuestions` trick partially mitigates this but `qIndex` itself is stale.

**Consequences:** Duplicate quiz results, skipped questions, or incorrect streak count. Not a crash, but corrupts lesson completion data and mastery calculations.

**Prevention:**
1. Debounce answer handling or disable the answer buttons immediately on tap (before async state update)
2. Use a ref for `qIndex` that updates synchronously alongside the state setter
3. Test: tap answer options as fast as possible. Verify no questions are skipped or doubled.

**Detection:** Rapid-tap through a quiz. Check if `quizResults` has duplicate `targetId` entries or if `totalQuestions` doesn't match expected count.

**Phase:** First or second phase. Not a crash, but visible to reviewers who tap quickly.

---

### Pitfall 9: Midnight Routing Loop in Home Screen

**What goes wrong:** If the home screen has a `useEffect` that checks date-dependent conditions (wird streak, daily reset) and triggers navigation based on the result, crossing midnight while the app is open causes the effect to re-fire, potentially creating a navigation loop (redirect to return-welcome, which redirects back to home, which checks date again).

**Why it happens:** Date comparisons in `useEffect` dependencies that reference `new Date()` -- the effect doesn't depend on a stable value, so it can fire repeatedly. Combined with navigation that causes remounts.

**Consequences:** App becomes unusable at midnight. The user is stuck in a redirect loop. If a reviewer tests the app near midnight in their timezone, rejection.

**Prevention:**
1. Use a ref to track "already handled today's routing" and only run the routing logic once per app session
2. Debounce the routing effect so it can't fire more than once per second
3. Never use `new Date()` directly in effect dependencies -- derive a stable "today" string and compare against it

**Detection:** Open the app at 11:59 PM and wait until 12:00 AM. If the screen flickers or navigation loops, this bug is active.

**Phase:** First phase -- can happen during review.

---

### Pitfall 10: Error Boundary Only at Root Level

**What goes wrong:** The app has a single `Sentry.ErrorBoundary` at the root layout level. If a single screen crashes (e.g., a malformed lesson causes a render error in the quiz), the entire app shows the error fallback. The user has no way to go back to the home screen -- they must force-quit.

**Why it happens:** Root-level error boundary is the "minimum viable" implementation. Without per-screen boundaries, any component crash cascades to the entire app.

**Consequences:** A crash in one lesson takes down the whole app. A reviewer encountering this would see a blank error screen with no navigation.

**Prevention:**
1. Add error boundaries at the screen level: wrap each Stack.Screen's content in its own error boundary
2. The per-screen error boundary should offer "Go Home" navigation, not just "Retry"
3. Key screens: lesson/[id], lesson/review, (tabs)/home, (tabs)/progress
4. Keep the root Sentry.ErrorBoundary as the last-resort fallback

**Detection:** Intentionally throw an error in a lesson component. Verify the error is contained to that screen and the user can navigate away.

**Phase:** Second phase -- defensive improvement, not a first-launch blocker.

---

### Pitfall 11: App Store Connect Metadata Mismatches

**What goes wrong:** App screenshots, description, and category must match what the app actually does. Common rejections: screenshots showing features that don't exist yet, description promising features not in the current build, wrong category selection, missing age rating questionnaire.

**Why it happens:** Metadata is prepared separately from the code. If the marketing team (or founder) prepares screenshots from a design mockup rather than the actual app, discrepancies emerge.

**Consequences:** Rejection under Guideline 2.3 (Accurate Metadata). Apple compares what they see in the app to what the screenshots promise.

**Prevention:**
1. Take screenshots from the actual production build, not design mocks
2. For educational/religious content: select "Education" category and "Reference" subcategory. Complete the age rating questionnaire accurately (no mature content)
3. Ensure the description doesn't promise cloud sync, social features, or anything not yet built
4. For Arabic/Quranic content: be accurate about what the app teaches (reading, not translation or tafsir)

**Detection:** Compare App Store listing draft against actual app feature set. Any gap = risk.

**Phase:** Pre-submission checklist, parallel to code work.

## Minor Pitfalls

### Pitfall 12: Audio Session Conflicts on iOS

**What goes wrong:** `expo-audio` doesn't configure the iOS audio session category by default. If the user is playing music/podcast and opens Tila, letter pronunciation audio may fail silently or interrupt the user's media. Worse: on some iOS versions, the audio session conflict can cause the audio system to throw, and without error handling on `play()`, this becomes an unhandled rejection.

**Prevention:**
1. Configure audio session to mix with other audio (`.mixWithOthers` or `.duckOthers`)
2. Wrap all `play()` calls in try/catch
3. Test: play Spotify, open Tila, tap a letter pronunciation. Verify both work.

**Phase:** Second phase. Not a rejection risk, but poor UX.

---

### Pitfall 13: TypeScript `any` Types Masking Runtime Errors

**What goes wrong:** Widespread `any` in hooks (e.g., `useLessonQuiz` parameters: `lesson: any, mastery: any`) means TypeScript can't catch property access errors at compile time. A renamed field in the lesson data would silently produce `undefined` at runtime, leading to a crash in question generation.

**Prevention:**
1. Type the top-level hook interfaces: `lesson` should be `Lesson`, `mastery` should be `MasteryState`
2. Focus on public API surfaces (hook parameters, return types) -- internal `any` is lower priority
3. Run `npm run typecheck` in CI to prevent regression

**Phase:** Second phase. Improves safety but doesn't directly cause App Store rejection.

---

### Pitfall 14: Silent Migration Error Swallowing (v1 to v2)

**What goes wrong:** The v1-to-v2 migration in `client.ts` catches ALL errors silently (empty `catch {}`). If the migration fails for a real reason (not "column already exists"), the error is swallowed, `schema_version` is stamped as 2, and subsequent code assumes columns exist. This causes crashes later when queries reference the missing columns.

**Prevention:**
1. Parse the error message: only swallow "duplicate column" errors, re-throw everything else
2. Use the same PRAGMA-check pattern used in v2-to-v3 migration (which is already correct)
3. Log swallowed errors to Sentry even if non-fatal

**Phase:** First phase -- data corruption risk.

---

### Pitfall 15: App Tracking Transparency (ATT) Not Implemented

**What goes wrong:** Tila uses PostHog (which collects device identifiers for analytics). Apple requires apps that track users across apps/websites to show the ATT prompt (App Tracking Transparency). If PostHog is configured to collect IDFA or device fingerprints, Apple will reject without the ATT prompt. If PostHog is NOT collecting IDFA, the app must accurately declare this in App Store Connect's privacy questionnaire.

**Why it happens:** PostHog's React Native SDK can operate without IDFA, but the App Store Connect privacy questionnaire must accurately reflect what data is collected. Getting this wrong either way causes rejection.

**Prevention:**
1. Verify PostHog config: is `$device_id` or IDFA collection enabled? If yes, add ATT prompt
2. If PostHog only uses anonymous IDs (not IDFA): ensure the App Store Connect privacy questionnaire says "No" to tracking
3. The existing `AnalyticsGate` component handles install date tracking via SecureStore -- verify this doesn't inadvertently track users

**Detection:** Check PostHog initialization config for IDFA/advertising identifier collection. Check `NSUserTrackingUsageDescription` in Info.plist -- currently not present.

**Phase:** Pre-submission. Must be resolved before Apple review.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| DB initialization hardening | Pitfall 1: Hang with no recovery | Add timeout + error screen + retry/reset buttons |
| DB migration safety | Pitfall 14: Silent error swallowing | Use PRAGMA table_info pattern consistently |
| Promise rejection audit | Pitfall 4: Unhandled rejections crash production | Audit all .then() without .catch(), all fire-and-forget async |
| RevenueCat robustness | Pitfall 6: SDK crashes when unconfigured | Gate all Purchases.* calls behind initialization check |
| Restore Purchases | Pitfall 2: Missing standalone restore button | Add restore button outside paywall (settings or account area) |
| Quiz flow stability | Pitfall 7: Ref doesn't reset, Pitfall 8: Race condition | Reset ref on lesson change, debounce answer handler |
| Midnight routing | Pitfall 9: Navigation loop at date boundary | Guard routing with session-level ref |
| Error containment | Pitfall 10: Root-only error boundary | Add per-screen error boundaries with "Go Home" option |
| App Store metadata | Pitfall 3: No privacy policy, Pitfall 11: Metadata mismatch, Pitfall 15: ATT | Privacy policy, accurate screenshots, ATT decision |
| Audio reliability | Pitfall 12: Session conflicts, unhandled play() errors | Configure audio session, wrap play() in try/catch |
| Type safety | Pitfall 13: any types | Type hook interfaces, run typecheck in CI |

## Sources

- [App Store Review Guidelines (2025) Checklist](https://nextnative.dev/blog/app-store-review-guidelines) -- comprehensive rejection reasons
- [Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) -- common rejection patterns
- [RevenueCat: App Store Rejections](https://www.revenuecat.com/docs/test-and-launch/app-store-rejections) -- subscription-specific rejection guidance
- [Guideline 3.1 Rejection: Fix IAP Issues](https://iossubmissionguide.com/guideline-3-1-in-app-purchase/) -- restore purchases requirement
- [Apple Developer Forums: Restore Purchases](https://developer.apple.com/forums/thread/730977) -- Apple's stance on restore button requirement
- [Expo: Best Practices for Performance](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps) -- production performance guidance
- [React Native iCloud Backup Issue](https://github.com/facebook/react-native/issues/7395) -- database backup exclusion
- [expo-sqlite Race Condition](https://github.com/expo/expo/issues/33754) -- concurrent DB access issues
- [App Store Requirements 2026](https://newly.app/articles/app-store-requirements) -- current submission requirements
- Codebase audit: `src/db/client.ts`, `src/db/provider.tsx`, `src/hooks/useLessonQuiz.ts`, `src/monetization/revenuecat.ts`, `src/monetization/provider.tsx`, `app/_layout.tsx`
