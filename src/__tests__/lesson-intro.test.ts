import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../components/LessonIntro.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("LES-01: LessonIntro warm entrance", () => {
  it("imports WarmGlow component", () => {
    expect(source).toMatch(/import.*WarmGlow/);
  });

  it("imports springs from design/animations", () => {
    expect(source).toMatch(/import.*springs.*from.*design\/animations/);
  });

  it("uses staggers.fast.delay for staggered entrance", () => {
    expect(source).toMatch(/staggers\.fast\.delay/);
  });
});
