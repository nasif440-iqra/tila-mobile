import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// OnboardingFlow imports react-native-reanimated which requires native modules.
// We verify constants by reading the source file directly.
const flowSource = readFileSync(
  join(__dirname, "../components/onboarding/OnboardingFlow.tsx"),
  "utf-8"
);

describe("OnboardingFlow", () => {
  describe("ONB-01: Flow renders all 10 steps", () => {
    it("TOTAL_STEPS equals 10", () => {
      expect(flowSource).toContain("TOTAL_STEPS = 10");
    });

    it("STEP.NAME_MOTIVATION equals 8", () => {
      expect(flowSource).toContain("NAME_MOTIVATION: 8");
    });

    it("STEP.FINISH equals 9", () => {
      expect(flowSource).toContain("FINISH: 9");
    });

    it("STEP_NAMES includes name_motivation at index 8", () => {
      // name_motivation appears between letter_quiz and finish in the array
      const stepNamesMatch = flowSource.match(
        /STEP_NAMES\s*=\s*\[([^\]]+)\]/s
      );
      expect(stepNamesMatch).not.toBeNull();
      const names = stepNamesMatch![1]
        .split(",")
        .map((s) => s.trim().replace(/['"]/g, ""))
        .filter((s) => s.length > 0);
      expect(names[8]).toBe("name_motivation");
      expect(names[9]).toBe("finish");
      expect(names).toHaveLength(10);
    });

    it("STEP constant has 10 named entries", () => {
      const stepBlock = flowSource.match(/const STEP\s*=\s*\{([^}]+)\}/s);
      expect(stepBlock).not.toBeNull();
      const entries = stepBlock![1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      expect(entries).toHaveLength(10);
    });
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
