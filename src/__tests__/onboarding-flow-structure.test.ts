import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const flowPath = path.resolve(
  __dirname,
  "../components/onboarding/OnboardingFlow.tsx"
);
const flowSource = fs.readFileSync(flowPath, "utf-8");

describe("OnboardingFlow structure", () => {
  it("has TOTAL_STEPS = 10", () => {
    expect(flowSource).toContain("TOTAL_STEPS = 10");
  });

  it("has NAME_MOTIVATION step at index 8", () => {
    expect(flowSource).toContain("NAME_MOTIVATION: 8");
  });

  it("has FINISH step at index 9", () => {
    expect(flowSource).toContain("FINISH: 9");
  });

  it("includes name_motivation in STEP_NAMES", () => {
    expect(flowSource).toContain("name_motivation");
  });

  it("renders NameMotivation component", () => {
    expect(flowSource).toContain("<NameMotivation");
  });

  it("renders Finish component", () => {
    expect(flowSource).toContain("<Finish");
  });

  it("saves name trimmed or null in handleFinish", () => {
    expect(flowSource).toMatch(/draft\.userName\.trim\(\)\s*\|\|\s*null/);
  });

  it("tracks motivation in analytics", () => {
    expect(flowSource).toContain("motivation");
    expect(flowSource).toContain("onboarding_completed");
  });
});
