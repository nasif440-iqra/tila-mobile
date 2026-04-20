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
