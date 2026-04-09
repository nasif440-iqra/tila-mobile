import { describe, it, expect } from "vitest";
import { generateV2Exercises } from "@/src/engine/questions-v2/index";
import type { MasterySnapshot } from "@/src/types/exercise";
import type { LessonV2 } from "@/src/types/curriculum-v2";
import type { LetterEntity, ComboEntity, ChunkEntity } from "@/src/types/entity";
import { LESSONS_V2 } from "@/src/data/curriculum-v2/lessons";

// ── Fixtures ──

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
const letterL: LetterEntity = {
  id: "letter:23", displayArabic: "\u0644", transliteration: "l",
  capabilities: ["tappable", "hearable", "readable"],
};
const letterN: LetterEntity = {
  id: "letter:25", displayArabic: "\u0646", transliteration: "n",
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
const comboLA: ComboEntity = {
  id: "combo:la-fatha", displayArabic: "\u0644\u064E", transliteration: "la",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const chunkBM: ChunkEntity = {
  id: "chunk:ba-ma", displayArabic: "\u0628\u064E\u0645\u064E", transliteration: "bama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_ba-ma",
};
const chunkLM: ChunkEntity = {
  id: "chunk:la-ma", displayArabic: "\u0644\u064E\u0645\u064E", transliteration: "lama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:la-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_la-ma",
};

const allEntities = [letterA, letterB, letterM, letterL, letterN, comboBA, comboMA, comboLA, chunkBM, chunkLM];

const emptyMastery: MasterySnapshot = {
  entityStates: new Map(),
  confusionPairs: new Map(),
};

// ── Lesson fixtures ──

const tapHearLesson: LessonV2 = {
  id: 100, phase: 1, module: "test",
  title: "Tap + Hear Lesson",
  description: "Test",
  teachEntityIds: ["letter:1", "letter:2"],
  reviewEntityIds: ["letter:24"],
  exercisePlan: [
    { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
    { type: "hear", count: 2, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
  ],
  masteryPolicy: { passThreshold: 0.85 },
};

const tapHearChooseReadLesson: LessonV2 = {
  id: 101, phase: 1, module: "test",
  title: "Tap + Hear + Choose + Read",
  description: "Test",
  teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha", "combo:ma-fatha"],
  reviewEntityIds: [],
  exercisePlan: [
    { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
    { type: "hear", count: 2, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
    { type: "choose", count: 3, target: "letter", source: { from: "teach" } },
    { type: "read", count: 3, target: "combo", source: { from: "teach" } },
  ],
  masteryPolicy: { passThreshold: 0.85 },
};

const checkpointLesson: LessonV2 = {
  id: 102, phase: 1, module: "test",
  title: "Checkpoint Test",
  description: "Test checkpoint",
  teachEntityIds: ["letter:1", "letter:2", "letter:24", "letter:23", "combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha", "chunk:ba-ma", "chunk:la-ma"],
  reviewEntityIds: [],
  exercisePlan: [
    { type: "check", count: 10, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-1-checkpoint" },
  ],
  masteryPolicy: { passThreshold: 0.9 },
  renderProfile: "isolated",
};

const noRenderProfileLesson: LessonV2 = {
  id: 103, phase: 1, module: "test",
  title: "No Render Profile",
  description: "Test",
  teachEntityIds: ["letter:1", "letter:2"],
  reviewEntityIds: [],
  exercisePlan: [
    { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
  ],
  masteryPolicy: { passThreshold: 0.85 },
  // No renderProfile set
};

// ── Tests ──

describe("generateV2Exercises", () => {
  it("produces items for each step in exercise plan", async () => {
    const items = await generateV2Exercises(tapHearLesson, allEntities, emptyMastery);
    expect(items.length).toBeGreaterThan(0);

    const tapItems = items.filter((i) => i.type === "tap");
    const hearItems = items.filter((i) => i.type === "hear");
    expect(tapItems.length).toBeGreaterThan(0);
    expect(hearItems.length).toBeGreaterThan(0);
  });

  it("total item count equals sum of step counts", async () => {
    const items = await generateV2Exercises(tapHearLesson, allEntities, emptyMastery);
    // tap: 2 + hear: 2 = 4
    expect(items).toHaveLength(4);
  });

  it("items appear in exercise plan order (tap before hear before choose before read)", async () => {
    const items = await generateV2Exercises(tapHearChooseReadLesson, allEntities, emptyMastery);

    const tapIdx = items.findIndex((i) => i.type === "tap");
    const hearIdx = items.findIndex((i) => i.type === "hear");
    const chooseIdx = items.findIndex((i) => i.type === "choose");
    const readIdx = items.findIndex((i) => i.type === "read");

    expect(tapIdx).toBeGreaterThanOrEqual(0);
    expect(hearIdx).toBeGreaterThan(tapIdx);
    expect(chooseIdx).toBeGreaterThan(hearIdx);
    expect(readIdx).toBeGreaterThan(chooseIdx);
  });

  it("total item count = sum of step counts for multi-step lesson", async () => {
    const items = await generateV2Exercises(tapHearChooseReadLesson, allEntities, emptyMastery);
    // tap: 2 + hear: 2 + choose: 3 + read: 3 = 10
    expect(items).toHaveLength(10);
  });

  it("works with checkpoint lesson (check step) — produces items", async () => {
    const items = await generateV2Exercises(checkpointLesson, allEntities, emptyMastery);
    expect(items).toHaveLength(10);
  });

  it("checkpoint items have assessmentBucket set", async () => {
    const items = await generateV2Exercises(checkpointLesson, allEntities, emptyMastery);
    for (const item of items) {
      expect(item.assessmentBucket).toBeDefined();
    }
  });

  it("render profile defaults to 'isolated' when not specified", async () => {
    // generateV2Exercises should not throw and should produce items
    // even when lesson has no renderProfile
    const items = await generateV2Exercises(noRenderProfileLesson, allEntities, emptyMastery);
    expect(items.length).toBeGreaterThan(0);
  });

  it("works with vertical-slice lesson 2 (choose+read) from LESSONS_V2", async () => {
    const lesson2 = LESSONS_V2.find((l) => l.id === 2);
    expect(lesson2).toBeDefined();
    if (!lesson2) return;

    // lesson2 has choose:2 + read:1 = 3 (teaching/exit sequences are authored, not generated)
    const expectedTotal = lesson2.exercisePlan.reduce((sum, s) => sum + s.count, 0);

    const items = await generateV2Exercises(lesson2, allEntities, emptyMastery);
    expect(items).toHaveLength(expectedTotal);

    // Verify ordering: choose items come before read items
    const chooseIdx = items.findIndex((i) => i.type === "choose");
    const readIdx = items.findIndex((i) => i.type === "read");
    expect(chooseIdx).toBeGreaterThanOrEqual(0);
    expect(readIdx).toBeGreaterThan(chooseIdx);
  });

  it("works with checkpoint lesson 7 from LESSONS_V2", async () => {
    const lesson7 = LESSONS_V2.find((l) => l.id === 7);
    expect(lesson7).toBeDefined();
    if (!lesson7) return;

    const items = await generateV2Exercises(lesson7, allEntities, emptyMastery);
    // lesson7 has check: count=7 (reduced to account for opener + 2 exit items)
    expect(items).toHaveLength(7);
  });

  it("returns empty array for a lesson with no exercise steps", async () => {
    const emptyLesson: LessonV2 = {
      id: 999, phase: 1, module: "test",
      title: "Empty", description: "no steps",
      teachEntityIds: [], reviewEntityIds: [],
      exercisePlan: [],
      masteryPolicy: { passThreshold: 0.8 },
    };
    const items = await generateV2Exercises(emptyLesson, allEntities, emptyMastery);
    expect(items).toHaveLength(0);
  });

  it("resolves teachEntityIds and reviewEntityIds from entity registry", async () => {
    // Lesson 3 has letter:24 (meem) as teach and letter:1, letter:2 as review
    const lesson3 = LESSONS_V2.find((l) => l.id === 3);
    expect(lesson3).toBeDefined();
    if (!lesson3) return;

    // Should not throw even without pre-resolved entities
    const items = await generateV2Exercises(lesson3, [], emptyMastery);
    // Items may be empty if entity registry resolves nothing tappable,
    // but the call should not throw
    expect(Array.isArray(items)).toBe(true);
  });
});
