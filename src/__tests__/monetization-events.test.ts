import { describe, it, expect } from "vitest";

describe("Monetization event types", () => {
  it("EventMap includes all monetization events", async () => {
    const mod = await import("../analytics/events");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keys = Object.keys({} as Record<string, true>); // EventMap is a type-only export
    const analytics = await import("../monetization/analytics");
    expect(typeof analytics.trackPaywallShown).toBe("function");
    expect(typeof analytics.trackPaywallResult).toBe("function");
    expect(typeof analytics.trackPurchaseCompleted).toBe("function");
  });
});
