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
3. Naming the small mark above ب as **fatha**, and knowing fatha tells a letter to make an "a" sound.
4. Reading **بَ** correctly on the final two Read items.

## Prompt language system (locked for this lesson)

Every Tap / Hear / Choose item in this lesson uses **exactly one** of these prompt patterns. No invented phrasing.

| Prompt | Use |
|---|---|
| `Tap the letter Ba` | Letter identification for ب (must distinguish from the syllable بَ) |
| `Tap Alif` | Letter identification for ا (no sound disambiguation needed) |
| `Tap the letter you hear` | Audio is a letter *name* (Bah, Alif), learner picks the matching glyph |
| `Tap what you hear` | Audio is a *sound* (ba), learner picks the matching glyph from a set that includes the syllable |
| `Which one says 'ba'?` | Sound identification, with or without audio |

If both **ب** and **بَ** appear as options on the same screen, the prompt MUST be one of the two sound-naming forms (`Tap what you hear` or `Which one says 'ba'?`) — never the letter-form.

## Flow

### Part 1 — Warm Recall (~30s, 3 items)

The job here is **only** to confirm that ب recognition from Lesson 1 stuck. Alif appears as the silent distractor in all three items so the eye is exposed to it once before the teach phase formally names it. The syllable بَ does **not** appear in warm recall — that contrast is held until *after* fatha has been re-taught in Part 2.

#### Item 1.1 — Tap

- **Type:** Tap exercise (scored, retry: until-correct)
- **Prompt:** `Tap the letter Ba`
- **Target:** `letter:ba`
- **Options:** [ب ✓, ا]

#### Item 1.2 — Hear

- **Type:** Hear exercise (scored, retry: until-correct)
- **Prompt:** `Tap the letter you hear`
- **Audio:** `audio/letter/ba_name.mp3` (Bah — letter name)
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]

#### Item 1.3 — Tap

- **Type:** Tap exercise (scored, retry: until-correct)
- **Prompt:** `Tap the letter Ba`
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Note:** Same prompt as 1.1 but option positions are flipped. Three exposures to ا without naming. The teach phase pays this off on Screen 2.1.

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

- **Type:** Teach
- **Heading:** "Today's syllable"
- **Body:** "ب + fatha = بَ"
- **Equation (secondary):** "Ba plus fatha gives the sound 'ba'."
- **Visual:** Equation row: ب + (fatha glyph) → بَ.
- **Audio:** `audio/letter/ba_fatha_sound.mp3` — tap-to-play.
- **Note:** This is the bridge into Practice. After this screen, every claim the lesson tests has been stated on screen.

### Part 3 — Practice (~120s, 6 items)

The practice ramp is a deliberate staircase. Recognize letters → hear letter name → bridge sound to syllable (text + audio name the target) → infer sound to syllable (audio only) → visual-only recognition. The 3-option discrimination is held back for mastery.

#### Item 3.1 — Tap (recognize Ba)

- **Type:** Tap (scored, retry: until-correct)
- **Prompt:** `Tap the letter Ba`
- **Target:** `letter:ba`
- **Options:** [ب ✓, ا]
- **Cognitive load:** Low. Visual recognition only.

#### Item 3.2 — Tap (recognize Alif)

- **Type:** Tap (scored, retry: until-correct)
- **Prompt:** `Tap Alif`
- **Target:** `letter:alif`
- **Options:** [ا ✓, ب]
- **Cognitive load:** Low. Visual recognition of the just-introduced letter.

#### Item 3.3 — Hear (audio recognition for Ba)

- **Type:** Hear (scored, retry: until-correct)
- **Prompt:** `Tap the letter you hear`
- **Audio:** `audio/letter/ba_name.mp3` (Bah — letter name)
- **Target:** `letter:ba`
- **Options:** [ا, ب ✓]
- **Cognitive load:** Low–medium. Audio → letter mapping for ب only. (Alif has no audio practice item — its audio was auto-played in Screen 2.1, and Constraint 2 keeps Alif's role to "named visual symbol.")

#### Item 3.4 — Choose (AUDIO MODE: map sound → symbol)

- **Type:** Choose (scored, retry: until-correct)
- **Prompt:** `Tap what you hear`
- **Audio prompt:** `audio/letter/ba_fatha_sound.mp3`
- **Target:** `combo:ba+fatha`
- **Options:** [بَ ✓, ب]
- **Cognitive load:** Medium-low. **Single instruction mode — auditory only.** The learner hears "ba" and picks the matching glyph. Text and audio do not compete for attention. Two options only — alif is held back for mastery.

#### Item 3.5 — Choose (VISUAL MODE: map text → sound)

- **Type:** Choose (scored, retry: until-correct)
- **Prompt:** `Which one says 'ba'?`
- **Audio prompt:** *(none)*
- **Target:** `combo:ba+fatha`
- **Options:** [بَ ✓, ب]
- **Cognitive load:** Medium. **Single instruction mode — visual only.** The text names the target sound; no audio competes. Same 2-option contrast as 3.4 but tested through reading the prompt rather than hearing it.

#### Item 3.6 — Choose (VISUAL MODE: reinforce)

- **Type:** Choose (scored, retry: until-correct)
- **Prompt:** `Which one says 'ba'?`
- **Audio prompt:** *(none)*
- **Target:** `combo:ba+fatha`
- **Options:** [ب, بَ ✓]
- **Cognitive load:** Medium. Same task as 3.5 (visual sound-ID, no audio) with **option positions flipped** — the correct syllable is on the right rather than the left. Reinforces the visual-only mapping while breaking any positional muscle memory from 3.5. Confidence anchor before mastery's harder 3-option discrimination.

### Part 4 — Mastery Check (~40s, 3 items)

The lesson's actual measurement. Items are **one-shot** — no retries. Per master curriculum §10, the last two scored items are **Reads**, and both must be correct for the decoding rule to pass even if the rest of the lesson is otherwise above the 85% threshold.

#### Item 4.1 — Choose (3-option discrimination)

- **Type:** Choose (scored, **one-shot**)
- **Prompt:** `Tap what you hear`
- **Audio prompt:** `audio/letter/ba_fatha_sound.mp3`
- **Target:** `combo:ba+fatha`
- **Options:** [ا, بَ ✓, ب]
- **Note:** **First and only 3-option discrimination of the lesson.** Alif rejoins the option set for the harder discrimination. After 3.4–3.6 anchored the 2-option ba-vs-بَ contrast, the learner is ready to filter alif as visual noise. One-shot mode makes it feel consequential.

#### Item 4.2 — Read (decoding)

- **Type:** Read (scored, **one-shot**, decoding)
- **Prompt:** "Read this aloud."
- **Target:** `combo:ba+fatha`
- **Display:** بَ (large, centered)
- **AudioModel:** `audio/letter/ba_fatha_sound.mp3`
- **Note:** Per Constraint 2 of the rendering layer (no auto-play on Read), the learner says it in their head, taps Check after the lock window, audio reveals.

#### Item 4.3 — Read (decoding)

- **Type:** Read (scored, **one-shot**, decoding)
- **Prompt:** "Say it again."
- **Target:** `combo:ba+fatha`
- **Display:** بَ
- **AudioModel:** `audio/letter/ba_fatha_sound.mp3`
- **Note:** Same syllable, second pass. The prompt humanizes the rhythm. By the third unprompted reading of بَ (4.1's correct tap implicitly counts as one), the syllable is theirs.

## Completion screen

- **Title:** "Lesson 2 complete"
- **Glyphs preview:** ا · ب · بَ
- **Subtitle:** "You read it on your own."
- **Score line:** Visible — `itemsCorrect / itemsTotal` and percent. (12 scored items: 3 warm + 6 practice + 3 mastery. Standard scored lesson, unlike L1.)
- **Tone:** Calm. No confetti.
- **Action:** Continue → returns to home tab.

## Why this version is better pedagogically

- **Stabilize before discriminate.** The first time the learner is asked to distinguish ب from بَ is Item 3.4 — *after* fatha has been re-taught (Screen 2.3) and the syllable equation has been shown (Screen 2.4). The previous version put a ب-vs-بَ contrast in warm recall (Item 1.3) and a 3-option discrimination at Item 3.4 in practice; both forced the learner to do work the lesson hadn't yet supported.
- **Locked prompt vocabulary.** Five canonical prompts, each with a clear semantic role. The learner never has to guess whether "Tap Ba" means the letter or the sound — those forms are gone. The text rules surface the cognitive load openly: `Which one says 'ba'?` is sound-ID; `Tap the letter Ba` is letter-ID; `Tap what you hear` is audio-ID. Three different jobs, three different sentences, no overlap.
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
