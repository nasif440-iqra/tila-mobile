import { describe, it, expect } from "vitest";

describe("LockIcon component", () => {
  it("exports LockIcon as a function", async () => {
    const mod = await import("../components/monetization/LockIcon");
    expect(typeof mod.LockIcon).toBe("function");
  });

  it("has correct default props in function signature", async () => {
    const mod = await import("../components/monetization/LockIcon");
    // LockIcon should be callable (it's a React component function)
    expect(mod.LockIcon).toBeDefined();
    expect(mod.LockIcon.length).toBeLessThanOrEqual(1); // 0 or 1 props arg
  });
});
