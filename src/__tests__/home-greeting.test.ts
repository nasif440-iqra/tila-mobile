import { describe, it, expect } from "vitest";
import {
  getGreetingLine1,
  getMotivationSubtitle,
  MOTIVATION_SUBTITLES,
} from "../utils/greetingHelpers";

// ── getGreetingLine1 ──

describe("getGreetingLine1", () => {
  it("returns 'ASSALAMU ALAIKUM, NASIF' when userName is 'Nasif'", () => {
    expect(getGreetingLine1("Nasif")).toBe("ASSALAMU ALAIKUM, NASIF");
  });

  it("returns 'ASSALAMU ALAIKUM' when userName is null", () => {
    expect(getGreetingLine1(null)).toBe("ASSALAMU ALAIKUM");
  });

  it("returns 'ASSALAMU ALAIKUM' when userName is empty string (falsy)", () => {
    expect(getGreetingLine1("")).toBe("ASSALAMU ALAIKUM");
  });

  it("uppercases mixed-case names", () => {
    expect(getGreetingLine1("aisha")).toBe("ASSALAMU ALAIKUM, AISHA");
  });
});

// ── getMotivationSubtitle ──

describe("getMotivationSubtitle", () => {
  it("returns 'Reading toward the Quran' for read_quran", () => {
    expect(getMotivationSubtitle("read_quran", 5, 10)).toBe("Reading toward the Quran");
  });

  it("returns 'Building toward confident salah' for pray_confidently", () => {
    expect(getMotivationSubtitle("pray_confidently", 5, 10)).toBe(
      "Building toward confident salah"
    );
  });

  it("returns 'Connecting to your heritage' for connect_heritage", () => {
    expect(getMotivationSubtitle("connect_heritage", 5, 10)).toBe(
      "Connecting to your heritage"
    );
  });

  it("returns 'Learning to teach your children' for teach_children", () => {
    expect(getMotivationSubtitle("teach_children", 5, 10)).toBe(
      "Learning to teach your children"
    );
  });

  it("returns 'Growing in your faith' for personal_growth", () => {
    expect(getMotivationSubtitle("personal_growth", 5, 10)).toBe("Growing in your faith");
  });

  it("falls back to getGreetingSubtitle when motivation is null", () => {
    // lessonsCompleted=0 should produce "Begin your\njourney"
    expect(getMotivationSubtitle(null, 0, 0)).toBe("Begin your\njourney");
  });

  it("falls back to getGreetingSubtitle when motivation is unknown", () => {
    expect(getMotivationSubtitle("unknown_value", 2, 5)).toBe("5 letters down");
  });
});

// ── MOTIVATION_SUBTITLES mapping ──

describe("MOTIVATION_SUBTITLES", () => {
  it("has exactly 5 motivation values", () => {
    expect(Object.keys(MOTIVATION_SUBTITLES)).toHaveLength(5);
  });

  it("covers all expected motivation keys", () => {
    const expectedKeys = [
      "read_quran",
      "pray_confidently",
      "connect_heritage",
      "teach_children",
      "personal_growth",
    ];
    for (const key of expectedKeys) {
      expect(MOTIVATION_SUBTITLES[key]).toBeDefined();
    }
  });
});
