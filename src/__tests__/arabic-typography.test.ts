import { describe, it, expect } from "vitest";
import { typography } from "../design/tokens";
import * as fs from "fs";
import * as path from "path";

describe("Arabic typography tokens", () => {
  describe("arabicDisplay", () => {
    it("has fontSize 72 and lineHeight 158 (2.20x ratio)", () => {
      expect(typography.arabicDisplay.fontSize).toBe(72);
      expect(typography.arabicDisplay.lineHeight).toBe(158);
    });
  });

  describe("arabicQuizHero", () => {
    it("has fontSize 52 and lineHeight 114 (2.20x ratio)", () => {
      expect(typography.arabicQuizHero.fontSize).toBe(52);
      expect(typography.arabicQuizHero.lineHeight).toBe(114);
    });
  });

  describe("arabicLarge", () => {
    it("has fontSize 36 and lineHeight 72 (2.00x ratio)", () => {
      expect(typography.arabicLarge.fontSize).toBe(36);
      expect(typography.arabicLarge.lineHeight).toBe(72);
    });
  });

  describe("arabicBody", () => {
    it("has fontSize 24 and lineHeight 48 (2.00x ratio)", () => {
      expect(typography.arabicBody.fontSize).toBe(24);
      expect(typography.arabicBody.lineHeight).toBe(48);
    });
  });

  describe("all Arabic tiers", () => {
    it("have lineHeight >= 2.0x fontSize", () => {
      const arabicKeys = Object.keys(typography).filter((k) =>
        k.startsWith("arabic")
      ) as Array<keyof typeof typography>;

      expect(arabicKeys.length).toBeGreaterThanOrEqual(4);

      for (const key of arabicKeys) {
        const tier = typography[key] as { fontSize: number; lineHeight: number };
        expect(tier.lineHeight).toBeGreaterThanOrEqual(tier.fontSize * 2.0);
      }
    });
  });

  describe("ArabicText component", () => {
    const arabicTextSource = fs.readFileSync(
      path.resolve(__dirname, "../design/components/ArabicText.tsx"),
      "utf-8"
    );

    it("includes quizHero in SIZE_MAP", () => {
      expect(arabicTextSource).toContain("quizHero");
    });

    it("applies overflow visible", () => {
      expect(arabicTextSource).toContain("overflow");
      expect(arabicTextSource).toContain("visible");
    });
  });
});
