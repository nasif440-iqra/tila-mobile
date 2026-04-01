import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ── Bug 1 Regression: DatabaseProvider must never hang on init failure ──

const providerSrc = fs.readFileSync(
  path.resolve(__dirname, "../db/provider.tsx"),
  "utf-8"
);

describe("DatabaseProvider — Bug 1 regression", () => {
  it("handles getDatabase rejection (not hang)", () => {
    // Regression: Bug 1 — DB init must handle rejection, not hang.
    expect(providerSrc).toMatch(/\.catch\s*\(/);
    expect(providerSrc).toMatch(/getDatabase\(\)/);
  });

  it("has a 15-second timeout", () => {
    // Regression: Bug 1 — DB init must timeout, not hang indefinitely.
    expect(providerSrc).toMatch(/15[_,]?000/);
    expect(providerSrc).toMatch(/setTimeout/);
  });

  it("guards retry against stale promise resolution", () => {
    // Regression: Bug 1 — Retry must guard against stale promise resolution.
    expect(providerSrc).toMatch(/attemptRef/);
    expect(providerSrc).toMatch(/thisAttempt/);
  });

  it("renders ErrorFallback on error state", () => {
    // Regression: Bug 1 — Error state must show recovery UI.
    expect(providerSrc).toMatch(/import.*ErrorFallback.*from/);
    expect(providerSrc).toMatch(/<ErrorFallback/);
  });

  it("uses three-state machine (loading|error|ready)", () => {
    // Regression: Bug 1 — Provider must use three-state machine, not null check.
    expect(providerSrc).toMatch(/status.*"loading"/);
    expect(providerSrc).toMatch(/status.*"error"/);
    expect(providerSrc).toMatch(/status.*"ready"/);
  });
});
