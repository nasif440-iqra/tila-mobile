import { describe, it, expect, vi, beforeEach } from "vitest";
import { Alert } from "react-native";
import Purchases from "react-native-purchases";
import { trackRestoreCompleted } from "../../src/monetization/analytics";

// ── Mock monetization analytics ──
vi.mock("../../src/monetization/analytics", () => ({
  trackRestoreCompleted: vi.fn(),
}));

// ── Restore handler logic (mirrors progress.tsx implementation) ──

async function handleRestorePurchases(refresh: () => Promise<void>) {
  try {
    const info = await Purchases.restorePurchases();
    const activeCount = Object.keys(info.entitlements.active).length;
    trackRestoreCompleted({ success: true, entitlements_restored: activeCount });
    await refresh();
    Alert.alert(
      activeCount > 0 ? "Purchases Restored" : "No Purchases Found",
      activeCount > 0
        ? "Your subscription has been restored."
        : "We couldn't find any previous purchases for this account.",
      [{ text: "OK" }]
    );
  } catch {
    trackRestoreCompleted({ success: false, entitlements_restored: 0 });
    Alert.alert(
      "Restore Failed",
      "Please check your internet connection and try again.",
      [{ text: "OK" }]
    );
  }
}

// ── Tests ──

describe("handleRestorePurchases", () => {
  const mockRefresh = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls Purchases.restorePurchases()", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockResolvedValue({
      entitlements: { active: { premium: {} } },
    });

    await handleRestorePurchases(mockRefresh);

    expect(Purchases.restorePurchases).toHaveBeenCalledOnce();
  });

  it("on success with active entitlements, calls trackRestoreCompleted with success: true and correct count", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockResolvedValue({
      entitlements: { active: { premium: {}, pro: {} } },
    });

    await handleRestorePurchases(mockRefresh);

    expect(trackRestoreCompleted).toHaveBeenCalledWith({
      success: true,
      entitlements_restored: 2,
    });
  });

  it("on success, calls refresh() to update subscription state", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockResolvedValue({
      entitlements: { active: { premium: {} } },
    });

    await handleRestorePurchases(mockRefresh);

    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("on success with active entitlements, shows Alert with 'Purchases Restored' title", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockResolvedValue({
      entitlements: { active: { premium: {} } },
    });

    await handleRestorePurchases(mockRefresh);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Purchases Restored",
      "Your subscription has been restored.",
      [{ text: "OK" }]
    );
  });

  it("on success with zero entitlements, shows Alert with 'No Purchases Found' title", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockResolvedValue({
      entitlements: { active: {} },
    });

    await handleRestorePurchases(mockRefresh);

    expect(Alert.alert).toHaveBeenCalledWith(
      "No Purchases Found",
      "We couldn't find any previous purchases for this account.",
      [{ text: "OK" }]
    );
  });

  it("on failure, calls trackRestoreCompleted with success: false and entitlements_restored: 0", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockRejectedValue(
      new Error("Network error")
    );

    await handleRestorePurchases(mockRefresh);

    expect(trackRestoreCompleted).toHaveBeenCalledWith({
      success: false,
      entitlements_restored: 0,
    });
  });

  it("on failure, shows Alert with 'Restore Failed' title", async () => {
    (Purchases.restorePurchases as any) = vi.fn().mockRejectedValue(
      new Error("Network error")
    );

    await handleRestorePurchases(mockRefresh);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Restore Failed",
      "Please check your internet connection and try again.",
      [{ text: "OK" }]
    );
  });
});
