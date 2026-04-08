import { describe, it, expect } from "vitest";
import {
  CHUNKS,
  WORDS,
  PATTERNS,
  RULES,
  ORTHOGRAPHY,
  ASSESSMENT_PROFILES,
} from "@/src/data/curriculum-v2";

describe("curriculum-v2 registries", () => {
  it("chunks have unique IDs prefixed with chunk:", () => {
    const ids = CHUNKS.map((c) => c.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^chunk:/));
  });

  it("all chunks have required fields", () => {
    CHUNKS.forEach((chunk) => {
      expect(chunk.displayArabic).toBeTruthy();
      expect(chunk.capabilities.length).toBeGreaterThan(0);
      expect(chunk.teachingBreakdownIds.length).toBeGreaterThan(0);
      expect(chunk.audioKey).toBeTruthy();
      expect(chunk.syllableCount).toBeGreaterThanOrEqual(1);
    });
  });

  it("rules have unique IDs prefixed with rule:", () => {
    const ids = RULES.map((r) => r.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^rule:/));
  });

  it("patterns have unique IDs prefixed with pattern:", () => {
    const ids = PATTERNS.map((p) => p.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^pattern:/));
  });

  it("assessment profiles have unique IDs", () => {
    const ids = ASSESSMENT_PROFILES.map((p) => p.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assessment profile exercise weights sum to ~1.0", () => {
    ASSESSMENT_PROFILES.forEach((profile) => {
      const sum = profile.exerciseWeights.reduce((s, w) => s + w.weight, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    });
  });

  it("words array exists (may be empty in vertical slice)", () => {
    expect(Array.isArray(WORDS)).toBe(true);
  });

  it("orthography array exists (may be empty in vertical slice)", () => {
    expect(Array.isArray(ORTHOGRAPHY)).toBe(true);
  });
});
