import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/quiz/WrongAnswerPanel.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("QUIZ-04: WrongAnswerPanel warm palette (no punitive patterns)", () => {
  // ── Absence: danger colors and X icon removed ──

  it("does NOT contain dangerLight color token", () => {
    expect(source).not.toMatch(/dangerLight/);
  });

  it("does NOT contain dangerDark color token", () => {
    expect(source).not.toMatch(/dangerDark/);
  });

  it("does NOT contain standalone colors.danger (excluding dangerLight/dangerDark)", () => {
    // Use regex that matches colors.danger but not colors.dangerLight or colors.dangerDark
    expect(source).not.toMatch(/colors\.danger(?!Light|Dark)/);
  });

  it('does NOT contain the X icon unicode character (\\u2717)', () => {
    expect(source).not.toMatch(/\\u2717/);
    expect(source).not.toMatch(/\u2717/);
  });

  it("does NOT contain icon style definition", () => {
    expect(source).not.toMatch(/icon:\s*\{/);
  });

  // ── Presence: warm palette ──

  it("uses colors.accentLight for warm cream background", () => {
    expect(source).toMatch(/colors\.accentLight/);
  });

  it("uses colors.brown for warm brown text", () => {
    expect(source).toMatch(/colors\.brown/);
  });

  it("uses colors.textMuted for de-emphasized chosen letter", () => {
    expect(source).toMatch(/colors\.textMuted/);
  });

  // ── Preservation: encouragement copy ──

  it("still imports WRONG_ENCOURAGEMENT from engagement", () => {
    expect(source).toMatch(/import.*WRONG_ENCOURAGEMENT.*from.*engagement/);
  });

  it("still imports pickCopy from engagement", () => {
    expect(source).toMatch(/import.*pickCopy.*from.*engagement/);
  });

  // ── Typography: caption weight ──

  it("uses fontFamilies.bodySemiBold in compareName context", () => {
    expect(source).toMatch(/fontFamilies\.bodySemiBold/);
  });
});
