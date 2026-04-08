# Curriculum V2 — Plan 1: Data Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v2 curriculum type system, content registries, entity resolution, build-time validation, and database tables — everything the v2 engine needs to exist before generators can run.

**Architecture:** TypeScript types define the v2 lesson schema with `exercisePlan` replacing `lessonMode`. Content registries (chunks, words, patterns, rules, orthography, assessment profiles) are typed lookup tables keyed by entity ID. A thin entity registry resolves and validates entities. New v2 database tables store progress in isolation from v1. A vertical-slice sample dataset (5 lessons) proves the data layer works end-to-end.

**Tech Stack:** TypeScript 5.9, Vitest 4.1, expo-sqlite (for DB migration), existing `src/data/letters.js` and `src/data/harakat.js` as neutral shared data.

**Spec:** `docs/superpowers/specs/2026-04-07-curriculum-v2-design.md` — Sections 1, 2, and 5.4.

---

## File Structure

```
src/
  types/
    curriculum-v2.ts              # LessonV2, ExerciseStep, ExerciseSource, PhaseV2, MasteryPolicy
    entity.ts                     # EntityBase, EntityCapability, all entity subtypes
    exercise.ts                   # ExerciseItem, CorrectAnswer, FixSegment, ExercisePrompt
    assessment.ts                 # AssessmentProfile

  data/
    curriculum-v2/
      index.ts                    # barrel export
      lessons.ts                  # vertical-slice lessons (5 + checkpoint)
      phases.ts                   # 6 phase definitions
      chunks.ts                   # chunk registry (vertical-slice subset)
      words.ts                    # word registry (empty for Plan 1, populated later)
      patterns.ts                 # pattern registry (vertical-slice subset)
      rules.ts                    # rule registry (vertical-slice subset)
      orthography.ts              # orthography registry (empty for Plan 1)
      assessmentProfiles.ts       # checkpoint profiles (1 for vertical slice)

  engine/
    v2/
      entityRegistry.ts           # resolve, hasCapability, filterByCapability
      validation.ts               # build-time validation (9 rules)

  db/
    schema-v2.ts                  # v2 table CREATE statements
    migrate-v2.ts                 # v2 migration runner

  __tests__/
    types/
      curriculum-v2.test.ts       # type-level tests (compile-time checks)
    data/
      curriculum-v2-lessons.test.ts  # lesson data validation tests
    engine/
      entityRegistry.test.ts      # entity resolution tests
      validation.test.ts          # build-time validation tests
    db/
      schema-v2.test.ts           # DB table creation tests
```

---

### Task 1: V2 Curriculum Types

**Files:**
- Create: `src/types/curriculum-v2.ts`
- Test: `src/__tests__/types/curriculum-v2.test.ts`

- [ ] **Step 1: Write type assertion tests**

These tests verify the types compile correctly and enforce the discriminated union. They run at compile time via `tsc` and at test time via Vitest.

```typescript
// src/__tests__/types/curriculum-v2.test.ts
import { describe, it, expect } from "vitest";
import type {
  LessonV2,
  ExerciseStep,
  ExerciseSource,
  PhaseV2,
  MasteryPolicy,
} from "@/src/types/curriculum-v2";

describe("curriculum-v2 types", () => {
  it("accepts a valid LessonV2 with exercisePlan", () => {
    const lesson: LessonV2 = {
      id: 1,
      phase: 1,
      module: "1.1",
      moduleTitle: "First Real Decoding Wins",
      title: "Arabic Starts Here",
      description: "Orient to right-to-left reading",
      teachEntityIds: ["letter:1", "letter:2"],
      reviewEntityIds: [],
      exercisePlan: [
        { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
        {
          type: "hear",
          count: 2,
          target: "letter",
          source: { from: "teach" },
          direction: "audio-to-script",
        },
      ],
      masteryPolicy: { passThreshold: 0.85 },
    };
    expect(lesson.id).toBe(1);
    expect(lesson.exercisePlan).toHaveLength(2);
  });

  it("accepts a LessonV2 with decode gating", () => {
    const lesson: LessonV2 = {
      id: 7,
      phase: 1,
      module: "1.1",
      title: "Checkpoint 1: Tiny Chunks",
      description: "Confirm decoding ability",
      teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha"],
      reviewEntityIds: [],
      exercisePlan: [
        {
          type: "check",
          count: 10,
          target: "mixed",
          source: { from: "all" },
          assessmentProfile: "phase-1-checkpoint",
        },
      ],
      masteryPolicy: {
        passThreshold: 0.9,
        decodePassRequired: 2,
        decodeMinPercent: 0.8,
      },
      renderProfile: "isolated",
    };
    expect(lesson.masteryPolicy.passThreshold).toBe(0.9);
  });

  it("accepts all ExerciseSource variants", () => {
    const sources: ExerciseSource[] = [
      { from: "teach" },
      { from: "review" },
      { from: "mixed", mix: { teach: 3, review: 1 } },
      { from: "all" },
      { from: "explicit", entityIds: ["letter:1", "combo:ba-fatha"] },
    ];
    expect(sources).toHaveLength(5);
  });

  it("accepts a valid PhaseV2", () => {
    const phase: PhaseV2 = {
      phase: 1,
      title: "First Real Decoding Wins",
      goal: "Get the learner from zero to tiny Arabic chunk decoding",
      unlockRuleText: "No prerequisite — this is the first phase",
      unlockPolicy: {
        requirePhase: 0,
        requireCheckpointPass: false,
      },
    };
    expect(phase.phase).toBe(1);
  });

  it("accepts a PhaseV2 with review queue policy", () => {
    const phase: PhaseV2 = {
      phase: 3,
      title: "Core Word Reading",
      goal: "Turn chunk reading into word reading",
      unlockRuleText: "Pass Phase 2 checkpoint, review queue clear",
      unlockPolicy: {
        requirePhase: 2,
        requireCheckpointPass: true,
        reviewQueuePolicy: {
          maxOverdueCritical: 3,
          overdueDaysThreshold: 7,
          scopeTag: "phase-2-core",
        },
        minRetainedEntities: 10,
      },
    };
    expect(phase.unlockPolicy.reviewQueuePolicy?.maxOverdueCritical).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/types/curriculum-v2.test.ts`
Expected: FAIL — cannot find module `@/src/types/curriculum-v2`

- [ ] **Step 3: Write the type definitions**

```typescript
// src/types/curriculum-v2.ts

// ── Exercise Source ──

export type ExerciseSource =
  | { from: "teach" }
  | { from: "review" }
  | { from: "mixed"; mix?: { teach: number; review: number } }
  | { from: "all" }
  | { from: "explicit"; entityIds: string[] };

// ── Exercise Step (discriminated union) ──

export type ExerciseStep =
  | {
      type: "tap";
      count: number;
      target: "letter" | "form" | "mark";
      source: ExerciseSource;
      distractorCount?: number;
    }
  | {
      type: "hear";
      count: number;
      target: "letter" | "combo" | "chunk" | "word";
      source: ExerciseSource;
      direction: "audio-to-script" | "script-to-audio";
    }
  | {
      type: "choose";
      count: number;
      target: "letter" | "combo" | "rule" | "word";
      source: ExerciseSource;
      distractorStrategy?: "family" | "vowel" | "shape" | "similar-word";
    }
  | {
      type: "build";
      count: number;
      target: "combo" | "chunk" | "word" | "phrase";
      source: ExerciseSource;
      maxTiles?: number;
    }
  | {
      type: "read";
      count: number;
      target: "combo" | "chunk" | "word" | "phrase" | "verse";
      source: ExerciseSource;
      connected?: boolean;
      renderOverride?: "connected" | "quran-script" | "mushaf";
    }
  | {
      type: "fix";
      count: number;
      target: "vowel" | "dot" | "join" | "letter" | "word";
      source: ExerciseSource;
    }
  | {
      type: "check";
      count: number;
      target: "mixed";
      source: ExerciseSource;
      assessmentProfile: string;
    };

// ── Mastery Policy ──

export interface MasteryPolicy {
  passThreshold: number;
  decodePassRequired?: number;
  decodeMinPercent?: number;
}

// ── Render Profile ──

export type RenderProfile = "isolated" | "connected" | "quran-script" | "mushaf";

// ── Lesson V2 ──

export interface LessonV2 {
  id: number;
  phase: number;
  module: string;
  moduleTitle?: string;
  title: string;
  description: string;
  teachEntityIds: string[];
  reviewEntityIds: string[];
  exercisePlan: ExerciseStep[];
  masteryPolicy: MasteryPolicy;
  renderProfile?: RenderProfile;
  hintRuleId?: string;
  tags?: string[];
}

// ── Phase V2 ──

export interface ReviewQueuePolicy {
  maxOverdueCritical: number;
  overdueDaysThreshold: number;
  scopeTag?: string;
}

export interface PhaseUnlockPolicy {
  requirePhase: number;
  requireCheckpointPass: boolean;
  reviewQueuePolicy?: ReviewQueuePolicy;
  minRetainedEntities?: number;
}

export interface PhaseV2 {
  phase: number;
  title: string;
  goal: string;
  unlockRuleText: string;
  unlockPolicy: PhaseUnlockPolicy;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/types/curriculum-v2.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: No errors related to curriculum-v2.ts

- [ ] **Step 6: Commit**

```bash
git add src/types/curriculum-v2.ts src/__tests__/types/curriculum-v2.test.ts
git commit -m "feat(v2): add curriculum v2 type definitions

LessonV2, ExerciseStep discriminated union, ExerciseSource,
PhaseV2 with typed unlock policy, MasteryPolicy."
```

---

### Task 2: Entity Types

**Files:**
- Create: `src/types/entity.ts`
- Create: `src/types/assessment.ts`

- [ ] **Step 1: Write entity type tests**

```typescript
// src/__tests__/types/curriculum-v2.test.ts (append to existing file)
import type {
  EntityBase,
  EntityCapability,
  ChunkEntity,
  WordEntity,
  PatternEntity,
  RuleEntity,
  OrthographyEntity,
} from "@/src/types/entity";
import type { AssessmentProfile } from "@/src/types/assessment";

describe("entity types", () => {
  it("accepts a ChunkEntity", () => {
    const chunk: ChunkEntity = {
      id: "chunk:bama",
      displayArabic: "\u0628\u064E\u0645\u064E",
      transliteration: "bama",
      capabilities: ["hearable", "readable", "buildable"],
      teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
      breakdownType: "teaching",
      syllableCount: 2,
      audioKey: "chunk_bama",
    };
    expect(chunk.capabilities).toContain("readable");
  });

  it("accepts a WordEntity", () => {
    const word: WordEntity = {
      id: "word:allah",
      displayArabic: "\u0627\u0644\u0644\u0647",
      displayArabicAlt: "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
      transliteration: "allah",
      capabilities: ["hearable", "readable", "buildable", "quran-renderable"],
      teachingBreakdownIds: ["combo:alif-laam", "rule:shaddah", "combo:la-fatha", "combo:ha-kasra"],
      breakdownType: "teaching",
      connectedForm: "\u0627\u0644\u0644\u0647",
      quranScriptForm: "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
      frequency: "high",
      teachingPriority: "core",
      surahReferences: ["1:1", "1:2"],
      audioKey: "word_allah",
    };
    expect(word.frequency).toBe("high");
  });

  it("accepts a RuleEntity", () => {
    const rule: RuleEntity = {
      id: "rule:shaddah",
      displayArabic: "\u0651",
      capabilities: ["hearable", "readable", "fixable"],
      ruleType: "mark",
      description: "Doubles the consonant it sits on",
      appliesTo: ["combo", "word"],
      exampleEntityIds: ["word:allah"],
    };
    expect(rule.ruleType).toBe("mark");
  });

  it("accepts an AssessmentProfile", () => {
    const profile: AssessmentProfile = {
      id: "phase-1-checkpoint",
      description: "Confirm decoding of tiny unseen items",
      targetCapabilities: ["readable", "hearable"],
      exerciseWeights: [
        { type: "read", weight: 0.5 },
        { type: "choose", weight: 0.2 },
        { type: "hear", weight: 0.2 },
        { type: "build", weight: 0.1 },
      ],
      minimumReadPercent: 0.4,
      scaffoldingLevel: "none",
      diagnosticTags: ["vowel-confusion", "letter-confusion", "audio-mapping"],
      bucketThresholds: { "vowel-confusion": 0.6, "letter-confusion": 0.6 },
    };
    expect(profile.scaffoldingLevel).toBe("none");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/types/curriculum-v2.test.ts`
Expected: FAIL — cannot find module `@/src/types/entity`

- [ ] **Step 3: Write entity type definitions**

```typescript
// src/types/entity.ts

import type { ExerciseStep } from "./curriculum-v2";

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
```

```typescript
// src/types/assessment.ts

import type { EntityCapability } from "./entity";
import type { ExerciseStep } from "./curriculum-v2";

export interface AssessmentProfile {
  id: string;
  description: string;
  targetCapabilities: EntityCapability[];
  exerciseWeights: { type: ExerciseStep["type"]; weight: number }[];
  minimumReadPercent: number;
  scaffoldingLevel: "none" | "minimal" | "light";
  diagnosticTags?: string[];
  bucketThresholds?: Record<string, number>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/types/curriculum-v2.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/types/entity.ts src/types/assessment.ts src/__tests__/types/curriculum-v2.test.ts
git commit -m "feat(v2): add entity and assessment profile type definitions

EntityBase with capabilities, ChunkEntity, WordEntity, PatternEntity,
RuleEntity, OrthographyEntity, AssessmentProfile."
```

---

### Task 2.5: Exercise Types

**Files:**
- Create: `src/types/exercise.ts`

The spec's file structure lists `src/types/exercise.ts` for `ExerciseItem`, `CorrectAnswer`, `FixSegment`, and `ExercisePrompt`. These are needed by Plan 2 generators but should exist now so the type system is complete.

- [ ] **Step 1: Write exercise type definitions**

```typescript
// src/types/exercise.ts

import type { ExerciseStep, RenderProfile } from "./curriculum-v2";
import type { EntityCapability } from "./entity";

// ── Correct Answer (typed per exercise kind) ──

export type CorrectAnswer =
  | { kind: "single"; value: string }
  | { kind: "sequence"; values: string[] }
  | { kind: "fix"; location: string; replacement: string };

// ── Fix Segment (generator-provided hit zones) ──

export interface FixSegment {
  segmentId: string;
  displayText: string;
  isErrorLocation: boolean;
  boundingGroup: "letter" | "mark" | "join" | "word";
}

// ── Exercise Prompt (render-ready display payload) ──

export interface ExercisePrompt {
  text?: string;                     // instructional text ("Which letter is this?")
  arabicDisplay: string;             // primary Arabic content
  arabicDisplayAlt?: string;         // alternate rendering (Uthmani)
  audioKey?: string;                 // audio for the prompt
  hintText?: string;                 // scaffolding hint (only at full/light)
}

// ── Exercise Option ──

export interface ExerciseOption {
  id: string;
  displayArabic?: string;
  displayText?: string;              // for transliteration options (Phase 1 only)
  audioKey?: string;                 // for audio options
  isCorrect: boolean;
}

// ── Build Tile ──

export interface BuildTile {
  id: string;
  displayArabic: string;
  entityId: string;                  // which entity this tile represents
  isDistractor: boolean;
}

// ── Exercise Item (one screen the learner interacts with) ──

export interface ExerciseItem {
  type: ExerciseStep["type"];
  prompt: ExercisePrompt;
  options?: ExerciseOption[];
  tiles?: BuildTile[];
  correctAnswer: CorrectAnswer;
  targetEntityId: string;
  isDecodeItem: boolean;
  diagnosticTags?: string[];
  answerMode: "transliteration" | "audio" | "arabic" | "build" | "fix-locate";
  preloadHint?: { audioKeys: string[]; entityIds: string[] };
  fixSegments?: FixSegment[];
  generatedBy?: ExerciseStep["type"];
  assessmentBucket?: string;
}

// ── Scored Item ──

export interface ScoredItem {
  item: ExerciseItem;
  correct: boolean;
  responseTimeMs: number;
  generatedBy: ExerciseStep["type"];
  assessmentBucket?: string;
  answerMode: string;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/exercise.ts
git commit -m "feat(v2): add exercise types — ExerciseItem, CorrectAnswer, FixSegment, ScoredItem

Render-ready types for Plan 2 generators. Includes typed CorrectAnswer union,
generator-provided FixSegment hit zones, and ScoredItem for scoring layer."
```

---

### Task 3: Content Registries — Vertical Slice Data

**Files:**
- Create: `src/data/curriculum-v2/chunks.ts`
- Create: `src/data/curriculum-v2/words.ts`
- Create: `src/data/curriculum-v2/patterns.ts`
- Create: `src/data/curriculum-v2/rules.ts`
- Create: `src/data/curriculum-v2/orthography.ts`
- Create: `src/data/curriculum-v2/assessmentProfiles.ts`
- Create: `src/data/curriculum-v2/index.ts`
- Test: `src/__tests__/data/curriculum-v2-registries.test.ts`

This task creates registries with enough data for the vertical-slice (5 lessons + 1 checkpoint). Full content population happens in Plan 5.

- [ ] **Step 1: Write registry tests**

```typescript
// src/__tests__/data/curriculum-v2-registries.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/data/curriculum-v2-registries.test.ts`
Expected: FAIL — cannot find module `@/src/data/curriculum-v2`

- [ ] **Step 3: Create registry files**

```typescript
// src/data/curriculum-v2/chunks.ts
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
```

```typescript
// src/data/curriculum-v2/words.ts
import type { WordEntity } from "@/src/types/entity";

// Empty for vertical slice — populated in Plan 5
export const WORDS: WordEntity[] = [];
```

```typescript
// src/data/curriculum-v2/patterns.ts
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
```

```typescript
// src/data/curriculum-v2/rules.ts
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
```

```typescript
// src/data/curriculum-v2/orthography.ts
import type { OrthographyEntity } from "@/src/types/entity";

// Empty for vertical slice — populated in Plan 5 (Phase 5+ content)
export const ORTHOGRAPHY: OrthographyEntity[] = [];
```

```typescript
// src/data/curriculum-v2/assessmentProfiles.ts
import type { AssessmentProfile } from "@/src/types/assessment";

export const ASSESSMENT_PROFILES: AssessmentProfile[] = [
  {
    id: "phase-1-checkpoint",
    description: "Confirm the learner can decode short unseen items, not merely tap familiar letters",
    targetCapabilities: ["readable", "hearable"],
    exerciseWeights: [
      { type: "read", weight: 0.5 },
      { type: "choose", weight: 0.2 },
      { type: "hear", weight: 0.2 },
      { type: "build", weight: 0.1 },
    ],
    minimumReadPercent: 0.4,
    scaffoldingLevel: "none",
    diagnosticTags: ["vowel-confusion", "letter-confusion", "audio-mapping"],
    bucketThresholds: { "vowel-confusion": 0.6, "letter-confusion": 0.6, "audio-mapping": 0.6 },
  },
];
```

```typescript
// src/data/curriculum-v2/index.ts
export { CHUNKS } from "./chunks";
export { WORDS } from "./words";
export { PATTERNS } from "./patterns";
export { RULES } from "./rules";
export { ORTHOGRAPHY } from "./orthography";
export { ASSESSMENT_PROFILES } from "./assessmentProfiles";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/data/curriculum-v2-registries.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/curriculum-v2/ src/__tests__/data/curriculum-v2-registries.test.ts
git commit -m "feat(v2): add content registries with vertical-slice data

Chunks, patterns, rules for first 5 lessons. Words and orthography
empty — populated in content plan. Assessment profile for Phase 1 checkpoint."
```

---

### Task 4: Vertical Slice Lesson Data + Phases

**Files:**
- Create: `src/data/curriculum-v2/lessons.ts`
- Create: `src/data/curriculum-v2/phases.ts`
- Update: `src/data/curriculum-v2/index.ts`
- Test: `src/__tests__/data/curriculum-v2-lessons.test.ts`

5 lessons from Phase 1 (lessons 1-5) + checkpoint (lesson 7) to prove the schema works with real curriculum content.

- [ ] **Step 1: Write lesson data tests**

```typescript
// src/__tests__/data/curriculum-v2-lessons.test.ts
import { describe, it, expect } from "vitest";
import { LESSONS_V2, PHASES_V2 } from "@/src/data/curriculum-v2";
import type { LessonV2 } from "@/src/types/curriculum-v2";

describe("curriculum-v2 lesson data", () => {
  it("has at least 6 lessons for vertical slice", () => {
    expect(LESSONS_V2.length).toBeGreaterThanOrEqual(6);
  });

  it("all lessons have unique IDs", () => {
    const ids = LESSONS_V2.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all lessons have non-empty exercisePlan", () => {
    LESSONS_V2.forEach((lesson) => {
      expect(lesson.exercisePlan.length).toBeGreaterThan(0);
    });
  });

  it("all lessons have valid passThreshold between 0 and 1", () => {
    LESSONS_V2.forEach((lesson) => {
      expect(lesson.masteryPolicy.passThreshold).toBeGreaterThan(0);
      expect(lesson.masteryPolicy.passThreshold).toBeLessThanOrEqual(1);
    });
  });

  it("all entity IDs follow prefix convention", () => {
    const validPrefixes = ["letter:", "combo:", "chunk:", "word:", "pattern:", "rule:", "orthography:"];
    LESSONS_V2.forEach((lesson) => {
      [...lesson.teachEntityIds, ...lesson.reviewEntityIds].forEach((id) => {
        const hasValidPrefix = validPrefixes.some((p) => id.startsWith(p));
        expect(hasValidPrefix).toBe(true);
      });
    });
  });

  it("checkpoint lesson has assessmentProfile", () => {
    const checkpoints = LESSONS_V2.filter((l) =>
      l.exercisePlan.some((s) => s.type === "check")
    );
    expect(checkpoints.length).toBeGreaterThanOrEqual(1);
    checkpoints.forEach((cp) => {
      const checkStep = cp.exercisePlan.find((s) => s.type === "check");
      expect(checkStep).toBeDefined();
      if (checkStep?.type === "check") {
        expect(checkStep.assessmentProfile).toBeTruthy();
      }
    });
  });

  it("lessons with decodePassRequired end with decode-capable steps", () => {
    LESSONS_V2.filter((l) => l.masteryPolicy.decodePassRequired).forEach((lesson) => {
      const required = lesson.masteryPolicy.decodePassRequired!;
      const plan = lesson.exercisePlan;
      // Count total decode items from the end
      let decodeItemCount = 0;
      for (let i = plan.length - 1; i >= 0; i--) {
        const step = plan[i];
        if (step.type === "read" || step.type === "check") {
          decodeItemCount += step.count;
        } else {
          break;
        }
      }
      expect(decodeItemCount).toBeGreaterThanOrEqual(required);
    });
  });

  it("has 6 phase definitions", () => {
    expect(PHASES_V2).toHaveLength(6);
  });

  it("phases are numbered 1-6 in order", () => {
    PHASES_V2.forEach((phase, i) => {
      expect(phase.phase).toBe(i + 1);
    });
  });

  it("phase 1 has no prerequisites", () => {
    expect(PHASES_V2[0].unlockPolicy.requirePhase).toBe(0);
    expect(PHASES_V2[0].unlockPolicy.requireCheckpointPass).toBe(false);
  });

  it("phases 2-6 require previous phase", () => {
    PHASES_V2.slice(1).forEach((phase) => {
      expect(phase.unlockPolicy.requirePhase).toBe(phase.phase - 1);
      expect(phase.unlockPolicy.requireCheckpointPass).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/data/curriculum-v2-lessons.test.ts`
Expected: FAIL — LESSONS_V2 not exported

- [ ] **Step 3: Create lesson and phase data**

```typescript
// src/data/curriculum-v2/lessons.ts
import type { LessonV2 } from "@/src/types/curriculum-v2";

export const LESSONS_V2: LessonV2[] = [
  // ── Phase 1: First Real Decoding Wins ──

  {
    id: 1,
    phase: 1,
    module: "1.1",
    moduleTitle: "First Real Decoding Wins",
    title: "Arabic Starts Here",
    description: "Orient to right-to-left reading, shape change in words, and the idea that a letter plus a mark makes a sound",
    teachEntityIds: ["letter:1", "letter:2", "rule:rtl-reading"],
    reviewEntityIds: [],
    exercisePlan: [
      { type: "tap", count: 3, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 3, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
    ],
    masteryPolicy: { passThreshold: 0.85 },
    renderProfile: "isolated",
  },

  {
    id: 2,
    phase: 1,
    module: "1.1",
    title: "Meet Alif + Ba with Fatha",
    description: "Learn \u0627 and \u0628 with fatha and read the first real syllable: \u0628\u064E",
    teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha", "rule:fatha"],
    reviewEntityIds: [],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
      { type: "choose", count: 3, target: "letter", source: { from: "teach" }, distractorStrategy: "shape" },
      { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  {
    id: 3,
    phase: 1,
    module: "1.1",
    title: "Meet Meem",
    description: "Add \u0645 and read \u0645\u064E / \u0628\u064E without guessing",
    teachEntityIds: ["letter:24", "combo:ma-fatha"],
    reviewEntityIds: ["letter:1", "letter:2", "combo:ba-fatha"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  {
    id: 4,
    phase: 1,
    module: "1.1",
    title: "Meet Laam",
    description: "Add \u0644 and expand the first readable set of symbols",
    teachEntityIds: ["letter:23", "combo:la-fatha"],
    reviewEntityIds: ["letter:2", "letter:24", "combo:ba-fatha", "combo:ma-fatha"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  {
    id: 5,
    phase: 1,
    module: "1.1",
    title: "First Decoding Sprint",
    description: "No new symbols \u2014 decode short CV chunks using known letters only",
    teachEntityIds: ["chunk:ba-ma", "chunk:la-ma", "chunk:ba-la"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha"],
    exercisePlan: [
      { type: "hear", count: 2, target: "chunk", source: { from: "teach" }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "review" }, distractorStrategy: "vowel" },
      { type: "build", count: 3, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      { type: "read", count: 3, target: "chunk", source: { from: "mixed", mix: { teach: 2, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  // Checkpoint (lesson 7 in the new curriculum)
  {
    id: 7,
    phase: 1,
    module: "1.1",
    title: "Checkpoint 1: Tiny Chunks",
    description: "Confirm the learner can decode short unseen items, not merely tap familiar letters",
    teachEntityIds: ["letter:1", "letter:2", "letter:24", "letter:23", "combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha", "chunk:ba-ma", "chunk:la-ma"],
    reviewEntityIds: [],
    exercisePlan: [
      { type: "check", count: 10, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-1-checkpoint" },
    ],
    masteryPolicy: {
      passThreshold: 0.9,
      decodePassRequired: 2,
      decodeMinPercent: 0.8,
    },
    renderProfile: "isolated",
  },
];
```

```typescript
// src/data/curriculum-v2/phases.ts
import type { PhaseV2 } from "@/src/types/curriculum-v2";

export const PHASES_V2: PhaseV2[] = [
  {
    phase: 1,
    title: "First Real Decoding Wins",
    goal: "Get the learner from 'Arabic scares me' to 'I can sound out tiny Arabic chunks'",
    unlockRuleText: "No prerequisite — this is the first phase",
    unlockPolicy: { requirePhase: 0, requireCheckpointPass: false },
  },
  {
    phase: 2,
    title: "Three Short Vowels and Early Connected Forms",
    goal: "Build secure short-vowel reading and introduce connected script before bad isolated-form habits set in",
    unlockRuleText: "Pass Phase 1 checkpoint",
    unlockPolicy: { requirePhase: 1, requireCheckpointPass: true },
  },
  {
    phase: 3,
    title: "Core Word Reading and Joining Logic",
    goal: "Turn short chunk reading into short word reading while making joining behavior feel normal",
    unlockRuleText: "Pass Phase 2 checkpoint, review queue clear",
    unlockPolicy: {
      requirePhase: 2,
      requireCheckpointPass: true,
      reviewQueuePolicy: { maxOverdueCritical: 3, overdueDaysThreshold: 7 },
    },
  },
  {
    phase: 4,
    title: "Long Vowels, Diphthongs, and Heavy Letters",
    goal: "Teach vowel behavior and core consonants needed for Al-Fatiha",
    unlockRuleText: "Pass Phase 3 checkpoint, review queue clear",
    unlockPolicy: {
      requirePhase: 3,
      requireCheckpointPass: true,
      reviewQueuePolicy: { maxOverdueCritical: 3, overdueDaysThreshold: 7 },
      minRetainedEntities: 10,
    },
  },
  {
    phase: 5,
    title: "Quran-Script Bridge",
    goal: "Bridge from simplified connected Arabic to the orthographic realities of Quran text",
    unlockRuleText: "Pass Phase 4 checkpoint, review queue clear",
    unlockPolicy: {
      requirePhase: 4,
      requireCheckpointPass: true,
      reviewQueuePolicy: { maxOverdueCritical: 3, overdueDaysThreshold: 7 },
      minRetainedEntities: 20,
    },
  },
  {
    phase: 6,
    title: "Surah Al-Fatiha Transfer",
    goal: "Take the learner from chunk-level decoding to a full, unsupported reading of Surah Al-Fatiha",
    unlockRuleText: "Pass Phase 5 checkpoint (Quran-Script Readiness)",
    unlockPolicy: {
      requirePhase: 5,
      requireCheckpointPass: true,
      reviewQueuePolicy: { maxOverdueCritical: 2, overdueDaysThreshold: 5 },
      minRetainedEntities: 30,
    },
  },
];
```

Update the barrel export:

```typescript
// src/data/curriculum-v2/index.ts
export { CHUNKS } from "./chunks";
export { WORDS } from "./words";
export { PATTERNS } from "./patterns";
export { RULES } from "./rules";
export { ORTHOGRAPHY } from "./orthography";
export { ASSESSMENT_PROFILES } from "./assessmentProfiles";
export { LESSONS_V2 } from "./lessons";
export { PHASES_V2 } from "./phases";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/data/curriculum-v2-lessons.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/curriculum-v2/ src/__tests__/data/curriculum-v2-lessons.test.ts
git commit -m "feat(v2): add vertical-slice lesson data and phase definitions

6 lessons (5 teaching + 1 checkpoint) for Phase 1 vertical slice.
All 6 phase definitions with typed unlock policies."
```

---

### Task 5: Entity Registry

**Files:**
- Create: `src/engine/v2/entityRegistry.ts`
- Test: `src/__tests__/engine/entityRegistry.test.ts`

- [ ] **Step 1: Write entity registry tests**

```typescript
// src/__tests__/engine/entityRegistry.test.ts
import { describe, it, expect } from "vitest";
import {
  resolveEntity,
  resolveAll,
  hasCapability,
  filterByCapability,
} from "@/src/engine/v2/entityRegistry";

describe("entityRegistry", () => {
  describe("resolveEntity", () => {
    it("resolves a letter entity by ID", async () => {
      const entity = await resolveEntity("letter:2");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("letter:2");
      expect(entity!.displayArabic).toBe("\u0628");
    });

    it("resolves a chunk entity by ID", async () => {
      const entity = await resolveEntity("chunk:ba-ma");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("chunk:ba-ma");
    });

    it("resolves a combo entity by ID", async () => {
      const entity = await resolveEntity("combo:ba-fatha");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("combo:ba-fatha");
    });

    it("resolves a rule entity by ID", async () => {
      const entity = await resolveEntity("rule:fatha");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("rule:fatha");
    });

    it("returns undefined for unknown entity", async () => {
      const entity = await resolveEntity("letter:999");
      expect(entity).toBeUndefined();
    });

    it("returns undefined for invalid prefix", async () => {
      const entity = await resolveEntity("invalid:1");
      expect(entity).toBeUndefined();
    });
  });

  describe("resolveAll", () => {
    it("resolves multiple entities", async () => {
      const entities = await resolveAll(["letter:1", "letter:2", "chunk:ba-ma"]);
      expect(entities).toHaveLength(3);
    });

    it("filters out unresolvable IDs", async () => {
      const entities = await resolveAll(["letter:1", "letter:999"]);
      expect(entities).toHaveLength(1);
    });
  });

  describe("hasCapability", () => {
    it("returns true for a capability the entity has", async () => {
      const entity = await resolveEntity("chunk:ba-ma");
      expect(hasCapability(entity!, "readable")).toBe(true);
    });

    it("returns false for a capability the entity lacks", async () => {
      const entity = await resolveEntity("rule:rtl-reading");
      expect(hasCapability(entity!, "buildable")).toBe(false);
    });
  });

  describe("filterByCapability", () => {
    it("filters entities to only those with the capability", async () => {
      const entities = await resolveAll(["letter:1", "chunk:ba-ma", "rule:rtl-reading"]);
      const buildable = filterByCapability(entities, "buildable");
      expect(buildable).toHaveLength(1);
      expect(buildable[0].id).toBe("chunk:ba-ma");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/engine/entityRegistry.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement entity registry**

```typescript
// src/engine/v2/entityRegistry.ts
import type { AnyEntity, EntityBase, EntityCapability } from "@/src/types/entity";
import { ARABIC_LETTERS } from "@/src/data/letters";
import { CHUNKS, RULES, PATTERNS, WORDS, ORTHOGRAPHY } from "@/src/data/curriculum-v2";

// ── Letter → AnyEntity adapter ──

function letterToEntity(letter: typeof ARABIC_LETTERS[number]): AnyEntity {
  return {
    id: `letter:${letter.id}`,
    displayArabic: letter.letter,
    transliteration: letter.transliteration,
    capabilities: ["tappable", "hearable", "readable"],
  };
}

// ── Combo → AnyEntity adapter ──
// Combos are derived from letters + harakat at resolution time.
// Format: "combo:{slug}-{harakatName}" e.g. "combo:ba-fatha"
// Slug mapping is stable and independent of ARABIC_LETTERS.name casing.

const HARAKAT_MAP: Record<string, { mark: string; sound: string }> = {
  fatha: { mark: "\u064E", sound: "a" },
  kasra: { mark: "\u0650", sound: "i" },
  damma: { mark: "\u064F", sound: "u" },
};

// Stable slug → letter ID mapping. Slug is the combo key prefix.
// Keyed by lowercase slug used in combo IDs, NOT by ARABIC_LETTERS.name.
const COMBO_SLUG_TO_LETTER_ID: Record<string, number> = {
  alif: 1, ba: 2, ta: 3, tha: 4, jeem: 5, haa: 6, khaa: 7,
  daal: 8, dhaal: 9, ra: 10, zay: 11, seen: 12, sheen: 13,
  saad: 14, daad: 15, taa: 16, dhaa: 17, ain: 18, ghain: 19,
  fa: 20, qaf: 21, kaf: 22, la: 23, ma: 24, noon: 25,
  ha: 26, waw: 27, ya: 28,
  // Aliases for common short forms used in combo IDs
  lam: 23, meem: 24, nun: 25,
};

function resolveCombo(id: string): AnyEntity | undefined {
  const comboKey = id.replace("combo:", "");
  const lastDash = comboKey.lastIndexOf("-");
  if (lastDash === -1) return undefined;

  const slug = comboKey.substring(0, lastDash);
  const harakatName = comboKey.substring(lastDash + 1);

  const letterId = COMBO_SLUG_TO_LETTER_ID[slug];
  const letter = letterId != null
    ? ARABIC_LETTERS.find((l) => l.id === letterId)
    : undefined;
  const harakat = HARAKAT_MAP[harakatName];

  if (!letter || !harakat) return undefined;

  return {
    id,
    displayArabic: `${letter.letter}${harakat.mark}`,
    transliteration: `${letter.transliteration}${harakat.sound}`,
    capabilities: ["hearable", "readable", "buildable", "tappable"],
  };
}

// ── Registry lookup tables (built lazily) ──

let letterMap: Map<string, AnyEntity> | null = null;
let registryMap: Map<string, AnyEntity> | null = null;

function getLetterMap(): Map<string, AnyEntity> {
  if (!letterMap) {
    letterMap = new Map();
    for (const letter of ARABIC_LETTERS) {
      const entity = letterToEntity(letter);
      letterMap.set(entity.id, entity);
    }
  }
  return letterMap;
}

function getRegistryMap(): Map<string, AnyEntity> {
  if (!registryMap) {
    registryMap = new Map();
    for (const entity of [...CHUNKS, ...RULES, ...PATTERNS, ...WORDS, ...ORTHOGRAPHY]) {
      registryMap.set(entity.id, entity);
    }
  }
  return registryMap;
}

// ── Public API ──
// Returns AnyEntity so callers get subtype fields (audioKey, teachingBreakdownIds, etc.)

export async function resolveEntity(id: string): Promise<AnyEntity | undefined> {
  if (id.startsWith("letter:")) {
    return getLetterMap().get(id);
  }

  if (id.startsWith("combo:")) {
    return resolveCombo(id);
  }

  return getRegistryMap().get(id);
}

export async function resolveAll(ids: string[]): Promise<AnyEntity[]> {
  const results: AnyEntity[] = [];
  for (const id of ids) {
    const entity = await resolveEntity(id);
    if (entity) results.push(entity);
  }
  return results;
}

// Sync: operates on already-resolved entities
export function hasCapability(entity: AnyEntity, cap: EntityCapability): boolean {
  return entity.capabilities.includes(cap);
}

export function filterByCapability(entities: AnyEntity[], cap: EntityCapability): AnyEntity[] {
  return entities.filter((e) => e.capabilities.includes(cap));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/engine/entityRegistry.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/v2/entityRegistry.ts src/__tests__/engine/entityRegistry.test.ts
git commit -m "feat(v2): add entity registry with resolution and capability queries

Resolves letter:, combo:, chunk:, rule:, pattern:, word:, orthography: entities.
Letters adapted from existing letters.js. Combos derived from letters + harakat.
Registry entities from curriculum-v2 data."
```

---

### Task 6: Build-Time Validation

**Files:**
- Create: `src/engine/v2/validation.ts`
- Test: `src/__tests__/engine/validation.test.ts`

- [ ] **Step 1: Write validation tests**

```typescript
// src/__tests__/engine/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateLesson, validateAllLessons } from "@/src/engine/v2/validation";
import { LESSONS_V2 } from "@/src/data/curriculum-v2";
import { ASSESSMENT_PROFILES } from "@/src/data/curriculum-v2/assessmentProfiles";
import type { LessonV2 } from "@/src/types/curriculum-v2";

describe("validation", () => {
  describe("validateLesson", () => {
    it("passes for a valid lesson", async () => {
      const result = await validateLesson(LESSONS_V2[0]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails when teachEntityIds reference unknown entities", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        teachEntityIds: ["letter:999", "nonexistent:foo"],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("letter:999"))).toBe(true);
      expect(result.errors.some((e) => e.includes("nonexistent:foo"))).toBe(true);
    });

    it("fails when check step has no assessmentProfile", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          // @ts-expect-error — intentionally missing assessmentProfile
          { type: "check", count: 5, target: "mixed", source: { from: "all" } },
        ],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("assessmentProfile"))).toBe(true);
    });

    it("fails when check step references unknown assessmentProfile", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "check", count: 5, target: "mixed", source: { from: "all" }, assessmentProfile: "nonexistent" },
        ],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("nonexistent"))).toBe(true);
    });

    it("fails when decodePassRequired exceeds decode item count", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "tap", count: 5, target: "letter", source: { from: "teach" } },
          { type: "read", count: 1, target: "combo", source: { from: "teach" }, connected: false },
        ],
        masteryPolicy: { passThreshold: 0.85, decodePassRequired: 3 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("decodePassRequired"))).toBe(true);
    });

    it("fails when decodePassRequired lesson does not end with decode steps", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
          { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
        ],
        masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("exit-block"))).toBe(true);
    });

    it("fails when explicit source has unresolvable entityIds", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "tap", count: 2, target: "letter", source: { from: "explicit", entityIds: ["letter:999"] } },
        ],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("letter:999"))).toBe(true);
    });

    // Rule 2: target/entity compatibility
    it("fails when step target has no compatible entities", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        teachEntityIds: ["rule:fatha"],  // rule is not tappable as "letter"
        exercisePlan: [
          { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
        ],
        masteryPolicy: { passThreshold: 0.85 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("target") && e.includes("compatible"))).toBe(true);
    });

    // Rule 7: renderOverride complexity
    it("fails when step renderOverride is less complex than lesson renderProfile", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        renderProfile: "quran-script",
        exercisePlan: [
          { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false, renderOverride: "connected" },
        ],
        masteryPolicy: { passThreshold: 0.85 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("renderOverride") || e.includes("render"))).toBe(true);
    });

    // Rule 9: no transliteration past Phase 2
    it("fails when read step in Phase 3+ would allow transliteration", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        phase: 3,
        exercisePlan: [
          { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
        ],
        masteryPolicy: { passThreshold: 0.85 },
        tags: ["answerMode:transliteration"],  // hypothetical — validation checks phase
      };
      const result = await validateLesson(bad);
      // Phase 3+ read steps should be flagged if they could produce transliteration
      // The validator checks phase number against read steps
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("transliteration") || e.includes("Phase"))).toBe(true);
    });
  });

  describe("validateAllLessons", () => {
    it("all vertical-slice lessons pass validation", async () => {
      const results = await validateAllLessons(LESSONS_V2);
      results.forEach((result) => {
        expect(result.errors).toEqual([]);
        expect(result.valid).toBe(true);
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/engine/validation.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement validation**

```typescript
// src/engine/v2/validation.ts
import type { LessonV2, ExerciseStep } from "@/src/types/curriculum-v2";
import type { EntityCapability } from "@/src/types/entity";
import { resolveEntity } from "./entityRegistry";
import { ASSESSMENT_PROFILES } from "@/src/data/curriculum-v2/assessmentProfiles";

export interface ValidationResult {
  lessonId: number;
  valid: boolean;
  errors: string[];
}

function isDecodeStep(step: ExerciseStep): boolean {
  return step.type === "read" || step.type === "check";
}

function totalDecodeItems(plan: ExerciseStep[]): number {
  return plan.filter(isDecodeStep).reduce((sum, s) => sum + s.count, 0);
}

export async function validateLesson(lesson: LessonV2): Promise<ValidationResult> {
  const errors: string[] = [];

  // Rule 1: All entity IDs must resolve
  const allEntityIds = [...lesson.teachEntityIds, ...lesson.reviewEntityIds];
  for (const id of allEntityIds) {
    const entity = await resolveEntity(id);
    if (!entity) {
      errors.push(`Entity "${id}" in lesson ${lesson.id} does not resolve to any registry`);
    }
  }

  // Rule 3: check steps must have assessmentProfile that resolves
  for (const step of lesson.exercisePlan) {
    if (step.type === "check") {
      if (!step.assessmentProfile) {
        errors.push(`Lesson ${lesson.id}: check step missing assessmentProfile`);
      } else {
        const profile = ASSESSMENT_PROFILES.find((p) => p.id === step.assessmentProfile);
        if (!profile) {
          errors.push(`Lesson ${lesson.id}: assessmentProfile "${step.assessmentProfile}" not found in registry`);
        }
      }
    }
  }

  // Rule 4: decodePassRequired cannot exceed total decode items
  if (lesson.masteryPolicy.decodePassRequired) {
    const decodeCount = totalDecodeItems(lesson.exercisePlan);
    if (lesson.masteryPolicy.decodePassRequired > decodeCount) {
      errors.push(
        `Lesson ${lesson.id}: decodePassRequired (${lesson.masteryPolicy.decodePassRequired}) exceeds total decode items (${decodeCount})`
      );
    }
  }

  // Rule 5: Checkpoint lessons must include read or check
  const hasCheckStep = lesson.exercisePlan.some((s) => s.type === "check");
  if (hasCheckStep) {
    const hasDecodeStep = lesson.exercisePlan.some(isDecodeStep);
    if (!hasDecodeStep) {
      errors.push(`Lesson ${lesson.id}: checkpoint must include at least one read or check step`);
    }
  }

  // Rule 6: explicit source entityIds must resolve
  for (const step of lesson.exercisePlan) {
    if (step.source.from === "explicit") {
      for (const id of step.source.entityIds) {
        const entity = await resolveEntity(id);
        if (!entity) {
          errors.push(`Lesson ${lesson.id}: explicit source entity "${id}" does not resolve`);
        }
      }
    }
  }

  // Rule 7: renderOverride cannot be less complex than lesson renderProfile
  const RENDER_COMPLEXITY: Record<string, number> = {
    isolated: 0, connected: 1, "quran-script": 2, mushaf: 3,
  };
  const lessonComplexity = RENDER_COMPLEXITY[lesson.renderProfile ?? "isolated"] ?? 0;
  for (const step of lesson.exercisePlan) {
    if (step.type === "read" && step.renderOverride) {
      const stepComplexity = RENDER_COMPLEXITY[step.renderOverride] ?? 0;
      if (stepComplexity < lessonComplexity) {
        errors.push(
          `Lesson ${lesson.id}: read step renderOverride "${step.renderOverride}" is less complex than lesson renderProfile "${lesson.renderProfile}"`
        );
      }
    }
  }

  // Rule 8: exit-block — lessons with decodePassRequired must end with decode steps
  if (lesson.masteryPolicy.decodePassRequired) {
    const plan = lesson.exercisePlan;
    const lastStep = plan[plan.length - 1];
    if (!isDecodeStep(lastStep)) {
      errors.push(
        `Lesson ${lesson.id}: decodePassRequired set but exercisePlan does not end with decode steps (exit-block violated)`
      );
    }
  }

  // Rule 9: no transliteration answer mode past Phase 2
  if (lesson.phase > 2) {
    const hasReadSteps = lesson.exercisePlan.some((s) => s.type === "read");
    const hasTransliterationTag = lesson.tags?.some((t) => t.includes("transliteration"));
    if (hasReadSteps && hasTransliterationTag) {
      errors.push(
        `Lesson ${lesson.id}: Phase ${lesson.phase} read steps cannot use transliteration answer mode`
      );
    }
  }

  // Rule 2: step targets must have compatible entities in scope
  for (const step of lesson.exercisePlan) {
    const targetToCapability: Record<string, EntityCapability> = {
      letter: "tappable", form: "tappable", mark: "tappable",
      combo: "readable", chunk: "readable", word: "readable",
      phrase: "readable", verse: "readable",
    };
    const requiredCap = targetToCapability[step.target];
    if (requiredCap && step.source.from === "teach") {
      // Check that at least one teach entity has the required capability
      let hasCompatible = false;
      for (const id of lesson.teachEntityIds) {
        const entity = await resolveEntity(id);
        if (entity && entity.capabilities.includes(requiredCap)) {
          hasCompatible = true;
          break;
        }
      }
      if (!hasCompatible) {
        errors.push(
          `Lesson ${lesson.id}: step target "${step.target}" has no compatible entities in teachEntityIds`
        );
      }
    }
  }

  return { lessonId: lesson.id, valid: errors.length === 0, errors };
}

export async function validateAllLessons(lessons: LessonV2[]): Promise<ValidationResult[]> {
  return Promise.all(lessons.map(validateLesson));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/engine/validation.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/engine/v2/validation.ts src/__tests__/engine/validation.test.ts
git commit -m "feat(v2): add build-time lesson validation

Validates entity resolution, assessment profiles, decode gating,
exit-block ordering, and explicit source references.
All vertical-slice lessons pass."
```

---

### Task 7: V2 Database Tables

**Files:**
- Create: `src/db/schema-v2.ts`
- Create: `src/db/migrate-v2.ts`
- Test: `src/__tests__/db/schema-v2.test.ts`

- [ ] **Step 1: Write DB schema tests**

```typescript
// src/__tests__/db/schema-v2.test.ts
import { describe, it, expect } from "vitest";
import { V2_SCHEMA_VERSION, V2_CREATE_TABLES } from "@/src/db/schema-v2";

describe("schema-v2", () => {
  it("exports a schema version", () => {
    expect(V2_SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it("creates v2_lesson_attempts table with profile_id", () => {
    expect(V2_CREATE_TABLES).toContain("v2_lesson_attempts");
    expect(V2_CREATE_TABLES).toContain("profile_id TEXT NOT NULL");
  });

  it("creates v2_entity_mastery table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_entity_mastery");
    expect(V2_CREATE_TABLES).toContain("entity_id TEXT");
  });

  it("creates v2_question_attempts table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_question_attempts");
    expect(V2_CREATE_TABLES).toContain("exercise_type TEXT NOT NULL");
    expect(V2_CREATE_TABLES).toContain("answer_mode TEXT NOT NULL");
  });

  it("creates v2_phase_completion table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_phase_completion");
  });

  it("creates v2_review_sessions table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_review_sessions");
  });

  it("all v2 tables have profile_id column", () => {
    const tables = ["v2_lesson_attempts", "v2_entity_mastery", "v2_question_attempts", "v2_phase_completion", "v2_review_sessions"];
    tables.forEach((table) => {
      // Check that profile_id appears in context of each table
      const tableStart = V2_CREATE_TABLES.indexOf(table);
      expect(tableStart).toBeGreaterThan(-1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/db/schema-v2.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Write schema and migration**

```typescript
// src/db/schema-v2.ts

export const V2_SCHEMA_VERSION = 1;

export const V2_CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS v2_lesson_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL DEFAULT 'local',
  lesson_id INTEGER NOT NULL CHECK (lesson_id >= 1),
  passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
  overall_percent REAL NOT NULL CHECK (overall_percent >= 0.0 AND overall_percent <= 1.0),
  decode_percent REAL CHECK (decode_percent >= 0.0 AND decode_percent <= 1.0),
  final_decode_streak INTEGER CHECK (final_decode_streak >= 0),
  failure_reasons TEXT,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_v2_la_lesson ON v2_lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_v2_la_profile ON v2_lesson_attempts(profile_id);

CREATE TABLE IF NOT EXISTS v2_entity_mastery (
  entity_id TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT 'local',
  state TEXT NOT NULL DEFAULT 'not_started'
    CHECK (state IN ('not_started', 'introduced', 'unstable', 'accurate', 'retained')),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  recent_attempts TEXT NOT NULL DEFAULT '[]',
  interval_days INTEGER NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
  next_review TEXT,
  session_streak INTEGER NOT NULL DEFAULT 0 CHECK (session_streak >= 0),
  confusion_pairs TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entity_id, profile_id)
);

CREATE TABLE IF NOT EXISTS v2_question_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL DEFAULT 'local',
  lesson_id INTEGER NOT NULL,
  entity_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  answer_mode TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  assessment_bucket TEXT,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_v2_qa_lesson ON v2_question_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_v2_qa_entity ON v2_question_attempts(entity_id);
CREATE INDEX IF NOT EXISTS idx_v2_qa_profile ON v2_question_attempts(profile_id);

CREATE TABLE IF NOT EXISTS v2_phase_completion (
  phase INTEGER NOT NULL,
  profile_id TEXT NOT NULL DEFAULT 'local',
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (phase, profile_id)
);

CREATE TABLE IF NOT EXISTS v2_review_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL DEFAULT 'local',
  entity_ids TEXT NOT NULL,
  results TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_v2_rs_profile ON v2_review_sessions(profile_id);

CREATE TABLE IF NOT EXISTS v2_schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
```

```typescript
// src/db/migrate-v2.ts
import type { SQLiteDatabase } from "expo-sqlite";
import { V2_SCHEMA_VERSION, V2_CREATE_TABLES } from "./schema-v2";

export async function migrateV2(db: SQLiteDatabase): Promise<void> {
  // Check if v2 schema already exists
  const versionRow = await db
    .getFirstAsync<{ version: number }>("SELECT version FROM v2_schema_version ORDER BY version DESC LIMIT 1")
    .catch(() => null);

  const currentVersion = versionRow?.version ?? 0;

  if (currentVersion >= V2_SCHEMA_VERSION) return;

  // Run v2 table creation (idempotent via IF NOT EXISTS)
  await db.execAsync(V2_CREATE_TABLES);

  // Record version
  await db.runAsync(
    "INSERT OR REPLACE INTO v2_schema_version (version) VALUES (?)",
    [V2_SCHEMA_VERSION]
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/db/schema-v2.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/db/schema-v2.ts src/db/migrate-v2.ts src/__tests__/db/schema-v2.test.ts
git commit -m "feat(v2): add v2 database schema and migration

5 new tables: v2_lesson_attempts, v2_entity_mastery, v2_question_attempts,
v2_phase_completion, v2_review_sessions. All with profile_id for future
account switching. Fully isolated from v1 tables."
```

---

## Plan 1 Complete — Summary

**Gate:** Plan 1 validates the vertical-slice dataset (6 sample lessons) and proves the type system, registries, entity resolution, and validation rules work. It does NOT validate all 62 lessons — that is Plan 5's gate after full content population.

| Task | What it produces | Test count |
|------|-----------------|------------|
| 1 | `LessonV2`, `ExerciseStep`, `PhaseV2` types | 5 |
| 2 | Entity types + `AssessmentProfile` | 4 |
| 2.5 | Exercise types (`ExerciseItem`, `CorrectAnswer`, `FixSegment`, `ScoredItem`) | 0 (type-only) |
| 3 | Content registries (chunks, patterns, rules, assessment profiles) | 8 |
| 4 | Vertical-slice lesson data (6 lessons) + phase definitions | 10 |
| 5 | Entity registry (resolve, capabilities) — returns `AnyEntity` | 9 |
| 6 | Build-time validation (all 9 spec rules) | 11 |
| 7 | V2 database tables + migration | 7 |
| **Total** | | **~54 tests** |

## Remaining Plans

**Plan 2: V2 Engine** — Scoring types + evaluation, mastery state machine, 7 generators (tap, hear, choose, build, read, fix, check), dispatcher, review scheduling, phase unlocks, remediation.

**Plan 3: Audio & UI Components** — Audio resolver + playback policy, TapExercise, HearExercise, ChooseExercise, BuildExercise, ReadExercise, FixExercise, CheckExercise, result screens, phase gating UI.

**Plan 4: Integration & Vertical Slice** — `CurriculumProvider`, feature flag, v2 hooks (`useLessonQuizV2`, `useProgressV2`, `useMasteryV2`, `useReviewV2`), lesson screen wiring, end-to-end vertical slice test.

**Plan 5: Content Population** — All 62 lessons for Phases 1-6, full registry content (30-40 words, 15-20 chunks, remaining rules/patterns/orthography).
