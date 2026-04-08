import type { GeneratorInput, ExerciseItem, ExerciseOption } from "@/src/types/exercise";
import type { AnyEntity } from "@/src/types/entity";
import { ARABIC_LETTERS } from "@/src/data/letters";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  filterToCapability,
} from "./shared";

// ── Choose Generator — Tight discrimination, always 4 options ──

const CHOOSE_DISTRACTOR_COUNT = 3;

// ── Distractor Pool Filtering by Strategy ──
//
// Applies distractorStrategy to narrow the pool before pickDistractors runs.
// This surfaces phonologically or visually similar items to challenge the learner.
//
// "family":      letters in the same shape-family (ba/ta/tha share the same base form)
// "vowel":       combos sharing the same letter root but different harakat
// "shape":       alias for "family" (same shape-family lookup)
// "similar-word": falls back to full pool (length-based filtering not yet implemented)

function applyDistractorStrategy(
  target: AnyEntity,
  pool: AnyEntity[],
  strategy: "family" | "vowel" | "shape" | "similar-word",
): AnyEntity[] {
  const candidates = pool.filter((e) => e.id !== target.id);

  if (strategy === "family" || strategy === "shape") {
    // Look up the target letter's family from ARABIC_LETTERS
    // Entity IDs for letters are "letter:N" — extract numeric ID
    const letterIdMatch = target.id.match(/^letter:(\d+)$/);
    if (letterIdMatch) {
      const letterId = parseInt(letterIdMatch[1], 10);
      const targetLetter = (ARABIC_LETTERS as Array<{ id: number; family: string }>)
        .find((l) => l.id === letterId);
      if (targetLetter) {
        const familyMembers = (ARABIC_LETTERS as Array<{ id: number; family: string }>)
          .filter((l) => l.family === targetLetter.family && l.id !== letterId)
          .map((l) => `letter:${l.id}`);
        const filtered = candidates.filter((e) => familyMembers.includes(e.id));
        // Only use filtered pool if it has enough candidates; otherwise fall back
        if (filtered.length >= 2) return filtered;
      }
    }
    return candidates; // fallback: not a letter entity or family too small
  }

  if (strategy === "vowel") {
    // For combos: filter to same-letter-root combos with different harakat
    // Combo IDs follow "combo:<letter-slug>-<harakat>" convention
    const comboMatch = target.id.match(/^combo:([^-]+)-(.+)$/);
    if (comboMatch) {
      const letterSlug = comboMatch[1];
      const filtered = candidates.filter((e) => {
        const m = e.id.match(/^combo:([^-]+)-(.+)$/);
        // Same letter slug, different harakat
        return m && m[1] === letterSlug && m[2] !== comboMatch[2];
      });
      if (filtered.length >= 1) return filtered;
    }
    return candidates; // fallback: not a combo or no same-letter combos available
  }

  // "similar-word": not yet implemented — fall back to full pool
  return candidates;
}

export function generateChooseItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities, masterySnapshot } = input;

  if (step.type !== "choose") return [];

  // 1. Pick source entities
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
  );

  // 2. Filter to tappable entities (choose uses visual Arabic options)
  const capable = filterToCapability(sourceEntities, "tappable");
  if (capable.length === 0) return [];

  // 3. Generate items — always 1 correct + 3 distractors
  const items: ExerciseItem[] = [];

  for (let i = 0; i < step.count; i++) {
    const target = capable[i % capable.length];

    // Re-apply strategy per target when iterating (ensures per-item pool is relevant)
    const perTargetPool = step.distractorStrategy
      ? applyDistractorStrategy(target, allUnlockedEntities, step.distractorStrategy)
      : allUnlockedEntities;

    const distractors = pickDistractors(
      target,
      perTargetPool.length >= CHOOSE_DISTRACTOR_COUNT ? perTargetPool : allUnlockedEntities,
      CHOOSE_DISTRACTOR_COUNT,
      masterySnapshot.confusionPairs,
    );

    const options: ExerciseOption[] = shuffle([
      {
        id: target.id,
        displayArabic: target.displayArabic,
        isCorrect: true,
      },
      ...distractors.map((d) => ({
        id: d.id,
        displayArabic: d.displayArabic,
        isCorrect: false,
      })),
    ]);

    items.push({
      type: "choose",
      prompt: {
        text: `Which one says ${target.transliteration ?? target.displayArabic}?`,
        arabicDisplay: target.displayArabic,
      },
      options,
      correctAnswer: { kind: "single", value: target.id },
      targetEntityId: target.id,
      isDecodeItem: false,
      answerMode: "arabic",
    });
  }

  return items;
}
