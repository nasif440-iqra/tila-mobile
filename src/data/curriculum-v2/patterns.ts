import type { PatternEntity } from "@/src/types/entity";

export const PATTERNS: PatternEntity[] = [
  {
    id: "pattern:cv-fatha",
    displayArabic: "\u25CC\u064E",
    transliteration: "consonant + a",
    capabilities: ["hearable", "readable"],
    patternType: "syllable",
    description: "A consonant with fatha makes a short 'a' syllable",
    exampleEntityIds: ["combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha"],
  },
];
