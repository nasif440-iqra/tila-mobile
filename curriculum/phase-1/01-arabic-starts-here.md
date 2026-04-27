---
id: lesson-01
kind: onboarding
phase: 1
module: "1.1"
title: "Arabic Starts Here"
outcome: "Read your first Arabic syllable: بَ."
duration_target_seconds: 150
introduced_entities:
  - letter:ba
  - combo:ba+fatha
review_entities: []
pass_criteria:
  threshold: 0
  require_correct_last_two_decoding: false
completion_subtitle: "You just read your first Arabic syllable: بَ"
completion_glyphs:
  - combo:ba+fatha
---

# Lesson 1 — Arabic Starts Here

> **Onboarding lesson.** This lesson does not follow standard lesson anatomy.
> No warm-recall, no scored items, no mastery-check. The proof IS the lesson:
> the learner finishes having read بَ. See SPEC Constraint 1 for the system
> boundary; this exception is reserved for the first-session experience.

## Outcome

By the end of this lesson, the learner has:

1. Seen that Arabic reads right to left.
2. Met the letter Ba (ب) by name.
3. Seen how a small mark turns the letter into a sound.
4. Read their first Arabic syllable: بَ.

## Flow

### Screen 1 — Teach: Right-to-left orientation

- **Body:** "Arabic reads right to left. Every word starts on the right."
- **Visual:** the word بِسْمِ with a soft left-pointing arrow indicating reading direction
- **Audio:** `audio/lesson_01/rtl_intro.mp3` — tap to play, no auto-play

### Screen 2 — Teach: This letter is Ba

- **Body:** "This letter is Ba."
- **Visual:** ب — large, primary color
- **Audio:** `audio/letter/ba_name.mp3` — auto-plays once on mount; tap to replay
- **Note:** The asset is the letter's *name* ("Bah", classroom register), not the syllable sound.

### Screen 3 — Practice (unscored Hear): replay Ba's name

- **Prompt:** "Tap to hear it again."
- **Visual:** ب
- **Audio:** `audio/letter/ba_name.mp3` — tap to play
- **Continue:** always enabled

### Screen 4 — Teach: a small mark turns it into a sound

- **Body:** "A small mark turns it into a sound you can read."
- **Visual:** ب → بَ shown side-by-side with a soft arrow
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — auto-plays once on mount; tap to replay
- **Note:** The asset is the *syllable sound* ("ba", short and crisp), distinct from the letter name on screens 2–3. See SPEC §"Audio assets" for recording direction.

### Screen 5 — Practice (unscored Hear): replay the syllable

- **Prompt:** "Tap to hear it again."
- **Visual:** بَ
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap to play
- **Continue:** always enabled

### Screen 6 — Read (unscored, the proof): try saying بَ

- **Prompt:** "Try saying it first."
- **Visual:** بَ
- **Behavior:**
  - On mount: glyph + prompt only. **No audio plays.** Check button is NOT yet rendered.
  - After 1500ms (`READ_ATTEMPT_DELAY_MS`): Check button fades in.
  - Learner taps Check: model audio plays, "That's ba." reveal copy fades in.
  - Audio ends: Replay button appears, Continue enables.
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — revealed only after Check tap

## Completion screen

- **Title:** "Lesson 1 complete"
- **Subtitle:** "You just read your first Arabic syllable: بَ"
- **Glyph preview:** بَ
- **Score line:** hidden (lesson is unscored — `itemsTotal === 0`)
- **Action:** Continue → returns to home tab

## Constraints in play

This lesson is the load-bearing demonstration of three locked constraints:

1. **Constraint 1 — Onboarding lesson exception.** Lesson 1 alone uses `kind: "onboarding"`. No other lesson may copy this anatomy without curriculum-team sign-off.

2. **Constraint 2 — Read requires attempt before reveal.** Screen 6 enforces a 1500ms attempt-locked window before Check is tappable, structurally preventing the learner from skipping the attempt. Continue gates on audio playback completion.

3. **Constraint 3 — Auto-play permitted only on Teach screens.** Screens 2 and 4 (Teach) auto-play; screens 1, 3, 5, and 6 never auto-play.

## Out of scope

- Scored Read (deferred to Lesson 2+)
- Speech recognition / pronunciation grading
- Lesson 2 introduction of Alif and other letters
