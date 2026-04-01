# Phase 4: Type & Test Cleanup — Technical Spec

**Purpose:** Remove critical `any` types from 3 hook interfaces so TypeScript catches bugs at compile time, and install coverage tooling to establish a measurable baseline. Three requirements (QUAL-01, QUAL-02, QUAL-03).

**Context:** Phases 1-3 added 55+ regression tests across 10 test files. This phase addresses the type safety gaps that let those bugs exist in the first place, and ensures the test suite has coverage measurement.

---

## Fix 1: Remove `any` types from hook interfaces (QUAL-01)

### useLessonQuiz — the worst offender

**File:** `src/hooks/useLessonQuiz.ts` (lines 21-36)

**What happens now:** The hook's function signature and return type use `any` in 4 places:

```typescript
export default function useLessonQuiz(
  lesson: any,                    // ← should be Lesson
  completedLessonIds: number[],
  mastery: any                    // ← should be ProgressState["mastery"]
): {
  currentQuestion: any;           // ← should be a Question type
  // ...
  handleAnswer: (selectedOption: any, correct: boolean) => void;  // ← should be typed
  // ...
}
```

**Why it matters:** These `any` types leak through to every component that uses the hook. A wrong property access on `lesson`, `mastery`, or `currentQuestion` silently passes typecheck. The quiz state persistence bug (Phase 1, Bug 2) was exactly this kind of issue.

**Types that already exist:**
- `Lesson` — `src/types/lesson.ts` (complete, well-defined)
- `ProgressState["mastery"]` — `src/engine/progress.ts` (has entities, skills, confusions)
- `QuizResultItem` — `src/types/quiz.ts` (already used for results)

**Types that need creating:**
- A `Question` type for `currentQuestion` — the question generators in `src/engine/questions/` return objects with `targetId`, `type`, `options`, `isHarakat`, `hasAudio`, etc. This needs a proper interface.
- A typed option for `selectedOption` in `handleAnswer` — likely `{ id: number | string; isCorrect: boolean; text: string }` or similar, matching what question options look like.

**Proposed fix:**
- Replace `lesson: any` with `lesson: Lesson` (import from `src/types/lesson.ts`)
- Replace `mastery: any` with `mastery: ProgressState["mastery"]` (import from `src/engine/progress.ts`)
- Create a `Question` interface in `src/types/quiz.ts` (or `src/types/question.ts`) based on what question generators actually return — inspect the generators to get the real shape
- Replace `currentQuestion: any` with `Question | null`
- Type `selectedOption` in `handleAnswer` — at minimum `{ id: number | string }` or the full option interface
- Ensure `npm run typecheck` passes after all changes

### useProgress — already mostly typed

**File:** `src/hooks/useProgress.ts`

**Current state:** `useProgress` uses `ProgressState` from `src/engine/progress.ts` and returns a spread object. The hook itself has no `any` in its interface — `state` is `ProgressState | null`, parameters to `completeLesson` are typed. The return type is implicit but TypeScript infers it correctly.

**Assessment:** No `any` types in the interface. The success criterion says "no `any` types in the return interfaces of useLessonQuiz, useProgress, or useMastery hooks." useProgress already passes. Verify with `npm run typecheck` — no changes needed unless typecheck reveals hidden `any` leakage.

### useMastery — already fully typed

**File:** `src/hooks/useMastery.ts`

**Current state:** Parameters use `EntityState`, `SkillState`, `ConfusionState` from `src/engine/progress.ts`. Return is `{ updateEntity, updateSkill, updateConfusion }` — all typed.

**Assessment:** No `any` types. Already passes. No changes needed.

**What "fixed" looks like:**
- `npm run typecheck` passes with zero `any` in useLessonQuiz's parameter or return type
- useProgress and useMastery confirmed clean (no changes needed)
- New `Question` interface created and used

---

## Fix 2: Regression test suite verification (QUAL-02)

**What this is:** Verify that the existing 55+ regression tests from Phases 1-3 cover all the fixed flows. This is NOT "write new tests from scratch" — the tests already exist.

**Current test inventory (from Phases 1-3):**

| File | Phase | What it covers | Tests |
|------|-------|---------------|-------|
| `db-init.test.ts` | 1 | DB init state machine, timeout, retry | 5 |
| `migration-v2.test.ts` | 1 | Migration PRAGMA checks | 3 |
| `quiz-lesson-reset.test.ts` | 1 | Quiz key-based reset | 1 |
| `midnight-redirect.test.ts` | 1 | Pinned session date | 2 |
| `habit-race.test.ts` | 1 | Exclusive transaction serialization | 4 |
| `audio-safety.test.ts` | 2 | Audio try/catch wrappers | 6 |
| `promise-safety.test.ts` | 2 | Guarded async loaders | 12 |
| `screen-boundary.test.ts` | 2 | Error boundary wiring | 14 |
| `restore-purchases.test.ts` | 3 | Restore button + handler | 7 |
| `monetization-events.test.ts` | 3 | Paywall failure analytics | 1 |

**Required coverage areas (from success criteria):**
- DB init ✓
- Migration handling ✓
- Streak logic ✓
- Quiz transitions ✓
- Monetization edge cases ✓

**Proposed fix:**
- Run `npm test` and verify all tests pass
- If any gaps found in coverage areas, add targeted tests
- Document the final test count and pass rate

**What "fixed" looks like:**
- `npm test` runs full suite — all green
- Every Phase 1-3 fix has at least one regression test

---

## Fix 3: Coverage measurement baseline (QUAL-03)

**File:** `vitest.config.ts`, `package.json`

**What happens now:** There is no coverage configuration. `npm test -- --coverage` doesn't produce a report because `@vitest/coverage-v8` is not installed.

**Proposed fix:**
- Install `@vitest/coverage-v8` (^4.1.2 — matches Vitest version exactly)
- Add coverage configuration to `vitest.config.ts`:
  ```typescript
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json-summary'],
    include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    exclude: ['src/__tests__/**', 'node_modules/**'],
  }
  ```
- Run `npm test -- --coverage` and record the baseline percentage
- Do NOT set a coverage threshold or enforcement gate — this phase establishes the baseline only

**What "fixed" looks like:**
- `npm test -- --coverage` produces a text report with line/branch/function coverage
- Baseline percentage documented in SUMMARY
- No coverage threshold enforced (that's a future improvement)

---

## Summary

| # | Fix | Severity | Files | Risk if unfixed |
|---|-----|----------|-------|-----------------|
| 1 | Remove `any` from useLessonQuiz | HIGH | src/hooks/useLessonQuiz.ts, src/types/ | Type errors invisible at compile time |
| 2 | Regression suite verification | LOW | None (verification task) | Confidence gap |
| 3 | Coverage baseline | LOW | vitest.config.ts, package.json | No way to measure test quality |

**Dependencies:** Fix 1 is the only real code change. Fix 2 is verification. Fix 3 is tooling. All independent.

**Scope note:** useProgress and useMastery are already typed. The real work is useLessonQuiz + creating a Question interface.

---

*Spec created: 2026-04-01*
*For expert review before implementation*
