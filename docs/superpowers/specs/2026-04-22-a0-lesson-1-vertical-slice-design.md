# A0 — Lesson 1 Vertical Slice

**Status:** Design approved, ready for implementation plan.
**Author:** Nasif + Claude (brainstorm)
**Date:** 2026-04-22
**Curriculum source:** `curriculum/tila_master_curriculum_v3.1.1.md` §6, §7, §9, §10, §19 · `curriculum/phase-1/01-arabic-starts-here.md`

---

## 1. Goal

Build the smallest end-to-end slice that proves authored curriculum can become a playable lesson in-app, without committing to the quarantined mastery engine or a generalized authoring pipeline.

**The test of success:** a human can open the app on a device, tap "Start Lesson 1" from the home tab, go through Lesson 1 screen by screen, reach the completion view, return to home, and see the card state reflect completion. Closing and reopening the app preserves that state.

## 2. Scope

### In scope

- Playable Lesson 1 end-to-end in the app.
- `LessonData` type contract covering all 7 exercise types from curriculum §7.
- `LessonRunner` extensions: `goBack`, `canGoBack`, `allowBack` honoring, screen-outcome tallying, `MasteryRecorder` emission, outcome computation.
- Tap + Hear exercise renderers (the only two Lesson 1 uses).
- Lesson chrome: "B — Balanced" variant (back + part label + softened progress bar + close).
- Completion view: generic `<LessonCompletionView>` with optional conditional glyph preview.
- `MasteryRecorder` interface + `noopMasteryRecorder` implementation.
- AsyncStorage-backed completion marker for the home card.
- Home-tab CTA: single Lesson 1 card that reflects completion state.
- Migrate the existing `/sandbox-lesson` reference route to use a tiny real `LessonData` smoke test.
- Unit tests (Vitest) per the approach in §8.

### Out of scope

- Real mastery engine (kept quarantined).
- Review queue / SRS delivery.
- Unlock graph / prerequisite gating (Lesson 1 is the only lesson).
- Lesson grid (full list of lessons on home).
- Generalized authoring-markdown → runtime parser.
- Migration of old entity keys (`letter:2` → `letter:alif`).
- Audio production (placeholder paths are fine per curriculum §24).
- Integration tests, E2E, Detox/Maestro.
- Resume-in-place (app killed mid-lesson restarts at screen 0).
- Per-lesson authored completion moments (deferred to Phase 6 when Al-Fatiha needs it).

## 3. Governing constraints

Three load-bearing curriculum guardrails encoded in this slice:

1. **No pre-attempt model audio on Read and Check items.** Enforced at the type level (`ReadExercise.audioModel` documented as post-attempt only) and in the renderer (Lesson 1 has no Read items, so A0 exercises this passively).
2. **No same-day phase unlock.** Not exercised in A0 (no phase boundary crossed). Noted for future slices.
3. **Authored cumulative review, not only background resurfacing.** Not exercised in A0. Lesson 1 has no review segment (first lesson).

## 4. Decisions log

Decisions in the order they were made during brainstorming. Each is locked; reopening requires explicit revisit.

| # | Decision |
|---|---|
| 1 | Home-tab CTA card is the launch entry point (not onboarding, not sandbox-only). |
| 2 | Manual `lesson-01.ts` as the runtime artifact. Markdown at `curriculum/phase-1/01-arabic-starts-here.md` remains the human-authored spec. No parser for A0. |
| 3 | AsyncStorage for completion persistence. `completed: boolean` only. No resume mid-lesson. |
| 4 | `MasteryRecorder` is an async interface (`Promise<void>`) with string lesson IDs, stable `itemId`, optional `metadata` bag. `noopMasteryRecorder` implementation for A0. One entity per event; multi-entity items emit multiple events. |
| 5 | `LessonRunner` gains `goBack()` and `canGoBack`; `allowBack?: boolean` per screen (default true); screen 0 has no back; hardware-back opens a "Leave lesson?" Stay/Leave confirm. |
| 6 | Generic in-route `<LessonCompletionView>`. Per-lesson authored completions deferred. |
| 7 | Type contract designed for all 7 exercise types up front. No Lesson-1-only shortcuts. |
| 8 | `CheckExercise` wrapper removed. "Check" is a mode via `ExerciseScreen.scored` and `ExerciseScreen.countsAsDecoding` flags, not a separate exercise shape. |
| 9 | `TeachingScreen` uses composable `TeachingBlock[]`, not whole-screen display templates. |
| 10 | `advance(outcome?: ScreenOutcome)` — teaching screens pass nothing; exercise screens pass a `ScreenOutcome` with screen-level `correct` and an always-present `entityAttempts: EntityAttempt[]`. Retries overwrite the tally but preserve the mastery stream. |
| 11 | Chrome = "B — Balanced": back + sentence-case part label + softened progress bar + close. |
| 12 | Tap/Hear behavior: until-correct retry for Lesson 1, retry-stays-tappable, audio auto-plays on Tap entry, ~900ms auto-advance after correct, "Not quite — try again." / "That's it." feedback copy. |
| 13 | Completion view uses left variant with conditional glyph preview gated by `maxPreviewGlyphs` threshold. Copy: "You just **met** your first Arabic letters." |
| 14 | Sandbox (`/sandbox-lesson`) migrates to a tiny real `LessonData` smoke test rather than being deleted. |

## 5. Architecture

### 5.1 File layout

```
src/curriculum/
├── runtime/
│   ├── LessonRunner.tsx          (existing, extended)
│   ├── cursor.ts                 (existing, extended with retreat)
│   ├── mastery-recorder.ts       (NEW — interface + noop impl)
│   └── completion-store.ts       (NEW — AsyncStorage)
├── types.ts                      (NEW — LessonData, Screen, Exercise union)
├── lessons/
│   ├── index.ts                  (NEW — registry: Record<string, LessonData>)
│   └── lesson-01.ts              (NEW — hand-compiled from phase-1/01-*.md)
└── ui/
    ├── LessonChrome.tsx          (NEW — header + back + progress)
    ├── LessonCompletionView.tsx  (NEW — intra-route completion)
    ├── TeachingScreenView.tsx    (NEW — renders TeachingBlock[])
    └── exercises/
        ├── TapExercise.tsx       (NEW)
        ├── HearExercise.tsx      (NEW)
        └── index.ts              (NEW — dispatch by exercise.type)

app/
├── lesson/
│   └── [id].tsx                  (NEW — lesson route, mounts runner)
└── (tabs)/
    └── index.tsx                 (modified — Lesson 1 CTA card only)

src/__tests__/curriculum/        (NEW test suite — see §8)
```

### 5.2 Dependency direction

- `app/lesson/[id].tsx` imports from `src/curriculum/` only. It is the only place that knows about router and AsyncStorage wiring.
- `LessonRunner` is pure: no router imports, no storage imports. Takes callbacks.
- Exercise renderers are presentational: receive `{ exercise, onAttempt }` props. No router, no storage, no runner knowledge.
- `lesson-01.ts` imports only types from `../types`. Zero behavior.
- `lessons/index.ts` is a static registry object: `{ "lesson-01": lessonOneData }`. Keyed by `LessonData.id`.

## 6. Type contracts

### 6.1 `LessonData`

```ts
// src/curriculum/types.ts

export type EntityKey = string;  // "letter:alif", "combo:ba+fatha", "mark:fatha"

export interface LessonData {
  id: string;                    // "lesson-01"
  phase: number;
  module: string;                // "1.1"
  title: string;
  outcome: string;
  durationTargetSeconds: number;
  introducedEntities: EntityKey[];
  reviewEntities: EntityKey[];
  passCriteria: {
    threshold: number;                        // 0.85 default
    requireCorrectLastTwoDecoding: boolean;   // §10
  };
  screens: Screen[];
  completionSubtitle?: string;   // optional per-lesson override for the completion view
}
```

### 6.2 `Screen` union

```ts
export type Screen = TeachingScreen | ExerciseScreen;

export interface TeachingScreen {
  kind: "teach";
  id: string;                    // stable: "t-rtl-intro", "t-shape-change"
  blocks: TeachingBlock[];
  allowBack?: boolean;           // default true
}

export type TeachingBlock =
  | { type: "text"; content: string }
  | { type: "reading-direction"; word: string }
  | { type: "glyph-display"; letter: string; size?: "large" | "medium"; withMark?: string }
  | { type: "shape-variants"; letter: string; variants: Array<{
      position: "isolated" | "initial" | "medial" | "final";
      rendered: string;
    }> }
  | { type: "audio"; path: string; label?: string };

export interface ExerciseScreen {
  kind: "exercise";
  id: string;                    // stable for MasteryRecorder itemId
  part: "warm-recall" | "practice" | "mastery-check";
  exercise: Exercise;
  allowBack?: boolean;           // default true
  scored?: boolean;              // default true
  countsAsDecoding?: boolean;    // default false; explicit opt-in per §10
  retryMode?: "until-correct" | "one-shot";  // default "one-shot"
}
```

### 6.3 `Exercise` union (all 7 types)

```ts
export type Exercise =
  | TapExercise
  | HearExercise
  | ChooseExercise
  | BuildExercise
  | ReadExercise
  | FixExercise;
// No CheckExercise wrapper — "check" is a scoring mode, not a shape.

export interface TapExercise {
  type: "tap";
  prompt: string;
  target: EntityKey;
  audioOnMount?: string;         // plays once on entry (e.g., "which did you just hear?")
  options: Array<{
    display: string;
    entityKey: EntityKey;
    correct: boolean;
  }>;
}

export interface HearExercise {
  type: "hear";
  prompt: string;
  target: EntityKey;
  audioPath: string;
  displayOnScreen?: string;      // visible Arabic glyph paired with audio
  options?: Array<{              // absent = pure-listen (Lesson 1's Hear screens)
    display: string;
    entityKey: EntityKey;
    correct: boolean;
  }>;
  note?: string;
}

export interface ChooseExercise {
  type: "choose";
  prompt: string;
  target: EntityKey;
  audioPrompt?: string;
  options: Array<{ display: string; entityKey: EntityKey; correct: boolean }>;
}

export interface BuildExercise {
  type: "build";
  prompt: string;
  target: EntityKey;
  tiles: Array<{ display: string; entityKey: EntityKey }>;
  correctSequence: EntityKey[];
}

export interface ReadExercise {
  type: "read";
  prompt: string;
  target: EntityKey;
  display: string;               // the thing to decode
  audioModel?: string;           // post-attempt only; runtime never auto-plays before tap
}

export interface FixExercise {
  type: "fix";
  prompt: string;
  target: EntityKey;
  initialWrong: string;
  correctionType: "mark" | "letter" | "pattern";
  correctDisplay: string;
}
```

### 6.4 `MasteryRecorder`

```ts
// src/curriculum/runtime/mastery-recorder.ts

export interface EntityAttemptEvent {
  entityKey: EntityKey;
  correct: boolean;
  lessonId: string;              // "lesson-01"
  itemId: string;                // stable identifier from ExerciseScreen.id
  attemptedAt: number;           // Date.now()
  metadata?: Record<string, string | number | boolean>;
}

export interface LessonOutcomeEvent {
  lessonId: string;              // "lesson-01"
  passed: boolean;
  itemsTotal: number;
  itemsCorrect: number;
  completedAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface MasteryRecorder {
  recordEntityAttempt(event: EntityAttemptEvent): Promise<void>;
  recordLessonOutcome(event: LessonOutcomeEvent): Promise<void>;
}

export const noopMasteryRecorder: MasteryRecorder = {
  async recordEntityAttempt(event) {
    if (__DEV__) console.log("[mastery:stub] entity-attempt", event);
  },
  async recordLessonOutcome(event) {
    if (__DEV__) console.log("[mastery:stub] lesson-outcome", event);
  },
};
```

### 6.5 `LessonRunner` contract

```ts
// src/curriculum/runtime/LessonRunner.tsx

export interface EntityAttempt {
  entityKey: EntityKey;
  itemId: string;                // forwarded to MasteryRecorder event
  correct: boolean;
}

export interface ScreenOutcome {
  screenId: string;
  correct: boolean;              // drives pass/fail tally
  entityAttempts: EntityAttempt[];  // always-present array; may be []
}

export interface LessonOutcome {
  lessonId: string;
  passed: boolean;
  itemsTotal: number;            // count of scored screens
  itemsCorrect: number;          // count of scored screens whose latest outcome.correct = true
  decodingRuleSatisfied: boolean;
}

export interface LessonRunnerProps {
  lesson: LessonData;
  masteryRecorder: MasteryRecorder;
  onComplete: (outcome: LessonOutcome) => void;
  onExit: () => void;            // confirmed hardware-back "Leave"
  renderScreen: (args: {
    screen: Screen;
    advance: (outcome?: ScreenOutcome) => void;
    reportAttempt: (attempts: EntityAttempt[]) => void;  // entity events without advancing; used by until-correct retries
    goBack: () => void;
    canGoBack: boolean;
    index: number;
    total: number;
  }) => ReactNode;
}
```

**On `advance` vs `reportAttempt`:** `advance(outcome)` moves the cursor and contributes to the screen-level tally; the runner also emits `recordEntityAttempt` for each entry in `outcome.entityAttempts`. `reportAttempt(attempts)` only emits mastery events — no tally change, no cursor move. Together they support until-correct renderers (wrong taps use `reportAttempt`; the final correct tap uses `advance`) without muddling the "screen → outcome" model.

### 6.6 `CompletionStore`

```ts
// src/curriculum/runtime/completion-store.ts

export interface CompletionStore {
  markCompleted(lessonId: string): Promise<void>;
  getCompletion(lessonId: string): Promise<boolean>;
  clearAll(): Promise<void>;     // dev-only; exposed for testing
}

export const asyncStorageCompletionStore: CompletionStore = /* AsyncStorage-backed */;
```

Storage keys namespaced: `tila.lesson-completion.<lessonId>` = `"true"` | absent.

## 7. Runtime behavior

### 7.1 `LessonRunner`

Owns:

- **Cursor movement.** `advance()` increments `index`; `goBack()` decrements. `canGoBack = index > 0 && screens[index].allowBack !== false`. `goBack` on a screen with `allowBack: false` is a defensive no-op.
- **Outcome tallying.** `Map<screenId, ScreenOutcome>`. Latest outcome replaces prior (retry after go-back).
- **Mastery emission.** `masteryRecorder.recordEntityAttempt` fires once per entry on two paths: (a) every `advance(outcome)` call's `outcome.entityAttempts`, and (b) every `reportAttempt(attempts)` call. Both retries and advancing attempts are emitted (honest history).
- **Final outcome computation** (on last-screen advance):
  - `itemsTotal` = count of screens with `scored !== false`.
  - `itemsCorrect` = count of screens whose latest `ScreenOutcome.correct = true` AND `scored !== false`.
  - `decodingRuleSatisfied`: `true` if `lesson.passCriteria.requireCorrectLastTwoDecoding === false`, else `true` iff the last two `countsAsDecoding: true` screens (by sequence order in `lesson.screens`, using latest outcome) are both correct.
  - `passed`: if `itemsTotal === 0`, `true` (trivial pass — Lesson 1). Otherwise `(itemsCorrect / itemsTotal) >= passCriteria.threshold && decodingRuleSatisfied`.
- **Final emission.** `masteryRecorder.recordLessonOutcome` fires once with the computed outcome, then `onComplete(outcome)`.

Does not own: rendering, routing, persistence, hardware-back dialog.

### 7.2 Exercise renderers

**Tap** (`src/curriculum/ui/exercises/TapExercise.tsx`):

- Auto-plays `audioOnMount` once on mount if present; speaker button remains for replay.
- Renders option cards horizontally (2 options for Lesson 1; scales to 3–4 later).
- `retryMode === "until-correct"` (Lesson 1):
  - Wrong tap: target card flashes soft red (~400ms), calls `reportAttempt([{ entityKey: tappedOption.entityKey, itemId: screen.id, correct: false }])`. Cursor does not move; options remain tappable.
  - Correct tap: target card glows soft green, calls `advance({ screenId: screen.id, correct: true, entityAttempts: [{ entityKey: tappedOption.entityKey, itemId: screen.id, correct: true }] })` after ~900ms of feedback.
  - Mastery stream captures both the wrong taps (via `reportAttempt`) and the final correct tap (via `advance`). Screen-level tally reflects only the advancing outcome.
- `retryMode === "one-shot"` (default for future phases): first tap locks all options, ~900ms feedback, then `advance(outcome)` with that first tap's result. `reportAttempt` is never used in this mode.

#### 7.2.1 Wrong-attempt reporting in until-correct mode

The single-advance model assumes "one screen → one outcome." Until-correct breaks this: multiple attempts per screen, only the last advances.

**Resolution:** extend the runner's render-props with a second callback:

```ts
renderScreen: (args: {
  screen: Screen;
  advance: (outcome?: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;  // NEW
  goBack: () => void;
  canGoBack: boolean;
  index: number;
  total: number;
}) => ReactNode;
```

`reportAttempt` emits entity events without advancing. In until-correct mode, wrong taps call `reportAttempt(...)`; correct tap calls `advance({ correct: true, entityAttempts: [...] })`. In one-shot mode, renderers never use `reportAttempt` — first tap is both the attempt and the advance.

The tally still uses only the `advance(outcome)` call. `reportAttempt` only feeds the mastery stream.

**Hear** (`src/curriculum/ui/exercises/HearExercise.tsx`):

- Renders prompt, large Arabic glyph, speaker button.
- Speaker tap plays `audioPath`. Unlimited retaps.
- If `options` absent (Lesson 1 case): Next button always enabled. `advance()` with no outcome.
- If `options` present (future scored-Hear): below-speaker option cards; behaves like Tap with `audioOnMount = audioPath`. Not exercised in A0.

### 7.3 Lesson chrome (`<LessonChrome>`)

- **Top-left:** back arrow. Hidden when `canGoBack = false`.
- **Center:** sentence-case part label ("Warm up" / "Practice" / "Mastery check") derived from `screen.part`. Absent on teaching screens.
- **Top-right:** close (✕). Always visible. Triggers the same hardware-back confirm flow.
- **Below header:** thin progress bar. `#ece6d4` track, `#9AB0A0` fill, 3px height. Width = `(index + 1) / total`.
- **Body slot:** wraps whatever `renderScreen` returns.

**Hardware-back flow:** Chrome (or the parent route) registers an Android hardware-back handler. Pressing it opens a modal: "Leave lesson? Your progress in this lesson won't be saved. [Stay] [Leave]". Leave calls `onExit`. Stay dismisses.

### 7.4 Completion view (`<LessonCompletionView>`)

Props: `{ lesson: LessonData, outcome: LessonOutcome, onContinue: () => void }`.

Layout:

- No chrome (no back, no close, no progress).
- Centered green check mark (72×72, dark-green bg, cream glyph).
- Title: "{lesson.title} complete." — "Lesson 1 complete."
- Score line: "{itemsCorrect} of {itemsTotal} correct" — omitted if `itemsTotal === 0`.
- **Optional glyph preview:** if `lesson.introducedEntities.length > 0 && lesson.introducedEntities.length <= maxPreviewGlyphs`, render joined display strings of `introducedEntities` resolved to their glyph (e.g., `ا · ب`). `maxPreviewGlyphs` defaults to 6. If the list exceeds the threshold or entity keys don't resolve, skip this block cleanly.
- Subtitle: "You just met your first Arabic letters." (Lesson 1 specific copy authored in `lesson-01.ts.completionSubtitle` — optional field on `LessonData`; default if absent: "Nice work.")
- "Continue" primary button — calls `onContinue`.

Hardware-back on this view behaves identically to Continue (no confirm — lesson is done).

### 7.5 Home card

`app/(tabs)/index.tsx` renders a single card with two states:

- **Not completed:** "Arabic Starts Here" title, "Lesson 1 · Phase 1 · Module 1.1" subtitle, "Start" button → `router.push("/lesson/1")`.
- **Completed:** "Lesson 1 complete" title with small check glyph, "Replay Lesson 1" secondary button, disabled "Lesson 2 coming soon" tile below.

State resolved by reading `completionStore.getCompletion("lesson-01")` on mount and on screen focus (Expo Router's `useFocusEffect`).

## 8. Error handling and edges

| Scenario | Behavior |
|---|---|
| Audio file 404 on Tap/Hear | Renderer logs in `__DEV__`, shows silent state in prod, does not block advance. |
| Unknown lesson ID (`/lesson/99`) | Route renders minimal "Lesson not found" with "Back to home" button. No crash. |
| AsyncStorage write fails on `markCompleted` | In-memory state still flips (completion view renders). Home card on next open shows not-completed — graceful degradation. Log in `__DEV__`. |
| AsyncStorage read fails on home | Treat as not-completed. Log. |
| Android hardware back during lesson | Confirm modal: "Leave lesson? Your progress in this lesson won't be saved." Stay dismisses; Leave calls `onExit` → `router.replace("/")`. |
| Android hardware back on completion view | No confirm. Acts as Continue. |
| App backgrounded mid-lesson | State lost (no resume). Restart at screen 0 on next open. |
| `goBack` when `allowBack === false` or `index === 0` | No-op. `canGoBack` prevents UI exposure anyway. |
| Lesson 1 passed trivially (`itemsTotal === 0`) | `passed = true`, score line hidden in completion view. |
| `LessonData.screens` empty array | Runner renders nothing and never fires `onComplete`. Defensive: treat as configuration error; route shows "Lesson not found" equivalent. |

## 9. Testing

Vitest, per `CLAUDE.md` convention. Tests co-located in `src/__tests__/curriculum/`.

### 9.1 Unit tests (required for A0)

```
src/__tests__/curriculum/
├── lesson-runner.test.ts
├── cursor.test.ts            (extend existing — add retreat cases)
├── completion-store.test.ts
├── mastery-recorder.test.ts
└── lesson-01.test.ts
```

**`lesson-runner.test.ts`** — covers:
- Cursor forward on `advance()`.
- Cursor backward on `goBack()`; no-op when `canGoBack = false`.
- `canGoBack` computation respects `allowBack` and `index`.
- `recordEntityAttempt` fires once per `EntityAttempt` entry per `advance(outcome)` call.
- Retries after `goBack`: tally uses latest outcome, mastery stream keeps all attempts.
- Outcome computation: `itemsTotal` counts scored-only, `itemsCorrect` counts latest correct, `decodingRuleSatisfied` respects `countsAsDecoding` and `requireCorrectLastTwoDecoding`.
- Trivial pass when `itemsTotal === 0`.
- `onExit` does not trigger `onComplete`.

**`completion-store.test.ts`** — covers:
- `markCompleted` writes to AsyncStorage under the namespaced key.
- `getCompletion` reads; returns false when key absent; returns false on deserialization error.
- `clearAll` removes lesson-completion keys only, leaves other AsyncStorage keys intact.
- Write/read failures propagate as logged warnings, not thrown errors.

**`mastery-recorder.test.ts`** — covers:
- `noopMasteryRecorder` methods return resolved promises.
- Events have required fields at runtime (shape conforms at compile time; test confirms `__DEV__` console branch fires without error).

**`lesson-01.test.ts`** — structural validation of the encoded data:
- `lesson-01.ts` default export conforms to `LessonData` (TypeScript covers most; add runtime shape check).
- Every `ExerciseScreen` option's `entityKey` is in a known set (the set is defined in the test; catches typos like `letter:aliph`).
- Every referenced `audioPath` / `audioOnMount` / `audioModel` is a non-empty string (existence of file is out of scope).
- `introducedEntities` and `reviewEntities` contain no duplicates and no overlap.
- `passCriteria.threshold` is in `[0, 1]`.
- `lesson-01.ts.frontmatter-equivalent` matches the authoring markdown's frontmatter. Since A0 is hand-compiled, this test captures the mapping explicitly — catches drift between markdown and TS at test time.

### 9.2 Out of scope for A0

- Integration tests (LessonRunner + renderers + router). Deferred — requires testing-library-for-Expo-Router setup not currently in the project.
- Visual regression tests. Deferred.
- E2E (Detox / Maestro). Not planned in this slice.
- Device-lab Arabic rendering (Appendix E of curriculum). Manual task, outside unit-test layer.

## 10. Open items and deferred work

**Immediately unlocks:**

- A1 — Lesson 2 vertical slice: "Alif + Ba + Fatha = بَ". Introduces `combo:ba+fatha` entity, the first Read exercise (seeded here as type, not exercised), and the first scored lesson with a real pass/fail gate. A0's type contract should make A1 pure authoring + a Read renderer.

**Deferred (not blocking A0):**

- Authoring-markdown parser. Unlocks scalability of the lessons folder but requires stable `LessonData` shape first — revisit after Lessons 2–3 reveal the full structure.
- Mastery engine unquarantine + entity-key migration. Replace `noopMasteryRecorder` with a SQLite-backed impl. Targeted for after Phase 1 (Lessons 1–8) is drafted.
- Per-lesson authored completion moments (curriculum §19 Al-Fatiha milestone celebration). Scoped with Phase 6.
- Lesson grid on home. Scoped with Lesson 2+.
- Placement path (curriculum §22). Deferred per curriculum's own v3.2 brief.
- Review queue / SRS delivery. Scoped with first authored cumulative-review lesson (Phase 2 checkpoint 2).

## 11. What the spec does NOT decide

- Exact color tuning for the softened wrong-state on Tap options (spec says "less saturated red"; implementation picks the precise hex).
- Exact `maxPreviewGlyphs` value (default 6; adjust if Lesson 1 looks bad at that number).
- Animation curves for the speaker-ring pulse or tap-option glow. Use the project's existing react-native-reanimated patterns.
- Whether completion view has a subtle enter animation. Default: none; revisit if it feels abrupt in practice.

These are implementation-level polish calls. The plan pass will surface any that turn out to matter.

---

## Appendix — cross-references

- Curriculum master: `curriculum/tila_master_curriculum_v3.1.1.md`
- Lesson 1 authored spec: `curriculum/phase-1/01-arabic-starts-here.md`
- Reset decision memo: `.planning/RESET-DECISION-MEMO.md` (governs what survived and what stays quarantined)
- Existing sandbox route: `app/sandbox-lesson.tsx` (to be migrated in this slice)
- Existing runner scaffold: `src/curriculum/runtime/LessonRunner.tsx` + `src/curriculum/runtime/cursor.ts`
