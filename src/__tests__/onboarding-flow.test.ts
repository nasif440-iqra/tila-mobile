// Forward-looking stubs — STEP constants created in Plan 02-02
import { describe, it, expect } from "vitest";

describe("OnboardingFlow", () => {
  describe("ONB-01: Flow renders all 9 steps", () => {
    it.todo("exports STEP constant with 9 named entries");
    it.todo("STEP_NAMES array has 9 entries including 'bismillah' at index 4");
    it.todo("TOTAL_STEPS equals 9");
  });

  describe("ONB-02: LetterReveal sacred moment", () => {
    it.todo("LetterReveal imports STILLNESS_BEAT_DURATION from animations");
    it.todo("hapticMilestone is called during letter reveal");
  });

  describe("ONB-03: Step transitions use correct presets", () => {
    it.todo("all step renders use STEP.* constants, not raw numbers");
    it.todo("FloatingLettersLayer visible condition uses STEP.STARTING_POINT");
  });
});
