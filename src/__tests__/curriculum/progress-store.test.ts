import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { progressStore } from "../../curriculum/runtime/progress-store";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("progressStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AsyncStorage.getItem as any).mockResolvedValue(null);
  });

  it("returns empty progress when nothing stored", async () => {
    const state = await progressStore.getProgress();
    expect(state).toEqual({
      completedLessonIds: [],
      lastReachedLessonId: null,
    });
  });

  it("records a completion as a fresh entry", async () => {
    await progressStore.markCompleted("lesson-01");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "tila.progress",
      JSON.stringify({
        completedLessonIds: ["lesson-01"],
        lastReachedLessonId: null,
      })
    );
  });

  it("does not duplicate a completion", async () => {
    (AsyncStorage.getItem as any).mockResolvedValue(
      JSON.stringify({
        completedLessonIds: ["lesson-01"],
        lastReachedLessonId: null,
      })
    );
    await progressStore.markCompleted("lesson-01");
    const setCalls = (AsyncStorage.setItem as any).mock.calls;
    expect(setCalls).toHaveLength(0);
  });

  it("sets last reached lesson", async () => {
    await progressStore.setLastReached("lesson-02");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "tila.progress",
      JSON.stringify({
        completedLessonIds: [],
        lastReachedLessonId: "lesson-02",
      })
    );
  });

  it("treats lesson-01 as always unlocked", async () => {
    expect(await progressStore.isUnlocked("lesson-01")).toBe(true);
  });

  it("unlocks lesson-N only after lesson-(N-1) is completed", async () => {
    (AsyncStorage.getItem as any).mockResolvedValue(
      JSON.stringify({
        completedLessonIds: ["lesson-01"],
        lastReachedLessonId: null,
      })
    );
    expect(await progressStore.isUnlocked("lesson-02")).toBe(true);
    expect(await progressStore.isUnlocked("lesson-03")).toBe(false);
  });

  it("returns false from isUnlocked for unknown lesson IDs", async () => {
    expect(await progressStore.isUnlocked("lesson-99")).toBe(false);
    expect(await progressStore.isUnlocked("")).toBe(false);
  });

  it("returns safe default on read error", async () => {
    (AsyncStorage.getItem as any).mockRejectedValue(new Error("boom"));
    const state = await progressStore.getProgress();
    expect(state).toEqual({
      completedLessonIds: [],
      lastReachedLessonId: null,
    });
  });

  it("swallows write errors without throwing", async () => {
    (AsyncStorage.setItem as any).mockRejectedValue(new Error("boom"));
    await expect(progressStore.markCompleted("lesson-01")).resolves.toBeUndefined();
  });
});
