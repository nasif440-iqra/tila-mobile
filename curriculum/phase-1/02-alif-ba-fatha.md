---
id: lesson-02
kind: standard
phase: 1
module: "1.1"
title: "Alif + Ba + Fatha = بَ"
outcome: "Read بَ — your first scored Arabic syllable. Meet Alif along the way."
duration_target_seconds: 240
introduced_entities:
  - letter:alif
  - letter:ba
  - mark:fatha
  - combo:ba+fatha
review_entities: []
pass_criteria:
  threshold: 0.85
  require_correct_last_two_decoding: true
completion_subtitle: "You read it on your own."
completion_glyphs:
  - letter:alif
  - letter:ba
  - combo:ba+fatha
---

# Lesson 2 — Alif + Ba + Fatha = بَ

> **First scored lesson.** Lesson 1 was the orientation that named the letter Ba and showed the syllable بَ. Lesson 2 is the first time the learner is *measured*: can they recognize Ba on their own, can they meet Alif cleanly, and can they read بَ unprompted on the last two items?

## Goal

The learner finishes this lesson:

1. Confident that they recognize **ب** without help.
2. Knowing that **ا** is called Alif and looks like a tall single line.
3. Naming the small mark above ب as **fatha**.
4. Reading **بَ** correctly on two unseen Read items at the end.

## Flow

### Part 1 — Warm Recall (~30s, 3 items)

The learner just met ب in Lesson 1. The job here is to confirm that recognition stuck before adding anything new. Alif appears as the silent distractor in two of three items so the eye is exposed to it once before the teach phase formally names it.

#### Item 1.1 — Tap

- **Type:** Tap exercise (scored, retry: until-correct)
- **Prompt:** "Tap Ba."
- **Target:** `letter:ba`
- **Options:** [ب ✓, ا]
- **Note:** First time the learner sees ا on screen. No naming yet — it's just "the other one."

#### Item 1.2 — Hear

- **Type:** Hear exercise (scored, retry: until-correct)
- **Prompt:** "Tap the letter you hear."
- **Audio:** `audio/letter/ba_name.mp3` (Bah — letter name)
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Note:** Order flipped from Item 1.1 to discourage muscle-memory tapping.

#### Item 1.3 — Tap

- **Type:** Tap exercise (scored, retry: until-correct)
- **Prompt:** "Tap Ba."
- **Target:** `letter:ba`
- **Options:** [ب ✓, ا]
- **Note:** Final recall. After three exposures, the learner has seen ا three times without being told what it is. The teach phase pays this off.

### Part 2 — Teach (~80s, 4 screens)

#### Screen 2.1 — Meet Alif

- **Type:** Teach
- **Heading:** "Meet Alif"
- **Body:** "This is the letter you saw above. It's called Alif."
- **Visual:** Large ا + speaker button.
- **Audio:** `audio/letter/alif_name.mp3` — auto-plays once on mount; tap speaker to replay.
- **Note:** Constraint 3 (auto-play permitted only on Teach) — this is a Teach screen, so auto-play is allowed. The asset is alif's *name* ("Aleef" or "Alif" register), classroom-clear, ~600–800ms.

#### Screen 2.2 — Alif's shape

- **Type:** Teach
- **Heading:** "Alif's shape"
- **Body:** "Alif looks like a tall line. / It mostly stands alone — letters after it don't usually connect."
- **Visual:** Two glyphs side by side, both ا. Label the first "Alone" (isolated ا), label the second "After another letter" (final ـا).
- **Audio:** None.
- **Note:** Alif's two-shape simplicity is itself a reassurance after L1's three-shape ب. The "doesn't connect after it" rule is *foreshadowed*, not drilled — drilled in Lesson 14 ("Alif Breaks the Chain").

#### Screen 2.3 — Recognize fatha

- **Type:** Teach
- **Heading:** "Remember this mark?"
- **Body:** "This little mark is called **fatha**. / It tells a letter to make an 'a' sound."
- **Visual:** Large بَ with the fatha mark subtly highlighted (gold underline or glow on the mark only).
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play (no auto-play; Constraint 3 allows but L1 already auto-played this on its Screen 6, so we don't repeat).
- **Note:** L1 named fatha on its Screen 6. This screen formalizes it as a teaching anchor before the practice phase tests it.

#### Screen 2.4 — Put it together

- **Type:** Teach
- **Heading:** "Today's syllable"
- **Body:** "ب + fatha = بَ"
- **Equation (secondary):** "Ba plus fatha gives the sound 'ba'."
- **Visual:** Equation row: ب + (fatha glyph) → بَ. The arrow animates briefly on render (or stays static if Reduce Motion).
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play.
- **Note:** This is the bridge into Practice. After this screen, the learner has been told everything they need.

### Part 3 — Practice (~110s, 5 items)

The mix moves from pure visual recognition (Tap) to audio-driven recognition (Hear) to syllable discrimination (Choose). Every item is scored. Until-correct mode throughout — the learner gets to try again on a wrong tap.

#### Item 3.1 — Tap

- **Type:** Tap (scored, until-correct)
- **Prompt:** "Tap Alif."
- **Target:** `letter:alif`
- **Options:** [ا ✓, ب]
- **Note:** First scored test of alif recognition.

#### Item 3.2 — Hear

- **Type:** Hear (scored, until-correct)
- **Prompt:** "Tap the letter you hear."
- **Audio:** `audio/letter/alif_name.mp3`
- **Target:** `letter:alif`
- **Options:** [ب, ا ✓]

#### Item 3.3 — Hear

- **Type:** Hear (scored, until-correct)
- **Prompt:** "Tap the letter you hear."
- **Audio:** `audio/letter/ba_name.mp3`
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Note:** Reinforces ب recognition by ear, now interleaved with alif's name.

#### Item 3.4 — Choose

- **Type:** Choose (scored, until-correct) — this is the lesson's first Choose exercise
- **Prompt:** "Tap what you hear."
- **Audio:** `audio/letter/ba_fatha_sound.mp3`
- **Target:** `combo:ba+fatha`
- **Options:** [بَ ✓, ب, ا]
- **Note:** Discriminating the *syllable* from the *bare letter* is the core skill of this lesson. The audio is "ba" (short, fatha sound), and the correct option is the only one with the fatha mark.

#### Item 3.5 — Choose

- **Type:** Choose (scored, until-correct)
- **Prompt:** "Which one says 'ba'?"
- **Target:** `combo:ba+fatha`
- **Options:** [بَ ✓, ب]
- **Note:** No audio prompt — visual-only discrimination. Tests whether the learner can pick the syllable from the bare letter without leaning on audio cues.

### Part 4 — Mastery Check (~40s, 3 items)

The final three items are the lesson's actual measurement. Per master curriculum §10, the **last two scored items are Reads**, and both must be correct for the decoding rule to pass — even if the rest of the lesson is otherwise above the 85% threshold.

#### Item 4.1 — Choose

- **Type:** Choose (scored, one-shot — this is the mastery check, no retry)
- **Prompt:** "Tap what you hear."
- **Audio:** `audio/letter/ba_fatha_sound.mp3`
- **Target:** `combo:ba+fatha`
- **Options:** [ا, بَ ✓, ب]
- **Note:** Reordered options vs Item 3.4 ("unseen" position-wise). One-shot to make this feel different from Practice.

#### Item 4.2 — Read

- **Type:** Read (scored, decoding)
- **Prompt:** "Read this aloud."
- **Target:** `combo:ba+fatha`
- **Display:** بَ (large, centered)
- **AudioModel:** `audio/letter/ba_fatha_sound.mp3`
- **Note:** Per Constraint 2, no auto-play. Learner says it in their head, taps Check after the lock window, audio reveals.

#### Item 4.3 — Read

- **Type:** Read (scored, decoding)
- **Prompt:** "One more time."
- **Target:** `combo:ba+fatha`
- **Display:** بَ
- **AudioModel:** `audio/letter/ba_fatha_sound.mp3`
- **Note:** Same syllable, second pass. The repetition is intentional — by the third time the learner has read بَ unprompted, the syllable is theirs.

## Completion screen

- **Title:** "Lesson 2 complete"
- **Glyphs preview:** ا · ب · بَ
- **Subtitle:** "You read it on your own."
- **Score line:** Visible — `itemsCorrect / itemsTotal` and percent. (Standard scored lesson, unlike L1.)
- **Tone:** Calm, slightly warmer than L1's completion. The learner just earned their first score. No confetti.
- **Action:** Continue → returns to home tab.

## Constraints in play

1. **Constraint 1** — `kind: "standard"`. L2 is the first lesson to use the standard anatomy (warm recall + teach + practice + mastery check, scored, decoding rule active).
2. **Constraint 2** — Read items (4.2, 4.3) enforce the attempt-locked-before-reveal window from L1. No auto-play of `audioModel`.
3. **Constraint 3** — Auto-play permitted only on Teach screens. Screen 2.1 (Meet Alif) auto-plays the alif name. Screens 2.3 and 2.4 do not auto-play (per the "tap-to-play after the first hear" pattern from L1).
4. **No silent audio fallback** — Any clip referenced here that isn't yet routed in `PATH_TO_PLAYER` must render as a disabled HearButton, never substitute another sound.

## Audio recording requirements

| Asset | Logical path | Role | Status |
|---|---|---|---|
| `assets/audio/names/alif.wav` | `audio/letter/alif_name.mp3` | Letter NAME — "Aleef" / "Alif" | **Exists** (restored from HEAD pre-Wave-1). Routing entry needed in `PATH_TO_PLAYER`. |
| `assets/audio/names/ba.wav` | `audio/letter/ba_name.mp3` | Letter NAME — "Bah" | Exists. Routed. |
| `assets/audio/sounds/ba.wav` | `audio/letter/ba_fatha_sound.mp3` | Fatha sound — "ba" | Exists. Routed. |

**Zero new ElevenLabs recordings required for L2.** Task 13 (hand-compile) will register the alif_name routing in `PATH_TO_PLAYER`. Task 15 audio request batch is a no-op — confirmed during authoring.

## Out of scope

- Reading اَ (alif + fatha as a syllable) — L2 introduces alif as a letter, not as a readable syllable. The "alif as long-vowel placeholder" role enters in Phase 4.
- Connected forms — L2 keeps both letters in isolated form. Connected forms are Lesson 13's job.
- Additional letters — meem (م) waits for Lesson 3.
- Habit / streak surfacing in completion — not in Wave 1 scope.
