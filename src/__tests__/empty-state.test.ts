import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("STATE-02: EmptyState component", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../components/feedback/EmptyState.tsx"
  );

  const source = fs.readFileSync(sourcePath, "utf-8");

  it("accepts title prop", () => {
    expect(source).toMatch(/title:\s*string/);
  });

  it("accepts subtitle prop", () => {
    expect(source).toMatch(/subtitle:\s*string/);
  });

  it("has optional actionLabel and onAction props", () => {
    expect(source).toMatch(/actionLabel\?:\s*string/);
    expect(source).toMatch(/onAction\?:\s*\(\)\s*=>\s*void/);
  });

  it("uses typography from design tokens", () => {
    expect(source).toMatch(/typography/);
  });
});
