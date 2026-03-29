import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const source = readFileSync(
  resolve(__dirname, "../../app/(tabs)/progress.tsx"),
  "utf-8",
);

describe("Progress screen entrance animations (PROG-01)", () => {
  it("imports from react-native-reanimated", () => {
    expect(source).toMatch(/from\s+["']react-native-reanimated["']/);
  });

  it("imports animation presets from design animations module", () => {
    expect(source).toMatch(/(?:durations|easings|staggers).*from.*design\/animations/s);
  });

  it("uses useSharedValue for animated entrance values", () => {
    expect(source).toContain("useSharedValue");
  });

  it("uses useAnimatedStyle for animated styles", () => {
    expect(source).toContain("useAnimatedStyle");
  });

  it("uses withDelay for staggered entrance", () => {
    expect(source).toContain("withDelay");
  });

  it("uses withTiming for entrance fade/translate", () => {
    expect(source).toContain("withTiming");
  });

  it("references design system duration/stagger presets (no magic numbers)", () => {
    const hasDurationPreset = /durations\./.test(source);
    const hasStaggerPreset = /staggers\./.test(source);
    expect(hasDurationPreset || hasStaggerPreset).toBe(true);
  });
});
