---
phase: quick
plan: 260408-u5t
subsystem: engine/questions-v2
tags: [generators, prompt-variety, answer-leak, audio-mode, rounding]
dependency_graph:
  requires: []
  provides: [varied-prompts, leak-free-choose, vowel-audio-mode, exact-check-count]
  affects: [exercise-items, quiz-experience]
tech_stack:
  added: []
  patterns: [largest-remainder-allocation, context-sensitive-prompts, shortfall-redistribution]
key_files:
  created: []
  modified:
    - src/engine/questions-v2/tap.ts
    - src/engine/questions-v2/hear.ts
    - src/engine/questions-v2/choose.ts
    - src/engine/questions-v2/build.ts
    - src/engine/questions-v2/read.ts
    - src/engine/questions-v2/fix.ts
    - src/engine/questions-v2/check.ts
    - src/__tests__/engine/generators/read.test.ts
decisions:
  - Largest-remainder method for check allocation instead of Math.round + drift adjustment
  - Shortfall redistribution prefers read > choose > hear as fallback generators
metrics:
  duration_seconds: 218
  completed: "2026-04-09T01:50:19Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 8
---

# Quick Task 260408-u5t: Golden Path Quality Pass on V2 Exercise Generators

Prompt variety across all 6 generators, transliteration leak removal from choose, vowel-strategy audio mode, context-sensitive read prompts, and exact check rounding with shortfall redistribution.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Fix generators: prompt variety, choose answer leak, vowel audio mode, read context | 7db515f | 6 generators updated with rotating prompts, choose leak fixed, vowel audio mode added |
| 2 | Fix check rounding and update test assertions | 01009ef | Largest-remainder allocation, shortfall redistribution, read.test.ts prompt assertion loosened |

## Changes Made

### Task 1: Generator Quality Improvements

**Prompt variety (all 6 generators):**
- tap.ts: 3 prompt arrays (letter/combo/default), 4+3+3 variations
- hear.ts: 2 prompt arrays (audio-to-script/script-to-audio), 4 variations each
- choose.ts: 3 prompt arrays (letter/combo/default), 3 variations each
- build.ts: 1 prompt array, 4 variations
- read.ts: 4 prompt arrays (chunk/combo/letter/default), context-sensitive selection based on entity type and renderProfile
- fix.ts: 1 prompt array, 4 variations

**Choose answer leak fix (CRITICAL):**
- Removed `target.transliteration` from prompt text entirely
- Prompt now shows only arabicDisplay; learner must decode it themselves
- Zero references to `transliteration` remain in choose.ts

**Vowel-strategy audio mode:**
- When `step.distractorStrategy === "vowel"`, choose items now use `answerMode: "audio"`
- Options include `audioKey` via `deriveAudioKey()` instead of `displayArabic`
- Prompt `arabicDisplay` set to empty string for vowel audio items
- Forces learner to listen to distinguish vowel sounds rather than visually spotting harakat marks

**Read context-sensitive prompts:**
- Prompts adapt based on entity ID prefix (chunk:/combo:/letter:) and renderProfile
- Connected renderProfile prefers "Read this connected word" style prompts

### Task 2: Check Rounding Fix

**Largest-remainder allocation:**
- Replaced `Math.round` per weight + drift adjustment with proper largest-remainder method
- Guarantees allocations sum exactly to totalCount mathematically

**Shortfall redistribution:**
- After generation loop, if `allItems.length < totalCount`, redistributes deficit
- Fallback order: read (most reliable) > choose > hear
- Ensures check steps always hit target count even when build sub-generator cannot produce items

**Test assertion update:**
- read.test.ts: prompt text assertion changed from exact string match to truthy string check (prompts now rotate)

## Verification

- All 133 generator tests pass (9 test files, 0 failures)
- No transliteration references in choose.ts prompt construction
- TypeScript compiles cleanly (only pre-existing docs template errors)
- Each generator has 3+ prompt variations confirmed via grep

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `allEntities` reference error in check.ts redistribution**
- Found during: Task 2
- Issue: Redistribution code referenced `allEntities` (not in scope) instead of `allUnlockedEntities`
- Fix: Changed to `allUnlockedEntities` which is destructured from input
- Files modified: src/engine/questions-v2/check.ts
- Commit: 01009ef

**2. [Rule 2 - Cleanup] Removed unused `deficit` variable in check.ts**
- Found during: Task 2
- Issue: `deficit` was declared but never used after redistribution refactor
- Fix: Removed the unused variable declaration
- Files modified: src/engine/questions-v2/check.ts
- Commit: 01009ef

## Self-Check: PASSED

All 8 modified files exist. Both task commits verified (7db515f, 01009ef). 133/133 tests pass.
