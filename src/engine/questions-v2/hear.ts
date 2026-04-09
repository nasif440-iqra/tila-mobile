import type { GeneratorInput, ExerciseItem, ExerciseOption } from "@/src/types/exercise";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  filterToCapability,
  TARGET_TO_PREFIX,
  deriveAudioKey,
} from "./shared";

// ── Hear Generator — Audio-to-script or script-to-audio ──

const AUDIO_TO_SCRIPT_PROMPTS = ["Listen — which one is it?", "What do you hear?", "Listen and choose", "Which one sounds like this?"];
const SCRIPT_TO_AUDIO_PROMPTS = ["How does this sound?", "Listen for this one", "Find the matching sound", "Which sound matches?"];

export function generateHearItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities, masterySnapshot } = input;

  if (step.type !== "hear") return [];

  const direction = step.direction;

  // 1. Pick source entities pre-filtered to step target type
  const prefix = TARGET_TO_PREFIX[step.target];
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
    prefix,
  );

  // 2. Filter to hearable
  const capable = filterToCapability(sourceEntities, "hearable");
  if (capable.length === 0) return [];

  const distractorCount = 3;

  // 3. Generate items
  const items: ExerciseItem[] = [];

  for (let i = 0; i < step.count; i++) {
    const target = capable[i % capable.length];
    const targetAudioKey = deriveAudioKey(target);

    const distractors = pickDistractors(
      target,
      allUnlockedEntities,
      distractorCount,
      masterySnapshot.confusionPairs,
    );

    let options: ExerciseOption[];

    if (direction === "audio-to-script") {
      // Prompt: audio plays, options are Arabic text
      options = shuffle([
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
        type: "hear",
        prompt: {
          text: AUDIO_TO_SCRIPT_PROMPTS[i % AUDIO_TO_SCRIPT_PROMPTS.length],
          arabicDisplay: "",
          audioKey: targetAudioKey,
        },
        options,
        correctAnswer: { kind: "single", value: target.id },
        targetEntityId: target.id,
        isDecodeItem: false,
        answerMode: "audio",
      });
    } else {
      // script-to-audio: Prompt is Arabic, options are audio buttons
      options = shuffle([
        {
          id: target.id,
          audioKey: targetAudioKey,
          isCorrect: true,
        },
        ...distractors.map((d) => ({
          id: d.id,
          audioKey: deriveAudioKey(d),
          isCorrect: false,
        })),
      ]);

      items.push({
        type: "hear",
        prompt: {
          text: SCRIPT_TO_AUDIO_PROMPTS[i % SCRIPT_TO_AUDIO_PROMPTS.length],
          arabicDisplay: target.displayArabic,
        },
        options,
        correctAnswer: { kind: "single", value: target.id },
        targetEntityId: target.id,
        isDecodeItem: false,
        answerMode: "audio",
      });
    }
  }

  return items;
}
