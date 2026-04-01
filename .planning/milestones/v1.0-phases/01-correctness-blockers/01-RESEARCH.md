# Phase 1: Correctness Blockers - Research

**Researched:** 2026-03-31
**Domain:** React Native bug fixes, SQLite error handling, React state management
**Confidence:** HIGH

## Summary

This phase fixes 5 known bugs that can crash, hang, or corrupt data in the Tila mobile app, plus adds regression tests for each fix. All bugs have been precisely located in source code with exact line numbers and confirmed root causes. The fixes are surgical -- no refactoring, no new features.

The primary technical challenges are: (1) implementing a state machine for DB init with retry protection against stale promise resolution, (2) choosing the right serialization strategy for habit updates given expo-sqlite's transaction API, and (3) writing meaningful regression tests in Vitest for React hook and component behaviors without a DOM environment.

**Primary recommendation:** Fix bugs in dependency order (Bug 1 first, then 2-5 in parallel), write each regression test alongside its fix, use `withExclusiveTransactionAsync` for Bug 3's atomic read-modify-write.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: DatabaseProvider must use a three-state machine: `loading | error | ready`
- D-02: Add timeout (15s) with cleanup on success
- D-03: Retry must guard against late resolution from previous attempt (track attempt count or use abort pattern)
- D-04: Error state renders recovery UI with "Try Again" button
- D-05: Preferred fix is `key={lesson.id}` on `<LessonQuiz>` in `app/lesson/[id].tsx`
- D-06: Fallback only if key-based reset has side effects: full lesson-reset effect watching `lesson.id`
- D-07: The real problem is all lesson-scoped state, not just generatedRef
- D-08: Fix must serialize or use atomic read-modify-write
- D-09: Options: promise chain/mutex, SQLite exclusive transaction, or ref + serialize
- D-10: The actual failure is lost todayLessonCount updates, not streak double-increment
- D-11: Choose one: pin session date on mount (Option A) or track "already evaluated after loading resolved" ref (Option B)
- D-12: If Option B: ref must only be set after first eligible evaluation once `progress.loading` has resolved
- D-13: Replace blanket try/catch with PRAGMA table_info checks per column, matching v3-v5 pattern
- D-14: Real DB errors must propagate (no blanket catch)
- D-15: Targeted regression coverage, not testing from scratch
- D-16: Tests prove the bad path is prevented (behavior tests)
- D-17: Each test documents which bug it prevents

### Claude's Discretion
- Choice between Option A vs Option B for Bug 4 (both are approved approaches)
- Choice between serialization strategies for Bug 3 (mutex vs transaction vs ref+serialize)
- Test file organization (new files vs extending existing test files)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRIT-01 | DB initialization has timeout + recovery UI instead of hanging forever | Bug 1 fix: state machine in provider.tsx, ErrorFallback reuse, attempt-guarded retry |
| CRIT-02 | Quiz hook correctly resets when lesson changes | Bug 2 fix: `key={lesson.id}` on LessonQuiz in lesson/[id].tsx |
| CRIT-03 | Streak updates are race-condition-proof under rapid recordPractice calls | Bug 3 fix: withExclusiveTransactionAsync for atomic read-modify-write |
| CRIT-04 | Home screen routing handles midnight date boundary without rerouting | Bug 4 fix: pin session date or hasEvaluated ref |
| CRIT-05 | Migration error handling distinguishes "column exists" from real failures | Bug 5 fix: PRAGMA table_info pattern per column, matching v3-v5 |
| CRIT-06 | Regression tests added for each correctness fix | Bug 6: targeted Vitest tests alongside each fix |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | 55.0.11 | SQLite database (all persistent state) | Already in use, provides `withExclusiveTransactionAsync` |
| react | 19.2.0 | UI framework | Already in use |
| vitest | 4.1.2 | Test runner | Already configured, tests in `src/__tests__/` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (no new deps) | - | - | All fixes use existing libraries |

**No new dependencies required.** All 5 bug fixes use existing APIs and patterns already in the codebase.

## Architecture Patterns

### Pattern 1: State Machine for Async Init (Bug 1)
**What:** Replace boolean null-check with explicit `loading | error | ready` state in DatabaseProvider.
**When to use:** Any async initialization that can fail and needs user-recoverable error handling.

```typescript
// Source: src/db/provider.tsx — proposed pattern
type InitState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; db: SQLiteDatabase };

export function DatabaseProvider({ children, fallback, onReady }: DatabaseProviderProps) {
  const [state, setState] = useState<InitState>({ status: 'loading' });
  const attemptRef = useRef(0);

  const initDb = useCallback(() => {
    const thisAttempt = ++attemptRef.current;
    setState({ status: 'loading' });

    const timeout = setTimeout(() => {
      if (attemptRef.current === thisAttempt) {
        setState({ status: 'error', error: new Error('Database initialization timed out') });
      }
    }, 15_000);

    getDatabase()
      .then((database) => {
        if (attemptRef.current !== thisAttempt) return; // stale attempt guard
        clearTimeout(timeout);
        setState({ status: 'ready', db: database });
        onReady?.();
      })
      .catch((err) => {
        if (attemptRef.current !== thisAttempt) return;
        clearTimeout(timeout);
        setState({ status: 'error', error: err });
      });

    return () => clearTimeout(timeout);
  }, [onReady]);

  useEffect(() => {
    return initDb();
  }, [initDb]);

  if (state.status === 'loading') return <>{fallback}</>;
  if (state.status === 'error') return <ErrorFallback onRetry={initDb} />;

  return (
    <DatabaseContext.Provider value={state.db}>{children}</DatabaseContext.Provider>
  );
}
```

**Key details verified in source:**
- `app/_layout.tsx` line 75: `<DatabaseProvider fallback={<AppLoadingScreen />}>` -- the fallback prop is already used for loading state
- `ErrorFallback` component exists at `src/components/feedback/ErrorFallback.tsx` with `onRetry` prop -- can be reused directly for error state
- `ErrorFallback` uses `useColors()` which requires `ThemeContext` -- and ThemeContext wraps DatabaseProvider in `_layout.tsx`, so this works
- The `getDatabase()` function in `client.ts` is a singleton with `dbInstance` caching -- retry after error is safe because `dbInstance` is only set on success
- **Important:** `getDatabase()` sets `dbInstance = db` at the end (line 28). If `getDatabase()` rejects, `dbInstance` remains null, so the next call will attempt again. This means retry works correctly without resetting the singleton.

### Pattern 2: Key-Based Component Reset (Bug 2)
**What:** Use React's `key` prop to force unmount/remount when lesson identity changes, resetting all hook state.
**When to use:** When a component has many pieces of internal state that all need to reset when a prop changes.

```typescript
// Source: app/lesson/[id].tsx — current code (line 299)
<LessonQuiz
  lesson={lesson}
  completedLessonIds={completedLessonIds}
  mastery={mastery}
  onComplete={handleQuizComplete}
/>

// Fixed: add key prop
<LessonQuiz
  key={lesson.id}
  lesson={lesson}
  completedLessonIds={completedLessonIds}
  mastery={mastery}
  onComplete={handleQuizComplete}
/>
```

**Verified in source:** `LessonScreen` renders `LessonQuiz` at line 299 of `app/lesson/[id].tsx`. The same pattern should be applied to `LessonHybrid` at line 296 (`key={lesson.id}`) for consistency, since it also has internal state.

### Pattern 3: Atomic Read-Modify-Write with Exclusive Transaction (Bug 3)
**What:** Use `db.withExclusiveTransactionAsync()` to read fresh habit state from DB, compute updates, and write back atomically.
**When to use:** When concurrent async calls can race on the same mutable state.

**API verified from expo-sqlite 55.0.11 type definitions:**
```typescript
// withExclusiveTransactionAsync receives a Transaction (extends SQLiteDatabase)
db.withExclusiveTransactionAsync(async (txn) => {
  // txn has all SQLiteDatabase methods (getFirstAsync, runAsync, etc.)
  const row = await txn.getFirstAsync<{...}>('SELECT ... FROM habit WHERE id = 1');
  // compute updates...
  await txn.runAsync('UPDATE habit SET ...', ...params);
});
```

**Recommendation: Use `withExclusiveTransactionAsync` (Option B from spec).**
Rationale:
- It is available in expo-sqlite 55.0.11 (verified in type definitions)
- It provides database-level serialization -- no JS-level mutex needed
- Already used in the codebase (`progress.ts` line 441 uses `withTransactionAsync`)
- The `txn` parameter provides a separate connection that serializes writes
- Eliminates the closure-stale-state problem entirely because state is read from DB inside the transaction

**Important nuance:** The current `recordPractice` reads from React state (`habit`), computes, then writes to DB. The fix must read fresh from DB inside the transaction, not from the closure. The `loadHabit` function in `src/engine/habit.ts` does exactly this query and can be adapted to accept a `txn` parameter (or the query can be inlined).

After the transaction, `setHabit(updated)` must still be called to sync React state.

A **mutex/queue approach** (Option A/C) would also work but adds JS complexity that the DB-level lock handles natively. The exclusive transaction is the cleanest solution.

### Pattern 4: Pinned Session Date (Bug 4 — Recommended: Option A)
**What:** Use `useState(() => getTodayDateString())` to freeze the date for the component's lifetime.
**When to use:** When a derived value should not change mid-session.

**Recommendation: Option A (pin session date).**
Rationale:
- Simpler: one line change from `const today = getTodayDateString()` to `const [today] = useState(() => getTodayDateString())`
- No risk of accidentally suppressing legitimate redirects (Option B's danger)
- The pinned date is correct for the user's session -- if they opened the app "today", the routing logic should evaluate based on "today" at open time
- If the user backgrounds and reopens the app, the component will remount and get the new date naturally

```typescript
// Current (line 299 of app/(tabs)/index.tsx):
const today = getTodayDateString();

// Fixed:
const [today] = useState(() => getTodayDateString());
```

### Pattern 5: PRAGMA table_info Column Check (Bug 5)
**What:** Check column existence with `PRAGMA table_info` before `ALTER TABLE ADD COLUMN`.
**When to use:** Database migrations that add columns which may already exist.

```typescript
// Source: src/db/client.ts lines 52-63 (v3 migration — the correct pattern)
if (currentVersion < 2) {
  const profileInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(user_profile)"
  );
  const hasWirdIntro = profileInfo.some((col) => col.name === "wird_intro_seen");
  if (!hasWirdIntro) {
    await db.execAsync("ALTER TABLE user_profile ADD COLUMN wird_intro_seen INTEGER NOT NULL DEFAULT 0;");
  }
  const hasPostLesson = profileInfo.some((col) => col.name === "post_lesson_onboard_seen");
  if (!hasPostLesson) {
    await db.execAsync("ALTER TABLE user_profile ADD COLUMN post_lesson_onboard_seen INTEGER NOT NULL DEFAULT 0;");
  }
  const hasReturnHadith = profileInfo.some((col) => col.name === "return_hadith_last_shown");
  if (!hasReturnHadith) {
    await db.execAsync("ALTER TABLE user_profile ADD COLUMN return_hadith_last_shown TEXT;");
  }
  await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (2)");
}
```

**Note:** All 3 columns are on the same table (`user_profile`), so one `PRAGMA table_info` call suffices. The v3 migration at lines 52-63 of `client.ts` is the reference pattern.

### Anti-Patterns to Avoid
- **Blanket try/catch on DB operations:** Swallows real errors (disk full, permissions). Bug 5 is caused by this exact anti-pattern.
- **Reading React closure state for concurrent async writes:** Stale closure problem. Bug 3 is caused by this.
- **Recalculating derived values on every render when stability matters:** Bug 4 is caused by `getTodayDateString()` being called on every render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB-level write serialization | JS mutex/lock library | `db.withExclusiveTransactionAsync()` | Built into expo-sqlite, handles edge cases |
| Component state reset on prop change | Manual reset effect for N state variables | React `key` prop | Handles all state (useState, useRef, closures) automatically |
| Error recovery UI | New error component | Existing `ErrorFallback` component | Already styled with design system, has `onRetry` prop |

## Common Pitfalls

### Pitfall 1: Stale Promise Resolution on Retry (Bug 1)
**What goes wrong:** User taps "Try Again", a new `getDatabase()` call starts. But the original (timed-out) call finally resolves and calls `setState({ status: 'ready', db })`, clobbering the retry flow.
**Why it happens:** Promises can't be cancelled. A timed-out promise may still resolve later.
**How to avoid:** Track attempt count in a ref. Each `.then()` checks if its attempt number matches the current ref value before calling setState.
**Warning signs:** Flaky behavior where retry sometimes works and sometimes shows loading forever.

### Pitfall 2: ErrorFallback Needs ThemeContext (Bug 1)
**What goes wrong:** ErrorFallback uses `useColors()` which requires ThemeContext. If DatabaseProvider error state renders outside ThemeContext, it crashes.
**Why it happens:** Component assumes context is available.
**How to avoid:** Verified: `_layout.tsx` wraps DatabaseProvider inside ThemeContext (line 71-76), so ErrorFallback will have access to colors. No issue.
**Warning signs:** "Cannot read property of null" error on the error screen itself.

### Pitfall 3: withExclusiveTransactionAsync Uses Separate Connection (Bug 3)
**What goes wrong:** Code inside `withExclusiveTransactionAsync` callback must use the `txn` parameter, not the outer `db` reference. Using `db` inside the callback defeats the purpose of the exclusive transaction.
**Why it happens:** The `txn` parameter is a `Transaction` that extends `SQLiteDatabase` with a separate connection. Reads/writes through `txn` are serialized; reads/writes through `db` are not.
**How to avoid:** Always use `txn.getFirstAsync()`, `txn.runAsync()` etc. inside the callback. Never reference the outer `db` variable.
**Warning signs:** Race conditions persist despite using exclusive transaction.

### Pitfall 4: Test Environment Limitations (Bug 6)
**What goes wrong:** Tests try to render React components or use React hooks but Vitest has no DOM/React Native renderer configured.
**Why it happens:** The existing test suite tests behavior via source code analysis (reading files with `fs`), pure function testing, or engine logic testing. There are no component render tests.
**How to avoid:** Test the logic, not the rendering. For Bug 1: test the state machine logic (mock getDatabase, verify state transitions). For Bug 3: test the serialization behavior (mock DB). For Bug 4: test the pinned date behavior. For Bug 2: verify the key prop exists in source. For Bug 5: test migration logic with mock DB.
**Warning signs:** Tests that import React components and try to render them will fail without additional setup (no `@testing-library/react-native` in deps).

### Pitfall 5: getDatabase Singleton After Error (Bug 1)
**What goes wrong:** After `getDatabase()` throws, the singleton `dbInstance` in `client.ts` remains null. On retry, `getDatabase()` will attempt a fresh `openDatabaseAsync` call, which is correct. But if the underlying issue persists (e.g., disk full), retries will keep failing.
**Why it happens:** The singleton pattern works correctly for retry (instance only set on success at line 28).
**How to avoid:** No action needed -- the singleton pattern already handles this correctly. Just ensure the error UI communicates that the problem may be persistent.

## Code Examples

### Bug 1: State Machine Implementation
See Architecture Patterns > Pattern 1 above for the full implementation.

### Bug 3: Exclusive Transaction for Habit Updates
```typescript
// Source: expo-sqlite type definitions + src/engine/habit.ts
const recordPractice = useCallback(async () => {
  await db.withExclusiveTransactionAsync(async (txn) => {
    // Read fresh from DB inside transaction
    const row = await txn.getFirstAsync<{
      last_practice_date: string | null;
      current_wird: number;
      longest_wird: number;
      today_lesson_count: number;
    }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1');

    if (!row) return;

    const today = getTodayDateString();
    const gap = row.last_practice_date ? getDayDifference(today, row.last_practice_date) : -1;

    let newWird = row.current_wird;
    let newLongest = row.longest_wird;
    let newTodayCount = row.today_lesson_count;

    if (gap === 0) {
      newTodayCount += 1;
    } else if (gap === 1) {
      newWird += 1;
      newTodayCount = 1;
    } else {
      newWird = 1;
      newTodayCount = 1;
    }
    if (newWird > newLongest) newLongest = newWird;

    const updated: HabitState = {
      lastPracticeDate: today,
      currentWird: newWird,
      longestWird: newLongest,
      todayLessonCount: newTodayCount,
    };

    await txn.runAsync(
      `UPDATE habit SET last_practice_date = ?, current_wird = ?, longest_wird = ?, today_lesson_count = ?, updated_at = datetime('now') WHERE id = 1`,
      updated.lastPracticeDate,
      updated.currentWird,
      updated.longestWird,
      updated.todayLessonCount
    );

    // Sync React state after transaction commits
    setHabit(updated);
  });
}, [db]); // Note: no longer depends on `habit` — reads from DB
```

**Key change:** The dependency array no longer includes `habit` because the function reads fresh state from the DB inside the transaction, not from the React closure.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRIT-01 | DB init failure transitions to error state, timeout fires, retry guards stale attempts | unit (mock getDatabase) | `npx vitest run src/__tests__/db-init.test.ts -x` | No -- Wave 0 |
| CRIT-02 | LessonQuiz receives key prop forcing remount on lesson change | source analysis | `npx vitest run src/__tests__/quiz-lesson-reset.test.ts -x` | No -- Wave 0 |
| CRIT-03 | Two rapid recordPractice calls produce correct sequential results | unit (mock DB) | `npx vitest run src/__tests__/habit-race.test.ts -x` | No -- Wave 0 |
| CRIT-04 | Date change while mounted does not trigger redirect | unit (logic test) | `npx vitest run src/__tests__/midnight-redirect.test.ts -x` | No -- Wave 0 |
| CRIT-05 | Migration v2 with existing columns succeeds; real DB error propagates | unit (mock DB) | `npx vitest run src/__tests__/migration-v2.test.ts -x` | No -- Wave 0 |
| CRIT-06 | All above tests pass | integration | `npm test` | N/A |

### Testing Strategy Notes

The existing test suite uses several patterns:
1. **Source analysis tests** (read file with `fs`, assert patterns exist) -- used in `app-loading.test.ts`, `schema-v5.test.ts`
2. **Pure function tests** -- used in `mastery.test.js`, `outcome.test.js`, `selectors.test.js`
3. **Mock-based logic tests** -- not yet used for hooks, but the pattern is standard in Vitest

For this phase, **source analysis tests** are appropriate for Bug 2 (verify key prop exists) and Bug 5 (verify no blanket catch). **Mock-based logic tests** are needed for Bug 1 (mock getDatabase, test state transitions), Bug 3 (mock DB, test serialization), and Bug 4 (test date pinning logic).

**Important limitation:** There is no `@testing-library/react-native` or equivalent in the project. Hook testing must either:
- Extract the logic into testable pure functions and test those
- Use source analysis (file reading) to verify structural changes
- Mock at the module level and test the exported functions

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/db-init.test.ts` -- covers CRIT-01
- [ ] `src/__tests__/quiz-lesson-reset.test.ts` -- covers CRIT-02
- [ ] `src/__tests__/habit-race.test.ts` -- covers CRIT-03
- [ ] `src/__tests__/midnight-redirect.test.ts` -- covers CRIT-04
- [ ] `src/__tests__/migration-v2.test.ts` -- covers CRIT-05

No new framework install needed -- Vitest is already configured.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `db.withTransactionAsync` (non-exclusive) | `db.withExclusiveTransactionAsync` (exclusive) | expo-sqlite 55 | Exclusive transactions prevent concurrent read races |
| Blanket try/catch for migrations | PRAGMA table_info checks | Already used in v3-v5 migrations | Lets real errors propagate |

## Open Questions

1. **LessonHybrid key prop**
   - What we know: `LessonHybrid` is rendered at line 296 without a key prop, same as `LessonQuiz`
   - What's unclear: Whether `LessonHybrid` has internal state that persists incorrectly (it likely does)
   - Recommendation: Apply `key={lesson.id}` to both `LessonQuiz` and `LessonHybrid` for consistency

2. **setHabit timing with exclusive transaction**
   - What we know: `setHabit(updated)` is called inside the `withExclusiveTransactionAsync` callback after the DB write
   - What's unclear: Whether React batches the state update correctly when called inside an async transaction callback
   - Recommendation: This is fine -- React 19 batches all state updates, including those in async callbacks. The `setHabit` call will trigger a re-render after the transaction completes.

## Sources

### Primary (HIGH confidence)
- `src/db/provider.tsx` -- Read directly, confirmed missing .catch() and null-based state
- `src/db/client.ts` -- Read directly, confirmed blanket catch at lines 40-48, correct pattern at lines 52-63
- `src/hooks/useHabit.ts` -- Read directly, confirmed closure-based state read in recordPractice
- `src/hooks/useLessonQuiz.ts` -- Read directly, confirmed generatedRef one-way gate
- `app/(tabs)/index.tsx` -- Read directly, confirmed `getTodayDateString()` recalculated on every render (line 299)
- `app/lesson/[id].tsx` -- Read directly, confirmed no key prop on LessonQuiz (line 299) or LessonHybrid (line 296)
- `node_modules/expo-sqlite/build/SQLiteDatabase.d.ts` -- Verified `withExclusiveTransactionAsync` API with `txn: Transaction` parameter
- `app/_layout.tsx` -- Verified ThemeContext wraps DatabaseProvider (ErrorFallback has access to colors)
- `src/components/feedback/ErrorFallback.tsx` -- Verified existing component with `onRetry` prop
- `src/engine/habit.ts` -- Verified `loadHabit` query for reference in Bug 3 fix
- `src/engine/progress.ts` -- Verified `saveHabit` function and `withTransactionAsync` usage
- `vitest.config.ts` -- Verified test configuration
- `src/__tests__/setup.ts` -- Verified test setup (native module mocks)

### Secondary (MEDIUM confidence)
- expo-sqlite 55.0.11 type definitions for `withExclusiveTransactionAsync` behavior (docs say it provides exclusive access, but edge cases on Android not tested)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, versions verified from lockfile
- Architecture: HIGH - all source files read, patterns verified against existing codebase
- Pitfalls: HIGH - identified from direct source analysis and API type definitions
- Testing: MEDIUM - test strategy is sound but no existing hook-testing precedent in this project

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable -- bug fixes against pinned dependency versions)
