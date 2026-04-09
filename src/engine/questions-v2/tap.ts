import type { GeneratorInput, ExerciseItem, ExerciseOption } from "@/src/types/exercise";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  filterToCapability,
  TARGET_TO_PREFIX,
} from "./shared";

// ── Tap Generator — Fast visual recognition ──

const LETTER_PROMPTS = ["Which letter is this?", "Find this letter", "Tap the matching letter", "Which one matches?"];
const COMBO_PROMPTS = ["Which sound is this?", "Find this combination", "Tap the matching sound"];
const DEFAULT_TAP_PROMPTS = ["Which one is this?", "Find this one", "Tap the match"];

function pickTapPrompt(targetId: string, index: number): string {
  if (targetId.startsWith("letter:")) return LETTER_PROMPTS[index % LETTER_PROMPTS.length];
  if (targetId.startsWith("combo:")) return COMBO_PROMPTS[index % COMBO_PROMPTS.length];
  return DEFAULT_TAP_PROMPTS[index % DEFAULT_TAP_PROMPTS.length];
}

export function generateTapItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities, masterySnapshot } = input;

  if (step.type !== "tap") return [];

  // 1. Pick source entities pre-filtered to step target type
  const prefix = TARGET_TO_PREFIX[step.target];
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
    prefix,
  );

  // 2. Filter to tappable
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
        text: pickTapPrompt(target.id, i),
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
