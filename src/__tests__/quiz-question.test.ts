import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/quiz/QuizQuestion.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("LES-03: QuizQuestion correct feedback", () => {
  it("renders QuizOption with state prop for correct/wrong feedback", () => {
    expect(source).toMatch(/optionState/);
    expect(source).toMatch(/state={optionState}/);
  });

  it("does NOT import from design/haptics (haptics owned by QuizOption)", () => {
    expect(source).not.toMatch(/import.*from.*design\/haptics/);
  });

  it("does NOT render a separate correct feedback bubble (feedback is on the option card)", () => {
    expect(source).not.toMatch(/correctFeedback/);
  });
});
