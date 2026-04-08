import type { PhaseV2 } from "@/src/types/curriculum-v2";
import type { EntityMastery } from "./mastery";

// ── Types ──

export interface ProgressSnapshot {
  phaseCompleted: (phase: number) => boolean;
  lessonPassed: (lessonId: number) => boolean;
  getOverdueEntities: (phase: number) => EntityMastery[];
  countRetainedEntities: (phase: number) => number;
}

export interface UnlockResult {
  unlocked: boolean;
  reasons: string[];
}

// ── Public API ──

/**
 * Determine whether a phase can be unlocked given current progress.
 * Returns { unlocked: true, reasons: [] } if all conditions pass,
 * or { unlocked: false, reasons: [...] } listing each failed condition.
 */
export function canUnlockPhase(
  phase: PhaseV2,
  progress: ProgressSnapshot,
): UnlockResult {
  const { unlockPolicy } = phase;
  const reasons: string[] = [];

  // 1. Check requirePhase — phase 0 means no prerequisite
  if (unlockPolicy.requirePhase > 0) {
    if (!progress.phaseCompleted(unlockPolicy.requirePhase)) {
      reasons.push(`Phase ${unlockPolicy.requirePhase} must be completed first`);
    }
  }

  // 2. Check reviewQueuePolicy — too many overdue critical entities blocks unlock
  if (unlockPolicy.reviewQueuePolicy) {
    const { maxOverdueCritical, overdueDaysThreshold } = unlockPolicy.reviewQueuePolicy;
    const overdueEntities = progress.getOverdueEntities(unlockPolicy.requirePhase);
    const today = new Date().toISOString().slice(0, 10);

    const criticalOverdue = overdueEntities.filter((m) => {
      const dueDate = m.nextReview.slice(0, 10);
      const msPerDay = 86400000;
      const daysOverdue = (new Date(today).getTime() - new Date(dueDate).getTime()) / msPerDay;
      return daysOverdue >= overdueDaysThreshold;
    });

    if (criticalOverdue.length > maxOverdueCritical) {
      reasons.push(
        `Too many overdue entities: ${criticalOverdue.length} overdue by ${overdueDaysThreshold}+ days (max ${maxOverdueCritical} allowed)`,
      );
    }
  }

  // 3. Check minRetainedEntities
  if (unlockPolicy.minRetainedEntities !== undefined) {
    const retained = progress.countRetainedEntities(unlockPolicy.requirePhase);
    if (retained < unlockPolicy.minRetainedEntities) {
      reasons.push(
        `Not enough retained entities: ${retained} retained (need ${unlockPolicy.minRetainedEntities})`,
      );
    }
  }

  return { unlocked: reasons.length === 0, reasons };
}
