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

  it("handles defensive inputs (negative total, negative current)", () => {
    expect(advanceCursor(5, -3)).toEqual({ nextIndex: null, complete: true });
    expect(advanceCursor(-1, 3)).toEqual({ nextIndex: 0, complete: false });
  });
});
