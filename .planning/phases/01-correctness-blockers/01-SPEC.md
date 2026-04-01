# Phase 1: Correctness Blockers — Technical Spec

**Purpose:** Fix 5 bugs that can crash the app, hang it, or corrupt user data. Each fix includes a regression test.

**Context:** Tila is preparing for App Store submission. These bugs are the most likely to cause rejection or 1-star reviews.

---

## Bug 1: Database initialization can hang forever

**File:** `src/db/provider.tsx` (lines 24-29)

**What happens:** When the app launches, it opens a local SQLite database. If that fails (permissions denied, disk full, corrupted DB), the app shows a loading spinner forever. There's no timeout, no error message, no retry button. The user is stuck.

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

**Why it matters:** This is the very first thing that runs. If it breaks, the user sees a frozen loading screen on first launch. Apple reviewers will reject this.

**Proposed fix:**
- Add a `.catch()` handler that shows an error screen with a "Try Again" button
- Add a timeout (e.g., 15 seconds) — if DB isn't ready by then, show the error screen
- The error screen should be simple: message explaining something went wrong + retry button

**What "fixed" looks like:**
- App launches to home screen within 15 seconds, or shows an error screen with retry
- Never hangs on a blank/loading screen indefinitely

---

## Bug 2: Quiz breaks when navigating between lessons

**File:** `src/hooks/useLessonQuiz.ts` (lines 47-65)

**What happens:** When a user finishes lesson 1 and opens lesson 2, the quiz hook may not generate new questions. A ref (`generatedRef`) is set to `true` on first use and never reset. The effect that generates questions checks this ref first and skips generation if it's already `true`.

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

**Why it matters:** The core learning loop breaks. User completes a lesson, taps the next one, and either sees an error or stale questions from the previous lesson.

**Note:** This bug may only trigger in certain navigation patterns. If Expo Router unmounts and remounts the component between lessons, the ref resets naturally. But if the component stays mounted (e.g., screen cached), the ref blocks re-generation. The fix should work regardless of mounting behavior.

**Proposed fix:**
- Reset `generatedRef.current = false` when the `lesson` prop changes (use a separate effect or check lesson identity)
- Alternatively, remove the ref guard entirely and use the `lesson.id` as a dependency key — regenerate whenever the lesson changes
- Also reset all quiz state (qIndex, results, streak, etc.) when lesson changes

**What "fixed" looks like:**
- User completes lesson 1, opens lesson 2, and sees fresh questions for lesson 2
- No stale questions from previous lessons appear

---

## Bug 3: Streak counter can double-count under rapid taps

**File:** `src/hooks/useHabit.ts` (lines 20-57)

**What happens:** The `recordPractice` function reads the current streak count from React state (`habit`), calculates the new value, and saves it. But the `habit` value is captured in a closure when the callback is created. If `recordPractice` is called twice quickly (e.g., double-tap, or two lesson completions in rapid succession), both calls read the same stale value and both increment from the same starting point.

**Current code:**
```typescript
const recordPractice = useCallback(async () => {
  if (!habit) return;                    // ← habit is stale if called twice quickly
  const today = getTodayDateString();
  const gap = lastDate ? getDayDifference(today, lastDate) : -1;

  let newWird = habit.currentWird;       // ← Both calls read the same value
  // ... increment logic ...

  await saveHabit(db, updated);          // ← Both calls write the same incremented value
  setHabit(updated);                     // ← Second call overwrites first call's result
}, [db, habit]);
```

**Example scenario:**
1. Streak is at 5
2. User completes a lesson → `recordPractice()` called, reads streak = 5, writes streak = 6
3. Before React re-renders, user completes another action → `recordPractice()` called again, reads streak = 5 (stale), writes streak = 6 (should be 7)

**Why it matters:** Streaks are the main retention mechanic. If the number is wrong — either not incrementing when it should, or jumping unexpectedly — users lose trust.

**Proposed fix:**
- Read fresh habit state from the database inside `recordPractice` instead of relying on the closure
- Or use a ref to track the latest habit state so the callback always reads current values
- Either approach eliminates the stale-closure problem

**What "fixed" looks like:**
- Rapid consecutive calls to `recordPractice` produce correct sequential streak values
- No duplicate or skipped increments

---

## Bug 4: Home screen can loop between routes at midnight

**File:** `app/(tabs)/index.tsx` (lines 343-359)

**What happens:** The home screen has a `useEffect` that checks whether to redirect the user (to onboarding, or to a "welcome back" screen). One of its dependencies is `today` — today's date as a string. If the user is using the app at midnight, `today` changes from "2026-03-31" to "2026-04-01", the effect re-fires, and the routing logic may redirect them mid-session.

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

**Why it matters:** User practicing at night suddenly gets kicked out of their session. Feels like a crash.

**Proposed fix:**
- Pin `today` on component mount (use `useRef` or `useState` with initial value only) so it doesn't change mid-session
- Or add a navigation guard (ref tracking whether we've already navigated) to prevent duplicate redirects
- The return-welcome screen should only show on fresh app opens, not mid-session date rollovers

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

**What this is:** Each of the 5 fixes above needs at least one automated test that:
1. Fails without the fix (proves the bug existed)
2. Passes with the fix (proves it's actually fixed)
3. Prevents future regressions

**Testing stack:** Vitest (already configured). Tests live in `src/__tests__/`. Existing test suite covers mastery, quiz behavior, schema, streaks, and error boundaries.

**Tests needed:**

| Bug | Test description |
|-----|-----------------|
| Bug 1 | DB init failure → error state set (not hanging). Mock `getDatabase` to reject. |
| Bug 2 | Lesson change → questions regenerated. Simulate mount with lesson A, then update to lesson B. |
| Bug 3 | Rapid `recordPractice` calls → correct sequential streak. Call twice before await resolves. |
| Bug 4 | Date change mid-session → no re-navigation. Mount with today="03-31", update to "04-01". |
| Bug 5 | Migration v2 with existing columns → no error. Migration v2 with real DB error → error propagates. |

**What "fixed" looks like:**
- `npm test` runs all regression tests, all green
- Each test documents the bug it prevents (in test description)

---

## Summary

| # | Bug | Severity | File | Risk if unfixed |
|---|-----|----------|------|-----------------|
| 1 | DB init hangs forever | CRITICAL | src/db/provider.tsx | App Store rejection — frozen launch |
| 2 | Quiz ref not reset | HIGH | src/hooks/useLessonQuiz.ts | Broken learning loop |
| 3 | Streak race condition | MEDIUM | src/hooks/useHabit.ts | Incorrect streak display |
| 4 | Midnight routing loop | MEDIUM | app/(tabs)/index.tsx | User kicked out mid-session |
| 5 | Silent migration errors | MEDIUM | src/db/client.ts | Data corruption risk |

**Dependencies:** Bug 1 should be fixed first (other bugs don't matter if the app can't launch). Bugs 2-5 are independent of each other. Bug 6 (tests) is done alongside each fix.

---

*Spec created: 2026-04-01*
*For expert review before implementation*
