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
