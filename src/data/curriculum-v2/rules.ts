import type { RuleEntity } from "@/src/types/entity";

export const RULES: RuleEntity[] = [
  {
    id: "rule:fatha",
    displayArabic: "\u064E",
    transliteration: "fatha",
    capabilities: ["tappable", "hearable", "readable", "fixable"],
    ruleType: "mark",
    description: "A small diagonal stroke above a letter — produces a short 'a' sound",
    appliesTo: ["combo", "chunk", "word"],
    exampleEntityIds: ["combo:ba-fatha", "combo:ma-fatha"],
  },
  {
    id: "rule:rtl-reading",
    displayArabic: "\u2190",
    capabilities: ["readable"],
    ruleType: "pronunciation",
    description: "Arabic reads right-to-left",
    appliesTo: ["chunk", "word"],
    exampleEntityIds: ["chunk:ba-ma"],
  },
];
