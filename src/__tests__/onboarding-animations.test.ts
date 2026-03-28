import { describe, it, expect } from "vitest";
import {
  STAGGER_BASE,
  STAGGER_DURATION,
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../components/onboarding/animations";

describe("Onboarding Animation Constants", () => {
  describe("ONB-03: Existing constants preserved", () => {
    it("exports STAGGER_BASE as a number", () => {
      expect(typeof STAGGER_BASE).toBe("number");
      expect(STAGGER_BASE).toBe(150);
    });

    it("exports STAGGER_DURATION as a number", () => {
      expect(typeof STAGGER_DURATION).toBe("number");
      expect(STAGGER_DURATION).toBe(500);
    });

    it("exports SPLASH_STAGGER_BASE as a number", () => {
      expect(typeof SPLASH_STAGGER_BASE).toBe("number");
      expect(SPLASH_STAGGER_BASE).toBe(250);
    });

    it("exports SPLASH_STAGGER_DURATION as a number", () => {
      expect(typeof SPLASH_STAGGER_DURATION).toBe("number");
      expect(SPLASH_STAGGER_DURATION).toBe(700);
    });

    it("exports CTA_DELAY_OFFSET as a number", () => {
      expect(typeof CTA_DELAY_OFFSET).toBe("number");
      expect(CTA_DELAY_OFFSET).toBe(200);
    });

    it("exports CTA_DURATION as a number", () => {
      expect(typeof CTA_DURATION).toBe("number");
      expect(CTA_DURATION).toBe(500);
    });
  });

  describe("ONB-03: New Phase 2 constants", () => {
    it.todo("exports BISMILLAH_DISPLAY_DURATION = 2500");
    it.todo("exports STILLNESS_BEAT_DURATION = 1200");
    it.todo(
      "exports LETTER_REVEAL_HAPTIC_DELAY derived from SPLASH_STAGGER_DURATION + STILLNESS_BEAT_DURATION"
    );
  });
});
