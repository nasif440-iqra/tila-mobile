# Phase 4: Type & Test Cleanup — Technical Spec

**Purpose:** Remove critical `any` types from useLessonQuiz (including internal usage and the JS generator boundary), verify the current test suite, and install coverage tooling to establish a measurable baseline. Three requirements (QUAL-01, QUAL-02, QUAL-03).

**Context:** Phases 1-3 added regression tests across the milestone. This phase addresses the type safety gaps that let those bugs exist in the first place, and ensures the test suite has coverage measurement.

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
- A `Question` type for `currentQuestion` — the question generators in `src/engine/questions/` return objects with `targetId`, `type`, `options`, `isHarakat`, `hasAudio`, `prompt`, `optionMode`, etc. This needs a proper interface.
- A `QuestionOption` type — the repo uses `label` (not `text`), sometimes `sublabel`, requires `id` and exactly one `isCorrect: true`. The validator also allows questions with no `prompt` as long as `hasAudio` is true, and checks `optionMode` for `letter_to_sound`. The types must reflect the real shape, not a guessed one.

**JS/TS boundary consideration:** `useLessonQuiz` imports `generateLessonQuestions` from `src/engine/questions/index.js` — the entire question generation layer is plain `.js`. The `tsconfig.json` only includes `.ts` and `.tsx`. So adding a TS `Question` interface alone won't fully type the generator boundary at compile time. Options:
- **Option A (recommended):** Create the `Question` and `QuestionOption` interfaces in `src/types/question.ts`, use them in `useLessonQuiz.ts`, and add a JSDoc `@type` annotation or a `.d.ts` declaration file for the question engine's exports. This types the boundary without migrating the .js files.
- **Option B:** Migrate `src/engine/questions/index.js` to `.ts`. More thorough but higher blast radius — out of scope for a stability milestone.

**Proposed fix:**
- Replace `lesson: any` with `lesson: Lesson` (import from `src/types/lesson.ts`)
- Replace `mastery: any` with `mastery: ProgressState["mastery"]` (import from `src/engine/progress.ts`)
- Create `Question` and `QuestionOption` interfaces in `src/types/question.ts` based on actual generator output — must use `label` (not `text`), include `sublabel?`, `optionMode?`, `hasAudio?`, `prompt?`, and match the validator's expectations
- Replace `currentQuestion: any` with `Question | null`
- Type `selectedOption` in `handleAnswer` with `QuestionOption`
- Also fix internal `any` usage: `useState<any[]>([])` → `useState<Question[]>([])`, `.find((o: any) =>` → `.find((o: QuestionOption) =>`
- Add a `.d.ts` declaration file or JSDoc for the JS question generator boundary (Option A)
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

**What this is:** Verify that the current repo test suite covers the required flows. This is NOT "write new tests from scratch" — the repo already has a substantial test suite that has grown across multiple phases and milestones.

**Important:** Do NOT hardcode stale filenames or test counts. The `src/__tests__/` directory contains files from Phases 1-3 of this milestone AND pre-existing tests from earlier work (e.g., `checkpoint-classifier.test.ts`, `confusion-persistence.test.ts`, `empty-quiz.test.ts`, `mastery-pipeline.test.ts`, `quiz-contract.test.ts`, `subscription-types.test.ts`). The exact inventory should be discovered at execution time, not frozen into this spec.

**Required coverage areas (from success criteria):**
- DB init
- Migration handling
- Streak logic
- Quiz transitions
- Monetization edge cases

**Proposed fix:**
- Run `npm test` and verify all tests pass
- Inspect the current `src/__tests__/` contents to confirm each required area has coverage
- If any required area lacks a test, add a targeted test
- Document the actual test count and pass rate at execution time

**What "fixed" looks like:**
- `npm test` runs full suite — all green
- Each required coverage area has at least one passing test
- Test count and pass rate documented in SUMMARY (discovered at execution time, not assumed)

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
    include: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}'],
    exclude: ['src/__tests__/**', 'node_modules/**'],
  }
  ```
  **Important:** The include globs MUST cover `.js` files. The repo is ~31% JavaScript — `src/engine/questions/` is entirely `.js`. Excluding `.js` would give a misleading baseline that ignores real production code.
- Add a `"coverage": "vitest run --coverage"` script to `package.json` for convenience (alongside existing `"test": "vitest run"`)
- Run `npm run coverage` and record the baseline percentage
- Do NOT set a coverage threshold or enforcement gate — this phase establishes the baseline only

**What "fixed" looks like:**
- `npm test -- --coverage` produces a text report with line/branch/function coverage
- Baseline percentage documented in SUMMARY
- No coverage threshold enforced (that's a future improvement)

---

## Summary

| # | Fix | Severity | Files | Risk if unfixed |
|---|-----|----------|-------|-----------------|
| 1 | Remove `any` from useLessonQuiz + type JS boundary | HIGH | src/hooks/useLessonQuiz.ts, src/types/, .d.ts or JSDoc | Type errors invisible at compile time |
| 2 | Regression suite verification | LOW | None (verification task) | Confidence gap |
| 3 | Coverage baseline | LOW | vitest.config.ts, package.json | No way to measure test quality |

**Dependencies:** Fix 1 is the only real code change. Fix 2 is verification. Fix 3 is tooling. All independent.

**Scope note:** useProgress and useMastery are already typed. The real work is useLessonQuiz + creating a Question interface.

---

*Spec created: 2026-04-01*
*Revised: 2026-04-01 after expert review — expanded QUAL-01 to cover internal any + JS generator boundary with .d.ts, fixed QuestionOption schema (label not text), removed stale test inventory from QUAL-02, added .js to coverage globs in QUAL-03*
