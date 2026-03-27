# Codebase Refactor Design

**Date:** 2026-03-27
**Context:** Expert source review rated architecture 8/10 but implementation discipline 5/10, production readiness 4/10. This spec addresses all 8 identified issues in a two-wave approach.

---

## Strategy

**Two waves**, executed sequentially with a review checkpoint between them.

- **Wave 1 (Foundation Cleanup):** Remove prototype leakage, add tooling, fix duplicate data loading. Fast, independent changes that stabilize the repo before structural work.
- **Wave 2 (Structural Refactor):** Split fat screens/components with inline typing, then finish the audio layer. The real architecture improvement, built on a clean foundation.

**Execution order within waves:**

Wave 1: prototype leakage → tooling → duplicate loading
Wave 2: LessonQuiz → onboarding → Home → Progress → audio layer

---

## Wave 1: Foundation Cleanup

### 1.1 Remove Prototype Leakage

#### Home screen (`app/(tabs)/index.tsx`)
- Delete the DEV RESET button and its `resetDatabase()` import from the header. No conditional hide, no feature flag — remove entirely. Dev reset can be done via Expo CLI or a dev-only debug screen if needed later.

#### Progress screen (`app/(tabs)/progress.tsx`)
- Delete the "Your Data" section: the "Export Backup" and "Import Backup" `<Pressable>` buttons (lines 348-392) that have no `onPress` handlers. Dead UI is worse than missing UI.
- Remove the dead `<Pressable>` wrapper on letter cells in the mastery grid (line 310). Replace with plain `<View>`. Letter detail interaction is a future feature, not part of this refactor.

#### Onboarding (`app/onboarding.tsx`)
- Replace `.catch(() => {})` on `handleFinish()` with real error handling:
  - Wrap `updateProfile(...)` in try/catch
  - On failure: keep the user on the final onboarding step, show a visible error message (e.g., a red text banner), and provide a retry button
  - Do NOT navigate away if persistence fails
  - Log the error for debugging
- This is not "add logging." This is "the user sees the failure and can retry."

#### Lesson flow — `durationSeconds` cleanup
- This is a **full API cleanup**, not just a call-site fix:
  - Remove `durationSeconds` from the `completeLesson()` call in `app/lesson/[id].tsx`
  - Remove `durationSeconds` as a required parameter from `useProgress.completeLesson()`
  - Remove `durationSeconds` from the persistence function underneath (`progress.ts` or wherever the INSERT happens)
  - The column can stay in the DB schema (it's harmless), but the app code should not pretend to write meaningful data to it
  - When duration tracking is actually implemented, add it back with a real value

### 1.2 Add Tooling

#### package.json script additions
```json
{
  "lint": "npx expo lint",
  "typecheck": "tsc --noEmit",
  "validate": "npm run lint && npm run typecheck"
}
```

#### Scope
- **Do:** Make the commands exist and be runnable.
- **Do not:** Add pre-commit hooks. Do not tighten tsconfig beyond what `strict: true` already provides. Do not expect zero warnings — the existing codebase has `any` usage and likely lint issues that will be cleaned during Wave 2.
- **CI:** If the repo has a CI config (GitHub Actions, EAS, etc.), wire `validate` into the PR check pipeline. If there is no CI config, skip this — adding CI infrastructure is not part of this refactor.

### 1.3 Fix Duplicate Data Loading

#### Problem
`useProgress` calls `loadProgress(db)` which performs 6 sequential DB reads (completed lessons, mastery entities, mastery skills, mastery confusions, habit, user profile) and assembles a full `ProgressState`. `useHabit` also calls `loadProgress(db)` just to extract `data.habit`. Home uses both hooks, doubling the full state load on mount.

#### Fix
- Create a dedicated `loadHabit(db)` helper in the DB/engine layer that queries only the `habit` table. One query returning `{ current_wird, longest_wird, today_lesson_count, last_practice_date }`.
- Rewrite `useHabit` to call `loadHabit(db)` instead of `loadProgress(db)`.
- `useProgress` remains the single source for full state. No other hook should call `loadProgress()`.
- The `loadHabit(db)` helper lives alongside the existing DB query functions (in `src/engine/progress.ts` or a new `src/engine/habit.ts` if cleaner), not inline in the hook body.
- This is a data-access boundary fix. No new context providers, no global store, no state management rewrite.

---

## Wave 2: Structural Refactor

### 2.1 Split LessonQuiz (693 lines)

#### Current problems
- Mixes question display, answer handling, progress bar, streak banner, mid-celebration, audio/haptics, and completion flow in one file.
- Takes `lesson: any` and `mastery: any` — no type contract.
- Completion payload uses `questions: any[]`.

#### New types (in `src/types/`)

**`src/types/lesson.ts`** — `Lesson` type: id, phase, title, description, teachIds, etc. Replaces `lesson: any` everywhere.

**`src/types/mastery.ts`** — `MasteryState` type with typed `entities`, `skills`, `confusions` records. `EntityState` and `SkillState` interfaces (these already exist in `progress.ts` — promote and export them). Replaces `mastery: any`.

**`src/types/quiz.ts`** — `Question` as a discriminated union by `type` field (recognition, sound, harakat, contrast, connected-form, etc.). `QuizResult` with typed question attempts. Replaces `questions: any[]`.

#### Decomposition

**`src/components/LessonQuiz.tsx`** (~150 lines) — Thin orchestrator. Renders the current step: question, celebration, or completion. Delegates to child components. Does not own quiz state transitions — those live in `useLessonQuiz`.

**`src/components/quiz/QuizQuestion.tsx`** (~150 lines) — Single question display. Receives a typed `Question` object. If question types have significantly different visual treatments, dispatches to per-type renderers by `Question.type` (discriminated union). Does not degenerate into a god component with giant conditionals.

**`src/components/quiz/QuizProgress.tsx`** (~80 lines) — Progress bar + streak banner. Pure presentational. Props: `{ current: number; total: number; streak: number }`.

**`src/components/quiz/QuizCelebration.tsx`** (~80 lines) — Mid-quiz celebration overlay (45% trigger). Self-contained animation + auto-dismiss.

#### Hook boundary
`useLessonQuiz` becomes the typed state machine:
- Input: `Lesson`, `MasteryState`, `completedLessonIds: number[]`
- Output: typed `currentQuestion: Question`, `progress: QuizProgress`, `streak: number`, `handleAnswer: (optionId: string) => void`, `isComplete: boolean`, `results: QuizResult`
- Owns: question generation, answer validation, wrong-answer recycling, streak tracking, celebration trigger, completion detection
- LessonQuiz.tsx coordinates rendering based on this hook's output, nothing more.

### 2.2 Split Onboarding (1,265 lines)

#### Current problems
- 8 steps, each with its own UI/animations/logic, all in one file with step index and giant conditional render.
- `.catch(() => {})` on finish (fixed in Wave 1, but the structural mess remains).

#### Decomposition

**`app/onboarding.tsx`** (~40 lines) — Thin route file. Imports and renders the orchestrator from `src/components/onboarding/`.

**`src/components/onboarding/OnboardingFlow.tsx`** (~150 lines) — Step orchestrator. Owns:
- Current step index
- Typed `OnboardingDraft` object (accumulated user selections across steps — starting point, motivation, daily goal, commitment)
- Shared floating-letters background animation
- Step transitions (fade/slide via Reanimated)
- The improved error-handling finish flow (from Wave 1)

**`src/components/onboarding/OnboardingStepLayout.tsx`** (~80 lines) — Shared scaffold for every step. Provides consistent: padding, title area, content area, CTA button area, transition animation wrapper. Prevents 8 files from drifting visually and structurally.

**Step components** (each ~100-150 lines, in `src/components/onboarding/steps/`):
- `Welcome.tsx` — Logo + bismillah + start
- `StartingPoint.tsx` — Experience level selection
- `Motivation.tsx` — Why are you learning
- `DailyGoal.tsx` — Minutes per day picker
- `Commitment.tsx` — Commitment affirmation
- `Hadith.tsx` — Hadith display with fade-in
- `LetterIntro.tsx` — First letter preview with audio
- `NextSteps.tsx` — Ready to go + navigation

Each step receives:
- `onNext: (data?: Partial<OnboardingDraft>) => void` — to advance and optionally contribute data
- Any step-specific props (e.g., LetterIntro gets letter data)
- Does NOT know about other steps or the global step index

#### `OnboardingDraft` type
```typescript
interface OnboardingDraft {
  startingPoint: 'new' | 'some_arabic' | 'rusty' | 'can_read' | null;
  motivation: 'quran' | 'prayer' | 'general' | null;
  dailyGoal: number | null;  // minutes, >= 1
  commitment: boolean;
}
```
Values match the DB schema CHECK constraints exactly. Accumulated by the orchestrator as steps complete. Written to DB on finish.

### 2.3 Split Home (585 lines)

#### Decomposition

**`app/(tabs)/index.tsx`** (~120 lines) — Screen shell. Loads progress via `useProgress`, loads habit via `useHabit`, handles onboarding redirect and return-welcome check, renders header + hero + grid.

**`src/components/home/HeroCard.tsx`** (~130 lines) — Active lesson card: phase pill, letter circle, lesson title/description, CTA button. Also handles the "all lessons complete" state. Props: typed lesson data + completion status.

**`src/components/home/LessonGrid.tsx`** (~200 lines) — Serpentine journey path: connector line, lesson nodes with locked/unlocked/completed states, current-lesson label with "Up next" badge. Props: typed phase lessons + completed IDs + mastery entities.

**Caution:** If LessonGrid's render block gets noisy (node state derivation + connector logic + labels + navigation), extract a `LessonNode` child component. The 200-line estimate is fine if it's mostly layout math + rendering, but watch for it becoming the new junk drawer.

**`StreakBadge`** stays inline in `index.tsx` — it's already small and self-contained (~8 lines). No need to over-componentize for symmetry.

**Icon components** (`CheckIcon`, `LockIcon`, `ArrowIcon`) move to a shared location (e.g., `src/design/components/icons/`) since they're likely reused across screens. If they're truly Home-only, they can stay in `LessonGrid`.

#### Typing during split
- Route params for lesson navigation get typed (replace `as any` on `router.push`/`router.replace`)
- `(progress as any).returnHadithLastShown` gets a proper typed field on `ProgressState`
- Lesson data passed to HeroCard and LessonGrid uses the `Lesson` type from `src/types/lesson.ts`

### 2.4 Split Progress (495 lines)

#### Decomposition

**`app/(tabs)/progress.tsx`** (~100 lines) — Screen shell. Loads progress, renders header + sections. Does NOT contain section-level mapping, data transformation, or mastery calculations.

**`src/components/progress/StatsRow.tsx`** (~60 lines) — Four stat cards (letters learned, lessons done/total, accuracy, current phase). Pure presentational. Props: typed stats object.

**`src/components/progress/PhasePanel.tsx`** (~100 lines) — Single phase progress card: label, done/total count, progress bar. Props: `{ label: string; done: number; total: number }`. Replaces `width: \`${pct}%\` as any` with proper number-based width calculation.

**`src/components/progress/LetterMasteryGrid.tsx`** (~150 lines) — 28-letter grid with mastery coloring. Uses typed `EntityState` — replaces all `(e as any).correct` / `(e as any).attempts` casts. `<View>` wrappers (dead `<Pressable>` removed in Wave 1). Contains the `getMasteryStyle()` helper or imports it.

#### Typing during split
- `EntityState` imported from `src/types/mastery.ts`
- Phase count types from selectors get proper return types
- `deriveMasteryState()` gets typed input/output

### 2.5 Finish Audio Layer

**Timing:** After screen splits are complete — component boundaries are stable, so the audio API won't be built around files that are about to be torn apart.

#### Two-lane playback architecture

**Voice lane:** Letter names, letter sounds, TTS. One active source at a time within this lane.
- Letter audio interrupts prior letter audio
- TTS interrupts letter audio

**SFX lane:** Taps, correct/wrong, celebrations, streak sounds. One active source at a time within this lane.
- Streak sounds replace each other
- Tap SFX does NOT cut off voice-lane audio

Lanes are independent — SFX never interrupts voice, voice never interrupts SFX.

#### `src/audio/player.ts` expansion

Current state: asset maps + `getSFXAsset()` + `getLetterAsset()` + `configureAudioSession()`.

Expanded to own:

**Playback helpers** (components call these instead of raw `useAudioPlayer`/`seekTo`/`play`):
- `playCorrect()` — correct SFX + light haptic impact
- `playWrong()` — wrong SFX + notification error haptic
- `playTap()` — button tap SFX + light haptic
- `playLessonStart()` — lesson start SFX
- `playLessonComplete()` — lesson complete SFX + heavy haptic + success notification
- `playCelebration()` — celebration SFX + heavy haptic
- `playStreakTier(tier)` — streak milestone SFX (replaces prior streak sound)
- `playLetterName(id)` — voice lane, interrupts prior voice
- `playLetterSound(id)` — voice lane, interrupts prior voice

**Haptic coupling** built into each helper. Components never call `Haptics.*` directly.

**Mute state:** Single `isMuted` boolean. All helpers respect it. No per-component mute logic. Exposed as `setMuted(boolean)` + `isMuted()`.

#### Component cleanup
- Remove all direct `useAudioPlayer`, `seekTo`, `play`, and `Haptics.*` calls from:
  - `LessonQuiz.tsx` (post-split: `QuizQuestion`, `QuizCelebration`)
  - `app/onboarding.tsx` (post-split: step components)
  - Any other component doing direct playback
- Replace with calls to the player helpers

---

## Types Summary

New `src/types/` directory with shared type definitions:

| File | Key Types | Replaces |
|------|-----------|----------|
| `src/types/lesson.ts` | `Lesson` (id, phase, title, description, teachIds, etc.) | `lesson: any` throughout |
| `src/types/mastery.ts` | `MasteryState`, `EntityState`, `SkillState`, `ConfusionState` | `mastery: any`, `(e as any)` casts |
| `src/types/quiz.ts` | `Question` (discriminated union), `QuizResult`, `QuestionAttempt` | `questions: any[]`, untyped payloads |
| `src/types/progress.ts` | `ProgressState`, `HabitState` | Scattered inline types, `(progress as any)` casts |
| `src/types/onboarding.ts` | `OnboardingDraft`, `OnboardingStep` | Untyped step state |

Types are introduced **during** the screen splits, not as a separate phase. Each split introduces the types needed at its boundaries.

---

## File Location Summary

```
src/
  types/
    lesson.ts
    mastery.ts
    quiz.ts
    progress.ts
    onboarding.ts
  components/
    LessonQuiz.tsx          (orchestrator, ~150 lines)
    quiz/
      QuizQuestion.tsx      (~150 lines)
      QuizProgress.tsx      (~80 lines)
      QuizCelebration.tsx   (~80 lines)
    onboarding/
      OnboardingFlow.tsx    (orchestrator, ~150 lines)
      OnboardingStepLayout.tsx  (shared scaffold, ~80 lines)
      steps/
        Welcome.tsx         (~100-150 lines each)
        StartingPoint.tsx
        Motivation.tsx
        DailyGoal.tsx
        Commitment.tsx
        Hadith.tsx
        LetterIntro.tsx
        NextSteps.tsx
    home/
      HeroCard.tsx          (~130 lines)
      LessonGrid.tsx        (~200 lines)
    progress/
      StatsRow.tsx          (~60 lines)
      PhasePanel.tsx        (~100 lines)
      LetterMasteryGrid.tsx (~150 lines)
  audio/
    player.ts               (expanded with playback helpers + 2-lane policy)
```

Route files (`app/`) become thin wrappers that import from `src/components/`.

---

## Constraints and Non-Goals

- **No state management rewrite.** No Redux, no Zustand, no global store. Hooks + SQLite remain the state approach.
- **No new dependencies** unless strictly necessary (e.g., ESLint plugin for `lint` script).
- **No dark mode work.** Theme stays forced light. The inconsistency (config says automatic, runtime forces light, dark tokens exist) is noted but not addressed in this refactor. Clean it up when dark mode actually ships.
- **No new features.** This is purely structural improvement. No letter detail modal, no backup/export, no duration tracking, no review-due UI.
- **No test writing mandate.** Vitest is configured but no test files exist. This refactor does not require writing tests, but the cleaner boundaries should make future testing easier.
- **Target: ~250 lines per file max**, with exceptions only for layout-heavy components (LessonGrid at ~200 is fine; anything over 250 needs justification).

---

## Review Checkpoint

After Wave 1 is complete (prototype leakage removed, tooling added, duplicate loading fixed), pause for review before starting Wave 2. Verify:
- DEV RESET gone from Home
- Dead buttons gone from Progress
- Dead Pressable wrappers gone from letter grid
- Onboarding finish has visible error + retry
- `durationSeconds` removed from app code API
- `npm run lint`, `npm run typecheck`, `npm run validate` all execute
- `useHabit` no longer calls `loadProgress()`
- Home screen still renders correctly with both hooks
