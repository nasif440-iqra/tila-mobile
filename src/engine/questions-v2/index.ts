import type { ExerciseItem, GeneratorInput, MasterySnapshot } from "@/src/types/exercise";
import type { ExerciseStep, LessonV2, RenderProfile } from "@/src/types/curriculum-v2";
import type { AnyEntity } from "@/src/types/entity";
import { resolveAll } from "@/src/engine/v2/entityRegistry";
import { generateTapItems } from "./tap";
import { generateHearItems } from "./hear";
import { generateChooseItems } from "./choose";
import { generateBuildItems } from "./build";
import { generateReadItems } from "./read";
import { generateFixItems } from "./fix";
import { generateCheckItems } from "./check";

// ── Generator dispatch map ──

type Generator = (input: GeneratorInput) => ExerciseItem[];

const GENERATORS: Record<ExerciseStep["type"], Generator> = {
  tap: generateTapItems,
  hear: generateHearItems,
  choose: generateChooseItems,
  build: generateBuildItems,
  read: generateReadItems,
  fix: generateFixItems,
  check: generateCheckItems,
};

// ── V2 Dispatcher ──
// Walks the lesson's exercisePlan, resolves entities, calls generators in order,
// and returns the flattened item array. One loop, one dispatch — no lessonMode branching.

export async function generateV2Exercises(
  lesson: LessonV2,
  allUnlockedEntities: AnyEntity[],
  masterySnapshot: MasterySnapshot,
): Promise<ExerciseItem[]> {
  // 1. Resolve teach and review entities via entity registry
  const [teachEntities, reviewEntities] = await Promise.all([
    resolveAll(lesson.teachEntityIds),
    resolveAll(lesson.reviewEntityIds),
  ]);

  const allItems: ExerciseItem[] = [];

  // 2. Walk each step in the exercise plan
  for (const step of lesson.exercisePlan) {
    // 2a. Determine renderProfile: step.renderOverride (read steps only) > lesson.renderProfile > "isolated"
    let renderProfile: RenderProfile = lesson.renderProfile ?? "isolated";
    if (step.type === "read" && step.renderOverride) {
      renderProfile = step.renderOverride;
    }

    // 2b. Build GeneratorInput
    const input: GeneratorInput = {
      step,
      lesson,
      teachEntities,
      reviewEntities,
      allUnlockedEntities,
      masterySnapshot,
      renderProfile,
    };

    // 2c. Dispatch to generator
    const generator = GENERATORS[step.type];
    const items = generator(input);

    allItems.push(...items);
  }

  return allItems;
}
