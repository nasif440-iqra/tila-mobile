import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStore = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(async (k: string, v: string) => {
      mockStore.set(k, v);
    }),
    getItem: vi.fn(async (k: string) => mockStore.get(k) ?? null),
    removeItem: vi.fn(async (k: string) => {
      mockStore.delete(k);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) mockStore.delete(k);
    }),
    getAllKeys: vi.fn(async () => Array.from(mockStore.keys())),
  },
}));

import { asyncStorageCompletionStore } from "../../curriculum/runtime/completion-store";

describe("asyncStorageCompletionStore", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it("getCompletion returns false when key absent", async () => {
    expect(await asyncStorageCompletionStore.getCompletion("lesson-01")).toBe(false);
  });

  it("markCompleted + getCompletion round-trips under namespaced key", async () => {
    await asyncStorageCompletionStore.markCompleted("lesson-01");
    expect(mockStore.get("tila.lesson-completion.lesson-01")).toBe("true");
    expect(await asyncStorageCompletionStore.getCompletion("lesson-01")).toBe(true);
  });

  it("getCompletion returns false for unrelated stored values", async () => {
    mockStore.set("tila.lesson-completion.lesson-01", "not-boolean-like");
    expect(await asyncStorageCompletionStore.getCompletion("lesson-01")).toBe(false);
  });

  it("clearAll removes only completion-namespaced keys", async () => {
    mockStore.set("tila.lesson-completion.lesson-01", "true");
    mockStore.set("tila.lesson-completion.lesson-02", "true");
    mockStore.set("some-other-key", "unrelated");
    await asyncStorageCompletionStore.clearAll();
    expect(mockStore.has("tila.lesson-completion.lesson-01")).toBe(false);
    expect(mockStore.has("tila.lesson-completion.lesson-02")).toBe(false);
    expect(mockStore.get("some-other-key")).toBe("unrelated");
  });
});
