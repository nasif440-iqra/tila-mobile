# Lesson Quality Redesign: Hybrid Teach/Practice Model

**Date:** 2026-04-09
**Status:** Approved (pending implementation plan)
**Branch:** feature/curriculum-v2

## Problem

The first 18 lessons use fully generic exercise generators. Every exercise is a quiz — there's no teaching moment before testing. Distractors are random, prompts are generic, and the learner is tested on concepts before being properly introduced to them. The result: lessons feel like quizzes, not teaching.

## Solution: Hybrid Model

Hand-author the critical teaching moments. Keep generators for practice, review, and checkpoints.

- **Teach items** = hand-authored: first exposure, contrast moments, first decode, first connected reading, chain-breaking, checkpoint-critical prep
- **Practice items** = generated: repetition, review, lightweight drills, checkpoint pools, remediation

Each lesson follows a progression: **introduce → contrast → guided practice → decode/practice**.

## System Changes Required

### 1. New `present` exercise type

A non-interactive item that shows information. The learner taps Continue to proceed. No scoring.

- Large Arabic display
- One audio play (auto or tap-to-play)
- One plain line of meaning/context
- Continue button

Requires: new `ExerciseStep` variant in the type union, a `PresentExercise` UI component, pass-through in the generator dispatcher.

### 2. Hand-authored item format

Lessons gain a `teachingSequence` array containing fully-specified `ExerciseItem` objects. These are hand-authored in the lesson data file and played exactly as written — no generation, no randomization.

```typescript
interface LessonV2 {
  // ... existing fields
  teachingSequence?: AuthoredExerciseItem[];  // hand-authored teaching moments
  exitSequence?: AuthoredExerciseItem[];      // hand-authored decode gate items
  exercisePlan: ExerciseStep[];               // generated practice items
}
```

The `AuthoredExerciseItem` type mirrors `ExerciseItem` but all fields are required (no generator inference needed).

### 3. Lesson runner sequencing

The runner plays items in this order:
1. `teachingSequence` (hand-authored intro/teaching)
2. `exercisePlan` (generated practice)
3. `exitSequence` (hand-authored decode gate)

Teaching sequence items that are `present` type do not count toward scoring and do not affect mastery state. All other items — whether hand-authored or generated, whether in `teachingSequence`, `exercisePlan`, or `exitSequence` — count toward scoring and mastery. The scoring engine treats hand-authored quiz items identically to generated ones.

### 4. Inventory-aware distractor pools

Generators must respect the learner's known inventory at the time of each lesson. No unseen letters or combos as distractors. The pool is derived from the union of the lesson's `teachEntityIds` + `reviewEntityIds` + all entities from completed prior lessons.

## Schema Delta from Current V2 Spec

The current approved v2 schema (`src/types/curriculum-v2.ts`) has: `teachEntityIds`, `reviewEntityIds`, an ordered `exercisePlan`, `masteryPolicy`, and `renderProfile`. This redesign adds new fields and types.

### LessonV2 additions

```typescript
interface LessonV2 {
  // ... all existing fields unchanged
  teachingSequence?: AuthoredExerciseItem[];  // hand-authored intro/teaching items
  exitSequence?: AuthoredExerciseItem[];      // hand-authored decode gate items
}
```

- `teachingSequence` plays before `exercisePlan`. Contains `present`, `tap`, `hear`, `choose`, `read` items — all hand-authored.
- `exitSequence` plays after `exercisePlan`. Contains hand-authored decode gate items. Must be the final items in the lesson — nothing follows them.
- Both are optional. Checkpoint lessons may have only `exitSequence` (decode gate) with no `teachingSequence`. Sprint lessons may have both.

### `present` as an authored-only item type

`present` exists only as a value for `ExerciseItem.type` inside `teachingSequence`. It is **not** added to the `ExerciseStep` union in `exercisePlan`. There is no `present` generator and the dispatcher never encounters it — it is a pure data-driven item authored directly in lesson data and concatenated into the item array unchanged.

The `PresentExercise` UI component renders it. It is non-interactive (no scoring, no mastery effect).

### AuthoredExerciseItem type

```typescript
interface AuthoredExerciseItem extends ExerciseItem {
  // Same shape as ExerciseItem, but all fields are explicitly provided.
  // No generator inference. No randomization.
  // The dispatcher concatenates these directly into the item array.
}
```

### Validator responsibilities

The existing lesson validator (`src/data/curriculum-v2/` validation) must be extended:

- **Authored item validation:**
  - Required display fields present (`prompt.arabicDisplay` non-empty for non-present items)
  - No empty `options` arrays on quiz items (tap, hear, choose, read)
  - No raw entity IDs on learner-visible surfaces (`displayArabic` and `displayText` must be human-readable)
  - `correctAnswer` matches an actual option ID or tile entity ID
  - Authored `read` items in `exitSequence` must have `isDecodeItem: true`
  - `present` items must have `isDecodeItem: false` and are excluded from scoring/mastery
  - `exitSequence` items must not include `present` type (exit is always scored)
  - Every authored item must have a stable unique ID (e.g., `"L2-present-ba"`, `"L13-tap-find-ba"`). Every option and tile within authored items must also have a stable unique key. No duplicate IDs within a lesson. This prevents the duplicate-key runtime bugs seen in earlier v2 device testing.

### Runner sequencing update

`LessonRunnerV2` and `useLessonQuizV2` must concatenate items as:

```
[...teachingSequence, ...generatedFromExercisePlan, ...exitSequence]
```

Progress bar and item counter include all items. Scoring excludes `present` items.

### Scoring math

Pass/fail percentages, decode thresholds, and checkpoint bucket scores are calculated from **scored items only**, not from total displayed items. A lesson with 3 `present` items and 7 scored items uses 7 as the denominator. This applies to `masteryPolicy.passThreshold`, `decodePassRequired`, `decodeMinPercent`, result screen percentages, and analytics event payloads.

## Template Definitions

### Template 0A: Orientation (L1 only)

**Purpose:** Orient to Arabic script and de-risk the first experience.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Present letter 1 | present | authored | Show alif large + sound |
| Present letter 2 | present | authored | Show ba large + sound |
| Guided tap | tap | authored | "Find Ba" — 2 options (alif vs ba) |
| Guided hear | hear | authored | Play ba sound, pick from alif/ba |

No build, no choose, no read. 4-5 items max. Shortest lesson in the curriculum.

### Template 1A: Early New-Letter (L2, L3, L4, L6)

**Purpose:** Introduce a new letter and its fatha combo with strong scaffolding.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Present letter | present | authored | Show new letter large + sound |
| Present combo | present | authored | Show letter+fatha combo + sound |
| Guided tap | tap | authored | "Find [letter]" — 2 options, both from known inventory |
| Guided hear | hear | authored | Play combo sound, pick from 2-3 known options |
| Shape contrast | choose | generated | Shape-strategy distractors, pool limited to known inventory |
| Build (optional) | build | generated | Only when enough known combos exist (L3+) |
| Decode exit | read | authored | 2-3 tightly controlled items, explicit ramp |

Early lessons: more protection, fewer items (7-9), smaller distractor pools.

### Template 1B: Later New-Letter (L11, L12, L15)

**Purpose:** Introduce a new letter when the learner has a larger known inventory.

Same structure as 1A with these differences:
- Guided tap uses 3 options (larger known pool)
- Choose uses full known inventory for distractors
- Build is standard (enough material exists)
- Decode exit includes all three vowels on the new letter
- 8-9 items total

### Template 1B+4B: Later New-Letter with Chain-Break (L16 only)

**Purpose:** Introduce daal as both a new letter and a chain-breaker.

Same as 1B plus:
- At least one hand-authored present or read item showing daal's non-connecting behavior in connected context
- Decode exit renders in connected form
- At least one contrast item comparing daal chain-break vs fully-connected chunk

### Template 2A: Short-Vowel (L8, L9)

**Purpose:** Introduce a new vowel mark on already-known letters. Core skill: hearing and distinguishing marks.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Present mark | present | authored | Show vowel mark large + sound + one-line meaning |
| Present on known letter | present | authored | Show familiar letter + new mark + sound |
| Minimal-pair contrast | choose | authored | Same letter, two vowels, 2 options. Audio plays. Core teaching moment. |
| Wider discrimination | choose | generated | Vowel strategy, audio mode. 3-4 options across known vowels. |
| Fix the vowel | fix | generated | Spot wrong harakat. Comes after contrast is established. |
| Controlled decode exit | read | authored | 3 items: easy win, contrast item, mixed review. Hand-authored. |

L8 (kasra): contrasts with fatha only (2 known vowels).
L9 (damma): contrasts with fatha and kasra (3 known vowels).

### Template 2B: Sukun (L17 only)

**Purpose:** Teach consonant stopping — absence of vowel. Different cognitive task from adding a new vowel sound.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Present mark | present | authored | Show sukun. "This circle means stop. No vowel sound." |
| Sound vs stop contrast | present | authored | Show سَ vs سْ — hear the difference: sound continues vs stops. |
| Minimal-pair contrast | choose | authored | سَ vs سْ — "Which one stops?" Audio essential. |
| CVC chunk introduction | present | authored | Show بَسْ — "Ba says 'ba', seen stops: 'bas'." |
| Build CVC | build | generated | Assemble chunks (bas, min, lam) from combo tiles |
| Fix | fix | generated | Sukun vs vowel confusion. 2 items. |
| Decode exit (with connected bridge) | read | authored | 3 items. At least one renders in connected form to bridge toward L18. |

### Template 3A: Decoding Sprint (L5 only)

**Purpose:** No new concepts. Prove you can decode what you've learned.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Warm-up hear | hear | generated | 2 easy audio items from known combos |
| Targeted contrast | choose | authored | 2-3 items targeting specific confusions (ba/meem/laam shapes in combo context) |
| Build fluency | build | generated | Assemble known chunks from combo tiles |
| Decode ramp | read | authored + generated | 1-2 hand-authored (set floor/ceiling) + generated middle. Explicit ramp: easy → medium → hard. |

Should feel like a victory lap, not a surprise test. 8-10 items.

### Template 3B: Contrast Drill (L10 only)

**Purpose:** Vowel discrimination boot camp. No new concepts.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Warm-up hear | hear | generated | 2 audio items from review pool |
| Targeted minimal pairs | choose | authored | 3-4 same-letter minimal-pair items. Audio mode. Core skill test. |
| Fix (optional) | fix | generated | Only if it adds diagnostic signal |
| Decode ramp | read | authored | 4-5 items. Explicit ramp. No build. |

### Template 4A: First Connected Bridge (L13 only)

**Purpose:** Bridge the cognitive shift from isolated symbols to connected Arabic script.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Bridge reveal 1 | present | authored | Show isolated بَ مَ لَ → connected بَمَلَ. "Same letters, same sounds, new shape." Highly visual, minimal text. |
| Bridge reveal 2 | present | authored | Second example: نَ مَ لَ → نَمَلَ. Reinforces the pattern. |
| Guided recognition | tap | authored | "Find Ba inside بَمَلَ" — 2 options. Extremely clear UI. |
| Connected→isolated decomposition | choose | authored | "Which letters make up بَمَلَ?" — fully hand-authored, no generation. Core bridge work. |
| Build connected | build | generated | Assemble connected chunks from combo tiles |
| Decode connected | read | authored | 3-4 items. Connected rendering. Explicit ramp. |

The bridge reveal is the most important screen in the entire curriculum. It must be highly visual and low-text: see it, hear it, compare it, continue.

### Template 4B: Chain-Break (L14 only)

**Purpose:** Teach that some letters (alif) don't connect forward, creating a visible gap.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Bridge reveal | present | authored | Show بَمَلَ (fully connected) next to بَابَ (broken chain). "Most letters hold hands. Alif lets go." |
| Second bridge | present | authored | Show هَابَ — another chain-break. Different letters, same gap. |
| Gap contrast | choose | authored | "Which word has a gap?" — بَابَ vs بَمَلَ. 2 options. |
| Wider contrast | choose | authored | 3-4 options mixing chain-break and fully-connected chunks. |
| Build | build | generated | Assemble chain-break chunks — learner sees the gap form. |
| Decode connected | read | authored | 4-5 items. Connected rendering. Mix of chain-break and fully-connected. Heavier read block. |

### Template 5: Checkpoint (L7, L18)

**Purpose:** Pure assessment. No teaching. Gate progression to next phase.

| Phase | Type | Source | Details |
|-------|------|--------|---------|
| Confidence opener | authored item | authored | 1 easy but honest decode/discrimination item. Not a fake freebie. Lives in `teachingSequence`. |
| Diagnostic core | check | generated | A single `check` step in `exercisePlan`. Assessment-profile-driven. Only exercise types that diagnose the target skill. The check generator handles the mixed-type allocation internally — do not split it into separate generated steps. |
| Decode gate | read | authored | 2-3 fixed-order read items in `exitSequence`. No randomness. Directly aligned to the phase gate. Subtle transition ("Final reading check"). |

The confidence opener and decode gate are authored items outside the check generator. They live in `teachingSequence` and `exitSequence` respectively. The diagnostic core remains a single generated `check` step — do not embed opener/gate logic inside the check generator itself.

L7: mostly choose/read/hear in diagnostic. Decode gate: one combo, one chunk.
L18: read/choose/hear/fix in diagnostic. Decode gate: one connected chunk, one chain-break, one sukun chunk.

Pass threshold: 90%. Decode-specific minimums enforced.

## Implementation Order

1. L1 (orientation — smallest, proves the `present` type works)
2. L2 (first real teaching lesson — proves the hybrid model)
3. L13 (connected bridge — hardest teaching moment)
4. L14 (chain-break — validates 4B variant)
5. L17 (sukun with connected bridge — validates 2B)
6. L18 (checkpoint — validates exit gate pattern)
7. Fill remaining: L3, L4, L5, L6, L7, L8, L9, L10, L11, L12, L15, L16

## Constraints

- No changes to business logic (engine algorithms, mastery, scoring, analytics)
- Existing exercise components (tap, hear, choose, build, read, fix, check) remain in use, but generators may be refined to respect known-inventory constraints and hybrid lesson sequencing
- Hand-authored items use the same ExerciseItem type that generators produce
- Present items are not scored and do not affect mastery
- All distractors come from known inventory only — no unseen entities
- Connected rendering uses existing Amiri font auto-joining (no new font work)
- Audio assets: letters have bundled audio. Combos/chunks use derived audio keys. Missing audio falls back to Arabic display (existing behavior).

## Item Count Summary

| Lesson | Template | Hand-authored | Generated | Total |
|--------|----------|:------------:|:---------:|:-----:|
| L1 | 0A | 4 | 0 | 4-5 |
| L2 | 1A | 6 | 3 | 8-9 |
| L3 | 1A | 5 | 3-4 | 8-9 |
| L4 | 1A | 4 | 4 | 8 |
| L5 | 3A | 3 | 5-6 | 8-10 |
| L6 | 1A | 4 | 4 | 8 |
| L7 | 5 | 3 | 7-8 | 10 |
| L8 | 2A | 5 | 5 | 10 |
| L9 | 2A | 5 | 5 | 10 |
| L10 | 3B | 4 | 4-5 | 8-10 |
| L11 | 1B | 3 | 5-6 | 8-9 |
| L12 | 1B | 3 | 5-6 | 8-9 |
| L13 | 4A | 6 | 4-5 | 10-11 |
| L14 | 4B | 6 | 5-6 | 11-12 |
| L15 | 1B | 3 | 5-6 | 8-9 |
| L16 | 1B+4B | 4 | 5-6 | 9-10 |
| L17 | 2B | 6 | 4 | 10 |
| L18 | 5 | 4 | 8-9 | 12 |
| **Total** | | **~78** | **~90** | **~168** |

~47% hand-authored, ~53% generated.
