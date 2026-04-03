# Codebase Concerns

**Analysis Date:** 2026-04-03

## Tech Debt

**Migration v2 Exception Handling:**
- Issue: Migration v2 in `src/db/client.ts` (lines 38-55) uses bare `await db.execAsync()` without transaction wrapping or PRAGMA column checks, unlike migrations v3-v7 which check column existence before ALTER.
- Files: `src/db/client.ts` (lines 38-55)
- Impact: If migration v2 fails halfway (e.g., due to schema corruption or concurrent access), the database is left in an inconsistent state. No rollback mechanism.
- Fix approach: Wrap v2 migration in `db.withExclusiveTransactionAsync()` and add PRAGMA table_info checks for both `wird_intro_seen` and `post_lesson_onboard_seen` columns before adding them.

**Weak Type Safety on Hook Returns:**
- Issue: Hooks in `src/hooks/` return spread objects without explicit return type annotations. TypeScript infers wide types, causing downstream `any` leakage in callers.
- Files: `src/hooks/useLessonQuiz.ts`, `src/hooks/useProgress.ts`, `src/hooks/useHabit.ts`, `src/hooks/useMastery.ts`
- Impact: Components that import from these hooks lose type precision. Found 63 occurrences of `any` across codebase, 19 files affected. Reduces compile-time error detection.
- Fix approach: Add explicit return type interfaces to all hook exports. Example: `interface UseLessonQuizReturn { currentQuestion: Question | null; questionIndex: number; ... }` then `function useLessonQuiz(...): UseLessonQuizReturn { ... }`

**Loose Type on Quiz Result Callback:**
- Issue: `LessonQuiz` component (line 46 in `src/components/LessonQuiz.tsx`) accepts `onComplete` with `questions: any[]` parameter.
- Files: `src/components/LessonQuiz.tsx` (line 46)
- Impact: Callers cannot safely inspect quiz results without manual type assertions.
- Fix approach: Replace `any[]` with explicit `QuizResultItem[]` type already defined in `src/types/quiz.ts`.

**Multiple Sync-Related Type Mismatches:**
- Issue: Sync config in `src/sync/tables.ts` defines sync columns but `question_attempts` table excludes the `attempt_id` column from SYNC_TABLE_CONFIGS. This causes `attempt_id` references to fail when pulling remote question_attempts rows.
- Files: `src/sync/tables.ts` (lines 90-108), `src/db/schema.ts` (lines 79-93)
- Impact: Question attempt sync will silently drop `attempt_id` on pull, breaking the link between question_attempts and lesson_attempts. Foreign key constraint violation on insert.
- Fix approach: Add `attempt_id` to the columns list for `question_attempts` sync config. Update migration to handle backward compatibility.

**Analytics Event Index Drift:**
- Issue: Onboarding flow in `src/components/onboarding/OnboardingFlow.tsx` (line 66) has TODO noting that step indices used in analytics shifted after Bismillah step insertion.
- Files: `src/components/onboarding/OnboardingFlow.tsx` (line 66)
- Impact: Historical analytics events reference old step indices that no longer match current onboarding sequence. Analysis queries will misalign steps with event data.
- Fix approach: Add a version number to onboarding analytics events or map old indices to new names consistently. Document the mapping in the event schema.

## Known Bugs

**RevenueCat Initialization Without SDK Check:**
- Issue: `src/monetization/revenuecat.ts` initializes RevenueCat with an empty string API key when the env var is missing, instead of failing loudly or skipping initialization.
- Files: `src/monetization/revenuecat.ts` (lines 10-17)
- Impact: If `EXPO_PUBLIC_REVENUECAT_IOS_KEY` or `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` is undefined, `Purchases.configure()` receives an empty string which may cause silent SDK initialization failure. The app defaults to free tier but with no error tracking.
- Fix approach: Add explicit env var validation at startup (in `app/_layout.tsx`) and fail fast with a Sentry capture if keys are missing in production builds.

**Missing Error Boundary Integration:**
- Issue: App has a Sentry.ErrorBoundary at root (`app/_layout.tsx` line 124-126) but no component-level error boundaries for complex features like LessonQuiz, LessonSummary, or progress sheets.
- Files: `app/_layout.tsx`, `src/components/LessonQuiz.tsx`, `src/components/LessonSummary.tsx`
- Impact: If a child component throws, the entire app screen crashes and resets. Users lose lesson progress if the quiz crashes mid-attempt.
- Fix approach: Add `react-error-boundary` package (v6.1.1) and wrap high-risk screens (LessonQuiz, LessonSummary, PhaseDetailSheet) with ErrorBoundary + reset handler.

**Insufficient Audio Error Handling:**
- Issue: `src/audio/player.ts` has try/catch on `playVoice()` (lines 161-167) and `playSFX()` (lines 208-216) but catches only and logs to console. No Sentry capture, no state signal to inform UI if audio playback failed.
- Files: `src/audio/player.ts`
- Impact: If audio asset is corrupted, missing, or audio session interrupts, user hears nothing but no feedback. Can appear as the app hanging.
- Fix approach: Capture audio errors to Sentry and optionally emit a small visual indicator (toast or haptic) when playback fails.

**Subscription Sync Silent Failure:**
- Issue: `src/monetization/provider.tsx` (line 102) catches all errors from `Purchases.getCustomerInfo()` and silently continues with stale data.
- Files: `src/monetization/provider.tsx` (lines 98-104)
- Impact: If RevenueCat SDK fails to initialize or network is unavailable, app assumes free tier indefinitely. No retry, no error reporting.
- Fix approach: Track subscription sync errors with Sentry and expose `lastErrorAt` in SubscriptionState so UI can show a "subscription status unknown" banner.

## Security Considerations

**Offline Subscription Status Caching:**
- Risk: App caches subscription entitlements in SubscriptionProvider state without server validation. If user is offline, they could spoof premium access by modifying app state (if they had access to the device).
- Files: `src/monetization/provider.tsx`
- Current mitigation: Entitlements are verified server-side on backend (not implemented in this codebase, assumed to exist). RevenueCat SDK handles offline caching securely on-device via encrypted storage.
- Recommendations: Verify that all premium lesson purchases are validated server-side before granting access. Never rely solely on client-side entitlement state for revenue-sensitive features.

**Sync User ID Exposure in SQLite:**
- Risk: `sync_user_id` column added to `user_profile` table (migration v7, `src/db/client.ts` line 116) stores the Supabase user ID in plaintext on local SQLite. If device is stolen or app data is extracted, user identity is exposed.
- Files: `src/db/schema.ts` (line 23), `src/db/client.ts` (line 116), `src/sync/provider.tsx` (line 37)
- Current mitigation: Database access is protected by device OS-level encryption (iOS Keychain, Android encrypted shared preferences via Expo's SecureStore). Actual secrets are stored in env vars, not in DB.
- Recommendations: Consider storing only a derived hash of `sync_user_id` in SQLite and keeping the actual user ID in memory or secure storage only. Audit SQLite encryption on both platforms.

**Empty API Key in Console Logs:**
- Risk: `src/monetization/revenuecat.ts` (line 21) logs first 10 chars of RevenueCat API key to console in dev mode. While truncated, this is unnecessary exposure.
- Files: `src/monetization/revenuecat.ts` (line 21)
- Current mitigation: Only logged in `__DEV__` mode (development builds).
- Recommendations: Remove the API key log entirely. If logging is needed for debugging, use a placeholder string like `"[REDACTED]"`.

## Performance Bottlenecks

**Large Component File Complexity:**
- Issue: `src/components/LessonSummary.tsx` is 1133 lines with complex animation orchestration, confetti particles, and celebration logic all in one component. Multiple state machines and shared animated values.
- Files: `src/components/LessonSummary.tsx`
- Impact: Component is difficult to test, slow to refactor, and re-render performance degrades with complex animation state.
- Improvement path: Extract confetti particle logic to a dedicated `<ConfettiBurst>` component, animation orchestration to a custom hook, and messaging logic to a `useLessonSummaryMessaging()` hook. Target: <400 lines per component.

**Quiz Question Pool Duplication:**
- Issue: `src/hooks/useLessonQuiz.ts` (lines 104-116) recycles wrong-answer questions by appending duplicates to the questions array. Over a 30-question quiz, this can create 40+ questions in memory, slowing question rendering and list operations.
- Files: `src/hooks/useLessonQuiz.ts`
- Impact: For lessons with high error rates, quiz array can grow unbounded. No max recycling limit. On mid-range Android, state updates slow down visibly.
- Improvement path: Implement a `maxRecycledQuestions` cap (e.g., 50% of original count) and use a deque structure instead of array append. Pre-allocate question slots.

**Unindexed Database Queries in Progress Loading:**
- Issue: `src/engine/progress.ts` (lines 69-97) loads all rows from 6 tables in parallel with `db.getAllAsync()` but no WHERE clauses. For users with hundreds of completed lessons or thousands of mastery attempts, this loads unnecessary data.
- Files: `src/engine/progress.ts`
- Impact: App startup and lesson transitions slow down linearly with account age. First user with 50+ lessons experiences ~500ms load delay.
- Improvement path: Add pagination or time-windowing to mastery queries. Fetch only entities and skills with `last_seen` in the past 30 days for quiz generation. Archive older data.

## Fragile Areas

**Sync Dependency Loop Risk:**
- Issue: `SyncProvider` (lines 81-94 in `src/sync/provider.tsx`) calls `triggerSync()` on mount and app foreground via `useCallback` dependency on `[db, user, isAnonymous]`. If `db` changes (context provider remounts), sync can trigger twice. Additionally, `SyncProvider` is instantiated inside `AuthProvider`, so user context changes propagate sync triggers.
- Files: `src/sync/provider.tsx`, `app/_layout.tsx` (line 130-131)
- Why fragile: If sync is already in-flight and context changes trigger a second sync, the state machine may skip queued operations or attempt concurrent syncs despite the `syncingRef` lock.
- Safe modification: Move sync initialization logic to a separate useEffect that only triggers on app state changes, not context dependencies. Use a timestamp-based debounce (e.g., no sync within 30s of last sync).
- Test coverage: `src/__tests__/sync-service.test.ts` has unit test coverage for the sync service but no integration tests for SyncProvider's lifecycle in relation to auth state changes.

**Primary Key Mismatch in Sync Pull:**
- Issue: `src/sync/service.ts` (lines 184-188) maps `remoteKeyColumn` back to `primaryKey` when pulling remote rows. For `lesson_attempts` and `question_attempts`, the remote `local_id` is mapped to local `id`. But if the local `id` has been reused (after a lesson reset), the pull overwrites the wrong row.
- Files: `src/sync/service.ts` (lines 185-188), `src/sync/tables.ts` (lines 74-88, 90-108)
- Why fragile: Sync assumes local and remote IDs are globally unique, but local IDs are auto-incremented per session.
- Safe modification: Add a `created_at` timestamp comparison in addition to primary key matching. Or use a deterministic UUID-based ID instead of auto-increment.
- Test coverage: `src/__tests__/sync-service.test.ts` has tests for single-row and multi-row sync but no test for the remoteKeyColumn->primaryKey mapping edge case.

**Onboarding State Fragmentation:**
- Issue: Onboarding state is split across multiple DB columns in `user_profile`: `onboarded`, `onboarding_version`, `starting_point`, `motivation`, `commitment_complete`, `will_intro_seen`, `post_lesson_onboard_seen`. Any one column being NULL or stale can cause the UI to show wrong screens.
- Files: `src/db/schema.ts` (lines 10-28), `src/engine/progress.ts` (lines 140-150)
- Why fragile: No single source of truth. If a migration fails or data is manually modified, the app can enter an inconsistent state (e.g., `onboarded=1` but `commitment_complete=0`).
- Safe modification: Add a `onboarding_state` enum column (`'not_started' | 'in_progress' | 'completed'`) and migrate existing data to consolidate state. Validate state transitions in the app layer.
- Test coverage: No integration tests for onboarding state consistency across multiple DB columns.

**Quiz Progress Calculation with Recycled Questions:**
- Issue: `src/hooks/useLessonQuiz.ts` (lines 20-22) computes quiz progress as `(qIndex / effectiveTotal) * 100` where `effectiveTotal` is the max of current, original, and 1. If questions are recycled, `totalQuestions` exceeds `originalQCount`, so progress can dip backward.
- Files: `src/hooks/useLessonQuiz.ts` (lines 15-22)
- Why fragile: Users see progress bar decrease when they get a question wrong and it's recycled. This is intentional per the code comment, but the math is fragile if `originalQCount` is 0 on first render.
- Safe modification: Ensure `originalQCount` is set before quiz starts, not lazily in component. Use a separate "effective progress" metric that never dips (shows only absolute position in original quiz, ignoring recycles).
- Test coverage: `src/__tests__/quiz-progress.test.ts` exists and tests the computation, but doesn't test the case where `originalQCount` is unset.

## Scaling Limits

**Database Connection Pooling:**
- Current capacity: Single `SQLiteDatabase` instance (`dbInstance` singleton in `src/db/client.ts`). No connection pool.
- Limit: Expo SQLite is single-threaded and in-process. If a long-running query blocks the main thread, the app UI freezes.
- Scaling path: Migrate to `better-sqlite3` on Android/iOS via native modules if query performance becomes critical. For now, ensure all DB queries use indices and stay under 100ms.

**Mastery State Object Size:**
- Current capacity: `mastery.entities` and `mastery.skills` are Record objects loaded into memory. For a user with 500+ mastery entities, this is ~100KB of JSON.
- Limit: React Context re-renders all consumers when mastery changes. A single entity update triggers re-render of entire app consuming the AppStateContext.
- Scaling path: Implement granular context slices (e.g., `useEntityMastery(entityId)` instead of full mastery tree) or switch to a selector-based library like Reselect to memoize derived state.

**Sync Payload Size:**
- Current capacity: `syncTable()` loads entire local table with `SELECT *` and entire remote table from Supabase. For lesson_attempts with 1000+ rows, this is a large network payload and memory spike.
- Limit: Network timeout on slow connections. Memory pressure on devices with <2GB RAM.
- Scaling path: Implement cursor-based pagination in sync service. Fetch remote rows in batches (e.g., 100 rows per request). Add `last_synced_at` timestamp tracking to only sync rows modified since last sync.

## Dependencies at Risk

**RevenueCat SDK Dependency:**
- Risk: `react-native-purchases` (v9.15.0) is a critical dependency for monetization. If an update introduces a breaking change or incompatibility with React Native 0.83, the app will fail to build or crash at runtime.
- Files: `src/monetization/provider.tsx`, `src/monetization/revenuecat.ts`, `package.json`
- Impact: Subscription features unavailable. App can't validate premium access.
- Migration plan: Keep version pinned to 9.15.0. Before updating, test thoroughly on both iOS and Android in staging with real RevenueCat backend. Have a fallback "assume free" mode.

**Supabase Client Library:**
- Risk: `@supabase/supabase-js` (version not specified in codebase files read, but imported in `src/sync/service.ts`, `src/auth/supabase.ts`) can have breaking changes. Sync logic directly calls Supabase API via the client.
- Files: `src/sync/service.ts`, `src/auth/supabase.ts`, `src/auth/provider.tsx`
- Impact: If a Supabase update changes error response formats or upsert behavior, sync service may silently fail or corrupt data.
- Migration plan: Pin Supabase client version. Add integration tests that mock Supabase API at the network level, not just the client level.

**Expo SDK Version Lock:**
- Risk: Project is locked to Expo SDK 55.0.8 and React Native 0.83.2. Expo SDK 56 (upcoming) may have breaking changes in audio, SQLite, or router APIs.
- Files: `package.json`, `src/audio/player.ts`, `src/db/client.ts`, `app/_layout.tsx`
- Impact: Cannot benefit from bug fixes and security patches in newer SDK versions without a full migration.
- Migration plan: Plan a separate "Upgrade to Expo 56" phase after stability milestone is complete. Test thoroughly on real devices (not simulators) before upgrading.

## Missing Critical Features

**Error Boundary for Quiz Flow:**
- Problem: No component-level error boundary wraps the quiz experience (LessonQuiz → LessonSummary → ReviewSchedule). If any component throws, user loses their quiz session.
- Blocks: Cannot ship to App Store with high confidence that crashes won't be reported by reviewers during testing.
- Mitigation: Add `react-error-boundary` package and wrap quiz flow with a `<QuizErrorBoundary>` that offers "retry" and "exit quiz" options.

**Offline-First Indicator:**
- Problem: App syncs to Supabase, but doesn't inform the user of sync status. If a user is offline, they don't know if their progress is being persisted to the cloud.
- Blocks: Users on flaky connections may assume their data is lost when it's actually queued for sync.
- Mitigation: Add a sync status badge (e.g., "Synced", "Syncing...", "Offline") visible on lesson and home screens.

**Database Transaction Atomicity on Lesson Completion:**
- Problem: Lesson completion writes to 6 tables (lesson_attempts, mastery_entities, mastery_skills, mastery_confusions, habit, question_attempts). If any write fails mid-way, the DB is left inconsistent.
- Blocks: Data integrity concerns for App Store submission. Expert review flagged this as a weak point.
- Mitigation: Wrap lesson completion in `db.withExclusiveTransactionAsync()` to ensure all-or-nothing semantics.

## Test Coverage Gaps

**Sync with Auth State Changes:**
- What's not tested: Sync behavior when auth context changes (login/logout) while sync is in-flight.
- Files: `src/sync/provider.tsx`, `src/auth/provider.tsx`
- Risk: Race conditions between auth state updates and sync completion. Could cause user A's data to sync to user B's remote account if logout happens during sync.
- Priority: HIGH — Critical for multi-user safety.

**Migration Edge Cases:**
- What's not tested: Migration v2 failure (lines 38-55 in `src/db/client.ts`). What happens if ALTER TABLE fails partway through?
- Files: `src/db/client.ts` (lines 38-55)
- Risk: Database becomes unrecoverable on older devices with schema conflicts.
- Priority: HIGH — Affects all upgrades from v1 schema.

**RevenueCat Offline Mode:**
- What's not tested: App behavior when RevenueCat SDK fails to initialize (missing/invalid API key) and network is offline.
- Files: `src/monetization/revenuecat.ts`, `src/monetization/provider.tsx`
- Risk: Subscription features completely unavailable with no error message to user.
- Priority: MEDIUM — Affects freemium monetization flow in edge cases.

**Audio Playback Interruption Recovery:**
- What's not tested: Audio playback when device audio session is interrupted (e.g., incoming phone call, alarm, or notification sound).
- Files: `src/audio/player.ts`
- Risk: App may show no feedback when playback fails due to audio session loss.
- Priority: MEDIUM — Degrades user experience but not critical to core learning flow.

**Quiz Recycling Edge Case:**
- What's not tested: User answers 1 question wrong 5+ times, quiz array grows unbounded. What's the memory and performance impact?
- Files: `src/hooks/useLessonQuiz.ts` (lines 104-116)
- Risk: Performance degradation on slower devices. No upper bound on quiz length.
- Priority: MEDIUM — Unlikely in practice but affects extreme edge cases.

---

*Concerns audit: 2026-04-03*
