---
phase: 05-quiz-learning-engine-4-options-question-types-lesson-insight
plan: 01
subsystem: engine/questions
tags: [quiz, question-generation, 4-options, recognition-balance]
dependency_graph:
  requires: []
  provides: [4-option-questions, balanced-recognition-types]
  affects: [quiz-ui, lesson-experience]
tech_stack:
  added: []
  patterns: [4-option-padding-from-alphabet, equal-type-distribution]
key_files:
  created: []
  modified:
    - src/engine/questions/shared.ts
    - src/engine/questions/recognition.ts
    - src/engine/questions/sound.ts
    - src/engine/questions/review.ts
    - src/engine/questions/checkpoint.ts
    - src/__tests__/questions.test.js
decisions:
  - All question generators now produce exactly 4 options via padding from ARABIC_LETTERS when pool is small
  - Recognition type balance achieved by generating 2 letter_to_name questions in multi-teach (matching 2 rule + 2 name_to_letter)
  - Checkpoint generator also updated to 3 distractors to prevent rule ambiguity with 4-option padding
metrics:
  duration: 462s
  completed: 2026-04-06T20:52:54Z
  tasks_completed: 2
  tasks_total: 2
  test_count: 826
  files_changed: 6
requirements_met: [D-01, D-02, D-03, D-04, D-05]
---

# Phase 05 Plan 01: 4-Option Questions and Recognition Type Balance Summary

All question generators updated to produce exactly 4 options with alphabet-based padding for small pools, and recognition mode balanced to ~33% each for rule, name_to_letter, and letter_to_name question types.

## Changes Made

### Task 1: 4-Option Enforcement (D-01, D-02)

**shared.ts** -- Updated `makeOpts`, `makeNameOpts`, `makeSoundOpts` padding threshold from `u.length < 2` to `u.length < 4`, with fallback slice changed from `slice(0, 2 - u.length)` to `slice(0, 4 - u.length)`. Updated `buildFallbackQuestion` to request 3 distractors instead of 2.

**sound.ts** -- Simplified distractor count to always use `dCount = 3` (was conditionally 1 or 2 based on `isLater`). Updated contrast_audio slice from `slice(0, 2)` to `slice(0, 3)` and confusion confusors from `slice(0, 2)` to `slice(0, 3)`.

**review.ts** -- Changed letter review `getDistractors` from 2 to 3, and rule review `getRuleDistractors` from 2 to 3.

**recognition.ts** -- Updated all distractor calls in single-teach branch to use 3. Multi-teach tap section now builds 3 distractors properly. Name_to_letter section simplified to always use `getDistractors` for 3.

**checkpoint.ts** -- Updated `getDistractors` from 2 to 3 and `getConfusionDistractors` from 2 to 3 (deviation: not in original plan but required to fix test failures caused by 4-option padding introducing ambiguous rule questions).

### Task 2: Recognition Type Balance (D-03, D-04, D-05)

**recognition.ts** -- Multi-teach branch now generates 2 `letter_to_name` questions (was 1), matching the existing 2 rule + 2 name_to_letter for equal ~33% distribution. Each letter_to_name question shows the Arabic letter as prompt with "What is this letter?" subtext and 4 English name options via `makeNameOpts`.

### Tests Added (12 new tests)

- `makeOpts returns exactly 4 options when given 4 unique letters`
- `makeOpts pads to 4 from alphabet when given only 2 letters`
- `makeNameOpts pads to 4 when given fewer than 4 unique letters`
- `makeSoundOpts pads to 4 when given fewer than 4 unique letters`
- `buildFallbackQuestion returns a question with 4 options`
- `every recognition question has exactly 4 options` (20 runs)
- `every sound question has exactly 4 options` (20 runs)
- `every review letter question has exactly 4 options` (20 runs)
- `multi-teach lesson produces roughly equal rule, name_to_letter, letter_to_name counts` (50 runs)
- `letter_to_name questions show Arabic letter as prompt with English name options`
- `single-teach lessons produce at least one of each type`
- `multi-teach lesson produces at least 2 letter_to_name questions`

### Test Updated

- `deduplicates by ID` -- Updated to expect 4 options (padding behavior) instead of 2

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 83e2c05 | feat(05-01): update all question generators to produce exactly 4 options |
| 2 | 5595ed4 | feat(05-01): balance recognition types to 33/33/33 rule/name_to_letter/letter_to_name |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated checkpoint.ts distractor counts**
- **Found during:** Task 1
- **Issue:** After changing makeOpts to pad to 4, checkpoint rule questions could get a second correct option from padding (e.g., two dotless letters), breaking the "unambiguous answer" invariant
- **Fix:** Updated checkpoint.ts `getDistractors` and `getRuleDistractors` from 2 to 3, and `getConfusionDistractors` from 2 to 3
- **Files modified:** src/engine/questions/checkpoint.ts
- **Commit:** 83e2c05

## Verification

- All 826 tests pass (787 pass + 39 todo)
- No new type errors introduced (28 pre-existing errors in unrelated files)
- Recognition type balance verified across 50 randomized runs
- 4-option enforcement verified across 20 randomized runs per generator

## Known Stubs

None.

## Self-Check: PASSED

- All 6 modified files exist on disk
- Both commits found: 83e2c05 (Task 1), 5595ed4 (Task 2)
- Acceptance criteria met: u.length < 4 appears 3x in shared.ts, allPool 3 appears 2x in review.ts, letter_to_name appears 2x in recognition.ts
- buildFallbackQuestion uses getDistractors(..., 3)
