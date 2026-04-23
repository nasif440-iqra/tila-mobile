# A0 — Lesson 1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest end-to-end slice that takes Tila's v3.1.1 curriculum and turns it into a playable Lesson 1 in the Expo app, without waking the quarantined mastery engine or committing to an authoring parser.

**Architecture:** `curriculum/phase-1/01-arabic-starts-here.md` is the human-authored spec; `src/curriculum/lessons/lesson-01.ts` is its hand-compiled runtime twin. A new `LessonData` type models all seven exercise types from curriculum §7. `LessonRunner` gains per-screen `allowBack`, `reportAttempt` for retry-friendly mastery reporting, and outcome computation. Parent route `app/lesson/[id].tsx` hosts the runner, swaps to a generic `LessonCompletionView` on completion, and routes home. `MasteryRecorder` is a real async interface with a no-op A0 impl; completion state for the home card lives in AsyncStorage under a namespaced key.

**Tech Stack:** TypeScript 5.9 (strict), React 19, React Native 0.83, Expo Router 55, Vitest 4.1, @react-native-async-storage/async-storage 2.2, existing design tokens (`src/design/tokens.ts`) and components (`ArabicText`, `Button`).

**Source-of-truth references:**
- Spec: `docs/superpowers/specs/2026-04-22-a0-lesson-1-vertical-slice-design.md`
- Curriculum master: `curriculum/tila_master_curriculum_v3.1.1.md`
- Lesson 1 authoring: `curriculum/phase-1/01-arabic-starts-here.md`

---

## File structure

**New files**

| Path | Responsibility |
|---|---|
| `src/curriculum/types.ts` | Pure types: `LessonData`, `Screen` union, `TeachingBlock` union, `Exercise` union and its seven variants, supporting interfaces. Zero runtime logic. |
| `src/curriculum/runtime/mastery-recorder.ts` | `MasteryRecorder` interface + event types (`EntityAttemptEvent`, `LessonOutcomeEvent`) + `noopMasteryRecorder` implementation. |
| `src/curriculum/runtime/completion-store.ts` | `CompletionStore` interface + `asyncStorageCompletionStore` implementation backed by AsyncStorage under `tila.lesson-completion.<id>` keys. |
| `src/curriculum/runtime/outcome.ts` | Pure `computeLessonOutcome(lesson, outcomes)` function — extracted so the tally/decoding-rule logic is unit-testable without mounting React. |
| `src/curriculum/runtime/url-resolver.ts` | Pure `resolveLessonId(routeParam)` — numeric `/lesson/1` → `"lesson-01"`. |
| `src/curriculum/lessons/lesson-01.ts` | Hand-compiled runtime `LessonData` for Lesson 1. |
| `src/curriculum/lessons/index.ts` | Static `lessonRegistry: Record<string, LessonData>` keyed by `LessonData.id`. |
| `src/curriculum/ui/TeachingScreenView.tsx` | Renders `TeachingBlock[]` union. |
| `src/curriculum/ui/LessonChrome.tsx` | Header (back + part label + close) + softened progress bar + hardware-back confirm dialog. |
| `src/curriculum/ui/LessonCompletionView.tsx` | Intra-route completion screen with optional glyph preview. |
| `src/curriculum/ui/exercises/TapExercise.tsx` | Tap renderer (until-correct + one-shot modes). |
| `src/curriculum/ui/exercises/HearExercise.tsx` | Hear renderer (Lesson 1's unscored listen variant; future options-scored variant stubbed). |
| `src/curriculum/ui/exercises/index.ts` | Dispatcher: `renderExercise(exercise, { advance, reportAttempt })`. |
| `app/lesson/[id].tsx` | Dynamic lesson route. Resolves ID → `LessonData`, mounts `LessonChrome` + `LessonRunner`, handles completion swap and routing. |
| `src/__tests__/curriculum/mastery-recorder.test.ts` | Noop impl contract. |
| `src/__tests__/curriculum/completion-store.test.ts` | AsyncStorage read/write, namespacing, graceful failure. |
| `src/__tests__/curriculum/outcome.test.ts` | Pass/fail computation, decoding rule, trivial + Lesson-1-by-construction cases. |
| `src/__tests__/curriculum/url-resolver.test.ts` | Numeric → canonical ID mapping. |
| `src/__tests__/curriculum/lesson-01-shape.test.ts` | Structural validation of encoded Lesson 1 data against the type contract + markdown-vs-TS invariants. |

**Modified files**

| Path | Change |
|---|---|
| `src/curriculum/runtime/cursor.ts` | Add `retreatCursor`. |
| `src/__tests__/curriculum-cursor.test.ts` | Add retreat-case coverage. |
| `src/curriculum/runtime/LessonRunner.tsx` | Rewrite: commit to `LessonData` shape, add `goBack`/`canGoBack`/`reportAttempt`/outcome emission. |
| `app/sandbox-lesson.tsx` | Migrate to a tiny `LessonData` smoke-test instead of the removed `RefScreen` generic. |
| `src/curriculum/README.md` | Update "When the blueprint arrives" section — it has arrived. |
| `app/(tabs)/index.tsx` | Wrap existing home content with a single Lesson 1 CTA card that reflects completion state. |

**Removed files**

| Path | Why |
|---|---|
| `src/curriculum/reference/lesson.ts` | `RefScreen` replaced by `LessonData` in sandbox migration. |
| `src/curriculum/reference/types.ts` | Same. |
| `src/__tests__/curriculum-reference-lesson.test.ts` | Test covers the old `RefScreen` contract that no longer exists. |

---

## Execution order rationale

Tasks 1–4 establish types and pure helpers with no React dependency. Task 5 rewrites the runner, which breaks the sandbox's compile; Task 6 migrates the sandbox atomically within the same task split to restore the build. Tasks 7–8 ship Lesson 1 data. Tasks 9–14 build UI pieces bottom-up (atomic renderers → dispatcher → chrome → completion view). Tasks 15–16 wire the route and home card. Task 17 is the final manual smoke test.

Every task is atomic and committable. Tests-first for pure logic; manual smoke for React components (per spec §9.2 — integration tests deferred).

---

## Task 1: Type contract (`types.ts`)

**Files:**
- Create: `src/curriculum/types.ts`

- [ ] **Step 1: Create the types file with the full contract**

```ts
// src/curriculum/types.ts

export type EntityKey = string; // "letter:alif", "combo:ba+fatha", "mark:fatha"

// ────────────────────────────────────────────────────────────
// Teaching blocks — composable atoms for teaching screens
// ────────────────────────────────────────────────────────────

export type TeachingBlock =
  | { type: "text"; content: string }
  | { type: "reading-direction"; word: string }
  | {
      type: "glyph-display";
      letter: string;
      size?: "large" | "medium";
      withMark?: string;
    }
  | {
      type: "shape-variants";
      letter: string;
      variants: Array<{
        position: "isolated" | "initial" | "medial" | "final";
        rendered: string;
      }>;
    }
  | { type: "audio"; path: string; label?: string };

// ────────────────────────────────────────────────────────────
// Exercise union — all seven types per curriculum §7
// ────────────────────────────────────────────────────────────

export interface TapExercise {
  type: "tap";
  prompt: string;
  target: EntityKey;
  audioOnMount?: string;
  options: Array<{ display: string; entityKey: EntityKey; correct: boolean }>;
}

export interface HearExercise {
  type: "hear";
  prompt: string;
  target: EntityKey;
  audioPath: string;
  displayOnScreen?: string;
  options?: Array<{ display: string; entityKey: EntityKey; correct: boolean }>;
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
  display: string;
  /**
   * Post-attempt only. The runtime MUST NOT auto-play this before the
   * learner's attempt. See curriculum §6 no-cueing guardrail.
   */
  audioModel?: string;
}

export interface FixExercise {
  type: "fix";
  prompt: string;
  target: EntityKey;
  initialWrong: string;
  correctionType: "mark" | "letter" | "pattern";
  correctDisplay: string;
}

export type Exercise =
  | TapExercise
  | HearExercise
  | ChooseExercise
  | BuildExercise
  | ReadExercise
  | FixExercise;

// ────────────────────────────────────────────────────────────
// Screen union — teaching vs exercise
// ────────────────────────────────────────────────────────────

export interface TeachingScreen {
  kind: "teach";
  id: string;
  blocks: TeachingBlock[];
  allowBack?: boolean;
}

export interface ExerciseScreen {
  kind: "exercise";
  id: string;
  part: "warm-recall" | "practice" | "mastery-check";
  exercise: Exercise;
  allowBack?: boolean;
  scored?: boolean;
  countsAsDecoding?: boolean;
  retryMode?: "until-correct" | "one-shot";
}

export type Screen = TeachingScreen | ExerciseScreen;

// ────────────────────────────────────────────────────────────
// Lesson
// ────────────────────────────────────────────────────────────

export interface LessonData {
  id: string;
  phase: number;
  module: string;
  title: string;
  outcome: string;
  durationTargetSeconds: number;
  introducedEntities: EntityKey[];
  reviewEntities: EntityKey[];
  passCriteria: {
    threshold: number;
    requireCorrectLastTwoDecoding: boolean;
  };
  screens: Screen[];
  /** Optional per-lesson override for the completion view subtitle. */
  completionSubtitle?: string;
}
```

- [ ] **Step 2: Verify the types compile**

Run: `npm run typecheck`
Expected: passes clean (new file with no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/types.ts
git commit -m "feat(curriculum): define LessonData type contract"
```

---

## Task 2: `MasteryRecorder` interface + noop impl

**Files:**
- Create: `src/curriculum/runtime/mastery-recorder.ts`
- Create: `src/__tests__/curriculum/mastery-recorder.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/curriculum/mastery-recorder.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  noopMasteryRecorder,
  type EntityAttemptEvent,
  type LessonOutcomeEvent,
} from "../../curriculum/runtime/mastery-recorder";

describe("noopMasteryRecorder", () => {
  it("recordEntityAttempt resolves without throwing", async () => {
    const event: EntityAttemptEvent = {
      entityKey: "letter:alif",
      correct: true,
      lessonId: "lesson-01",
      itemId: "3.2",
      attemptedAt: Date.now(),
    };
    await expect(noopMasteryRecorder.recordEntityAttempt(event)).resolves.toBeUndefined();
  });

  it("recordLessonOutcome resolves without throwing", async () => {
    const event: LessonOutcomeEvent = {
      lessonId: "lesson-01",
      passed: true,
      itemsTotal: 4,
      itemsCorrect: 4,
      completedAt: Date.now(),
    };
    await expect(noopMasteryRecorder.recordLessonOutcome(event)).resolves.toBeUndefined();
  });

  it("accepts optional metadata bag", async () => {
    await expect(
      noopMasteryRecorder.recordEntityAttempt({
        entityKey: "letter:ba",
        correct: false,
        lessonId: "lesson-01",
        itemId: "3.4",
        attemptedAt: 0,
        metadata: { attempt: 2, source: "retry" },
      })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- mastery-recorder`
Expected: FAIL with "Cannot find module ... mastery-recorder".

- [ ] **Step 3: Implement the recorder**

Create `src/curriculum/runtime/mastery-recorder.ts`:

```ts
import type { EntityKey } from "../types";

export interface EntityAttemptEvent {
  entityKey: EntityKey;
  correct: boolean;
  lessonId: string;
  itemId: string;
  attemptedAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface LessonOutcomeEvent {
  lessonId: string;
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
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[mastery:stub] entity-attempt", event);
    }
  },
  async recordLessonOutcome(event) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[mastery:stub] lesson-outcome", event);
    }
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- mastery-recorder`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/curriculum/runtime/mastery-recorder.ts src/__tests__/curriculum/mastery-recorder.test.ts
git commit -m "feat(curriculum): MasteryRecorder interface with noop impl"
```

---

## Task 3: `CompletionStore` interface + AsyncStorage impl

**Files:**
- Create: `src/curriculum/runtime/completion-store.ts`
- Create: `src/__tests__/curriculum/completion-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/curriculum/completion-store.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStore = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(async (k: string, v: string) => {
      mockStore.set(k, v);
    }),
    getItem: vi.fn(async (k: string) => mockStore.get(k) ?? null),
    removeItem: vi.fn(async (k: string) => {
      mockStore.delete(k);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) mockStore.delete(k);
    }),
    getAllKeys: vi.fn(async () => Array.from(mockStore.keys())),
  },
}));

import { asyncStorageCompletionStore } from "../../curriculum/runtime/completion-store";

describe("asyncStorageCompletionStore", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it("getCompletion returns false when key absent", async () => {
    expect(await asyncStorageCompletionStore.getCompletion("lesson-01")).toBe(false);
  });

  it("markCompleted + getCompletion round-trips under namespaced key", async () => {
    await asyncStorageCompletionStore.markCompleted("lesson-01");
    expect(mockStore.get("tila.lesson-completion.lesson-01")).toBe("true");
    expect(await asyncStorageCompletionStore.getCompletion("lesson-01")).toBe(true);
  });

  it("getCompletion returns false for unrelated stored values", async () => {
    mockStore.set("tila.lesson-completion.lesson-01", "not-boolean-like");
    expect(await asyncStorageCompletionStore.getCompletion("lesson-01")).toBe(false);
  });

  it("clearAll removes only completion-namespaced keys", async () => {
    mockStore.set("tila.lesson-completion.lesson-01", "true");
    mockStore.set("tila.lesson-completion.lesson-02", "true");
    mockStore.set("some-other-key", "unrelated");
    await asyncStorageCompletionStore.clearAll();
    expect(mockStore.has("tila.lesson-completion.lesson-01")).toBe(false);
    expect(mockStore.has("tila.lesson-completion.lesson-02")).toBe(false);
    expect(mockStore.get("some-other-key")).toBe("unrelated");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- completion-store`
Expected: FAIL with "Cannot find module ... completion-store".

- [ ] **Step 3: Implement the store**

Create `src/curriculum/runtime/completion-store.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "tila.lesson-completion.";

export interface CompletionStore {
  markCompleted(lessonId: string): Promise<void>;
  getCompletion(lessonId: string): Promise<boolean>;
  clearAll(): Promise<void>;
}

function keyFor(lessonId: string): string {
  return `${KEY_PREFIX}${lessonId}`;
}

export const asyncStorageCompletionStore: CompletionStore = {
  async markCompleted(lessonId) {
    try {
      await AsyncStorage.setItem(keyFor(lessonId), "true");
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[completion-store] markCompleted failed", err);
      }
    }
  },

  async getCompletion(lessonId) {
    try {
      const v = await AsyncStorage.getItem(keyFor(lessonId));
      return v === "true";
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[completion-store] getCompletion failed", err);
      }
      return false;
    }
  },

  async clearAll() {
    try {
      const all = await AsyncStorage.getAllKeys();
      const ours = all.filter((k) => k.startsWith(KEY_PREFIX));
      if (ours.length > 0) {
        await AsyncStorage.multiRemove(ours);
      }
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[completion-store] clearAll failed", err);
      }
    }
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- completion-store`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/curriculum/runtime/completion-store.ts src/__tests__/curriculum/completion-store.test.ts
git commit -m "feat(curriculum): AsyncStorage completion store"
```

---

## Task 4: Extend `cursor.ts` with `retreatCursor`

**Files:**
- Modify: `src/curriculum/runtime/cursor.ts`
- Modify: `src/__tests__/curriculum-cursor.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/curriculum-cursor.test.ts`:

```ts
import { retreatCursor } from "../curriculum/runtime/cursor";

describe("retreatCursor", () => {
  it("retreats to prior index from middle", () => {
    expect(retreatCursor(2, 5)).toEqual({ prevIndex: 1 });
  });

  it("retreats to index 0 from 1", () => {
    expect(retreatCursor(1, 5)).toEqual({ prevIndex: 0 });
  });

  it("refuses to retreat from index 0", () => {
    expect(retreatCursor(0, 5)).toEqual({ prevIndex: null });
  });

  it("refuses to retreat when total <= 0 (defensive)", () => {
    expect(retreatCursor(0, 0)).toEqual({ prevIndex: null });
    expect(retreatCursor(3, -1)).toEqual({ prevIndex: null });
  });

  it("refuses to retreat from an out-of-bounds current (defensive)", () => {
    expect(retreatCursor(-1, 5)).toEqual({ prevIndex: null });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- curriculum-cursor`
Expected: FAIL with "retreatCursor is not exported" or similar.

- [ ] **Step 3: Implement `retreatCursor`**

Append to `src/curriculum/runtime/cursor.ts`:

```ts
export type RetreatResult = { prevIndex: number | null };

/**
 * Compute the previous cursor state after a go-back request.
 * Returns `{ prevIndex: null }` when already at the first screen
 * or when inputs are out of range.
 */
export function retreatCursor(current: number, total: number): RetreatResult {
  if (total <= 0) return { prevIndex: null };
  if (current <= 0) return { prevIndex: null };
  if (current > total) return { prevIndex: null };
  return { prevIndex: current - 1 };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- curriculum-cursor`
Expected: PASS (original 5 + new 5 = 10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/curriculum/runtime/cursor.ts src/__tests__/curriculum-cursor.test.ts
git commit -m "feat(curriculum): retreatCursor for back navigation"
```

---

## Task 5: Pure outcome computation (`outcome.ts`)

**Files:**
- Create: `src/curriculum/runtime/outcome.ts`
- Create: `src/__tests__/curriculum/outcome.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/curriculum/outcome.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeLessonOutcome } from "../../curriculum/runtime/outcome";
import type {
  LessonData,
  ExerciseScreen,
  TapExercise,
} from "../../curriculum/types";

function tap(correct: boolean): TapExercise {
  return {
    type: "tap",
    prompt: "pick one",
    target: "letter:alif",
    options: [
      { display: "ا", entityKey: "letter:alif", correct: true },
      { display: "ب", entityKey: "letter:ba", correct: false },
    ],
  };
}

function scored(id: string, opts?: Partial<ExerciseScreen>): ExerciseScreen {
  return {
    kind: "exercise",
    id,
    part: "practice",
    exercise: tap(true),
    scored: true,
    countsAsDecoding: false,
    ...opts,
  };
}

function lesson(screens: ExerciseScreen[], threshold = 0.85, requireDecoding = false): LessonData {
  return {
    id: "lesson-test",
    phase: 1,
    module: "1.1",
    title: "Test",
    outcome: "test",
    durationTargetSeconds: 180,
    introducedEntities: [],
    reviewEntities: [],
    passCriteria: { threshold, requireCorrectLastTwoDecoding: requireDecoding },
    screens,
  };
}

describe("computeLessonOutcome", () => {
  it("trivial pass when no scored screens exist", () => {
    const l = lesson([scored("a", { scored: false })]);
    const outcome = computeLessonOutcome(l, new Map());
    expect(outcome.passed).toBe(true);
    expect(outcome.itemsTotal).toBe(0);
    expect(outcome.itemsCorrect).toBe(0);
    expect(outcome.decodingRuleSatisfied).toBe(true);
  });

  it("passes when all scored screens are correct", () => {
    const screens = [scored("a"), scored("b"), scored("c"), scored("d")];
    const l = lesson(screens);
    const map = new Map(screens.map((s) => [s.id, { screenId: s.id, correct: true, entityAttempts: [] }]));
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.passed).toBe(true);
    expect(outcome.itemsTotal).toBe(4);
    expect(outcome.itemsCorrect).toBe(4);
  });

  it("fails below threshold", () => {
    const screens = [scored("a"), scored("b"), scored("c"), scored("d")];
    const l = lesson(screens, 0.85);
    const map = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
      ["c", { screenId: "c", correct: true, entityAttempts: [] }],
      ["d", { screenId: "d", correct: true, entityAttempts: [] }],
    ]);
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.passed).toBe(false);
    expect(outcome.itemsCorrect).toBe(3);
  });

  it("ignores unscored screens in tally", () => {
    const screens: ExerciseScreen[] = [scored("a"), scored("b", { scored: false })];
    const l = lesson(screens);
    const map = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
    ]);
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.itemsTotal).toBe(1);
    expect(outcome.itemsCorrect).toBe(1);
    expect(outcome.passed).toBe(true);
  });

  it("decoding rule: satisfied when requireCorrectLastTwoDecoding is false", () => {
    const screens: ExerciseScreen[] = [
      scored("a", { countsAsDecoding: true }),
      scored("b", { countsAsDecoding: true }),
    ];
    const l = lesson(screens, 0.85, false);
    const map = new Map([
      ["a", { screenId: "a", correct: false, entityAttempts: [] }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
    ]);
    expect(computeLessonOutcome(l, map).decodingRuleSatisfied).toBe(true);
  });

  it("decoding rule: enforced over last two decoding screens by sequence order", () => {
    const screens: ExerciseScreen[] = [
      scored("a", { countsAsDecoding: true }),
      scored("b", { countsAsDecoding: false }),
      scored("c", { countsAsDecoding: true }),
      scored("d", { countsAsDecoding: true }),
    ];
    const l = lesson(screens, 0.0, true); // threshold 0 forces pure-decoding test
    const passingMap = new Map([
      ["a", { screenId: "a", correct: false, entityAttempts: [] }],
      ["b", { screenId: "b", correct: true, entityAttempts: [] }],
      ["c", { screenId: "c", correct: true, entityAttempts: [] }],
      ["d", { screenId: "d", correct: true, entityAttempts: [] }],
    ]);
    expect(computeLessonOutcome(l, passingMap).decodingRuleSatisfied).toBe(true);

    const failingMap = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: true, entityAttempts: [] }],
      ["c", { screenId: "c", correct: true, entityAttempts: [] }],
      ["d", { screenId: "d", correct: false, entityAttempts: [] }],
    ]);
    expect(computeLessonOutcome(l, failingMap).decodingRuleSatisfied).toBe(false);
  });

  it("missing outcome for a scored screen counts as incorrect", () => {
    const screens = [scored("a"), scored("b")];
    const l = lesson(screens);
    const map = new Map([["a", { screenId: "a", correct: true, entityAttempts: [] }]]);
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.itemsTotal).toBe(2);
    expect(outcome.itemsCorrect).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- outcome`
Expected: FAIL with "Cannot find module ... outcome".

- [ ] **Step 3: Implement `outcome.ts`**

Create `src/curriculum/runtime/outcome.ts`:

```ts
import type { LessonData, Screen } from "../types";

export interface ScreenOutcome {
  screenId: string;
  correct: boolean;
  entityAttempts: Array<{
    entityKey: string;
    itemId: string;
    correct: boolean;
  }>;
}

export interface LessonOutcome {
  lessonId: string;
  passed: boolean;
  itemsTotal: number;
  itemsCorrect: number;
  decodingRuleSatisfied: boolean;
}

function isScored(screen: Screen): boolean {
  return screen.kind === "exercise" && screen.scored !== false;
}

function isDecoding(screen: Screen): boolean {
  return screen.kind === "exercise" && screen.countsAsDecoding === true;
}

export function computeLessonOutcome(
  lesson: LessonData,
  outcomes: Map<string, ScreenOutcome>
): LessonOutcome {
  const scoredScreens = lesson.screens.filter(isScored);
  const itemsTotal = scoredScreens.length;
  const itemsCorrect = scoredScreens.filter((s) => {
    const o = outcomes.get(s.id);
    return o?.correct === true;
  }).length;

  const decodingRuleSatisfied = (() => {
    if (!lesson.passCriteria.requireCorrectLastTwoDecoding) return true;
    const decodingScreens = lesson.screens.filter(isDecoding);
    const lastTwo = decodingScreens.slice(-2);
    if (lastTwo.length < 2) return true;
    return lastTwo.every((s) => outcomes.get(s.id)?.correct === true);
  })();

  const passed = (() => {
    if (itemsTotal === 0) return true; // degenerate case
    const ratio = itemsCorrect / itemsTotal;
    return ratio >= lesson.passCriteria.threshold && decodingRuleSatisfied;
  })();

  return {
    lessonId: lesson.id,
    passed,
    itemsTotal,
    itemsCorrect,
    decodingRuleSatisfied,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- outcome`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/curriculum/runtime/outcome.ts src/__tests__/curriculum/outcome.test.ts
git commit -m "feat(curriculum): pure lesson outcome computation"
```

---

## Task 6: URL → lesson ID resolver

**Files:**
- Create: `src/curriculum/runtime/url-resolver.ts`
- Create: `src/__tests__/curriculum/url-resolver.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/curriculum/url-resolver.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveLessonId } from "../../curriculum/runtime/url-resolver";

describe("resolveLessonId", () => {
  it("maps '1' → 'lesson-01'", () => {
    expect(resolveLessonId("1")).toBe("lesson-01");
  });

  it("maps '12' → 'lesson-12'", () => {
    expect(resolveLessonId("12")).toBe("lesson-12");
  });

  it("maps '132' → 'lesson-132'", () => {
    expect(resolveLessonId("132")).toBe("lesson-132");
  });

  it("unwraps string array (Expo Router catch-all quirk)", () => {
    expect(resolveLessonId(["3"])).toBe("lesson-03");
  });

  it("returns null for undefined", () => {
    expect(resolveLessonId(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolveLessonId("")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(resolveLessonId("abc")).toBeNull();
  });

  it("returns null for zero or negative", () => {
    expect(resolveLessonId("0")).toBeNull();
    expect(resolveLessonId("-1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- url-resolver`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement the resolver**

Create `src/curriculum/runtime/url-resolver.ts`:

```ts
/**
 * Map an Expo Router route param (numeric, e.g. "1") to the
 * canonical zero-padded lesson ID (e.g. "lesson-01").
 * Returns null for anything that can't be parsed as a positive integer.
 */
export function resolveLessonId(
  param: string | string[] | undefined
): string | null {
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== raw.trim()) return null;
  return `lesson-${String(n).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- url-resolver`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/curriculum/runtime/url-resolver.ts src/__tests__/curriculum/url-resolver.test.ts
git commit -m "feat(curriculum): URL param → canonical lesson ID resolver"
```

---

## Task 7: Rewrite `LessonRunner` and migrate sandbox atomically

This task is larger than the others because the runner's signature change breaks the sandbox at compile time. Both are migrated in one commit to keep `main` buildable.

**Files:**
- Modify: `src/curriculum/runtime/LessonRunner.tsx`
- Modify: `app/sandbox-lesson.tsx`
- Delete: `src/curriculum/reference/lesson.ts`
- Delete: `src/curriculum/reference/types.ts`
- Delete: `src/__tests__/curriculum-reference-lesson.test.ts`

- [ ] **Step 1: Rewrite `LessonRunner.tsx` to commit to `LessonData`**

Replace the entire contents of `src/curriculum/runtime/LessonRunner.tsx`:

```tsx
import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { advanceCursor, retreatCursor } from "./cursor";
import { computeLessonOutcome, type ScreenOutcome, type LessonOutcome } from "./outcome";
import type { MasteryRecorder } from "./mastery-recorder";
import type { LessonData, Screen, EntityKey } from "../types";

export interface EntityAttempt {
  entityKey: EntityKey;
  itemId: string;
  correct: boolean;
}

export type { ScreenOutcome, LessonOutcome };

export interface LessonRunnerProps {
  lesson: LessonData;
  masteryRecorder: MasteryRecorder;
  onComplete: (outcome: LessonOutcome) => void;
  onExit: () => void;
  renderScreen: (args: {
    screen: Screen;
    advance: (outcome?: ScreenOutcome) => void;
    reportAttempt: (attempts: EntityAttempt[]) => void;
    goBack: () => void;
    canGoBack: boolean;
    index: number;
    total: number;
  }) => ReactNode;
}

export function LessonRunner({
  lesson,
  masteryRecorder,
  onComplete,
  onExit: _onExit,
  renderScreen,
}: LessonRunnerProps) {
  const [index, setIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const outcomesRef = useRef<Map<string, ScreenOutcome>>(new Map());

  const total = lesson.screens.length;
  const currentScreen = lesson.screens[index];
  const canGoBack =
    index > 0 && currentScreen?.allowBack !== false && !isComplete;

  const emitEntityAttempts = useCallback(
    (attempts: EntityAttempt[]) => {
      const now = Date.now();
      for (const a of attempts) {
        void masteryRecorder.recordEntityAttempt({
          entityKey: a.entityKey,
          correct: a.correct,
          lessonId: lesson.id,
          itemId: a.itemId,
          attemptedAt: now,
        });
      }
    },
    [masteryRecorder, lesson.id]
  );

  const reportAttempt = useCallback(
    (attempts: EntityAttempt[]) => {
      emitEntityAttempts(attempts);
    },
    [emitEntityAttempts]
  );

  const advance = useCallback(
    (outcome?: ScreenOutcome) => {
      if (isComplete) return;

      if (outcome) {
        outcomesRef.current.set(outcome.screenId, outcome);
        emitEntityAttempts(outcome.entityAttempts);
      }

      const result = advanceCursor(index, total);
      if (result.complete) {
        setIsComplete(true);
        const lessonOutcome = computeLessonOutcome(lesson, outcomesRef.current);
        void masteryRecorder.recordLessonOutcome({
          lessonId: lessonOutcome.lessonId,
          passed: lessonOutcome.passed,
          itemsTotal: lessonOutcome.itemsTotal,
          itemsCorrect: lessonOutcome.itemsCorrect,
          completedAt: Date.now(),
        });
        onComplete(lessonOutcome);
      } else if (result.nextIndex !== null) {
        setIndex(result.nextIndex);
      }
    },
    [isComplete, index, total, lesson, masteryRecorder, onComplete, emitEntityAttempts]
  );

  const goBack = useCallback(() => {
    if (isComplete) return;
    if (!canGoBack) return;
    const result = retreatCursor(index, total);
    if (result.prevIndex !== null) setIndex(result.prevIndex);
  }, [isComplete, canGoBack, index, total]);

  if (total === 0 || !currentScreen) return null;

  return (
    <>
      {renderScreen({
        screen: currentScreen,
        advance,
        reportAttempt,
        goBack,
        canGoBack,
        index,
        total,
      })}
    </>
  );
}
```

- [ ] **Step 2: Rewrite `app/sandbox-lesson.tsx` against the new runner**

Replace the entire contents of `app/sandbox-lesson.tsx`:

```tsx
import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { LessonRunner } from "../src/curriculum/runtime/LessonRunner";
import { noopMasteryRecorder } from "../src/curriculum/runtime/mastery-recorder";
import type { LessonData } from "../src/curriculum/types";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii } from "../src/design/tokens";

const DEV_FLAG = process.env.EXPO_PUBLIC_DEV_REFERENCE_LESSON === "true";

const sandboxLesson: LessonData = {
  id: "lesson-sandbox",
  phase: 0,
  module: "sandbox",
  title: "Runtime smoke test",
  outcome: "Advance through three screens and call onComplete.",
  durationTargetSeconds: 60,
  introducedEntities: [],
  reviewEntities: [],
  passCriteria: { threshold: 0, requireCorrectLastTwoDecoding: false },
  screens: [
    { kind: "teach", id: "t-1", blocks: [{ type: "text", content: "Screen 1 — tap next." }] },
    { kind: "teach", id: "t-2", blocks: [{ type: "text", content: "Screen 2 — tap next." }] },
    { kind: "teach", id: "t-3", blocks: [{ type: "text", content: "Screen 3 — last one." }] },
  ],
};

export default function SandboxLessonScreen() {
  if (!DEV_FLAG) return <Redirect href="/(tabs)" />;

  const colors = useColors();

  const handleComplete = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  const handleExit = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <LessonRunner
        lesson={sandboxLesson}
        masteryRecorder={noopMasteryRecorder}
        onComplete={handleComplete}
        onExit={handleExit}
        renderScreen={({ screen, advance, canGoBack, goBack, index, total }) => {
          if (screen.kind !== "teach") return null;
          const firstTextBlock = screen.blocks.find((b) => b.type === "text");
          const body = firstTextBlock && firstTextBlock.type === "text" ? firstTextBlock.content : "";
          return (
            <View style={styles.body}>
              <Text style={[styles.progress, { color: colors.textSoft }]}>
                {index + 1} of {total}
              </Text>
              <Text style={[styles.content, { color: colors.text }]}>{body}</Text>
              <View style={styles.actions}>
                {canGoBack ? (
                  <Pressable onPress={goBack} style={styles.backBtn}>
                    <Text style={{ color: colors.textSoft }}>Back</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => advance()} style={[styles.next, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.bg, fontWeight: "600" }}>Next</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, justifyContent: "center", padding: spacing.lg },
  progress: { ...typography.label, textAlign: "center", marginBottom: spacing.sm },
  content: { ...typography.body, textAlign: "center", marginBottom: spacing.xl },
  actions: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  backBtn: { padding: spacing.sm, borderRadius: radii.full },
  next: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full },
});
```

- [ ] **Step 3: Remove dead reference scaffolding**

Run:

```bash
rm src/curriculum/reference/lesson.ts
rm src/curriculum/reference/types.ts
rm src/__tests__/curriculum-reference-lesson.test.ts
rmdir src/curriculum/reference
```

- [ ] **Step 4: Verify typecheck + tests pass**

Run: `npm run typecheck`
Expected: passes clean.

Run: `npm test -- curriculum`
Expected: all curriculum tests pass; `curriculum-reference-lesson.test.ts` is gone from the run.

- [ ] **Step 5: Commit**

```bash
git add src/curriculum/runtime/LessonRunner.tsx app/sandbox-lesson.tsx
git add -u src/curriculum/reference src/__tests__/curriculum-reference-lesson.test.ts
git commit -m "feat(curriculum): rewrite LessonRunner for LessonData contract

Replaces the generic shape-neutral runner with one that consumes
LessonData directly, owns cursor+outcome+mastery emission, and
exposes reportAttempt for until-correct retry bookkeeping.

Sandbox migrated to a tiny real LessonData smoke test.
Reference RefScreen scaffolding removed — no longer needed."
```

---

## Task 8: Author Lesson 1 runtime data

**Files:**
- Create: `src/curriculum/lessons/lesson-01.ts`
- Create: `src/curriculum/lessons/index.ts`
- Create: `src/__tests__/curriculum/lesson-01-shape.test.ts`

- [ ] **Step 1: Write the failing structural test**

Create `src/__tests__/curriculum/lesson-01-shape.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { lessonOne } from "../../curriculum/lessons/lesson-01";
import { lessonRegistry } from "../../curriculum/lessons";

const KNOWN_ENTITY_KEYS = new Set([
  "letter:alif",
  "letter:ba",
]);

describe("lesson-01 shape", () => {
  it("has canonical ID 'lesson-01'", () => {
    expect(lessonOne.id).toBe("lesson-01");
  });

  it("matches authoring markdown frontmatter", () => {
    // See curriculum/phase-1/01-arabic-starts-here.md frontmatter.
    expect(lessonOne.phase).toBe(1);
    expect(lessonOne.module).toBe("1.1");
    expect(lessonOne.title).toBe("Arabic Starts Here");
    expect(lessonOne.durationTargetSeconds).toBe(180);
    expect(lessonOne.passCriteria.threshold).toBe(0.8);
    expect(lessonOne.passCriteria.requireCorrectLastTwoDecoding).toBe(false);
    expect(lessonOne.introducedEntities).toEqual([]);
    expect(lessonOne.reviewEntities).toEqual([]);
  });

  it("every exercise option's entityKey is a known entity", () => {
    const unknown: string[] = [];
    for (const screen of lessonOne.screens) {
      if (screen.kind !== "exercise") continue;
      const ex = screen.exercise;
      const options = "options" in ex && ex.options ? ex.options : [];
      for (const opt of options) {
        if (!KNOWN_ENTITY_KEYS.has(opt.entityKey)) unknown.push(opt.entityKey);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("every audio reference is a non-empty string", () => {
    for (const screen of lessonOne.screens) {
      if (screen.kind === "teach") {
        for (const block of screen.blocks) {
          if (block.type === "audio") expect(block.path.length).toBeGreaterThan(0);
        }
        continue;
      }
      const ex = screen.exercise;
      if (ex.type === "tap" && ex.audioOnMount !== undefined) {
        expect(ex.audioOnMount.length).toBeGreaterThan(0);
      }
      if (ex.type === "hear") {
        expect(ex.audioPath.length).toBeGreaterThan(0);
      }
      if (ex.type === "read" && ex.audioModel !== undefined) {
        expect(ex.audioModel.length).toBeGreaterThan(0);
      }
    }
  });

  it("screen IDs are unique within the lesson", () => {
    const ids = lessonOne.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains at least one unseen-configuration item in part mastery-check", () => {
    const masteryCheckScreens = lessonOne.screens.filter(
      (s) => s.kind === "exercise" && s.part === "mastery-check"
    );
    expect(masteryCheckScreens.length).toBeGreaterThan(0);
  });

  it("is registered under its own ID in the registry", () => {
    expect(lessonRegistry[lessonOne.id]).toBe(lessonOne);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- lesson-01-shape`
Expected: FAIL with "Cannot find module ... lesson-01".

- [ ] **Step 3: Hand-compile Lesson 1 data**

Create `src/curriculum/lessons/lesson-01.ts`:

```ts
import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 1 — "Arabic Starts Here".
 * Human-authored spec: curriculum/phase-1/01-arabic-starts-here.md
 * Keep this file in sync with the markdown frontmatter and exercise blocks.
 * When markdown edits, this file must be updated manually (A0 — parser deferred).
 */
export const lessonOne: LessonData = {
  id: "lesson-01",
  phase: 1,
  module: "1.1",
  title: "Arabic Starts Here",
  outcome:
    "Orient to right-to-left reading, that letters change shape, and that a letter + a mark makes a sound. No scored reading yet.",
  durationTargetSeconds: 180,
  introducedEntities: [],
  reviewEntities: [],
  passCriteria: { threshold: 0.8, requireCorrectLastTwoDecoding: false },
  completionSubtitle: "You just met your first Arabic letters.",
  screens: [
    // Part 2 — Teach
    {
      kind: "teach",
      id: "t-rtl-intro",
      blocks: [
        { type: "text", content: "Arabic reads right to left — the opposite of English. Every word starts on the right." },
        { type: "reading-direction", word: "بِسْمِ" },
        { type: "audio", path: "audio/lesson_01/rtl_intro.mp3", label: "Listen" },
      ],
    },
    {
      kind: "teach",
      id: "t-shape-change",
      blocks: [
        { type: "text", content: "Notice how the same letter looks different depending on where it sits in a word. This is normal." },
        {
          type: "shape-variants",
          letter: "ب",
          variants: [
            { position: "isolated", rendered: "ب" },
            { position: "initial", rendered: "بـ" },
            { position: "medial", rendered: "ـبـ" },
          ],
        },
        { type: "audio", path: "audio/lesson_01/shape_change_intro.mp3", label: "Listen" },
      ],
    },
    {
      kind: "teach",
      id: "t-mark-intro",
      blocks: [
        { type: "text", content: "A letter by itself is a shape. Add a small mark, and it becomes a sound you can read." },
        { type: "glyph-display", letter: "ب", withMark: "بَ", size: "large" },
        { type: "audio", path: "audio/lesson_01/mark_intro.mp3", label: "Listen" },
      ],
    },

    // Part 3 — Practice (3.1 and 3.3 are unscored exploratory Hear items)
    {
      kind: "exercise",
      id: "p-hear-alif",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "hear",
        prompt: "Tap to hear again — this is Alif.",
        target: "letter:alif",
        audioPath: "audio/letter/alif_name.mp3",
        displayOnScreen: "ا",
        note: "Tap as many times as you like.",
      },
    },
    {
      kind: "exercise",
      id: "p-tap-alif",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Which one did you just hear?",
        target: "letter:alif",
        audioOnMount: "audio/letter/alif_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },
    {
      kind: "exercise",
      id: "p-hear-ba",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "hear",
        prompt: "Tap to hear again — this is Ba.",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        displayOnScreen: "ب",
        note: "Tap as many times as you like.",
      },
    },
    {
      kind: "exercise",
      id: "p-tap-ba",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Which one did you just hear?",
        target: "letter:ba",
        audioOnMount: "audio/letter/ba_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },

    // Part 4 — Mastery check (unseen configurations)
    {
      kind: "exercise",
      id: "mc-tap-alif",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Alif.",
        target: "letter:alif",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: false },
          { display: "ا", entityKey: "letter:alif", correct: true },
        ],
      },
    },
    {
      kind: "exercise",
      id: "mc-tap-ba",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Ba.",
        target: "letter:ba",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },
  ],
};
```

- [ ] **Step 4: Create the lesson registry**

Create `src/curriculum/lessons/index.ts`:

```ts
import type { LessonData } from "../types";
import { lessonOne } from "./lesson-01";

export const lessonRegistry: Record<string, LessonData> = {
  [lessonOne.id]: lessonOne,
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- lesson-01-shape`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add src/curriculum/lessons/ src/__tests__/curriculum/lesson-01-shape.test.ts
git commit -m "feat(curriculum): hand-compile Lesson 1 + lesson registry"
```

---

## Task 9: `TeachingScreenView` component

**Files:**
- Create: `src/curriculum/ui/TeachingScreenView.tsx`

No automated tests for UI components per spec §9.2. Smoke-test manually in Task 17.

- [ ] **Step 1: Implement the component**

Create `src/curriculum/ui/TeachingScreenView.tsx`:

```tsx
import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { TeachingBlock, TeachingScreen } from "../types";

interface Props {
  screen: TeachingScreen;
  onAdvance: () => void;
  onPlayAudio?: (path: string) => void;
}

export function TeachingScreenView({ screen, onAdvance, onPlayAudio }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.blocks}>
        {screen.blocks.map((block, i) => (
          <TeachingBlockView key={i} block={block} onPlayAudio={onPlayAudio} />
        ))}
      </View>
      <Pressable
        style={[styles.nextButton, { backgroundColor: colors.primary }]}
        onPress={onAdvance}
        accessibilityRole="button"
        accessibilityLabel="Next"
      >
        <Text style={[styles.nextText, { color: colors.bg }]}>Next</Text>
      </Pressable>
    </View>
  );
}

function TeachingBlockView({
  block,
  onPlayAudio,
}: {
  block: TeachingBlock;
  onPlayAudio?: (path: string) => void;
}) {
  const colors = useColors();
  const [audioTapped, setAudioTapped] = useState(false);

  const handleAudioTap = useCallback(
    (path: string) => {
      setAudioTapped(true);
      onPlayAudio?.(path);
      setTimeout(() => setAudioTapped(false), 600);
    },
    [onPlayAudio]
  );

  switch (block.type) {
    case "text":
      return <Text style={[styles.text, { color: colors.text }]}>{block.content}</Text>;

    case "reading-direction":
      return (
        <View style={styles.rtlRow}>
          <Text style={[styles.arrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.arabicLarge, { color: colors.text }]}>{block.word}</Text>
        </View>
      );

    case "glyph-display":
      return (
        <View style={styles.glyphStack}>
          <Text
            style={[
              block.size === "medium" ? styles.arabicMedium : styles.arabicLarge,
              { color: colors.text },
            ]}
          >
            {block.letter}
          </Text>
          {block.withMark ? (
            <Text style={[styles.arabicLarge, { color: colors.primary, marginTop: spacing.xs }]}>
              {block.withMark}
            </Text>
          ) : null}
        </View>
      );

    case "shape-variants":
      return (
        <View style={styles.variantsRow}>
          {block.variants.map((v) => (
            <View key={v.position} style={styles.variant}>
              <Text style={[styles.arabicMedium, { color: colors.text }]}>{v.rendered}</Text>
              <Text style={[styles.label, { color: colors.textSoft }]}>{v.position}</Text>
            </View>
          ))}
        </View>
      );

    case "audio":
      return (
        <Pressable
          onPress={() => handleAudioTap(block.path)}
          style={[
            styles.audioBubble,
            { backgroundColor: audioTapped ? colors.accent : colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={block.label ?? "Play audio"}
        >
          <Text style={[styles.audioIcon, { color: colors.bg }]}>🔊</Text>
        </Pressable>
      );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: spacing.md },
  blocks: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  text: { ...typography.body, textAlign: "center" },
  rtlRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  arrow: { fontSize: 32 },
  arabicLarge: { fontFamily: fontFamilies.arabicRegular, fontSize: 56, lineHeight: 72 },
  arabicMedium: { fontFamily: fontFamilies.arabicRegular, fontSize: 40, lineHeight: 56 },
  glyphStack: { alignItems: "center" },
  variantsRow: { flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  variant: { alignItems: "center", gap: spacing.xs },
  label: { ...typography.label },
  audioBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  audioIcon: { fontSize: 28 },
  nextButton: { paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: "center" },
  nextText: { ...typography.body, fontWeight: "600" },
});
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: passes clean.

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/ui/TeachingScreenView.tsx
git commit -m "feat(curriculum): TeachingScreenView renders TeachingBlock[]"
```

---

## Task 10: `TapExercise` renderer

**Files:**
- Create: `src/curriculum/ui/exercises/TapExercise.tsx`

- [ ] **Step 1: Implement the component**

Create `src/curriculum/ui/exercises/TapExercise.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../../design/tokens";
import type { TapExercise as TapExerciseData } from "../../types";
import type { EntityAttempt, ScreenOutcome } from "../../runtime/LessonRunner";

interface Props {
  screenId: string;
  exercise: TapExerciseData;
  retryMode: "until-correct" | "one-shot";
  advance: (outcome: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;
  onPlayAudio?: (path: string) => void;
}

type OptionState = "idle" | "correct" | "wrong" | "dim";

const WRONG_FEEDBACK_MS = 400;
const CORRECT_ADVANCE_MS = 900;

export function TapExercise({
  screenId,
  exercise,
  retryMode,
  advance,
  reportAttempt,
  onPlayAudio,
}: Props) {
  const colors = useColors();
  const [optionStates, setOptionStates] = useState<OptionState[]>(
    () => exercise.options.map(() => "idle")
  );
  const [locked, setLocked] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exercise.audioOnMount) onPlayAudio?.(exercise.audioOnMount);
  }, [exercise.audioOnMount, onPlayAudio]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const handleTap = (optionIndex: number) => {
    if (locked) return;
    const opt = exercise.options[optionIndex];
    const attempt: EntityAttempt = {
      entityKey: opt.entityKey,
      itemId: screenId,
      correct: opt.correct,
    };

    if (opt.correct) {
      setLocked(true);
      setOptionStates(exercise.options.map((_, i) => (i === optionIndex ? "correct" : "dim")));
      advanceTimerRef.current = setTimeout(() => {
        advance({
          screenId,
          correct: true,
          entityAttempts: [attempt],
        });
      }, CORRECT_ADVANCE_MS);
      return;
    }

    if (retryMode === "one-shot") {
      setLocked(true);
      setOptionStates(
        exercise.options.map((o, i) =>
          i === optionIndex ? "wrong" : o.correct ? "correct" : "dim"
        )
      );
      advanceTimerRef.current = setTimeout(() => {
        advance({
          screenId,
          correct: false,
          entityAttempts: [attempt],
        });
      }, CORRECT_ADVANCE_MS);
      return;
    }

    // until-correct: flash red, keep options active
    reportAttempt([attempt]);
    setOptionStates((prev) =>
      prev.map((s, i) => (i === optionIndex ? "wrong" : s))
    );
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = setTimeout(() => {
      setOptionStates((prev) => prev.map((s, i) => (i === optionIndex ? "idle" : s)));
    }, WRONG_FEEDBACK_MS);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.text }]}>{exercise.prompt}</Text>
      {exercise.audioOnMount ? (
        <Pressable
          onPress={() => onPlayAudio?.(exercise.audioOnMount!)}
          style={[styles.replayBubble, { backgroundColor: colors.primary }]}
          accessibilityLabel="Replay audio"
          accessibilityRole="button"
        >
          <Text style={[styles.replayIcon, { color: colors.bg }]}>🔊</Text>
        </Pressable>
      ) : null}
      <View style={styles.options}>
        {exercise.options.map((opt, i) => {
          const state = optionStates[i];
          return (
            <Pressable
              key={i}
              onPress={() => handleTap(i)}
              disabled={locked}
              style={[
                styles.option,
                state === "correct" && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                state === "wrong" && { borderColor: colors.danger, backgroundColor: colors.dangerLight },
                state === "dim" && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={opt.display}
            >
              <Text style={[styles.glyph, { color: colors.text }]}>{opt.display}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.md, gap: spacing.lg },
  prompt: { ...typography.body, textAlign: "center" },
  replayBubble: {
    width: 56, height: 56, borderRadius: 28, alignSelf: "center",
    alignItems: "center", justifyContent: "center",
  },
  replayIcon: { fontSize: 22 },
  options: { flexDirection: "row", gap: spacing.sm },
  option: {
    flex: 1, borderWidth: 2, borderColor: "#e8e2cf",
    borderRadius: radii.lg, padding: spacing.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  glyph: { fontFamily: fontFamilies.arabicRegular, fontSize: 44, lineHeight: 56 },
});
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: passes clean. `colors.primary`, `colors.primarySoft`, `colors.danger`, and `colors.dangerLight` are all confirmed present in `src/design/tokens.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/ui/exercises/TapExercise.tsx
git commit -m "feat(curriculum): TapExercise renderer with until-correct + one-shot modes"
```

---

## Task 11: `HearExercise` renderer

**Files:**
- Create: `src/curriculum/ui/exercises/HearExercise.tsx`

- [ ] **Step 1: Implement the component**

Create `src/curriculum/ui/exercises/HearExercise.tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../../design/tokens";
import type { HearExercise as HearExerciseData } from "../../types";
import type { EntityAttempt, ScreenOutcome } from "../../runtime/LessonRunner";

interface Props {
  screenId: string;
  exercise: HearExerciseData;
  advance: (outcome?: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;
  onPlayAudio?: (path: string) => void;
}

export function HearExercise({ screenId, exercise, advance, onPlayAudio }: Props) {
  const colors = useColors();
  const [playing, setPlaying] = useState(false);

  const handleSpeakerTap = () => {
    setPlaying(true);
    onPlayAudio?.(exercise.audioPath);
    setTimeout(() => setPlaying(false), 800);
  };

  // Lesson 1 Hear is the options-less listen-only variant.
  // Scored-Hear with options is not exercised in A0 (see spec §7.2);
  // we still render options when present so future lessons work without
  // a component rewrite.
  const hasOptions = exercise.options && exercise.options.length > 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.text }]}>{exercise.prompt}</Text>
      <Pressable
        onPress={handleSpeakerTap}
        style={[
          styles.speaker,
          { backgroundColor: playing ? colors.accent : colors.primary },
        ]}
        accessibilityRole="button"
        accessibilityLabel={exercise.note ?? "Play audio"}
      >
        <Text style={[styles.speakerIcon, { color: colors.bg }]}>🔊</Text>
      </Pressable>
      {exercise.displayOnScreen ? (
        <Text style={[styles.glyph, { color: colors.text }]}>{exercise.displayOnScreen}</Text>
      ) : null}
      {exercise.note ? (
        <Text style={[styles.hint, { color: colors.textSoft }]}>{exercise.note}</Text>
      ) : null}
      {!hasOptions ? (
        <Pressable
          onPress={() => advance()}
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={[styles.nextText, { color: colors.bg }]}>Next</Text>
        </Pressable>
      ) : null}
      {/* Scored-Hear options branch is intentionally minimal for A0.
          Lessons that need it must author `options` and will behave like
          Tap-below-speaker; the final A1 pass can harden this path. */}
      {hasOptions ? (
        <View style={styles.options}>
          {exercise.options!.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() =>
                advance({
                  screenId,
                  correct: opt.correct,
                  entityAttempts: [
                    { entityKey: opt.entityKey, itemId: screenId, correct: opt.correct },
                  ],
                })
              }
              style={[styles.option, { borderColor: colors.border }]}
              accessibilityLabel={opt.display}
              accessibilityRole="button"
            >
              <Text style={[styles.glyph, { color: colors.text }]}>{opt.display}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.md, gap: spacing.md },
  prompt: { ...typography.body, textAlign: "center" },
  speaker: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
  },
  speakerIcon: { fontSize: 32 },
  glyph: { fontFamily: fontFamilies.arabicRegular, fontSize: 72, lineHeight: 88 },
  hint: { ...typography.label, fontStyle: "italic" },
  nextButton: {
    marginTop: spacing.lg,
    alignSelf: "stretch",
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignItems: "center",
  },
  nextText: { ...typography.body, fontWeight: "600" },
  options: { flexDirection: "row", gap: spacing.sm, alignSelf: "stretch" },
  option: {
    flex: 1, borderWidth: 2,
    borderRadius: radii.lg, padding: spacing.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes clean. `colors.border` and `colors.accent` are both confirmed present in `src/design/tokens.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/ui/exercises/HearExercise.tsx
git commit -m "feat(curriculum): HearExercise renderer (listen-only + options variants)"
```

---

## Task 12: Exercise dispatcher

**Files:**
- Create: `src/curriculum/ui/exercises/index.ts`

- [ ] **Step 1: Implement the dispatcher**

Create `src/curriculum/ui/exercises/index.ts`:

```tsx
import type { ReactNode } from "react";
import { View, Text } from "react-native";
import type { Exercise } from "../../types";
import type { EntityAttempt, ScreenOutcome } from "../../runtime/LessonRunner";
import { TapExercise } from "./TapExercise";
import { HearExercise } from "./HearExercise";

interface DispatchArgs {
  screenId: string;
  exercise: Exercise;
  retryMode: "until-correct" | "one-shot";
  advance: (outcome?: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;
  onPlayAudio?: (path: string) => void;
}

export function renderExercise({
  screenId,
  exercise,
  retryMode,
  advance,
  reportAttempt,
  onPlayAudio,
}: DispatchArgs): ReactNode {
  switch (exercise.type) {
    case "tap":
      return (
        <TapExercise
          screenId={screenId}
          exercise={exercise}
          retryMode={retryMode}
          advance={(o) => advance(o)}
          reportAttempt={reportAttempt}
          onPlayAudio={onPlayAudio}
        />
      );
    case "hear":
      return (
        <HearExercise
          screenId={screenId}
          exercise={exercise}
          advance={advance}
          reportAttempt={reportAttempt}
          onPlayAudio={onPlayAudio}
        />
      );
    case "choose":
    case "build":
    case "read":
    case "fix":
      // Not used by Lesson 1. Will ship with the respective phases.
      return <UnimplementedExercise type={exercise.type} />;
  }
}

function UnimplementedExercise({ type }: { type: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text>{`Exercise type "${type}" not yet implemented.`}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes clean.

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/ui/exercises/index.ts
git commit -m "feat(curriculum): exercise renderer dispatcher"
```

---

## Task 13: `LessonChrome` component

**Files:**
- Create: `src/curriculum/ui/LessonChrome.tsx`

- [ ] **Step 1: Implement the chrome**

Create `src/curriculum/ui/LessonChrome.tsx`:

```tsx
import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform, BackHandler, Alert } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import type { Screen } from "../types";
import type { ReactNode } from "react";

interface Props {
  screen: Screen;
  index: number;
  total: number;
  canGoBack: boolean;
  onBack: () => void;
  onExitRequested: () => void;
  children: ReactNode;
}

const PART_LABELS: Record<string, string> = {
  "warm-recall": "Warm up",
  "practice": "Practice",
  "mastery-check": "Mastery check",
};

function confirmExit(onConfirm: () => void) {
  Alert.alert(
    "Leave lesson?",
    "Your progress in this lesson won't be saved.",
    [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onConfirm },
    ],
    { cancelable: true }
  );
}

export function LessonChrome({
  screen,
  index,
  total,
  canGoBack,
  onBack,
  onExitRequested,
  children,
}: Props) {
  const colors = useColors();
  const partLabel = screen.kind === "exercise" ? PART_LABELS[screen.part] : null;

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExit(onExitRequested);
      return true;
    });
    return () => sub.remove();
  }, [onExitRequested]);

  const progress = total > 0 ? (index + 1) / total : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          disabled={!canGoBack}
          style={[styles.chromeBtn, { opacity: canGoBack ? 1 : 0 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={[styles.chromeIcon, { color: colors.primary }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          {partLabel ? (
            <Text style={[styles.partLabel, { color: colors.textSoft }]}>{partLabel}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => confirmExit(onExitRequested)}
          style={styles.chromeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
        >
          <Text style={[styles.chromeIcon, { color: colors.primary }]}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: "#9AB0A0" },
            ]}
          />
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  chromeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  chromeIcon: { fontSize: 18, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center" },
  partLabel: { ...typography.label, letterSpacing: 1 },
  progressWrap: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%" },
  body: { flex: 1 },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes clean. `colors.border` is confirmed present in `src/design/tokens.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/ui/LessonChrome.tsx
git commit -m "feat(curriculum): LessonChrome with back/close/progress + hardware-back confirm"
```

---

## Task 14: `LessonCompletionView` component

**Files:**
- Create: `src/curriculum/ui/LessonCompletionView.tsx`

- [ ] **Step 1: Implement the view**

Create `src/curriculum/ui/LessonCompletionView.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { LessonData } from "../types";
import type { LessonOutcome } from "../runtime/LessonRunner";
import { lessonRegistry } from "../lessons";

interface Props {
  lesson: LessonData;
  outcome: LessonOutcome;
  onContinue: () => void;
  maxPreviewGlyphs?: number;
}

const DEFAULT_MAX_PREVIEW_GLYPHS = 6;

function resolveGlyph(entityKey: string): string | null {
  // A0 mapping: only letters Lesson 1 introduces. Future iterations
  // pull from a real entity→display map. Returning null skips the preview
  // safely when an entity key isn't known yet.
  const letterMap: Record<string, string> = {
    "letter:alif": "ا",
    "letter:ba": "ب",
    "letter:meem": "م",
    "letter:laam": "ل",
    "letter:noon": "ن",
  };
  return letterMap[entityKey] ?? null;
}

export function LessonCompletionView({
  lesson,
  outcome,
  onContinue,
  maxPreviewGlyphs = DEFAULT_MAX_PREVIEW_GLYPHS,
}: Props) {
  const colors = useColors();

  const entities = lesson.introducedEntities;
  const glyphs = entities.map(resolveGlyph).filter((g): g is string => g !== null);
  const showPreview =
    glyphs.length > 0 &&
    glyphs.length === entities.length && // every entity resolved
    entities.length <= maxPreviewGlyphs;

  const showScore = outcome.itemsTotal > 0;
  const subtitle =
    lesson.completionSubtitle ?? "Nice work.";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.body}>
        <View style={[styles.check, { backgroundColor: colors.primary }]}>
          <Text style={[styles.checkIcon, { color: colors.bg }]}>✓</Text>
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>{lesson.title} complete</Text>
        {showScore ? (
          <Text style={[styles.score, { color: colors.textSoft }]}>
            {outcome.itemsCorrect} of {outcome.itemsTotal} correct
          </Text>
        ) : null}
        {showPreview ? (
          <Text style={[styles.glyphPreview, { color: colors.text }]}>
            {glyphs.join(" · ")}
          </Text>
        ) : null}
        <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text>
      </View>
      <Pressable
        style={[styles.continueButton, { backgroundColor: colors.primary }]}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={[styles.continueText, { color: colors.bg }]}>Continue</Text>
      </Pressable>
    </View>
  );
}

// Re-export for testing convenience elsewhere without bringing in component internals.
export const __internal = { resolveGlyph, DEFAULT_MAX_PREVIEW_GLYPHS };

// Note: `lessonRegistry` import is not used at runtime here but kept available
// for future per-lesson customization hooks without adding new imports.
void lessonRegistry;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: "space-between" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  check: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  checkIcon: { fontSize: 36, fontWeight: "600" },
  title: { ...typography.heading2, fontSize: 22 },
  score: { ...typography.label, letterSpacing: 1 },
  glyphPreview: { fontFamily: fontFamilies.arabicRegular, fontSize: 56, lineHeight: 72, letterSpacing: 12 },
  subtitle: { ...typography.body, textAlign: "center", marginTop: spacing.sm },
  continueButton: { paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: "center" },
  continueText: { ...typography.body, fontWeight: "600" },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes clean.

- [ ] **Step 3: Commit**

```bash
git add src/curriculum/ui/LessonCompletionView.tsx
git commit -m "feat(curriculum): LessonCompletionView with conditional glyph preview"
```

---

## Task 15: Lesson route `app/lesson/[id].tsx`

**Files:**
- Create: `app/lesson/[id].tsx`

- [ ] **Step 1: Implement the route**

Create `app/lesson/[id].tsx`:

```tsx
import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "../../src/design/theme";
import { typography, spacing, radii } from "../../src/design/tokens";
import { LessonRunner, type LessonOutcome } from "../../src/curriculum/runtime/LessonRunner";
import { noopMasteryRecorder } from "../../src/curriculum/runtime/mastery-recorder";
import { asyncStorageCompletionStore } from "../../src/curriculum/runtime/completion-store";
import { resolveLessonId } from "../../src/curriculum/runtime/url-resolver";
import { lessonRegistry } from "../../src/curriculum/lessons";
import { LessonChrome } from "../../src/curriculum/ui/LessonChrome";
import { LessonCompletionView } from "../../src/curriculum/ui/LessonCompletionView";
import { TeachingScreenView } from "../../src/curriculum/ui/TeachingScreenView";
import { renderExercise } from "../../src/curriculum/ui/exercises";

export default function LessonRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const lessonId = resolveLessonId(params.id);
  const lesson = lessonId ? lessonRegistry[lessonId] : undefined;

  const [outcome, setOutcome] = useState<LessonOutcome | null>(null);

  const handleComplete = useCallback(
    async (o: LessonOutcome) => {
      await asyncStorageCompletionStore.markCompleted(o.lessonId);
      setOutcome(o);
    },
    []
  );

  const handleExit = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  const handleContinue = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  if (!lesson) return <LessonNotFound />;

  if (outcome) {
    return (
      <SafeAreaView style={styles.container}>
        <LessonCompletionView lesson={lesson} outcome={outcome} onContinue={handleContinue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LessonRunner
        lesson={lesson}
        masteryRecorder={noopMasteryRecorder}
        onComplete={handleComplete}
        onExit={handleExit}
        renderScreen={({ screen, advance, reportAttempt, goBack, canGoBack, index, total }) => (
          <LessonChrome
            screen={screen}
            index={index}
            total={total}
            canGoBack={canGoBack}
            onBack={goBack}
            onExitRequested={handleExit}
          >
            {screen.kind === "teach" ? (
              <TeachingScreenView screen={screen} onAdvance={() => advance()} />
            ) : (
              renderExercise({
                screenId: screen.id,
                exercise: screen.exercise,
                retryMode: screen.retryMode ?? "one-shot",
                advance,
                reportAttempt,
              })
            )}
          </LessonChrome>
        )}
      />
    </SafeAreaView>
  );
}

function LessonNotFound() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.container, styles.notFound, { backgroundColor: colors.bg }]}>
      <Text style={[styles.notFoundTitle, { color: colors.text }]}>Lesson not found</Text>
      <Pressable
        onPress={() => router.replace("/(tabs)")}
        style={[styles.button, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Back to home"
      >
        <Text style={[styles.buttonText, { color: colors.bg }]}>Back to home</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  notFoundTitle: { ...typography.heading2, textAlign: "center" },
  button: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.full },
  buttonText: { ...typography.body, fontWeight: "600" },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes clean.

- [ ] **Step 3: Commit**

```bash
git add app/lesson/[id].tsx
git commit -m "feat(curriculum): lesson route with completion swap and URL resolution"
```

---

## Task 16: Home-tab CTA for Lesson 1

**Files:**
- Modify: `app/(tabs)/index.tsx`

The current home tab has a lot of existing content (streak, onboarding flows, etc.). A0 doesn't rip that out — it adds the Lesson 1 card above/in place of the old lesson-grid area. Minimal, surgical change.

- [ ] **Step 1: Read the current home-tab index to find the insertion point**

Run: `head -200 "C:/Users/Nasif/Desktop/Iqra AI/tila-mobile/app/(tabs)/index.tsx"`

Identify where today's lesson grid / placeholder content is rendered. This plan assumes there is a clearly-scoped region between the hero and the progress stats where the CTA card fits; if not, insert it immediately after the hero component.

- [ ] **Step 2: Add Lesson 1 CTA card component and completion-state hook**

Add the following at the top of `app/(tabs)/index.tsx` (below the existing imports):

```tsx
import { useFocusEffect } from "expo-router";
import { asyncStorageCompletionStore } from "../../src/curriculum/runtime/completion-store";
```

Inside the screen's component body, add:

```tsx
const [lesson1Completed, setLesson1Completed] = useState(false);

useFocusEffect(
  useCallback(() => {
    let cancelled = false;
    asyncStorageCompletionStore.getCompletion("lesson-01").then((done) => {
      if (!cancelled) setLesson1Completed(done);
    });
    return () => {
      cancelled = true;
    };
  }, [])
);
```

- [ ] **Step 3: Render the Lesson 1 CTA card**

Locate the section in `app/(tabs)/index.tsx` currently reserved for lesson content (or add directly after the hero section). Insert:

```tsx
<View style={styles.lessonCard}>
  <Text style={styles.lessonEyebrow}>Lesson 1 · Phase 1 · Module 1.1</Text>
  <Text style={styles.lessonTitle}>Arabic Starts Here</Text>
  {lesson1Completed ? (
    <>
      <View style={styles.completeRow}>
        <Text style={styles.completeCheck}>✓</Text>
        <Text style={styles.completeText}>Lesson 1 complete</Text>
      </View>
      <Pressable
        onPress={() => router.push("/lesson/1")}
        style={[styles.lessonButton, styles.lessonButtonSecondary]}
        accessibilityRole="button"
        accessibilityLabel="Replay Lesson 1"
      >
        <Text style={styles.lessonButtonSecondaryText}>Replay Lesson 1</Text>
      </Pressable>
      <View style={styles.nextDisabled}>
        <Text style={styles.nextDisabledText}>Lesson 2 coming soon</Text>
      </View>
    </>
  ) : (
    <Pressable
      onPress={() => router.push("/lesson/1")}
      style={styles.lessonButton}
      accessibilityRole="button"
      accessibilityLabel="Start Lesson 1"
    >
      <Text style={styles.lessonButtonText}>Start</Text>
    </Pressable>
  )}
</View>
```

Add the corresponding styles in the local `StyleSheet.create({...})` block:

```tsx
lessonCard: {
  marginHorizontal: spacing.sm,
  marginVertical: spacing.sm,
  padding: spacing.md,
  borderRadius: radii.lg,
  backgroundColor: "#FFFFFF",
  gap: spacing.sm,
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
},
lessonEyebrow: { ...typography.label, color: "#8a8a8a" },
lessonTitle: { ...typography.heading2, fontSize: 20, color: "#163323" },
lessonButton: {
  backgroundColor: "#163323",
  borderRadius: radii.full,
  paddingVertical: spacing.sm,
  alignItems: "center",
  marginTop: spacing.xs,
},
lessonButtonText: { color: "#F8F6F0", fontWeight: "600", fontSize: 15 },
lessonButtonSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#163323" },
lessonButtonSecondaryText: { color: "#163323", fontWeight: "600", fontSize: 15 },
completeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
completeCheck: { color: "#163323", fontSize: 18, fontWeight: "700" },
completeText: { ...typography.body, color: "#163323" },
nextDisabled: {
  marginTop: spacing.xs,
  padding: spacing.sm,
  borderRadius: radii.lg,
  backgroundColor: "#f4f1e8",
  alignItems: "center",
},
nextDisabledText: { ...typography.label, color: "#9a9484" },
```

- [ ] **Step 4: Verify typecheck and lint**

Run: `npm run validate`
Expected: lint + typecheck pass clean.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat(home): Lesson 1 CTA card with completion-state reflection"
```

---

## Task 17: Update `src/curriculum/README.md`

**Files:**
- Modify: `src/curriculum/README.md`

- [ ] **Step 1: Replace the "When the blueprint arrives" section**

Read the current README. Replace the "When the blueprint arrives" section (and related notes) with:

```markdown
## Status

The A0 vertical slice is live:

- `types.ts` defines the `LessonData` contract (all seven exercise types).
- `runtime/LessonRunner.tsx` consumes `LessonData` directly — no longer generic.
- `lessons/lesson-01.ts` + `lessons/index.ts` carry Lesson 1 + registry.
- `ui/` renders teaching blocks, Tap, Hear, chrome, and completion.
- `app/lesson/[id].tsx` hosts the route; `app/(tabs)/index.tsx` exposes the CTA.

See `docs/superpowers/specs/2026-04-22-a0-lesson-1-vertical-slice-design.md` for the full A0 design.

## Adding a lesson

1. Author the human spec at `curriculum/phase-N/<nn>-<slug>.md`.
2. Hand-compile a sibling TS file at `src/curriculum/lessons/lesson-<nn>.ts`
   that exports a `LessonData` matching the frontmatter and exercises.
3. Register it in `src/curriculum/lessons/index.ts`.
4. Add a shape test at `src/__tests__/curriculum/lesson-<nn>-shape.test.ts`.
5. Expose a CTA on the home screen (current home card pattern).

## What still NOT to do

- Don't bypass the env flag on `app/sandbox-lesson`.
- Don't write a generalized markdown parser until at least Lesson 2–3 have shipped
  — the contract may still shift. Manual hand-compile is correct for now.
- Don't wake the quarantined mastery engine. `noopMasteryRecorder` stays until
  a real impl is planned.
```

- [ ] **Step 2: Commit**

```bash
git add src/curriculum/README.md
git commit -m "docs(curriculum): update README to reflect A0 slice landing"
```

---

## Task 18: Final validation + manual smoke test

**Files:** no new files

- [ ] **Step 1: Run the full validation suite**

Run: `npm run validate`
Expected: lint + typecheck both pass.

Run: `npm test`
Expected: all tests pass, including:
- `curriculum-cursor.test.ts` (10 tests — 5 original + 5 retreat)
- `curriculum/mastery-recorder.test.ts` (3)
- `curriculum/completion-store.test.ts` (4)
- `curriculum/outcome.test.ts` (7)
- `curriculum/url-resolver.test.ts` (8)
- `curriculum/lesson-01-shape.test.ts` (7)

- [ ] **Step 2: Manual smoke test — happy path**

```bash
npm start
```

In the Expo dev client on a real device or simulator:

1. Open the app. Confirm the home tab shows the "Arabic Starts Here" CTA card with a "Start" button.
2. Tap "Start". Route should open at `/lesson/1`.
3. Advance through the three teaching screens (t-rtl-intro, t-shape-change, t-mark-intro) via the Next button. Confirm:
   - Back arrow is hidden on screen 0 (t-rtl-intro).
   - Back arrow appears from screen 2 onward and lets you revisit teaching screens.
   - Chrome shows "Practice" label during the 4 exercise screens (part === "practice" and part === "mastery-check").
4. On the Hear exercise (p-hear-alif): tap the speaker repeatedly. No scoring. Next button is always enabled.
5. On the Tap exercise (p-tap-alif): tap the wrong option — confirm it flashes red briefly, options stay tappable. Tap the correct option — confirm it glows green briefly, auto-advances after ~900ms.
6. Complete the full 8-screen flow. Confirm the completion view appears with "Lesson 1 complete", "4 of 4 correct", the glyph preview ("ا · ب"... actually empty since `introducedEntities` is `[]`; preview is skipped — confirm it's not rendered), the "You just met your first Arabic letters." subtitle, and a Continue button.
7. Tap Continue. Route should return to the home tab. Card should now show "Lesson 1 complete", "Replay Lesson 1" button, and disabled "Lesson 2 coming soon" tile.
8. Close and reopen the app. Confirm the completed state persists (AsyncStorage).

- [ ] **Step 3: Manual smoke test — edge paths**

1. Deep-link to `/lesson/99` (or edit the URL in web mode). Confirm "Lesson not found" view with "Back to home" button.
2. On Android only: start Lesson 1, press hardware back mid-lesson. Confirm "Leave lesson? Your progress in this lesson won't be saved." dialog. Tap Stay → dialog dismisses, stay in lesson. Tap Leave → route replaces to home.
3. On Android: during the completion view, press hardware back. Confirm no confirm dialog (lesson is done). Behavior: equivalent to Continue (returns home).
4. Mid-lesson, terminate the app (not just background). Reopen. Confirm it lands on the home tab, not mid-lesson (no resume).

- [ ] **Step 4: Clear storage and re-run happy path**

```bash
# In the Expo dev client, shake → Developer Tools → Clear All Data
# OR
npx expo start -c  # clears Metro cache + storage on next reload
```

Confirm fresh-install state: home card shows "Start", no "Lesson 1 complete."

- [ ] **Step 5: Final commit (if any smoke test surfaced fixes)**

If bugs were found and fixed in Steps 2–4, commit them:

```bash
git add -u
git commit -m "fix(curriculum): smoke-test fixes for A0"
```

If no fixes needed, skip.

- [ ] **Step 6: Merge-ready state**

Confirm `git status` is clean. The `main` branch now has a playable Lesson 1 slice end-to-end.

---

## Done. The A0 slice is live.

**Next plannable slice:** A1 — Lesson 2, "Alif + Ba + Fatha = بَ". Introduces `combo:ba+fatha` entity, the first Read exercise, and the first real scoring gate. The LessonData contract should already support this without changes — the test is whether A1 is pure authoring + a Read renderer.

**Deferred items tracked in spec §10:**
- Authoring-markdown → runtime parser (revisit after Lessons 2–3).
- Mastery engine unquarantine + entity-key migration (after Phase 1 complete).
- Per-lesson authored completion moments (Phase 6 / Al-Fatiha).
- Lesson grid (Phase 2+).
