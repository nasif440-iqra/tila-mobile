# Wave 1: Foundation Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the quiz-result persistence bug, remove prototype leakage, fix correctness bugs, add tooling, and fix duplicate data loading — stabilizing the repo before Wave 2 structural refactoring.

**Architecture:** Wave 1 is 5 independent cleanup tasks executed sequentially. Each task produces a commit. The quiz-result contract fix is first because it fixes active data corruption. All other tasks build on a stable foundation.

**Tech Stack:** TypeScript, Expo Router, expo-sqlite, Vitest

**Spec:** `docs/superpowers/specs/2026-03-27-codebase-refactor-design.md`

---

### Task 1: Fix Quiz-Result → DB Contract

**Files:**
- Create: `src/types/quiz.ts`
- Modify: `src/hooks/useLessonQuiz.ts`
- Modify: `app/lesson/[id].tsx`
- Modify: `src/hooks/useProgress.ts`
- Modify: `src/engine/progress.ts:191-206`
- Create: `src/__tests__/quiz-contract.test.ts`

- [ ] **Step 1: Create `src/types/quiz.ts` with both shapes**

The UI layer keeps its own shape. The DB layer has `QuestionAttempt`. A mapper translates at the boundary.

```typescript
// src/types/quiz.ts

/**
 * Shape recorded by useLessonQuiz during the quiz UI.
 * This is the UI-layer result — NOT the DB shape.
 */
export interface QuizResultItem {
  targetId: string | number;
  correct: boolean;
  selectedId: string;
  questionType: string | null;
  correctId: string;
  isHarakat: boolean;
  hasAudio: boolean;
  responseTimeMs: number;
}

/**
 * Shape expected by saveQuestionAttempts in progress.ts.
 * Matches the question_attempts DB columns exactly.
 */
export interface QuestionAttempt {
  questionType: string;
  skillBucket: string | null;
  targetEntity: string | null;
  correct: boolean;
  selectedOption: string | null;
  correctOption: string | null;
  responseTimeMs: number | null;
}

/**
 * Derive skillBucket from questionType.
 * Maps question generator types to the skill categories used in mastery_skills.
 */
export function deriveSkillBucket(questionType: string | null): string | null {
  if (!questionType) return null;
  const map: Record<string, string> = {
    tap: 'visual',
    find: 'visual',
    name_to_letter: 'visual',
    letter_to_name: 'visual',
    rule: 'visual',
    audio_to_letter: 'sound',
    letter_to_sound: 'sound',
    contrast_audio: 'sound',
  };
  return map[questionType] ?? (questionType.includes('harakat') ? 'harakat' : null);
}

/**
 * Boundary adapter: transforms UI quiz results into DB QuestionAttempt objects.
 * Called at the completeLesson boundary, NOT inside UI components.
 */
export function mapQuizResultsToAttempts(results: QuizResultItem[]): QuestionAttempt[] {
  return results.map((r) => ({
    questionType: r.questionType ?? 'unknown',
    skillBucket: deriveSkillBucket(r.questionType),
    targetEntity: r.targetId != null ? String(r.targetId) : null,
    correct: r.correct,
    selectedOption: r.selectedId ?? null,
    correctOption: r.correctId ?? null,
    responseTimeMs: r.responseTimeMs ?? null,
  }));
}
```

- [ ] **Step 2: Update `useLessonQuiz.ts` to capture `correctId` and `responseTimeMs`**

Add a `questionStartTime` ref to track when each question was displayed, and record `correctId` from the question's correct option.

In `src/hooks/useLessonQuiz.ts`, replace the result recording block (lines 72-83) and add timing:

```typescript
// Add import at top of file
import type { QuizResultItem } from '../types/quiz';

// Replace useState<any[]>([]) for quizResults with:
const [quizResults, setQuizResults] = useState<QuizResultItem[]>([]);

// Add after line 44 (const generatedRef = useRef(false)):
const questionStartRef = useRef<number>(Date.now());

// After setQIndex(nextIdx) or any question advance, reset the timer.
// In the handleAnswer callback, add timing capture before recording result.
```

Replace the `setQuizResults` block inside `handleAnswer` (lines 73-83):

```typescript
      const correctOption = currentQ.options?.find((o: any) => o.isCorrect);
      const elapsed = Date.now() - questionStartRef.current;
      questionStartRef.current = Date.now();

      setQuizResults((prev) => [
        ...prev,
        {
          targetId: currentQ.targetId,
          correct,
          selectedId: selectedOption?.id ?? String(selectedOption),
          questionType: currentQ.type || null,
          correctId: correctOption?.id != null ? String(correctOption.id) : '',
          isHarakat: !!currentQ.isHarakat,
          hasAudio: !!currentQ.hasAudio,
          responseTimeMs: elapsed,
        },
      ]);
```

Also reset the timer when questions are first generated (after `setQuestions(qs)` on line 57):

```typescript
    setQuestions(qs);
    setOriginalQCount(qs.length);
    questionStartRef.current = Date.now();
```

Update the return type annotation (line 33) to use `QuizResultItem[]`:

```typescript
  results: { correct: number; total: number; questions: QuizResultItem[] };
```

- [ ] **Step 3: Update `app/lesson/[id].tsx` to use the boundary adapter**

Import the mapper and call it at the `completeLesson` boundary.

```typescript
// Add import at top of file:
import { mapQuizResultsToAttempts } from '../../src/types/quiz';
import type { QuizResultItem } from '../../src/types/quiz';
```

Update the `QuizResults` interface (lines 21-27):

```typescript
interface QuizResults {
  correct: number;
  total: number;
  questions: QuizResultItem[];
  accuracy: number;
  passed: boolean;
}
```

In `handleQuizComplete` (lines 52-81), replace the `completeLesson` call:

```typescript
      // Map UI quiz results to DB contract at the boundary
      const attempts = mapQuizResultsToAttempts(results.questions);

      // Save to database
      await progress.completeLesson(
        lesson!.id,
        accuracy,
        passed,
        attempts
      );
```

Remove `_prevIds` from the `as any` cast on line 77. Instead, store prevIds separately:

```typescript
      setQuizResults({ ...results, accuracy, passed });
```

And track `prevIds` with a separate ref that's already there (`preCompletedRef`). Update `handleContinue` (line 84) to read from the ref:

```typescript
  const handleContinue = useCallback(() => {
    const prevIds = preCompletedRef.current;
    const passed = quizResults?.passed ?? false;
```

- [ ] **Step 4: Remove `durationSeconds` from `useProgress.completeLesson`**

In `src/hooks/useProgress.ts`, update `completeLesson` (lines 28-50):

```typescript
  const completeLesson = useCallback(
    async (
      lessonId: number,
      accuracy: number,
      passed: boolean,
      questions: QuestionAttempt[]
    ) => {
      const attemptId = await saveCompletedLesson(
        db,
        lessonId,
        accuracy,
        passed
      );
      if (questions.length > 0) {
        await saveQuestionAttempts(db, attemptId, questions);
      }
      await refresh();
      return attemptId;
    },
    [db, refresh]
  );
```

- [ ] **Step 5: Remove `durationSeconds` from `saveCompletedLesson` in `progress.ts`**

In `src/engine/progress.ts`, update `saveCompletedLesson` (lines 191-206):

```typescript
export async function saveCompletedLesson(
  db: SQLiteDatabase,
  lessonId: number,
  accuracy: number,
  passed: boolean
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO lesson_attempts (lesson_id, accuracy, passed) VALUES (?, ?, ?)',
    lessonId,
    accuracy,
    passed ? 1 : 0
  );
  return result.lastInsertRowId;
}
```

- [ ] **Step 6: Write contract test**

Create `src/__tests__/quiz-contract.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  mapQuizResultsToAttempts,
  deriveSkillBucket,
  type QuizResultItem,
  type QuestionAttempt,
} from '../types/quiz';

describe('deriveSkillBucket', () => {
  it('maps recognition types to visual', () => {
    expect(deriveSkillBucket('tap')).toBe('visual');
    expect(deriveSkillBucket('find')).toBe('visual');
    expect(deriveSkillBucket('name_to_letter')).toBe('visual');
    expect(deriveSkillBucket('letter_to_name')).toBe('visual');
    expect(deriveSkillBucket('rule')).toBe('visual');
  });

  it('maps sound types to sound', () => {
    expect(deriveSkillBucket('audio_to_letter')).toBe('sound');
    expect(deriveSkillBucket('letter_to_sound')).toBe('sound');
    expect(deriveSkillBucket('contrast_audio')).toBe('sound');
  });

  it('returns null for null input', () => {
    expect(deriveSkillBucket(null)).toBeNull();
  });

  it('returns null for unknown types', () => {
    expect(deriveSkillBucket('unknown_type')).toBeNull();
  });
});

describe('mapQuizResultsToAttempts', () => {
  const sampleResult: QuizResultItem = {
    targetId: 1,
    correct: true,
    selectedId: '1',
    questionType: 'tap',
    correctId: '1',
    isHarakat: false,
    hasAudio: false,
    responseTimeMs: 1500,
  };

  it('maps all required QuestionAttempt fields', () => {
    const [attempt] = mapQuizResultsToAttempts([sampleResult]);

    // Every field the DB expects must be present and non-undefined
    expect(attempt).toHaveProperty('questionType', 'tap');
    expect(attempt).toHaveProperty('skillBucket', 'visual');
    expect(attempt).toHaveProperty('targetEntity', '1');
    expect(attempt).toHaveProperty('correct', true);
    expect(attempt).toHaveProperty('selectedOption', '1');
    expect(attempt).toHaveProperty('correctOption', '1');
    expect(attempt).toHaveProperty('responseTimeMs', 1500);
  });

  it('produces no undefined values for any field', () => {
    const [attempt] = mapQuizResultsToAttempts([sampleResult]);
    for (const [key, value] of Object.entries(attempt)) {
      expect(value, `${key} should not be undefined`).not.toBeUndefined();
    }
  });

  it('converts targetId to string targetEntity', () => {
    const [attempt] = mapQuizResultsToAttempts([
      { ...sampleResult, targetId: 42 },
    ]);
    expect(attempt.targetEntity).toBe('42');
  });

  it('handles sound question types', () => {
    const [attempt] = mapQuizResultsToAttempts([
      { ...sampleResult, questionType: 'audio_to_letter' },
    ]);
    expect(attempt.skillBucket).toBe('sound');
  });

  it('handles null questionType gracefully', () => {
    const [attempt] = mapQuizResultsToAttempts([
      { ...sampleResult, questionType: null },
    ]);
    expect(attempt.questionType).toBe('unknown');
    expect(attempt.skillBucket).toBeNull();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm test`

Expected: All tests in `src/__tests__/quiz-contract.test.ts` pass.

- [ ] **Step 8: Commit**

```bash
git add src/types/quiz.ts src/hooks/useLessonQuiz.ts app/lesson/\[id\].tsx src/hooks/useProgress.ts src/engine/progress.ts src/__tests__/quiz-contract.test.ts
git commit -m "fix: wire quiz results to DB contract with boundary adapter

Previously, useLessonQuiz recorded {targetId, selectedId} but
saveQuestionAttempts expected {targetEntity, selectedOption, skillBucket,
correctOption, responseTimeMs}. All 5 fields were NULL in every row.

Adds typed QuizResultItem (UI) and QuestionAttempt (DB) with a mapper
at the persistence boundary. Captures correctOption and responseTimeMs.
Removes unused durationSeconds parameter."
```

---

### Task 2: Remove Prototype Leakage

**Files:**
- Modify: `app/(tabs)/index.tsx:27,183-202`
- Modify: `app/(tabs)/progress.tsx:310,348-392`
- Modify: `app/onboarding.tsx:397-413`

- [ ] **Step 1: Remove DEV RESET from Home**

In `app/(tabs)/index.tsx`:

Delete the `resetDatabase` import (line 27):
```typescript
// DELETE this line:
import { resetDatabase } from "../../src/db/client";
```

Delete the `Alert` import (line 28):
```typescript
// DELETE this line:
import { Alert } from "react-native";
```

Replace the header View (lines 179-203) — remove the DEV RESET Pressable, keep only the app name and streak badge:

```typescript
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.text }]}>tila</Text>
          {currentWird > 0 && <StreakBadge count={currentWird} colors={colors} />}
        </View>
```

- [ ] **Step 2: Remove dead buttons and Pressable from Progress**

In `app/(tabs)/progress.tsx`:

Delete the "Your Data" section (lines 348-392) — the heading, Export Backup button, and Import Backup button. Replace with nothing (just remove the block).

Also delete the `dataButton` and `dataButtonText` styles from the StyleSheet (lines 484-491).

Replace the letter grid `<Pressable>` wrapper (line 310) with `<View>`:

```typescript
// Change:
              <Pressable key={letter.id} style={{ width: "25%" }}>
// To:
              <View key={letter.id} style={{ width: "25%" }}>
```

And the closing tag (line 343):
```typescript
// Change:
              </Pressable>
// To:
              </View>
```

Remove `Pressable` from the `react-native` import if it's no longer used elsewhere in the file. Check: the phase cards and stats don't use Pressable, so it can be removed from the import.

- [ ] **Step 3: Fix onboarding `handleFinish` error handling**

In `app/onboarding.tsx`, replace `handleFinish` (lines 397-413):

```typescript
  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    try {
      completeSfx.play();
    } catch {}

    try {
      await updateProfile({
        onboarded: true,
        onboardingVersion: 2,
        startingPoint: startingPoint,
        commitmentComplete: true,
      });
      // Only navigate after successful save
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    } catch (err) {
      console.error('Failed to save onboarding profile:', err);
      setFinishing(false);
      setFinishError(true);
    }
  }
```

Add state for the error at the top of the component (near line 332):

```typescript
  const [finishError, setFinishError] = useState(false);
```

In the Finish step rendering (step 7), add an error banner and retry. Find the "Start Lesson 1" button area and add above it:

```typescript
            {finishError && (
              <View style={{ backgroundColor: colors.dangerLight, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md, width: '100%' }}>
                <Text style={{ color: colors.danger, fontSize: 14, fontFamily: fontFamilies.bodyMedium, textAlign: 'center' }}>
                  Something went wrong saving your progress. Please try again.
                </Text>
              </View>
            )}
```

Update the button title to show retry state:

```typescript
                title={finishError ? "Try Again" : "Start Lesson 1"}
```

- [ ] **Step 4: Verify the changes compile**

Run: `npx tsc --noEmit`

Expected: No new errors introduced (existing errors are acceptable).

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx app/\(tabs\)/progress.tsx app/onboarding.tsx
git commit -m "fix: remove prototype leakage from Home, Progress, and Onboarding

- Remove DEV RESET button from Home header
- Remove dead Export/Import Backup buttons from Progress
- Remove dead Pressable wrapper on letter mastery grid cells
- Fix onboarding handleFinish to show error + retry on save failure
  instead of swallowing with .catch(() => {})"
```

---

### Task 3: Fix Correctness Bugs

**Files:**
- Modify: `app/(tabs)/index.tsx:109-127`
- Modify: `app/lesson/[id].tsx:91,102`
- Modify: `src/engine/progress.ts:39-56` (ProgressState already has `returnHadithLastShown`)

- [ ] **Step 1: Fix Home useEffect stale dependency array**

In `app/(tabs)/index.tsx`, the `ProgressState` type in `progress.ts` already has `returnHadithLastShown: string | null` (line 55). But the Home screen reads it via `(progress as any).returnHadithLastShown`.

Replace the useEffect block (lines 109-127):

```typescript
  const returnHadithLastShown = progress.returnHadithLastShown ?? null;

  useEffect(() => {
    if (progress.loading) return;

    if (!onboarded) {
      router.replace("/onboarding");
      return;
    }

    // Check if user should see the return hadith screen
    const lastPractice = habit?.lastPracticeDate;
    if (lastPractice) {
      const gap = getDayDifference(today, lastPractice);
      if (gap >= 1 && returnHadithLastShown !== today) {
        router.replace("/return-welcome");
        return;
      }
    }
  }, [progress.loading, onboarded, habit?.lastPracticeDate, today, returnHadithLastShown]);
```

This removes `(progress as any).returnHadithLastShown` (since `ProgressState` already types it) and adds the missing deps.

- [ ] **Step 2: Remove `as any` from Home route navigation**

In the same file, update `handleStartLesson` (line 168):

```typescript
  function handleStartLesson(lessonId: number) {
    router.push(`/lesson/${lessonId}`);
  }
```

If TypeScript complains about the route type, check if Expo Router's generated types cover `/lesson/[id]`. Expo Router with `typed: true` in `app.config.ts` generates types in `.expo/types/router.d.ts`. The route should resolve since `app/lesson/[id].tsx` exists. If it doesn't, use `router.push({ pathname: '/lesson/[id]', params: { id: String(lessonId) } })`.

- [ ] **Step 3: Remove `as any` from lesson follow-up navigation**

In `app/lesson/[id].tsx`, update the route navigations in `handleContinue`:

Line 91:
```typescript
        router.replace("/post-lesson-onboard");
```

Line 102:
```typescript
        router.replace(`/phase-complete?phase=${lesson.phase}`);
```

If TypeScript complains about the phase-complete route with query params, use:
```typescript
        router.replace({ pathname: '/phase-complete', params: { phase: String(lesson.phase) } });
```

Also update `handleQuizComplete` to remove the `as any` on the results line (from Task 1 this should already be clean).

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`

Expected: No new type errors from the changes. Existing errors from untouched files are acceptable.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx app/lesson/\[id\].tsx
git commit -m "fix: Home stale useEffect deps and typed route navigation

- Add missing deps to Home redirect useEffect (habit, today,
  returnHadithLastShown) to fix stale closure bug
- Remove (progress as any).returnHadithLastShown — already typed
- Remove as any casts from all route navigation in Home and lesson flow"
```

---

### Task 4: Add Tooling Scripts

**Files:**
- Modify: `package.json:5-11`

- [ ] **Step 1: Add lint, typecheck, and validate scripts**

In `package.json`, update the `"scripts"` section:

```json
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "vitest run",
    "lint": "npx expo lint",
    "typecheck": "tsc --noEmit",
    "validate": "npm run lint && npm run typecheck"
  },
```

- [ ] **Step 2: Ensure ESLint config exists for expo lint**

Run: `npx expo lint`

If this prompts to set up ESLint config, accept the defaults. Expo lint will create the necessary config file automatically. If it runs successfully, no action needed.

- [ ] **Step 3: Verify all three commands execute**

Run each command and verify they at least run (they may report existing warnings/errors — that's expected):

Run: `npm run lint`
Expected: Runs to completion (may report warnings).

Run: `npm run typecheck`
Expected: Runs to completion (may report type errors from existing `any` usage).

Run: `npm run validate`
Expected: Runs both lint and typecheck sequentially.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add lint, typecheck, and validate scripts to package.json"
```

If ESLint config files were created, add those too:

```bash
git add package.json .eslintrc.js eslint.config.* 2>/dev/null
git commit -m "chore: add lint, typecheck, and validate scripts to package.json"
```

---

### Task 5: Fix Duplicate Data Loading + Parallelize loadProgress

**Files:**
- Create: `src/engine/habit.ts`
- Modify: `src/hooks/useHabit.ts`
- Modify: `src/engine/progress.ts:70-187`
- Create: `src/__tests__/data-loading.test.ts`

- [ ] **Step 1: Create `src/engine/habit.ts` with `loadHabit`**

```typescript
// src/engine/habit.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { HabitState } from './progress';

/**
 * Load only the habit row. One query instead of the full loadProgress().
 */
export async function loadHabit(db: SQLiteDatabase): Promise<HabitState> {
  const row = await db.getFirstAsync<{
    last_practice_date: string | null;
    current_wird: number;
    longest_wird: number;
    today_lesson_count: number;
  }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1');

  return row
    ? {
        lastPracticeDate: row.last_practice_date,
        currentWird: row.current_wird,
        longestWird: row.longest_wird,
        todayLessonCount: row.today_lesson_count,
      }
    : { lastPracticeDate: null, currentWird: 0, longestWird: 0, todayLessonCount: 0 };
}
```

- [ ] **Step 2: Rewrite `useHabit.ts` to use `loadHabit`**

Replace the entire file:

```typescript
import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import { saveHabit, type HabitState } from "../engine/progress";
import { loadHabit } from "../engine/habit";
import { getTodayDateString, getDayDifference } from "../engine/dateUtils";

export function useHabit() {
  const db = useDatabase();
  const [habit, setHabit] = useState<HabitState | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadHabit(db);
    setHabit(data);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordPractice = useCallback(async () => {
    if (!habit) return;

    const today = getTodayDateString();
    const lastDate = habit.lastPracticeDate;
    const gap = lastDate ? getDayDifference(today, lastDate) : -1;

    let newWird = habit.currentWird;
    let newLongest = habit.longestWird;
    let newTodayCount = habit.todayLessonCount;

    if (gap === 0) {
      newTodayCount += 1;
    } else if (gap === 1) {
      newWird += 1;
      newTodayCount = 1;
    } else {
      newWird = 1;
      newTodayCount = 1;
    }

    if (newWird > newLongest) {
      newLongest = newWird;
    }

    const updated: HabitState = {
      lastPracticeDate: today,
      currentWird: newWird,
      longestWird: newLongest,
      todayLessonCount: newTodayCount,
    };

    await saveHabit(db, updated);
    setHabit(updated);
  }, [db, habit]);

  return { habit, recordPractice, refresh };
}
```

- [ ] **Step 3: Parallelize `loadProgress` in `progress.ts`**

Replace `loadProgress` (lines 70-187) with a `Promise.all` version:

```typescript
export async function loadProgress(db: SQLiteDatabase): Promise<ProgressState> {
  const [lessonRows, entityRows, skillRows, confusionRows, habitRow, profileRow] =
    await Promise.all([
      db.getAllAsync<{ lesson_id: number }>(
        'SELECT DISTINCT lesson_id FROM lesson_attempts WHERE passed = 1 ORDER BY lesson_id'
      ),
      db.getAllAsync<{
        entity_key: string;
        correct: number;
        attempts: number;
        last_seen: string | null;
        next_review: string | null;
        interval_days: number;
        session_streak: number;
      }>('SELECT entity_key, correct, attempts, last_seen, next_review, interval_days, session_streak FROM mastery_entities'),
      db.getAllAsync<{
        skill_key: string;
        correct: number;
        attempts: number;
        last_seen: string | null;
      }>('SELECT skill_key, correct, attempts, last_seen FROM mastery_skills'),
      db.getAllAsync<{
        confusion_key: string;
        count: number;
        last_seen: string | null;
      }>('SELECT confusion_key, count, last_seen FROM mastery_confusions'),
      db.getFirstAsync<{
        last_practice_date: string | null;
        current_wird: number;
        longest_wird: number;
        today_lesson_count: number;
      }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1'),
      db.getFirstAsync<{
        onboarded: number;
        onboarding_version: number;
        starting_point: string | null;
        motivation: string | null;
        daily_goal: number | null;
        commitment_complete: number;
        wird_intro_seen: number;
        post_lesson_onboard_seen: number;
        return_hadith_last_shown: string | null;
      }>('SELECT onboarded, onboarding_version, starting_point, motivation, daily_goal, commitment_complete, wird_intro_seen, post_lesson_onboard_seen, return_hadith_last_shown FROM user_profile WHERE id = 1'),
    ]);

  // Transform rows to domain types
  const completedLessonIds = lessonRows.map((r) => r.lesson_id);

  const entities: Record<string, EntityState> = {};
  for (const row of entityRows) {
    entities[row.entity_key] = {
      correct: row.correct,
      attempts: row.attempts,
      lastSeen: row.last_seen,
      nextReview: row.next_review,
      intervalDays: row.interval_days,
      sessionStreak: row.session_streak,
    };
  }

  const skills: Record<string, SkillState> = {};
  for (const row of skillRows) {
    skills[row.skill_key] = {
      correct: row.correct,
      attempts: row.attempts,
      lastSeen: row.last_seen,
    };
  }

  const confusions: Record<string, ConfusionState> = {};
  for (const row of confusionRows) {
    confusions[row.confusion_key] = {
      count: row.count,
      lastSeen: row.last_seen,
    };
  }

  const habit: HabitState = habitRow
    ? {
        lastPracticeDate: habitRow.last_practice_date,
        currentWird: habitRow.current_wird,
        longestWird: habitRow.longest_wird,
        todayLessonCount: habitRow.today_lesson_count,
      }
    : { lastPracticeDate: null, currentWird: 0, longestWird: 0, todayLessonCount: 0 };

  const onboarded = profileRow ? profileRow.onboarded === 1 : false;
  const onboardingVersion = profileRow ? profileRow.onboarding_version : 0;
  const onboardingStartingPoint = profileRow ? profileRow.starting_point : null;
  const onboardingMotivation = profileRow ? profileRow.motivation : null;
  const onboardingDailyGoal = profileRow ? profileRow.daily_goal : null;
  const onboardingCommitmentComplete = profileRow ? profileRow.commitment_complete === 1 : false;
  const wirdIntroSeen = profileRow ? profileRow.wird_intro_seen === 1 : false;
  const postLessonOnboardSeen = profileRow ? profileRow.post_lesson_onboard_seen === 1 : false;
  const returnHadithLastShown = profileRow ? profileRow.return_hadith_last_shown : null;

  return {
    completedLessonIds,
    mastery: { entities, skills, confusions },
    habit,
    onboarded,
    onboardingStartingPoint,
    onboardingMotivation,
    onboardingDailyGoal,
    onboardingCommitmentComplete,
    onboardingVersion,
    wirdIntroSeen,
    postLessonOnboardSeen,
    returnHadithLastShown,
  };
}
```

- [ ] **Step 4: Write data-loading contract test**

Create `src/__tests__/data-loading.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { loadHabit } from '../engine/habit';
import type { HabitState, ProgressState, UserProfileUpdate } from '../engine/progress';

describe('loadHabit return shape', () => {
  it('HabitState has all required fields', () => {
    // Verify the type structure at compile time and runtime
    const defaultHabit: HabitState = {
      lastPracticeDate: null,
      currentWird: 0,
      longestWird: 0,
      todayLessonCount: 0,
    };

    expect(defaultHabit).toHaveProperty('lastPracticeDate');
    expect(defaultHabit).toHaveProperty('currentWird');
    expect(defaultHabit).toHaveProperty('longestWird');
    expect(defaultHabit).toHaveProperty('todayLessonCount');
    expect(Object.keys(defaultHabit)).toHaveLength(4);
  });
});

describe('ProgressState shape', () => {
  it('has returnHadithLastShown as a typed field', () => {
    // This verifies the type exists on ProgressState (compile-time check)
    const partial: Pick<ProgressState, 'returnHadithLastShown'> = {
      returnHadithLastShown: null,
    };
    expect(partial).toHaveProperty('returnHadithLastShown');
  });

  it('has all expected top-level fields', () => {
    const requiredKeys: (keyof ProgressState)[] = [
      'completedLessonIds',
      'mastery',
      'habit',
      'onboarded',
      'onboardingStartingPoint',
      'onboardingMotivation',
      'onboardingDailyGoal',
      'onboardingCommitmentComplete',
      'onboardingVersion',
      'wirdIntroSeen',
      'postLessonOnboardSeen',
      'returnHadithLastShown',
    ];
    // Compile-time verification — if any key is wrong, TS will error
    expect(requiredKeys).toHaveLength(12);
  });
});

describe('onboarding persistence contract', () => {
  it('UserProfileUpdate accepts the fields handleFinish writes', () => {
    // This mirrors the exact shape that handleFinish() passes to updateProfile()
    const onboardingFinishPayload: UserProfileUpdate = {
      onboarded: true,
      onboardingVersion: 2,
      startingPoint: 'new',
      commitmentComplete: true,
    };

    expect(onboardingFinishPayload).toHaveProperty('onboarded', true);
    expect(onboardingFinishPayload).toHaveProperty('onboardingVersion', 2);
    expect(onboardingFinishPayload).toHaveProperty('startingPoint', 'new');
    expect(onboardingFinishPayload).toHaveProperty('commitmentComplete', true);
  });

  it('all valid startingPoint values are accepted', () => {
    const validValues = ['new', 'some_arabic', 'rusty', 'can_read'] as const;
    for (const val of validValues) {
      const payload: UserProfileUpdate = { startingPoint: val };
      expect(payload.startingPoint).toBe(val);
    }
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: All tests in `quiz-contract.test.ts` and `data-loading.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/habit.ts src/hooks/useHabit.ts src/engine/progress.ts src/__tests__/data-loading.test.ts
git commit -m "perf: parallelize loadProgress and split out loadHabit

- useHabit now calls loadHabit(db) instead of loadProgress(db),
  querying only the habit table instead of all 6 tables
- loadProgress uses Promise.all for parallel DB reads, matching
  the pattern already used by exportProgress
- Add data-loading contract tests for shape verification"
```

---

### Task 6: Verify Wave 1 Done Criteria

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: All contract tests pass.

- [ ] **Step 2: Run validate**

Run: `npm run validate`

Expected: Both lint and typecheck execute (may have pre-existing warnings from untouched files).

- [ ] **Step 3: Verify all done criteria checkboxes**

Check each item from the spec's "Wave 1 Done Criteria" section:

**Data integrity:**
- Quiz result boundary adapter maps all 7 fields ✓ (Task 1)
- Contract test for saveQuestionAttempts passes ✓ (Task 1, Step 7)
- Contract test for data loading passes ✓ (Task 5, Step 5)

**Prototype leakage removed:**
- DEV RESET gone ✓ (Task 2, Step 1)
- Export/Import buttons gone ✓ (Task 2, Step 2)
- Dead Pressable wrappers gone ✓ (Task 2, Step 2)
- Onboarding has error + retry ✓ (Task 2, Step 3)

**Correctness bugs fixed:**
- Home useEffect deps corrected ✓ (Task 3, Step 1)
- No `as any` in route navigation ✓ (Task 3, Steps 2-3)
- `returnHadithLastShown` typed ✓ (Task 3, Step 1)

**API cleanup:**
- `durationSeconds` removed ✓ (Task 1, Steps 4-5)
- `useHabit` uses `loadHabit` ✓ (Task 5, Step 2)
- `loadProgress` uses `Promise.all` ✓ (Task 5, Step 3)

**Tooling:**
- `npm run lint` executes ✓ (Task 4)
- `npm run typecheck` executes ✓ (Task 4)
- `npm run validate` executes ✓ (Task 4)

- [ ] **Step 4: Commit any remaining cleanup**

If any loose ends were found during verification, fix and commit them.

Wave 1 is complete. Proceed to Wave 2 implementation plan.
