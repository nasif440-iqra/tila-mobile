import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../design/components/QuizOption.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("QUIZ-02/03: QuizOption warm feedback (no punitive patterns)", () => {
  // ── Absence: punitive patterns removed ──

  it("does NOT contain plusOneOpacity shared value", () => {
    expect(source).not.toMatch(/plusOneOpacity/);
  });

  it("does NOT contain plusOneY shared value", () => {
    expect(source).not.toMatch(/plusOneY/);
  });

  it("does NOT contain plusOneScale shared value", () => {
    expect(source).not.toMatch(/plusOneScale/);
  });

  it("does NOT contain plusOneContainer style", () => {
    expect(source).not.toMatch(/plusOneContainer/);
  });

  it("does NOT contain plusOneText style", () => {
    expect(source).not.toMatch(/plusOneText/);
  });

  it('does NOT render "+1" text literal', () => {
    expect(source).not.toMatch(/["+]1["]/);
  });

  it("does NOT import hapticError", () => {
    expect(source).not.toMatch(/hapticError/);
  });

  it("does NOT contain shake translateX sequence (-6/6/-4/4/0)", () => {
    expect(source).not.toMatch(/-6.*6.*-4.*4.*0/);
  });

  // ── Presence: warm feedback patterns ──

  it("uses hapticTap() for wrong answer path", () => {
    expect(source).toMatch(/hapticTap\(\)/);
  });

  it("uses hapticSuccess() for correct answer path", () => {
    expect(source).toMatch(/hapticSuccess\(\)/);
  });

  it("uses colors.accent for glow overlay (not colors.primary)", () => {
    // Glow overlay should use accent (gold), not primary (green)
    expect(source).toMatch(/backgroundColor:\s*colors\.accent/);
  });

  it('uses size="quizOption" for ArabicText (not size="large")', () => {
    expect(source).toMatch(/size="quizOption"/);
    expect(source).not.toMatch(/size="large"/);
  });

  it("uses 0.35 for dimmed opacity (not 0.45)", () => {
    expect(source).toMatch(/0\.35/);
    expect(source).not.toMatch(/0\.45/);
  });

  it("uses colors.accentLight for selectedWrong background", () => {
    expect(source).toMatch(/colors\.accentLight/);
  });

  it("uses colors.brown for selectedWrong text", () => {
    expect(source).toMatch(/colors\.brown/);
  });

  it("uses colors.accent for selectedCorrect border (gold, not primary)", () => {
    // The border mapping for selectedCorrect should use accent
    const borderSection = source.match(/const borderColor[\s\S]*?;/);
    expect(borderSection).toBeTruthy();
    expect(borderSection![0]).toMatch(/selectedCorrect.*colors\.accent/);
  });

  it("sets glowOpacity to 0.20 for revealedCorrect (per D-08)", () => {
    expect(source).toMatch(/0\.20/);
  });

  it("renders glow overlay for revealedCorrect state", () => {
    // Glow should show for both selectedCorrect and revealedCorrect
    expect(source).toMatch(/revealedCorrect/);
    // The conditional should include revealedCorrect for glow rendering
    expect(source).toMatch(/selectedCorrect.*\|\|.*revealedCorrect/s);
  });

  it("imports useReducedMotion from react-native-reanimated", () => {
    expect(source).toMatch(/useReducedMotion/);
  });

  it("does not use withDelay import (removed with +1 animation)", () => {
    expect(source).not.toMatch(/withDelay/);
  });
});
