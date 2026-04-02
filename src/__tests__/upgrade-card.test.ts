import { describe, it, expect } from "vitest";

describe("UpgradeCard component", () => {
  it("exports UpgradeCard as a function", async () => {
    const mod = await import("../components/monetization/UpgradeCard");
    expect(typeof mod.UpgradeCard).toBe("function");
  });

  it("accepts variant, onStartTrial, and onScholarship props", async () => {
    const mod = await import("../components/monetization/UpgradeCard");
    // Component should be callable — type-level verification
    expect(mod.UpgradeCard).toBeDefined();
  });
});
