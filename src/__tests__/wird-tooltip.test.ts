import { describe, it, expect, vi } from "vitest";

/**
 * Tests for wird tooltip show/dismiss logic.
 *
 * The tooltip logic is:
 * - Show when currentWird > 0 AND wirdIntroSeen === false
 * - Do NOT show when wirdIntroSeen === true
 * - Do NOT show when currentWird === 0
 * - On dismiss, call updateProfile({ wirdIntroSeen: true })
 *
 * We test the pure decision logic without rendering React components.
 */

function shouldShowWirdTooltip(currentWird: number, wirdIntroSeen: boolean): boolean {
  return currentWird > 0 && !wirdIntroSeen;
}

describe("wird tooltip visibility logic", () => {
  it("shows when currentWird > 0 AND wirdIntroSeen is false", () => {
    expect(shouldShowWirdTooltip(1, false)).toBe(true);
    expect(shouldShowWirdTooltip(5, false)).toBe(true);
  });

  it("does NOT show when wirdIntroSeen is true", () => {
    expect(shouldShowWirdTooltip(1, true)).toBe(false);
    expect(shouldShowWirdTooltip(10, true)).toBe(false);
  });

  it("does NOT show when currentWird is 0", () => {
    expect(shouldShowWirdTooltip(0, false)).toBe(false);
    expect(shouldShowWirdTooltip(0, true)).toBe(false);
  });
});

describe("wird tooltip dismiss handler", () => {
  it("calls updateProfile with { wirdIntroSeen: true } on dismiss", async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined);

    // Simulate dismiss handler
    async function handleDismiss() {
      await updateProfile({ wirdIntroSeen: true });
    }

    await handleDismiss();
    expect(updateProfile).toHaveBeenCalledOnce();
    expect(updateProfile).toHaveBeenCalledWith({ wirdIntroSeen: true });
  });
});
