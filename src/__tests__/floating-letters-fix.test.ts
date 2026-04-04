import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../design/atmosphere/FloatingLettersLayer.tsx"
);
const source = fs.readFileSync(SOURCE_PATH, "utf-8");

describe("FloatingLettersLayer fix (D-14)", () => {
  it("does NOT contain withRepeat(-1 (the Android freeze bug pattern)", () => {
    expect(source).not.toContain("withRepeat(-1");
  });

  it("does NOT contain withRepeat( -1 (whitespace variant)", () => {
    expect(source).not.toContain("withRepeat( -1");
  });

  it("contains useReducedMotion for accessibility (D-12, D-13)", () => {
    expect(source).toContain("useReducedMotion");
  });

  it("imports drift token from animations (uses design system tokens)", () => {
    expect(source).toContain("drift");
    expect(source).toMatch(/from\s+["']\.\.\/animations["']/);
  });

  it("uses runOnJS for restart-loop pattern", () => {
    expect(source).toContain("runOnJS");
  });
});
