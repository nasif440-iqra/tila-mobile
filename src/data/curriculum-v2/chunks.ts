import type { ChunkEntity } from "@/src/types/entity";

export const CHUNKS: ChunkEntity[] = [
  {
    id: "chunk:ba-ma",
    displayArabic: "\u0628\u064E\u0645\u064E",
    transliteration: "bama",
    capabilities: ["hearable", "readable", "buildable"],
    teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
    breakdownType: "teaching",
    syllableCount: 2,
    audioKey: "chunk_ba-ma",
  },
  {
    id: "chunk:la-ma",
    displayArabic: "\u0644\u064E\u0645\u064E",
    transliteration: "lama",
    capabilities: ["hearable", "readable", "buildable"],
    teachingBreakdownIds: ["combo:la-fatha", "combo:ma-fatha"],
    breakdownType: "teaching",
    syllableCount: 2,
    audioKey: "chunk_la-ma",
  },
  {
    id: "chunk:ba-la",
    displayArabic: "\u0628\u064E\u0644\u064E",
    transliteration: "bala",
    capabilities: ["hearable", "readable", "buildable"],
    teachingBreakdownIds: ["combo:ba-fatha", "combo:la-fatha"],
    breakdownType: "teaching",
    syllableCount: 2,
    audioKey: "chunk_ba-la",
  },
];
