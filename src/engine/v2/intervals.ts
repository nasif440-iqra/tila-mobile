// ── Shared interval constants and helpers ──
// Used by mastery.ts and review.ts to avoid duplication.

export const INTERVAL_LEVELS = [0, 1, 3, 7, 14, 30] as const;

export function findIntervalIndex(days: number): number {
  const idx = INTERVAL_LEVELS.indexOf(days as (typeof INTERVAL_LEVELS)[number]);
  return idx >= 0 ? idx : 0;
}

export function nextInterval(currentDays: number): number {
  const idx = findIntervalIndex(currentDays);
  return INTERVAL_LEVELS[Math.min(idx + 1, INTERVAL_LEVELS.length - 1)];
}

export function stepBack(currentDays: number, steps: number): number {
  const idx = findIntervalIndex(currentDays);
  return INTERVAL_LEVELS[Math.max(idx - steps, 0)];
}

export function hasTwoConsecutiveFailures(recentAttempts: { correct: boolean }[]): boolean {
  // Check from most recent backwards
  if (recentAttempts.length < 2) return false;
  const last = recentAttempts[recentAttempts.length - 1];
  const secondLast = recentAttempts[recentAttempts.length - 2];
  return !last.correct && !secondLast.correct;
}
