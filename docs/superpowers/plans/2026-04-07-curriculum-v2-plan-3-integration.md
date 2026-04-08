# Curriculum V2 — Plan 3: Integration & Vertical Slice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the v2 engine into the real app behind a feature flag and prove a beginner can move through lessons 1-7, hit the checkpoint, fail or pass, get remediation, and have progress persist — all inside the actual Expo app on the `feature/curriculum-v2` branch.

**Architecture:** CurriculumProvider resolves version at boot (inside DatabaseProvider). V2 hooks bridge the engine to SQLite. The lesson screen detects curriculum version and renders either v1 components or a minimal v2 exercise renderer. Only the minimum UI and audio needed for the vertical slice is built — no polish, no animations, no full component library.

**Tech Stack:** React 19, Expo Router, expo-sqlite, React Context. Reuses existing design system tokens and components where possible.

**Spec:** `docs/superpowers/specs/2026-04-07-curriculum-v2-design.md` — Sections 5, 6, 7 (minimum viable subset).

**Depends on:** Plan 1 (data foundation) + Plan 2 (engine) — both complete on `feature/curriculum-v2`.

**Branch:** `feature/curriculum-v2` worktree only. Do NOT run against main.

---

## Guards

1. Plan 1 + Plan 2 must be landed (290+ tests passing)
2. All v1 files are READ-ONLY except: `app/_layout.tsx` (add provider), `app/lesson/[id].tsx` (add v2 branch), home screen lesson grid (add v2 branch). Do NOT modify `src/db/client.ts` — the `curriculum_version` column is added via `migrate-v2.ts` as a pre-step.
3. V2 progress uses v2 tables exclusively — no reads/writes to v1 tables
4. The feature flag defaults to v1 — v2 only activates via env override or profile flag

---

## File Structure

```
src/
  providers/
    CurriculumProvider.tsx          # Boot-time version resolution, React context

  config/
    curriculumFlags.ts              # getCurriculumVersion, version type

  hooks/
    useLessonQuizV2.ts              # V2 lesson quiz hook — drives exercise flow
    useProgressV2.ts                # V2 progress — reads/writes v2 tables
    useMasteryV2.ts                 # V2 mastery — reads/writes v2_entity_mastery

  components/
    exercises-v2/
      ExerciseRenderer.tsx          # Switches on item.type, renders correct component
      TapExercise.tsx               # Minimal tap UI
      HearExercise.tsx              # Minimal hear UI
      ChooseExercise.tsx            # Minimal choose UI
      BuildExercise.tsx             # Minimal build UI
      ReadExercise.tsx              # Minimal read UI
      FixExercise.tsx               # Minimal fix UI
      LessonRunnerV2.tsx            # Stepper: walks items, collects answers, shows results
      LessonResultV2.tsx            # Pass/fail/checkpoint result screen

  audio/
    audioResolverV2.ts              # Minimal async resolver: bundled → placeholder

  __tests__/
    hooks/
      useLessonQuizV2.test.ts       # Hook logic tests (no React rendering)
    integration/
      vertical-slice.test.ts        # End-to-end: lesson → score → mastery → review
```

---

## What This Plan Does NOT Build

- Polished animations or transitions
- Full audio analytics (replay counting, comparison tracking)
- Fancy result screens with mastery language (practiced/strengthened/retained)
- Phase gating UI (just the unlock evaluation — UI comes later)
- Review session UI (engine exists, UI deferred)
- Exit-block visual indicator
- Preloading pipeline
- Global mute/sound-off behavior

These come in a future polish plan after the vertical slice proves the system works.

---

### Task 1: Feature Flag + CurriculumProvider

**Files:**
- Create: `src/config/curriculumFlags.ts`
- Create: `src/providers/CurriculumProvider.tsx`
- Modify: `app/_layout.tsx` — add CurriculumProvider inside DatabaseProvider
- Modify: `src/db/migrate-v2.ts` — add `curriculum_version` column to user_profile as pre-step

Do NOT modify `src/db/client.ts`. The `curriculum_version` column lives on the v1 `user_profile` table but is added via `migrate-v2.ts` as an idempotent pre-step (`ALTER TABLE user_profile ADD COLUMN curriculum_version TEXT` with try/catch for "duplicate column"). This runs before v2 table creation.

The CurriculumProvider resolves curriculum version once at boot, runs v2 migration if needed, and exposes the version via React context. It does NOT return hook implementations — screens use the version to branch their own rendering.

**curriculumFlags.ts:**
```typescript
export type CurriculumVersion = "v1" | "v2";

const PRODUCTION_DEFAULT: CurriculumVersion = "v1";

// Resolved once at boot, cached
let resolvedVersion: CurriculumVersion | null = null;

export async function resolveCurriculumVersion(
  db: SQLiteDatabase,
): Promise<CurriculumVersion> {
  if (resolvedVersion) return resolvedVersion;

  // 1. Dev override
  if (__DEV__ && process.env.EXPO_PUBLIC_CURRICULUM_OVERRIDE) {
    resolvedVersion = process.env.EXPO_PUBLIC_CURRICULUM_OVERRIDE as CurriculumVersion;
    return resolvedVersion;
  }

  // 2. User profile flag (column may not exist yet — added by migrateV2)
  try {
    const row = await db.getFirstAsync<{ curriculum_version: string | null }>(
      "SELECT curriculum_version FROM user_profile WHERE id = 1"
    );
    if (row?.curriculum_version === "v2") {
      resolvedVersion = "v2";
      return resolvedVersion;
    }
  } catch { /* column doesn't exist yet — fall through to default */ }

  // 3. Production default
  resolvedVersion = PRODUCTION_DEFAULT;
  return resolvedVersion;
}
```

**CurriculumProvider.tsx:**
```typescript
// React context that holds the resolved version
// Wraps children only after version is resolved
// Runs migrateV2() on every boot (idempotent — creates v2 tables + column if missing)
// Does NOT conditionally skip migration — v2 tables exist harmlessly even on v1
```

**_layout.tsx change:** Insert `<CurriculumProvider>` inside `<DatabaseProvider>`, wrapping `<ThemeWrapper>`.

**migrate-v2.ts change:** Add as first step before table creation:
```typescript
// Pre-step: add curriculum_version column to user_profile (v1 table)
// Idempotent — try/catch handles "duplicate column" on re-runs
await db.execAsync("ALTER TABLE user_profile ADD COLUMN curriculum_version TEXT").catch(() => {});
```

**Tests:** Unit test for `resolveCurriculumVersion` logic (mock DB, test env override, test profile flag, test default).

- [ ] **Step 1:** Create curriculumFlags.ts
- [ ] **Step 2:** Create CurriculumProvider.tsx
- [ ] **Step 3:** Add v2 migration to DB init path
- [ ] **Step 4:** Wire provider into _layout.tsx
- [ ] **Step 5:** Write tests
- [ ] **Step 6:** Verify app still boots with v1 default (no regression)
- [ ] **Step 7:** Commit

---

### Task 2: V2 Progress Hook

**Files:**
- Create: `src/hooks/useProgressV2.ts`

Reads and writes to v2 tables. Provides:
- `completedLessonIds`: from `v2_lesson_attempts WHERE passed = 1`
- `completeLesson(lessonId, result)`: writes to `v2_lesson_attempts` + `v2_question_attempts`
- `phaseCompleted(phase)`: checks `v2_phase_completion`
- `markPhaseComplete(phase)`: writes to `v2_phase_completion`

No v1 table access. Uses `useDatabase()` for the SQLite instance.

**Tests:** Test the pure logic (SQL generation, result mapping). Actual DB tests require expo-sqlite mock or integration testing.

- [ ] **Step 1:** Create useProgressV2.ts
- [ ] **Step 2:** Write tests
- [ ] **Step 3:** Commit

---

### Task 3: V2 Mastery Hook

**Files:**
- Create: `src/hooks/useMasteryV2.ts`

Reads and writes to `v2_entity_mastery`. Provides:
- `loadMasterySnapshot()`: reads all v2 mastery records, builds MasterySnapshot
- `saveMasteryUpdates(updates)`: writes updated EntityMastery records
- `getEntityMastery(entityId)`: reads single record

Uses the engine's `recordAttempt`, `evaluatePromotion`, `applyDemotion` functions from `src/engine/v2/mastery.ts`.

- [ ] **Step 1:** Create useMasteryV2.ts
- [ ] **Step 2:** Write tests
- [ ] **Step 3:** Commit

---

### Task 4: V2 Lesson Quiz Hook

**Files:**
- Create: `src/hooks/useLessonQuizV2.ts`

The main orchestrator hook — equivalent of v1's `useLessonQuiz` but for v2. Drives the lesson flow.

**Internal state machine:**
```
"generating" → "active" → "scoring" → "complete"
```
- `generating`: on mount, calls `generateV2Exercises()`. Shows loading state.
- `active`: exercises generated. User answers one at a time.
- `scoring`: all items answered. Calls `evaluateLesson()`, updates mastery, saves to DB.
- `complete`: results ready. UI shows pass/fail.

**Return type:**
```typescript
interface UseLessonQuizV2Return {
  // State
  phase: "generating" | "active" | "scoring" | "complete";
  currentItem: ExerciseItem | null;
  itemIndex: number;
  totalItems: number;
  isExitBlock: boolean;              // true when in final decode items
  isComplete: boolean;
  result: LessonResult | null;       // available when phase === "complete"
  error: string | null;

  // Actions
  handleAnswer: (correct: boolean, answerId: string) => void;
}
```

**Flow:**
1. On mount: load mastery snapshot → generate exercises → transition to "active"
2. Each answer: create ScoredItem, advance index. If index was in exit-block range (last N decode items where N = decodePassRequired), set `isExitBlock: true`
3. When all items answered: transition to "scoring", call `evaluateLesson()`, update mastery for each attempted entity via mastery hook, save lesson result via progress hook
4. Transition to "complete" with result

For checkpoint failures: `result.failureReasons` is non-empty — the UI layer handles remediation routing.

- [ ] **Step 1:** Create useLessonQuizV2.ts
- [ ] **Step 2:** Write tests for the orchestration logic
- [ ] **Step 3:** Commit

---

### Task 5: Minimal Exercise Components

**Files:**
- Create: `src/components/exercises-v2/ExerciseRenderer.tsx`
- Create: `src/components/exercises-v2/TapExercise.tsx`
- Create: `src/components/exercises-v2/HearExercise.tsx`
- Create: `src/components/exercises-v2/ChooseExercise.tsx`
- Create: `src/components/exercises-v2/BuildExercise.tsx`
- Create: `src/components/exercises-v2/ReadExercise.tsx`
- Create: `src/components/exercises-v2/FixExercise.tsx`

**ExerciseRenderer:** Takes an `ExerciseItem` and renders the correct component based on `item.type`. Simple switch statement. Shares props contract:
```typescript
interface ExerciseComponentProps {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
}
```

**Each exercise component is MINIMAL — functional, not polished:**
- Shows Arabic text using existing `ArabicText` component from design system
- Shows options using existing `QuizOption` or `Button` components
- Handles tap → calls onAnswer with correct/incorrect
- No animations, no elaborate feedback, no scaffolding-level logic yet

The goal is: can a human tap through a lesson and have it work.

**No unit tests for these components.** The project doesn't have `@testing-library/react-native` and adding it for minimal throwaway components isn't worth it. Exercise component correctness is verified by: (1) Task 9's engine integration test, (2) manual device testing on the vertical slice. Component polish and proper testing come in the UI polish plan.

- [ ] **Step 1:** Create ExerciseRenderer.tsx
- [ ] **Step 2:** Create all 6 exercise components (minimal)
- [ ] **Step 3:** Commit

---

### Task 6: Minimal Audio Resolver

**Files:**
- Create: `src/audio/audioResolverV2.ts`

Minimal implementation of the async resolver. For the vertical slice:
- Letters: resolve to existing bundled letter audio (the app already has 28 letter sounds)
- Combos/chunks/words: return placeholder (audio not yet sourced)
- SFX (correct/incorrect): use existing `playCorrect()`/`playIncorrect()` from `src/audio/player.ts`

```typescript
export async function resolveAudio(key: string): Promise<{ type: "bundled" | "placeholder"; path?: string }> {
  if (key.startsWith("letter_")) {
    // Map to existing letter audio assets
    const letterId = parseInt(key.replace("letter_", ""), 10);
    // ... resolve from existing audio map
    return { type: "bundled", path: letterSoundPath };
  }
  return { type: "placeholder" };
}
```

This is just plumbing — the hear exercises will work for letters (which have audio) and gracefully degrade for combos/chunks (which don't yet).

**IMPORTANT:** Before implementing, read `src/audio/player.ts` to understand the existing audio asset structure and how letter sounds are mapped to file paths. The resolver must adapt to the existing asset convention, not invent a new one.

- [ ] **Step 1:** Read `src/audio/player.ts` to understand existing audio asset mapping
- [ ] **Step 2:** Create audioResolverV2.ts using the existing asset structure
- [ ] **Step 3:** Wire into hear exercise component
- [ ] **Step 4:** Commit

---

### Task 7: Lesson Runner + Result Screen

**Files:**
- Create: `src/components/exercises-v2/LessonRunnerV2.tsx`
- Create: `src/components/exercises-v2/LessonResultV2.tsx`

**LessonRunnerV2:** The stepper component that:
1. Uses `useLessonQuizV2` hook
2. Renders `ExerciseRenderer` for current item
3. Shows progress bar (simple percentage)
4. On answer: advance to next item
5. On complete: show LessonResultV2
6. Global feedback timing: lock input on submit, show result 800ms, auto-advance

**LessonResultV2:** Minimal result screen:
- Passed: "Lesson Complete" + score + "Continue" button
- Failed: score + each failure reason as text + "Try Again" button
- Checkpoint failed: score + "Practice First" button (remediation deferred to future — for now, just retry)

- [ ] **Step 1:** Create LessonRunnerV2.tsx
- [ ] **Step 2:** Create LessonResultV2.tsx
- [ ] **Step 3:** Commit

---

### Task 8: Wire V2 into Lesson Screen

**Files:**
- Modify: `app/lesson/[id].tsx` — add v2 branch

The lesson screen currently imports `LESSONS` and branches on lesson mode. Add a v2 path:

```typescript
import { useCurriculumVersion } from "../../src/providers/CurriculumProvider";
import { LESSONS_V2 } from "../../src/data/curriculum-v2";
import { LessonRunnerV2 } from "../../src/components/exercises-v2/LessonRunnerV2";

// Inside the component:
const curriculumVersion = useCurriculumVersion();

if (curriculumVersion === "v2") {
  const lessonV2 = LESSONS_V2.find(l => l.id === lessonId);
  if (!lessonV2) return <NotFound />;
  return <LessonRunnerV2 lesson={lessonV2} />;
}

// ... existing v1 path unchanged
```

This is the switchpoint. V1 path is completely untouched. V2 path renders the new runner.

- [ ] **Step 1:** Add v2 import and branch to lesson screen
- [ ] **Step 2:** Test: with `EXPO_PUBLIC_CURRICULUM_OVERRIDE=v2`, lesson screen renders v2 runner
- [ ] **Step 3:** Test: without override, lesson screen renders v1 path (no regression)
- [ ] **Step 4:** Commit

---

### Task 8.5: Home Screen Lesson Grid V2 Branch

**Files:**
- Modify: home screen / lesson grid component (find via `app/(tabs)/index.tsx` or wherever the LessonGrid lives)

Without this, a user on v2 sees v1's 106-lesson grid but gets v2's 6-lesson experience — confusing and unnavigable.

**What to do:**
1. Find the home screen component that renders the lesson grid. Read it to understand how it gets lesson data and completed lesson IDs.
2. Add a v2 branch: when `curriculumVersion === "v2"`, show `LESSONS_V2` instead of `LESSONS`, and read completed IDs from `useProgressV2` instead of `useProgress`.
3. The grid should show the 6 vertical-slice lessons with correct completion state.
4. V1 path is completely untouched.

**IMPORTANT:** Read the existing home screen code first. The implementer needs to understand how `LessonGrid` works, what props it takes, and where it gets its data before adding the v2 branch.

- [ ] **Step 1:** Find and read the home screen / lesson grid component
- [ ] **Step 2:** Add v2 branch — show LESSONS_V2 with useProgressV2 completed IDs
- [ ] **Step 3:** Verify v1 path unchanged
- [ ] **Step 4:** Commit

---

### Task 9: End-to-End Vertical Slice Test

**Files:**
- Create: `src/__tests__/integration/vertical-slice.test.ts`

Integration test that proves the full v2 loop works without the UI:

1. Generate exercises for lesson 2 (tap + hear + choose + read)
2. Simulate answering all correctly
3. Score the lesson → verify pass
4. Update mastery for each entity → verify state transitions
5. Generate exercises for lesson 7 (checkpoint)
6. Simulate answering with some wrong → verify fail + bucket scores
7. Generate remediation from failed result → verify entity IDs returned
8. Simulate passing remediation, retry checkpoint → verify pass
9. Evaluate phase unlock for Phase 2 → verify unlocked after checkpoint pass

This test uses the real engine functions end-to-end. It does NOT test UI rendering or DB persistence — those are verified manually on device. The test proves the engine logic is correct; the hooks and DB layer are verified by running the app.

- [ ] **Step 1:** Write the integration test
- [ ] **Step 2:** Run and verify all assertions pass
- [ ] **Step 3:** Commit

---

## Plan 3 Complete — Success Criteria

### Automated (Vitest)
- [ ] Integration test proves full engine loop (lesson → score → mastery → checkpoint → remediation → unlock)
- [ ] 290+ Plan 1+2 tests still pass (no regression)

### Manual (on device)
- [ ] App boots with v1 by default (no regression to existing experience)
- [ ] Setting `EXPO_PUBLIC_CURRICULUM_OVERRIDE=v2` switches to v2 lesson path
- [ ] Home screen shows 6 v2 lessons (not 106 v1 lessons) when on v2
- [ ] Lesson 1 renders and is playable (tap + hear exercises)
- [ ] Lesson 2 renders with all 4 exercise types (tap + hear + choose + read)
- [ ] Lesson 7 checkpoint produces pass/fail with specific failure reasons
- [ ] Failed checkpoint shows failure reasons on result screen
- [ ] Passed lesson shows as completed on lesson grid after returning to home
- [ ] Progress persists across app restart (kill and reopen — completed lessons still show)
- [ ] Switching back to v1 (remove env override) shows original v1 experience

## Remaining Plans

**Plan 4 (renamed): UI Polish** — Animations, feedback timing, exit-block indicator, scaffolding levels, phase gating UI, result screen mastery language, audio analytics.

**Plan 5: Content Population** — All 62 lessons for Phases 1-6, full registry content.
