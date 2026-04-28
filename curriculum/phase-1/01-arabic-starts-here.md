---
id: lesson-01
kind: onboarding
phase: 1
module: "1.1"
title: "Your First Arabic Sound"
outcome: "Learners understand that letters have names, marks give reading sounds, and they can read بَ."
duration_target_seconds: 165
introduced_entities:
  - letter:ba
  - combo:ba+fatha
review_entities: []
pass_criteria:
  threshold: 0
  require_correct_last_two_decoding: false
completion_subtitle: "You just read your first Arabic sound."
completion_glyphs:
  - combo:ba+fatha
---

# Lesson 1 — Your First Arabic Sound

> **Onboarding lesson.** This lesson does not follow standard lesson anatomy.
> No warm-recall, no scored items, no mastery-check. The proof IS the lesson:
> the learner finishes having read بَ, with explicit understanding that
> letters have a NAME and a READING SOUND, and that small marks change the
> sound.

## Goal

The learner understands:

1. Arabic reads right to left.
2. Letters have **names** (what they're called).
3. Marks give **reading sounds** (what you say when you read).
4. They can read one syllable: **بَ**.

## Flow

### Screen 1 — Direction

- **Type:** Teach
- **Visual:** بِسْمِ ٱللّٰهِ with a subtle left-arrow indicating reading direction.
- **Copy:** "Arabic reads from right to left."
- **Behavior:** No audio, no speaker button. Tap "Next" to advance.

### Screen 2 — Meet the letter (NAME)

- **Type:** Teach
- **Visual:** Large ب + speaker button.
- **Copy:** "This letter is called Ba."
- **Audio:** `audio/letter/ba_name.mp3` — auto-plays once on mount; tap speaker to replay.
- **Note:** The asset is the letter's *name* ("Bah", classroom register), longer than the syllable sound.

### Screen 3 — Shape variants

- **Type:** Teach
- **Heading:** "The same letter, different shapes"
- **Body:** "The shape changes in a word. / It's still the same letter."
- **Visual:** ب shown in three positions: isolated (ب), initial (بـ), medial (ـبـ).
- **Audio:** None.
- **Note:** Restored from the original A0 lesson per founder request. Establishes that shape variation across word positions is normal — sets up later lessons where letters appear in connected forms without confusing the learner.

### Screen 4 — Name vs Reading Sound (the core)

- **Type:** Teach
- **Heading:** "Name vs. reading sound"
- **Body:** "Letters have names. / When you read, you say the sound."
- **Visual:** Side-by-side cards.
  - **Left card:** ب glyph, transliteration "Bah", helper text "Its name", HearButton.
  - **Right card:** بَ glyph (in primary green), transliteration "ba", helper text "What you read", HearButton.
- **Audio:** Tap-to-play for each side. No auto-play.
- **Note:** Behavioral framing — the difference between name and reading sound is captured in the helper text ("What it's called" vs "What you read"). This screen is load-bearing.

### Screen 5 — The mark system (preview, narrowed to today)

- **Type:** Teach
- **Heading:** "Marks change the sound"
- **Body:** "These small marks change the sound. / Today, just this one."
- **Visual:** Three options.
  - **بَ** (highlighted, primary border, label "Today: ba", playable HearButton).
  - **بِ** (muted, label "Later", **disabled HearButton** — kasra recording not yet produced).
  - **بُ** (muted, label "Later", **disabled HearButton** — dhamma recording not yet produced).
- **Audio:** Today's sound (بَ) plays via `audio/letter/ba_fatha_sound.mp3`. Tomorrow's (بِ, بُ) intentionally do not play — no fallback to fatha.
- **Note:** The system is shown but scope is narrowed. Authors must NOT silently fall back to fatha audio for kasra/dhamma.

### Screen 6 — Focus (lock the target)

- **Type:** Teach
- **Heading:** "Today's sound"
- **Visual:** Large بَ + speaker button.
- **Body:** "This mark is called fatha. / It gives the letter an "a" sound."
- **Equation (secondary):** "Ba + fatha = ba"
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — auto-plays once on mount; tap speaker to replay.

### Screen 7 — Read (the proof)

- **Type:** Read exercise (unscored)
- **Visual:** Large centered بَ.
- **Initial state:**
  - **Heading:** "Your turn"
  - **Body:** "Say it in your head."
  - **Behavior:** No audio, no Check button visible.
- **After 1500ms:** Check button fades in.
- **On Check tap:** Audio plays, reveal block fades in.
- **Reveal state:**
  - **Heading:** "You read it"
  - **Body:** "That says ba."
- **After audio ends:** Replay button appears, Continue enables.
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — revealed only after Check tap.

## Completion screen

- **Title:** "Lesson 1 complete"
- **Body:** بَ
- **Subtitle:** "You just read your first Arabic sound."
- **Score line:** hidden (lesson is unscored — `itemsTotal === 0`).
- **Tone:** Calm. No confetti.
- **Action:** Continue → returns to home tab.

## Constraints in play

This lesson is the load-bearing demonstration of three locked engineering constraints:

1. **Constraint 1 — Onboarding lesson exception.** Lesson 1 alone uses `kind: "onboarding"`. No other lesson may copy this anatomy without curriculum-team sign-off.
2. **Constraint 2 — Read requires attempt before reveal.** Screen 7 enforces a 1500ms attempt-locked window before Check is tappable.
3. **Constraint 3 — Auto-play permitted only on Teach screens.** Screens 2 and 6 auto-play; screens 1, 3, 4, 5, and 7 never auto-play.

Plus the v3 directive:

4. **No silent audio fallback.** When a mark-preview option's audio isn't recorded yet, its HearButton renders disabled. Never substitute fatha audio for kasra or dhamma.

## Audio recording requirements

| Asset | Role | Status |
|---|---|---|
| `assets/audio/names/ba.wav` | Letter NAME — "Bah" | Exists. Long, classroom register, ~600–800ms. |
| `assets/audio/sounds/ba.wav` | Fatha sound — "ba" | Exists. Short, clipped, ~300–500ms. |
| `assets/audio/sounds/ba_kasra.wav` | Kasra sound — "bi" | **Missing.** Disabled HearButton on Screen 5 until recorded. |
| `assets/audio/sounds/ba_dhamma.wav` | Dhamma sound — "bu" | **Missing.** Disabled HearButton on Screen 5 until recorded. |

Until the missing recordings land, Screen 5 plays only fatha and disables the other two HearButtons. To wire real recordings: add the .wav files to `assets/audio/sounds/`, then update `HARAKAT_SOUND_ASSETS` in `src/audio/player.ts` (commented examples present).

## Out of scope

- Scored Read (deferred to Lesson 2+)
- Speech recognition / pronunciation grading
- Lesson 2 introduction of Alif and other letters
