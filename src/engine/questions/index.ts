import type { Lesson } from "../../types/lesson";
import type { Question } from "../../types/question";

export { shuffle, pickRandom } from "./shared";
export { generateRecognitionQs } from "./recognition";
export { generateSoundQs } from "./sound";
export { generateContrastQs } from "./contrast";
export { generateHarakatIntroQs, generateHarakatQs } from "./harakat";
export { getWrongExplanation, getContrastExplanation, getHarakatWrongExplanation } from "./explanations";

import { generateRecognitionQs } from "./recognition";
import { generateSoundQs } from "./sound";
import { generateContrastQs } from "./contrast";
import { generateHarakatIntroQs, generateHarakatQs } from "./harakat";
import { generateCheckpointQs } from "./checkpoint";
import { generateReviewQs } from "./review";
import { filterValidQuestions } from "./shared";
import { generateConnectedFormExercises } from "./connectedForms";
import { generateConnectedReadingExercises } from "./connectedReading";

/** Progress data passed through to individual generators (checkpoint, review). */
interface LessonProgress {
  mastery?: {
    entities?: Record<string, { correct?: number; attempts?: number; sessionStreak?: number }>;
  };
  [key: number]: { correct?: number; attempts?: number; sessionStreak?: number } | undefined;
}

export function generateLessonQuestions(lesson: Lesson, progress?: LessonProgress | null): Question[] {
  let qs: Question[];
  if (lesson.lessonMode === "checkpoint") qs = generateCheckpointQs(lesson, progress);
  else if (lesson.lessonMode === "review") qs = generateReviewQs(lesson, progress);
  else if (lesson.lessonMode === "contrast") qs = generateContrastQs(lesson);
  else if (lesson.lessonMode === "harakat-intro") qs = generateHarakatIntroQs(lesson);
  else if (lesson.lessonMode === "harakat" || lesson.lessonMode === "harakat-mixed") qs = generateHarakatQs(lesson);
  else qs = lesson.lessonMode === "sound" ? generateSoundQs(lesson) : generateRecognitionQs(lesson);

  // Safeguard: validate every question, replace failures with fallbacks
  return filterValidQuestions(qs, lesson);
}

/**
 * Generate exercises for hybrid (Phase 4+) lessons.
 * These return exercise objects (not quiz questions) for the hybrid lesson framework.
 * Falls back to standard question generation for non-hybrid modes.
 */
export function generateHybridExercises(lesson: Lesson, progress?: LessonProgress | null): Question[] {
  if (lesson.lessonMode === "connected-forms") return generateConnectedFormExercises(lesson) as unknown as Question[];
  if (lesson.lessonMode === "connected-reading") return generateConnectedReadingExercises(lesson) as unknown as Question[];
  return generateLessonQuestions(lesson, progress);
}
