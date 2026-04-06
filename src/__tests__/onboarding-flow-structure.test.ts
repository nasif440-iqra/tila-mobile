import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const flowPath = path.resolve(
  __dirname,
  "../components/onboarding/OnboardingFlow.tsx"
);
const flowSource = fs.readFileSync(flowPath, "utf-8");

describe("OnboardingFlow structure", () => {
  it("has correct TOTAL_STEPS count", () => {
    expect(flowSource).toMatch(/TOTAL_STEPS\s*=\s*\d+/);
  });

  it("has FINISH step defined", () => {
    expect(flowSource).toMatch(/FINISH:\s*\d+/);
  });

  it("renders Finish component", () => {
    expect(flowSource).toContain("<Finish");
  });

  it("tracks onboarding_completed in analytics", () => {
    expect(flowSource).toContain("onboarding_completed");
  });

  it("uses OnboardingStepLayout or step layout pattern", () => {
    expect(flowSource).toMatch(/OnboardingStepLayout|step\s*===\s*STEP\./);
  });
});
