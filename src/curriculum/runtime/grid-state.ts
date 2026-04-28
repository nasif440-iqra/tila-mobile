import type { ProgressState } from "./progress-store";

export type LessonCellState = "completed" | "current" | "locked";

export interface LessonCell {
  lessonId: string;
  state: LessonCellState;
}

/**
 * Pure derivation: maps a sequence of lesson ids and a progress snapshot to
 * per-cell render states. The first uncompleted lesson whose previous lesson
 * is completed is "current" (the "you are here" cell). All cells past that
 * point are "locked" until prior cells complete.
 *
 * `progress.lastReachedLessonId` is intentionally unused here — sequencing
 * derives solely from `progress.completedLessonIds`. The lastReachedLessonId
 * field exists on `ProgressState` for navigation hints (e.g., resume target)
 * but is not part of grid-cell logic.
 */
export function deriveLessonGridState(
  lessonIds: string[],
  progress: ProgressState
): LessonCell[] {
  const completed = new Set(progress.completedLessonIds);
  let foundCurrent = false;
  return lessonIds.map((id, idx) => {
    if (completed.has(id)) {
      return { lessonId: id, state: "completed" };
    }
    const prevId = idx > 0 ? lessonIds[idx - 1] : null;
    const prevDone = prevId === null || completed.has(prevId);
    if (prevDone && !foundCurrent) {
      foundCurrent = true;
      return { lessonId: id, state: "current" };
    }
    return { lessonId: id, state: "locked" };
  });
}
