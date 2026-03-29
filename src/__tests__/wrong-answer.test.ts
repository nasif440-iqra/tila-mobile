import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/quiz/WrongAnswerPanel.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("LES-04: WrongAnswerPanel encouragement", () => {
  it("imports WRONG_ENCOURAGEMENT from engagement", () => {
    expect(source).toMatch(/import.*WRONG_ENCOURAGEMENT.*from.*engagement/);
  });

  it("imports pickCopy from engagement", () => {
    expect(source).toMatch(/import.*pickCopy.*from.*engagement/);
  });

  it("uses encouragement prefix in explanation text", () => {
    // The component should use pickCopy(WRONG_ENCOURAGEMENT) to prefix the explanation
    expect(source).toMatch(/pickCopy.*WRONG_ENCOURAGEMENT/);
  });
});
