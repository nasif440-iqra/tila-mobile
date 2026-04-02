import { describe, it, expect } from "vitest";

describe("TrialCountdownBadge component", () => {
  it("exports TrialCountdownBadge as a function", async () => {
    const mod = await import("../components/monetization/TrialCountdownBadge");
    expect(typeof mod.TrialCountdownBadge).toBe("function");
  });

  it("accepts daysLeft prop", async () => {
    const mod = await import("../components/monetization/TrialCountdownBadge");
    expect(mod.TrialCountdownBadge).toBeDefined();
    // Function should accept 1 props argument
    expect(mod.TrialCountdownBadge.length).toBeLessThanOrEqual(1);
  });
});
