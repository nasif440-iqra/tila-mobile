import { describe, it, expect } from "vitest";
import { resolveLessonId } from "../../curriculum/runtime/url-resolver";

describe("resolveLessonId", () => {
  it("maps '1' → 'lesson-01'", () => {
    expect(resolveLessonId("1")).toBe("lesson-01");
  });

  it("maps '12' → 'lesson-12'", () => {
    expect(resolveLessonId("12")).toBe("lesson-12");
  });

  it("maps '132' → 'lesson-132'", () => {
    expect(resolveLessonId("132")).toBe("lesson-132");
  });

  it("unwraps string array (Expo Router catch-all quirk)", () => {
    expect(resolveLessonId(["3"])).toBe("lesson-03");
  });

  it("returns null for undefined", () => {
    expect(resolveLessonId(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolveLessonId("")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(resolveLessonId("abc")).toBeNull();
  });

  it("returns null for zero or negative", () => {
    expect(resolveLessonId("0")).toBeNull();
    expect(resolveLessonId("-1")).toBeNull();
  });
});
