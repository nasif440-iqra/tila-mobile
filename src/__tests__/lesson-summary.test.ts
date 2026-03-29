import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/LessonSummary.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("LES-05: LessonSummary score-proportional celebration", () => {
  it("imports WarmGlow component", () => {
    expect(source).toMatch(/import.*WarmGlow/);
  });

  it("imports hapticMilestone from design/haptics", () => {
    expect(source).toMatch(/import.*hapticMilestone.*from.*design\/haptics/);
  });

  it("contains conditional WarmGlow render for percentage >= 50", () => {
    expect(source).toMatch(/percentage\s*>=\s*50/);
  });

  it("contains score-proportional haptic calls (hapticMilestone, hapticSuccess, hapticTap)", () => {
    expect(source).toMatch(/hapticMilestone/);
    expect(source).toMatch(/hapticSuccess/);
    expect(source).toMatch(/hapticTap/);
  });
});
