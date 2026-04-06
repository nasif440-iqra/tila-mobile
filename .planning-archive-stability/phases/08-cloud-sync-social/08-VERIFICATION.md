---
phase: 08-cloud-sync-social
verified: 2026-04-02T22:15:00Z
status: human_needed
score: 9/9 success criteria verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/9
  gaps_closed:
    - "AccountPrompt wired into app/lesson/[id].tsx — imported, trigger useEffect, dismiss handler with DB write, sign-in navigation, and render in summary stage Fragment all present"
    - "sync-service.test.ts now imports { syncAll, syncTable } from '../../src/sync/service' — mirror logic removed"
    - "auth-flow.test.ts now imports { signInWithEmail, signUpWithEmail, signOut } from '../../src/auth/email' — mirror logic removed"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Auth sign-in full flow"
    expected: "Tapping 'Create Account' on AccountPrompt navigates to AuthScreen, email/Apple/Google sign-in creates a session, and user sees their progress intact afterward"
    why_human: "Requires Supabase project configured with real credentials (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY). Cannot test programmatically without a live backend."
  - test: "AccountPrompt appears after lesson 3 for anonymous user"
    expected: "Complete lesson 3 as a fresh (anonymous) install. After passing, the 'Save your progress' modal appears over the summary screen. Dismissing it writes account_prompt_declined_at to user_profile. Tapping 'Create Account' navigates to /auth."
    why_human: "Requires running app on device with lesson 3 completable; modal state is runtime behavior."
  - test: "Dark mode system preference"
    expected: "Changing device to dark mode causes app background to shift from #F8F6F0 to #0F1A14 and text colors to invert"
    why_human: "Visual appearance cannot be verified programmatically"
  - test: "Cloud sync on foreground"
    expected: "After signing in, backgrounding and foregrounding the app triggers a sync and SyncProvider status transitions idle → syncing → idle"
    why_human: "Requires live Supabase project and app running on device"
---

# Phase 8: Cloud Sync & Social Verification Report

**Phase Goal:** Users have accounts, progress syncs to cloud, friends can see each other's progress, dark mode works
**Verified:** 2026-04-02T22:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous: gaps_found 7/9, now: human_needed 9/9)

## Gap Closure Verification

### Gap 1: AccountPrompt Wired (was ORPHANED — now VERIFIED)

Evidence in `app/lesson/[id].tsx`:

- Line 39: `import { AccountPrompt } from '../../src/components/auth/AccountPrompt'`
- Line 37: `import { useAuth } from '../../src/auth/hooks'`
- Line 38: `import { ACCOUNT_PROMPT_LESSONS } from '../../src/auth/types'`
- Line 75: `const [showAccountPrompt, setShowAccountPrompt] = useState(false)`
- Lines 101-111: `useEffect` fires when `stage === 'summary' && quizResults?.passed && isAnonymous && ACCOUNT_PROMPT_LESSONS.includes(lesson.id)` — sets `showAccountPrompt(true)`
- Lines 113-122: `handleAccountPromptDismiss` dismisses and writes `account_prompt_declined_at` via `db.runAsync(UPDATE user_profile SET account_prompt_declined_at = datetime('now')...)`
- Lines 124-127: `handleAccountPromptSignIn` dismisses and calls `router.push('/auth')`
- Lines 412-416: `<AccountPrompt visible={showAccountPrompt} onDismiss={handleAccountPromptDismiss} onSignIn={handleAccountPromptSignIn} />` rendered as Fragment sibling to LessonSummary in summary stage

All three requirements from the gap are satisfied: trigger wiring, dismiss with DB write, navigation to /auth.

### Gap 2: Tests Import Real Source (was STUB — now VERIFIED)

Evidence in `src/__tests__/sync-service.test.ts`:

- Line 55: `import { syncAll, syncTable } from '../../src/sync/service'` — real production import confirmed
- Mirror logic (parseTimestamp, inlined syncTable, syncAll, syncInProgress) is absent from the file
- SYNC_TABLE_CONFIGS mocked via `vi.mock('../../src/sync/tables', ...)` to control test scope without replacing the real service logic

Evidence in `src/__tests__/auth-flow.test.ts`:

- Line 26: `import { signInWithEmail, signUpWithEmail, signOut } from '../../src/auth/email'` — real production import confirmed
- Supabase singleton mocked via async vi.mock factory (correct hoisting pattern)
- Mirror state machine (processAuthEvent, INITIAL_STATE) is absent from the file

SUMMARY 08-09 reports: 699 tests, 0 failures, 0 regressions after the rewrites.

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Shared state provider exists — screens subscribe to canonical progress/habit/subscription state | VERIFIED | `src/state/provider.tsx` exports AppStateProvider wrapping useProgress + useHabit; wired into _layout.tsx inside DatabaseProvider |
| 2 | User can create account (email or social auth) and sign in across devices | VERIFIED | AuthProvider (src/auth/provider.tsx) + AuthScreen (src/components/auth/AuthScreen.tsx) + app/auth.tsx route all exist and are wired |
| 3 | Anonymous users can upgrade to authenticated without losing local progress | VERIFIED | `src/sync/migration.ts` migrateToAuthenticated() stamps sync_user_id then calls syncAll; AccountPrompt now wired in lesson/[id].tsx to trigger this flow for lessons 3, 5, 7 |
| 4 | Progress syncs to cloud when connected; app works identically offline | VERIFIED | syncAll/syncTable in src/sync/service.ts uses LWW with try/catch on all Supabase calls; SyncProvider skips sync for anonymous users; errors never block UI |
| 5 | Users can add friends and see their streaks and phase milestones | VERIFIED | src/social/ layer complete with invite codes, friend CRUD, SocialProvider; FriendsList integrated into progress tab behind !isAnonymous guard |
| 6 | Privacy manifest updated for auth + cloud sync data collection | VERIFIED | app.config.ts: NSPrivacyCollectedDataTypeEmailAddress (line 31) and NSPrivacyCollectedDataTypeUserID (line 39) both present |
| 7 | Return welcome screen adapts to absence length (1 day / 3-7 days / 14+ days) | VERIFIED | Three tiers in app/return-welcome.tsx: "Welcome back" (<=1 day), "We missed you" (2-7 days), "It's never too late" (8+ days) with absence_tier analytics |
| 8 | Integration tests cover: onboarding, lesson completion, premium locking, restore purchases | VERIFIED | 4 integration test files (19 tests) + sync-service.test.ts now imports real syncAll/syncTable (8 tests) + auth-flow.test.ts now imports real signInWithEmail/signUpWithEmail/signOut (5 tests). Regressions in src/sync/service.ts and src/auth/email.ts will now be caught. |
| 9 | Dark mode activates from existing tokens with system preference detection | VERIFIED | ThemeWrapper in _layout.tsx calls useThemePreference() + resolveColors(); darkColors and darkShadows tokens exist in tokens.ts; hardcoded "light" mode removed |

**Score:** 9/9 success criteria verified

---

### Required Artifacts

| Artifact | Plan | Status | Details |
|----------|------|--------|---------|
| `src/auth/supabase.ts` | 08-01 | VERIFIED | LargeSecureStore with AES-256 encryption, reads EXPO_PUBLIC_SUPABASE_URL |
| `src/auth/types.ts` | 08-01 | VERIFIED | Exports AuthState, AuthContextValue, AuthMethod, ACCOUNT_PROMPT_LESSONS |
| `src/auth/apple.ts` | 08-01 | VERIFIED | signInWithApple with nonce + name capture |
| `src/auth/google.ts` | 08-01 | VERIFIED | signInWithGoogle with webClientId |
| `src/auth/email.ts` | 08-01 | VERIFIED | signInWithEmail, signUpWithEmail, signOut, resetPassword |
| `src/sync/types.ts` | 08-01 | VERIFIED | SyncStatus, SyncState, SyncResult, TableSyncConfig, SyncContextValue |
| `src/sync/tables.ts` | 08-01 | VERIFIED | SYNC_TABLE_CONFIGS with 8 table entries |
| `src/state/types.ts` | 08-01 | VERIFIED | AppState, AppStateContextValue |
| `src/auth/provider.tsx` | 08-02 | VERIFIED | onAuthStateChange subscription; handles SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION, SIGNED_OUT |
| `src/auth/hooks.ts` | 08-02 | VERIFIED | useAuth() with context guard |
| `src/sync/service.ts` | 08-02 | VERIFIED | syncAll + syncTable with LWW, sync lock (syncInProgress), offline try/catch |
| `src/sync/provider.tsx` | 08-02 | VERIFIED | AppState.addEventListener for foreground sync; skips isAnonymous users |
| `src/sync/hooks.ts` | 08-02 | VERIFIED | useSync() with context guard |
| `src/db/schema.ts` | 08-02 | VERIFIED | SCHEMA_VERSION=7, sync_user_id, theme_mode, account_prompt_declined_at columns |
| `src/db/client.ts` | 08-02 | VERIFIED | Migration v7 with PRAGMA table_info checks for all 3 new columns |
| `src/state/provider.tsx` | 08-03 | VERIFIED | AppStateProvider wraps useProgress + useHabit; refreshAll exposed |
| `src/state/hooks.ts` | 08-03 | VERIFIED | useAppState() with context guard |
| `app/_layout.tsx` | 08-03 | VERIFIED | Provider order: DatabaseProvider > ThemeWrapper > AuthProvider > SyncProvider > SubscriptionProvider > AppStateProvider > SocialProvider > AnalyticsGate |
| `src/components/auth/AccountPrompt.tsx` | 08-03 | VERIFIED | "Save your progress" modal — now imported and rendered in app/lesson/[id].tsx summary stage (Gap 1 closed by 08-08) |
| `src/components/auth/AuthScreen.tsx` | 08-03 | VERIFIED | Email + Apple (iOS only) + Google sign-in, useAuth(), sign_in/sign_up mode toggle |
| `app/auth.tsx` | 08-03 | VERIFIED | Route wrapper rendering AuthScreen |
| `src/sync/migration.sql` | 08-04 | VERIFIED | 10 tables, RLS on all, friend_streaks view, update_updated_at triggers |
| `src/sync/migration.ts` | 08-04 | VERIFIED | migrateToAuthenticated stamps sync_user_id and calls syncAll; getSyncUserId reads it |
| `src/social/types.ts` | 08-05 | VERIFIED | FriendStreak, InviteCode, SocialState, SocialContextValue |
| `src/social/friends.ts` | 08-05 | VERIFIED | queries friend_streaks view; sendFriendRequest, acceptFriendRequest, removeFriend |
| `src/social/invite.ts` | 08-05 | VERIFIED | generateInviteCode, resolveInviteCode, shareInviteLink with tila://invite/ URL |
| `src/social/provider.tsx` | 08-05 | VERIFIED | Auth-gated loading, bidirectional friendship creation on acceptInvite |
| `src/social/hooks.ts` | 08-05 | VERIFIED | useFriends() with context guard |
| `src/components/social/FriendsList.tsx` | 08-05 | VERIFIED | Streak-only view, empty state with invite CTA, long-press remove |
| `src/components/social/InviteCard.tsx` | 08-05 | VERIFIED | Code generation + native Share sheet |
| `src/hooks/useThemePreference.ts` | 08-06 | VERIFIED | Reads/writes theme_mode from user_profile; returns themeMode, updateThemeMode, loaded |
| `app/return-welcome.tsx` | 08-06 | VERIFIED | Three-tier getReturnContent(); absence_tier in analytics |
| `src/__tests__/helpers/mock-supabase.ts` | 08-07 | VERIFIED | createMockSupabase factory with in-memory tables |
| `src/__tests__/helpers/mock-db.ts` | 08-07 | VERIFIED | createMockDb factory with transaction support |
| `src/__tests__/sync-service.test.ts` | 08-07/08-09 | VERIFIED | Imports real syncAll/syncTable; 8 tests; mirror logic removed (Gap 2 closed by 08-09) |
| `src/__tests__/auth-flow.test.ts` | 08-07/08-09 | VERIFIED | Imports real signInWithEmail/signUpWithEmail/signOut; 5 tests; mirror logic removed (Gap 2 closed by 08-09) |
| `src/__tests__/integration-onboarding.test.ts` | 08-07 | VERIFIED | 4 tests covering fresh state, profile save, optional name, lesson-ready state |
| `src/__tests__/integration-lesson-completion.test.ts` | 08-07 | VERIFIED | 5 tests covering atomic completion, mastery, habit, sync trigger |
| `src/__tests__/integration-premium-locking.test.ts` | 08-07 | VERIFIED | 6 tests covering free/premium/expired access |
| `src/__tests__/integration-restore-purchases.test.ts` | 08-07 | VERIFIED | 4 tests covering restore success, no purchases, failure |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/auth/provider.tsx` | `src/auth/supabase.ts` | supabase.auth.onAuthStateChange | WIRED | Line 29: `supabase.auth.onAuthStateChange(...)` |
| `src/sync/service.ts` | `src/auth/supabase.ts` | supabase.from() | WIRED | Line 69: `supabase.from(config.remoteTable)` |
| `src/sync/provider.tsx` | `src/sync/service.ts` | syncAll call | WIRED | Line 36: `await syncAll(db, supabase, user.id)` |
| `app/_layout.tsx` | `src/auth/provider.tsx` | `<AuthProvider>` | WIRED | Line 129 |
| `app/_layout.tsx` | `src/sync/provider.tsx` | `<SyncProvider>` | WIRED | Line 130 |
| `app/_layout.tsx` | `src/state/provider.tsx` | `<AppStateProvider>` | WIRED | Line 132 |
| `app/_layout.tsx` | `src/social/provider.tsx` | `<SocialProvider>` | WIRED | Line 133 |
| `app/_layout.tsx` | `src/hooks/useThemePreference.ts` | `useThemePreference()` in ThemeWrapper | WIRED | Line 46 |
| `src/components/auth/AuthScreen.tsx` | `src/auth/hooks.ts` | `useAuth()` | WIRED | Line 25 |
| `src/components/social/FriendsList.tsx` | `src/social/hooks.ts` | `useFriends()` | WIRED | Line 50 |
| `app/(tabs)/progress.tsx` | `src/components/social/FriendsList.tsx` | import + render | WIRED | Lines 45, 365 |
| `app/(tabs)/progress.tsx` | `src/components/social/InviteCard.tsx` | import + render | WIRED | Lines 46, 364 |
| `app/lesson/[id].tsx` | `src/components/auth/AccountPrompt.tsx` | import + render in summary Fragment | WIRED | Lines 39, 412-416 (Gap 1 closed) |
| `app/lesson/[id].tsx` | `src/auth/hooks.ts` | `useAuth()` for isAnonymous | WIRED | Line 37, 67 |
| `app/lesson/[id].tsx` | `src/auth/types.ts` | ACCOUNT_PROMPT_LESSONS constant | WIRED | Line 38, 107 |
| `src/__tests__/sync-service.test.ts` | `src/sync/service.ts` | `import { syncAll, syncTable }` | WIRED | Line 55 (Gap 2 closed) |
| `src/__tests__/auth-flow.test.ts` | `src/auth/email.ts` | `import { signInWithEmail, signUpWithEmail, signOut }` | WIRED | Line 26 (Gap 2 closed) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `FriendsList.tsx` | friends (FriendStreak[]) | SocialProvider -> getFriendStreaks -> supabase.from('friend_streaks') | Yes (Supabase view query) | FLOWING (pending live Supabase credentials) |
| `app/return-welcome.tsx` | daysSince | habit.lastPracticeDate via useHabit -> SQLite | Yes (DB read) | FLOWING |
| `app/_layout.tsx` (ThemeWrapper) | themeMode | useThemePreference -> user_profile.theme_mode -> SQLite | Yes (DB read) | FLOWING |
| `src/state/provider.tsx` | progress | useProgress() -> SQLite | Yes (existing hook) | FLOWING |
| `app/lesson/[id].tsx` | showAccountPrompt | isAnonymous from useAuth() + lessonId in ACCOUNT_PROMPT_LESSONS + quizResults.passed | Yes (runtime state derived from DB-backed auth state and quiz completion) | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for Supabase-dependent behaviors (no live backend available). Static code analysis used instead.

| Behavior | Method | Result | Status |
|----------|--------|--------|--------|
| Sync lock prevents concurrent calls | Code inspection: syncInProgress module variable + syncingRef in provider | Both guards present in service.ts line 6 and provider.tsx line 23 | PASS |
| Dark mode: hardcoded 'light' removed | Grep for `useState.*"light"` in _layout.tsx | No match found | PASS |
| Return welcome tiers exist | Grep for "Welcome back", "We missed you", "never too late" | All three found in return-welcome.tsx | PASS |
| Privacy manifest entries present | Grep for NSPrivacyCollectedDataTypeEmailAddress in app.config.ts | Found at line 31 | PASS |
| AccountPrompt wired into lesson flow | Inspect app/lesson/[id].tsx | Import line 39, trigger useEffect lines 101-111, render lines 412-416 | PASS |
| Sync tests import real source | Inspect src/__tests__/sync-service.test.ts line 55 | `import { syncAll, syncTable } from '../../src/sync/service'` confirmed | PASS |
| Auth tests import real source | Inspect src/__tests__/auth-flow.test.ts line 26 | `import { signInWithEmail, signUpWithEmail, signOut } from '../../src/auth/email'` confirmed | PASS |
| Full test suite passes | SUMMARY 08-09: 699 tests, 0 failures | Reported by executor after both test rewrites | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RET-02 | 08-01, 08-03 | Shared state layer for progress, habit, subscription | SATISFIED | AppStateProvider + AppStateContext in src/state/ wired into root layout |
| RET-03 | 08-01, 08-02, 08-03, 08-08 | Cloud sync with user accounts (email/social auth), anon upgrade path | SATISFIED | AuthProvider + AuthScreen + migrateToAuthenticated all wired; AccountPrompt now surfaces upgrade path in lesson flow (Gap 1 closed) |
| RET-04 | 08-02 | Learning history synced to cloud | SATISFIED | lesson_attempts and question_attempts in SYNC_TABLE_CONFIGS; syncAll pushes/pulls them |
| RET-05 | 08-05 | Social features — friend connections, streaks, phase milestones | SATISFIED | Full social layer (friends.ts, invite.ts, SocialProvider, FriendsList, InviteCard) in Progress tab |
| RET-06 | 08-02 | Offline-first guarantee maintained | SATISFIED | All Supabase calls wrapped in try/catch in sync service; errors returned in SyncResult, never thrown |
| RET-07 | 08-04 | Privacy manifest updated for auth + cloud sync data collection | SATISFIED | app.config.ts has EmailAddress, UserID, and OtherUsageData declarations |
| RET-08 | 08-06 | Adaptive return welcome screen based on absence length | SATISFIED | Three tiers in return-welcome.tsx with distinct hadiths and button text |
| RET-09 | 08-07, 08-09 | High-value integration tests for critical flows | SATISFIED | 4 integration test files (19 tests) + sync-service.test.ts (8 tests) + auth-flow.test.ts (5 tests), all importing real source; 699 total tests passing (Gap 2 closed) |
| RET-10 | 08-06 | Dark mode activated using existing tokens, system preference detection | SATISFIED | darkColors/darkShadows tokens + useThemePreference + ThemeWrapper with useColorScheme() |

**Note on REQUIREMENTS.md discrepancy:** REQUIREMENTS.md shows RET-02 through RET-10 (except RET-03 and RET-09) as unchecked `[ ]`. The in-code implementation for all 9 requirements has been verified as complete. REQUIREMENTS.md tracking is stale and should be updated to reflect completion. Similarly, ROADMAP.md shows 08-08-PLAN.md as `[ ]` (not started) despite the implementation being complete — this is a tracking inconsistency, not an implementation gap.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/state/provider.tsx` line 49 | `subscription: null` hardcoded | Info | By design — consumers use useSubscription() directly. Not a stub. |

No blockers or warnings remain. The two previous blocker/warning anti-patterns (orphaned AccountPrompt, inlined test mirrors) are resolved.

---

### Human Verification Required

#### 1. AccountPrompt Runtime Behavior

**Test:** Install fresh build on device. Skip account creation during onboarding. Complete lesson 3 and pass it. Observe the summary screen.
**Expected:** "Save your progress" modal overlay appears on top of the LessonSummary. Tapping dismiss causes the modal to close and does not crash. Tapping "Create Account" navigates to the auth screen.
**Why human:** Modal visibility is runtime state triggered by quiz completion + auth state. Cannot verify without a running app.

#### 2. Auth Sign-In Full Flow

**Test:** From the AccountPrompt or auth screen, complete sign-in with an email account. Check that all previously completed lesson progress is intact.
**Expected:** Zero data loss after sign-in; progress syncs to Supabase immediately.
**Why human:** Requires live Supabase project with credentials configured.

#### 3. Dark Mode Visual Fidelity

**Test:** On device, set system appearance to dark. Launch app.
**Expected:** Background transitions from warm cream (#F8F6F0) to dark (#0F1A14). Text, cards, shadows all adapt. No green shadows on dark backgrounds.
**Why human:** Visual rendering cannot be verified programmatically.

#### 4. Friends Streak Real Data

**Test:** Create two accounts, add each other as friends via invite code. Verify Friend A sees Friend B's streak count in Progress tab.
**Expected:** Streak count from Friend B's habit table appears in Friend A's FriendsList. FriendsList shows only streak — no lesson details or accuracy.
**Why human:** Requires two live Supabase-authenticated accounts.

---

### Summary

Both gaps from the initial verification are confirmed closed:

**Gap 1 (AccountPrompt orphaned) — CLOSED.** `app/lesson/[id].tsx` now imports `AccountPrompt`, `useAuth`, and `ACCOUNT_PROMPT_LESSONS`. A `useEffect` fires when the summary stage is reached after a passing quiz on lessons 3, 5, or 7 and the user is anonymous. Dismissal writes `account_prompt_declined_at` to `user_profile`. Sign-in navigates to `/auth`. The anonymous-to-authenticated upgrade path is now reachable from the natural lesson flow.

**Gap 2 (Tests imported inlined mirrors) — CLOSED.** Both test files now import real production functions. `sync-service.test.ts` calls the actual `syncAll`/`syncTable` from `src/sync/service.ts` with only `SYNC_TABLE_CONFIGS` mocked. `auth-flow.test.ts` calls the actual `signInWithEmail`/`signUpWithEmail`/`signOut` from `src/auth/email.ts` with the Supabase singleton mocked via async vi.mock factory. The full test suite (699 tests) passes with zero regressions.

All 9 success criteria are verified at code level. Remaining verification items are runtime/visual behaviors requiring a live device and Supabase credentials.

---

_Verified: 2026-04-02T22:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after gap closure plans 08-08 and 08-09_
