# Codebase Refactor Design

**Date:** 2026-03-27
**Context:** Expert source review rated architecture 8/10 but implementation discipline 5/10, production readiness 4/10. This spec addresses all 8 identified issues in a two-wave approach.

---

## Strategy

**Two waves**, executed sequentially with a review checkpoint between them.

- **Wave 1 (Foundation Cleanup):** Fix the quiz-result persistence bug, remove prototype leakage, fix correctness bugs, add tooling, fix duplicate data loading. Fast changes that stabilize the repo before structural work.
- **Wave 2 (Structural Refactor):** Split fat screens/components with inline typing, then finish the audio layer. The real architecture improvement, built on a clean foundation.

**Execution order within waves:**

Wave 1: quiz-result contract fix → prototype leakage → correctness bugs → tooling → duplicate loading + parallelize loadProgress
Wave 2: LessonQuiz → onboarding → Home → Progress → audio layer

---

## Wave 1: Foundation Cleanup

### 1.1 Fix Quiz-Result → DB Contract (CRITICAL)

#### Problem
There is **no adapter** between the quiz result shape and the DB persistence shape. This means every `question_attempts` row has NULL values for 5 of 7 meaningful fields.

`useLessonQuiz` records results as:
```typescript
{ targetId, correct, selectedId, questionType, isHarakat, hasAudio }
```

`saveQuestionAttempts` in `progress.ts` expects `QuestionAttempt`:
```typescript
{ questionType, skillBucket, targetEntity, correct, selectedOption, correctOption, responseTimeMs }
```

**Field mismatches:**
- `targetId` (quiz) → should map to `targetEntity` (DB) — **name mismatch, saved as NULL**
- `selectedId` (quiz) → should map to `selectedOption` (DB) — **name mismatch, saved as NULL**
- `skillBucket` — **never provided, saved as NULL**
- `correctOption` — **never captured, saved as NULL**
- `responseTimeMs` — **never captured, saved as NULL**

Result: learning analytics are garbage. Every question_attempts row only has `questionType` and `correct` as meaningful data.

#### Fix
- Define `QuestionAttempt` type in `src/types/quiz.ts` matching the DB contract exactly
- Add a mapper in `useLessonQuiz` that transforms quiz results into proper `QuestionAttempt` objects before returning them:
  - `targetId` → `targetEntity` (e.g., `"letter:1"`)
  - `selectedId` → `selectedOption`
  - Derive `skillBucket` from `questionType` (the question generators already know the skill — thread it through)
  - Capture `correctOption` from the question's correct answer at answer time
  - Capture `responseTimeMs` by timing from question display to answer selection
- Update `completeLesson()` signature to accept `QuestionAttempt[]` (typed, not `any[]`)
- This is the **first** Wave 1 task because it fixes data corruption that is happening right now

#### Minimal contract test
Add a small Vitest test that verifies `useLessonQuiz` result objects satisfy the `QuestionAttempt` interface shape, and that `saveQuestionAttempts` receives all required fields. This is one of the few places where a test is non-negotiable — the whole bug exists because the contract was never validated.

### 1.2 Remove Prototype Leakage

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

### 1.3 Fix Correctness Bugs

#### Home screen stale useEffect deps (`app/(tabs)/index.tsx`)
The redirect useEffect (lines 109-127) reads `habit`, `today`, and `(progress as any).returnHadithLastShown` in the effect body, but the dependency array only includes `[progress.loading, onboarded]`. This is a stale closure bug — if habit data changes or the date rolls over, the effect won't re-run.

**Fix:** Add the missing dependencies to the array. Specifically: `habit?.lastPracticeDate`, `today`, and the `returnHadithLastShown` value. Also replace `(progress as any).returnHadithLastShown` with a properly typed field on `ProgressState`.

#### Home screen typed route navigation
The same file uses `router.replace("/onboarding" as any)` and `router.push(\`/lesson/${lessonId}\` as any)`. Expo Router typed routes are enabled in `app.config.ts`, but the `as any` casts bypass them completely.

**Fix:** Remove `as any` casts and use proper typed route paths. If the generated route types don't cover these paths, fix the route structure — don't cast around it.

### 1.4 Add Tooling

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

### 1.5 Fix Duplicate Data Loading + Parallelize loadProgress

#### Problem
`useProgress` calls `loadProgress(db)` which performs 6 **sequential** DB reads (completed lessons, mastery entities, mastery skills, mastery confusions, habit, user profile) and assembles a full `ProgressState`. `useHabit` also calls `loadProgress(db)` just to extract `data.habit`. Home uses both hooks, doubling the full state load on mount.

Additionally, `loadProgress()` itself is slower than it needs to be. It does 6 sequential `await` calls, but `exportProgress()` in the same file already uses `Promise.all` for the same set of queries. There is no reason the reads need to be sequential.

#### Fix
- Create a dedicated `loadHabit(db)` helper in the DB/engine layer that queries only the `habit` table. One query returning `{ current_wird, longest_wird, today_lesson_count, last_practice_date }`.
- Rewrite `useHabit` to call `loadHabit(db)` instead of `loadProgress(db)`.
- `useProgress` remains the single source for full state. No other hook should call `loadProgress()`.
- **Parallelize `loadProgress()`:** Refactor the 6 sequential awaits into a `Promise.all`, matching the pattern already used by `exportProgress()` in the same file. The queries are independent reads with no data dependency between them.
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
- Typed `OnboardingDraft` object (accumulated user selections — currently only `startingPoint`)
- Shared floating-letters background animation (visible on steps 0-2)
- Progress bar visibility logic (hidden on steps 0, 4, 6)
- Step transitions (fade/slide via Reanimated)
- The improved error-handling finish flow (from Wave 1)

**`src/components/onboarding/OnboardingStepLayout.tsx`** (~80 lines) — Shared scaffold for every step. Provides consistent: padding, title area, content area, CTA button area, transition animation wrapper. Prevents 8 files from drifting visually and structurally.

**Step components** (each ~100-150 lines, in `src/components/onboarding/steps/`):
- `Welcome.tsx` — Logo, app name "tila", "READ BEAUTIFULLY" motto, tagline, "Get Started" button
- `Tilawat.tsx` — Arabic calligraphy "تِلاوَة", tilawat meaning, "Recite. Reflect. Return." motto
- `Hadith.tsx` — Hadith quote (Sahih Al-Bukhari 4937), "Struggling is not failing" message
- `StartingPoint.tsx` — 4 experience level options (new, some_arabic, rusty, can_read)
- `LetterReveal.tsx` — "Your first letter" with large Alif display, auto-advances after 3.5s
- `LetterAudio.tsx` — Alif with audio playback ("Hear it" / "Hear again"), continue button
- `LetterQuiz.tsx` — "Which one is Alif?" with two options, must answer correctly to proceed
- `Finish.tsx` — Checkmark with Alif watermark, "You've already begun", "Start Lesson 1" button

Each step receives:
- `onNext: (data?: Partial<OnboardingDraft>) => void` — to advance and optionally contribute data
- Any step-specific props (e.g., LetterAudio gets letter data and audio assets)
- Does NOT know about other steps or the global step index

#### `OnboardingDraft` type
```typescript
interface OnboardingDraft {
  startingPoint: 'new' | 'some_arabic' | 'rusty' | 'can_read' | null;
}
```
Values match the DB schema CHECK constraints. Currently only `startingPoint` is collected during onboarding. `handleFinish()` persists `{ onboarded: true, onboardingVersion: 2, startingPoint, commitmentComplete: true }`. The `motivation` and `dailyGoal` fields exist in the schema but are not used in the current mobile flow — do not add UI for them during this refactor.

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
| `src/types/onboarding.ts` | `OnboardingDraft`, `OnboardingStep` | Untyped step state. Note: `OnboardingDraft` only has `startingPoint` — motivation/dailyGoal are not in the current mobile flow |

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
        Tilawat.tsx
        Hadith.tsx
        StartingPoint.tsx
        LetterReveal.tsx
        LetterAudio.tsx
        LetterQuiz.tsx
        Finish.tsx
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
- **Targeted contract tests only.** Vitest is configured but no test files exist. This refactor does not require broad test coverage for every UI split, but it **does** require a small contract test suite for the persistence boundaries that are already hiding bugs:
  - `completeLesson` / `saveQuestionAttempts` — verify the quiz result mapper produces valid `QuestionAttempt` objects with all required fields
  - `handleFinish` onboarding persistence — verify the right fields are written
  - `loadProgress` / `loadHabit` — verify they return the expected shapes
  These are not aspirational. The quiz-result contract bug proves that untested persistence boundaries corrupt data silently.
- **Target: ~250 lines per file max**, with exceptions only for layout-heavy components (LessonGrid at ~200 is fine; anything over 250 needs justification).

---

## Review Checkpoint

After Wave 1 is complete, pause for review before starting Wave 2. Verify:
- Quiz result mapper produces valid `QuestionAttempt` objects (contract test passes)
- `saveQuestionAttempts` receives all required fields (no more NULL analytics)
- DEV RESET gone from Home
- Dead buttons gone from Progress
- Dead Pressable wrappers gone from letter grid
- Onboarding finish has visible error + retry
- `durationSeconds` removed from app code API
- Home useEffect has correct dependency array (no stale closures)
- Home route navigation uses typed routes (no `as any` casts)
- `npm run lint`, `npm run typecheck`, `npm run validate` all execute
- `useHabit` no longer calls `loadProgress()`
- `loadProgress()` uses `Promise.all` instead of sequential awaits
- Home screen still renders correctly with both hooks
- Contract tests pass for quiz results, onboarding persistence, and data loading shapes
