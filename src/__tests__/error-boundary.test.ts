import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("STATE-03: ErrorFallback component", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../components/feedback/ErrorFallback.tsx"
  );

  const source = fs.readFileSync(sourcePath, "utf-8");

  it("accepts onRetry prop", () => {
    expect(source).toMatch(/onRetry/);
  });

  it("contains retry button text", () => {
    expect(source).toMatch(/Try Again/);
  });

  it("uses useColors for branded appearance", () => {
    expect(source).toMatch(/useColors\(\)/);
  });

  it("has encouraging copy about progress being saved", () => {
    expect(source).toMatch(/progress is saved/i);
  });
});
