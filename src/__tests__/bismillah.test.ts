import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const componentPath = path.resolve(
  __dirname,
  "../components/onboarding/steps/BismillahMoment.tsx"
);
const componentSource = fs.readFileSync(componentPath, "utf-8");

describe("BismillahMoment", () => {
  it("uses PhraseReveal component", () => {
    expect(componentSource).toContain("PhraseReveal");
  });

  it("defines BISMILLAH_WORDS with 4 words", () => {
    expect(componentSource).toContain("BISMILLAH_WORDS");
    // Count PhraseWord entries (arabic fields)
    const arabicMatches = componentSource.match(/arabic:\s*"/g);
    expect(arabicMatches).not.toBeNull();
    expect(arabicMatches!.length).toBe(4);
  });

  it("uses horizontal layout", () => {
    expect(componentSource).toContain('layout="horizontal"');
  });

  it("has Continue CTA button (no auto-advance)", () => {
    expect(componentSource).toContain("Continue");
    expect(componentSource).toContain("<Button");
    // Should NOT have auto-advance timer
    expect(componentSource).not.toContain("BISMILLAH_HOLD");
    expect(componentSource).not.toMatch(/setTimeout\s*\(\s*onNext/);
  });

  it("shows CTA only after reveal completes", () => {
    expect(componentSource).toContain("revealComplete");
    expect(componentSource).toContain("onComplete");
  });

  it("has meaning field on each word", () => {
    expect(componentSource).toContain("meaning:");
    const meaningMatches = componentSource.match(/meaning:\s*"/g);
    expect(meaningMatches).not.toBeNull();
    expect(meaningMatches!.length).toBe(4);
  });

  it("imports PhraseWord type", () => {
    expect(componentSource).toContain("PhraseWord");
  });
});
