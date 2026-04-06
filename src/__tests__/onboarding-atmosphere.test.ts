import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const flowPath = path.resolve(
  __dirname,
  "../components/onboarding/OnboardingFlow.tsx"
);
const flowSource = fs.readFileSync(flowPath, "utf-8");

describe("OnboardingFlow AtmosphereBackground wrapping", () => {
  it("imports AtmosphereBackground", () => {
    expect(flowSource).toContain("AtmosphereBackground");
  });

  it("uses AtmosphereBackground with onboarding preset", () => {
    expect(flowSource).toMatch(/AtmosphereBackground[\s\S]*onboarding/);
  });

  it("does not import FloatingLettersLayer directly", () => {
    expect(flowSource).not.toMatch(
      /import\s*\{[^}]*FloatingLettersLayer[^}]*\}\s*from/
    );
  });

  it("does not render FloatingLettersLayer directly", () => {
    expect(flowSource).not.toContain("<FloatingLettersLayer");
  });
});
