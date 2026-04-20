# Curriculum Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hard reset all v1 and v2 lesson code on `main`, quarantine lesson-adjacent systems, and add a shape-neutral sandbox runtime + one hidden reference lesson as scaffolding for the forthcoming curriculum.

**Architecture:** Delete lesson-specific code (data, engine generators, v1 components, routes), quarantine lesson-adjacent runtime (mastery, habit, progress hooks, state provider, monetization coupling) by decoupling callers while leaving files in place. Archive v2 work as a named branch + tag. Add `src/curriculum/runtime/LessonRunner` as a generic shape-neutral runtime (tracks index + advance only), one hidden reference lesson gated by `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true` for device smoke testing.

**Tech Stack:** TypeScript, React Native (Expo 55), Vitest 4, SQLite (expo-sqlite), Expo Router.

**Spec:** `.planning/RESET-DECISION-MEMO.md`

---

## File Structure

### Deleted (v1 lesson-specific)
- `src/data/lessons.js` — v1 106-lesson array
- `src/engine/questions/` — all v1 generators (dir)
- `src/engine/outcome.ts`, `src/engine/insights.ts`, `src/engine/engagement.ts`, `src/engine/selectors.ts`
- `src/components/exercises/`, `src/components/quiz/` — dirs
- `src/components/LessonQuiz.tsx`, `LessonIntro.tsx`, `LessonHybrid.tsx`, `LessonSummary.tsx`
- `src/components/home/LessonGrid.tsx`
- `src/components/celebrations/LetterMasteryCelebration.tsx`
- `src/hooks/useLessonQuiz.ts`
- `app/lesson/[id].tsx`, `app/lesson/review.tsx`, `app/phase-complete.tsx`, `app/post-lesson-onboard.tsx`
- `docs/superpowers/specs/2026-04-07-curriculum-v2-design.md`
- `docs/superpowers/plans/2026-04-07-curriculum-v2-plan-{1,2,3}-*.md` (3 files)
- All obsolete tests corresponding to deleted source files

### Modified (decoupling / stubbing)
- `app/(tabs)/index.tsx` — strip lesson grid, keep streak hero + placeholder
- `src/state/provider.tsx` — drop lesson completion aggregation
- `src/hooks/useProgress.ts` — reduce to habit readers only
- `src/hooks/useHabit.ts` — ensure `recordPractice` has no implicit lesson coupling
- `src/engine/progress.ts` — thin shim: habit write only; drop mastery + lesson completion
- `src/monetization/hooks.ts` — stub `useCanAccessLesson` to always-allow; remove `FREE_LESSON_CUTOFF` coupling
- `src/analytics/events.ts` — remove orphaned `lesson_*` event types after verifying no emitters
- `app/_layout.tsx` — no changes expected (already routes-based)

### Created (scaffolding)
- `src/curriculum/runtime/cursor.ts` — pure advance logic (testable)
- `src/curriculum/runtime/LessonRunner.tsx` — shape-neutral runtime component
- `src/curriculum/reference/types.ts` — **local** types for reference lesson only (NOT exported as shared contract)
- `src/curriculum/reference/lesson.ts` — reference lesson data
- `app/sandbox-lesson.tsx` — dev-only env-flag gated route
- `src/curriculum/README.md` — scaffold docs
- `src/__tests__/curriculum-cursor.test.ts` — pure test for cursor logic
- `.planning/RESET-AUDIT.md` — audit workbook (Task 0 output)

### Archive / git ops (no main commits)
- Tag `pre-reset-shippable` on `7ffa3de`
- Rename `feature/curriculum-v2` → `archive/curriculum-v2`, tag `curriculum-v2-final`
- Delete `.worktrees/curriculum-v2` worktree
- Bulk delete ~40 `worktree-agent-*` branches

---

## Task 0: Preparation — safety tag + pre-cleanup grep audit

**Files:**
- Create: `.planning/RESET-AUDIT.md`

Purpose: establish a rollback baseline via tag, then run the grep audit so subsequent deletion tasks know what they're breaking.

- [ ] **Step 0.1: Verify we're on `main` with clean tree**

```bash
git status
git rev-parse --abbrev-ref HEAD
```
Expected: branch is `main`, no uncommitted changes beyond the untracked `curriculum/` PDFs and screenshot.

- [ ] **Step 0.2: Tag the pre-reset shippable commit**

```bash
git tag pre-reset-shippable 7ffa3de
git tag --list pre-reset-shippable
```
Expected: tag exists pointing at `7ffa3de`. Push if remote exists: `git push origin pre-reset-shippable`.

- [ ] **Step 0.3: Create audit workbook**

Create `.planning/RESET-AUDIT.md` with this shell:

```markdown
# Pre-Reset Grep Audit — 2026-04-20

Executed before Task 5 (strip lessons). Each section records consumers found and their disposition.

## Lesson data / types
### LESSONS
(output)

### LESSONS_V2
(output)

### Lesson / LessonV2 / LessonMode / LessonPhase
(output)

### teachIds / reviewIds / teachEntityIds / reviewEntityIds
(output)

## Routes
### /lesson/
(output)

### phase-complete / post-lesson-onboard
(output)

## Progress calculators
### completedLessonIds / currentLessonId / getCurrentLesson / getPhaseCounts / getLearnedLetterIds / getRecommendedLessons
(output)

### planReviewSession / getDueEntityKeys / getWeakEntityKeys
(output)

## Analytics
### lesson_started / lesson_completed / lesson_failed
(output)

### other lesson_* event types
(output)

## Monetization
### FREE_LESSON_CUTOFF / useCanAccessLesson / premium_lesson
(output)

### ACCOUNT_PROMPT_LESSONS
(output)

## Sync / export / restore
### exportProgress / resetProgress / importProgress / restoreProgress
(output)

### SQL strings for lesson_attempts / question_attempts
(output)

### SQL strings for mastery_* tables
(output)

## Phase / module hardcoded references
### "Phase 1" | "Phase 2" | etc.
(output)

### phase: 1..4
(output)

## Disposition summary
| Consumer file:line | Pattern | Disposition (delete / stub / keep) | Task where handled |
|---|---|---|---|
```

- [ ] **Step 0.4: Run each grep, fill in the workbook**

Execute these, paste output into the appropriate sections:

```bash
# Lesson data / types
grep -rn "LESSONS\b" src/ app/
grep -rn "LESSONS_V2\b" src/ app/
grep -rn "\bLesson\b\|\bLessonV2\b\|LessonMode\|LessonPhase" src/ app/
grep -rn "teachIds\|reviewIds\|teachEntityIds\|reviewEntityIds" src/ app/

# Routes
grep -rn "/lesson/" src/ app/
grep -rn "phase-complete\|post-lesson-onboard" src/ app/

# Progress calculators
grep -rn "completedLessonIds\|currentLessonId\|getCurrentLesson\|getPhaseCounts\|getLearnedLetterIds\|getRecommendedLessons" src/ app/
grep -rn "planReviewSession\|getDueEntityKeys\|getWeakEntityKeys" src/ app/

# Analytics
grep -rn "lesson_started\|lesson_completed\|lesson_failed" src/ app/
grep -rn "\"lesson_\|'lesson_" src/analytics/

# Monetization
grep -rn "FREE_LESSON_CUTOFF\|useCanAccessLesson\|premium_lesson" src/ app/
grep -rn "ACCOUNT_PROMPT_LESSONS" src/ app/

# Sync / export / restore
grep -rn "exportProgress\|resetProgress\|importProgress\|restoreProgress" src/
grep -rn "lesson_attempts\|question_attempts" src/
grep -rn "mastery_entities\|mastery_skills\|mastery_confusions" src/

# Phase references
grep -rn "Phase 1\|Phase 2\|Phase 3\|Phase 4" src/ app/
grep -rn "phase:\s*[1-4]" src/ app/
```

- [ ] **Step 0.5: Classify each consumer in the disposition table**

For every line returned, decide: **delete** (file is v1 lesson-specific, will be deleted in Tasks 5–9), **stub** (file is in Keep or Quarantine, caller must be rewritten), or **keep** (reference is legitimate, e.g., a string in an unrelated file). Note the Task number where the consumer will be handled.

- [ ] **Step 0.6: Commit the audit workbook**

```bash
git add .planning/RESET-AUDIT.md
git commit -m "docs(planning): record pre-reset grep audit and disposition"
```

---

## Task 1: Archive feature/curriculum-v2 branch + tag

**Files:** None (branch operations only; no main commit)

- [ ] **Step 1.1: Verify feature branch exists and last commit**

```bash
git log -1 --format="%h %s" feature/curriculum-v2
```
Expected: `9daf0c0 fix(v2): rewrite L2 from authored spec — fatha with ba and alif`

- [ ] **Step 1.2: Rename branch to `archive/curriculum-v2`**

```bash
git branch -m feature/curriculum-v2 archive/curriculum-v2
```

- [ ] **Step 1.3: Tag the final v2 commit**

```bash
git tag curriculum-v2-final archive/curriculum-v2
```

- [ ] **Step 1.4: Push rename and tag to origin if remote exists**

```bash
git remote -v
# If origin is configured:
git push origin archive/curriculum-v2
git push origin curriculum-v2-final
git push origin --delete feature/curriculum-v2  # remove old remote branch
```

- [ ] **Step 1.5: Verify archive branch visible in `git branch` output**

```bash
git branch | grep curriculum
```
Expected: `archive/curriculum-v2` listed, no `feature/curriculum-v2`.

---

## Task 2: Prune stale `worktree-agent-*` branches

**Files:** None (branch operations; no main commit)

- [ ] **Step 2.1: Enumerate worktree-agent branches**

```bash
git branch | grep "worktree-agent-" > /tmp/agent-branches.txt
wc -l /tmp/agent-branches.txt
```
Expected: ~40 lines.

- [ ] **Step 2.2: Check for any worktree-agent branches with unique unmerged commits worth preserving**

```bash
while read branch; do
  branch=$(echo "$branch" | tr -d '+ *')
  count=$(git log main.."$branch" --oneline 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "$branch has $count unmerged commits"
  fi
done < /tmp/agent-branches.txt
```
Expected: all 0. If any > 0, investigate before deleting.

- [ ] **Step 2.3: Bulk delete**

```bash
while read branch; do
  branch=$(echo "$branch" | tr -d '+ *')
  git branch -D "$branch"
done < /tmp/agent-branches.txt
```

- [ ] **Step 2.4: Verify branch list is clean**

```bash
git branch | grep "worktree-agent-" | wc -l
```
Expected: 0.

---

## Task 3: Remove `.worktrees/curriculum-v2` worktree

**Files:** None (git worktree operation; no main commit)

- [ ] **Step 3.1: Verify worktree directory is not in use**

```bash
git worktree list | grep curriculum-v2
```
Expected: one entry at `.worktrees/curriculum-v2`.

- [ ] **Step 3.2: Remove worktree**

```bash
git worktree remove .worktrees/curriculum-v2 --force
git worktree prune
```

- [ ] **Step 3.3: Verify removal**

```bash
git worktree list | grep curriculum-v2 | wc -l
ls .worktrees/ 2>/dev/null
```
Expected: 0 matches; `.worktrees/` directory is empty or doesn't exist.

---

## Task 4: Remove obsolete v2 specs + plans from main

**Files:**
- Delete: `docs/superpowers/specs/2026-04-07-curriculum-v2-design.md`
- Delete: `docs/superpowers/plans/2026-04-07-curriculum-v2-plan-1-data-foundation.md`
- Delete: `docs/superpowers/plans/2026-04-07-curriculum-v2-plan-2-engine.md`
- Delete: `docs/superpowers/plans/2026-04-07-curriculum-v2-plan-3-integration.md`

Note: `2026-04-09-lesson-quality-redesign.md` is only on the archived branch, not on main — no action needed.

- [ ] **Step 4.1: Verify these files exist on main**

```bash
ls docs/superpowers/specs/2026-04-07-curriculum-v2-design.md
ls docs/superpowers/plans/2026-04-07-curriculum-v2-plan-*.md
```
Expected: 4 files listed.

- [ ] **Step 4.2: Delete the files**

```bash
git rm docs/superpowers/specs/2026-04-07-curriculum-v2-design.md
git rm docs/superpowers/plans/2026-04-07-curriculum-v2-plan-1-data-foundation.md
git rm docs/superpowers/plans/2026-04-07-curriculum-v2-plan-2-engine.md
git rm docs/superpowers/plans/2026-04-07-curriculum-v2-plan-3-integration.md
```

- [ ] **Step 4.3: Commit**

```bash
git commit -m "docs: remove obsolete curriculum v2 specs and plans"
```

---

## ⛳ Gate G1 — Clean

Run and verify:

```bash
npm run typecheck
```
Expected: passes (nothing has changed code-wise yet).

```bash
git status
```
Expected: clean working tree.

If G1 passes, proceed to Task 5. If not, diagnose and fix before continuing.

---

## Task 5: Stub home screen, remove lesson routes

**Files:**
- Modify: `app/(tabs)/index.tsx` — strip lesson grid, keep streak hero, add placeholder
- Delete: `app/lesson/[id].tsx`
- Delete: `app/lesson/review.tsx`
- Delete: `app/phase-complete.tsx`
- Delete: `app/post-lesson-onboard.tsx`
- Delete: `app/lesson/` (the empty dir after the two files above are removed)

- [ ] **Step 5.1: Open `app/(tabs)/index.tsx` and identify lesson-related imports**

Read current file, locate imports of: `LESSONS`, `LessonGrid`, `useProgress` (lesson-specific reads), `FREE_LESSON_CUTOFF`, any v1 lesson data.

- [ ] **Step 5.2: Rewrite `app/(tabs)/index.tsx` to the stub**

Replace the file's content with a minimal home that keeps the streak hero and shows a placeholder. Preserve imports of:
- streak hero component
- `useColors` / theme
- `SafeAreaView`, typography, spacing from design

Remove all lesson-related imports and JSX. Add a `<Text>Curriculum coming soon</Text>` placeholder block where the lesson grid used to be. Keep the greeting / wird / streak hero intact (these live in the Keep bucket).

(The exact code depends on current file structure; the executor should preserve the streak hero block verbatim and only strip lesson grid rendering.)

- [ ] **Step 5.3: Delete lesson route files**

```bash
git rm app/lesson/[id].tsx
git rm app/lesson/review.tsx
git rm app/phase-complete.tsx
git rm app/post-lesson-onboard.tsx
rmdir app/lesson 2>/dev/null || true
```

- [ ] **Step 5.4: Remove route registrations from `app/_layout.tsx`**

Open `app/_layout.tsx`, find the `<Stack.Screen name="lesson/[id]" ... />` and `<Stack.Screen name="lesson/review" ... />` entries in `AppNavigator`. Delete both.

- [ ] **Step 5.5: Run typecheck (expected to fail)**

```bash
npm run typecheck
```
Expected: fails with errors about missing `LESSONS`, `LessonGrid`, etc. from remaining consumers. This is acceptable at this intermediate point — errors will clear as subsequent tasks strip the consumers.

- [ ] **Step 5.6: Commit**

```bash
git add -A
git commit -m "refactor(app): stub home screen, remove lesson routes

Strip lesson grid from home; keep streak hero. Remove lesson/[id], lesson/review, phase-complete, post-lesson-onboard routes and their registrations. Typecheck temporarily broken — will resolve by Task 9."
```

---

## Task 6: Reduce useProgress, useHabit, state/provider to lesson-agnostic scope

**Files:**
- Modify: `src/hooks/useProgress.ts` — keep habit + mastery reads only, drop all lesson-completion paths
- Modify: `src/hooks/useHabit.ts` — verify `recordPractice` has no lesson-specific args; decouple if needed
- Modify: `src/state/provider.tsx` — drop lesson completion aggregation
- Modify: `src/engine/progress.ts` — reduce to habit write shim

- [ ] **Step 6.1: Read the 4 files and identify lesson-specific exports/reads/writes**

List: `completedLessonIds`, `completeLesson`, `savePremiumLessonGrant`, `postLessonOnboardSeen`, `onboardingDailyGoal`-derived lesson counts, etc.

- [ ] **Step 6.2: Rewrite `src/engine/progress.ts`**

Reduce to a thin shim exposing only:
- `recordPracticeForHabit(db)` — writes to habit table on practice event (if needed by sandbox reference lesson)
- Any existing pure helpers that are not lesson-coupled (review, keep)

Delete all: `completeLesson`, `savePremiumLessonGrant`, lesson-attempt writers, lesson-completion-derived analytics emitters.

- [ ] **Step 6.3: Rewrite `src/hooks/useHabit.ts`**

Ensure `recordPractice()` signature takes no lesson arguments. If it currently takes a lesson ID or mode, remove that parameter. Keep streak update, daily goal tracking, wird counters.

- [ ] **Step 6.4: Rewrite `src/hooks/useProgress.ts`**

Remove: any lesson array reads (`LESSONS`, `completedLessonIds`, `onboardingDailyGoal` usage tied to lesson count). Keep: mastery readers (if the caller doesn't actively use them, they stay dormant but not deleted per memo Quarantine rule). Habit readers stay.

- [ ] **Step 6.5: Rewrite `src/state/provider.tsx`**

Remove lesson completion aggregation. Keep habit + subscription + theme aggregation.

- [ ] **Step 6.6: Run typecheck**

```bash
npm run typecheck
```
Expected: may still fail on downstream lesson component imports — acceptable.

- [ ] **Step 6.7: Commit**

```bash
git add -A
git commit -m "refactor(hooks): reduce useProgress/useHabit/state/progress to lesson-agnostic scope

Drop lesson completion, lesson-attempt writes, lesson-derived aggregation. Keep habit + mastery-reader surface. Typecheck still broken downstream — resolves by Task 9."
```

---

## Task 7: Remove v1 lesson components

**Files:**
- Delete: `src/components/exercises/` (entire dir)
- Delete: `src/components/quiz/` (entire dir)
- Delete: `src/components/LessonQuiz.tsx`
- Delete: `src/components/LessonIntro.tsx`
- Delete: `src/components/LessonHybrid.tsx`
- Delete: `src/components/LessonSummary.tsx`
- Delete: `src/components/home/LessonGrid.tsx`
- Delete: `src/components/celebrations/LetterMasteryCelebration.tsx`
- Delete: corresponding tests in `src/__tests__/` that reference these (identify via grep)

- [ ] **Step 7.1: List tests that reference deleted components**

```bash
grep -rln "LessonQuiz\|LessonIntro\|LessonHybrid\|LessonSummary\|LessonGrid\|LetterMasteryCelebration\|components/exercises\|components/quiz" src/__tests__/
```

- [ ] **Step 7.2: Delete components and their tests**

```bash
git rm -r src/components/exercises/
git rm -r src/components/quiz/
git rm src/components/LessonQuiz.tsx src/components/LessonIntro.tsx src/components/LessonHybrid.tsx src/components/LessonSummary.tsx
git rm src/components/home/LessonGrid.tsx
git rm src/components/celebrations/LetterMasteryCelebration.tsx
# Delete tests listed in Step 7.1
# git rm src/__tests__/<tests-listed-above>
```

- [ ] **Step 7.3: Run typecheck**

```bash
npm run typecheck
```
Expected: errors should reduce significantly. Any remaining errors should be about `src/engine/*` (to be removed in Task 8) or `src/data/lessons` (Task 9).

- [ ] **Step 7.4: Commit**

```bash
git add -A
git commit -m "refactor(components): remove v1 lesson components"
```

---

## Task 8: Remove v1 lesson engine

**Files:**
- Delete: `src/engine/questions/` (entire dir)
- Delete: `src/engine/outcome.ts`
- Delete: `src/engine/insights.ts`
- Delete: `src/engine/engagement.ts`
- Delete: `src/engine/selectors.ts`
- Delete: corresponding tests in `src/__tests__/engine/`

- [ ] **Step 8.1: List engine tests that will be deleted**

```bash
grep -rln "from.*engine/questions\|engine/outcome\|engine/insights\|engine/engagement\|engine/selectors\|planReviewSession" src/__tests__/
```

- [ ] **Step 8.2: Delete engine files and their tests**

```bash
git rm -r src/engine/questions/
git rm src/engine/outcome.ts src/engine/insights.ts src/engine/engagement.ts src/engine/selectors.ts
# Delete tests listed in Step 8.1
```

- [ ] **Step 8.3: Run typecheck**

```bash
npm run typecheck
```
Expected: only errors remaining should be references to `src/data/lessons` (removed in Task 9).

- [ ] **Step 8.4: Commit**

```bash
git add -A
git commit -m "refactor(engine): remove v1 question generators, outcome, insights, engagement, selectors"
```

---

## Task 9: Remove src/data/lessons.js

**Files:**
- Delete: `src/data/lessons.js`
- Delete: any test files referencing `LESSONS` from `src/data/lessons`

- [ ] **Step 9.1: Verify no remaining consumers**

```bash
grep -rn "from.*data/lessons\b" src/ app/
```
Expected: no matches (all consumers deleted in prior tasks). If any remain, fix them before proceeding.

- [ ] **Step 9.2: Delete the file**

```bash
git rm src/data/lessons.js
```

- [ ] **Step 9.3: Run validate**

```bash
npm run validate
```
Expected: **passes**. This is the first fully-green state since Task 4.

- [ ] **Step 9.4: Commit**

```bash
git add -A
git commit -m "refactor(data): remove src/data/lessons.js"
```

---

## ⛳ Gate G2 — Stripped

Run and verify:

- [ ] `npm run validate` passes (lint + typecheck)
- [ ] `npm test` passes (with removed test files accounted for)
- [ ] App boots on device/simulator: `npx expo start -c`
- [ ] Home screen renders "curriculum coming" placeholder, streak hero intact
- [ ] Progress tab renders without crash
- [ ] No lesson routes reachable (e.g., `/lesson/1` returns 404)
- [ ] Auth sign-in/sign-out works
- [ ] Paywall still loads (even if showing nothing meaningful)

If G2 passes, proceed to Task 10. If not, diagnose and commit fixes within this batch before advancing.

---

## Task 10: Add LessonRunner runtime (TDD)

**Files:**
- Create: `src/curriculum/runtime/cursor.ts` — pure advance logic
- Create: `src/curriculum/runtime/LessonRunner.tsx` — shape-neutral component
- Create: `src/__tests__/curriculum-cursor.test.ts` — pure test

- [ ] **Step 10.1: Write the failing test for the cursor pure function**

Create `src/__tests__/curriculum-cursor.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { advanceCursor } from "../curriculum/runtime/cursor";

describe("advanceCursor", () => {
  it("advances to next index when not at end", () => {
    expect(advanceCursor(0, 3)).toEqual({ nextIndex: 1, complete: false });
    expect(advanceCursor(1, 3)).toEqual({ nextIndex: 2, complete: false });
  });

  it("signals complete when advancing past last index", () => {
    expect(advanceCursor(2, 3)).toEqual({ nextIndex: null, complete: true });
  });

  it("handles single-screen lesson", () => {
    expect(advanceCursor(0, 1)).toEqual({ nextIndex: null, complete: true });
  });

  it("handles zero-screen lesson defensively", () => {
    expect(advanceCursor(0, 0)).toEqual({ nextIndex: null, complete: true });
  });
});
```

- [ ] **Step 10.2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/curriculum-cursor.test.ts
```
Expected: FAIL with "Cannot find module '../curriculum/runtime/cursor'".

- [ ] **Step 10.3: Implement the pure cursor function**

Create `src/curriculum/runtime/cursor.ts`:

```ts
export type AdvanceResult = { nextIndex: number | null; complete: boolean };

export function advanceCursor(current: number, total: number): AdvanceResult {
  if (total <= 0) return { nextIndex: null, complete: true };
  const next = current + 1;
  if (next >= total) return { nextIndex: null, complete: true };
  return { nextIndex: next, complete: false };
}
```

- [ ] **Step 10.4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/curriculum-cursor.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 10.5: Implement the shape-neutral LessonRunner component**

Create `src/curriculum/runtime/LessonRunner.tsx`:

```tsx
import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { advanceCursor } from "./cursor";

export type LessonRunnerProps<T> = {
  screens: T[];
  onComplete: () => void;
  renderScreen: (
    screen: T,
    helpers: { advance: () => void; index: number; total: number }
  ) => ReactNode;
};

/**
 * Shape-neutral lesson runtime. Tracks current screen index and advance.
 * Does NOT define what a screen is — caller supplies screens + renderScreen.
 * This is intentional: the new curriculum defines its own screen types.
 */
export function LessonRunner<T>({ screens, onComplete, renderScreen }: LessonRunnerProps<T>) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    const result = advanceCursor(index, screens.length);
    if (result.complete) {
      onComplete();
    } else if (result.nextIndex !== null) {
      setIndex(result.nextIndex);
    }
  }, [index, screens.length, onComplete]);

  if (screens.length === 0) return null;
  return <>{renderScreen(screens[index], { advance, index, total: screens.length })}</>;
}
```

- [ ] **Step 10.6: Run validate**

```bash
npm run validate
```
Expected: PASS.

- [ ] **Step 10.7: Commit**

```bash
git add src/curriculum/runtime/ src/__tests__/curriculum-cursor.test.ts
git commit -m "feat(curriculum): add shape-neutral LessonRunner and cursor logic"
```

---

## Task 11: Add hidden reference lesson + dev route

**Files:**
- Create: `src/curriculum/reference/types.ts` — local types (NOT shared contract)
- Create: `src/curriculum/reference/lesson.ts` — reference lesson data
- Create: `app/sandbox-lesson.tsx` — env-gated dev route

- [ ] **Step 11.1: Create reference lesson types (local scope)**

Create `src/curriculum/reference/types.ts`:

```ts
// Types scoped to the reference lesson only.
// NOT exported from the runtime. NOT a shared contract.
// When the real curriculum lands, it will define its own screen types.

export type RefScreen =
  | {
      type: "teach";
      title: string;
      body: string;
      arabicDisplay?: string;
      audioKey?: string;
    }
  | {
      type: "check";
      prompt: string;
      options: string[];
      correctIndex: number;
    };
```

- [ ] **Step 11.2: Create the reference lesson data**

Create `src/curriculum/reference/lesson.ts`:

```ts
import type { RefScreen } from "./types";

export const referenceLessonScreens: RefScreen[] = [
  {
    type: "teach",
    title: "Arabic reads right to left",
    body: "Arabic is read from right to left — the opposite of English. Every word starts on the right.",
    arabicDisplay: "\u2190",
  },
  {
    type: "teach",
    title: "This is Alif",
    body: "Alif is the first letter of the Arabic alphabet. It makes a long 'aa' sound, like the 'a' in 'father'.",
    arabicDisplay: "\u0627",
    audioKey: "letter_1",
  },
  {
    type: "check",
    prompt: "Which letter is Alif?",
    options: ["\u0627", "\u0628", "\u062A", "\u062B"],
    correctIndex: 0,
  },
];
```

- [ ] **Step 11.3: Create the sandbox dev route**

Create `app/sandbox-lesson.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LessonRunner } from "../src/curriculum/runtime/LessonRunner";
import { referenceLessonScreens } from "../src/curriculum/reference/lesson";
import type { RefScreen } from "../src/curriculum/reference/types";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii } from "../src/design/tokens";
import { Button } from "../src/design/components";
import { useHabit } from "../src/hooks/useHabit";

export default function SandboxLessonScreen() {
  const colors = useColors();
  const { recordPractice } = useHabit();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const flag = process.env.EXPO_PUBLIC_DEV_REFERENCE_LESSON === "true";
    if (!flag) router.replace("/(tabs)");
    setEnabled(flag);
  }, []);

  const handleComplete = useCallback(async () => {
    await recordPractice();
    router.replace("/(tabs)");
  }, [recordPractice]);

  if (!enabled) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <LessonRunner<RefScreen>
        screens={referenceLessonScreens}
        onComplete={handleComplete}
        renderScreen={(screen, { advance, index, total }) => (
          <RefScreenRenderer
            screen={screen}
            onAdvance={advance}
            index={index}
            total={total}
            colors={colors}
          />
        )}
      />
    </SafeAreaView>
  );
}

function RefScreenRenderer({
  screen,
  onAdvance,
  index,
  total,
  colors,
}: {
  screen: RefScreen;
  onAdvance: () => void;
  index: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  if (screen.type === "teach") {
    return (
      <View style={styles.content}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {index + 1} / {total}
        </Text>
        {screen.arabicDisplay && (
          <Text style={[styles.arabic, { color: colors.text }]}>
            {screen.arabicDisplay}
          </Text>
        )}
        <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.lg }]}>
          {screen.title}
        </Text>
        <Text style={[typography.body, { color: colors.text, marginTop: spacing.md, textAlign: "center" }]}>
          {screen.body}
        </Text>
        <View style={{ marginTop: spacing.xxl }}>
          <Button title="Continue" onPress={onAdvance} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {index + 1} / {total}
      </Text>
      <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.lg, textAlign: "center" }]}>
        {screen.prompt}
      </Text>
      <View style={styles.options}>
        {screen.options.map((opt, i) => (
          <Pressable
            key={i}
            onPress={onAdvance}
            style={[
              styles.option,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  arabic: { fontSize: 120, fontFamily: "Amiri_400Regular" },
  options: { marginTop: spacing.xl, width: "100%", maxWidth: 320 },
  option: { padding: spacing.lg, borderRadius: radii.md, borderWidth: 1, marginBottom: spacing.md, alignItems: "center" },
  optionText: { fontSize: 32, fontFamily: "Amiri_400Regular" },
});
```

Implementation notes for the executor:
- Uses the existing `Button` design component for the "Continue" CTA — this doubles as a smoke test for the design system post-reset.
- The options use plain `Pressable` (not `QuizOption` from design/components) because QuizOption has v1-specific shape assumptions. A plain Pressable is sufficient for the reference lesson's smoke-test purpose.
- If `src/design/components/index.ts` doesn't re-export `Button`, verify and adjust the import path to `../src/design/components/Button`.

- [ ] **Step 11.4: Run validate**

```bash
npm run validate
```
Expected: PASS.

- [ ] **Step 11.5: Commit**

```bash
git add src/curriculum/reference/ app/sandbox-lesson.tsx
git commit -m "feat(curriculum): add hidden reference lesson + dev route

Reference lesson is gated by EXPO_PUBLIC_DEV_REFERENCE_LESSON=true. Not visible to production users. Serves as smoke test for the runtime and exemplar for the first real lesson."
```

---

## Task 12: Smoke test — LessonRunner plays reference lesson end-to-end

**Files:**
- Create: `src/__tests__/curriculum-reference-lesson.test.ts` — structural smoke test for the reference lesson data shape

Note: we cannot test React component rendering without @testing-library/react-native installed. Instead we verify the reference lesson data is well-formed, and rely on manual device verification for the rendered flow (covered in G3).

- [ ] **Step 12.1: Write failing structural test**

Create `src/__tests__/curriculum-reference-lesson.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { referenceLessonScreens } from "../curriculum/reference/lesson";
import { advanceCursor } from "../curriculum/runtime/cursor";

describe("reference lesson", () => {
  it("has at least 2 teach screens and 1 check screen", () => {
    const teachCount = referenceLessonScreens.filter((s) => s.type === "teach").length;
    const checkCount = referenceLessonScreens.filter((s) => s.type === "check").length;
    expect(teachCount).toBeGreaterThanOrEqual(2);
    expect(checkCount).toBeGreaterThanOrEqual(1);
  });

  it("can be traversed start to completion using the cursor", () => {
    const total = referenceLessonScreens.length;
    let index = 0;
    let completed = false;
    // Advance one-by-one
    for (let step = 0; step < total; step++) {
      const result = advanceCursor(index, total);
      if (result.complete) {
        completed = true;
        break;
      } else if (result.nextIndex !== null) {
        index = result.nextIndex;
      }
    }
    expect(completed).toBe(true);
  });

  it("every check screen has a valid correctIndex within options", () => {
    for (const screen of referenceLessonScreens) {
      if (screen.type === "check") {
        expect(screen.correctIndex).toBeGreaterThanOrEqual(0);
        expect(screen.correctIndex).toBeLessThan(screen.options.length);
      }
    }
  });
});
```

- [ ] **Step 12.2: Run test to verify pass**

```bash
npx vitest run src/__tests__/curriculum-reference-lesson.test.ts
```
Expected: PASS.

- [ ] **Step 12.3: Commit**

```bash
git add src/__tests__/curriculum-reference-lesson.test.ts
git commit -m "test(curriculum): smoke test reference lesson structure and traversal"
```

---

## Task 13: Add scaffold README

**Files:**
- Create: `src/curriculum/README.md`

- [ ] **Step 13.1: Write the README**

Create `src/curriculum/README.md`:

```markdown
# src/curriculum/

Scaffolding for future lesson work. Populated when the new curriculum blueprint lands.

## Directory layout

- `runtime/` — shape-neutral `LessonRunner` and its cursor logic. Deliberately opinionless about screen shapes. Do not add screen-type definitions here.
- `reference/` — hidden reference lesson used for development and smoke testing. Not shown to production users. Gated by `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true`.
- `README.md` — this file.

## Runtime contract

`LessonRunner<T>` takes:
- `screens: T[]` — caller-defined screen type
- `onComplete: () => void` — called after the last screen is advanced past
- `renderScreen: (screen, { advance, index, total }) => ReactNode` — caller decides how to render

The runtime does not know what a screen is. The new curriculum defines its own screen types.

## When the blueprint arrives

1. Create `src/curriculum/lessons/` for lesson data.
2. Create `src/curriculum/types.ts` defining the new curriculum's `Screen` union (or richer shape — whatever the blueprint needs).
3. Update `app/(tabs)/index.tsx` to render the new lesson grid.
4. Create `app/lesson/[id].tsx` that invokes `LessonRunner` with the new types.
5. Wire new analytics events, progress writes, and paywall gating (these were quarantined during reset).

## Running the reference lesson locally

```bash
EXPO_PUBLIC_DEV_REFERENCE_LESSON=true npx expo start -c
# Navigate to /sandbox-lesson (direct URL; not linked from home).
```

## What NOT to do in here

- Do not add opinionated screen-type definitions to `runtime/`. Keep it neutral.
- Do not write production lesson data until the blueprint is approved.
- Do not bypass the env flag on the sandbox route.
```

- [ ] **Step 13.2: Commit**

```bash
git add src/curriculum/README.md
git commit -m "docs(curriculum): add scaffold README for future lesson work"
```

---

## ⛳ Gate G3 — Scaffolded

Run and verify:

- [ ] `npm run validate` passes
- [ ] `npm test` passes (including `curriculum-cursor.test.ts` and `curriculum-reference-lesson.test.ts`)
- [ ] Boot app with `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true npx expo start -c`
- [ ] Navigate to `/sandbox-lesson` on device
- [ ] Reference lesson plays end-to-end: 2 teach screens advance on Continue, check screen advances on tap
- [ ] `onComplete` fires — `recordPractice` is called, navigation returns to `/(tabs)`
- [ ] Habit table has an incremented `today_lesson_count` / updated `last_practice_date`
- [ ] No crashes, no orphaned-analytics errors in logs

If G3 passes, proceed to Task 14. If not, fix and commit within this batch.

---

## Task 14: Update STATE.md with reset-point marker

**Files:**
- Modify: `.planning/STATE.md` — mark reset complete, reset progress counters, note next step

- [ ] **Step 14.1: Read current `.planning/STATE.md`**

Note current contents (likely stale, pointing at Phase 02 quiz experience at 33%).

- [ ] **Step 14.2: Rewrite STATE.md to reflect the reset-point**

Replace contents with:

```markdown
---
gsd_state_version: 1.0
milestone: reset-2026-04-20
milestone_name: curriculum-reset
status: complete
stopped_at: Reset complete, awaiting new curriculum blueprint
last_updated: "2026-04-20T00:00:00.000Z"
last_activity: 2026-04-20 -- Curriculum reset complete; sandbox runtime + reference lesson in place
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 100
---

# Project State — Post-Reset

## Project Reference

See: `.planning/PROJECT.md`
Reset memo: `.planning/RESET-DECISION-MEMO.md`
Execution plan: `.planning/RESET-EXECUTION-PLAN.md`
Pre-reset audit: `.planning/RESET-AUDIT.md`

**Core value unchanged.** Current focus: awaiting curriculum blueprint from founder.

## Current Position

Curriculum reset complete. All v1 and v2 lesson code removed from `main`. Archive branch: `archive/curriculum-v2`. Safety tag: `pre-reset-shippable` (at `7ffa3de`).

Neutral infra preserved: design system, audio, Arabic reference data, db schema, providers, analytics (trimmed), monetization (lesson-count coupling stubbed), auth, sync, social, onboarding.

Quarantined: `src/engine/mastery.ts`, `src/engine/habit.ts`, `src/hooks/useProgress.ts`, `src/hooks/useHabit.ts`, `src/state/provider.tsx`, `src/engine/progress.ts`. Files remain; no new writes until blueprint confirms formats.

Scaffolded: `src/curriculum/runtime/LessonRunner.tsx` (shape-neutral), `src/curriculum/reference/` (hidden dev-only reference lesson), `app/sandbox-lesson.tsx` (env-gated dev route).

Progress: [██████████] 100% (reset milestone complete)

## Accumulated Context

### Decisions
See `.planning/RESET-DECISION-MEMO.md` for the full record.

### Pending Todos
- New curriculum blueprint: awaiting founder delivery
- Post-blueprint: define new `Screen` type(s) in `src/curriculum/`, populate `src/curriculum/lessons/`, unstub paywall lesson-count logic with new gating model, restore analytics `lesson_*` events if the new curriculum keeps similar funnel structure
- Re-enable EAS builds on `main` (was paused during reset window)

### Blockers/Concerns
- None currently. New lesson work blocked on blueprint delivery, which is founder-owned.

## Session Continuity

Last session: 2026-04-20 — curriculum reset executed
Stopped at: Reset complete, ready for blueprint
Next command on blueprint delivery: `/gsd-do "design the new curriculum"` (triggers new brainstorm cycle)
```

- [ ] **Step 14.3: Commit**

```bash
git add .planning/STATE.md
git commit -m "docs(planning): mark curriculum reset complete in STATE.md"
```

---

## ⛳ Gate G4 — Verified (final post-cleanup gate)

Execute every item. Reset is not complete until all check.

- [ ] `npm run validate` passes (lint + typecheck)
- [ ] `npm test` passes fully
- [ ] App boots on iOS simulator / device
- [ ] App boots on Android simulator / device
- [ ] Onboarding flow completes end-to-end (new user path)
- [ ] Home screen renders "curriculum coming" placeholder, streak hero intact, no crashes
- [ ] Progress tab renders (empty/zeroed mastery), no crashes
- [ ] Auth sign-in + sign-out works
- [ ] Sync push/pull works with empty lesson tables (verify no SQL errors in logs)
- [ ] Paywall loads (manual test: trigger it from wherever it's still wired), does not reference lesson counts
- [ ] `exportProgress` runs without crashing (if exposed in a dev menu)
- [ ] `resetProgress` runs without crashing
- [ ] With `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true` and direct `/sandbox-lesson` navigation, reference lesson plays end-to-end
- [ ] Habit counter increments after reference lesson completion
- [ ] No `lesson_*` analytics events fire during sandbox play
- [ ] Archive branch visible: `git branch -a | grep archive/curriculum-v2`
- [ ] Tags present: `git tag | grep -E "curriculum-v2-final|pre-reset-shippable"`
- [ ] Worktree gone: `git worktree list` shows no `.worktrees/curriculum-v2`
- [ ] No `worktree-agent-*` branches remain: `git branch | grep -c worktree-agent-` returns 0

**If all checks pass:** reset is complete. Founder can resume EAS builds from `main` if desired. New curriculum work begins with a fresh brainstorm against this baseline when the blueprint is ready.

**If any check fails:** diagnose, commit fix in an additional task (numbered 14.x), re-run G4.

---

## Rollback

At any gate failure before G4 passes, rollback is:

```bash
git reset --hard <last-green-commit>
```

For catastrophic rollback: `git reset --hard pre-reset-shippable`.

Archive branch + tags remain immutable and are not affected by resets on `main`.
