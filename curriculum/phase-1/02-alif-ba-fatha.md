---
id: lesson-02
kind: standard
phase: 1
module: "1.1"
title: "Alif + Ba + Fatha = بَ"
outcome: "Read بَ — your first Arabic syllable. Meet Alif along the way."
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

> **First scored lesson.** Lesson 1 was the orientation that named the letter Ba and showed the syllable بَ. Lesson 2 is the first time the learner is *measured* — and the first time the system insists on a clean separation between letter, name, and sound.

## Goal

The learner finishes this lesson:

1. Recognizing **ب** reliably from a 2-letter set.
2. Reading **بَ** as "ba" on the very first teach screen — the emotional reading win arrives before any other teaching.
3. Knowing that **ا** is called Alif and looks like a tall line. **(Visual + name only — no sound is taught for Alif in this lesson.)**
4. Naming the small mark above ب as **fatha**, and recognizing that the mark changes how the letter looks.
5. Reading **بَ** correctly on the final two Read items.

## Prompt language system (locked for this lesson)

Every Tap / Hear / Choose item in this lesson uses **exactly one** of these prompt patterns. No invented phrasing.

| Prompt | Use |
|---|---|
| `Tap the letter Ba.` | Letter identification for ب (must distinguish from the syllable بَ) |
| `Tap the letter Alif.` | Letter identification for ا (no sound disambiguation needed) |
| `Tap the letter you hear.` | Audio is a letter *name* (Bah, Alif), learner picks the matching glyph |
| `Tap what you hear.` | Audio is a *sound* (ba), learner picks the matching glyph from a set that includes the syllable |
| `Tap the one with the mark.` | Visual mark recognition — learner picks the glyph that has the fatha mark |

If both **ب** and **بَ** appear as options on the same screen, the prompt MUST be one of the two sound/mark-distinguishing forms (`Tap what you hear.` or `Tap the one with the mark.`) — never the letter-form.

## Flow

### Part 1 — Warm Recall (~30s, 3 items)

The job here is **only** to confirm that ب recognition from Lesson 1 stuck. Alif appears as the silent distractor in all three items so the eye is exposed to it once before the teach phase formally names it. The syllable بَ does **not** appear in warm recall — that contrast is held until *after* fatha has been re-taught in Part 2.

#### Item 1.1 — Tap

- **Type:** Tap exercise (scored, retry: until-correct)
- **Prompt:** `Tap the letter Ba.`
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Note:** Correct ب is on the right.

#### Item 1.2 — Hear

- **Type:** Hear exercise (scored, retry: until-correct)
- **Prompt:** `Tap the letter you hear.`
- **Audio:** `audio/letter/ba_name.mp3` (Bah — letter name)
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Note:** Correct ب is on the right.

#### Item 1.3 — Tap

- **Type:** Tap exercise (scored, retry: until-correct)
- **Prompt:** `Tap the letter Ba.`
- **Target:** `letter:ba`
- **Options:** [ب ✓, ا]
- **Note:** Correct ب is on the left (positions flipped from 1.1 and 1.2). Three exposures to ا without naming. The teach phase pays this off on Screen 2.1.

### Part 2 — Teach (~80s, 4 screens)

Round-6 first-reading-win pivot. Screen 2.1 IS the reading moment — the learner sees بَ and hears "ba" before any other teaching. Fatha is named on 2.2 (after the win). The letter/syllable equation arrives on 2.3, where naming the sound is now licensed because the win already happened. Alif is demoted to one light screen (2.4) — named visual symbol only, no sound, no اَ, no vowel claim.

#### Screen 2.1 — Your first sound (`teach-first-ba`)

- **Type:** Teach
- **Heading:** "Your first sound"
- **Visual:** Large بَ.
- **Body:** "This says ba."
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — auto-plays once on mount (Constraint 3); tap speaker to replay.
- **Note:** The very first teach screen IS the emotional reading win. Auto-play is permitted because this is a Teach screen, not a Read or Check.

#### Screen 2.2 — The mark adds a (`teach-fatha-mark`)

- **Type:** Teach
- **Heading:** "The mark adds a"
- **Visual:** Large بَ.
- **Body:** "The small line above Ba is called fatha." / "It adds the a sound."
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play (no auto-play).
- **Note:** Names the mark only after the learner has already heard and read ba.

#### Screen 2.3 — Ba becomes ba (`teach-letter-vs-syllable`)

- **Type:** Teach
- **Heading:** "Ba becomes ba"
- **Content lines:**
  - `ب + fatha = بَ`
  - `ب is the letter. بَ is the sound ba.`
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play (no auto-play).
- **Note:** Naming the sound here is allowed because the first reading win already happened on Screen 2.1. The screen explicitly separates plain Ba from Ba with fatha.

#### Screen 2.4 — Meet Alif (`teach-meet-alif-light`)

- **Type:** Teach
- **Heading:** "Meet Alif"
- **Visual:** Large ا.
- **Body:** "This is Alif." / "For now, just remember: it looks like a tall line."
- **Audio:** `audio/letter/alif_name.mp3` — tap-to-play (no auto-play).
- **Note:** Alif gets only one light screen. No claim that Alif "makes" a sound. No claim Alif is a vowel. Do NOT teach اَ. Do NOT add an Alif sound item.

### Part 3 — Practice (~120s, 6 items)

The practice ramp is a deliberate staircase:
- Recognize letters (Tap) → hear letter name (Hear) →
- Visual mark-ID (Choose, no audio) → visual reinforce flipped (Choose, no audio) →
- Audio sound mapping (Choose, audio mode).

All scored, until-correct. Mark-recognition items (3.4, 3.5) establish the visual contrast before the audio mapping (3.6) tests the decoding step. Alif is held back as a distractor until mastery (4.1).

#### Item 3.1 — Tap (recognize Ba)

- **Type:** Tap (scored, retry: until-correct)
- **Prompt:** `Tap the letter Ba.`
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Cognitive load:** Low. Visual recognition only.

#### Item 3.2 — Tap (recognize Alif)

- **Type:** Tap (scored, retry: until-correct)
- **Prompt:** `Tap the letter Alif.`
- **Target:** `letter:alif`
- **Options:** [ب, ا ✓]
- **Cognitive load:** Low. Visual recognition of the just-introduced letter.

#### Item 3.3 — Hear (audio recognition for Ba)

- **Type:** Hear (scored, retry: until-correct)
- **Prompt:** `Tap the letter you hear.`
- **Audio:** `audio/letter/ba_name.mp3` (Bah — letter name)
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Cognitive load:** Low–medium. Audio → letter mapping for ب only. (Alif has no audio practice item — its audio was auto-played in Screen 2.1, and Constraint 2 keeps Alif's role to "named visual symbol.")

#### Item 3.4 — Choose (VISUAL MODE: mark recognition)

- **Type:** Choose (scored, retry: until-correct)
- **Prompt:** `Tap the one with the mark.`
- **Audio prompt:** *(none)*
- **Target:** `combo:ba+fatha`
- **Options:** [ب, بَ ✓]
- **Cognitive load:** Low–medium. Visual mark-ID only. Learner looks for the glyph that has the fatha mark above it. No audio competes for attention. Two options — Alif held back for mastery.

#### Item 3.5 — Choose (VISUAL REINFORCE: mark recognition, positions flipped)

- **Type:** Choose (scored, retry: until-correct)
- **Prompt:** `Tap the one with the mark.`
- **Audio prompt:** *(none)*
- **Target:** `combo:ba+fatha`
- **Options:** [بَ ✓, ب]
- **Cognitive load:** Low–medium. Same visual mark-ID task as 3.4 with **option positions flipped** — correct syllable is now on the left. Breaks positional muscle memory from 3.4.

#### Item 3.6 — Choose (AUDIO MODE: map sound → symbol)

- **Type:** Choose (scored, retry: until-correct)
- **Prompt:** `Tap what you hear.`
- **Audio prompt:** `audio/letter/ba_fatha_sound.mp3`
- **Target:** `combo:ba+fatha`
- **Options:** [ب, بَ ✓]
- **Cognitive load:** Medium. After the two visual-only mark items (3.4–3.5) have anchored the ب-vs-بَ contrast, the learner hears "ba" and maps it to the marked glyph. Audio-driven decoding step, 2 options only.

### Part 4 — Mastery Check (~40s, 3 items)

The lesson's actual measurement. Items are **one-shot** — no retries. Per master curriculum §10, the last two scored items are **Reads**, and both must be correct for the decoding rule to pass even if the rest of the lesson is otherwise above the 85% threshold.

#### Item 4.1 — Choose (3-option discrimination)

- **Type:** Choose (scored, **one-shot**)
- **Prompt:** `Tap what you hear.`
- **Audio prompt:** `audio/letter/ba_fatha_sound.mp3`
- **Target:** `combo:ba+fatha`
- **Options:** [ب, بَ ✓, ا]
- **Note:** **First and only 3-option item of the lesson.** Alif rejoins the option set for the harder discrimination. After 3.4–3.6 anchored the 2-option mark/sound contrast, the learner is ready to filter alif as visual noise. One-shot mode makes it feel consequential. Order: `letter:ba` first, `combo:ba+fatha` (correct) second, `letter:alif` third.

#### Item 4.2 — Read (decoding)

- **Type:** Read (scored, **one-shot**, decoding)
- **Prompt:** "Read this aloud."
- **Target:** `combo:ba+fatha`
- **Display:** بَ (large, centered)
- **AudioModel:** `audio/letter/ba_fatha_sound.mp3`
- **PromptHeading:** "Your turn"
- **RevealHeading:** "You read it"
- **RevealCopy:** "That says ba."
- **Note:** Per Constraint 2 of the rendering layer (no auto-play on Read), the learner says it in their head, taps Check after the lock window, audio reveals.

#### Item 4.3 — Read (decoding)

- **Type:** Read (scored, **one-shot**, decoding)
- **Prompt:** "Say it again."
- **Target:** `combo:ba+fatha`
- **Display:** بَ
- **AudioModel:** `audio/letter/ba_fatha_sound.mp3`
- **PromptHeading:** "Your turn"
- **RevealHeading:** "You read it"
- **RevealCopy:** "That says ba."
- **Note:** Same syllable, second pass. The prompt humanizes the rhythm.

## Completion screen

- **Title:** "Lesson 2 complete"
- **Glyphs preview:** ا · ب · بَ
- **Subtitle:** "You read it on your own."
- **Score line:** Visible — `itemsCorrect / itemsTotal` and percent. (12 scored items: 3 warm + 6 practice + 3 mastery. Standard scored lesson, unlike L1.)
- **Tone:** Calm. No confetti.
- **Action:** Continue → returns to home tab.

## Why this version is better pedagogically (round-5 mark-recognition pivot)

- **First reading win first.** The very first teach screen (2.1) shows بَ and auto-plays "ba". The learner reads it before they meet fatha by name (2.2), before they see the equation (2.3), and before Alif is named at all (2.4). The previous version put four Alif-heavy screens before the syllable; round-6 fixes that ordering.
- **Mark-first, sound-second.** Items 3.4 and 3.5 are purely visual: find the glyph with the mark. No audio. This anchors the visual distinction at the pixel level before Item 3.6 asks the learner to connect an *audio* "ba" to the marked glyph. The cognitive ramp is: visual mark-ID (3.4) → visual reinforce flipped (3.5) → audio sound mapping (3.6).
- **Locked prompt vocabulary.** Five canonical prompts, each with a clear semantic role. The learner never has to guess whether "Tap Ba" means the letter or the sound — those forms are gone. `Tap the one with the mark.` is visual mark-ID; `Tap what you hear.` is audio-ID; `Tap the letter Ba.` is letter-ID. Three different jobs, three different sentences, no overlap. "Which one says 'ba'?" is removed from the canonical set — it named a sound in text, which conflicted with the mark-recognition pivot.
- **Alif as named visual symbol only.** No item teaches or tests Alif's sound. Alif's role is bounded: see it (warm recall), name it (Screen 2.1 auto-play), recognize it visually (3.2), filter it as a distractor in mastery (4.1). The lesson does not claim Alif "makes an 'a' sound" or "is a vowel" — saving that ambiguity for the phases where it actually matters.

## Constraints in play

1. **Lesson kind:** `standard`. First scored lesson; threshold 0.85; decoding rule active.
2. **Constraint 2 (rendering layer)** — Read items 4.2 and 4.3 enforce attempt-locked-before-reveal. No auto-play of `audioModel`.
3. **Constraint 3 (rendering layer)** — Auto-play permitted only on Teach screens. Only Screen 2.1 (Meet Alif) auto-plays.
4. **No silent audio fallback.** Any clip referenced must render the matching HearButton enabled, or the button stays disabled — never substitute another sound.
5. **Curriculum constraint — no Alif sound teaching.** Alif's role in this lesson is named visual symbol only (Constraint 2 of the curriculum-design layer).
6. **Curriculum constraint — locked prompt language.** Only the five canonical Tap/Hear/Choose prompts above.
7. **Curriculum constraint — no premature ب-vs-بَ contrast.** That discrimination first appears at Item 3.4, after Screen 2.3 has re-taught fatha.

## Audio recording requirements

| Asset | Logical path | Role | Status |
|---|---|---|---|
| `assets/audio/names/alif.wav` | `audio/letter/alif_name.mp3` | Letter NAME — "Aleef" / "Alif" | Exists. Routed in `PATH_TO_PLAYER`. |
| `assets/audio/names/ba.wav` | `audio/letter/ba_name.mp3` | Letter NAME — "Bah" | Exists. Routed. |
| `assets/audio/sounds/ba.wav` | `audio/letter/ba_fatha_sound.mp3` | Fatha sound — "ba" | Exists. Routed. |

**Zero new ElevenLabs recordings required for L2.**

## Out of scope

- Reading اَ (alif + fatha as a syllable) — Constraint 2 keeps Alif's role to named visual symbol only. The "alif as long-vowel placeholder" role enters in Phase 4.
- Connected forms — both letters stay in isolated form. Lesson 13 owns connection.
- Additional letters — meem (م) waits for Lesson 3.
- Alif sound discrimination — by design, not in this lesson.
