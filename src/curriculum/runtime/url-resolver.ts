/**
 * Map an Expo Router route param (numeric, e.g. "1") to the
 * canonical zero-padded lesson ID (e.g. "lesson-01").
 * Returns null for anything that can't be parsed as a positive integer.
 */
export function resolveLessonId(
  param: string | string[] | undefined
): string | null {
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== raw.trim()) return null;
  return `lesson-${String(n).padStart(2, "0")}`;
}
