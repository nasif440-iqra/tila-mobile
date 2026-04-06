import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const componentPath = path.resolve(
  __dirname,
  "../design/components/PhraseReveal.tsx"
);
const componentSource = fs.readFileSync(componentPath, "utf-8");

describe("PhraseReveal component", () => {
  it("exists as a file", () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it("exports PhraseReveal function", () => {
    expect(componentSource).toContain("export function PhraseReveal");
  });

  it("exports PhraseWord interface", () => {
    expect(componentSource).toContain("export interface PhraseWord");
  });

  it("exports PhraseRevealProps interface", () => {
    expect(componentSource).toContain("export interface PhraseRevealProps");
  });
});

describe("PhraseWord interface", () => {
  it("has arabic field", () => {
    expect(componentSource).toContain("arabic: string");
  });

  it("has transliteration field", () => {
    expect(componentSource).toContain("transliteration: string");
  });

  it("has optional meaning field", () => {
    expect(componentSource).toContain("meaning?: string");
  });
});

describe("PhraseRevealProps interface", () => {
  it("accepts words array of PhraseWord", () => {
    expect(componentSource).toContain("words: PhraseWord[]");
  });

  it("has onComplete callback", () => {
    expect(componentSource).toContain("onComplete");
  });

  it("has layout prop with horizontal and vertical", () => {
    expect(componentSource).toMatch(/layout\?.*"horizontal"\s*\|\s*"vertical"/);
  });

  it("has arabicSize prop", () => {
    expect(componentSource).toContain("arabicSize");
  });

  it("has wordDuration with default 700", () => {
    expect(componentSource).toContain("wordDuration");
    expect(componentSource).toMatch(/wordDuration\s*=\s*700/);
  });

  it("has staggerDelay with default 350", () => {
    expect(componentSource).toContain("staggerDelay");
    expect(componentSource).toMatch(/staggerDelay\s*=\s*350/);
  });
});

describe("PhraseReveal animation behavior", () => {
  it("uses useReducedMotion from reanimated", () => {
    expect(componentSource).toContain("useReducedMotion");
  });

  it("has Pressable wrapper for tap-to-skip", () => {
    expect(componentSource).toContain("Pressable");
    expect(componentSource).toContain("handleSkip");
  });

  it("has accessibility hint for tap-to-skip", () => {
    expect(componentSource).toContain("Double tap to reveal all words");
  });

  it("cleans up timer on unmount with clearTimeout", () => {
    expect(componentSource).toContain("clearTimeout");
  });

  it("uses timerRef for completion callback", () => {
    expect(componentSource).toContain("timerRef");
  });

  it("uses ArabicText component for Arabic rendering", () => {
    expect(componentSource).toContain("ArabicText");
  });

  it("has RTL support for horizontal layout", () => {
    expect(componentSource).toContain("row-reverse");
    expect(componentSource).toContain("writingDirection");
  });

  it("has minHeight reservation to prevent reflow", () => {
    expect(componentSource).toContain("minHeight");
  });

  it("has flexShrink: 0 on word units", () => {
    expect(componentSource).toContain("flexShrink: 0");
  });
});

describe("PhraseReveal word rendering", () => {
  it("renders transliteration text per word", () => {
    expect(componentSource).toContain("transliteration");
    expect(componentSource).toMatch(/fontFamilies\.bodyRegular/);
  });

  it("renders optional meaning in italic", () => {
    expect(componentSource).toContain("meaning");
    expect(componentSource).toMatch(/fontFamilies\.headingItalic/);
  });

  it("has at least 100 lines of code", () => {
    const lines = componentSource.split("\n").length;
    expect(lines).toBeGreaterThanOrEqual(100);
  });
});
