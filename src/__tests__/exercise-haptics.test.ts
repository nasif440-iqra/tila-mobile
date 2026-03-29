import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const EXERCISE_DIR = path.resolve(__dirname, "../components/exercises");
const EXERCISE_FILES = [
  "GuidedReveal.tsx",
  "TapInOrder.tsx",
  "BuildUpReader.tsx",
  "FreeReader.tsx",
  "SpotTheBreak.tsx",
  "ComprehensionExercise.tsx",
];

const LESSON_HYBRID_PATH = path.resolve(
  __dirname,
  "../components/LessonHybrid.tsx"
);

describe("LES-06: Exercise haptics migration", () => {
  describe("no direct expo-haptics imports in exercise components", () => {
    for (const file of EXERCISE_FILES) {
      it(`${file} does NOT import from expo-haptics`, () => {
        const src = fs.readFileSync(path.join(EXERCISE_DIR, file), "utf-8");
        expect(src).not.toMatch(/import.*from\s+["']expo-haptics["']/);
      });
    }
  });

  describe("exercise components import from design/haptics", () => {
    for (const file of EXERCISE_FILES) {
      it(`${file} imports from design/haptics`, () => {
        const src = fs.readFileSync(path.join(EXERCISE_DIR, file), "utf-8");
        expect(src).toMatch(/import.*from.*design\/haptics/);
      });
    }
  });

  it("GuidedReveal imports WarmGlow", () => {
    const src = fs.readFileSync(
      path.join(EXERCISE_DIR, "GuidedReveal.tsx"),
      "utf-8"
    );
    expect(src).toMatch(/import.*WarmGlow/);
  });

  it("LessonHybrid contains springs.gentle (not hardcoded stiffness: 120)", () => {
    const src = fs.readFileSync(LESSON_HYBRID_PATH, "utf-8");
    expect(src).toMatch(/springs\.gentle/);
    expect(src).not.toMatch(/stiffness:\s*120/);
  });
});
