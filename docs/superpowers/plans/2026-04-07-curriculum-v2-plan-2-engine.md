# Curriculum V2 — Plan 2: Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v2 engine layer — scoring evaluation, mastery state machine, all 7 exercise generators, the dispatcher, review scheduling, phase unlock evaluation, and checkpoint remediation. After this plan, the engine can take a `LessonV2` and produce scored, mastery-updated results.

**Architecture:** Pure TypeScript functions with zero React dependencies (following the project's engine layer pattern). Generators receive `GeneratorInput` and return `ExerciseItem[]`. The dispatcher walks `exercisePlan` and calls generators in order. Scoring evaluates `LessonResult` from `ScoredItem[]`. Mastery state machine handles transitions and demotion. Review scheduling builds sessions from overdue entities. All functions are testable in isolation via Vitest.

**Tech Stack:** TypeScript 5.9, Vitest 4.1. No React, no SQLite, no platform dependencies in this layer.

**Spec:** `docs/superpowers/specs/2026-04-07-curriculum-v2-design.md` — Sections 3 and 4.

**Depends on:** Plan 1 (complete) — types in `src/types/`, registries in `src/data/curriculum-v2/`, entity registry in `src/engine/v2/entityRegistry.ts`.

---

## File Structure

```
src/engine/
  v2/
    entityRegistry.ts           # EXISTS (Plan 1)
    validation.ts               # EXISTS (Plan 1)

    scoring.ts                  # Lesson pass/fail evaluation from ScoredItem[]
    mastery.ts                  # Entity mastery state machine + transitions
    review.ts                   # Spaced review scheduling + graduated reset
    unlocks.ts                  # Phase unlock evaluation
    remediation.ts              # Checkpoint failure → targeted mini-review

  questions-v2/
    shared.ts                   # Shared utilities: entity picking, distractor selection, shuffling
    tap.ts                      # Tap generator
    hear.ts                     # Hear generator
    choose.ts                   # Choose generator
    build.ts                    # Build generator
    read.ts                     # Read generator
    fix.ts                      # Fix generator
    check.ts                    # Check generator (assessment-profile-driven)
    index.ts                    # Dispatcher: walks exercisePlan, calls generators

src/__tests__/engine/
    scoring.test.ts
    mastery.test.ts
    review.test.ts
    unlocks.test.ts
    remediation.test.ts
    generators/
      shared.test.ts
      tap.test.ts
      hear.test.ts
      choose.test.ts
      build.test.ts
      read.test.ts
      fix.test.ts
      check.test.ts
      dispatcher.test.ts
```

---

## Important Design Notes

### Generator Input

All generators receive the same input shape. This is built by the dispatcher from lesson data + resolved entities + mastery snapshot:

```typescript
// Already defined in src/types/exercise.ts (Plan 1) — ExerciseItem, CorrectAnswer, etc.
// New types needed for generator input:

interface GeneratorInput {
  step: ExerciseStep;                    // the current plan step (typed union)
  lesson: LessonV2;                      // full lesson for context
  teachEntities: AnyEntity[];            // resolved teach entities
  reviewEntities: AnyEntity[];           // resolved review entities
  allUnlockedEntities: AnyEntity[];      // everything learner has seen (for distractors)
  masterySnapshot: MasterySnapshot;      // current mastery state for weighting
  renderProfile: RenderProfile;          // lesson-level or step-level override
}

interface MasterySnapshot {
  entityStates: Map<string, EntityMasteryState>;
  confusionPairs: Map<string, string[]>; // entityId → confused-with entityIds
}

interface EntityMasteryState {
  state: "not_started" | "introduced" | "unstable" | "accurate" | "retained";
  correctCount: number;
  attemptCount: number;
}
```

### Entity Selection by Source

Every generator must resolve which entities to use based on `step.source`. This logic is shared:

```
"teach"    → lesson.teachEntityIds (resolved)
"review"   → lesson.reviewEntityIds (resolved)
"mixed"    → weighted blend of teach + review per mix ratios
"all"      → allUnlockedEntities
"explicit" → step.source.entityIds (resolved)
```

### Distractor Selection

Generators that need distractors (tap, hear, choose, read) pull from `allUnlockedEntities`, filtered to the same entity type. Distractors prefer confusion pairs from `masterySnapshot.confusionPairs` when available.

---

### Task 1: Generator Input Types + Shared Utilities

**Files:**
- Modify: `src/types/exercise.ts` — add `GeneratorInput`, `MasterySnapshot`, `EntityMasteryState`
- Create: `src/engine/questions-v2/shared.ts` — entity selection, distractor picking, shuffling
- Test: `src/__tests__/engine/generators/shared.test.ts`

This task creates the shared foundation all generators depend on. The `pickEntitiesBySource` function resolves which entities a step should use. The `pickDistractors` function selects confusable alternatives. The `shuffle` utility randomizes arrays deterministically for testing.

**Key functions in `shared.ts`:**

```typescript
// Pick entities for a step based on its source config
function pickEntitiesBySource(
  source: ExerciseSource,
  teachEntities: AnyEntity[],
  reviewEntities: AnyEntity[],
  allUnlockedEntities: AnyEntity[],
): AnyEntity[]

// Pick N distractor entities of compatible type, preferring confusion pairs
function pickDistractors(
  target: AnyEntity,
  pool: AnyEntity[],
  count: number,
  confusionPairs: Map<string, string[]>,
): AnyEntity[]

// Fisher-Yates shuffle (accepts optional seed for deterministic testing)
function shuffle<T>(arr: T[], seed?: number): T[]

// Derive audio key from entity (handles letter, combo, chunk, word conventions)
function deriveAudioKey(entity: AnyEntity): string
```

**Tests should verify:**
- `pickEntitiesBySource` returns correct entities for each source type (teach, review, mixed, all, explicit)
- `pickEntitiesBySource` with "mixed" respects teach/review ratio
- `pickDistractors` prefers confusion pairs when available
- `pickDistractors` falls back to random same-type entities when no confusion pairs
- `pickDistractors` never returns the target entity itself
- `pickDistractors` returns fewer than requested if pool is too small (no crash)
- `deriveAudioKey` produces correct keys for letter, combo, chunk entities
- `shuffle` produces a permutation (same elements, different order)

- [ ] **Step 1:** Write failing tests for all functions above
- [ ] **Step 2:** Add `GeneratorInput`, `MasterySnapshot`, `EntityMasteryState` to `src/types/exercise.ts`
- [ ] **Step 3:** Implement `shared.ts`
- [ ] **Step 4:** Verify all tests pass
- [ ] **Step 5:** Commit

---

### Task 2: Scoring Engine

**Files:**
- Create: `src/engine/v2/scoring.ts`
- Test: `src/__tests__/engine/scoring.test.ts`

Evaluates a completed lesson's `ScoredItem[]` against its `MasteryPolicy` and produces a `LessonResult`.

**Key function:**

```typescript
function evaluateLesson(
  lessonId: number,
  scoredItems: ScoredItem[],
  policy: MasteryPolicy,
): LessonResult
```

**Logic (from spec Section 4.2):**
1. Calculate `overallPercent` = correctItems / totalItems
2. Filter decode items (`isDecodeItem === true`)
3. Calculate `decodePercent` = decodeCorrect / decodeItems
4. Calculate `finalDecodeStreak` = consecutive correct decode items from the end
5. Evaluate pass conditions:
   - `overallPercent >= policy.passThreshold`
   - If `decodePassRequired`: `finalDecodeStreak >= decodePassRequired`
   - If `decodeMinPercent`: `decodePercent >= decodeMinPercent`
6. Collect `failureReasons` for any failed condition
7. Calculate `bucketScores` from items with `assessmentBucket` set

**Tests should verify:**
- Lesson passes when all thresholds met
- Lesson fails on overall threshold miss (specific failure reason)
- Lesson fails on decode streak miss (specific failure reason)
- Lesson fails on decode percent miss (specific failure reason)
- Multiple failure reasons collected simultaneously
- Bucket scores calculated correctly from assessment items
- Lesson with no decode items and no decode policy passes on overall alone
- Edge case: 100% score passes, 0% fails

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `scoring.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 3: Mastery State Machine

**Files:**
- Create: `src/engine/v2/mastery.ts`
- Test: `src/__tests__/engine/mastery.test.ts`

Implements entity mastery transitions, demotion, and pre-introduction evidence buffering.

**Key types and functions:**

```typescript
interface EntityMastery {
  entityId: string;
  state: "not_started" | "introduced" | "unstable" | "accurate" | "retained";
  correctCount: number;
  attemptCount: number;
  recentAttempts: RecentAttempt[];  // last 8
  intervalDays: number;
  nextReview: string;              // ISO date
  sessionStreak: number;
  confusionPairs: { entityId: string; count: number; lastSeen: string }[];
}

interface RecentAttempt {
  correct: boolean;
  exerciseType: ExerciseStep["type"];
  answerMode: string;
  timestamp: string;
}

// Apply one attempt to an entity's mastery record
function recordAttempt(
  mastery: EntityMastery,
  attempt: RecentAttempt,
  lessonPassed: boolean,
): EntityMastery

// Check if entity should promote to next state
function evaluatePromotion(mastery: EntityMastery, lessonPassed: boolean): EntityMastery

// Apply demotion on review failure (graduated reset per spec)
function applyDemotion(mastery: EntityMastery): EntityMastery

// Record a confusion pair
function recordConfusion(
  mastery: EntityMastery,
  confusedWithId: string,
): EntityMastery

// Create initial mastery record for a new entity
function createEntityMastery(entityId: string): EntityMastery
```

**Transition rules (from spec Section 4.3):**
- `not_started → introduced`: entity in passed lesson's teachEntityIds
- `introduced → unstable`: correct in 2+ exercises across 1+ lessons
- `unstable → accurate`: >= 80% correct over last 8 attempts, no confusion-pair failures
- `accurate → retained`: correct in spaced review at 7+ day interval
- Demotion: `introduced`/`unstable` reset to interval 1. `accurate` steps back one interval. `retained` steps back two. Full reset on 2+ consecutive failures.

**Critical rule:** All attempts update evidence (attempt counts, confusion pairs, recent attempts). Only passed lessons trigger promotion from `not_started → introduced`.

**Tests should verify:**
- `not_started` stays `not_started` after failed lesson attempt (but evidence recorded)
- `not_started → introduced` on passed lesson
- `introduced → unstable` after 2 correct attempts
- `unstable → accurate` at 80%+ over 8 recent attempts with no confusions
- `unstable` stays `unstable` below 80%
- `accurate → retained` on review at 7+ day interval
- Demotion: `introduced` resets interval to 1
- Demotion: `accurate` steps back one interval
- Demotion: `retained` steps back two intervals
- Full reset on 2 consecutive failures
- Confusion pair tracking works
- recentAttempts capped at 8

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `mastery.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 4: Tap + Hear + Choose Generators

**Files:**
- Create: `src/engine/questions-v2/tap.ts`
- Create: `src/engine/questions-v2/hear.ts`
- Create: `src/engine/questions-v2/choose.ts`
- Test: `src/__tests__/engine/generators/tap.test.ts`
- Test: `src/__tests__/engine/generators/hear.test.ts`
- Test: `src/__tests__/engine/generators/choose.test.ts`

These three generators share a similar structure: pick target entities, generate distractor options, return ExerciseItem[]. They differ in prompt style and distractor strategy.

**tap.ts:**
- Show Arabic letter/form/mark, learner picks the match from 3-4 options
- `isDecodeItem: false`
- `answerMode: "arabic"`
- Distractors: visual confusables from `allUnlockedEntities`, same entity type
- No audio

**hear.ts:**
- Two modes based on `step.direction`:
  - `audio-to-script`: prompt has `audioKey`, options are Arabic text
  - `script-to-audio`: prompt is Arabic, options are audio buttons
- `isDecodeItem: false`
- `answerMode: "audio"`
- Distractors: auditory confusables (close phonemes)

**choose.ts:**
- Like tap but with deliberately close distractors per `distractorStrategy`
- 4 options always (1 correct + 3 distractors)
- `isDecodeItem: false`
- `answerMode: "arabic"`
- Uses confusion pairs from mastery snapshot when available

**Each generator's test should verify:**
- Correct number of items produced (matches `step.count`)
- Each item has correct `type` field
- Each item has exactly one correct option
- Options include the correct answer
- No duplicate options
- Distractors are from the same entity type
- `isDecodeItem` is false for all three

- [ ] **Step 1:** Write failing tests for all three generators
- [ ] **Step 2:** Implement `tap.ts`
- [ ] **Step 3:** Implement `hear.ts`
- [ ] **Step 4:** Implement `choose.ts`
- [ ] **Step 5:** Verify all tests pass
- [ ] **Step 6:** Commit

---

### Task 5: Build Generator

**Files:**
- Create: `src/engine/questions-v2/build.ts`
- Test: `src/__tests__/engine/generators/build.test.ts`

Unique mechanic: tile bank construction. The learner assembles a target from tapped tiles.

**Logic:**
1. Pick target entities filtered to `buildable` capability
2. For each target, get `teachingBreakdownIds` (need to resolve entity and check for this field)
3. Create correct tiles from breakdown IDs
4. Add 2-3 distractor tiles from same entity family
5. Respect `maxTiles` — cap total bank size
6. Return `ExerciseItem` with `tiles` array and `correctAnswer: { kind: "sequence", values: [...] }`

**Mark handling policy:**
- Phases 1-2: tiles are combo-level (harakat attached to letter)
- Phase 3+: marks can be separate tiles when lesson teaches mark placement
- This is controlled by the target entity's `teachingBreakdownIds`, not by the generator

**`isDecodeItem: false`**, `answerMode: "build"`

**Tests should verify:**
- Correct number of items
- Each item has `tiles` array
- Tiles include all correct breakdown components
- Tiles include distractors
- Total tiles <= maxTiles when set
- Correct answer is `{ kind: "sequence" }` with ordered values
- Items only generated for entities with `buildable` capability
- Entity without `teachingBreakdownIds` is skipped gracefully

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `build.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 6: Read Generator

**Files:**
- Create: `src/engine/questions-v2/read.ts`
- Test: `src/__tests__/engine/generators/read.test.ts`

The most important generator — this is where real decoding happens.

**Logic:**
1. Pick target entities filtered to `readable` capability
2. Determine `answerMode` based on lesson phase:
   - Phase 1: `"transliteration"`
   - Phase 2 (lessons 9-14): `"transliteration"` or `"audio"` (alternate)
   - Phase 2 (lessons 15-18): `"audio"`
   - Phase 3-4: `"audio"` or `"arabic"`
   - Phase 5-6: `"audio"`
3. Generate 4 multiple-choice options (1 correct + 3 distractors)
4. For transliteration mode: options show Latin text
5. For audio mode: options have `audioKey` only
6. For arabic mode: options show similar Arabic chunks
7. `isDecodeItem: true` — always
8. Apply `renderOverride` from step if set, else lesson `renderProfile`

**Anti-transliteration guard:** If `lesson.phase > 2`, the generator MUST NOT emit `answerMode: "transliteration"` regardless of any other data. This is the generator-level layer of the three-layer guard (spec Section 3, read.ts).

**Tests should verify:**
- All items have `isDecodeItem: true`
- Phase 1 items have `answerMode: "transliteration"` with text options
- Phase 3+ items never have `answerMode: "transliteration"`
- Phase 5+ items have `answerMode: "audio"` with audioKey options
- Each item has exactly 4 options (1 correct + 3 distractors)
- Correct answer is `{ kind: "single" }`
- Connected flag passed through to prompt rendering
- RenderOverride takes precedence over lesson renderProfile

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `read.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 7: Fix Generator

**Files:**
- Create: `src/engine/questions-v2/fix.ts`
- Test: `src/__tests__/engine/generators/fix.test.ts`

Two-step exercise: locate error, then select correction.

**Logic:**
1. Pick target entities filtered to `fixable` capability
2. Based on `step.target` (vowel, dot, join, letter, word), introduce exactly one error:
   - `vowel`: swap one harakat for another
   - `dot`: change dot count on one letter
   - `letter`: swap for a confusable sibling
   - `join`: incorrect connection (only after joining lessons)
   - `word`: swap one word for similar-sounding word
3. Generate `FixSegment[]` with explicit hit zones — each segment is independently tappable
4. Mark exactly one segment as `isErrorLocation: true`
5. Generate 3-4 correction options for the error location
6. `correctAnswer: { kind: "fix", location: segmentId, replacement: correctValue }`
7. `isDecodeItem: false`, `answerMode: "fix-locate"`

**Safety rails:**
- Only one error per item
- Error must produce a plausible result, not nonsense
- Join errors only if lesson phase >= 2 (connected forms introduced)

**Tests should verify:**
- Each item has `fixSegments` array
- Exactly one segment marked as error location
- Correction options include the correct replacement
- Correct answer is `{ kind: "fix" }`
- Error type matches `step.target`
- Items only generated for entities with `fixable` capability
- Vowel errors swap harakat correctly

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `fix.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 8: Check Generator

**Files:**
- Create: `src/engine/questions-v2/check.ts`
- Test: `src/__tests__/engine/generators/check.test.ts`

Assessment-profile-driven mixed generator. Produces items from OTHER generators based on exercise weights.

**Logic:**
1. Load `AssessmentProfile` by `step.assessmentProfile`
2. Distribute `step.count` items across exercise types per `exerciseWeights`
3. Enforce `minimumReadPercent` — at least that fraction must be decode items
4. For each sub-type, call the corresponding generator (tap, hear, choose, build, read, fix)
5. Apply `scaffoldingLevel` from profile
6. Tag each item with `generatedBy` (which sub-generator) and `assessmentBucket` from profile's `diagnosticTags`
7. Prefer entities the learner hasn't proven retention on (use mastery snapshot)

**Tests should verify:**
- Total items match `step.count`
- Exercise type distribution roughly matches weights
- `minimumReadPercent` enforced (at least N decode items)
- Each item has `generatedBy` set
- Each item has `assessmentBucket` from profile's diagnostic tags
- Profile's `scaffoldingLevel` is applied

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `check.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 9: V2 Dispatcher

**Files:**
- Create: `src/engine/questions-v2/index.ts`
- Test: `src/__tests__/engine/generators/dispatcher.test.ts`

The single entry point that walks `exercisePlan` and calls generators.

**Key function:**

```typescript
async function generateV2Exercises(
  lesson: LessonV2,
  allUnlockedEntities: AnyEntity[],
  masterySnapshot: MasterySnapshot,
): Promise<ExerciseItem[]>
```

**Logic:**
1. Resolve `lesson.teachEntityIds` and `lesson.reviewEntityIds` via entity registry
2. For each step in `lesson.exercisePlan`:
   a. Build `GeneratorInput` with resolved entities, mastery snapshot, render profile
   b. Look up generator by `step.type` in a `generatorMap`
   c. Call generator, collect items
3. Return flattened array of all `ExerciseItem[]`

One loop, one dispatch. No `lessonMode` branching.

**Tests should verify:**
- Dispatches to correct generator for each step type
- Produces correct total item count (sum of all step counts)
- Items appear in exercise plan order
- Render profile resolution: step override > lesson profile > "isolated" default
- Works with vertical-slice lesson data (lesson 2 with tap+hear+choose+read)
- Works with checkpoint lesson (lesson 7 with check step)

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `index.ts` dispatcher
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 10: Review Scheduling

**Files:**
- Create: `src/engine/v2/review.ts`
- Test: `src/__tests__/engine/review.test.ts`

Builds review sessions from overdue entities with graduated interval reset.

**Key functions:**

```typescript
// Get entities due for review
function getDueEntities(
  allMastery: EntityMastery[],
  today: string,  // ISO date
): EntityMastery[]

// Sort by priority (overdue weight, weak state, confusion heaviness)
function prioritizeForReview(
  due: EntityMastery[],
  maxPerSession: number,
): EntityMastery[]

// Advance interval after correct review
function advanceInterval(mastery: EntityMastery): EntityMastery

// Step back interval after incorrect review (graduated reset)
function stepBackInterval(mastery: EntityMastery): EntityMastery
```

**Review intervals:** 0 (same day), 1, 3, 7, 14, 30 days

**Graduated reset (from spec Section 4.4):**
- `introduced`/`unstable`: reset to interval 1
- `accurate`: step back one interval
- `retained`: step back two intervals
- Full reset to 1 only on 2+ consecutive failures

**Tests should verify:**
- Only entities with `nextReview <= today` returned as due
- Priority sorting: overdue entities first, then weak state, then confusion-heavy
- `maxPerSession` caps results
- `advanceInterval` follows interval sequence (0→1→3→7→14→30)
- `stepBackInterval` applies graduated reset correctly per state
- `introduced` entity resets to interval 1
- `retained` entity steps back two intervals
- Entities with 2+ consecutive failures fully reset

- [ ] **Step 1:** Write failing tests
- [ ] **Step 2:** Implement `review.ts`
- [ ] **Step 3:** Verify tests pass
- [ ] **Step 4:** Commit

---

### Task 11: Phase Unlocks + Remediation

**Files:**
- Create: `src/engine/v2/unlocks.ts`
- Create: `src/engine/v2/remediation.ts`
- Test: `src/__tests__/engine/unlocks.test.ts`
- Test: `src/__tests__/engine/remediation.test.ts`

**unlocks.ts — Phase unlock evaluation:**

```typescript
interface ProgressSnapshot {
  phaseCompleted: (phase: number) => boolean;
  lessonPassed: (lessonId: number) => boolean;
  getOverdueEntities: (phase: number) => EntityMastery[];
  countRetainedEntities: (phase: number) => number;
}

interface UnlockResult {
  unlocked: boolean;
  reasons: string[];
}

function canUnlockPhase(
  phase: PhaseV2,
  progress: ProgressSnapshot,
): UnlockResult
```

Evaluates all unlock policy conditions: `requirePhase`, `requireCheckpointPass`, `reviewQueuePolicy` (maxOverdueCritical, overdueDaysThreshold, scopeTag), `minRetainedEntities`.

**remediation.ts — Checkpoint failure → targeted review:**

```typescript
function generateRemediation(
  failedResult: LessonResult,
  allMastery: EntityMastery[],
  maxItems: number,
): { entityIds: string[]; exerciseTypes: ExerciseStep["type"][] }
```

Takes a failed checkpoint's `bucketScores` and `failureReasons`, identifies the weakest areas, and returns a set of entity IDs and exercise types for a targeted mini-review.

**Unlock tests should verify:**
- Phase 1 always unlocked (requirePhase: 0)
- Phase 2 blocked if Phase 1 not complete
- Phase 2 blocked if checkpoint not passed
- Phase with review queue policy: blocked if too many critical overdue entities
- Phase with minRetainedEntities: blocked if threshold not met
- All conditions must pass (any failure blocks)
- Specific failure reason strings returned

**Remediation tests should verify:**
- Produces entity IDs from weakest diagnostic buckets
- Respects maxItems cap
- Empty bucket scores produce no remediation items
- Exercise types match weak entities' capabilities

- [ ] **Step 1:** Write failing tests for both files
- [ ] **Step 2:** Implement `unlocks.ts`
- [ ] **Step 3:** Implement `remediation.ts`
- [ ] **Step 4:** Verify tests pass
- [ ] **Step 5:** Commit

---

## Plan 2 Complete — Summary

**Gate:** All generators produce valid `ExerciseItem[]` for vertical-slice lessons. Scoring evaluates correctly. Mastery state machine transitions work. The dispatcher can walk any v2 lesson's exercisePlan end-to-end. Review scheduling and phase unlocks enforce honest progress.

| Task | What it produces | Estimated tests |
|------|-----------------|----------------|
| 1 | Generator input types + shared utilities | ~12 |
| 2 | Scoring engine (evaluateLesson → LessonResult) | ~10 |
| 3 | Mastery state machine (transitions, demotion, promotion) | ~14 |
| 4 | Tap + Hear + Choose generators | ~18 |
| 5 | Build generator | ~10 |
| 6 | Read generator (with anti-transliteration guard) | ~10 |
| 7 | Fix generator (with segmentation) | ~10 |
| 8 | Check generator (assessment-profile-driven) | ~8 |
| 9 | V2 dispatcher | ~8 |
| 10 | Review scheduling + graduated reset | ~10 |
| 11 | Phase unlocks + remediation | ~12 |
| **Total** | | **~120 tests** |

## Remaining Plans

**Plan 3: Audio & UI Components** — Audio resolver + playback policy, exercise components, result screens, phase gating UI.

**Plan 4: Integration & Vertical Slice** — `CurriculumProvider`, feature flag, v2 hooks, lesson screen wiring, end-to-end vertical slice test.

**Plan 5: Content Population** — All 62 lessons for Phases 1-6, full registry content.
