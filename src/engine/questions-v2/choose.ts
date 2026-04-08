import type { GeneratorInput, ExerciseItem, ExerciseOption } from "@/src/types/exercise";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  filterToCapability,
} from "./shared";

// ── Choose Generator — Tight discrimination, always 4 options ──

const CHOOSE_DISTRACTOR_COUNT = 3;

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

    const distractors = pickDistractors(
      target,
      allUnlockedEntities,
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
