# Tila Curriculum V2 Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Scope:** Replace current 4-phase recognition-first curriculum with 6-phase decoding-first curriculum (Phases 1-6, lessons 1-62), targeting Surah Al-Fatiha as the first milestone. Phases 7-12 deferred.

---

## Context

### Problem
The current Tila curriculum is structured as a recognition-first alphabet course: Phase 1 teaches all 28 isolated letters, Phase 2 teaches sounds, Phase 3 teaches harakat on all letters, Phase 4 teaches connected forms. This sequence delays real reading until late in the course and trains the wrong visual system (isolated forms before connected script).

### Solution
Replace the curriculum with a decoding-first design: reading starts in lesson 2, connected forms appear early, only the letters needed for Al-Fatiha are taught before the milestone, and the alphabet is completed after the first real Quran win.

### Approach
**Approach B with a C-shaped seam:** Build v2 curriculum data and engine alongside v1, behind a feature flag. The v2 lesson schema uses an ordered `exercisePlan` per lesson (the C-shaped seam) instead of v1's single `lessonMode`. A single switchpoint controls which curriculum the app runs. v1 is deleted after v2 is stable.

### Key Decisions
- **Staged rollout:** Phases 1-6 (62 lessons, zero to Al-Fatiha) first. Phases 7-12 built later.
- **Clean slate:** No existing users to migrate. All testers start fresh on v2.
- **All new exercise types:** Build, Read, and Fix are must-haves, not deferred.
- **Strict promotion rules:** 85% pass, 90% checkpoint, decode-specific gating, review-queue blocking.
- **Audio plumbing now, sourcing later:** Architecture supports any audio source. Actual recording/TTS decision is a separate workstream.
- **Paywall position:** Decided later, not baked into curriculum spec.
- **V1 lesson modes retired:** `recognition`, `sound`, `contrast`, `harakat`, `connected-forms`, `connectedReading` are not used in v2. Connected-form teaching is handled through `renderProfile` and the `connected` flag on read steps. No v1 lesson mode maps to v2.

---

## Section 1: V2 Curriculum Data Structure

### Lesson Schema

```typescript
interface LessonV2 {
  id: number;
  phase: number;
  module: string;
  moduleTitle?: string;
  title: string;
  description: string;

  // Unified entity model
  teachEntityIds: string[];
  reviewEntityIds: string[];

  // Ordered exercise mix (the C-shaped seam)
  exercisePlan: ExerciseStep[];

  // Grouped promotion rules
  masteryPolicy: {
    passThreshold: number;          // 0.85 standard, 0.90 checkpoints
    decodePassRequired?: number;    // last N decode items must be correct
    decodeMinPercent?: number;      // checkpoint: 80% on read/decode items
  };

  // Rendering context
  renderProfile?: "isolated" | "connected" | "quran-script" | "mushaf";

  hintRuleId?: string;
  tags?: string[];
}
```

### ExerciseStep (Discriminated Union)

```typescript
type ExerciseStep =
  | {
      type: "tap";
      count: number;
      target: "letter" | "form" | "mark";
      source: ExerciseSource;
      distractorCount?: number;
    }
  | {
      type: "hear";
      count: number;
      target: "letter" | "combo" | "chunk" | "word";
      source: ExerciseSource;
      direction: "audio-to-script" | "script-to-audio";
    }
  | {
      type: "choose";
      count: number;
      target: "letter" | "combo" | "rule" | "word";
      source: ExerciseSource;
      distractorStrategy?: "family" | "vowel" | "shape" | "similar-word";
    }
  | {
      type: "build";
      count: number;
      target: "combo" | "chunk" | "word" | "phrase";
      source: ExerciseSource;
      maxTiles?: number;
    }
  | {
      type: "read";
      count: number;
      target: "combo" | "chunk" | "word" | "phrase" | "verse";
      source: ExerciseSource;
      connected?: boolean;
      renderOverride?: "connected" | "quran-script" | "mushaf";
    }
  | {
      type: "fix";
      count: number;
      target: "vowel" | "dot" | "join" | "letter" | "word";
      source: ExerciseSource;
    }
  | {
      type: "check";
      count: number;
      target: "mixed";
      source: ExerciseSource;
      assessmentProfile: string;
    };

type ExerciseSource =
  | { from: "teach" }
  | { from: "review" }
  | { from: "mixed"; mix?: { teach: number; review: number } }
  | { from: "all" }
  | { from: "explicit"; entityIds: string[] };
```

### Entity ID Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `letter:` | Individual Arabic letter | `letter:2` |
| `combo:` | Letter + harakat pairing | `combo:ba-fatha` |
| `chunk:` | Sub-word decodable unit | `chunk:bismi` |
| `word:` | Lexical teaching object | `word:allah` |
| `pattern:` | Reusable phonological/orthographic template | `pattern:long-aa` |
| `rule:` | Abstract reading principle | `rule:shaddah` |
| `orthography:` | Quran-script-specific visual convention | `orthography:dagger-alif` |

### Phase Schema

```typescript
interface PhaseV2 {
  phase: number;
  title: string;
  goal: string;
  unlockRuleText: string;
  unlockPolicy: {
    requirePhase: number;
    requireCheckpointPass: boolean;
    reviewQueuePolicy?: {
      maxOverdueCritical: number;
      overdueDaysThreshold: number;
      scopeTag?: string;
    };
    minRetainedEntities?: number;
  };
}
```

### Build-Time Validation Rules

1. Every entity in `teachEntityIds` and `reviewEntityIds` must resolve to a registered entry
2. Every `exercisePlan` step's `target` must be compatible with at least one referenced entity type
3. `check` steps must have a non-empty `assessmentProfile` that resolves to a registered profile
4. `decodePassRequired` cannot exceed total count of generated decode-capable *items* (sum of `count` across `read` + `check` steps), not the number of steps
5. Checkpoint lessons must include at least one `read` or `check` step
6. `source: { from: "explicit" }` must have non-empty `entityIds`, all resolvable
7. `renderOverride` on a step cannot be less complex than the lesson's `renderProfile`
8. Lessons with `decodePassRequired` must place decode-capable steps (`read`/`check`) at the end of their `exercisePlan` as an exit-block
9. `transliteration` answer mode on read steps is rejected past Phase 2

---

## Section 2: Content Registries

### Shared Entity Interface

```typescript
interface EntityBase {
  id: string;
  displayArabic: string;
  displayArabicAlt?: string;
  transliteration?: string;           // optional — required only for hearable/glossary entities
  capabilities: EntityCapability[];
}

type EntityCapability =
  | "tappable"
  | "hearable"
  | "readable"
  | "buildable"
  | "fixable"
  | "quran-renderable";
```

Generators query capabilities via a thin helper: `hasCapability(id, cap)`. No prefix-based hardcoding.

### chunks.ts

```typescript
interface ChunkEntity extends EntityBase {
  teachingBreakdownIds: string[];     // ordered pedagogical decomposition
  breakdownType: "teaching" | "visual" | "phonological";
  syllableCount: number;
  connectedForm?: string;
  audioKey: string;
}
```

### words.ts

```typescript
interface WordEntity extends EntityBase {
  teachingBreakdownIds: string[];
  breakdownType: "teaching" | "visual" | "phonological";
  connectedForm: string;
  quranScriptForm?: string;
  frequency?: "high" | "medium" | "low";
  teachingPriority?: "core" | "supporting" | "later";
  surahReferences?: string[];
  audioKey: string;
}
```

### patterns.ts

```typescript
interface PatternEntity extends EntityBase {
  patternType: "vowel" | "consonant" | "syllable" | "assimilation";
  description: string;
  exampleEntityIds: string[];
  contrastEntityIds?: string[];
}
```

### rules.ts

```typescript
interface RuleEntity extends EntityBase {
  ruleType: "mark" | "joining" | "stopping" | "pronunciation" | "vowel-behavior";
  description: string;
  appliesTo: string[];
  exampleEntityIds: string[];
  prerequisiteRuleIds?: string[];
}
```

### orthography.ts

```typescript
interface OrthographyEntity extends EntityBase {
  orthographyType: "special-form" | "small-mark" | "ligature" | "pause-mark";
  description: string;
  standardForm: string;
  quranForm: string;
  exampleEntityIds: string[];
}
```

### assessmentProfiles.ts

```typescript
interface AssessmentProfile {
  id: string;
  description: string;
  targetCapabilities: EntityCapability[];
  exerciseWeights: { type: ExerciseStep["type"]; weight: number }[];
  minimumReadPercent: number;
  scaffoldingLevel: "none" | "minimal" | "light";
  diagnosticTags?: string[];
  bucketThresholds?: Record<string, number>;
}
```

### Entity Resolution Helper

```typescript
// src/engine/v2/entityRegistry.ts

// Async: loads/resolves entities from registries
function resolveEntity(id: string): Promise<EntityBase | undefined>;
function resolveAll(ids: string[]): Promise<EntityBase[]>;

// Sync: operates on already-resolved entities (call after resolveEntity/resolveAll)
function hasCapability(entity: EntityBase, cap: EntityCapability): boolean;
function filterByCapability(entities: EntityBase[], cap: EntityCapability): EntityBase[];
```

Note: `resolveEntity`/`resolveAll` are async because registries may be loaded lazily. `hasCapability`/`filterByCapability` are sync because they operate on already-resolved in-memory entities, not on raw IDs. This is intentional — resolve first, then query capabilities on the result.

### Authoring Boundary Guide

- **Use `pattern:` when** the learner encounters a reusable sound or orthographic template across multiple words (long vowels, diphthongs, sun-letter assimilation)
- **Use `rule:` when** the learner must understand and apply an abstract reading principle (shaddah doubles, sukun stops, tanween behavior)
- **Use `orthography:` when** the convention only exists in Quran/Uthmani script and doesn't appear in standard Arabic (dagger alif, Allah special form, small Quran marks)
- **Do not store** a specific word form as a pattern. Store it as `word:` and reference the pattern it demonstrates.

### Content Population Estimates (Phases 1-6)

- ~15-20 chunks
- ~30-40 words
- ~8-10 patterns
- ~10-12 rules
- ~5-6 orthography entries
- ~6 assessment profiles

---

## Section 3: V2 Question Generator Contracts

### Shared Contract

```typescript
interface GeneratorInput {
  step: ExerciseStep;
  lesson: LessonV2;
  teachEntities: EntityBase[];
  reviewEntities: EntityBase[];
  allUnlockedEntities: EntityBase[];
  masterySnapshot: MasterySnapshot;
  renderProfile: RenderProfile;
}

interface GeneratorOutput {
  items: ExerciseItem[];
}

interface ExerciseItem {
  type: ExerciseStep["type"];
  prompt: ExercisePrompt;            // render-ready display payload
  options?: ExerciseOption[];
  tiles?: BuildTile[];
  correctAnswer: CorrectAnswer;
  targetEntityId: string;
  isDecodeItem: boolean;
  diagnosticTags?: string[];
  answerMode: "transliteration" | "audio" | "arabic" | "build" | "fix-locate";
  preloadHint?: { audioKeys: string[]; entityIds: string[] };
  // For fix exercises: generator-provided hit zones
  fixSegments?: FixSegment[];
  // For checkpoint sub-items: provenance
  generatedBy?: ExerciseStep["type"];
  assessmentBucket?: string;
}

type CorrectAnswer =
  | { kind: "single"; value: string }
  | { kind: "sequence"; values: string[] }
  | { kind: "fix"; location: string; replacement: string };

interface FixSegment {
  segmentId: string;
  displayText: string;
  isErrorLocation: boolean;
  boundingGroup: "letter" | "mark" | "join" | "word";
}
```

Generators return render-ready content: Arabic display text, alternate forms, audio keys, hint text, segmentation metadata. The UI never infers display from raw entities.

### Generator Specifications

#### tap.ts
- Show prompt + 3-4 options. Learner taps the match.
- Distractors: prefer visual confusables (same shape family, dot siblings) from `allUnlockedEntities`.
- No audio. Pure visual recognition.

#### hear.ts
- `audio-to-script`: Audio prompt, Arabic text options.
- `script-to-audio`: Arabic prompt, audio option buttons.
- Distractors: auditory confusables (close phonemes).
- Audio reference via `entity.audioKey`.

#### choose.ts
- Focused discrimination. Always 4 options. Distractors are deliberately close.
- `distractorStrategy` controls selection: family, vowel, shape, or similar-word.
- Mastery snapshot's confusion pairs preferred as distractors when available.
- **Distinction from tap:** Tap is warm-up identification. Choose is deliberate discrimination under confusable pressure.

#### build.ts
- Show tile bank + answer slots. Learner taps tiles right-to-left to construct target.
- Tiles derived from target's `teachingBreakdownIds` + 2-3 distractor tiles.
- Bank shuffled on mount. `maxTiles` caps bank size.
- **Mark handling policy:** Phases 1-2: marks attached to letter tiles (combo-level). Phase 3+: marks can be separate tiles when the lesson teaches mark placement. Orthography marks never standalone until explicitly taught.

#### read.ts
- Show Arabic, learner identifies what it says via multiple choice.
- **Answer mode progression (anti-transliteration guard):**
  - Phase 1 (1-8): transliteration allowed
  - Phase 2 early (9-14): transliteration or audio
  - Phase 2 late (15-18): audio only
  - Phase 3-4 (19-38): audio or Arabic-chunk choices
  - Phase 5-6 (39-62): audio only, no text crutch
- All read items set `isDecodeItem: true`.
- Build-time validation rejects transliteration past Phase 2. UI component refuses to render it as defense in depth.

#### fix.ts
- Two-step: locate error, then select correction. Both must be correct.
- Generator provides `FixSegment[]` with explicit hit zones. UI renders pre-segmented tappable regions. Never infers tap zones from glyph layout.
- One error per item. Error must produce a plausible distractor, not nonsense.
- Join errors only after connected-form lessons. Quran-script errors never create invalid mushaf forms.

#### check.ts
- Mixed assessment driven by `AssessmentProfile`.
- Distributes items across exercise types per `exerciseWeights`.
- Enforces `minimumReadPercent`.
- Each sub-item carries `generatedBy` and `assessmentBucket` provenance.
- Scaffolding level controls hints, replay, and undo availability.

### Dispatcher

```typescript
// src/engine/questions-v2/index.ts
function generateV2Exercises(lesson: LessonV2, context: LessonContext): ExerciseItem[] {
  const items: ExerciseItem[] = [];
  for (const step of lesson.exercisePlan) {
    const input = buildGeneratorInput(step, lesson, context);
    const generator = generatorMap[step.type];
    const output = generator(input);
    items.push(...output.items);
  }
  return items;
}
```

One loop, one dispatch. No `lessonMode` branching. The exercise plan IS the control flow.

---

## Section 4: Scoring, Mastery, Pass/Fail, and Review

### 4.1 Scoring

```typescript
interface ScoredItem {
  item: ExerciseItem;
  correct: boolean;
  responseTimeMs: number;
  generatedBy: ExerciseStep["type"];
  assessmentBucket?: string;
  answerMode: string;
}
```

**Critical rule:** All attempts update mastery evidence. Passed lessons unlock promotion. Failed lessons still increase attempt counts, populate confusion pairs, and can trigger demotion. The engine never hides weakness data.

### 4.2 Lesson Pass/Fail

```typescript
interface LessonResult {
  lessonId: number;
  totalItems: number;
  correctItems: number;
  overallPercent: number;
  decodeItems: number;
  decodeCorrect: number;
  decodePercent: number;
  finalDecodeStreak: number;
  bucketScores?: Record<string, { correct: number; total: number }>;
  passed: boolean;
  failureReasons?: LessonFailureReason[];
}

type LessonFailureReason =
  | { reason: "below-pass-threshold"; actual: number; required: number }
  | { reason: "decode-streak-broken"; required: number; achieved: number }
  | { reason: "decode-percent-low"; actual: number; required: number }
  | { reason: "bucket-weakness"; bucket: string; score: number };
```

Bucket weakness thresholds come from the `AssessmentProfile.bucketThresholds`, not hardcoded values.

**On failure:** Learner retries with re-rolled items weighted toward weak areas. No "half-passed" lessons. Checkpoint failure requires remediation before retry (not immediate brute-force retry).

### 4.3 Entity Mastery

**State machine:** `not_started -> introduced -> unstable -> accurate -> retained`

**Transitions:**
- `not_started -> introduced`: entity appears in a passed lesson's `teachEntityIds`. Note: failed attempts on not-yet-introduced entities still record attempt counts and confusion pairs in a pre-introduction evidence buffer, but the entity does not promote to `introduced` until the lesson passes. This reconciles "all attempts update evidence" with introduction being a promotion gate.
- `introduced -> unstable`: correct in 2+ exercises across 1+ lessons
- `unstable -> accurate`: >= 80% correct over last 8 attempts, no confusion-pair failures
- `accurate -> retained`: correct in spaced review at 7+ day interval
- Demotion on failure: `introduced`/`unstable` reset to interval 1. `accurate` steps back one interval. `retained` steps back two intervals. Full reset only on 2+ consecutive failures.

**Mastery record:**

```typescript
interface EntityMastery {
  entityId: string;
  profileId: string;
  state: "not_started" | "introduced" | "unstable" | "accurate" | "retained";
  correctCount: number;
  attemptCount: number;
  recentAttempts: {
    correct: boolean;
    exerciseType: ExerciseStep["type"];
    answerMode: string;
    timestamp: string;
  }[];                                // last 8
  intervalDays: number;
  nextReview: string;
  sessionStreak: number;
  confusionPairs: { entityId: string; count: number; lastSeen: string }[];
}
```

Mastery tracks all entity types (letters, combos, chunks, words, rules, patterns, orthography), not just letters.

**Review eligibility by state:** Introduced entities are eligible for same-day and next-day micro review if they were missed during their introducing lesson. This ensures weak new entities get immediate reinforcement rather than waiting for the standard review schedule to kick in at the `unstable` level.

### 4.4 Review Scheduling

**Intervals:** end-of-lesson micro review, then 1 day, 3 days, 7 days, 14 days, 30 days.

**Graduated reset on miss:** Introduced/unstable reset to interval 1. Accurate steps back one interval. Retained steps back two. Full reset to 1 only on 2+ consecutive failures.

**Review session generation:**
1. Query entities where `nextReview <= today`
2. Sort by priority: overdue weight * days-overdue + weak-state weight + confusion-pair weight
3. Cap per session to prevent fatigue
4. Generate exercises matching entity capabilities
5. On correct: advance interval. On incorrect: graduated step-back.

### 4.5 Phase Unlock Gating

Phase gating uses critical-entity threshold, not queue perfection.

`reviewQueuePolicy.maxOverdueCritical` caps how many critical prerequisite entities can be overdue (not "zero overdue"). `overdueDaysThreshold` only counts entities overdue by more than N days. `scopeTag` scopes to entities tagged as core to the prerequisite phase.

This prevents progression deadlock while maintaining honest gating.

### 4.6 Checkpoint Remediation

Failed checkpoint -> app generates targeted mini-review from weak diagnostic buckets -> learner completes remediation -> retry unlocks. No immediate brute-force retry.

---

## Section 5: File Structure, Migration, and Cutover

### 5.1 V2 File Layout

```
src/
  data/
    letters.js                          # UNCHANGED
    harakat.js                          # UNCHANGED
    connectedForms.js                   # UNCHANGED
    lessons.js                          # V1 — frozen until deletion
    curriculum-v2/
      lessons.ts
      phases.ts
      chunks.ts
      words.ts
      patterns.ts
      rules.ts
      orthography.ts
      assessmentProfiles.ts
      index.ts

  engine/
    questions/                          # V1 — frozen until deletion
    questions-v2/
      tap.ts
      hear.ts
      choose.ts
      build.ts
      read.ts
      fix.ts
      check.ts
      index.ts
    v2/
      entityRegistry.ts
      scoring.ts
      mastery.ts
      review.ts
      unlocks.ts
      validation.ts
      remediation.ts

  hooks/
    useLessonQuiz.ts                    # V1 — frozen
    useLessonQuizV2.ts                  # V2
    useProgressV2.ts                    # V2
    useMasteryV2.ts                     # V2
    useReviewV2.ts                      # V2

  providers/
    CurriculumProvider.tsx              # boot-time version resolution, wraps tree

  config/
    curriculumFlags.ts                  # flag logic
```

### 5.2 Single Switchpoint

`CurriculumProvider` resolves curriculum version at boot (alongside font loading and DB init in `app/_layout.tsx`). It loads once, caches, and only renders the curriculum-dependent tree after resolution. Screens call hooks via stable context API. No screen ever directly imports v1 or v2 data. No per-render version branching.

### 5.3 Feature Flag

- **Dev:** `EXPO_PUBLIC_CURRICULUM_OVERRIDE=v2` in `.env`
- **Internal testers:** `curriculumVersion: "v2"` in `user_profile` table
- **Production default:** hardcoded constant, starts as `"v1"`, flipped in code at cutover
- Boot-time resolution is async-safe. No synchronous SQLite reads.

### 5.4 Progress Isolation

**V1 and v2 do not share progress state.** Separate v2 database tables:

- `v2_lesson_attempts` (with `profile_id`)
- `v2_entity_mastery` (with `profile_id`)
- `v2_question_attempts` (with `profile_id`)
- `v2_phase_completion` (with `profile_id`)
- `v2_review_sessions` (with `profile_id`)

All v2 tables include `profile_id TEXT NOT NULL` for future account switching.

**Shared:** `user_profile`, `habit`, `premium_lesson_grants`.
**Not shared:** lesson completion, mastery, review queue, phase completion, attempt history.

### 5.5 No Automatic Migration

When a tester enrolls in v2, they start with empty v2 progress. No automatic conversion of v1 state into v2. If a migration tool is ever needed, it is a separate future project.

### 5.6 No Hybrid Lessons

A lesson is either v1 or v2, never mixed. V2 lessons never use v1 scoring, v1 mastery, v1 tables, or v1 generators. If a screen imports from both v1 and v2 hooks, that is a bug.

### 5.7 Migration Sequence

| Step | What | Gate |
|------|------|------|
| 1 | Add v2 data registries | All registries compile |
| 2 | Add entity resolution + validation | Schema compiles, vertical-slice lessons (5 sample + checkpoint) pass validation |
| 3 | Add v2 database tables + migration | Tables created on startup |
| 4 | Add v2 generators + dispatcher | Valid ExerciseItem[] for sample lessons |
| 5 | Add v2 scoring engine | Correct LessonResult for sample runs |
| 6 | Add v2 hooks | Hooks wire to DB correctly |
| 7 | Add CurriculumProvider + flag | Flag toggles cleanly |
| 8 | Wire v2 into lesson screen behind flag | Full lesson playable end-to-end |
| **8.5** | **Vertical slice: 5 lessons + checkpoint + remediation loop** | **Full loop works end-to-end** |
| 9 | Populate full Phases 1-6 (62 lessons) | All lessons pass validation |
| 10 | Internal testing — complete Al-Fatiha path | Lesson 62 reachable with honest mastery |
| 11 | Flip production default to v2 | Cutover criteria met |
| 12 | Delete v1 code | Deletion criteria met |

### 5.8 Cutover Criteria

All must be true:
- All 62 lessons authored and passing validation
- All 7 generators implemented
- Scoring produces correct pass/fail
- Entity mastery tracks all types
- Checkpoint remediation works
- Phase unlock gating works (including review-queue policy)
- Spaced review with graduated reset works
- Progress isolation confirmed
- Internal tester completed full Al-Fatiha path
- No blocker bugs
- Analytics events fire for lesson_start, lesson_complete, lesson_fail, checkpoint_fail, review_session, phase_unlock

### 5.9 Rollback Rules

**Soft rollback:** Pause new v2 enrollment. Existing v2 users stay on v2. V2 progress preserved. For minor issues.

**Hard kill switch:** Force all users to v1 regardless of profile flag. V2 progress preserved in tables but inaccessible until fix ships. For data corruption, crash-on-open, broken mastery.

### 5.10 V1 Deletion Criteria

All must be true:
- Production default has been v2 for one full bake period
- Zero active users on v1
- No open bugs referencing v1
- V2 analytics confirm normal operation

V1 database tables kept as legacy (may contain historical data). V1 code files deleted. Feature flag and switchpoint logic removed — v2 becomes the only path.

---

## Section 6: UI Changes

### 6.1 Lesson Screen

The lesson screen becomes a stepper that walks `exercisePlan` step by step. An `ExerciseRenderer` switches on `item.type` and mounts the correct component. No exercise-type logic in the lesson screen itself.

**Preload rule:** While item N is on screen, precompute item N+1's display payload and audio keys.

**Global feedback timing:** Input locks on submit. Result state shows for 800ms. Auto-advance in lessons, "Continue" button in checkpoints.

### 6.2 Exercise Components

All share a common props contract:

```typescript
interface ExerciseComponentProps {
  item: ExerciseItem;
  renderProfile: RenderProfile;
  onAnswer: (answer: UserAnswer) => void;
  isExitBlock: boolean;
  scaffoldingLevel: "none" | "minimal" | "light" | "full";
}
```

Components collect answers. They do not score them.

#### TapExercise
Large Arabic prompt. 3-4 option cards. No audio. Visual recognition only.

#### HearExercise
Audio-to-script: autoplay prompt, tap matching text. Script-to-audio: show text, tap matching sound. Replay tracked for analytics. No transliteration.

#### ChooseExercise
Focused discrimination. 4 deliberately close options. Minimum 48px touch targets. Distinct from Tap: Choose uses confusable pressure, Tap is warm-up.

#### BuildExercise
Tile bank + answer slots. Right-to-left fill. Audio target on mount. Undo by tapping filled slots. Confirm button when complete. Mark handling: combo-level tiles early, letter+mark tiles later. Build-time validation ensures tile granularity matches phase.

#### ReadExercise
Large Arabic + multiple choice answers. Answer mode progresses from transliteration (Phase 1 only) through audio (Phase 2 late) to audio-only (Phase 5+). Build-time validation rejects transliteration past Phase 2. UI refuses to render it as defense in depth. All read items flagged `isDecodeItem`. In Phases 5-6, audio answer buttons are visually identical (no size/label tells).

#### FixExercise
Two-step: locate error (tap pre-segmented hit zone), then select correction (3-4 options). Both steps must be correct. Generator provides `FixSegment[]` with explicit hit zones. UI never infers zones from glyphs. One error per item. Error must be plausible. Join errors only after joining lessons. No invalid mushaf forms.

#### CheckExercise
No unique component. Renders mixed exercise types per AssessmentProfile. Scaffolding level controls hints/replay/undo. "Checkpoint X of Y" progress indicator.

### 6.3 Result Screens

**Passed:** Score, honest mastery language ("practiced" / "strengthened" / "retained" — no false promotion claims), next lesson preview.

**Failed:** Specific actionable failure reasons rendered per `LessonFailureReason`. "Try Again" with re-rolled items.

**Checkpoint Failed:** Diagnostic bucket breakdown. No immediate retry. "Practice First" routes to remediation. "Retry Checkpoint" unlocks after remediation.

### 6.4 Phase Gating UI

Gating always explains what needs strengthening and shows the exact next action with its size ("Review 3 items", "Pass the checkpoint (10 items)"). Never blocks without an immediate action. Review-queue gates launch a review session targeting critical overdue entities.

### 6.5 Exit-Block Indicator

Subtle visual shift during final decode items (progress bar color change, "Final Check" label). Signals stakes without creating anxiety.

### 6.6 Anti-Crutch Rules

1. No transliteration in any exercise past Phase 2 (enforced at build-time and runtime)
2. No skip/pass on read or check items
3. No audio autoplay on read exercises (audio is the answer, not the prompt)
4. Replay limits in checkpoints per scaffolding level
5. No English in answer surface or Arabic content. English instructional chrome allowed.

---

## Section 7: Audio Strategy

### 7.1 Audio Surface Map

| Surface | Trigger | Replay |
|---------|---------|--------|
| Hear: audio-to-script prompt | Autoplay on mount | Per scaffolding level |
| Hear: script-to-audio options | User tap | Unlimited taps to compare |
| Build: target audio | Autoplay on mount | Tap to replay |
| Read: correct answer reveal | Autoplay on submit | Normal lessons: yes. Checkpoint none: no. |
| Read: audio answer options | User tap | Unlimited |
| Fix: correct version audio | Autoplay on confirm | Tap to replay |
| Tap / Choose | Never | N/A |

**Key rule:** Audio is never the prompt in a Read exercise. Read prompts are visual Arabic.

### 7.2 Audio Key System

Format: `{registry}_{entityId}` (e.g., `letter_1`, `combo_ba-fatha`, `word_allah`).

**Resolver (fully async):**

```typescript
interface AudioResolver {
  resolve(key: string): Promise<AudioSource | null>;
}

type AudioSource =
  | { type: "bundled"; assetPath: string }
  | { type: "cached"; cachePath: string }
  | { type: "placeholder"; fallback: "silence" | "parent-key" };
```

Resolution chain: Bundled -> Cached -> [Future: TTS] -> [Future: CDN] -> Placeholder.

### 7.3 Audio Manifest

Build-time tool derives required audio from: `exercisePlan` + source scopes + teach/review entities + assessment profile entity pools + explicit entity IDs + reveal audio requirements.

**Priority levels:**
- `critical`: Audio is prompt or only answer option. Lesson cannot function without it.
- `important`: Answer reveal or confirmation. Degraded without it.
- `nice-to-have`: Enhancement. Silent fallback.

Build-time validation: lessons with critical audio gaps fail validation.

### 7.4 Missing Audio Fallback

- **Critical:** Dev/QA: fail loudly. Production: block the lesson with "content unavailable" state. Never silently skip a scored item.
- **Important:** Exercise renders, visual-only confirmation, "audio unavailable" indicator.
- **Nice-to-have:** Silent fallback, no indicator.

### 7.5 Playback Rules

- One audio at a time. New requests interrupt current.
- Audio stops on item advance.
- Autoplay waits 300ms after mount.
- Replay count always tracked in ScoredItem metadata.
- Replay is a soft signal for review prioritization and analytics. It does NOT directly lower mastery confidence.

### 7.6 Checkpoint Audio Restrictions

| Scaffolding | Hear replay | Script-to-audio | Build replay | Answer reveal |
|-------------|------------|-----------------|-------------|---------------|
| full | Unlimited | Unlimited | Unlimited | Yes + replay |
| light | 2 | 3 per option | 2 | Yes + replay |
| minimal | 1 | 2 per option | 1 | Yes, no replay |
| none | 0 (one play) | 1 per option | 0 (one play) | No audio |

### 7.7 Preloading

While item N on screen, preload audio for item N+1. On lesson start, preload first 3 items' critical audio. Size-based cache budget: ~10MB decoded audio in memory. LRU eviction.

### 7.8 Global Mute / Sound-Off

Autoplay respects device mute and in-app sound setting. When suppressed, play buttons become visually prominent. Checkpoint replay limits apply equally to user-initiated plays.

### 7.9 Audio Analytics

| Event | Why |
|-------|-----|
| `audio_play` | Basic usage |
| `audio_replay` | Weakness signal |
| `audio_replay_limit_hit` | Checkpoint pressure |
| `audio_missing_critical` | Content gap |
| `audio_missing_important` | Degraded experience |
| `audio_option_comparison` | Sound discrimination difficulty |

### 7.10 Future Sourcing Interface

Source-agnostic. When sourcing decision is made, add new resolver backends (TTS, CDN). Lesson experience, components, and playback rules are identical regardless of source.

---

## Appendix: Example Lessons

### Lesson 2 — Meet Alif + Ba with Fatha (Phase 1)

```typescript
{
  id: 2,
  phase: 1,
  module: "1.1",
  title: "Meet Alif + Ba with Fatha",
  description: "Learn ا and ب with fatha and read the first real syllable: بَ",
  teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha"],
  reviewEntityIds: [],
  exercisePlan: [
    { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
    { type: "hear", count: 2, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
    { type: "choose", count: 3, target: "letter", source: { from: "teach" }, distractorStrategy: "shape" },
    { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
  ],
  masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
  renderProfile: "isolated",
}
```

### Lesson 46 — Allah Word Form (Phase 5)

```typescript
{
  id: 46,
  phase: 5,
  module: "5.6",
  title: "Allah Word Form",
  description: "Normalize الله as a special high-frequency Quran word",
  teachEntityIds: ["word:allah", "rule:shaddah", "orthography:allah-form"],
  reviewEntityIds: ["rule:alif-laam", "combo:la-fatha"],
  exercisePlan: [
    { type: "hear", count: 2, target: "word", source: { from: "teach" }, direction: "audio-to-script" },
    { type: "build", count: 2, target: "word", source: { from: "teach" }, maxTiles: 5 },
    { type: "read", count: 4, target: "word", source: { from: "mixed", mix: { teach: 3, review: 1 } }, connected: true },
    { type: "fix", count: 2, target: "vowel", source: { from: "teach" } },
  ],
  masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
  renderProfile: "quran-script",
}
```
