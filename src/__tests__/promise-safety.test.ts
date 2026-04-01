import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("CONT-02: Guarded async loaders — home screen", () => {
  const sourcePath = path.resolve(__dirname, "../../app/(tabs)/index.tsx");
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("does NOT contain bare .then(setGrantedLessonIds)", () => {
    expect(source).not.toMatch(
      /loadPremiumLessonGrants\(db\)\.then\(setGrantedLessonIds\)/
    );
  });

  it("contains cancelled flag for guarded async", () => {
    expect(source).toMatch(/let cancelled = false/);
  });

  it("contains catch block for error handling", () => {
    expect(source).toMatch(/catch\s*\(/);
  });

  it("falls back to empty array on failure", () => {
    expect(source).toMatch(/setGrantedLessonIds\(\[\]\)/);
  });

  it("has cleanup function that sets cancelled = true", () => {
    expect(source).toMatch(/cancelled = true/);
  });
});

describe("CONT-02: Guarded async loaders — review screen", () => {
  const sourcePath = path.resolve(__dirname, "../../app/lesson/review.tsx");
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("does NOT contain bare .then(setGrantedLessonIds)", () => {
    expect(source).not.toMatch(
      /loadPremiumLessonGrants\(db\)\.then\(setGrantedLessonIds\)/
    );
  });

  it("contains cancelled flag for guarded async", () => {
    expect(source).toMatch(/let cancelled = false/);
  });

  it("contains catch block for error handling", () => {
    expect(source).toMatch(/catch\s*\(/);
  });

  it("falls back to empty array on failure", () => {
    expect(source).toMatch(/setGrantedLessonIds\(\[\]\)/);
  });

  it("has cleanup function that sets cancelled = true", () => {
    expect(source).toMatch(/cancelled = true/);
  });
});

describe("CONT-02: Existing .catch() coverage — monetization provider", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../monetization/provider.tsx"
  );
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("has .catch() on Purchases.getCustomerInfo() chain", () => {
    expect(source).toMatch(/\.catch\(/);
  });
});

describe("CONT-02: Repo-wide audit — configureAudioSession", () => {
  const sourcePath = path.resolve(__dirname, "../../app/audio-test.tsx");
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("configureAudioSession call has .catch()", () => {
    expect(source).toMatch(/configureAudioSession\(\)\.catch/);
  });
});
