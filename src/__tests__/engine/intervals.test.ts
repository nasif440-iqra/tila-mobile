import { describe, it, expect } from "vitest";
import {
  INTERVAL_LEVELS,
  findIntervalIndex,
  nextInterval,
  stepBack,
  hasTwoConsecutiveFailures,
} from "@/src/engine/v2/intervals";

describe("INTERVAL_LEVELS", () => {
  it("contains the expected sequence", () => {
    expect(Array.from(INTERVAL_LEVELS)).toEqual([0, 1, 3, 7, 14, 30]);
  });
});

describe("findIntervalIndex", () => {
  it("returns correct index for each level", () => {
    expect(findIntervalIndex(0)).toBe(0);
    expect(findIntervalIndex(1)).toBe(1);
    expect(findIntervalIndex(3)).toBe(2);
    expect(findIntervalIndex(7)).toBe(3);
    expect(findIntervalIndex(14)).toBe(4);
    expect(findIntervalIndex(30)).toBe(5);
  });

  it("returns 0 for unknown values", () => {
    expect(findIntervalIndex(99)).toBe(0);
    expect(findIntervalIndex(5)).toBe(0);
  });
});

describe("nextInterval", () => {
  it("advances through the full sequence", () => {
    expect(nextInterval(0)).toBe(1);
    expect(nextInterval(1)).toBe(3);
    expect(nextInterval(3)).toBe(7);
    expect(nextInterval(7)).toBe(14);
    expect(nextInterval(14)).toBe(30);
  });

  it("stays at 30 when already at max", () => {
    expect(nextInterval(30)).toBe(30);
  });

  it("snaps to first level for unknown values", () => {
    // Unknown value → findIntervalIndex returns 0 → next is index 1 = 1
    expect(nextInterval(99)).toBe(1);
  });
});

describe("stepBack", () => {
  it("steps back one level", () => {
    expect(stepBack(30, 1)).toBe(14);
    expect(stepBack(14, 1)).toBe(7);
    expect(stepBack(7, 1)).toBe(3);
    expect(stepBack(3, 1)).toBe(1);
    expect(stepBack(1, 1)).toBe(0);
  });

  it("steps back two levels", () => {
    expect(stepBack(30, 2)).toBe(7);
    expect(stepBack(14, 2)).toBe(3);
    expect(stepBack(7, 2)).toBe(1);
  });

  it("clamps to 0 when stepping back past the beginning", () => {
    expect(stepBack(1, 5)).toBe(0);
    expect(stepBack(0, 1)).toBe(0);
  });
});

describe("hasTwoConsecutiveFailures", () => {
  it("returns true when last two attempts are both incorrect", () => {
    const attempts = [
      { correct: true },
      { correct: false },
      { correct: false },
    ];
    expect(hasTwoConsecutiveFailures(attempts)).toBe(true);
  });

  it("returns false when last attempt is correct", () => {
    const attempts = [
      { correct: false },
      { correct: false },
      { correct: true },
    ];
    expect(hasTwoConsecutiveFailures(attempts)).toBe(false);
  });

  it("returns false when second-to-last is correct", () => {
    const attempts = [
      { correct: true },
      { correct: true },
      { correct: false },
    ];
    expect(hasTwoConsecutiveFailures(attempts)).toBe(false);
  });

  it("returns false with fewer than 2 attempts", () => {
    expect(hasTwoConsecutiveFailures([])).toBe(false);
    expect(hasTwoConsecutiveFailures([{ correct: false }])).toBe(false);
  });

  it("returns true with exactly 2 consecutive failures", () => {
    expect(hasTwoConsecutiveFailures([{ correct: false }, { correct: false }])).toBe(true);
  });
});
