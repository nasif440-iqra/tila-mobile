import type { LessonResult } from "./scoring";
import type { EntityMastery } from "./mastery";
import type { ExerciseStep } from "@/src/types/curriculum-v2";

// ── Constants ──

const DEFAULT_WEAK_THRESHOLD = 0.6;

// ── Types ──

export interface RemediationPlan {
  entityIds: string[];
  exerciseTypes: ExerciseStep["type"][];
}

// ── Helpers ──

/** Map entity state to appropriate remediation exercise types */
function exerciseTypesForState(state: EntityMastery["state"]): ExerciseStep["type"][] {
  switch (state) {
    case "introduced":
      return ["tap", "hear"];
    case "unstable":
      return ["tap", "hear", "choose"];
    case "accurate":
      return ["choose", "read"];
    case "retained":
      return ["read"];
    default:
      return ["tap"];
  }
}

// ── Public API ──

/**
 * Generate a remediation plan from a failed lesson result.
 * Looks at weak buckets (score < threshold), finds entities in weak states,
 * and returns them capped at maxItems.
 */
export function generateRemediation(
  failedResult: LessonResult,
  allMastery: EntityMastery[],
  maxItems: number,
): RemediationPlan {
  // 1. Find weak buckets
  const weakBuckets = new Set<string>();
  for (const [bucket, score] of Object.entries(failedResult.bucketScores)) {
    const pct = score.total === 0 ? 0 : score.correct / score.total;
    if (pct < DEFAULT_WEAK_THRESHOLD) {
      weakBuckets.add(bucket);
    }
  }

  if (weakBuckets.size === 0) {
    return { entityIds: [], exerciseTypes: [] };
  }

  // 2. Find entities in weak (non-retained, non-not_started) states
  //    that relate to weak buckets via entityId containing bucket name or matching entity pattern
  const weakStates: EntityMastery["state"][] = ["introduced", "unstable", "accurate"];

  // Filter entities that are in a weak state — bucket matching via entityId prefix convention
  // e.g. bucket "letter" matches entity IDs starting with "letter:"
  // e.g. bucket "combo" matches entity IDs starting with "combo:"
  const candidates = allMastery.filter((m) => {
    if (!weakStates.includes(m.state)) return false;

    // Check if this entity's ID relates to any weak bucket
    for (const bucket of weakBuckets) {
      // Direct entity ID prefix match (e.g. "letter:" bucket "letter")
      if (m.entityId.startsWith(bucket + ":")) return true;
      // Direct entity ID match (bucket IS the entity ID)
      if (m.entityId === bucket) return true;
    }
    return false; // Only include entities that match a weak bucket by prefix
  });

  // 3. Sort by state weakness (weakest first), then by confusion pairs desc
  const stateOrder: Record<EntityMastery["state"], number> = {
    not_started: 99,
    introduced: 0,
    unstable: 1,
    accurate: 2,
    retained: 3,
  };

  const sorted = [...candidates].sort((a, b) => {
    const stateA = stateOrder[a.state];
    const stateB = stateOrder[b.state];
    if (stateA !== stateB) return stateA - stateB;
    return b.confusionPairs.length - a.confusionPairs.length;
  });

  // 4. Cap at maxItems
  const selected = sorted.slice(0, maxItems);

  // 5. Collect unique exercise types from selected entities
  const exerciseTypeSet = new Set<ExerciseStep["type"]>();
  for (const m of selected) {
    for (const t of exerciseTypesForState(m.state)) {
      exerciseTypeSet.add(t);
    }
  }

  return {
    entityIds: selected.map((m) => m.entityId),
    exerciseTypes: Array.from(exerciseTypeSet),
  };
}
