import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const WARM_GLOW_PATH = path.resolve(
  __dirname,
  "../design/atmosphere/WarmGlow.tsx"
);
const FLOATING_PATH = path.resolve(
  __dirname,
  "../design/atmosphere/FloatingLettersLayer.tsx"
);

const warmGlowSource = fs.readFileSync(WARM_GLOW_PATH, "utf-8");
const floatingSource = fs.readFileSync(FLOATING_PATH, "utf-8");

describe("Reduce Motion support (D-12, D-13)", () => {
  it("WarmGlow imports useReducedMotion from react-native-reanimated", () => {
    expect(warmGlowSource).toContain("useReducedMotion");
    expect(warmGlowSource).toMatch(/from\s+["']react-native-reanimated["']/);
  });

  it("FloatingLettersLayer imports useReducedMotion from react-native-reanimated", () => {
    expect(floatingSource).toContain("useReducedMotion");
    expect(floatingSource).toMatch(/from\s+["']react-native-reanimated["']/);
  });

  it("WarmGlow imports from react-native-reanimated", () => {
    expect(warmGlowSource).toMatch(/from\s+["']react-native-reanimated["']/);
  });

  it("FloatingLettersLayer imports from react-native-reanimated", () => {
    expect(floatingSource).toMatch(/from\s+["']react-native-reanimated["']/);
  });
});
