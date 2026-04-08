import type { GeneratorInput, ExerciseItem } from "@/src/types/exercise";
import type { ExerciseStep } from "@/src/types/curriculum-v2";
import { ASSESSMENT_PROFILES } from "@/src/data/curriculum-v2/assessmentProfiles";
import { generateTapItems } from "./tap";
import { generateHearItems } from "./hear";
import { generateChooseItems } from "./choose";
import { generateBuildItems } from "./build";
import { generateReadItems } from "./read";
import { generateFixItems } from "./fix";

// ── Sub-generator dispatch map ──

type SubGenerator = (input: GeneratorInput) => ExerciseItem[];

const SUB_GENERATORS: Partial<Record<ExerciseStep["type"], SubGenerator>> = {
  tap: generateTapItems,
  hear: generateHearItems,
  choose: generateChooseItems,
  build: generateBuildItems,
  read: generateReadItems,
  fix: generateFixItems,
};

// ── Check Generator — Assessment-profile-driven mixed generation ──

export function generateCheckItems(input: GeneratorInput): ExerciseItem[] {
  const { step, allUnlockedEntities } = input;

  if (step.type !== "check") return [];

  // 1. Look up assessment profile
  const profile = ASSESSMENT_PROFILES.find((p) => p.id === step.assessmentProfile);
  if (!profile) return [];

  const totalCount = step.count;

  // 2. Distribute totalCount across exercise types per exerciseWeights
  //    Use Math.round for each weight, then adjust last to hit exact total.
  const weights = profile.exerciseWeights;
  const allocations: { type: ExerciseStep["type"]; count: number }[] = weights.map((w) => ({
    type: w.type,
    count: Math.round(totalCount * w.weight),
  }));

  // Adjust for rounding drift: add/subtract from highest-weight type
  const roundedTotal = allocations.reduce((sum, a) => sum + a.count, 0);
  const drift = totalCount - roundedTotal;
  if (drift !== 0 && allocations.length > 0) {
    // Apply drift to the first (highest-weight) allocation
    allocations[0].count += drift;
  }

  // 3. Enforce minimumReadPercent: ensure read items >= floor(minimumReadPercent * totalCount)
  const minReadCount = Math.ceil(profile.minimumReadPercent * totalCount);
  const readAlloc = allocations.find((a) => a.type === "read");
  if (readAlloc && readAlloc.count < minReadCount) {
    const deficit = minReadCount - readAlloc.count;

    // Redistribute deficit away from lowest-weighted non-read types
    let remaining = deficit;
    // Sort non-read allocations by count ascending (take from smallest first)
    const nonReadAllocs = allocations
      .filter((a) => a.type !== "read")
      .sort((a, b) => a.count - b.count);

    for (const alloc of nonReadAllocs) {
      if (remaining <= 0) break;
      const take = Math.min(alloc.count, remaining);
      alloc.count -= take;
      remaining -= take;
    }

    readAlloc.count += deficit - remaining;
  }

  // 4. Generate items for each sub-type
  const diagnosticTags = profile.diagnosticTags ?? ["default"];
  const allItems: ExerciseItem[] = [];

  for (const alloc of allocations) {
    if (alloc.count <= 0) continue;

    const generator = SUB_GENERATORS[alloc.type];
    if (!generator) continue;

    // Build a sub-step with the correct type and allocated count
    // Pass allUnlockedEntities so targets can be inferred from the actual pool
    const subStep = buildSubStep(alloc.type, alloc.count, step, allUnlockedEntities);
    if (!subStep) continue;

    const subInput: GeneratorInput = {
      ...input,
      step: subStep,
    };

    const subItems = generator(subInput);

    // 5. Tag each item with generatedBy and assessmentBucket (rotate through diagnosticTags)
    for (let i = 0; i < subItems.length; i++) {
      const bucket = diagnosticTags[(allItems.length + i) % diagnosticTags.length];
      subItems[i] = {
        ...subItems[i],
        generatedBy: alloc.type,
        assessmentBucket: bucket,
      };
    }

    allItems.push(...subItems);
  }

  return allItems;
}

// ── Target Inference ──
// Infers the most appropriate target type from the available entity pool,
// rather than hardcoding defaults. This allows check steps to work correctly
// when lessons contain only chunks, words, or other non-letter entity types.

type EntityPrefix = "letter:" | "combo:" | "chunk:" | "word:";

const PREFIX_TO_TARGET: Record<EntityPrefix, string> = {
  "letter:": "letter",
  "combo:":  "combo",
  "chunk:":  "chunk",
  "word:":   "word",
};

function inferTarget(
  entities: import("@/src/types/entity").AnyEntity[],
  fallback: string,
): string {
  for (const entity of entities) {
    for (const [prefix, target] of Object.entries(PREFIX_TO_TARGET) as [EntityPrefix, string][]) {
      if (entity.id.startsWith(prefix)) return target;
    }
  }
  return fallback;
}

// ── Sub-step builder ──
// Constructs a typed ExerciseStep for each sub-generator call.
// Targets are inferred from the available entity pool rather than hardcoded.

function buildSubStep(
  type: ExerciseStep["type"],
  count: number,
  originalStep: Extract<ExerciseStep, { type: "check" }>,
  allEntities: import("@/src/types/entity").AnyEntity[],
): ExerciseStep | null {
  const source = originalStep.source;

  switch (type) {
    case "tap":
      return {
        type: "tap",
        count,
        target: inferTarget(allEntities, "letter") as "letter" | "form" | "mark",
        source,
      };
    case "hear":
      return {
        type: "hear",
        count,
        target: inferTarget(allEntities, "letter") as "letter" | "combo" | "chunk" | "word",
        source,
        direction: "audio-to-script",
      };
    case "choose":
      return {
        type: "choose",
        count,
        target: inferTarget(allEntities, "letter") as "letter" | "combo" | "rule" | "word",
        source,
      };
    case "build":
      return {
        type: "build",
        count,
        target: inferTarget(allEntities, "combo") as "combo" | "chunk" | "word" | "phrase",
        source,
      };
    case "read":
      return {
        type: "read",
        count,
        target: inferTarget(allEntities, "combo") as "combo" | "chunk" | "word" | "phrase" | "verse",
        source,
      };
    case "fix":
      return { type: "fix", count, target: "vowel", source };
    default:
      return null;
  }
}
