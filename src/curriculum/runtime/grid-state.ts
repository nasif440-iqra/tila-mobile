import type { ProgressState } from "./progress-store";

export type LessonCellState = "completed" | "current" | "unlocked" | "locked";

export interface LessonCell {
  lessonId: string;
  state: LessonCellState;
}

/**
 * Pure derivation: maps a sequence of lesson ids and a progress snapshot to
 * per-cell render states. The first uncompleted unlocked lesson is "current"
 * (the "you are here" cell). All cells past the first incomplete lesson are
 * "locked" until prior cells complete.
 */
export function deriveLessonGridState(
  lessonIds: string[],
  progress: ProgressState
): LessonCell[] {
  const completed = new Set(progress.completedLessonIds);
  let foundCurrent = false;
  return lessonIds.map((id, idx) => {
    if (completed.has(id)) {
      return { lessonId: id, state: "completed" as const };
    }
    const prevId = idx > 0 ? lessonIds[idx - 1] : null;
    const prevDone = prevId === null || completed.has(prevId);
    if (prevDone && !foundCurrent) {
      foundCurrent = true;
      return { lessonId: id, state: "current" as const };
    }
    return {
      lessonId: id,
      state: prevDone ? ("unlocked" as const) : ("locked" as const),
    };
  });
}
