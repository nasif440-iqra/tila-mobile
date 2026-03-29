import { describe, it, expect } from "vitest";
import { generateCheckpointQs } from "../engine/questions/checkpoint.js";
import { LESSONS } from "../data/lessons.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function findCheckpointLesson(phase: number) {
  const lesson = LESSONS.find(
    (l: { lessonMode: string; phase: number }) =>
      l.lessonMode === "checkpoint" && l.phase === phase
  );
  if (!lesson) throw new Error(`No phase ${phase} checkpoint lesson found`);
  return lesson;
}

/** Build a progress object using the entity-keyed mastery format. */
function buildEntityProgress(
  teachIds: number[],
  overrides: Record<number, { correct: number; attempts: number }>
) {
  const entities: Record<string, { correct: number; attempts: number }> = {};
  for (const id of teachIds) {
    entities[`letter:${id}`] = overrides[id] ?? { correct: 9, attempts: 10 };
  }
  return {
    completedLessonIds: [],
    mastery: { entities, skills: {}, confusions: {} },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("classifyLetters — entity-keyed mastery format", () => {
  /**
   * Core regression test: use a small synthetic lesson (3 letters) so that
   * the guaranteed pool = 3 and remaining = 12 extra slots are filled from
   * the weighted pool. This makes the weight distribution observable.
   *
   * With entity-keyed format and the classifier BROKEN:
   *   All letters → unseen → weightedPool = [1,1,1, 2,2,2, 3,3,3] (uniform)
   *
   * With entity-keyed format and the classifier FIXED:
   *   Letter 1 → struggled (3x weight), letters 2+3 → strong (1x weight)
   *   weightedPool = [1,1,1, 2, 3] → letter 1 appears ~60% of extra slots
   *
   * We verify this by counting how often letter 1 appears in a large sample
   * of runs. When broken (unseen), expected rate ≈ 33%. When fixed, ≈ 60%.
   * We threshold at >45% to definitively distinguish the two.
   */
  it("classifies struggled letters correctly with entity-keyed mastery (statistical)", () => {
    // Small synthetic lesson so extras are drawn from the weighted pool
    const syntheticLesson = {
      id: 9999,
      phase: 1,
      lessonMode: "checkpoint",
      teachIds: [1, 2, 3], // 3 letters → remaining = 15 - 3 = 12 extra slots
      reviewIds: [],
    };

    // Letter 1 is struggled (30% accuracy), letters 2+3 are strong (90%)
    const progress = buildEntityProgress([1, 2, 3], {
      1: { correct: 3, attempts: 10 }, // 30% — struggled
      2: { correct: 9, attempts: 10 }, // 90% — strong
      3: { correct: 9, attempts: 10 }, // 90% — strong
    });

    // Run 100 iterations to get a stable count
    let letter1Count = 0;
    let totalQuestions = 0;
    const RUNS = 100;
    for (let run = 0; run < RUNS; run++) {
      const qs = generateCheckpointQs(syntheticLesson, progress);
      for (const q of qs as Array<{ targetId: number }>) {
        totalQuestions++;
        if (q.targetId === 1) letter1Count++;
      }
    }

    const rate = letter1Count / totalQuestions;

    // If classifier is broken (all unseen): rate ≈ 0.33 — this assertion FAILS
    // If classifier is fixed (struggled 3x, strong 1x): rate ≈ 0.60 — PASSES
    // Threshold at 0.45 to cleanly separate the two outcomes
    expect(rate).toBeGreaterThan(0.45);
  });

  it("Phase 1 checkpoint: generates questions when progress uses entity keys", () => {
    const lesson = findCheckpointLesson(1);
    const teachIds: number[] = lesson.teachIds || [];
    const progress = buildEntityProgress(teachIds, {});

    const qs = generateCheckpointQs(lesson, progress);

    expect(Array.isArray(qs)).toBe(true);
    expect(qs.length).toBeGreaterThan(0);
  });

  it("Phase 2 checkpoint: generates questions when progress uses entity keys", () => {
    const lesson = findCheckpointLesson(2);
    if (!lesson) return;
    const teachIds: number[] = lesson.teachIds || [];
    const progress = buildEntityProgress(teachIds, {});

    const qs = generateCheckpointQs(lesson, progress);

    expect(Array.isArray(qs)).toBe(true);
    expect(qs.length).toBeGreaterThan(0);
  });

  it("falls back gracefully when progress is null or empty", () => {
    const lesson = findCheckpointLesson(1);

    const qsNull = generateCheckpointQs(lesson, null);
    const qsEmpty = generateCheckpointQs(lesson, {});

    expect(Array.isArray(qsNull)).toBe(true);
    expect(Array.isArray(qsEmpty)).toBe(true);
    expect(qsNull.length).toBeGreaterThan(0);
    expect(qsEmpty.length).toBeGreaterThan(0);
  });

  it("backwards compatibility: still works when progress uses legacy numeric keys", () => {
    const lesson = findCheckpointLesson(1);
    const teachIds: number[] = lesson.teachIds || [];

    // Old format: progress[numericId] = { correct, attempts }
    const progress: Record<number, { correct: number; attempts: number }> = {};
    for (const id of teachIds) {
      progress[id] = { correct: 8, attempts: 10 };
    }

    const qs = generateCheckpointQs(lesson, progress);

    expect(Array.isArray(qs)).toBe(true);
    expect(qs.length).toBeGreaterThan(0);
  });
});
