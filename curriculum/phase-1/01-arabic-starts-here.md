---
id: lesson-01
kind: onboarding
phase: 1
module: "1.1"
title: "Your First Arabic Sound"
outcome: "Learners understand letters have names, marks give sounds, and they can read بَ."
duration_target_seconds: 150
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
> letters have a NAME and a SOUND, and that small marks change the sound.

## Goal

The learner understands:

1. Arabic reads right to left.
2. Letters have **names**.
3. Marks give **sounds**.
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
- **Note:** The asset is the letter's *name* ("baa", classroom register), longer than the syllable sound.

### Screen 3 — The core concept (NAME vs SOUND)

- **Type:** Teach
- **Visual:** Side-by-side: ب → "baa" alongside بَ → "ba".
- **Copy:** "Letters have a name. A small mark changes how they sound."
- **Audio:** Tap-to-play for each — no auto-play.
- **Note:** This is the most important screen in the lesson. The contrast between the two recordings is load-bearing.

### Screen 4 — The mark system (preview, then focus)

- **Type:** Teach
- **Visual:** Three tappable options — بَ (highlighted), بِ, بُ.
- **Copy:** "These small marks change the sound. Today, we'll learn this one."
- **Audio:** Tap each option to hear ba / bi / bu. No auto-play.
- **Note:** Builds the mental model that letters + marks = many sounds, then narrows scope. Do not over-explain.

### Screen 5 — Focus (lock the target)

- **Type:** Teach
- **Visual:** Large بَ + speaker button.
- **Copy:** "This is ba."
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — auto-plays once on mount; tap speaker to replay.

### Screen 6 — Read (the proof)

- **Type:** Read exercise (unscored)
- **Visual:** Large centered بَ. Prompt + delayed Check button.
- **Behavior:**
  - On mount: glyph + prompt only. **No audio plays.** Check button is NOT yet rendered.
  - After 1500ms (`READ_ATTEMPT_DELAY_MS`): Check button fades in.
  - Learner taps Check: model audio plays, "That's ba." reveal copy fades in.
  - Audio ends: Replay button appears, Continue enables.
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
2. **Constraint 2 — Read requires attempt before reveal.** Screen 6 enforces a 1500ms attempt-locked window before Check is tappable.
3. **Constraint 3 — Auto-play permitted only on Teach screens.** Screens 2 and 5 auto-play; screens 1, 3, 4, and 6 never auto-play.

## Audio recording requirements

| Asset | Role | Notes |
|---|---|---|
| `assets/audio/names/ba.wav` | Letter NAME — "baa" | Long, classroom register, ~600–800ms. |
| `assets/audio/sounds/ba.wav` | Fatha sound — "ba" | Short, clipped, ~300–500ms. Distinct from the name on a phone speaker. |
| `assets/audio/sounds/ba_kasra.wav` | Kasra sound — "bi" | NEW — same recording session, same voice, same register as ba (sound). |
| `assets/audio/sounds/ba_dhamma.wav` | Dhamma sound — "bu" | NEW — same. |

Until ba_kasra.wav and ba_dhamma.wav are recorded, the audio router falls back to playing the fatha sound for those paths. Lesson 1 plays end-to-end on the existing assets, but Screen 4's three-option contrast is muted (all three play the same "ba" sound) until real recordings land.

## Out of scope

- Scored Read (deferred to Lesson 2+)
- Speech recognition / pronunciation grading
- Lesson 2 introduction of Alif and other letters
