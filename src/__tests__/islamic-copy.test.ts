/**
 * CEL-05: Islamic copy integration tests
 * Real assertions verifying Islamic phrases are present in all engagement copy pools.
 */
import { describe, it, expect } from "vitest";
import {
  CORRECT_COPY,
  WRONG_ENCOURAGEMENT,
  STREAK_COPY,
  MID_CELEBRATE_COPY,
  COMPLETION_HEADLINES,
  COMPLETION_SUBLINES,
  CONTINUATION_COPY,
  UNLOCK_COPY,
  LETTER_MASTERY_COPY,
} from "../engine/engagement";

const ISLAMIC_PATTERN = /MashaAllah|Alhamdulillah|SubhanAllah|Bismillah|In shaa Allah/i;

describe("CEL-05: Islamic Copy in Engagement Pools", () => {
  it("CORRECT_COPY.recognition contains at least 2 Islamic phrases", () => {
    const matches = CORRECT_COPY.recognition.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("CORRECT_COPY.sound contains at least 1 Islamic phrase", () => {
    const matches = CORRECT_COPY.sound.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("CORRECT_COPY.harakat contains at least 1 Islamic phrase", () => {
    const matches = CORRECT_COPY.harakat.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("WRONG_ENCOURAGEMENT contains at least 1 Islamic phrase", () => {
    const matches = WRONG_ENCOURAGEMENT.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("STREAK_COPY.default contains at least 1 Islamic phrase", () => {
    const matches = STREAK_COPY.default.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("MID_CELEBRATE_COPY.default contains at least 1 Islamic phrase", () => {
    const matches = MID_CELEBRATE_COPY.default.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("COMPLETION_HEADLINES has at least 1 Islamic phrase", () => {
    const values = Object.values(COMPLETION_HEADLINES) as string[];
    const matches = values.filter((s) => ISLAMIC_PATTERN.test(s));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("COMPLETION_SUBLINES has at least 1 Islamic phrase", () => {
    const values = Object.values(COMPLETION_SUBLINES) as string[];
    const matches = values.filter((s) => ISLAMIC_PATTERN.test(s));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("LETTER_MASTERY_COPY exists with at least 5 entries, all containing {letter} placeholder", () => {
    expect(LETTER_MASTERY_COPY).toBeDefined();
    expect(LETTER_MASTERY_COPY.length).toBeGreaterThanOrEqual(5);
    for (const entry of LETTER_MASTERY_COPY) {
      expect(entry).toContain("{letter}");
    }
  });

  it("LETTER_MASTERY_COPY entries match Islamic phrases", () => {
    const matches = LETTER_MASTERY_COPY.filter((s: string) =>
      ISLAMIC_PATTERN.test(s)
    );
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});
