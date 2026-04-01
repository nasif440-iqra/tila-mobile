# Phase 1: Correctness Blockers - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 5 known correctness bugs that can crash, hang, or corrupt data. Add targeted regression tests for each fix. No new features, no refactoring beyond the fix scope.

</domain>

<decisions>
## Implementation Decisions

### Bug 1: DB init (CRITICAL)
- **D-01:** DatabaseProvider must use a three-state machine: `loading | error | ready` — not just null/non-null db
- **D-02:** Add timeout (15s) with cleanup on success
- **D-03:** Retry must guard against late resolution from previous attempt (track attempt count or use abort pattern)
- **D-04:** Error state renders recovery UI with "Try Again" button

### Bug 2: Quiz state persistence (HIGH, conditional)
- **D-05:** Preferred fix is `key={lesson.id}` on `<LessonQuiz>` in `app/lesson/[id].tsx` — forces full remount on lesson change, resetting all hook state
- **D-06:** Fallback only if key-based reset has side effects: full lesson-reset effect watching `lesson.id`
- **D-07:** The real problem is all lesson-scoped state, not just generatedRef

### Bug 3: Habit state clobbering (MEDIUM)
- **D-08:** Fix must serialize or use atomic read-modify-write — "read fresh from DB" alone is not sufficient
- **D-09:** Options: promise chain/mutex, SQLite exclusive transaction, or ref + serialize
- **D-10:** The actual failure is lost todayLessonCount updates, not streak double-increment

### Bug 4: Midnight reroute (MEDIUM)
- **D-11:** Choose one: pin session date on mount (Option A) or track "already evaluated after loading resolved" ref (Option B)
- **D-12:** If Option B: ref must only be set after first eligible evaluation once `progress.loading` has resolved — not before, to avoid suppressing legitimate first-run redirects

### Bug 5: Migration v2 (MEDIUM)
- **D-13:** Replace blanket try/catch with PRAGMA table_info checks per column, matching v3-v5 pattern
- **D-14:** Real DB errors must propagate (no blanket catch)

### Bug 6: Regression tests
- **D-15:** Targeted regression coverage, not testing from scratch — existing suite is substantial
- **D-16:** Tests prove the bad path is prevented (behavior tests), not strict red/green historical reproductions
- **D-17:** Each test documents which bug it prevents

### Claude's Discretion
- Choice between Option A vs Option B for Bug 4 (both are approved approaches)
- Choice between serialization strategies for Bug 3 (mutex vs transaction vs ref+serialize)
- Test file organization (new files vs extending existing test files)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec
- `.planning/phases/01-correctness-blockers/01-SPEC.md` — Expert-reviewed spec with exact code locations, failure scenarios, and approved fix approaches for all 5 bugs

### Source files (bug locations)
- `src/db/provider.tsx` — Bug 1: DatabaseProvider with no .catch
- `src/db/client.ts` — Bug 5: Migration v2 blanket catch (lines 38-49)
- `src/hooks/useLessonQuiz.ts` — Bug 2: generatedRef one-way gate
- `app/lesson/[id].tsx` — Bug 2: LessonQuiz rendered without key prop
- `src/hooks/useHabit.ts` — Bug 3: recordPractice closure state
- `app/(tabs)/index.tsx` — Bug 4: today recomputed on render, redirect effect (lines 339-359)

### Existing test suite (extend, don't replace)
- `src/__tests__/app-loading.test.ts` — Existing loading behavior tests
- `src/__tests__/home-streak.test.ts` — Existing streak behavior tests
- `src/__tests__/quiz-progress.test.ts` — Existing quiz progress tests
- `src/__tests__/error-boundary.test.ts` — Existing error boundary tests
- `src/__tests__/schema-v5.test.ts` — Existing schema migration tests

### Patterns to follow
- `src/db/client.ts` lines 52-63 (v3 migration) — Correct PRAGMA table_info pattern for Bug 5

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/feedback/ErrorFallback.tsx` — Existing error UI component, may be reusable for Bug 1's error screen
- `AppLoadingScreen` — Already used as DatabaseProvider fallback, already branded

### Established Patterns
- Hooks use `useCallback` with explicit dependency arrays
- DB operations are async with `await`
- Migration v3-v5 use PRAGMA table_info before ALTER TABLE (the correct pattern for Bug 5)
- Existing tests use Vitest with mock patterns for DB and engine

### Integration Points
- `app/_layout.tsx` — Root layout wraps app in DatabaseProvider with fallback={AppLoadingScreen}
- `app/lesson/[id].tsx` — Renders LessonQuiz (where key prop needs adding)
- `src/engine/progress.ts` — saveHabit function used by useHabit

</code_context>

<specifics>
## Specific Ideas

No specific visual or behavioral preferences beyond what's in the spec. Expert review confirmed: fix the bugs cleanly, test them, move on.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-correctness-blockers*
*Context gathered: 2026-04-01*
