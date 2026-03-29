import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PROG-03: PhasePanel animated progress bars", () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../components/progress/PhasePanel.tsx"),
    "utf-8"
  );

  it("imports from react-native-reanimated", () => {
    expect(source).toMatch(/react-native-reanimated/);
  });

  it("imports or references springs.gentle from animations module", () => {
    expect(source).toMatch(/springs/);
  });

  it("uses Reanimated shared value primitives", () => {
    const hasSharedValue = /useSharedValue/.test(source);
    const hasAnimatedStyle = /useAnimatedStyle/.test(source);
    expect(hasSharedValue || hasAnimatedStyle).toBe(true);
  });

  it("uses withSpring for animated progress bar fill", () => {
    expect(source).toMatch(/withSpring/);
  });

  it("does not contain hardcoded spring config objects (no raw stiffness: outside imports)", () => {
    // Remove import lines to avoid false positive from import path content
    const nonImportLines = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("import"))
      .join("\n");
    // Should NOT contain raw spring config like stiffness: 200
    expect(nonImportLines).not.toMatch(/stiffness\s*:/);
  });
});
