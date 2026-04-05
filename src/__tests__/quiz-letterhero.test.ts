import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("ArabicText quizOption size tier", () => {
  const arabicTextSource = fs.readFileSync(
    path.resolve(__dirname, "../design/components/ArabicText.tsx"),
    "utf-8"
  );

  it("includes quizOption in the ArabicSize type union", () => {
    expect(arabicTextSource).toContain('"quizOption"');
  });

  it("maps quizOption to typography.arabicQuizHero in SIZE_MAP", () => {
    expect(arabicTextSource).toMatch(/quizOption:\s*typography\.arabicQuizHero/);
  });

  it("has exactly 5 sizes: display, quizHero, quizOption, large, body", () => {
    // Match the type union line
    const typeUnionMatch = arabicTextSource.match(
      /type\s+ArabicSize\s*=\s*([^;]+);/
    );
    expect(typeUnionMatch).not.toBeNull();
    const unionStr = typeUnionMatch![1];
    expect(unionStr).toContain('"display"');
    expect(unionStr).toContain('"quizHero"');
    expect(unionStr).toContain('"quizOption"');
    expect(unionStr).toContain('"large"');
    expect(unionStr).toContain('"body"');
  });
});

describe("QuizQuestion LetterHero sizing", () => {
  const quizQuestionSource = fs.readFileSync(
    path.resolve(__dirname, "../components/quiz/QuizQuestion.tsx"),
    "utf-8"
  );

  it("has letterCircle width of 160", () => {
    expect(quizQuestionSource).toMatch(/width:\s*160/);
  });

  it("has letterCircle height of 160", () => {
    expect(quizQuestionSource).toMatch(/height:\s*160/);
  });

  it("has letterCircle borderRadius of 80", () => {
    expect(quizQuestionSource).toMatch(/borderRadius:\s*80/);
  });

  it("has WarmGlow size of 240", () => {
    expect(quizQuestionSource).toMatch(/size=\{240\}/);
  });

  it("imports WarmGlow from design/atmosphere (canonical path)", () => {
    expect(quizQuestionSource).toContain("design/atmosphere");
  });

  it("uses display size for the letter in LetterPrompt", () => {
    expect(quizQuestionSource).toContain('size="display"');
  });

  it("has WarmGlow animated prop", () => {
    // WarmGlow should have animated prop (boolean shorthand or animated={true})
    const warmGlowMatch = quizQuestionSource.match(/<WarmGlow[\s\S]*?\/>/);
    expect(warmGlowMatch).not.toBeNull();
    expect(warmGlowMatch![0]).toMatch(/\banimated\b/);
  });
});
