import type { GeneratorInput, ExerciseItem, ExerciseOption } from "@/src/types/exercise";
import {
  pickEntitiesBySource,
  pickDistractors,
  shuffle,
  filterToCapability,
  TARGET_TO_PREFIX,
  deriveAudioKey,
} from "./shared";

// ── Read Generator — Real decoding exercises ──

const READ_CHUNK_PROMPTS = ["Read this connected word", "Sound out these letters", "What does this say?"];
const READ_COMBO_PROMPTS = ["Read this sound", "What does this say?", "Sound this out"];
const READ_LETTER_PROMPTS = ["What letter is this?", "Read this letter"];
const READ_DEFAULT_PROMPTS = ["Read this aloud", "What does this say?", "Sound this out"];

function pickReadPrompt(targetId: string, resolvedRenderProfile: string | undefined, index: number): string {
  if (resolvedRenderProfile === "connected") {
    return READ_CHUNK_PROMPTS[index % READ_CHUNK_PROMPTS.length];
  }
  if (targetId.startsWith("chunk:")) return READ_CHUNK_PROMPTS[index % READ_CHUNK_PROMPTS.length];
  if (targetId.startsWith("combo:")) return READ_COMBO_PROMPTS[index % READ_COMBO_PROMPTS.length];
  if (targetId.startsWith("letter:")) return READ_LETTER_PROMPTS[index % READ_LETTER_PROMPTS.length];
  return READ_DEFAULT_PROMPTS[index % READ_DEFAULT_PROMPTS.length];
}

export function generateReadItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities, masterySnapshot, lesson, renderProfile } = input;

  if (step.type !== "read") return [];

  // 1. Pick source entities pre-filtered to step target type, then to readable
  const prefix = TARGET_TO_PREFIX[step.target];
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
    prefix,
  );

  const capable = filterToCapability(sourceEntities, "readable");
  if (capable.length === 0) return [];

  // 2. Determine answerMode using graduated phase progression:
  //    Phase 1 (lessons 1-8):  transliteration — learner needs visual scaffolding
  //    Phase 2 early (9-14):   audio — aggressively phase out transliteration
  //    Phase 2 late (15-18):   audio only
  //    Phase 3+:               audio (anti-transliteration guard enforced)
  //
  //    NOTE: The spec allows Phase 2 early to alternate between modes, but we default
  //    to audio throughout Phase 2 as the stricter / safer choice. This ensures
  //    learners are pushed off transliteration as early as Phase 2.
  const answerMode: ExerciseItem["answerMode"] = determineAnswerMode(lesson.phase, lesson.id);

  // 3. Apply renderOverride from step if set, else use lesson renderProfile
  const resolvedRenderProfile = step.renderOverride ?? renderProfile;

  const items: ExerciseItem[] = [];

  for (let i = 0; i < step.count; i++) {
    const target = capable[i % capable.length];

    const distractors = pickDistractors(
      target,
      allUnlockedEntities,
      3,
      masterySnapshot.confusionPairs,
    );

    // 5. Build options based on answerMode
    const options: ExerciseOption[] = shuffle([
      buildOption(target.id, target.transliteration, deriveAudioKey(target), target.displayArabic, answerMode, true),
      ...distractors.map((d) =>
        buildOption(d.id, d.transliteration, deriveAudioKey(d), d.displayArabic, answerMode, false)
      ),
    ]);

    // Ensure exactly 4 options (1 correct + 3 distractors); pad if pool was small
    const finalOptions = padOptions(options, target.id, capable, answerMode);

    items.push({
      type: "read",
      prompt: {
        text: pickReadPrompt(target.id, resolvedRenderProfile, i),
        arabicDisplay: target.displayArabic,
      },
      options: finalOptions,
      correctAnswer: { kind: "single", value: target.id },
      targetEntityId: target.id,
      isDecodeItem: true,
      answerMode,
    });
  }

  return items;
}

// ── Option Builder ──

function buildOption(
  id: string,
  transliteration: string | undefined,
  audioKey: string,
  displayArabic: string,
  answerMode: ExerciseItem["answerMode"],
  isCorrect: boolean,
): ExerciseOption {
  if (answerMode === "transliteration") {
    return {
      id,
      displayText: transliteration ?? id,
      isCorrect,
    };
  }

  if (answerMode === "audio") {
    return {
      id,
      audioKey,
      // Include transliteration as a display fallback for chunk entities that
      // don't have audio assets yet — prevents CompactOption showing nothing.
      displayText: transliteration,
      isCorrect,
    };
  }

  // arabic mode fallback
  return {
    id,
    displayArabic,
    isCorrect,
  };
}

// ── Answer Mode — Graduated phase progression ──
//
// Phase 1 (lessons 1-8):   transliteration (scaffold for absolute beginners)
// Phase 2 (lessons 9-18):  audio (aggressively phases out transliteration)
// Phase 3+:                audio (anti-transliteration guard — enforced at generator level)
//
// The spec allows Phase 2 early (9-14) to alternate between modes, but we use audio
// throughout Phase 2 as the stricter choice. Transliteration is a crutch; removing it
// in Phase 2 forces the learner to develop sound-symbol mapping earlier.

function determineAnswerMode(phase: number, _lessonId: number): ExerciseItem["answerMode"] {
  // Phase 3+: NEVER transliteration (anti-transliteration guard)
  if (phase > 2) return "audio";
  // Phase 2 (early and late): audio only — phase out transliteration immediately
  if (phase === 2) return "audio";
  // Phase 1: transliteration scaffold
  return "transliteration";
}

// ── Option Padding (ensure exactly 4 options) ──
// If the distractor pool was too small, fill with synthetic fallbacks.

function padOptions(
  options: ExerciseOption[],
  correctId: string,
  pool: ReturnType<typeof filterToCapability>,
  answerMode: ExerciseItem["answerMode"],
): ExerciseOption[] {
  if (options.length >= 4) return options.slice(0, 4);

  const result = [...options];
  const usedIds = new Set(result.map((o) => o.id));

  for (const entity of pool) {
    if (result.length >= 4) break;
    if (usedIds.has(entity.id)) continue;
    result.push(buildOption(
      entity.id,
      entity.transliteration,
      deriveAudioKey(entity),
      entity.displayArabic,
      answerMode,
      entity.id === correctId,
    ));
    usedIds.add(entity.id);
  }

  return result;
}
