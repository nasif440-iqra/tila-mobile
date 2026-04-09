# Lesson Quality Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform 18 generic quiz-only lessons into a hybrid teach/practice model with hand-authored teaching moments and generated practice items.

**Architecture:** Add `teachingSequence` and `exitSequence` arrays to `LessonV2`. Create a `PresentExercise` UI component for non-interactive teaching screens. Update `useLessonQuizV2` to concatenate authored + generated + exit items. Update scoring to exclude `present` items. Hand-author ~78 teaching items across 18 lessons using template patterns.

**Tech Stack:** TypeScript, React Native, Expo, Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-lesson-quality-redesign.md`

---

## File Structure

### New files
- `src/components/exercises-v2/PresentExercise.tsx` — Non-interactive teaching screen UI
- `src/__tests__/engine/authored-items.test.ts` — Validation tests for authored item rules

### Modified files
- `src/types/exercise.ts` — Add `"present"` to `ExerciseItem.type` union
- `src/types/curriculum-v2.ts` — Add `teachingSequence`, `exitSequence` to `LessonV2`
- `src/components/exercises-v2/ExerciseRenderer.tsx` — Route `present` type to `PresentExercise`
- `src/hooks/useLessonQuizV2.ts` — Concatenate authored + generated + exit items, skip `present` in scoring
- `src/engine/v2/scoring.ts` — Filter out `present` items before calculating percentages
- `src/engine/v2/validation.ts` — Add authored item validation rules
- `src/components/exercises-v2/LessonRunnerV2.tsx` — Handle present items (no answer callback)
- `src/data/curriculum-v2/lessons.ts` — All 18 lessons rewritten with teachingSequence/exitSequence

---

### Task 1: Add `present` to type system and create PresentExercise component

**Files:**
- Modify: `src/types/exercise.ts`
- Modify: `src/types/curriculum-v2.ts`
- Create: `src/components/exercises-v2/PresentExercise.tsx`
- Modify: `src/components/exercises-v2/ExerciseRenderer.tsx`

- [ ] **Step 1: Add `"present"` to the ExerciseItem type union**

In `src/types/exercise.ts`, the `ExerciseItem.type` field currently uses `ExerciseStep["type"]`. We need `present` to be a valid value. Since `present` is authored-only and not in `ExerciseStep`, add it directly:

```typescript
// In src/types/exercise.ts, change:
export interface ExerciseItem {
  type: ExerciseStep["type"];
// To:
export interface ExerciseItem {
  type: ExerciseStep["type"] | "present";
```

- [ ] **Step 2: Add `teachingSequence` and `exitSequence` to LessonV2**

In `src/types/curriculum-v2.ts`, add to the `LessonV2` interface:

```typescript
export interface LessonV2 {
  // ... all existing fields unchanged
  teachingSequence?: ExerciseItem[];  // hand-authored teaching moments (present, tap, hear, choose, read)
  exitSequence?: ExerciseItem[];      // hand-authored decode gate items (read, choose — no present)
}
```

Note: We use `ExerciseItem` directly (not a new type) since authored items have the same shape. The spec's `AuthoredExerciseItem` is conceptually the same type — all fields explicitly provided.

- [ ] **Step 3: Create PresentExercise component**

Create `src/components/exercises-v2/PresentExercise.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { Button } from "@/src/design/components/Button";
import { useColors } from "@/src/design/theme";
import { typography, spacing, radii } from "@/src/design/tokens";
import { resolveAudio } from "@/src/audio/audioResolverV2";
import type { AudioResolveResult } from "@/src/audio/audioResolverV2";
import type { ExerciseItem } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onContinue: () => void;
}

export function PresentExercise({ item, onContinue }: Props) {
  const colors = useColors();
  const [audioResult, setAudioResult] = useState<AudioResolveResult | null>(null);

  useEffect(() => {
    const key = item.prompt.audioKey;
    if (key) {
      resolveAudio(key).then(setAudioResult).catch(() => {
        setAudioResult({ type: "placeholder" });
      });
    }
  }, [item.prompt.audioKey]);

  useEffect(() => {
    // Auto-play audio when it becomes available
    if (audioResult?.type === "bundled" && audioResult.play) {
      audioResult.play();
    }
  }, [audioResult]);

  return (
    <View style={styles.container}>
      <ArabicText size="quizHero" style={styles.arabicDisplay}>
        {item.prompt.arabicDisplay}
      </ArabicText>

      {item.prompt.arabicDisplayAlt ? (
        <ArabicText size="large" style={[styles.altDisplay, { color: colors.textSoft }]}>
          {item.prompt.arabicDisplayAlt}
        </ArabicText>
      ) : null}

      {item.prompt.text ? (
        <Text style={[styles.meaning, { color: colors.textSoft }]}>
          {item.prompt.text}
        </Text>
      ) : null}

      <Button title="Continue" onPress={onContinue} style={styles.continueButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  arabicDisplay: {
    textAlign: "center",
  },
  altDisplay: {
    textAlign: "center",
  },
  meaning: {
    ...typography.bodyLarge,
    textAlign: "center",
    maxWidth: 280,
  },
  continueButton: {
    width: "100%",
    marginTop: spacing.xl,
  },
});
```

- [ ] **Step 4: Wire PresentExercise into ExerciseRenderer**

In `src/components/exercises-v2/ExerciseRenderer.tsx`, the current `onAnswer` callback doesn't make sense for `present` items. Add a second prop and handle the `present` case:

```tsx
import { PresentExercise } from "./PresentExercise";

interface ExerciseRendererProps {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
  onPresentContinue?: () => void;
}

export function ExerciseRenderer({ item, onAnswer, onPresentContinue }: ExerciseRendererProps) {
  switch (item.type) {
    case "present":
      return <PresentExercise item={item} onContinue={onPresentContinue ?? (() => {})} />;
    case "tap":
    // ... rest unchanged
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors (existing errors may remain from pre-existing issues).

- [ ] **Step 6: Commit**

```bash
git add src/types/exercise.ts src/types/curriculum-v2.ts src/components/exercises-v2/PresentExercise.tsx src/components/exercises-v2/ExerciseRenderer.tsx
git commit -m "feat(v2): add present exercise type and PresentExercise component"
```

---

### Task 2: Update lesson runner and scoring to support hybrid sequencing

**Files:**
- Modify: `src/hooks/useLessonQuizV2.ts`
- Modify: `src/engine/v2/scoring.ts`
- Modify: `src/components/exercises-v2/LessonRunnerV2.tsx`

- [ ] **Step 1: Update useLessonQuizV2 to concatenate teaching + generated + exit sequences**

In `src/hooks/useLessonQuizV2.ts`, inside the `generate()` function, after `generateV2Exercises` returns, prepend `teachingSequence` and append `exitSequence`:

```typescript
// After line: const generated = await generateV2Exercises(...)
// Add:
const teachingItems = lesson.teachingSequence ?? [];
const exitItems = lesson.exitSequence ?? [];
const allItems = [...teachingItems, ...generated, ...exitItems];

if (!allItems || allItems.length === 0) {
  // ... existing error handling
}

setItems(allItems);
```

Replace the current `setItems(generated)` with `setItems(allItems)`.

- [ ] **Step 2: Skip present items in handleAnswer**

In `useLessonQuizV2.ts`, the `handleAnswer` callback currently scores every item. Add a guard: if the current item is `present`, advance without scoring:

```typescript
const handleAnswer = useCallback(
  (correct: boolean, answerId: string) => {
    const currentItem = items[itemIndex];
    if (!currentItem || phase !== "active") return;

    // Present items are not scored — just advance
    if (currentItem.type === "present") {
      const nextIndex = itemIndex + 1;
      if (nextIndex >= items.length) {
        setPhase("scoring");
      } else {
        setItemIndex(nextIndex);
      }
      return;
    }

    // ... rest of existing scoring logic unchanged
```

- [ ] **Step 3: Add onPresentContinue handler to LessonRunnerV2**

In `src/components/exercises-v2/LessonRunnerV2.tsx`, pass an `onPresentContinue` prop to `ExerciseRenderer`. This calls `handleAnswer` with dummy values (which the guard in Step 2 will intercept):

```tsx
{/* Exercise */}
<ExerciseRenderer
  item={quiz.currentItem}
  onAnswer={quiz.handleAnswer}
  onPresentContinue={() => quiz.handleAnswer(true, "present-continue")}
/>
```

- [ ] **Step 4: Update scoring to filter out present items**

In `src/engine/v2/scoring.ts`, at the top of `evaluateLesson`, filter out `present` items before all calculations:

```typescript
export function evaluateLesson(
  lessonId: number,
  scoredItems: ScoredItem[],
  policy: MasteryPolicy,
  bucketThresholds?: Record<string, number>,
): LessonResult {
  // Filter out present items — they are not scored
  const scorableItems = scoredItems.filter((s) => s.item.type !== "present");

  // ── Overall counts ──
  const totalItems = scorableItems.length;
  const correctItems = scorableItems.filter((s) => s.correct).length;
  // ... replace all remaining references to scoredItems with scorableItems
```

Replace every `scoredItems` reference in the function body with `scorableItems` (for the decode counts, final decode streak, and bucket scores loops).

- [ ] **Step 5: Write test for scoring with present items**

Add to the existing scoring test file (or create inline):

```typescript
// In the scoring tests, add:
it("excludes present items from scoring math", () => {
  const items: ScoredItem[] = [
    { item: { type: "present", isDecodeItem: false } as any, correct: true, responseTimeMs: 0, generatedBy: "present" as any, answerMode: "arabic" },
    { item: { type: "tap", isDecodeItem: false } as any, correct: true, responseTimeMs: 100, generatedBy: "tap", answerMode: "arabic" },
    { item: { type: "read", isDecodeItem: true } as any, correct: false, responseTimeMs: 200, generatedBy: "read", answerMode: "transliteration" },
  ];
  const result = evaluateLesson(1, items, { passThreshold: 0.5 });
  // 2 scorable items (tap + read), 1 correct → 50%
  expect(result.totalItems).toBe(2);
  expect(result.correctItems).toBe(1);
  expect(result.overallPercent).toBe(0.5);
});
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/__tests__/engine/`
Expected: All existing tests pass, new test passes.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useLessonQuizV2.ts src/engine/v2/scoring.ts src/components/exercises-v2/LessonRunnerV2.tsx
git commit -m "feat(v2): hybrid lesson sequencing — teaching + generated + exit with present-item scoring exclusion"
```

---

### Task 3: Add authored item validation rules

**Files:**
- Modify: `src/engine/v2/validation.ts`
- Create: `src/__tests__/engine/authored-items.test.ts`

- [ ] **Step 1: Write failing tests for authored item validation**

Create `src/__tests__/engine/authored-items.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateLesson } from "@/src/engine/v2/validation";
import type { LessonV2 } from "@/src/types/curriculum-v2";
import type { ExerciseItem } from "@/src/types/exercise";

function makeLesson(overrides: Partial<LessonV2>): LessonV2 {
  return {
    id: 99, phase: 1, module: "test", title: "Test", description: "Test",
    teachEntityIds: ["letter:1", "letter:2"],
    reviewEntityIds: [],
    exercisePlan: [],
    masteryPolicy: { passThreshold: 0.85 },
    ...overrides,
  };
}

function makePresent(id: string): ExerciseItem {
  return {
    type: "present",
    prompt: { arabicDisplay: "\u0628", text: "This is Ba" },
    correctAnswer: { kind: "single", value: "none" },
    targetEntityId: "letter:2",
    isDecodeItem: false,
    answerMode: "arabic",
  };
}

function makeReadExit(id: string): ExerciseItem {
  return {
    type: "read",
    prompt: { arabicDisplay: "\u0628\u064E", text: "Read this" },
    options: [
      { id: `${id}-opt-correct`, displayText: "ba", isCorrect: true },
      { id: `${id}-opt-wrong`, displayText: "ma", isCorrect: false },
    ],
    correctAnswer: { kind: "single", value: `${id}-opt-correct` },
    targetEntityId: "combo:ba-fatha",
    isDecodeItem: true,
    answerMode: "transliteration",
  };
}

describe("authored item validation", () => {
  it("rejects present items in exitSequence", async () => {
    const lesson = makeLesson({
      exitSequence: [makePresent("bad-present")],
    });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("present") && e.includes("exitSequence"))).toBe(true);
  });

  it("rejects exitSequence read items without isDecodeItem", async () => {
    const item = makeReadExit("exit-1");
    item.isDecodeItem = false; // should be true
    const lesson = makeLesson({ exitSequence: [item] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("isDecodeItem"))).toBe(true);
  });

  it("rejects authored quiz items with empty options", async () => {
    const item: ExerciseItem = {
      type: "tap",
      prompt: { arabicDisplay: "\u0628", text: "Find Ba" },
      options: [],
      correctAnswer: { kind: "single", value: "opt-1" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    };
    const lesson = makeLesson({ teachingSequence: [item] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("empty options"))).toBe(true);
  });

  it("rejects correctAnswer that does not match any option ID", async () => {
    const item: ExerciseItem = {
      type: "choose",
      prompt: { arabicDisplay: "\u0628", text: "Which?" },
      options: [
        { id: "opt-a", displayArabic: "\u0628", isCorrect: true },
        { id: "opt-b", displayArabic: "\u0645", isCorrect: false },
      ],
      correctAnswer: { kind: "single", value: "opt-nonexistent" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    };
    const lesson = makeLesson({ teachingSequence: [item] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("correctAnswer"))).toBe(true);
  });

  it("rejects duplicate option IDs within authored items", async () => {
    const item1: ExerciseItem = {
      type: "tap",
      prompt: { arabicDisplay: "\u0628", text: "Find Ba" },
      options: [
        { id: "dup-opt", displayArabic: "\u0627", isCorrect: false },
        { id: "dup-opt", displayArabic: "\u0628", isCorrect: true },
      ],
      correctAnswer: { kind: "single", value: "dup-opt" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    };
    const lesson = makeLesson({ teachingSequence: [item1] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("duplicate"))).toBe(true);
  });

  it("accepts valid teachingSequence and exitSequence", async () => {
    const lesson = makeLesson({
      teachingSequence: [makePresent("intro")],
      exitSequence: [makeReadExit("exit-1")],
    });
    const result = await validateLesson(lesson);
    const authoredErrors = result.errors.filter(
      (e) => e.includes("present") || e.includes("exitSequence") || e.includes("authored")
    );
    expect(authoredErrors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/engine/authored-items.test.ts`
Expected: All tests fail (validation rules not implemented yet).

- [ ] **Step 3: Implement authored item validation in validation.ts**

Add to the end of `validateLesson()` in `src/engine/v2/validation.ts`, before the `return` statement:

```typescript
  // ── Authored item validation ──

  const allAuthoredItems = [
    ...(lesson.teachingSequence ?? []),
    ...(lesson.exitSequence ?? []),
  ];

  // Rule A1: exitSequence must not contain present items
  for (const item of (lesson.exitSequence ?? [])) {
    if (item.type === "present") {
      errors.push(
        `Lesson ${lesson.id}: exitSequence contains a "present" item — exit items must be scored`
      );
    }
  }

  // Rule A2: exitSequence read items must have isDecodeItem: true
  for (const item of (lesson.exitSequence ?? [])) {
    if (item.type === "read" && !item.isDecodeItem) {
      errors.push(
        `Lesson ${lesson.id}: exitSequence read item must have isDecodeItem: true`
      );
    }
  }

  // Rule A3: quiz items must have non-empty options
  for (const item of allAuthoredItems) {
    const quizTypes = ["tap", "hear", "choose", "read"];
    if (quizTypes.includes(item.type) && (!item.options || item.options.length === 0)) {
      errors.push(
        `Lesson ${lesson.id}: authored ${item.type} item has empty options array`
      );
    }
  }

  // Rule A4: correctAnswer must match an option or tile
  for (const item of allAuthoredItems) {
    if (item.type === "present") continue;
    if (item.correctAnswer.kind === "single" && item.options) {
      const correctId = item.correctAnswer.value;
      const optionIds = item.options.map((o) => o.id);
      if (!optionIds.includes(correctId)) {
        errors.push(
          `Lesson ${lesson.id}: authored item correctAnswer "${correctId}" does not match any option ID`
        );
      }
    }
  }

  // Rule A5: stable unique IDs — check for duplicate option/tile IDs across all authored items
  const seenOptionIds = new Set<string>();
  for (const item of allAuthoredItems) {
    for (const opt of (item.options ?? [])) {
      if (seenOptionIds.has(opt.id)) {
        errors.push(
          `Lesson ${lesson.id}: duplicate option ID "${opt.id}" in authored items`
        );
      }
      seenOptionIds.add(opt.id);
    }
    for (const tile of (item.tiles ?? [])) {
      if (seenOptionIds.has(tile.id)) {
        errors.push(
          `Lesson ${lesson.id}: duplicate tile ID "${tile.id}" in authored items`
        );
      }
      seenOptionIds.add(tile.id);
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/engine/authored-items.test.ts`
Expected: All 6 tests pass.

- [ ] **Step 5: Run all engine tests**

Run: `npx vitest run src/__tests__/engine/`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/v2/validation.ts src/__tests__/engine/authored-items.test.ts
git commit -m "feat(v2): authored item validation — present exclusion, decode marking, options, IDs"
```

---

### Task 4: Author L1 (Template 0A — Orientation)

**Files:**
- Modify: `src/data/curriculum-v2/lessons.ts`

This is the smallest lesson and proves the `present` type works end-to-end.

- [ ] **Step 1: Rewrite L1 with teachingSequence (fully authored, no exercisePlan)**

Replace the current L1 entry in `src/data/curriculum-v2/lessons.ts`:

```typescript
{
  id: 1, phase: 1, module: "1.1", moduleTitle: "First Real Decoding Wins",
  title: "Arabic Starts Here",
  description: "Orient to right-to-left reading and meet your first two letters",
  teachEntityIds: ["letter:1", "letter:2"],
  reviewEntityIds: [],
  teachingSequence: [
    // Present: Meet Alif
    {
      type: "present",
      prompt: {
        arabicDisplay: "\u0627",
        text: "This is Alif — the first letter of Arabic",
        audioKey: "letter_1",
      },
      correctAnswer: { kind: "single", value: "none" },
      targetEntityId: "letter:1",
      isDecodeItem: false,
      answerMode: "arabic",
    },
    // Present: Meet Ba
    {
      type: "present",
      prompt: {
        arabicDisplay: "\u0628",
        text: "This is Ba",
        audioKey: "letter_2",
      },
      correctAnswer: { kind: "single", value: "none" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    },
    // Guided tap: Find Ba
    {
      type: "tap",
      prompt: {
        arabicDisplay: "\u0628",
        text: "Find Ba",
      },
      options: [
        { id: "L1-tap-opt-alif", displayArabic: "\u0627", isCorrect: false },
        { id: "L1-tap-opt-ba", displayArabic: "\u0628", isCorrect: true },
      ],
      correctAnswer: { kind: "single", value: "L1-tap-opt-ba" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    },
    // Guided hear: Listen for Ba
    {
      type: "hear",
      prompt: {
        arabicDisplay: "",
        audioKey: "letter_2",
        text: "Listen \u2014 which one is it?",
      },
      options: [
        { id: "L1-hear-opt-alif", displayArabic: "\u0627", isCorrect: false },
        { id: "L1-hear-opt-ba", displayArabic: "\u0628", isCorrect: true },
      ],
      correctAnswer: { kind: "single", value: "L1-hear-opt-ba" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "audio",
    },
  ],
  exercisePlan: [],
  masteryPolicy: { passThreshold: 0.5 },
  renderProfile: "isolated",
},
```

Note: No `exitSequence` — L1 is pure orientation. No `exercisePlan` steps — everything is authored. Pass threshold is low (0.5) because there are only 2 scored items.

- [ ] **Step 2: Run validation**

Run: `npx vitest run src/__tests__/engine/validation.test.ts`
Expected: L1 validation passes.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/data/curriculum-v2/lessons.ts
git commit -m "feat(v2): author L1 — orientation template with present items"
```

---

### Task 5: Author L2 (Template 1A — Early New-Letter)

**Files:**
- Modify: `src/data/curriculum-v2/lessons.ts`

L2 proves the full hybrid model: teachingSequence + exercisePlan + exitSequence.

- [ ] **Step 1: Rewrite L2 with hybrid structure**

Replace the current L2 entry:

```typescript
{
  id: 2, phase: 1, module: "1.1",
  title: "Meet Alif + Ba with Fatha",
  description: "Learn \u0627 and \u0628 with fatha and read the first real syllable",
  teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha", "rule:fatha"],
  reviewEntityIds: [],
  teachingSequence: [
    // Present: Fatha mark
    {
      type: "present",
      prompt: {
        arabicDisplay: "\u064E",
        text: "This mark makes an \u2018a\u2019 sound",
      },
      correctAnswer: { kind: "single", value: "none" },
      targetEntityId: "rule:fatha",
      isDecodeItem: false,
      answerMode: "arabic",
    },
    // Present: Ba + Fatha combo
    {
      type: "present",
      prompt: {
        arabicDisplay: "\u0628\u064E",
        text: "Ba with fatha makes \u2018ba\u2019",
        audioKey: "combo_ba-fatha",
      },
      correctAnswer: { kind: "single", value: "none" },
      targetEntityId: "combo:ba-fatha",
      isDecodeItem: false,
      answerMode: "arabic",
    },
    // Guided tap: Find Ba
    {
      type: "tap",
      prompt: { arabicDisplay: "\u0628", text: "Find Ba" },
      options: [
        { id: "L2-tap-opt-alif", displayArabic: "\u0627", isCorrect: false },
        { id: "L2-tap-opt-ba", displayArabic: "\u0628", isCorrect: true },
      ],
      correctAnswer: { kind: "single", value: "L2-tap-opt-ba" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    },
    // Guided hear: Ba-fatha sound
    {
      type: "hear",
      prompt: {
        arabicDisplay: "",
        audioKey: "combo_ba-fatha",
        text: "Listen \u2014 which one is it?",
      },
      options: [
        { id: "L2-hear-opt-alif", displayArabic: "\u0627\u064E", isCorrect: false },
        { id: "L2-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: true },
      ],
      correctAnswer: { kind: "single", value: "L2-hear-opt-ba" },
      targetEntityId: "combo:ba-fatha",
      isDecodeItem: false,
      answerMode: "audio",
    },
  ],
  exercisePlan: [
    // Generated: shape contrast (choose)
    { type: "choose", count: 2, target: "letter", source: { from: "teach" }, distractorStrategy: "shape" },
    // Generated: read practice (transliteration mode for Phase 1)
    { type: "read", count: 1, target: "combo", source: { from: "teach" }, connected: false },
  ],
  exitSequence: [
    // Decode exit: read ba-fatha
    {
      type: "read",
      prompt: { arabicDisplay: "\u0628\u064E", text: "What does this say?" },
      options: [
        { id: "L2-exit-opt-ba", displayText: "ba", isCorrect: true },
        { id: "L2-exit-opt-ma", displayText: "ma", isCorrect: false },
        { id: "L2-exit-opt-la", displayText: "la", isCorrect: false },
      ],
      correctAnswer: { kind: "single", value: "L2-exit-opt-ba" },
      targetEntityId: "combo:ba-fatha",
      isDecodeItem: true,
      answerMode: "transliteration",
    },
    // Decode exit: read alif-fatha
    {
      type: "read",
      prompt: { arabicDisplay: "\u0627\u064E", text: "What does this say?" },
      options: [
        { id: "L2-exit2-opt-a", displayText: "a", isCorrect: true },
        { id: "L2-exit2-opt-ba", displayText: "ba", isCorrect: false },
      ],
      correctAnswer: { kind: "single", value: "L2-exit2-opt-a" },
      targetEntityId: "letter:1",
      isDecodeItem: true,
      answerMode: "transliteration",
    },
  ],
  masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
  renderProfile: "isolated",
},
```

- [ ] **Step 2: Run validation and tests**

Run: `npx vitest run src/__tests__/engine/`
Expected: All tests pass, L2 validates clean.

- [ ] **Step 3: Commit**

```bash
git add src/data/curriculum-v2/lessons.ts
git commit -m "feat(v2): author L2 — early new-letter template with hybrid teach/practice/exit"
```

---

### Task 6: Author L13 and L14 (Templates 4A/4B — Connected Bridge and Chain-Break)

**Files:**
- Modify: `src/data/curriculum-v2/lessons.ts`

These are the hardest teaching moments. L13 bridges isolated → connected. L14 teaches chain-breaking.

- [ ] **Step 1: Rewrite L13 with connected bridge template**

Replace L13 in lessons.ts. Key authored items:

- **Bridge reveal 1**: present with `arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E"` and `arabicDisplayAlt: "\u0628\u064E  \u0645\u064E  \u0644\u064E"` (connected vs spaced isolated). Text: "Same letters, same sounds, new shape".
- **Bridge reveal 2**: present with نَمَلَ connected vs spaced.
- **Guided recognition tap**: "Find Ba inside بَمَلَ" with 2 options (ba, meem).
- **Connected→isolated decomposition choose**: "Which letters make up بَمَلَ?" with option sets showing isolated combos.
- **exitSequence**: 3 hand-authored connected read items (بَمَلَ, نَمَلَ, يَمَلَ) with explicit ramp.

The `exercisePlan` keeps only: `{ type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 }`.

Full authored content will follow the same pattern as L1/L2 — every item has stable IDs prefixed `L13-`.

- [ ] **Step 2: Rewrite L14 with chain-break template**

Replace L14. Key authored items:

- **Bridge reveal**: present showing بَمَلَ (connected) next to بَابَ (broken). Text: "Most letters hold hands. Alif lets go."
- **Second bridge**: present showing هَابَ.
- **Gap contrast choose**: "Which word has a gap?" — 2 options.
- **Wider contrast choose**: 3-4 options mixing chain-break and connected chunks.
- **exitSequence**: 4 hand-authored connected read items (بَابَ, اَبَنَ, هَابَ, بَمَلَ) with ramp.

`exercisePlan` keeps: `{ type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 }`.

- [ ] **Step 3: Run validation and tests**

Run: `npx vitest run src/__tests__/engine/`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/data/curriculum-v2/lessons.ts
git commit -m "feat(v2): author L13 + L14 — connected bridge and chain-break templates"
```

---

### Task 7: Author L17 and L18 (Templates 2B/5 — Sukun and Checkpoint 2)

**Files:**
- Modify: `src/data/curriculum-v2/lessons.ts`

- [ ] **Step 1: Rewrite L17 with sukun template**

Key authored items:
- **Present mark**: sukun circle, "This circle means stop. No vowel sound."
- **Sound vs stop contrast**: present with سَ vs سْ
- **Minimal-pair choose**: سَ vs سْ — "Which one stops?" with audio
- **CVC introduction**: present with بَسْ — "Ba says 'ba', seen stops: 'bas'"
- **exitSequence**: 3 read items (بَسْ, مِنْ, لَمْ), at least one rendered connected to bridge toward L18.

`exercisePlan` keeps: build (chunks) + fix (vowel).

- [ ] **Step 2: Rewrite L18 with checkpoint template**

Key structure:
- **teachingSequence**: 1 confidence opener (easy connected read of بَمَلَ)
- **exercisePlan**: single check step with phase-2-checkpoint profile, count reduced to account for authored items
- **exitSequence**: 3 fixed-order decode gate items — one connected chunk (نَمَلَ), one chain-break (بَابَ), one sukun chunk (مِنْ)

- [ ] **Step 3: Run validation and tests**

Run: `npx vitest run src/__tests__/engine/`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/data/curriculum-v2/lessons.ts
git commit -m "feat(v2): author L17 + L18 — sukun template and checkpoint 2 with decode gate"
```

---

### Task 8: Author remaining Phase 1 lessons (L3, L4, L5, L6, L7)

**Files:**
- Modify: `src/data/curriculum-v2/lessons.ts`

- [ ] **Step 1: Author L3 (Template 1A — Meet Meem)**

teachingSequence: present meem, present مَ, guided tap (meem vs ba), guided hear (مَ vs بَ).
exercisePlan: choose (shape) + build.
exitSequence: 2 read items (مَ easy, بَ review).

- [ ] **Step 2: Author L4 (Template 1A — Meet Laam)**

teachingSequence: present laam, present لَ, guided tap (laam vs meem), guided hear (لَ vs مَ vs بَ).
exercisePlan: choose (shape) + build.
exitSequence: 2 read items (لَ, mixed review).

- [ ] **Step 3: Author L5 (Template 3A — Decoding Sprint)**

teachingSequence: 2-3 hand-authored choose items targeting ba/meem/laam confusion.
exercisePlan: hear (2, generated) + build (2, generated) + read (2, generated).
exitSequence: 2 read items — easy chunk then harder chunk. Explicit ramp.

- [ ] **Step 4: Author L6 (Template 1A — Meet Noon)**

teachingSequence: present noon, present نَ, guided tap (noon vs ba — dot confusion), guided hear.
exercisePlan: choose (shape) + build.
exitSequence: 2 read items.

- [ ] **Step 5: Author L7 (Template 5 — Checkpoint 1)**

teachingSequence: 1 confidence opener (easy choose with بَ).
exercisePlan: check step (phase-1-checkpoint, count adjusted).
exitSequence: 2 read items — one combo (بَ), one chunk (بَمَ). Fixed order.

- [ ] **Step 6: Run validation and all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/data/curriculum-v2/lessons.ts
git commit -m "feat(v2): author L3-L7 — Phase 1 lessons with hybrid templates"
```

---

### Task 9: Author remaining Phase 2 lessons (L8, L9, L10, L11, L12, L15, L16)

**Files:**
- Modify: `src/data/curriculum-v2/lessons.ts`

- [ ] **Step 1: Author L8 (Template 2A — Kasra)**

teachingSequence: present kasra mark, present بِ, minimal-pair choose (بَ vs بِ, 2 options, audio).
exercisePlan: choose (vowel, 3 items) + fix (vowel, 2 items).
exitSequence: 3 read items (بِ easy, مِ vs مَ contrast, لِ).

- [ ] **Step 2: Author L9 (Template 2A — Damma)**

teachingSequence: present damma mark, present بُ, minimal-pair choose (بَ vs بِ vs بُ, 3 options, audio).
exercisePlan: choose (vowel, 3 items) + fix (vowel, 2 items).
exitSequence: 3 read items.

- [ ] **Step 3: Author L10 (Template 3B — Vowel Contrast Drill)**

teachingSequence: 3-4 hand-authored minimal-pair choose items (same letter, 3 vowels, audio mode).
exercisePlan: hear (2, generated).
exitSequence: 4 hand-authored read items with explicit ramp. No build.

- [ ] **Step 4: Author L11 (Template 1B — Meet Yaa)**

teachingSequence: present yaa, present يَ, guided tap (3 options), guided hear.
exercisePlan: choose (shape) + build.
exitSequence: 3 read items (يَ, يِ, يُ with review mix).

- [ ] **Step 5: Author L12 (Template 1B — Meet Haa)**

Same pattern as L11 for haa.

- [ ] **Step 6: Author L15 (Template 1B — Meet Seen)**

Same pattern as L11 for seen.

- [ ] **Step 7: Author L16 (Template 1B+4B — Meet Daal with chain-break)**

teachingSequence: present daal, present دَ, guided tap, guided hear, plus present/read showing daal non-connecting.
exercisePlan: choose + build.
exitSequence: 3 read items rendered in connected form, including chain-break contrast.

- [ ] **Step 8: Run validation and all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 9: Commit**

```bash
git add src/data/curriculum-v2/lessons.ts
git commit -m "feat(v2): author L8-L16 — Phase 2 lessons with hybrid templates"
```

---

### Task 10: Update existing tests for new lesson structure

**Files:**
- Modify: `src/__tests__/engine/generators/dispatcher.test.ts`
- Modify: `src/__tests__/engine/validation.test.ts`

- [ ] **Step 1: Update dispatcher tests**

The dispatcher tests reference specific lessons from `LESSONS_V2`. Now that lessons have `teachingSequence`, the total item count from `generateV2Exercises` will be different (it only returns generated items, not authored ones). Update assertions to match the new `exercisePlan` step counts.

- [ ] **Step 2: Update validation tests**

Add tests verifying that the rewritten lessons pass validation. Update any tests that reference old `exercisePlan` structures that have changed.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All pass.

Run: `npm run validate`
Expected: lint + typecheck clean.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/
git commit -m "test(v2): update dispatcher and validation tests for hybrid lesson structure"
```

---

## Verification

After all tasks complete:

1. `npx vitest run` — all tests pass (0 failures)
2. `npm run validate` — lint + typecheck clean
3. Every lesson in `LESSONS_V2` has either a `teachingSequence`, an `exitSequence`, or both
4. No lesson uses `present` items in `exitSequence`
5. Grep for `transliteration` in choose.ts prompt construction — should NOT appear
6. All authored items have stable unique IDs (grep for `L\d+-` pattern in lessons.ts)
7. `evaluateLesson` correctly excludes `present` items from scoring denominators
