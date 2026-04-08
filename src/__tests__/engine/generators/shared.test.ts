import { describe, it, expect } from "vitest";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  deriveAudioKey,
  filterToCapability,
} from "@/src/engine/questions-v2/shared";
import type { AnyEntity } from "@/src/types/entity";
import type { LetterEntity, ComboEntity, ChunkEntity } from "@/src/types/entity";

// Test fixtures
const letterA: LetterEntity = {
  id: "letter:1", displayArabic: "\u0627", transliteration: "aa",
  capabilities: ["tappable", "hearable", "readable"],
};
const letterB: LetterEntity = {
  id: "letter:2", displayArabic: "\u0628", transliteration: "b",
  capabilities: ["tappable", "hearable", "readable"],
};
const letterM: LetterEntity = {
  id: "letter:24", displayArabic: "\u0645", transliteration: "m",
  capabilities: ["tappable", "hearable", "readable"],
};
const comboBA: ComboEntity = {
  id: "combo:ba-fatha", displayArabic: "\u0628\u064E", transliteration: "ba",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const comboMA: ComboEntity = {
  id: "combo:ma-fatha", displayArabic: "\u0645\u064E", transliteration: "ma",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const chunkBM: ChunkEntity = {
  id: "chunk:ba-ma", displayArabic: "\u0628\u064E\u0645\u064E", transliteration: "bama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_ba-ma",
};

describe("pickEntitiesBySource", () => {
  const teach = [letterA, letterB];
  const review = [letterM, comboBA];
  const all = [letterA, letterB, letterM, comboBA, comboMA, chunkBM];

  it("returns teach entities for 'teach' source", () => {
    const result = pickEntitiesBySource({ from: "teach" }, teach, review, all);
    expect(result).toEqual(teach);
  });

  it("returns review entities for 'review' source", () => {
    const result = pickEntitiesBySource({ from: "review" }, teach, review, all);
    expect(result).toEqual(review);
  });

  it("returns all entities for 'all' source", () => {
    const result = pickEntitiesBySource({ from: "all" }, teach, review, all);
    expect(result).toEqual(all);
  });

  it("returns combined teach+review for 'mixed' without ratio", () => {
    const result = pickEntitiesBySource({ from: "mixed" }, teach, review, all);
    expect(result).toEqual([...teach, ...review]);
  });

  it("respects teach/review ratio for 'mixed' with mix", () => {
    const result = pickEntitiesBySource(
      { from: "mixed", mix: { teach: 1, review: 1 } }, teach, review, all
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(letterA);
    expect(result[1]).toEqual(letterM);
  });

  it("returns filtered entities for 'explicit' source", () => {
    const result = pickEntitiesBySource(
      { from: "explicit", entityIds: ["letter:1", "chunk:ba-ma"] }, teach, review, all
    );
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["letter:1", "chunk:ba-ma"]);
  });
});

describe("pickDistractors", () => {
  const pool = [letterA, letterB, letterM, comboBA, comboMA];
  const emptyConfusions = new Map<string, string[]>();

  it("returns requested number of distractors", () => {
    const result = pickDistractors(letterA, pool, 3, emptyConfusions);
    expect(result).toHaveLength(3);
  });

  it("never includes the target entity", () => {
    const result = pickDistractors(letterA, pool, 4, emptyConfusions);
    expect(result.every((e) => e.id !== "letter:1")).toBe(true);
  });

  it("prefers confusion pairs when available", () => {
    const confusions = new Map([["letter:1", ["letter:2"]]]);
    const result = pickDistractors(letterA, pool, 2, confusions);
    expect(result[0].id).toBe("letter:2");
  });

  it("returns fewer than requested if pool is too small", () => {
    const smallPool = [letterA, letterB];
    const result = pickDistractors(letterA, smallPool, 5, emptyConfusions);
    expect(result).toHaveLength(1); // only letterB available
  });

  it("returns empty array if pool only contains target", () => {
    const result = pickDistractors(letterA, [letterA], 3, emptyConfusions);
    expect(result).toHaveLength(0);
  });
});

describe("filterToCapability", () => {
  it("filters to entities with the capability", () => {
    const entities: AnyEntity[] = [letterA, comboBA, chunkBM];
    const buildable = filterToCapability(entities, "buildable");
    expect(buildable).toHaveLength(2);
    expect(buildable.map((e) => e.id)).toEqual(["combo:ba-fatha", "chunk:ba-ma"]);
  });
});

describe("shuffle", () => {
  it("returns same elements in (potentially) different order", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr, 42);
    expect(result).toHaveLength(arr.length);
    expect(result.sort()).toEqual(arr.sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    shuffle(arr, 42);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("is deterministic with seed", () => {
    const arr = [1, 2, 3, 4, 5];
    const a = shuffle(arr, 123);
    const b = shuffle(arr, 123);
    expect(a).toEqual(b);
  });
});

describe("deriveAudioKey", () => {
  it("uses audioKey from entity when available", () => {
    expect(deriveAudioKey(chunkBM)).toBe("chunk_ba-ma");
  });

  it("derives from entity ID for letters", () => {
    expect(deriveAudioKey(letterA)).toBe("letter_1");
  });

  it("derives from entity ID for combos", () => {
    expect(deriveAudioKey(comboBA)).toBe("combo_ba-fatha");
  });
});
