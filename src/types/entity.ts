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

// ── Letter Entity ──

export interface LetterEntity extends EntityBase {
  // Letters resolve from ARABIC_LETTERS (src/data/letters.js) at resolution time.
  // The adapted entity includes id, displayArabic, transliteration, and capabilities,
  // but does NOT include subtype-specific fields like audioKey or teachingBreakdownIds.
  // Downstream code that needs letter audio should look up ARABIC_LETTERS directly
  // by letter ID, not rely on an audioKey field here.
  // TODO(Plan 2+): Consider enriching LetterEntity with audioKey from letters.js data.
}

// ── Combo Entity ──

export interface ComboEntity extends EntityBase {
  // Combos are synthetic entities derived from letter + harakat at resolution time.
  // They are NOT stored in any registry — they are generated dynamically.
  // The returned entity includes id, displayArabic, transliteration, and capabilities,
  // but does NOT include audioKey or teachingBreakdownIds.
  // Downstream generators that need combo audio must derive the audio key from the
  // combo ID convention (e.g., "combo:ba-fatha" → audio key "combo_ba-fatha").
  // TODO(Plan 2+): Consider adding audioKey to ComboEntity if generators need it.
}

// ── Union type for any entity ──

export type AnyEntity =
  | LetterEntity
  | ComboEntity
  | ChunkEntity
  | WordEntity
  | PatternEntity
  | RuleEntity
  | OrthographyEntity;
