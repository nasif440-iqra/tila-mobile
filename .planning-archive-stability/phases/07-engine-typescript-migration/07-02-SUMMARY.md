---
phase: 07-engine-typescript-migration
plan: 02
subsystem: engine/questions
tags: [typescript, migration, types, question-generators]
dependency_graph:
  requires: [shared-engine-types, typed-dateUtils, typed-features, typed-outcome]
  provides: [typed-question-generators, typed-question-dispatcher]
  affects: [engine-layer, type-safety, question-generation]
tech_stack:
  added: []
  patterns: [extended-interfaces, type-guards, generic-utilities, union-types]
key_files:
  created:
    - src/engine/questions/shared.ts
    - src/engine/questions/recognition.ts
    - src/engine/questions/sound.ts
    - src/engine/questions/contrast.ts
    - src/engine/questions/harakat.ts
    - src/engine/questions/checkpoint.ts
    - src/engine/questions/explanations.ts
    - src/engine/questions/connectedForms.ts
    - src/engine/questions/connectedReading.ts
    - src/engine/questions/review.ts
    - src/engine/questions/index.ts
  modified:
    - src/__tests__/checkpoint-classifier.test.ts
  deleted:
    - src/engine/questions/index.d.ts
decisions:
  - "Used HarakatLesson extended interface for teachCombos/teachHarakat fields not on base Lesson"
  - "Used CheckpointProgress interface with numeric index signature for legacy progress format"
  - "Widened explanation function params to number|string for UI compatibility (LessonQuiz passes string|number)"
  - "Used LessonProgress interface in index.ts as unified progress pass-through type"
  - "Used ConnectedFormExercise local interface for Phase 4 exercise types (different shape from Question)"
  - "Cast connectedForms/connectedReading returns through unknown in generateHybridExercises (different shape from Question)"
metrics:
  duration: 868s
  completed: 2026-04-02
---

# Phase 07 Plan 02: Question Generator TypeScript Migration Summary

Migrated all 11 question generator files from JavaScript to TypeScript with full type annotations, deleted the legacy index.d.ts declaration file.

## What Was Done

### Task 1: Migrate shared.js to TypeScript
- **src/engine/questions/shared.ts**: Added generic types to shuffle<T> and pickRandom<T>, typed SOUND_CONFUSION_MAP as Record<number, number[]>, SOUND_PROMPTS as Record<string, string[]>, added ValidationResult interface, typed all 16 exported functions with ArabicLetter, Question, QuestionOption imports

### Task 2: Migrate recognition, sound, contrast to TypeScript
- **recognition.ts**: Typed generateRecognitionQs with Lesson param and Question[] return
- **sound.ts**: Typed generateSoundQs with confusion map lookups
- **contrast.ts**: Typed generateContrastQs with SOUND_PROMPTS access

### Task 3: Migrate harakat, checkpoint, explanations to TypeScript
- **harakat.ts**: Created HarakatLesson extended interface for teachCombos/teachHarakat, HarakatDifficulty interface, typed all phase generators (A/B/C/D)
- **checkpoint.ts**: Created CheckpointProgress and ClassifiedLetters interfaces, accepted null/undefined progress to match runtime usage
- **explanations.ts**: Widened chosenId/correctId to number|string for UI compatibility, created HarakatQuestion interface

### Task 4: Migrate connectedForms, connectedReading, review to TypeScript
- **connectedForms.ts**: Created ConnectedFormExercise interface for the varied exercise types (guided_reveal, comprehension, tap_in_order, spot_the_break), typed all 12 internal builder functions
- **connectedReading.ts**: Created BuildupExercise and ConnectedReadingExercise interfaces, typed vowel constant maps
- **review.ts**: Created ReviewLesson and ReviewProgress interfaces, typed entity key parsing with parseEntityKey import from mastery.js

### Task 5: Migrate index.js and delete index.d.ts
- **index.ts**: Created LessonProgress unified interface for progress pass-through, typed generateLessonQuestions and generateHybridExercises
- Deleted **index.d.ts** -- no longer needed with native TypeScript

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | d25f747 | feat(07-02): migrate questions/shared.js to TypeScript with full type annotations |
| 2 | a7815d5 | feat(07-02): migrate recognition, sound, contrast question generators to TypeScript |
| 3 | b7843cf | feat(07-02): migrate harakat, checkpoint, explanations question generators to TypeScript |
| 4 | aa55a7e | feat(07-02): migrate connectedForms, connectedReading, review to TypeScript |
| 5 | 388d7d8 | feat(07-02): migrate questions/index.js to TypeScript and delete index.d.ts |

## Verification Results

- **Typecheck**: 14 errors (unchanged from baseline -- zero new errors)
- **Tests**: 664 passed, 0 failures (60 test files passed, 6 skipped)
- **Deleted files**: all 11 .js files + index.d.ts confirmed removed
- **New files**: all 11 .ts files confirmed present
- **No `any` in exported function signatures**: verified (only internal casts use `as`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test synthetic lesson missing Lesson interface fields**
- **Found during:** Task 3
- **Issue:** checkpoint-classifier.test.ts created a synthetic lesson without module/title/description fields required by Lesson interface
- **Fix:** Added missing fields to test fixture
- **Files modified:** src/__tests__/checkpoint-classifier.test.ts
- **Commit:** b7843cf

**2. [Rule 3 - Blocking] Harakat lesson type casting errors**
- **Found during:** Task 3
- **Issue:** Lesson interface lacks teachCombos/teachHarakat fields used by harakat generator
- **Fix:** Created HarakatLesson extended interface instead of unsafe Record casting
- **Files modified:** src/engine/questions/harakat.ts
- **Commit:** b7843cf

**3. [Rule 3 - Blocking] Explanation function parameter width**
- **Found during:** Task 3
- **Issue:** LessonQuiz.tsx passes string|number IDs but original typed params were number-only
- **Fix:** Widened chosenId/correctId to number|string union type
- **Files modified:** src/engine/questions/explanations.ts
- **Commit:** b7843cf

## Known Stubs

None -- all types are derived from actual codebase usage with no placeholders.

## Self-Check: PASSED

- All 11 .ts files confirmed present
- All 5 task commits confirmed in git log
- index.d.ts confirmed deleted
- Typecheck: 14 errors (unchanged baseline)
- Tests: 664 passed, 0 failures
