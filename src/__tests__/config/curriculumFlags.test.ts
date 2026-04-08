import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveCurriculumVersion, resetCurriculumVersionCache } from "@/src/config/curriculumFlags";

// Mock DB
function mockDb(profileResult: any = null, shouldThrow = false) {
  return {
    getFirstAsync: vi.fn().mockImplementation(() => {
      if (shouldThrow) throw new Error("no such column");
      return Promise.resolve(profileResult);
    }),
  } as any;
}

describe("resolveCurriculumVersion", () => {
  beforeEach(() => {
    resetCurriculumVersionCache();
    // Clear env override
    delete process.env.EXPO_PUBLIC_CURRICULUM_OVERRIDE;
  });

  it("returns v1 as production default", async () => {
    const db = mockDb(null);
    const result = await resolveCurriculumVersion(db);
    expect(result).toBe("v1");
  });

  it("returns v2 when profile has curriculum_version = v2", async () => {
    const db = mockDb({ curriculum_version: "v2" });
    const result = await resolveCurriculumVersion(db);
    expect(result).toBe("v2");
  });

  it("returns v1 when profile has null curriculum_version", async () => {
    const db = mockDb({ curriculum_version: null });
    const result = await resolveCurriculumVersion(db);
    expect(result).toBe("v1");
  });

  it("returns v1 when column query throws (column doesn't exist)", async () => {
    const db = mockDb(null, true);
    const result = await resolveCurriculumVersion(db);
    expect(result).toBe("v1");
  });

  it("caches resolved version", async () => {
    const db = mockDb({ curriculum_version: "v2" });
    await resolveCurriculumVersion(db);
    // Second call should not hit DB
    const db2 = mockDb(null);
    const result = await resolveCurriculumVersion(db2);
    expect(result).toBe("v2"); // cached from first call
    expect(db2.getFirstAsync).not.toHaveBeenCalled();
  });
});
