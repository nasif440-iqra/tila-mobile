// ── Capabilities ──

export type EntityCapability =
  | "tappable"
  | "hearable"
  | "readable"
  | "buildable"
  | "fixable"
  | "quran-renderable";

// ── Base Entity ──

export interface EntityBase {
  id: string;
  displayArabic: string;
  displayArabicAlt?: string;
  transliteration?: string;
  capabilities: EntityCapability[];
}

// ── Chunk Entity ──

export interface ChunkEntity extends EntityBase {
  teachingBreakdownIds: string[];
  breakdownType: "teaching" | "visual" | "phonological";
  syllableCount: number;
  connectedForm?: string;
  audioKey: string;
}

// ── Word Entity ──

export interface WordEntity extends EntityBase {
  teachingBreakdownIds: string[];
  breakdownType: "teaching" | "visual" | "phonological";
  connectedForm: string;
  quranScriptForm?: string;
  frequency?: "high" | "medium" | "low";
  teachingPriority?: "core" | "supporting" | "later";
  surahReferences?: string[];
  audioKey: string;
}

// ── Pattern Entity ──

export interface PatternEntity extends EntityBase {
  patternType: "vowel" | "consonant" | "syllable" | "assimilation";
  description: string;
  exampleEntityIds: string[];
  contrastEntityIds?: string[];
}

// ── Rule Entity ──

export interface RuleEntity extends EntityBase {
  ruleType: "mark" | "joining" | "stopping" | "pronunciation" | "vowel-behavior";
  description: string;
  appliesTo: string[];
  exampleEntityIds: string[];
  prerequisiteRuleIds?: string[];
}

// ── Orthography Entity ──

export interface OrthographyEntity extends EntityBase {
  orthographyType: "special-form" | "small-mark" | "ligature" | "pause-mark";
  description: string;
  standardForm: string;
  quranForm: string;
  exampleEntityIds: string[];
}

// ── Union type for any entity ──

export type AnyEntity =
  | EntityBase
  | ChunkEntity
  | WordEntity
  | PatternEntity
  | RuleEntity
  | OrthographyEntity;
