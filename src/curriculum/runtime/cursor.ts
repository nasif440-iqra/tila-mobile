export type AdvanceResult = { nextIndex: number | null; complete: boolean };

/**
 * Compute the next cursor state after an advance.
 * Returns `{ complete: true }` when there are no more screens (or when total <= 0).
 */
export function advanceCursor(current: number, total: number): AdvanceResult {
  if (total <= 0) return { nextIndex: null, complete: true };
  const next = current + 1;
  if (next >= total) return { nextIndex: null, complete: true };
  return { nextIndex: next, complete: false };
}

export type RetreatResult = { prevIndex: number | null };

/**
 * Compute the previous cursor state after a go-back request.
 * Returns `{ prevIndex: null }` when already at the first screen
 * or when inputs are out of range.
 */
export function retreatCursor(current: number, total: number): RetreatResult {
  if (total <= 0) return { prevIndex: null };
  if (current <= 0) return { prevIndex: null };
  if (current > total) return { prevIndex: null };
  return { prevIndex: current - 1 };
}
