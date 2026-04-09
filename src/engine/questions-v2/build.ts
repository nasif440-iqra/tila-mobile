import type { GeneratorInput, ExerciseItem, BuildTile } from "@/src/types/exercise";
import type { AnyEntity } from "@/src/types/entity";
import {
  pickEntitiesBySource,
  filterToCapability,
  shuffle,
  deriveAudioKey,
  TARGET_TO_PREFIX,
} from "./shared";

// ── Build Generator — Tile bank assembly from teachingBreakdownIds ──

export function generateBuildItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities } = input;

  if (step.type !== "build") return [];

  // 1. Pick source entities pre-filtered to step target type, then to buildable
  const prefix = TARGET_TO_PREFIX[step.target];
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
    prefix,
  );
  const capable = filterToCapability(sourceEntities, "buildable");
  if (capable.length === 0) return [];

  // 2. Only keep entities that have teachingBreakdownIds
  const withBreakdown = capable.filter(
    (e): e is AnyEntity & { teachingBreakdownIds: string[] } =>
      "teachingBreakdownIds" in e &&
      Array.isArray((e as any).teachingBreakdownIds) &&
      (e as any).teachingBreakdownIds.length > 0,
  );
  if (withBreakdown.length === 0) return [];

  // Build an ID → entity lookup from allUnlockedEntities for resolving breakdown IDs
  const entityById = new Map<string, AnyEntity>(
    allUnlockedEntities.map((e) => [e.id, e]),
  );

  // Collect all buildable distractor candidates (excluding the target itself, resolved later)
  const buildablePool = filterToCapability(allUnlockedEntities, "buildable");

  const maxTiles = step.maxTiles ?? Infinity;

  const items: ExerciseItem[] = [];

  for (let i = 0; i < step.count; i++) {
    const target = withBreakdown[i % withBreakdown.length];
    const breakdownIds: string[] = (target as any).teachingBreakdownIds;

    // 3. Build correct tiles from breakdown IDs
    // Use position index (j) in addition to bdId and item index (i) to ensure
    // uniqueness when the same entity appears multiple times in a breakdown
    // (e.g., chunk:bab = [combo:ba-fatha, combo:alif-fatha, combo:ba-fatha]).
    const correctTiles: BuildTile[] = breakdownIds.map((bdId, j) => {
      const resolved = entityById.get(bdId);
      return {
        id: `tile-correct-${bdId}-${i}-${j}`,
        displayArabic: resolved?.displayArabic ?? bdId,
        entityId: bdId,
        isDistractor: false,
      };
    });

    // 4. Add 2-3 distractor tiles from the pool
    const distractorCandidates = buildablePool.filter(
      (e) => !breakdownIds.includes(e.id) && e.id !== target.id,
    );
    const distractorEntities = shuffle(distractorCandidates).slice(0, 3);
    const distractorTiles: BuildTile[] = distractorEntities.map((e) => ({
      id: `tile-distractor-${e.id}-${i}`,
      displayArabic: e.displayArabic,
      entityId: e.id,
      isDistractor: true,
    }));

    // 5. Combine and cap at maxTiles
    let tileBank = [...correctTiles, ...distractorTiles];
    if (tileBank.length > maxTiles) {
      // Always keep all correct tiles; trim distractors to fit
      const distractorSlots = Math.max(0, maxTiles - correctTiles.length);
      tileBank = [...correctTiles, ...distractorTiles.slice(0, distractorSlots)];
    }

    // 6. Shuffle the tile bank
    const shuffledTiles = shuffle(tileBank);

    items.push({
      type: "build",
      prompt: {
        text: "Build this word",
        arabicDisplay: target.displayArabic,
        audioKey: deriveAudioKey(target),
      },
      tiles: shuffledTiles,
      correctAnswer: { kind: "sequence", values: breakdownIds },
      targetEntityId: target.id,
      isDecodeItem: false,
      answerMode: "build",
    });
  }

  return items;
}
