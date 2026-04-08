import type { GeneratorInput, ExerciseItem, ExerciseOption, FixSegment } from "@/src/types/exercise";
import { pickEntitiesBySource, filterToCapability, shuffle } from "./shared";

// ── Harakat constants ──

const FATHA = "\u064E";  // َ  (above, a-vowel)
const KASRA = "\u0650";  // ِ  (below, i-vowel)
const DAMMA = "\u064F";  // ُ  (above loop, u-vowel)

const HARAKAT = [FATHA, KASRA, DAMMA];

// ── Fix Generator — error correction with explicit FixSegment hit zones ──

export function generateFixItems(input: GeneratorInput): ExerciseItem[] {
  const { step, teachEntities, reviewEntities, allUnlockedEntities } = input;

  if (step.type !== "fix") return [];

  // 1. Pick source entities, filter to fixable
  const sourceEntities = pickEntitiesBySource(
    step.source,
    teachEntities,
    reviewEntities,
    allUnlockedEntities,
  );
  const capable = filterToCapability(sourceEntities, "fixable");
  if (capable.length === 0) return [];

  const items: ExerciseItem[] = [];

  for (let i = 0; i < step.count; i++) {
    const target = capable[i % capable.length];

    // 2. Introduce one error based on step.target
    const errorType = step.target;

    if (errorType === "vowel") {
      // ── Vowel error: swap harakat mark ──

      const originalDisplay = target.displayArabic;

      // Find which harakat the entity contains (if any)
      const originalMark = HARAKAT.find((h) => originalDisplay.includes(h)) ?? FATHA;
      const altMarks = HARAKAT.filter((h) => h !== originalMark);

      // Pick a wrong mark deterministically (rotate by index)
      const wrongMark = altMarks[i % altMarks.length];

      // Produce the corrupted display string
      const corruptedDisplay = originalDisplay.replace(originalMark, wrongMark);

      // 3. Build FixSegment[] — separate letter body from mark
      const letterBody = originalDisplay.replace(originalMark, "");
      const segments: FixSegment[] = [
        {
          segmentId: "seg-0",
          displayText: letterBody,
          isErrorLocation: false,
          boundingGroup: "letter",
        },
        {
          segmentId: "seg-1",
          displayText: wrongMark,
          isErrorLocation: true,
          boundingGroup: "mark",
        },
      ];

      // 4. Build correction options: correct mark + wrong alternates
      const correctOption: ExerciseOption = {
        id: `opt-correct`,
        displayArabic: originalMark,
        isCorrect: true,
      };

      const distractorOptions: ExerciseOption[] = altMarks.map((m) => ({
        id: `opt-${m.codePointAt(0)}`,
        displayArabic: m,
        isCorrect: false,
      }));

      const options = shuffle([correctOption, ...distractorOptions]);

      items.push({
        type: "fix",
        prompt: {
          text: "Find and fix the error",
          arabicDisplay: corruptedDisplay,
        },
        options,
        fixSegments: segments,
        correctAnswer: {
          kind: "fix",
          location: "seg-1",
          replacement: originalMark,
        },
        targetEntityId: target.id,
        isDecodeItem: false,
        answerMode: "fix-locate",
      });
    } else {
      // ── Other error types (dot, letter, join, word) ──
      // Simplified: swap displayArabic for a random entity from pool and
      // present the original as the correct replacement (whole-unit substitution).

      const pool = allUnlockedEntities.filter(
        (e) => e.id !== target.id && e.capabilities.includes("fixable"),
      );
      const wrong = pool.length > 0 ? pool[i % pool.length] : target;

      const wrongDisplay = wrong.displayArabic;
      const correctDisplay = target.displayArabic;

      const segments: FixSegment[] = [
        {
          segmentId: "seg-0",
          displayText: wrongDisplay,
          isErrorLocation: true,
          boundingGroup: errorType === "join" ? "join" : errorType === "word" ? "word" : "letter",
        },
      ];

      const correctOption: ExerciseOption = {
        id: `opt-correct`,
        displayArabic: correctDisplay,
        isCorrect: true,
      };

      const distractors = allUnlockedEntities
        .filter((e) => e.id !== target.id && e.id !== wrong.id)
        .slice(0, 2)
        .map((e) => ({
          id: `opt-${e.id}`,
          displayArabic: e.displayArabic,
          isCorrect: false,
        }));

      const wrongOption: ExerciseOption = {
        id: `opt-wrong`,
        displayArabic: wrongDisplay,
        isCorrect: false,
      };

      const options = shuffle([correctOption, wrongOption, ...distractors]).slice(0, 4);

      items.push({
        type: "fix",
        prompt: {
          text: "Find and fix the error",
          arabicDisplay: wrongDisplay,
        },
        options,
        fixSegments: segments,
        correctAnswer: {
          kind: "fix",
          location: "seg-0",
          replacement: correctDisplay,
        },
        targetEntityId: target.id,
        isDecodeItem: false,
        answerMode: "fix-locate",
      });
    }
  }

  return items;
}
