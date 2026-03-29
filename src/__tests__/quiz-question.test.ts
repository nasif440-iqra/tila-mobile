import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/quiz/QuizQuestion.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("LES-03: QuizQuestion correct feedback", () => {
  it("imports springs from design/animations", () => {
    expect(source).toMatch(/import.*springs.*from.*design\/animations/);
  });

  it("contains springs.press for correct feedback pulse", () => {
    expect(source).toMatch(/springs\.press/);
  });

  it("does NOT import from design/haptics (haptics owned by QuizOption)", () => {
    expect(source).not.toMatch(/import.*from.*design\/haptics/);
  });
});
