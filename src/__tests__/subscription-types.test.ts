import { describe, it, expect } from "vitest";

describe("Subscription module exports", () => {
  it("provider exports SubscriptionProvider and useSubscription", async () => {
    const provider = await import("../monetization/provider");
    expect(typeof provider.SubscriptionProvider).toBe("function");

    const hooks = await import("../monetization/hooks");
    expect(typeof hooks.useSubscription).toBe("function");
  });

  it("paywall exports presentPaywall", async () => {
    const paywall = await import("../monetization/paywall");
    expect(typeof paywall.presentPaywall).toBe("function");
  });
});
