import type { AnyEntity, EntityCapability } from "@/src/types/entity";
import type { ExerciseSource } from "@/src/types/curriculum-v2";

// ── Entity Selection by Source ──

export function pickEntitiesBySource(
  source: ExerciseSource,
  teachEntities: AnyEntity[],
  reviewEntities: AnyEntity[],
  allUnlockedEntities: AnyEntity[],
): AnyEntity[] {
  switch (source.from) {
    case "teach":
      return teachEntities;
    case "review":
      return reviewEntities;
    case "mixed": {
      if (!source.mix) return [...teachEntities, ...reviewEntities];
      // Weighted selection: shuffle each pool first so we don't always take the
      // same first-N entities when the pool is larger than the requested count.
      const shuffledTeach = shuffle(teachEntities);
      const shuffledReview = shuffle(reviewEntities);
      const teachSlice = shuffledTeach.slice(0, source.mix.teach);
      const reviewSlice = shuffledReview.slice(0, source.mix.review);
      return [...teachSlice, ...reviewSlice];
    }
    case "all":
      return allUnlockedEntities;
    case "explicit":
      // Explicit entities should already be resolved by the dispatcher
      // Return allUnlocked filtered to the explicit IDs
      return allUnlockedEntities.filter((e) =>
        source.entityIds.includes(e.id)
      );
  }
}

// ── Distractor Selection ──

export function pickDistractors(
  target: AnyEntity,
  pool: AnyEntity[],
  count: number,
  confusionPairs: Map<string, string[]>,
): AnyEntity[] {
  // Filter out the target itself
  const candidates = pool.filter((e) => e.id !== target.id);
  if (candidates.length === 0) return [];

  // Prefer confusion pairs
  const confusedIds = confusionPairs.get(target.id) ?? [];
  const confused = candidates.filter((e) => confusedIds.includes(e.id));
  const nonConfused = candidates.filter((e) => !confusedIds.includes(e.id));

  const result: AnyEntity[] = [];

  // Take from confusion pairs first
  for (const entity of confused) {
    if (result.length >= count) break;
    result.push(entity);
  }

  // Fill remainder from non-confused candidates
  const shuffled = shuffle(nonConfused);
  for (const entity of shuffled) {
    if (result.length >= count) break;
    result.push(entity);
  }

  return result;
}

// ── Filter by capability ──

export function filterToCapability(
  entities: AnyEntity[],
  cap: EntityCapability,
): AnyEntity[] {
  return entities.filter((e) => e.capabilities.includes(cap));
}

// ── Shuffle (Fisher-Yates) ──

export function shuffle<T>(arr: T[], seed?: number): T[] {
  const result = [...arr];
  let s = seed ?? Math.random() * 2147483647;

  function nextRandom(): number {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor((seed != null ? nextRandom() : Math.random()) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// ── Audio Key Derivation ──

export function deriveAudioKey(entity: AnyEntity): string {
  // Entities with audioKey field use it directly
  if ("audioKey" in entity && typeof (entity as any).audioKey === "string") {
    return (entity as any).audioKey;
  }

  // Derive from entity ID convention
  // "letter:2" → "letter_2"
  // "combo:ba-fatha" → "combo_ba-fatha"
  return entity.id.replace(":", "_");
}
