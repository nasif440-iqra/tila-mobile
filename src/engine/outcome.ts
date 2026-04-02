/**
 * Lesson outcome evaluation.
 *
 * Single source of truth for whether a lesson attempt counts as "passed".
 * Separates "attempt recorded" (mastery tracking) from "lesson passed" (progression).
 */

import type { LessonOutcome } from '../types/engine';

/**
 * Per-mode pass thresholds.
 * null = never gates progression (review sessions).
 */
const MODE_THRESHOLDS: Record<string, number | null> = {
  recognition: 0.8,
  sound: 0.8,
  contrast: 0.8,
  checkpoint: 0.8,
  "harakat-intro": 0.8,
  harakat: 0.8,
  "harakat-mixed": 0.8,
  review: null,
};

const DEFAULT_THRESHOLD = 0.8;

/**
 * Get the pass threshold for a given lesson mode.
 * Returns null for modes that never gate progression.
 */
export function getPassThreshold(lessonMode: string): number | null {
  if (lessonMode in MODE_THRESHOLDS) return MODE_THRESHOLDS[lessonMode]!;
  return DEFAULT_THRESHOLD;
}

/**
 * Evaluate a lesson attempt.
 */
export function evaluateLessonOutcome(
  quizResults: Array<{ correct: boolean }>,
  lessonMode: string,
): LessonOutcome {
  const total = quizResults.length;
  const correct = quizResults.filter(r => r.correct).length;
  const accuracy = total > 0 ? correct / total : 0;
  const threshold = getPassThreshold(lessonMode);

  // null threshold = mode never gates progression
  if (threshold === null) {
    return { total, correct, accuracy, passed: true, threshold };
  }

  const passed = accuracy >= threshold;
  return { total, correct, accuracy, passed, threshold };
}

export { MODE_THRESHOLDS, DEFAULT_THRESHOLD };
