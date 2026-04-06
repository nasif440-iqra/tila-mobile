import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const finishPath = path.resolve(
  __dirname,
  "../components/onboarding/steps/Finish.tsx"
);
const finishSource = fs.readFileSync(finishPath, "utf-8");

describe("Finish step settle animation", () => {
  it("does not use withSpring for checkmark animation", () => {
    // The bouncy spring was replaced with a gentle settle
    expect(finishSource).not.toMatch(/withSpring\s*\(\s*1\.0\s*,\s*springs\.bouncy/);
  });

  it("uses withSequence or withTiming for checkmark animation", () => {
    expect(finishSource).toMatch(/withSequence|withTiming/);
  });

  it("starts scale from a small value", () => {
    // Should start from a small scale (e.g. 0.85 or similar gentle start)
    expect(finishSource).toMatch(/useSharedValue\s*\(\s*0\.\d/);
  });

  it("imports withSequence or withTiming from reanimated", () => {
    expect(finishSource).toMatch(/withSequence|withTiming/);
    expect(finishSource).toContain("react-native-reanimated");
  });
});
