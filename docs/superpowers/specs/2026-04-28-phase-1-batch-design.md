# Phase 1 Batch Design — L2–L8 to TestFlight

**Date:** 2026-04-28
**Status:** Brainstormed and approved by founder. Awaiting reviewer final-pass before plan-writing.
**Author:** Claude (drafted), Nasif (founder), reviewer (final-pass)
**Supersedes:** None directly. Parks the master plan's "Block 2: Make It Convert" and "Block 3: Make It Retain" until after the 30–50 tester feedback round.

## Goal

Ship Phase 1 of the master curriculum (L1–L8) to ~30–50 free testers via TestFlight + Android internal track within ~3 weeks, so beginners produce real feedback on whether the teaching actually works. Real bottleneck is feedback, not infra or curriculum quality. Everything in this design serves the question: **how fast can we get a beginner to struggle through L1–L3?**

L1 already ships in the sandbox runtime. This design covers L2–L8.

## Non-Goals (Parked, Not Deleted)

The codebase already contains code for these systems. They stay dormant — no new wiring, no removal — until after the 30–50 tester round produces signal:

- Mastery system (`src/engine/mastery.ts` + `mastery_*` SQLite tables) — `noopMasteryRecorder` stays
- Habit / streaks (still in code, surfaces passively in home hero)
- Paywall + monetization (`useCanAccessLesson` always-allow stub stays)
- Cloud sync + accounts (anonymous-only, no Supabase writes for lessons)
- Social / leaderboards / friends
- Per-question scoring beyond pass/fail
- Re-recording L1 audio
- Polishing L1 further (it's good enough for the test cohort)
- New `TeachingBlock` types. The rule is **compose, not create** — reuse existing blocks (text, heading, glyph-display, shape-variants, audio, name-sound-pair, mark-preview, reading-direction) creatively to express new teaching shapes. Do not introduce new primitives.
- New `Exercise` renderer types beyond the four in this design (Choose, Build, Fix, Check). The shipped renderer set after Wave 2 is exactly **7** (Tap, Hear, Choose, Build, Read, Fix, Check). **Lock is hard: no 8th type until Phase 1 ships to the 30–50 cohort.**

## Three Waves

| Wave | Week | Content | New renderers | Product additions | Analytics | Gate to next wave |
|---|---|---|---|---|---|---|
| 1 | 1 | L2 + L3 | Choose + Build | Lesson grid (sequential unlock), AsyncStorage progress | `lesson_start`, `lesson_complete` | **Reality Check: 5–10 observed sessions pass scale-up criteria** |
| 2 | 2 | L4 + L5 + L6 + L7 + L8 | Fix + Check **(renderer set frozen at 7 after this)** | Polish from Wave 1 findings | + `lesson_retry`, + `lesson_abandoned` (proper definition) | Full Phase 1 plays end-to-end without friction |
| 3 | 3 | (none — distribution only) | (none) | TestFlight + Android internal track, feedback channel decided up front | (none) | 30–50 testers onboarded, feedback flowing in chosen channel |

## Wave 1 — First Real Learning Loop

### Content

**L2 — "Alif + Ba + Fatha = بَ"** (master curriculum §13, Module 1.1)
- Outcome: learn ا and ب with fatha, read the first real syllable بَ. The first reading win.
- Exercise mix: Tap, Hear, Choose, Read.
- Audio requests at end of L2 spec authoring (per audio workflow).

**L3 — "Meet Meem" with contrast scaffolding** (master curriculum §13, Module 1.1, modified)
- Outcome: add م, read بَ / مَ without guessing.
- Exercise mix: Tap, Hear, Choose, Build, Read.
- **Hard structural constraint:** L3 cannot introduce Meem until the learner demonstrates Ba/Alif/fatha stability. Practically: **the first 30–40% of L3 is pure reinforcement (no Meem)**, and only then does Meem appear. Without this, Reality Check produces false negatives — "they didn't learn" when actually "you rushed them."
- L3 shape, in order:
  1. Reinforce Ba vs Alif with fatha (L2 carryover) — first ~30–40% of the lesson, no Meem.
  2. Introduce Meem carefully — visual, then sound, then combination, in steps.
  3. Heavy contrast exercises (بَ vs مَ) once Meem lands.
- Without this scaffolding, Reality Check confusion at L3 becomes ambiguous (was it Meem too fast, or did L1/L2 not actually teach?).

### Renderers (built in Wave 1)

**`ChooseExercise`** (`src/curriculum/ui/exercises/ChooseExercise.tsx`)
- Used by every L2–L8 lesson. Visually similar to `TapExercise` but with an `audioPrompt` instead of (or in addition to) a visual prompt — the learner hears a syllable and picks the correct glyph.
- Spec: existing `ChooseExercise` interface in `src/curriculum/types.ts:107`. No type changes needed.
- Reuse the `TapExercise` option-tile layout, retry/until-correct/one-shot modes, and feedback timing constants.

**`BuildExercise`** (`src/curriculum/ui/exercises/BuildExercise.tsx`)
- Used by L3–L8. Genuinely new interaction model: present a target syllable (audio + glyph), present 3–5 tappable tiles (letters + marks), learner taps in correct sequence to build it.
- Spec: existing `BuildExercise` interface in `src/curriculum/types.ts:115`. `correctSequence: EntityKey[]` already defined.
- Open design questions deferred to writing-plans phase: tap-to-arrange vs drag, error-on-each-tap vs check-on-submit, undo affordance.
- **Kill switch:** if `BuildExercise` is not shippable by Day 3 of Wave 1, **remove it from L3**, replace those exercise slots with `Choose` + `Tap` combinations, and reintroduce Build in Wave 2 alongside Fix and Check. Reality Check goal ("can they read بَ?") does not require construction — preserving Wave 1 momentum is more important than format completeness.

### Product

**Lesson grid** — replaces the single L1 CTA on home.
- 8 cells (L1–L8), shown in a single column or 2×4 grid (visual decision deferred to writing-plans).
- Cells render in three states: completed (checkmark + tap to replay), unlocked (tap to start), locked (no tap, lock icon).
- Sequential unlock: L_n unlocked iff L_{n-1} completed.
- **"You are here" indicator** on the current lesson cell (the first uncompleted unlocked cell) — subtle highlight, glow, or animated outline. Reduces cognitive load and improves completion likelihood. Tiny change, big impact.
- Persist nothing visual on the lesson cards beyond completion state and the current-lesson indicator — no scoring badges, no streak indicators, no "X% accuracy."

**Progress persistence**
- AsyncStorage only. No SQLite mastery writes.
- Schema: `tila.progress` → `{ completedLessonIds: string[], lastReachedLessonId: string }`.
- Updated by `LessonRunner.onComplete` when the lesson finishes.
- Read by the lesson grid on home-screen focus.

### Analytics (Wave 1)

Two events to start. No PostHog dashboards yet — log to console + Sentry breadcrumbs is sufficient signal for the 5–10 observed sessions.

- `lesson_start` — `{ lessonId, timestamp }`
- `lesson_complete` — `{ lessonId, timestamp, durationSeconds, attemptCounts: Record<screenId, number>, firstTryCorrectRate: number }`

**Derived metric: `firstTryCorrectRate`** = `(screens where attempts === 1 and outcome === correct) / (total scored screens)`. Computed in `LessonRunner.onComplete` from the `outcomesRef` map. Distinguishes *learning* from *guess-and-retry* — the headline signal for whether the lesson teaches even at small sample sizes. Reality Check sessions should observe this number alongside the qualitative feedback.

### Reality Check Gate (end of Wave 1)

Not "send a TestFlight link to 5–10 friends." **Observed sessions:** sit beside the learner (or screen-share) while they attempt L1 → L2 → L3 cold, no coaching.

After the session, ask three questions:
1. What was confusing?
2. What felt easy?
3. **What did you think this was teaching?** (Tells you whether the intent landed, not just whether they tapped the right answer.)

**Scale-up failure criteria (do not advance to Wave 2):**
- Tester confuses letter name vs sound (e.g., says "ba" for the letter ب in isolation)
- Tester does not internalize fatha = "a"
- Tester cannot read بَ consistently across L2 and L3

**Scale-up success signals:**
- Move faster through L2 than L1
- Predict answers before tapping options
- Make spontaneous generalizations like "oh it's always 'a' with that line"

**Decision rule (handles conflicting signals):**

Reality Check will produce mixed signal — some testers will struggle, others will breeze through. Before sessions begin, commit to this rule so you do not rationalize forward later:

- **≥ 30% of testers hit any failure criterion → BLOCK Wave 2.** Fix L1–L3 first, re-run Reality Check with fresh testers.
- **< 30% but the same confusion pattern repeats across multiple testers → FIX before scaling.** Pattern repetition is signal, not noise. Address the pattern, then advance.
- **Confusion is isolated (one tester, unique issue, no repeat pattern) → LOG, do not block.** Note in feedback for later but do not derail Wave 2 on it.

If failure criteria hit: fix L1–L3 before authoring L4–L8. Do not paper over with content.

## Wave 2 — Expand to Phase 1 Core

### Content (informed by Reality Check)

| # | Lesson | Outcome | Exercise mix |
|---|---|---|---|
| L4 | Meet Laam | Add ل, read بَ / مَ / لَ | Tap, Hear, Choose, Build, Read |
| L5 | First Decoding Sprint | No new symbols. Decode short CV chunks using only known letters. First pure-transfer lesson. | Hear, Choose, Build, Read, Fix |
| L6 | Meet Noon | Add ن. 5-letter working set: ا ب م ل ن | Tap, Hear, Choose, Build, Read |
| L7 | Checkpoint 1 — Tiny Chunks | Confirm decoding transfer (unseen items, not just familiar) | Check |
| L8 | Kasra Arrives | Add kasra to known letters. Distinguish ba/bi, ma/mi, la/li, na/ni | Hear, Choose, Build, Read, Fix |

### Renderers (built in Wave 2 — last new renderers ever)

**`FixExercise`** (`src/curriculum/ui/exercises/FixExercise.tsx`)
- Used by L5 and L8. Present a deliberately-wrong glyph + the target audio. Learner identifies and corrects via mark/letter swap.
- Spec: existing `FixExercise` interface in `src/curriculum/types.ts:146`. `correctionType: "mark" | "letter" | "pattern"` already defined.

**`CheckExercise`** (`src/curriculum/ui/exercises/CheckExercise.tsx`)
- Used by L7 only. Acts as a wrapper / lesson-mode flag rather than a new interaction. Cycles through items of other types (Hear, Read, Build) with reduced scaffolding (no progressive hints, no retry-until-correct on items marked as `mastery-check`).
- Curriculum master §13 lists Check as L7's exercise mix; verify whether this is a typed `CheckExercise` or a flag on `LessonData.kind` during writing-plans.

### Renderer scope hard-lock

After Wave 2, the renderer set is **frozen** at: Tap, Hear, Choose, Build, Read, Fix, Check. No 8th type. Any pedagogical need that seems to require a new type during Wave 2 must be solved by composing existing types — even at some authoring cost. The rule exists because every prior renderer has expanded scope mid-build; the test cohort gates further expansion.

### Polish from Wave 1

Specific polish targets are unknown until Reality Check produces feedback. Reserve ~1 day in Wave 2 for fixes; if Wave 1 reveals systemic issues, slip Wave 2 by a week rather than papering over.

### Analytics (additions)

- `lesson_retry` — `{ lessonId, screenId, attemptIndex }` — fires when a learner re-attempts an exercise. Signals where confusion exists.
- `lesson_abandoned` — `{ lessonId, screenId, reason: "app_closed" | "idle_timeout" }` — fires when (a) the app backgrounds mid-lesson, or (b) the learner has no interaction for **45 seconds** during an exercise screen. The proper definition matters — naive "left the lesson" is too noisy to use.

## Wave 3 — Distribution and Feedback Engine

### Distribution

- **iOS:** TestFlight build via `eas submit --platform ios`. Add ~30–50 testers as external testers (App Store Connect TestFlight tab). Apple Dev account already enrolled (per memory — RevenueCat config issues remain but don't block TestFlight).
- **Android:** Internal testing track via `eas submit --platform android` + Play Console internal track. Up to 100 testers per track is allowed.
- Build profile: `preview` per `eas.json` (internal distribution).

### Feedback channel — pick one before Wave 3 starts

Three options, all viable. The point of picking up front is to avoid testers landing in the build with no feedback path.

- **Discord server** — best for engaged testers, low friction once joined, async, supports threading. Risk: requires testers to install Discord.
- **WhatsApp group** — highest response rate (everyone has WhatsApp). Risk: hard to thread, messages fly past, hard to extract patterns.
- **In-app "Send Feedback" → Google Form** — most universal, no third-party app required. Risk: lower engagement — testers tap once and never return.

**Decision deferred to founder before Wave 3 starts.** Recommendation: **Discord** for the test cohort because they're a small engaged group, and the threading is worth the install cost.

### Done

- Build uploaded to both stores' internal/test tracks
- 30–50 testers invited (mix of beginner Muslims, converts, friends with no Arabic background)
- Feedback channel live with a pinned welcome explaining what you're testing and what feedback you want
- First wave of feedback ("where did you get confused?", "what felt easy vs hard?") actively flowing within 1 week of build upload

## Authoring Loop

For each L2–L8 lesson:

1. **Claude drafts** the markdown spec at `curriculum/phase-1/<NN>-<slug>.md`, derived from the master curriculum's outcome + exercise mix + L1's voice + the Phase-1 README format.
2. **Founder reviews** the markdown for accuracy and voice, requests changes, approves.
3. **Reviewer final-pass** on the approved markdown.
4. **Claude hand-compiles** the approved markdown into `src/curriculum/lessons/lesson-<NN>.ts` with `LessonData` shape.
5. **Claude registers** the new lesson in `src/curriculum/lessons/index.ts`.
6. **Claude adds** a shape test at `src/__tests__/curriculum/lesson-<NN>-shape.test.ts`.
7. **Smoke-test** by running the lesson on device (sandbox or grid).

Audio requests surface at end of step 4, per audio workflow rule (≤5 clips per request, just-in-time, founder produces in ElevenLabs).

## Audio Production

Per the standing workflow rule:
- ElevenLabs is the source.
- Claude requests audio just-in-time per asset, with file path and what to say.
- Maximum 5 requests per batch (one batch per lesson is typical).
- Lessons can ship with HearButton in disabled state if a clip isn't yet recorded — but flag it as temporary, not final UX.

For Phase 1, the new audio asset list is approximately 18 clips (5 letter names + 5 letter sounds + ~4 fatha combos + ~4 kasra combos), but the actual list emerges per-lesson.

## File-by-file changes (high level)

**New:**
- `curriculum/phase-1/02-alif-ba-fatha.md` through `curriculum/phase-1/08-kasra-arrives.md`
- `src/curriculum/lessons/lesson-02.ts` through `lesson-08.ts`
- `src/curriculum/ui/exercises/ChooseExercise.tsx`, `BuildExercise.tsx`, `FixExercise.tsx`, `CheckExercise.tsx`
- `src/components/home/LessonGrid.tsx`
- `src/curriculum/runtime/progress-store.ts` (or extend `completion-store.ts`) — AsyncStorage progress schema
- `src/__tests__/curriculum/lesson-02-shape.test.ts` through `lesson-08-shape.test.ts`
- `src/__tests__/curriculum/progress-store.test.ts`

**Modified:**
- `src/curriculum/lessons/index.ts` — register L2–L8
- `app/(tabs)/index.tsx` — replace single CTA with `LessonGrid`
- `src/curriculum/ui/exercises/index.tsx` — wire renderEx dispatcher to new renderers
- `src/analytics/events.ts` — add the 4 new event types
- `app/lesson/[id].tsx` — wire new analytics calls in `handleComplete`

**Untouched (intentionally):**
- `src/engine/mastery.ts`, `src/engine/progress.ts` — quarantined, no new writes
- `src/monetization/*` — beta stub stays
- `src/sync/*`, `src/social/*` — dormant for anonymous users
- `src/auth/types.ts` — `ACCOUNT_PROMPT_LESSONS = []` stays empty

## Risks

- **L3 contrast scaffolding may need a renderer we haven't built** — if Ba/Alif/Meem contrast genuinely cannot be expressed with Tap/Choose/Build, the renderer-lock rule forces awkward authoring. Mitigation: design L3's contrast carefully during authoring, escalate before assuming a new renderer is needed.
- **Reality Check fails and L4–L8 slips** — this is the design's intentional gate, not a risk to mitigate. Slip beats shipping a broken loop to 30–50.
- **Audio production cadence becomes the bottleneck** — if founder ElevenLabs production lags lesson authoring, lessons ship with disabled HearButtons and Reality Check signal degrades. Mitigation: surface audio requests at the *start* of each lesson's authoring (as soon as the spec stabilizes), not at the end.
- **Build exercise UX takes longer than 1 week** — new interaction model. Mitigation: the Wave 1 Build kill-switch (above) — if Build is not shippable by Day 3 of Wave 1, remove from L3, replace with Choose+Tap, defer to Wave 2.
- **TestFlight external testers require Apple review** — adds 24–48h of calendar time before Wave 3 distribution actually starts. Submit early.

## Definition of Done (Phase 1 ships)

1. L1–L8 all run end-to-end on device without crashes.
2. Lesson grid reflects completion state across app restarts.
3. Sequential unlock works: L_n locked until L_{n-1} completed.
4. All four new renderers (Choose, Build, Fix, Check) shipped and used by their respective lessons.
5. All four analytics events fire and reach Sentry breadcrumbs (PostHog optional for this round).
6. TestFlight build uploaded; Android internal track build uploaded.
7. 30–50 testers invited; feedback channel live with at least 5 testers active in it within 1 week of upload.
8. Reality Check (5–10 observed sessions) passed before Wave 2 began.

## Open Questions (resolved before plan-writing)

- Lesson grid layout: single column vs 2×4 grid? (Visual decision)
- Build exercise interaction: tap-to-arrange vs drag? (UX decision)
- Build exercise feedback timing: error-on-each-tap vs check-on-submit? (UX decision)
- Idle timeout for `lesson_abandoned`: 45 seconds is the proposed value; founder to confirm.
- Feedback channel: Discord vs WhatsApp vs Google Form (recommendation: Discord; founder picks before Wave 3).

These do not block the plan-writing skill; they will surface as plan tasks with explicit decisions captured at task time.
