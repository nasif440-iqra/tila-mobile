# Phase 4: Type & Test Cleanup - Research

**Researched:** 2026-03-31
**Domain:** TypeScript type safety, Vitest coverage tooling, JS/TS interop
**Confidence:** HIGH

## Summary

Phase 4 is a contained technical cleanup with three independent work streams: (1) removing `any` types from `useLessonQuiz.ts` and typing the JS question generator boundary, (2) verifying the existing test suite covers required areas, and (3) installing `@vitest/coverage-v8` for baseline measurement.

The primary technical challenge is the JS/TS boundary at `src/engine/questions/index.js`. The tsconfig `include` pattern (`**/*.ts`, `**/*.tsx`) excludes `.js` files from type-checking, but `allowJs: true` is set in the Expo base config. A `.d.ts` declaration file placed at `src/engine/questions/index.d.ts` will be automatically picked up because `**/*.ts` matches `.d.ts` files. This is the cleanest approach -- no migration needed.

The Question and QuestionOption shapes are well-defined by examining the 8 question generators. All generators produce objects with a consistent core shape (`type`, `prompt`, `targetId`, `options`) plus optional fields (`hasAudio`, `optionMode`, `isHarakat`, `promptSubtext`, `isConfusionQ`). Options always use `label` (never `text`), with optional `sublabel` on sound options. The validator in `shared.js` confirms the canonical shape.

**Primary recommendation:** Create `Question` and `QuestionOption` interfaces in `src/types/question.ts`, add `src/engine/questions/index.d.ts` for the boundary, replace all 6 `any` occurrences in `useLessonQuiz.ts`, then install coverage tooling.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: useLessonQuiz is the primary target -- `any` in signature AND internal usage
- D-02: Replace `lesson: any` with `Lesson` (already exists in `src/types/lesson.ts`)
- D-03: Replace `mastery: any` with `ProgressState["mastery"]` (already exists in `src/engine/progress.ts`)
- D-04: Create `Question` and `QuestionOption` interfaces -- must use `label` (not `text`), include `sublabel?`, `optionMode?`, `hasAudio?`, `prompt?`, match validator expectations
- D-05: Type `selectedOption` in `handleAnswer` with `QuestionOption`
- D-06: Also fix internal `any`: `useState<any[]>` -> `useState<Question[]>`, `.find((o: any)` -> `.find((o: QuestionOption)`
- D-07: JS boundary: Add a `.d.ts` declaration file or JSDoc for the generator exports (Option A -- don't migrate .js to .ts)
- D-08: useProgress and useMastery are already typed -- verify, don't change
- D-09: Run `npm test` -- verify current repo test suite passes (do NOT hardcode stale filenames/counts)
- D-10: Inspect `src/__tests__/` at execution time to confirm each required area has coverage
- D-11: If gaps found, add targeted tests -- not a rewrite
- D-12: Install `@vitest/coverage-v8` (^4.1.2 -- match Vitest version)
- D-13: Coverage include globs MUST cover `.js` files -- repo is ~31% JS
- D-14: Add `"coverage": "vitest run --coverage"` script to package.json
- D-15: Record baseline percentage -- do NOT set enforcement thresholds

### Claude's Discretion
- Whether to put Question/QuestionOption in `src/types/quiz.ts` or a new `src/types/question.ts`
- Whether to use `.d.ts` or JSDoc for the JS generator boundary typing
- Test file organization for any new tests added to fill gaps

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | Critical `any` types removed from lesson/progress/mastery-adjacent hook interfaces | Question shape fully mapped from 8 generators + validator; Lesson and ProgressState types already exist; .d.ts approach verified compatible with tsconfig |
| QUAL-02 | Regression tests for fixed flows: DB init, migration handling, streak logic, quiz transitions, monetization edge cases | 53 test files discovered in `src/__tests__/`; coverage areas mapped to existing files |
| QUAL-03 | Coverage measurement enabled with baseline established | @vitest/coverage-v8@4.1.2 confirmed available; vitest.config.ts structure known; .js inclusion glob pattern specified |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.2 | Test runner (already installed) | Already in use |
| @vitest/coverage-v8 | 4.1.2 | V8-based code coverage for Vitest | Official Vitest coverage provider, must match Vitest version exactly |
| typescript | 5.9.2 | Type checking (already installed) | Already in use |

### Supporting
No new libraries needed beyond `@vitest/coverage-v8`.

**Installation:**
```bash
npm install --save-dev @vitest/coverage-v8@^4.1.2
```

**Version verification:** Vitest 4.1.2 is installed locally (confirmed via `npx vitest --version`). `@vitest/coverage-v8@4.1.2` confirmed available on npm registry.

## Architecture Patterns

### Type File Organization
```
src/types/
  lesson.ts          # Lesson interface (exists)
  quiz.ts            # QuizResultItem, QuestionAttempt (exists)
  question.ts        # NEW: Question, QuestionOption interfaces
src/engine/questions/
  index.js           # JS question generators (unchanged)
  index.d.ts         # NEW: TypeScript declarations for JS boundary
```

**Recommendation:** Put Question/QuestionOption in a new `src/types/question.ts` rather than `src/types/quiz.ts`. Rationale: `quiz.ts` contains result/attempt types (output of quiz), while Question/QuestionOption are input types (what the quiz consumes). Separation keeps each file focused.

### Pattern 1: Question Object Shape (derived from all 8 generators)

**What:** The canonical Question shape, reverse-engineered from `recognition.js`, `sound.js`, `contrast.js`, `harakat.js`, `checkpoint.js`, `review.js`, `connectedForms.js`, `connectedReading.js`, and the `validateQuestion` function in `shared.js`.

**Core fields (always present):**
- `type: string` -- question type identifier (e.g., "tap", "find", "name_to_letter", "letter_to_name", "audio_to_letter", "letter_to_sound", "contrast_audio", "rule", "guided_reveal", etc.)
- `targetId: number | string` -- target letter/combo ID (number for letters, string for harakat combos)
- `options: QuestionOption[]` -- answer choices (always array, always at least 2)

**Common optional fields:**
- `prompt?: string` -- question text (omitted when `hasAudio: true` on some audio questions, but validator allows this)
- `promptSubtext?: string` -- secondary prompt text (used by letter_to_name, letter_to_sound)
- `hasAudio?: boolean` -- indicates audio playback question
- `optionMode?: string` -- "sound" for letter_to_sound questions
- `isHarakat?: boolean` -- harakat-specific question flag
- `isConfusionQ?: boolean` -- marks confusion-based questions (sound.js only)

**Internal recycling fields (added by useLessonQuiz, not generators):**
- `_recycled?: boolean`
- `_recycleCount?: number`

**Validator expectations (from `validateQuestion` in shared.js):**
- Must have `prompt` OR `hasAudio: true`
- Must have `options` array with length >= 2
- Each option must have `id` and `label` (not null)
- No duplicate option IDs
- Exactly one option with `isCorrect: true`
- If `targetId` is set, it must be among option IDs
- If `type === "audio_to_letter"`, `hasAudio` must be true
- If `type === "letter_to_sound"`, `optionMode` must be "sound"

### Pattern 2: QuestionOption Shape (derived from makeOpts/makeNameOpts/makeSoundOpts)

**What:** Three option factory functions in `shared.js` produce all options:

```
makeOpts:      { id: number, label: string (Arabic letter), isCorrect: boolean }
makeNameOpts:  { id: number, label: string (name), isCorrect: boolean }
makeSoundOpts: { id: number, label: string (transliteration), sublabel: string (soundHint), isCorrect: boolean }
```

Harakat questions build options inline with the same shape: `{ id: string, label: string (mark), isCorrect: boolean }`.

**Canonical QuestionOption:**
- `id: number | string` -- letter ID or harakat ID
- `label: string` -- display text (Arabic letter, name, transliteration, or harakat mark)
- `isCorrect: boolean` -- exactly one true per question
- `sublabel?: string` -- sound hint (only on sound options)

### Pattern 3: .d.ts Declaration File for JS Boundary

**What:** TypeScript declaration file that types the exports of `src/engine/questions/index.js` without modifying the JS.

**Why this works:** The tsconfig includes `**/*.ts` which matches `.d.ts` files. When TypeScript resolves `import { generateLessonQuestions } from "../engine/questions/index.js"`, it will find `index.d.ts` alongside `index.js` and use its types.

**Key exports to declare:**
- `generateLessonQuestions(lesson: Lesson, progress: { completedLessonIds: number[]; mastery: ProgressState["mastery"] }): Question[]`
- `generateHybridExercises(lesson: Lesson, progress: ...): Question[]` (used by useLessonHybrid)
- `shuffle<T>(array: T[]): T[]`
- Other re-exports as needed

### Anti-Patterns to Avoid
- **Over-typing the .d.ts:** Don't declare every internal function from shared.js/recognition.js/etc. Only declare what is actually imported in `.ts` files. The boundary typing is for consumers, not for internal JS code.
- **Using `as any` to suppress errors:** If the new types reveal mismatches, fix the mismatch rather than casting.
- **Changing the Lesson interface:** `src/types/lesson.ts` already has `hybridSteps?: any[]` -- leave this alone, it is out of scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage reporting | Custom coverage scripts | @vitest/coverage-v8 | Standard Vitest integration, handles V8 instrumentation and reporting |
| Type declarations for JS | Convert .js to .ts | .d.ts declaration file | Minimizes blast radius per project decision; .js files work fine at runtime |

## Common Pitfalls

### Pitfall 1: .d.ts File Not Found by TypeScript
**What goes wrong:** Declaration file created but TypeScript ignores it.
**Why it happens:** File placed in wrong location, or filename doesn't match the JS module.
**How to avoid:** Place `index.d.ts` in the same directory as `index.js` (`src/engine/questions/`). The filename must match: `index.d.ts` for `index.js`.
**Warning signs:** `npm run typecheck` still shows `any` inferred for `generateLessonQuestions`.

### Pitfall 2: Question Type Too Strict
**What goes wrong:** New Question interface rejects valid questions from generators.
**Why it happens:** Making fields required that are actually optional across different generator types.
**How to avoid:** Only `type`, `targetId`, and `options` are truly required. Everything else (`prompt`, `hasAudio`, `optionMode`, `isHarakat`, `promptSubtext`) must be optional. The validator allows questions with no `prompt` if `hasAudio` is true.
**Warning signs:** `npm run typecheck` fails on lines that construct question objects.

### Pitfall 3: QuestionOption.id Type Mismatch
**What goes wrong:** Using `number` for option ID when harakat options use string IDs.
**Why it happens:** Letter options use numeric IDs, harakat options use string IDs (e.g., "fatha", "kasra").
**How to avoid:** Type as `id: number | string`.
**Warning signs:** Type errors in harakat-related code paths.

### Pitfall 4: Coverage Glob Excludes .js
**What goes wrong:** Coverage baseline misleadingly high because it only measures .ts files.
**Why it happens:** Default Vitest coverage only covers files matching the test include pattern.
**How to avoid:** Explicitly set `include: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}']` in coverage config. The `src/engine/questions/` directory is entirely .js.
**Warning signs:** Coverage report shows no files from `src/engine/`.

### Pitfall 5: @vitest/coverage-v8 Version Mismatch
**What goes wrong:** Installation fails or coverage crashes at runtime.
**Why it happens:** coverage-v8 must match the Vitest major.minor version exactly.
**How to avoid:** Install `@vitest/coverage-v8@^4.1.2` to match installed Vitest 4.1.2.
**Warning signs:** `npm test -- --coverage` errors with "Cannot find module" or version conflict.

## Code Examples

### Question Interface (recommended shape)
```typescript
// src/types/question.ts

export interface QuestionOption {
  id: number | string;
  label: string;
  isCorrect: boolean;
  sublabel?: string;
}

export interface Question {
  type: string;
  targetId: number | string;
  options: QuestionOption[];
  prompt?: string;
  promptSubtext?: string;
  hasAudio?: boolean;
  optionMode?: string;
  isHarakat?: boolean;
  isConfusionQ?: boolean;
  // Internal recycling (added by useLessonQuiz, not generators)
  _recycled?: boolean;
  _recycleCount?: number;
}
```

### Declaration File (recommended shape)
```typescript
// src/engine/questions/index.d.ts
import type { Lesson } from '../../types/lesson';
import type { ProgressState } from '../progress';
import type { Question } from '../../types/question';

export function generateLessonQuestions(
  lesson: Lesson,
  progress: { completedLessonIds: number[]; mastery: ProgressState["mastery"] }
): Question[];

export function generateHybridExercises(
  lesson: Lesson,
  progress: { completedLessonIds: number[]; mastery: ProgressState["mastery"] }
): Question[];

export function shuffle<T>(array: T[]): T[];
export function pickRandom<T>(array: T[]): T | undefined;
```

### useLessonQuiz Typed Signature
```typescript
// After fix — all any removed
import type { Lesson } from '../types/lesson';
import type { ProgressState } from '../engine/progress';
import type { Question, QuestionOption } from '../types/question';

export default function useLessonQuiz(
  lesson: Lesson,
  completedLessonIds: number[],
  mastery: ProgressState["mastery"]
): {
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  streak: number;
  showMidCelebrate: boolean;
  dismissMidCelebrate: () => void;
  handleAnswer: (selectedOption: QuestionOption, correct: boolean) => void;
  isComplete: boolean;
  error: string | null;
  results: { correct: number; total: number; questions: QuizResultItem[] };
}
```

### Coverage Config Addition
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.{js,ts}"],
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}'],
      exclude: ['src/__tests__/**', 'node_modules/**'],
    },
  },
});
```

## Existing Test Coverage Map

53 test files discovered in `src/__tests__/`. Required coverage areas mapped:

| Required Area | Likely Existing Coverage | Confidence |
|---------------|------------------------|------------|
| DB init | `db-init.test.ts` | HIGH |
| Migration handling | `migration-v2.test.ts`, `schema-v5.test.ts` | HIGH |
| Streak logic | `home-streak.test.ts`, `habit-race.test.ts` | HIGH |
| Quiz transitions | `quiz-contract.test.ts`, `quiz-lesson-reset.test.ts`, `quiz-progress.test.ts`, `quiz-question.test.ts` | HIGH |
| Monetization edge cases | `monetization-events.test.ts`, `subscription-types.test.ts`, `restore-purchases.test.ts` | HIGH |

**Assessment:** All five required areas appear to have existing test files. Actual pass/fail status must be verified at execution time by running `npm test`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (same -- `vitest run`) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | No `any` in useLessonQuiz signature/internals | typecheck | `npm run typecheck` | N/A (compiler check) |
| QUAL-02 | Regression tests pass for DB/migration/streak/quiz/monetization | unit | `npm test` | Existing 53 files |
| QUAL-03 | Coverage report generates with .js included | unit+coverage | `npm run coverage` (after adding script) | N/A (new script) |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npm test`
- **Per wave merge:** `npm run typecheck && npm test`
- **Phase gate:** `npm run typecheck` clean + `npm test` all green + `npm run coverage` produces report

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. The only addition is `@vitest/coverage-v8` install and config, which is part of QUAL-03 implementation.

## Sources

### Primary (HIGH confidence)
- Direct source file inspection: `src/hooks/useLessonQuiz.ts`, `src/types/lesson.ts`, `src/types/quiz.ts`, `src/engine/progress.ts`
- Direct source file inspection: All 11 files in `src/engine/questions/` -- complete question shape analysis
- `tsconfig.json` and `expo/tsconfig.base` -- confirmed `allowJs: true`, include patterns
- `vitest.config.ts` -- current config structure
- `package.json` -- current dependency versions
- `npm view @vitest/coverage-v8 version` -- confirmed 4.1.2 available

### Secondary (MEDIUM confidence)
- Test file listing from `src/__tests__/` -- file names suggest coverage but actual content not fully verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - single dev dependency addition, version verified against registry
- Architecture: HIGH - all source files inspected, question shape derived from actual code
- Pitfalls: HIGH - based on direct analysis of tsconfig, validator, and generator code

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable -- no moving targets)
