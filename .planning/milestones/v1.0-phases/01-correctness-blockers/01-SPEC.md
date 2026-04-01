# Phase 1: Correctness Blockers — Technical Spec

**Purpose:** Fix 5 bugs that can crash the app, hang it, or corrupt user data. Each fix includes a regression test.

**Context:** Tila is preparing for App Store submission. These bugs are the most likely to cause rejection or 1-star reviews.

---

## Bug 1: Database initialization can hang forever

**File:** `src/db/provider.tsx` (lines 24-29)

**What happens:** When the app launches, it opens a local SQLite database. If that fails (permissions denied, disk full, corrupted DB), the app shows a loading spinner forever. There's no timeout, no error message, no retry button. The user is stuck. The root layout uses `DatabaseProvider fallback={<AppLoadingScreen />}`, so there is a branded loading screen — but it can sit there indefinitely if init rejects or never resolves.

**Current code:**
```typescript
useEffect(() => {
  getDatabase().then((database) => {
    setDb(database);
    onReady?.();
  });
  // ← No .catch() handler. If getDatabase() throws, nothing happens.
}, []);
```

**Why it matters:** This is the very first thing that runs. If it breaks, the user sees a frozen branded loading screen on first launch with no way to recover. Apple reviewers will reject this.

**Proposed fix — init state machine:**
- Replace the boolean `db` state with a three-state machine: `loading | error | ready`
- Add a `.catch()` handler that transitions to `error` state
- Add a timeout (e.g., 15 seconds) — if DB isn't ready by then, transition to `error`
- Clean up the timeout on success (prevent late resolution after timeout fires)
- `error` state renders an error screen with a "Try Again" button
- **Retry protection:** on retry, guard against late resolution from the previous attempt (e.g., track attempt count or use an AbortController pattern so a stale `.then()` from attempt 1 doesn't clobber attempt 2's state)

**What "fixed" looks like:**
- App launches to home screen within 15 seconds, or shows an error screen with retry
- Never hangs on a blank/loading screen indefinitely
- Tapping "Try Again" after a failure retries cleanly without interference from the previous attempt

---

## Bug 2: Quiz state can persist incorrectly across lesson identity changes

**File:** `src/hooks/useLessonQuiz.ts` (lines 47-65), `app/lesson/[id].tsx` (missing `key` on `<LessonQuiz>`)

**What happens:** When a user finishes lesson 1 and opens lesson 2, quiz state may not fully reset. The `generatedRef` is set to `true` on first use and never reset. Additionally, `LessonScreen` renders `<LessonQuiz lesson={lesson} ... />` without a `key` prop, so if the component instance is reused across lesson changes, all hook state (questions, qIndex, results, streak) persists from the previous lesson.

**Current code:**
```typescript
const generatedRef = useRef(false);

useEffect(() => {
  if (generatedRef.current) return;  // ← Blocks forever after first lesson
  generatedRef.current = true;

  const qs = generateLessonQuestions(lesson, progress);
  if (!qs || qs.length === 0) {
    setError('No questions could be generated...');
    return;
  }
  setQuestions(qs);
}, [lesson, completedLessonIds, mastery]);
```

**Severity:** This is a conditional bug, not a guaranteed one. Because lesson changes often happen via route changes (`/lesson/[id]`), Expo Router typically unmounts and remounts the screen, which resets all hook state naturally. But if the component stays mounted (screen caching, pre-rendering, or future navigation changes), the bug surfaces. The fix should work regardless of mounting behavior.

**Why it matters:** The real problem is broader than just `generatedRef` — it's that all lesson-scoped state (questions, progress index, results, streak, mid-celebration flag) can persist across lesson identity changes if the component isn't remounted.

**Proposed fix (preferred: key-based reset):**
- Add `key={lesson.id}` to `<LessonQuiz>` in `LessonScreen` — this forces React to unmount and remount the component when the lesson changes, resetting all hook state cleanly
- This is simpler and more robust than resetting individual pieces of state, because it covers everything: the ref, useState values, useRef values, and any future state additions

**Alternative fix (if key-based reset has side effects):**
- Add a full lesson-reset effect that watches `lesson.id` and resets all state: `generatedRef`, `questions`, `qIndex`, `quizResults`, `streak`, `originalQCount`, `midPoint`, `showMidCelebrate`, `midShown`, `isComplete`, `error`
- This is more fragile because every new piece of state must be manually added to the reset list

**What "fixed" looks like:**
- User completes lesson 1, opens lesson 2, and sees fresh questions for lesson 2
- No stale questions, progress, or streak from previous lessons appear
- Works regardless of whether the component remounts or stays mounted

---

## Bug 3: Rapid practice calls can clobber habit state

**File:** `src/hooks/useHabit.ts` (lines 20-57)

**What happens:** The `recordPractice` function reads habit state from a React closure (`habit`), computes updates, and writes back. If called twice in rapid succession before React re-renders, both calls read the same stale state and the second call's write overwrites the first call's result.

**Current code:**
```typescript
const recordPractice = useCallback(async () => {
  if (!habit) return;                    // ← habit is stale if called twice quickly
  const today = getTodayDateString();
  const gap = lastDate ? getDayDifference(today, lastDate) : -1;

  let newWird = habit.currentWird;       // ← Both calls read the same value
  let newTodayCount = habit.todayLessonCount;

  if (gap === 0) {
    newTodayCount += 1;                  // ← Same-day: only todayLessonCount increments
  } else if (gap === 1) {
    newWird += 1;                        // ← Consecutive day: streak increments
    newTodayCount = 1;
  } else {
    newWird = 1;                         // ← Gap > 1: streak resets
    newTodayCount = 1;
  }

  await saveHabit(db, updated);          // ← Both calls write from same starting point
  setHabit(updated);                     // ← Second call overwrites first call's result
}, [db, habit]);
```

**Actual failure scenario:**
1. User completed a lesson yesterday (lastPracticeDate = yesterday, currentWird = 5, todayLessonCount = 0)
2. User completes lesson today → first `recordPractice()` call reads stale state, computes: gap = 1, so currentWird = 6, todayLessonCount = 1. Writes to DB.
3. Before React re-renders, user rapidly completes another lesson → second `recordPractice()` call reads the same stale closure state (currentWird still 5, todayLessonCount still 0). Computes: gap = 1 again (same stale lastPracticeDate), so currentWird = 6, todayLessonCount = 1. Overwrites the DB.
4. Result: todayLessonCount is 1 instead of 2. The second lesson completion was lost.

**The bug is lost updates / clobbered habit state**, not double-incrementing the streak on the same day. The streak logic itself is correct — the problem is that concurrent calls read-modify-write from the same stale starting point.

**Why it matters:** Streaks are the main retention mechanic. Lost updates erode trust — the user completed two lessons but the app only counted one.

**Proposed fix — serialize or use atomic read-modify-write:**
- **Option A (serialize):** Queue `recordPractice` calls so they execute sequentially. Use a promise chain or mutex ref so call 2 waits for call 1 to finish before reading state.
- **Option B (atomic transaction):** Read fresh habit state from the DB inside `recordPractice` (not from the closure), compute updates, and write back — all within a single SQLite transaction (`db.withExclusiveTransactionAsync`). This prevents concurrent reads from seeing the same pre-update state.
- **Option C (ref + serialize):** Keep a ref to latest habit state (updated synchronously on each call) combined with a queue. Simpler than a transaction but still prevents stale reads.

**Note:** "Read fresh from DB" alone is not fully safe if two calls race — both could read the same DB row before either writes. Serialization or a transaction is needed to guarantee correctness.

**What "fixed" looks like:**
- Rapid consecutive calls to `recordPractice` produce correct sequential results (no lost updates)
- todayLessonCount accurately reflects the number of lessons completed today
- Streak (currentWird) increments correctly on day boundaries

---

## Bug 4: Midnight date rollover can trigger unexpected reroute

**File:** `app/(tabs)/index.tsx` (lines 343-359)

**What happens:** The home screen has a `useEffect` that checks whether to redirect the user (to onboarding, or to a "welcome back" screen). One of its dependencies is `today` — today's date as a string, recomputed on every render. If the user is using the app at midnight, `today` changes from "2026-03-31" to "2026-04-01", the effect re-fires, and the routing logic may redirect them to the return-welcome screen mid-session.

**Current code:**
```typescript
const today = getTodayDateString();  // ← Recalculates on every render

useEffect(() => {
  if (progress.loading) return;
  if (!onboarded) { router.replace("/onboarding"); return; }

  const lastPractice = habit?.lastPracticeDate;
  if (lastPractice) {
    const gap = getDayDifference(today, lastPractice);  // ← gap changes at midnight
    if (gap >= 1 && returnHadithLastShown !== today) {
      router.replace("/return-welcome");                 // ← Fires unexpectedly
      return;
    }
  }
}, [progress.loading, onboarded, habit?.lastPracticeDate, today, returnHadithLastShown]);
```

**Severity:** This is a real UX risk — an unexpected mid-session reroute — but "loop" overstates the behavior. From the current code, it's a single unwanted redirect to `/return-welcome`, not a proven infinite loop between routes. Still disruptive: the user is pulled out of their session at midnight.

**Why it matters:** User practicing at night suddenly gets redirected to a welcome-back screen. Feels broken and interrupts their flow.

**Proposed fix (choose one):**

- **Option A: Pin session date on mount.** Use `useState(() => getTodayDateString())` or `useRef(getTodayDateString())` so `today` is frozen for the lifetime of the component. The redirect logic only evaluates with the date the session started on.

- **Option B: Track "return-welcome already evaluated this session."** Add a ref (`hasEvaluatedRedirect`) that is set to `true` after the first eligible redirect evaluation once `progress.loading` has resolved. This ensures the ref is only set after a real evaluation — not before loading completes, which would accidentally suppress a legitimate first-run redirect. Subsequent effect runs (from date changes or other deps) skip the redirect logic entirely.

Both options ensure the return-welcome redirect only triggers on fresh app opens, not mid-session date rollovers.

**What "fixed" looks like:**
- User who has the app open at 11:59 PM and continues past midnight is not redirected
- Return-welcome logic only triggers on fresh app launches, not mid-session

---

## Bug 5: Migration v2 swallows all errors silently

**File:** `src/db/client.ts` (lines 38-49)

**What happens:** The v2 database migration wraps 3 ALTER TABLE statements in a single try/catch that catches ALL errors. The comment says "columns may already exist" — but the catch also swallows real failures (disk full, permission denied, corrupted DB). The migration is then marked as complete (version bumped to 2) even if it partially failed. Later migrations (v3, v4, v5) correctly use `PRAGMA table_info` to check before altering.

**Current code:**
```typescript
if (currentVersion < 2) {
  try {
    await db.execAsync(`
      ALTER TABLE user_profile ADD COLUMN wird_intro_seen INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE user_profile ADD COLUMN post_lesson_onboard_seen INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE user_profile ADD COLUMN return_hadith_last_shown TEXT;
    `);
  } catch {
    // Columns may already exist if DB was created fresh with v2 schema
    // ← But this also catches disk errors, permission errors, etc.
  }
  await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (2)");
  // ← Version bumped even if migration failed
}
```

**Contrast with v3+ migrations (correct pattern):**
```typescript
if (currentVersion < 3) {
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(mastery_confusions)"
  );
  const hasCategories = tableInfo.some((col) => col.name === "categories");
  if (!hasCategories) {
    await db.execAsync("ALTER TABLE mastery_confusions ADD COLUMN categories TEXT;");
  }
  // ← Only runs ALTER if column is actually missing. Real errors propagate.
}
```

**Why it matters:** If migration v2 partially fails (e.g., first column added, second fails), the DB is in an inconsistent state but the app thinks it's at version 2. User might see crashes or data loss later.

**Proposed fix:**
- Replace the try/catch with the same PRAGMA table_info pattern used in v3-v5
- Check each column individually before adding
- Let real errors propagate (no blanket catch)

**What "fixed" looks like:**
- Migration v2 uses `PRAGMA table_info` checks, consistent with v3-v5 pattern
- Real database errors (disk full, permission denied) propagate and trigger error handling (Bug 1's error screen)
- "Column already exists" scenarios are handled gracefully without try/catch

---

## Bug 6: Regression tests for each fix

**What this is:** Each of the 5 fixes above needs targeted regression test coverage proving the bad path is prevented. This is not "add testing from scratch" — the repo already has a substantial Vitest suite (`app-loading.test.ts`, `home-streak.test.ts`, `quiz-progress.test.ts`, `error-boundary.test.ts`, `schema-v5.test.ts`). This phase adds targeted coverage for 5 specific risky flows.

**Testing stack:** Vitest (already configured). Tests live in `src/__tests__/`.

**Tests needed:**

| Bug | Test description |
|-----|-----------------|
| Bug 1 | DB init failure → provider transitions to error state (not hanging). Mock `getDatabase` to reject. Verify timeout fires if promise never resolves. Verify retry cleans up stale attempt. |
| Bug 2 | Component receives new lesson identity → all quiz state resets. If using key-based reset, verify unmount/remount. If using effect-based reset, verify all state fields clear. |
| Bug 3 | Two `recordPractice` calls in rapid succession → second call reflects first call's writes. Verify todayLessonCount = 2 (not 1) after two same-day completions. |
| Bug 4 | Date value changes while component is mounted → no redirect fires. Verify return-welcome redirect only triggers on initial mount evaluation. |
| Bug 5 | Migration v2 with existing columns → no error, version bumped. Migration v2 with simulated DB error → error propagates, version NOT bumped. |

**Note:** Some timing and async-init behaviors are better verified as behavior tests (proving the bad path is prevented) than strict red/green historical reproductions. The goal is "this test would catch a regression," not necessarily "this test fails on the exact old code."

**What "fixed" looks like:**
- `npm test` runs all regression tests, all green
- Each test documents which bug it prevents (in test description)
- New tests integrate with existing test suite conventions

---

## Summary

| # | Bug | Severity | File | Risk if unfixed |
|---|-----|----------|------|-----------------|
| 1 | DB init hangs forever | CRITICAL | src/db/provider.tsx | App Store rejection — frozen launch |
| 2 | Quiz state persists across lessons | HIGH (conditional) | src/hooks/useLessonQuiz.ts, LessonQuiz.tsx | Stale questions if component reused |
| 3 | Rapid practice clobbers habit state | MEDIUM | src/hooks/useHabit.ts | Lost lesson count updates |
| 4 | Midnight reroute | MEDIUM | app/(tabs)/index.tsx | User redirected mid-session |
| 5 | Silent migration errors | MEDIUM | src/db/client.ts | Data corruption risk |

**Dependencies:** Bug 1 should be fixed first (other bugs don't matter if the app can't launch). Bugs 2-5 are independent of each other. Bug 6 (tests) is done alongside each fix.

---

*Spec created: 2026-04-01*
*Revised: 2026-04-01 after expert review — corrected Bug 2 framing (conditional, prefer key-based reset), Bug 3 example (lost updates not double-increment), Bug 4 severity (reroute not loop), Bug 1 implementation notes (state machine + retry protection), Bug 6 test bar (behavior tests not strict red/green)*
