# Feature Landscape: Stability & App Store Readiness

**Domain:** Mobile app hardening for App Store submission (Expo 55 / React Native 0.83)
**Researched:** 2026-03-31
**Overall confidence:** HIGH (based on official Apple guidelines, Expo docs, codebase audit)

## Table Stakes

Features the App Store review process and users expect. Missing = rejection or user churn on first session.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Error boundaries at screen level** | Unhandled render errors crash entire app. Apple testers reject on first crash (Guideline 2.1 Performance) | Low | `Sentry.ErrorBoundary` exists at root level. Need per-screen boundaries so one broken screen does not take down the whole app. Each boundary should offer "Go Home" recovery action. |
| **Database initialization error handling** | DB failure = blank screen forever = rejection. Currently `DatabaseProvider` returns `null` on failure with no recovery path | Medium | Show error screen with retry button on DB init failure. Keep splash screen visible until DB is ready. Log to Sentry. Current code: `getDatabase()` has no `.catch()`. |
| **Graceful audio failure handling** | Unhandled promise rejections from `expo-audio` = crash reports. Apple flags unhandled rejections | Low | Wrap all audio playback in try/catch. Audio failure must never block quiz flow -- silently degrade (skip sound, continue). |
| **Silent migration error handling** | Current `catch {}` swallows ALTER TABLE errors. DB could be in inconsistent state after partial migration failure | Low | Log actual errors to Sentry. Distinguish "column already exists" (safe) from real failures (needs recovery screen). |
| **Quiz hook state reset between lessons** | Known critical bug: quiz state leaks between lesson transitions causing stale questions to appear | Medium | Identified in deep codebase audit. Must reset cleanly on lesson mount/unmount. Affects core learning experience. |
| **Streak counter race condition fix** | Known bug: rapid taps cause race condition in wird streak counter, double-counting or corrupting data | Low | Debounce taps or use SQLite transaction-level locking. Data integrity issue. |
| **Midnight boundary routing fix** | Known bug: home screen routing breaks when a session spans midnight | Low | Date comparison fix in selectors. Affects returning users who use the app late at night. |
| **RevenueCat graceful degradation** | If SDK fails to initialize (no network, bad API key), app must still work for free content. Apple tests in airplane mode | Low | Verify subscription checks return "free tier" defaults on SDK failure, not crashes. Check `initRevenueCat()` error path. |
| **iPad rendering compatibility** | Apple rejects apps that render broken on iPad even with `supportsTablet: false`. App runs at iPhone resolution in iPad letterbox mode but must be usable | Low | Test on iPad simulator. Known Expo issue: `supportsTablet: false` may be ignored during prebuild. Ensure no clipped buttons or unreadable text. |
| **Minimum touch targets (44x44pt)** | Apple HIG requirement. Reviewers flag small tap targets, especially in quiz interfaces | Low | Audit all interactive elements. Arabic letter quiz options and navigation buttons are highest risk areas. |
| **Privacy policy URL** | Required for all iOS apps since 2018. App Store Connect submission is blocked without one | Low | Not a code feature -- needs a hosted privacy policy page URL entered in App Store Connect. Must disclose PostHog analytics and Sentry crash data collection. |
| **App Store metadata completeness** | Placeholder content, missing screenshots, or "coming soon" text = automatic rejection (Guideline 2.1 App Completeness). This accounts for over 40% of unresolved rejection cases | Low | Ensure all screens have real content. No lorem ipsum, no empty states that look unfinished. Need 1024x1024 app icon, screenshots for each device size. |
| **Crash-free launch sequence** | Apple tests cold start on physical devices. Crash or hang on first launch = instant rejection | Medium | Font loading -> splash hide -> DB init timing must be bulletproof. If DB hangs, user currently sees blank screen. Splash should stay visible until everything is ready. |
| **Non-exempt encryption declaration** | Required or submission is blocked | Done | Already configured: `ITSAppUsesNonExemptEncryption: false` in `app.config.ts`. No action needed. |

## Differentiators

Features that set the app apart from typical indie apps. Not required for submission but signal quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **EAS Update (OTA updates)** | Push JS-only fixes without App Store re-review. Critical for post-launch: review takes 24-48 hours, OTA is instant | Medium | Add `expo-updates` package, configure update channels (preview + production). Enables fixing a production crash in minutes instead of days. Best practice: use fingerprint to detect native changes vs. OTA-eligible changes. |
| **CI/CD pipeline (GitHub Actions)** | Catch regressions before they ship. No CI exists currently -- all quality checks are manual | Low | Add GitHub Actions workflow: `npm run validate && npm test` on every PR. Prevents shipping broken builds. Low effort, high value. |
| **Test coverage for critical paths** | Engine unit tests exist (mastery, questions, selectors) but hooks and components are untested. Tests validate bug fixes | Medium | Write Vitest tests for the 5 critical bugs and key flows (DB init, quiz lifecycle, streak counting). Focus on engine + hooks, skip component rendering tests. |
| **Type-safe quiz pipeline** | 30+ explicit `any` types in the question -> quiz -> options flow. A single field rename silently breaks the UI at runtime | High | Define `Question`, `QuizOption`, `Lesson` types in `src/types/` and propagate through pipeline. Most impactful type safety improvement but touches many files across hooks, components, and engine. |
| **Database transaction batching** | `saveQuestionAttempts()` does O(n) individual INSERTs. Batching into a single transaction improves reliability (atomic commit) and performance | Low | Wrap in `db.withTransactionAsync()`. Prevents partial saves if app is killed mid-quiz completion. |
| **Structured Sentry error context** | Attach user progress state, lesson ID, mastery data to Sentry error reports for faster debugging | Low | Currently Sentry captures crashes but without business context. Add breadcrumbs for: lesson start, question answered, lesson complete, subscription check. |
| **Recovery UI (not just crash screen)** | Users can tap "Retry" or "Go Home" instead of force-quitting the app | Low | `resetErrorBoundary` pattern in error fallback components. Already partially implemented with `ErrorFallback` component. |
| **Data export before destructive operations** | `resetProgress()` and `resetDatabase()` both destroy all user data with no backup or confirmation | Low | Export current state to temp file before reset/import. Safety net for users and for debugging data loss reports. |
| **Basic accessibility improvements** | 25 accessibility annotations exist across 17 files -- reasonable start but incomplete. Full VoiceOver support is a differentiator for an Islamic app (visually impaired users learning Quran) | Medium | Focus on quiz flow: question text, answer options, correct/wrong feedback need proper labels and roles. Not required for App Store but strongly valued by the community. |

## Anti-Features

Features to explicitly NOT build during this stability milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full TypeScript migration of engine `.js` files** | 3300 lines of working business logic across 11 files. Migration risks introducing bugs in the most critical code path. Stability milestone = minimize blast radius | Fix bugs in `.js` files as-is. Add `.d.ts` declaration files for type safety at import boundaries if absolutely needed. Migrate in a dedicated refactor milestone. |
| **Dark mode activation** | Tokens exist but activating it means testing every screen in two color modes. Doubles QA surface for zero App Store benefit | Keep `themeMode` forced to "light". Ship dark mode in a dedicated UX milestone after launch. |
| **E2E testing framework (Detox/Maestro)** | Complex setup, infrastructure cost, flaky on CI, high time investment. Targeted unit tests on critical paths give 80% of the value for 20% of the effort | Write focused Vitest tests for critical bugs and key flows. Skip E2E infrastructure entirely for now. |
| **Global state management (Zustand/Redux)** | Scope creep. Current SQLite + hooks pattern works. Adding state management during stability milestone is the opposite of stability | Keep current architecture. The pattern is sound -- the issues are bugs, not architecture. |
| **ORM/query builder (Drizzle)** | Over-engineering for 8 tables. Introduces a major new dependency and requires rewriting all DB queries | Fix migration patterns in raw SQL. The current approach is fine for this app's scale. |
| **App Tracking Transparency (ATT) prompt** | PostHog does first-party analytics only, no cross-app tracking. ATT is only required for advertising/cross-app tracking. Adding it degrades onboarding UX for zero benefit | Declare "No tracking" in App Store Connect privacy questionnaire. Do NOT add the ATT permission prompt. |
| **In-app review prompt (StoreKit)** | Nice-to-have but adds complexity, Apple has strict timing rules, and it is a growth feature not a stability feature | Defer to a growth milestone after App Store launch is successful. |
| **Performance profiling infrastructure** | Dev workflow concern, not a hardening feature. Only investigate if a specific performance bug is found during testing | React Native 0.83 with New Architecture should perform well. Profile only if 60fps drops on test devices. |
| **Cloud sync / backend** | Entirely different architecture. No bearing on App Store approval | Out of scope. Future milestone. |
| **Push notifications** | Requires APNs setup, permissions, backend infrastructure. Not needed for App Store approval of a learning app | Out of scope. Future milestone. |

## Feature Dependencies

```
CI/CD pipeline -----> (catches all downstream regressions)
       |
       v
DB init error handling ---> Error boundaries at screen level
       |                           |
       v                           v
Migration safety fix          Recovery UI (boundaries render fallback)
       |
       v
Quiz hook state reset (independent critical bug)
Audio error handling (independent, no dependencies)
Streak counter fix (independent, no dependencies)
Midnight routing fix (independent, no dependencies)
RevenueCat degradation (independent, no dependencies)
       |
       v
Test coverage (tests validate the bug fixes above)
       |
       v
iPad testing (do after all UI bugs are fixed)
App Store metadata + privacy policy (do last, before submission)
       |
       v
EAS Update setup (for post-launch hotfixes, does not block submission)
```

## MVP Recommendation

**Phase 1 -- Critical bug fixes** (blocks submission):
1. Database init failure recovery + splash screen hold
2. Quiz hook state reset between lessons
3. Audio error handling (try/catch everywhere)
4. Streak counter race condition fix
5. Midnight boundary routing fix
6. Migration error handling (log real errors, ignore safe ones)

**Phase 2 -- Error boundaries + monetization safety** (submission safety net):
1. Screen-level error boundaries with recovery UI
2. RevenueCat offline/failure fallback
3. Database transaction batching for quiz saves

**Phase 3 -- Type safety + testing** (quality gate before submission):
1. Hook return type interfaces (eliminate critical `any` types)
2. Vitest tests for all Phase 1 bug fixes
3. Sentry breadcrumbs for lesson flow

**Phase 4 -- App Store submission prep** (final gate):
1. iPad compatibility testing
2. Touch target audit (44x44pt minimum)
3. Privacy policy page + App Store Connect metadata
4. App Store screenshots and description
5. EAS production build + TestFlight

**Defer to post-launch milestone:**
- CI/CD pipeline (set up immediately after launch for update workflow)
- EAS Update OTA setup (critical for post-launch but does not block initial submission)
- Full TypeScript migration
- Accessibility improvements
- Data export safety net

## Sources

- [Expo App Store Best Practices](https://docs.expo.dev/distribution/app-stores/) -- iPad compatibility, privacy policy, metadata requirements
- [App Store Review Guidelines Checklist 2025](https://nextnative.dev/blog/app-store-review-guidelines) -- rejection reasons, completeness requirements, crash criteria
- [Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) -- Guideline 2.1 Performance, 4.2 Minimum Functionality
- [Top Reasons iOS Apps Get Rejected 2026](https://www.eitbiz.com/blog/top-reasons-ios-apps-get-rejected-by-the-app-store-and-fixes/) -- metadata completeness, crash patterns
- [React Native Error Boundaries - Advanced Techniques](https://www.reactnative.university/blog/react-native-error-boundaries) -- layered error handling, strategic placement
- [Stop React Native Crashes: Production-Ready Error Handling](https://dzone.com/articles/react-native-error-handling-guide) -- three-layer error architecture
- [Expo OTA Update Best Practices](https://expo.dev/blog/5-ota-update-best-practices-every-mobile-team-should-know) -- channels, fingerprinting, update API
- [React Native Accessibility Best Practices 2025](https://www.accessibilitychecker.org/blog/react-native-accessibility/) -- VoiceOver, touch targets, WCAG
- [Expo supportsTablet Issue #32344](https://github.com/expo/expo/issues/32344) -- known bug where setting is ignored
- Internal: `.planning-archive-ui-overhaul/codebase/CONCERNS.md` -- deep codebase audit with 5 critical bugs, technical debt catalog
- Internal: `.planning/PROJECT.md` -- milestone scope, known bugs, constraints
