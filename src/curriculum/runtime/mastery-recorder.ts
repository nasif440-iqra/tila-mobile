// src/curriculum/runtime/mastery-recorder.ts

import type { EntityKey } from "../types";

export interface EntityAttemptEvent {
  entityKey: EntityKey;
  correct: boolean;
  lessonId: string;
  itemId: string;
  attemptedAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface LessonOutcomeEvent {
  lessonId: string;
  passed: boolean;
  itemsTotal: number;
  itemsCorrect: number;
  completedAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface MasteryRecorder {
  recordEntityAttempt(event: EntityAttemptEvent): Promise<void>;
  recordLessonOutcome(event: LessonOutcomeEvent): Promise<void>;
}

// ── Noop implementation — used during the A0 vertical slice until the real
//    SQLite-backed recorder is wired in (Task 7 / LessonRunner). ──

export const noopMasteryRecorder: MasteryRecorder = {
  async recordEntityAttempt(event) {
    // eslint-disable-next-line no-console
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[mastery:stub] entity-attempt", event);
    }
  },
  async recordLessonOutcome(event) {
    // eslint-disable-next-line no-console
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[mastery:stub] lesson-outcome", event);
    }
  },
};
