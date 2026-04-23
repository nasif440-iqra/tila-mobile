import { describe, it, expect } from "vitest";
import {
  noopMasteryRecorder,
  type EntityAttemptEvent,
  type LessonOutcomeEvent,
} from "../../curriculum/runtime/mastery-recorder";

describe("noopMasteryRecorder", () => {
  it("recordEntityAttempt resolves without throwing", async () => {
    const event: EntityAttemptEvent = {
      entityKey: "letter:alif",
      correct: true,
      lessonId: "lesson-01",
      itemId: "3.2",
      attemptedAt: Date.now(),
    };
    await expect(noopMasteryRecorder.recordEntityAttempt(event)).resolves.toBeUndefined();
  });

  it("recordLessonOutcome resolves without throwing", async () => {
    const event: LessonOutcomeEvent = {
      lessonId: "lesson-01",
      passed: true,
      itemsTotal: 4,
      itemsCorrect: 4,
      completedAt: Date.now(),
    };
    await expect(noopMasteryRecorder.recordLessonOutcome(event)).resolves.toBeUndefined();
  });

  it("accepts optional metadata bag", async () => {
    await expect(
      noopMasteryRecorder.recordEntityAttempt({
        entityKey: "letter:ba",
        correct: false,
        lessonId: "lesson-01",
        itemId: "3.4",
        attemptedAt: 0,
        metadata: { attempt: 2, source: "retry" },
      })
    ).resolves.toBeUndefined();
  });
});
