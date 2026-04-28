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
2. Knowing that **ا** is called Alif and looks like a tall line. **(Visual + name only — no sound is taught for Alif in this lesson.)**
3. Naming the small mark above ب as **fatha**, and recognizing that the mark changes how the letter looks.
4. Reading **بَ** correctly on the final two Read items.

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

#### Screen 2.1 — Meet Alif

- **Type:** Teach
- **Heading:** "Meet Alif"
- **Body:** "This is the letter you saw above. It's called Alif."
- **Visual:** Large ا + speaker button.
- **Audio:** `audio/letter/alif_name.mp3` — auto-plays once on mount; tap speaker to replay.
- **Note:** Constraint 2 — Alif is introduced as a **named visual symbol only**. The body never claims Alif "makes an 'a' sound" or "is a vowel." Just: this letter exists, it is called Alif.

#### Screen 2.2 — Alif's shape

- **Type:** Teach
- **Heading:** "Alif's shape"
- **Body:** "For now, just remember: Alif is a tall line."
- **Visual:** A single isolated ا, large and centered.
- **Audio:** None.
- **Note:** Minimal. No connection-rule foreshadowing (Lesson 14 owns that), no sound teaching for Alif.

#### Screen 2.3 — Remember fatha

- **Type:** Teach
- **Heading:** "Remember this mark?"
- **Body:** "This little mark is called **fatha**. It tells a letter to make an 'a' sound."
- **Visual:** Large بَ with the fatha mark subtly highlighted (gold underline or glow on the mark only).
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play (no auto-play).
- **Note:** Re-teaches fatha as a named concept before any item asks the learner to discriminate the syllable from the letter. This screen is what licenses the ب-vs-بَ contrast that begins in Item 3.4.

#### Screen 2.4 — Today's syllable

- **Type:** Teach (`teach-equation`)
- **Heading:** "Today's syllable"
- **Content lines:**
  - `ب + fatha = بَ`
  - `This has a mark.`
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play (no auto-play).
- **Note:** The equation shows the construction; "This has a mark." is the visual observation. Do NOT include "Ba plus fatha gives the sound 'ba'" or "this says ba" — those name the sound, which is held for the audio items. This screen's job is equation + mark observation, not sound naming.

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

- **Stabilize before discriminate.** The first time the learner is asked to distinguish ب from بَ is Item 3.4 — *after* fatha has been re-taught (Screen 2.3) and the syllable equation has been shown (Screen 2.4). The previous version put a ب-vs-بَ contrast too early; round-5 holds it until the visual concept is established.
- **Mark-first, sound-second.** Items 3.4 and 3.5 are purely visual: find the glyph with the mark. No audio. This anchors the visual distinction at the pixel level before Item 3.6 asks the learner to connect an *audio* "ba" to the marked glyph. The cognitive ramp is: visual mark-ID (3.4) → visual reinforce flipped (3.5) → audio sound mapping (3.6).
- **Locked prompt vocabulary.** Five canonical prompts, each with a clear semantic role. The learner never has to guess whether "Tap Ba" means the letter or the sound — those forms are gone. `Tap the one with the mark.` is visual mark-ID; `Tap what you hear.` is audio-ID; `Tap the letter Ba.` is letter-ID. Three different jobs, three different sentences, no overlap. "Which one says 'ba'?" is removed from the canonical set — it named a sound in text, which conflicted with the mark-recognition pivot.
- **Alif as named visual symbol only.** No item teaches or tests Alif's sound. Alif's role is bounded: see it (warm recall), name it (Screen 2.1 auto-play), recognize it visually (3.2), filter it as a distractor in mastery (4.1). The lesson does not claim Alif "makes an 'a' sound" or "is a vowel" — saving that ambiguity for the phases where it actually matters.
- **Screen 2.4 equation + observation.** "ب + fatha = بَ" states the construction. "This has a mark." names the visual property. The screen does not name the sound — that remains for the audio items to establish.

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
