import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/quiz/QuizProgress.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("LES-02: QuizProgress animated bar", () => {
  it("imports springs from design/animations", () => {
    expect(source).toMatch(/import.*springs.*from.*design\/animations/);
  });

  it("does NOT contain hardcoded stiffness: 120", () => {
    expect(source).not.toMatch(/stiffness:\s*120/);
  });

  it("contains interpolateColor for color transition", () => {
    expect(source).toMatch(/interpolateColor/);
  });
});
