import type { GeneratorInput, ExerciseItem, ExerciseOption } from "@/src/types/exercise";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  filterToCapability,
} from "./shared";

// ── Tap Generator — Fast visual recognition ──

export function generateTapItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities, masterySnapshot } = input;

  if (step.type !== "tap") return [];

  // 1. Pick source entities
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
  );

  // 2. Filter to tappable entities
  const capable = filterToCapability(sourceEntities, "tappable");
  if (capable.length === 0) return [];

  const distractorCount = step.distractorCount ?? 3;

  // 3. Generate items
  const items: ExerciseItem[] = [];

  for (let i = 0; i < step.count; i++) {
    const target = capable[i % capable.length];

    const distractors = pickDistractors(
      target,
      allUnlockedEntities,
      distractorCount,
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
      type: "tap",
      prompt: {
        text: "Which letter is this?",
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
