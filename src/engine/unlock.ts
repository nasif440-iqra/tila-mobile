/**
 * Pure unlock logic extracted from web app's progress.js.
 *
 * These functions determine whether lessons and phases are unlocked
 * based on completion state and mastery data. They have NO browser
 * dependencies — all inputs are passed as arguments.
 */

import { LESSONS, PHASE_1_COMPLETION_THRESHOLD, PHASE_2_COMPLETION_THRESHOLD, PHASE_3_COMPLETION_THRESHOLD } from "../data/lessons.js";
import { deriveMasteryState } from "./mastery";
import type { EntityState } from "./progress";

/**
 * Minimum fraction of taught letters that must be at "accurate" or "retained"
 * mastery state to unlock the next phase.
 */
export const PHASE_MASTERY_FRACTION = 0.7;

/**
 * Check if a phase transition meets the mastery competence requirement.
 */
export function isPhaseCompetent(
  phase: number,
  completedLessonIds: number[],
  entities?: Record<string, EntityState> | null,
  today?: string | null
): boolean {
  // If no mastery data available, fall back to lesson-count only (backward compat)
  if (!entities || !today) return true;

  const phaseLessons = LESSONS.filter(l => l.phase === phase);
  const completedPhaseLessons = phaseLessons.filter(l => completedLessonIds.includes(l.id));

  // Safety valve: if ALL lessons in the phase are completed, don't block retroactively.
  // This protects legacy users who progressed under the old system.
  if (completedPhaseLessons.length >= phaseLessons.length) return true;

  // Collect unique letters taught in the completed lessons of this phase
  const taughtLetters = new Set<number>();
  completedPhaseLessons.forEach(l => (l.teachIds || []).forEach(id => taughtLetters.add(id)));

  if (taughtLetters.size === 0) return true; // nothing to check

  // Count how many taught letters are at accurate or retained
  let competentCount = 0;
  for (const letterId of taughtLetters) {
    const entry = entities[`letter:${letterId}`];
    const state = deriveMasteryState(entry, today);
    if (state === "accurate" || state === "retained") {
      competentCount++;
    }
  }

  return competentCount / taughtLetters.size >= PHASE_MASTERY_FRACTION;
}

export function isLessonUnlocked(
  lessonIndex: number,
  completedLessonIds: number[],
  entities?: Record<string, EntityState>,
  today?: string
): boolean {
  if (lessonIndex === 0) return true;
  const cur = LESSONS[lessonIndex];
  const prev = LESSONS[lessonIndex - 1];
  if (!cur || !prev) return false;

  if (cur.phase === 2 && prev.phase === 1) {
    const p1Done = LESSONS.filter(l => l.phase === 1 && completedLessonIds.includes(l.id)).length;
    if (p1Done < PHASE_1_COMPLETION_THRESHOLD) return false;
    return isPhaseCompetent(1, completedLessonIds, entities, today);
  }

  if (cur.phase === 3 && prev.phase === 2) {
    const p2Done = LESSONS.filter(l => l.phase === 2 && completedLessonIds.includes(l.id)).length;
    if (p2Done < PHASE_2_COMPLETION_THRESHOLD) return false;
    return isPhaseCompetent(2, completedLessonIds, entities, today);
  }

  if (cur.phase === 4 && prev.phase === 3) {
    const p3Done = LESSONS.filter(l => l.phase === 3 && completedLessonIds.includes(l.id)).length;
    if (p3Done < PHASE_3_COMPLETION_THRESHOLD) return false;
    return isPhaseCompetent(3, completedLessonIds, entities, today);
  }

  return completedLessonIds.includes(prev.id);
}

export function isPhase2Unlocked(
  completedLessonIds: number[],
  entities?: Record<string, EntityState>,
  today?: string
): boolean {
  const p1Done = LESSONS.filter(l => l.phase === 1 && completedLessonIds.includes(l.id)).length;
  if (p1Done < PHASE_1_COMPLETION_THRESHOLD) return false;
  return isPhaseCompetent(1, completedLessonIds, entities, today);
}

export function isPhase3Unlocked(
  completedLessonIds: number[],
  entities?: Record<string, EntityState>,
  today?: string
): boolean {
  const p2Done = LESSONS.filter(l => l.phase === 2 && completedLessonIds.includes(l.id)).length;
  if (p2Done < PHASE_2_COMPLETION_THRESHOLD) return false;
  return isPhaseCompetent(2, completedLessonIds, entities, today);
}

export function isPhase4Unlocked(
  completedLessonIds: number[],
  entities?: Record<string, EntityState>,
  today?: string
): boolean {
  const p3Done = LESSONS.filter(l => l.phase === 3 && completedLessonIds.includes(l.id)).length;
  if (p3Done < PHASE_3_COMPLETION_THRESHOLD) return false;
  return isPhaseCompetent(3, completedLessonIds, entities, today);
}
