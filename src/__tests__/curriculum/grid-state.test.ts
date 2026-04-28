import { describe, it, expect } from "vitest";
import { deriveLessonGridState } from "../../curriculum/runtime/grid-state";

const LESSONS = [
  "lesson-01",
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
];

describe("deriveLessonGridState", () => {
  it("marks lesson-01 as current and rest as locked when nothing completed", () => {
    const cells = deriveLessonGridState(LESSONS, {
      completedLessonIds: [],
      lastReachedLessonId: null,
    });
    expect(cells[0]).toEqual({ lessonId: "lesson-01", state: "current" });
    expect(cells[1].state).toBe("locked");
    expect(cells[7].state).toBe("locked");
  });

  it("marks lesson-02 as current after lesson-01 completes", () => {
    const cells = deriveLessonGridState(LESSONS, {
      completedLessonIds: ["lesson-01"],
      lastReachedLessonId: "lesson-02",
    });
    expect(cells[0].state).toBe("completed");
    expect(cells[1].state).toBe("current");
    expect(cells[2].state).toBe("locked");
  });

  it("marks all completed when all 8 lessons are done", () => {
    const cells = deriveLessonGridState(LESSONS, {
      completedLessonIds: LESSONS,
      lastReachedLessonId: "lesson-08",
    });
    cells.forEach((c) => expect(c.state).toBe("completed"));
  });

  it("marks exactly one current cell at any time", () => {
    const cells = deriveLessonGridState(LESSONS, {
      completedLessonIds: ["lesson-01", "lesson-02"],
      lastReachedLessonId: "lesson-03",
    });
    const currents = cells.filter((c) => c.state === "current");
    expect(currents).toHaveLength(1);
    expect(currents[0].lessonId).toBe("lesson-03");
  });

  it("treats unknown completed ids as no-ops for sequencing", () => {
    const cells = deriveLessonGridState(LESSONS, {
      completedLessonIds: ["lesson-99"],
      lastReachedLessonId: null,
    });
    expect(cells[0].state).toBe("current");
    expect(cells[1].state).toBe("locked");
  });
});
