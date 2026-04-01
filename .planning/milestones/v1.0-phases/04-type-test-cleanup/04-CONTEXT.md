# Phase 4: Type & Test Cleanup - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning (pending expert review)

<domain>
## Phase Boundary

Remove critical `any` types from hook interfaces (primarily useLessonQuiz), verify the regression test suite, and install coverage tooling with a baseline measurement. No new features.

</domain>

<decisions>
## Implementation Decisions

### Fix 1: Type safety
- **D-01:** useLessonQuiz is the primary target — `any` in signature AND internal usage (`useState<any[]>`, `.find((o: any) =>`)
- **D-02:** Replace `lesson: any` with `Lesson` (already exists in `src/types/lesson.ts`)
- **D-03:** Replace `mastery: any` with `ProgressState["mastery"]` (already exists in `src/engine/progress.ts`)
- **D-04:** Create `Question` and `QuestionOption` interfaces — must use `label` (not `text`), include `sublabel?`, `optionMode?`, `hasAudio?`, `prompt?`, match validator expectations
- **D-05:** Type `selectedOption` in `handleAnswer` with `QuestionOption`
- **D-06:** Also fix internal `any`: `useState<any[]>` → `useState<Question[]>`, `.find((o: any)` → `.find((o: QuestionOption)`
- **D-07:** JS boundary: `src/engine/questions/index.js` is plain .js, tsconfig only includes .ts/.tsx. Add a `.d.ts` declaration file or JSDoc for the generator exports (Option A — don't migrate .js to .ts)
- **D-08:** useProgress and useMastery are already typed — verify, don't change

### Fix 2: Test suite verification
- **D-09:** Run `npm test` — verify current repo test suite passes (do NOT hardcode stale filenames/counts)
- **D-10:** Inspect `src/__tests__/` at execution time to confirm each required area has coverage
- **D-11:** If gaps found, add targeted tests — not a rewrite

### Fix 3: Coverage tooling
- **D-12:** Install `@vitest/coverage-v8` (^4.1.2 — match Vitest version)
- **D-13:** Coverage include globs MUST cover `.js` files — repo is ~31% JS, `src/engine/questions/` is entirely .js
- **D-14:** Add `"coverage": "vitest run --coverage"` script to package.json
- **D-15:** Record baseline percentage — do NOT set enforcement thresholds

### Claude's Discretion
- Whether to put Question/QuestionOption in `src/types/quiz.ts` or a new `src/types/question.ts`
- Whether to use `.d.ts` or JSDoc for the JS generator boundary typing
- Test file organization for any new tests added to fill gaps

</decisions>

<canonical_refs>
## Canonical References

### Spec
- `.planning/phases/04-type-test-cleanup/04-SPEC.md` — Technical spec

### Source files
- `src/hooks/useLessonQuiz.ts` — Primary target: 4 `any` types
- `src/hooks/useProgress.ts` — Verify clean (should already pass)
- `src/hooks/useMastery.ts` — Verify clean (already fully typed)
- `src/types/lesson.ts` — `Lesson` interface (exists)
- `src/types/quiz.ts` — `QuizResultItem`, `QuestionAttempt` (exists)
- `src/engine/progress.ts` — `ProgressState`, `EntityState`, `SkillState`, `ConfusionState`
- `src/engine/questions/` — Question generators (inspect for Question interface shape)
- `vitest.config.ts` — Coverage config target

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Lesson` interface already complete in `src/types/lesson.ts`
- `ProgressState["mastery"]` type already structured in `src/engine/progress.ts`
- `QuizResultItem` already used for quiz results
- 53 existing test files in `src/__tests__/`

### Established Patterns
- Types live in `src/types/` (quiz.ts, lesson.ts)
- Engine types exported from `src/engine/progress.ts`
- Hooks import types from both locations

### Integration Points
- `vitest.config.ts` — add coverage block
- `package.json` — add `@vitest/coverage-v8` as dev dependency

</code_context>

<specifics>
## Specific Ideas

No specific preferences. Pure technical cleanup.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 04-type-test-cleanup*
*Context gathered: 2026-04-01*
