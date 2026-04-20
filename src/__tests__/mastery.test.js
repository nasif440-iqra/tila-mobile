import { describe, it, expect } from "vitest";
import {
  normalizeEntityKey,
  parseEntityKey,
  deriveSkillKeysFromQuestion,
  recordEntityAttempt,
  recordSkillAttempt,
  recordConfusion,
  deriveConfusionKey,
  updateEntitySRS,
  mergeQuizResultsIntoMastery,
  deriveMasteryState,
  categorizeError,
  ERROR_CATEGORIES,
  MASTERY_MIN_ATTEMPTS,
  MASTERY_ACCURACY_THRESHOLD,
  MASTERY_RETAINED_INTERVAL,
  MASTERY_RETAINED_STREAK,
  emptyMastery,
  migrateFlatProgressToEntities,
  buildLegacyProgressView,
} from "../engine/mastery";
import { getLetter } from "../data/letters.js";

// ── Entity key normalization ──

describe("normalizeEntityKey", () => {
  it("normalizes numeric targetId to letter key", () => {
    expect(normalizeEntityKey(2, {})).toBe("letter:2");
  });

  it("normalizes harakat string to combo key", () => {
    expect(normalizeEntityKey("ba-fatha", { isHarakat: true })).toBe("combo:ba-fatha");
  });

  it("normalizes combo-like string without isHarakat flag", () => {
    expect(normalizeEntityKey("ba-fatha", {})).toBe("combo:ba-fatha");
  });

  it("normalizes bare harakat mark to combo key", () => {
    expect(normalizeEntityKey("fatha", {})).toBe("combo:fatha");
  });

  it("returns unknown for unrecognized strings", () => {
    expect(normalizeEntityKey("weirdthing", {})).toBe("unknown:weirdthing");
  });
});

describe("parseEntityKey", () => {
  it("parses letter key", () => {
    const { type, rawId } = parseEntityKey("letter:2");
    expect(type).toBe("letter");
    expect(rawId).toBe(2);
  });

  it("parses combo key", () => {
    const { type, rawId } = parseEntityKey("combo:ba-fatha");
    expect(type).toBe("combo");
    expect(rawId).toBe("ba-fatha");
  });

  it("handles key without colon", () => {
    const { type, rawId } = parseEntityKey("nocolon");
    expect(type).toBe("unknown");
    expect(rawId).toBe("nocolon");
  });
});

// ── Skill key derivation ──

describe("deriveSkillKeysFromQuestion", () => {
  it("returns visual skill for tap question", () => {
    const keys = deriveSkillKeysFromQuestion({ targetId: 2, type: "tap" });
    expect(keys).toContain("visual:2");
  });

  it("returns sound skill for audio question", () => {
    const keys = deriveSkillKeysFromQuestion({ targetId: 2, type: "tap", hasAudio: true });
    expect(keys).toContain("sound:2");
  });

  it("returns contrast skill for contrast mode", () => {
    const keys = deriveSkillKeysFromQuestion({
      targetId: 2, type: "tap", lessonMode: "contrast",
      options: [{ id: 2 }, { id: 3 }],
    });
    expect(keys).toContain("contrast:2-3");
  });

  it("returns harakat skill for harakat question", () => {
    const keys = deriveSkillKeysFromQuestion({
      targetId: "ba-fatha", isHarakat: true,
      options: [{ id: "ba-fatha" }, { id: "ba-kasra" }],
    });
    expect(keys.length).toBeGreaterThan(0);
    expect(keys[0]).toMatch(/^harakat:/);
  });

  it("returns empty for null question", () => {
    expect(deriveSkillKeysFromQuestion(null)).toEqual([]);
  });
});

// ── Entity and skill recording ──

describe("recordEntityAttempt", () => {
  it("increments attempts and correct on correct answer", () => {
    const result = recordEntityAttempt(null, { correct: true }, "2026-03-25");
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(1);
    expect(result.lastSeen).toBe("2026-03-25");
  });

  it("increments attempts but not correct on wrong answer", () => {
    const result = recordEntityAttempt(null, { correct: false }, "2026-03-25");
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(0);
  });

  it("accumulates from existing entry", () => {
    const existing = { correct: 3, attempts: 5, lastSeen: "2026-03-24" };
    const result = recordEntityAttempt(existing, { correct: true }, "2026-03-25");
    expect(result.correct).toBe(4);
    expect(result.attempts).toBe(6);
  });

  it("tracks latency when provided", () => {
    const result = recordEntityAttempt(null, { correct: true, latencyMs: 1200 }, "2026-03-25");
    expect(result.lastLatencyMs).toBe(1200);
  });
});

describe("recordSkillAttempt", () => {
  it("increments skill attempts", () => {
    const result = recordSkillAttempt(null, { correct: true }, "2026-03-25");
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(1);
  });
});

// ── Confusion tracking ──

describe("deriveConfusionKey", () => {
  it("returns null for correct answers", () => {
    expect(deriveConfusionKey({ correct: true })).toBeNull();
  });

  it("returns recognition confusion key", () => {
    const key = deriveConfusionKey({
      correct: false,
      targetKey: "letter:2",
      selectedKey: "letter:3",
    });
    expect(key).toBe("recognition:2->3");
  });

  it("returns sound confusion key", () => {
    const key = deriveConfusionKey({
      correct: false,
      targetKey: "letter:2",
      selectedKey: "letter:3",
      hasAudio: true,
    });
    expect(key).toBe("sound:2->3");
  });

  it("returns harakat confusion key", () => {
    const key = deriveConfusionKey({
      correct: false,
      targetKey: "combo:ba-fatha",
      selectedKey: "combo:ba-kasra",
      isHarakat: true,
    });
    expect(key).toBe("harakat:ba-fatha->ba-kasra");
  });
});

describe("recordConfusion", () => {
  it("creates new confusion entry", () => {
    const result = recordConfusion({}, "recognition:2->3", "2026-03-25");
    expect(result["recognition:2->3"].count).toBe(1);
    expect(result["recognition:2->3"].lastSeen).toBe("2026-03-25");
  });

  it("increments existing confusion count", () => {
    const existing = { "recognition:2->3": { count: 2, lastSeen: "2026-03-24" } };
    const result = recordConfusion(existing, "recognition:2->3", "2026-03-25");
    expect(result["recognition:2->3"].count).toBe(3);
  });

  it("stores error category when provided", () => {
    const result = recordConfusion({}, "recognition:2->3", "2026-03-25", "visual_confusion");
    expect(result["recognition:2->3"].categories.visual_confusion).toBe(1);
  });

  it("accumulates error categories across calls", () => {
    let confusions = recordConfusion({}, "sound:7->8", "2026-03-25", "sound_confusion");
    confusions = recordConfusion(confusions, "sound:7->8", "2026-03-25", "sound_confusion");
    confusions = recordConfusion(confusions, "sound:7->8", "2026-03-25", "random_miss");
    expect(confusions["sound:7->8"].categories.sound_confusion).toBe(2);
    expect(confusions["sound:7->8"].categories.random_miss).toBe(1);
  });

  it("backward compat: old entries without categories work", () => {
    const existing = { "recognition:2->3": { count: 5, lastSeen: "2026-03-20" } };
    const result = recordConfusion(existing, "recognition:2->3", "2026-03-25", "visual_confusion");
    expect(result["recognition:2->3"].count).toBe(6);
    expect(result["recognition:2->3"].categories.visual_confusion).toBe(1);
  });
});

// ── Error categorization ──

describe("categorizeError", () => {
  it("returns vowel_confusion for harakat questions", () => {
    expect(categorizeError({ correct: false, isHarakat: true, targetId: "ba-fatha", selectedId: "ba-kasra" }, getLetter)).toBe("vowel_confusion");
  });

  it("returns sound_confusion for audio questions", () => {
    expect(categorizeError({ correct: false, hasAudio: true, targetId: 2, selectedId: 3 }, getLetter)).toBe("sound_confusion");
  });

  it("returns sound_confusion for letter_to_sound questions", () => {
    expect(categorizeError({ correct: false, questionType: "letter_to_sound", targetId: 12, selectedId: 14 }, getLetter)).toBe("sound_confusion");
  });

  it("returns sound_confusion for contrast_audio questions", () => {
    expect(categorizeError({ correct: false, questionType: "contrast_audio", targetId: 6, selectedId: 26 }, getLetter)).toBe("sound_confusion");
  });

  it("returns visual_confusion for same-family recognition miss", () => {
    expect(categorizeError({ correct: false, targetId: 2, selectedId: 3 }, getLetter)).toBe("visual_confusion");
  });

  it("returns visual_confusion for another same-family pair", () => {
    expect(categorizeError({ correct: false, targetId: 12, selectedId: 13 }, getLetter)).toBe("visual_confusion");
  });

  it("returns random_miss for different-family recognition miss", () => {
    expect(categorizeError({ correct: false, targetId: 2, selectedId: 12 }, getLetter)).toBe("random_miss");
  });

  it("returns random_miss for correct answers", () => {
    expect(categorizeError({ correct: true, targetId: 2, selectedId: 2 }, getLetter)).toBe("random_miss");
  });

  it("returns random_miss for null result", () => {
    expect(categorizeError(null, getLetter)).toBe("random_miss");
  });

  it("returns random_miss when getLetter is not available", () => {
    expect(categorizeError({ correct: false, targetId: 2, selectedId: 3 }, null)).toBe("random_miss");
  });

  it("exports all four category names", () => {
    expect(ERROR_CATEGORIES).toEqual(["visual_confusion", "sound_confusion", "vowel_confusion", "random_miss"]);
  });
});

describe("getErrorCategorySummary", () => {
  it("returns zeros for empty confusions", () => {
    const summary = getErrorCategorySummary({});
    expect(summary.total).toBe(0);
    expect(summary.visual_confusion).toBe(0);
  });

  it("aggregates across confusion entries", () => {
    const confusions = {
      "recognition:2->3": { count: 3, lastSeen: "2026-03-25", categories: { visual_confusion: 2, random_miss: 1 } },
      "sound:7->8": { count: 2, lastSeen: "2026-03-25", categories: { sound_confusion: 2 } },
    };
    const summary = getErrorCategorySummary(confusions);
    expect(summary.visual_confusion).toBe(2);
    expect(summary.sound_confusion).toBe(2);
    expect(summary.random_miss).toBe(1);
    expect(summary.total).toBe(5);
  });

  it("handles old entries without categories", () => {
    const confusions = {
      "recognition:2->3": { count: 5, lastSeen: "2026-03-20" },
    };
    const summary = getErrorCategorySummary(confusions);
    expect(summary.total).toBe(0);
  });

  it("returns zeros for null", () => {
    expect(getErrorCategorySummary(null).total).toBe(0);
  });
});

// ── Error categorization in merge ──

describe("mergeQuizResultsIntoMastery — error categorization", () => {
  it("categorizes errors during merge", () => {
    const mastery = emptyMastery();
    const results = [
      { targetId: 2, correct: false, targetKey: "letter:2", selectedKey: "letter:3", selectedId: 3, skillKeys: [], isHarakat: false, hasAudio: false, questionType: "tap" },
    ];
    const merged = mergeQuizResultsIntoMastery(mastery, results, "2026-03-26");
    const confKeys = Object.keys(merged.confusions);
    expect(confKeys.length).toBe(1);
    expect(merged.confusions[confKeys[0]].categories.visual_confusion).toBe(1);
  });

  it("categorizes sound errors during merge", () => {
    const mastery = emptyMastery();
    const results = [
      { targetId: 12, correct: false, targetKey: "letter:12", selectedKey: "letter:14", selectedId: 14, skillKeys: [], isHarakat: false, hasAudio: true, questionType: "audio_to_letter" },
    ];
    const merged = mergeQuizResultsIntoMastery(mastery, results, "2026-03-26");
    const confKeys = Object.keys(merged.confusions);
    expect(merged.confusions[confKeys[0]].categories.sound_confusion).toBe(1);
  });
});

// ── SRS scheduling ──

describe("updateEntitySRS", () => {
  it("increments sessionStreak on correct", () => {
    const entry = { sessionStreak: 1, intervalDays: 1 };
    const result = updateEntitySRS(entry, true, "2026-03-25");
    expect(result.sessionStreak).toBe(2);
    expect(result.intervalDays).toBe(3);
    expect(result.nextReview).toBe("2026-03-28");
  });

  it("resets sessionStreak on incorrect", () => {
    const entry = { sessionStreak: 3, intervalDays: 7 };
    const result = updateEntitySRS(entry, false, "2026-03-25");
    expect(result.sessionStreak).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.nextReview).toBe("2026-03-25");
  });
});

// ── Batch merge ──

describe("mergeQuizResultsIntoMastery", () => {
  it("merges quiz results into empty mastery", () => {
    const mastery = emptyMastery();
    const results = [
      { targetId: 2, correct: true, targetKey: "letter:2", selectedKey: "letter:2", skillKeys: ["visual:2"] },
      { targetId: 2, correct: false, targetKey: "letter:2", selectedKey: "letter:3", selectedId: 3, skillKeys: ["visual:2"], isHarakat: false, hasAudio: false },
    ];
    const merged = mergeQuizResultsIntoMastery(mastery, results, "2026-03-25");

    expect(merged.entities["letter:2"]).toBeDefined();
    expect(merged.entities["letter:2"].attempts).toBe(2);
    expect(merged.entities["letter:2"].correct).toBe(1);
    expect(merged.skills["visual:2"]).toBeDefined();
    expect(merged.skills["visual:2"].attempts).toBe(2);
  });

  it("records confusions for wrong answers", () => {
    const mastery = emptyMastery();
    const results = [
      { targetId: 2, correct: false, targetKey: "letter:2", selectedKey: "letter:3" },
    ];
    const merged = mergeQuizResultsIntoMastery(mastery, results, "2026-03-25");
    expect(Object.keys(merged.confusions).length).toBeGreaterThan(0);
  });

  it("applies SRS scheduling after merge", () => {
    const mastery = emptyMastery();
    const results = [
      { targetId: 5, correct: true, targetKey: "letter:5", selectedKey: "letter:5", skillKeys: [] },
    ];
    const merged = mergeQuizResultsIntoMastery(mastery, results, "2026-03-25");
    expect(merged.entities["letter:5"].nextReview).toBeDefined();
    expect(merged.entities["letter:5"].sessionStreak).toBe(1);
  });
});

// ── Migration ──

describe("migrateFlatProgressToEntities", () => {
  it("converts numeric keys to letter entities", () => {
    const flat = { 2: { correct: 3, attempts: 5 }, 3: { correct: 1, attempts: 2 } };
    const entities = migrateFlatProgressToEntities(flat);
    expect(entities["letter:2"]).toEqual({ correct: 3, attempts: 5 });
    expect(entities["letter:3"]).toEqual({ correct: 1, attempts: 2 });
  });

  it("converts combo-like keys to combo entities", () => {
    const flat = { "ba-fatha": { correct: 2, attempts: 3 } };
    const entities = migrateFlatProgressToEntities(flat);
    expect(entities["combo:ba-fatha"]).toEqual({ correct: 2, attempts: 3 });
  });

  it("handles null/empty input", () => {
    expect(migrateFlatProgressToEntities(null)).toEqual({});
    expect(migrateFlatProgressToEntities({})).toEqual({});
  });
});

describe("buildLegacyProgressView", () => {
  it("strips letter: prefix back to numeric keys", () => {
    const entities = { "letter:2": { correct: 3 }, "letter:5": { correct: 1 }, "combo:ba-fatha": { correct: 2 } };
    const flat = buildLegacyProgressView(entities);
    expect(flat[2]).toEqual({ correct: 3 });
    expect(flat[5]).toEqual({ correct: 1 });
    expect(flat["ba-fatha"]).toBeUndefined();
  });
});

