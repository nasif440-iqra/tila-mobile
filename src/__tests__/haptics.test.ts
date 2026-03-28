import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
}));

vi.mock("expo-haptics", () => ({
  impactAsync: mocks.impactAsync,
  notificationAsync: mocks.notificationAsync,
  selectionAsync: mocks.selectionAsync,
  ImpactFeedbackStyle: {
    Light: "Light",
    Medium: "Medium",
    Heavy: "Heavy",
  },
  NotificationFeedbackType: {
    Success: "Success",
    Warning: "Warning",
    Error: "Error",
  },
}));

import {
  hapticTap,
  hapticSuccess,
  hapticError,
  hapticMilestone,
  hapticSelection,
} from "../design/haptics";

describe("haptics utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports all 5 functions", () => {
    expect(typeof hapticTap).toBe("function");
    expect(typeof hapticSuccess).toBe("function");
    expect(typeof hapticError).toBe("function");
    expect(typeof hapticMilestone).toBe("function");
    expect(typeof hapticSelection).toBe("function");
  });

  it("hapticTap calls impactAsync with Light", () => {
    hapticTap();
    expect(mocks.impactAsync).toHaveBeenCalledWith("Light");
  });

  it("hapticSuccess calls notificationAsync with Success", () => {
    hapticSuccess();
    expect(mocks.notificationAsync).toHaveBeenCalledWith("Success");
  });

  it("hapticError calls notificationAsync with Error", () => {
    hapticError();
    expect(mocks.notificationAsync).toHaveBeenCalledWith("Error");
  });

  it("hapticMilestone calls impactAsync with Heavy", () => {
    hapticMilestone();
    expect(mocks.impactAsync).toHaveBeenCalledWith("Heavy");
  });

  it("hapticSelection calls selectionAsync", () => {
    hapticSelection();
    expect(mocks.selectionAsync).toHaveBeenCalled();
  });
});
