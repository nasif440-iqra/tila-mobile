import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const source = readFileSync(
  resolve(__dirname, "../components/progress/StatsRow.tsx"),
  "utf-8",
);

describe("StatsRow typography polish (PROG-04)", () => {
  it("uses typography.statNumber for stat values", () => {
    expect(source).toMatch(/typography\.statNumber/);
  });

  it("imports typography from design tokens", () => {
    expect(source).toMatch(/typography.*from.*design\/tokens/s);
  });

  it("uses spacing from design tokens", () => {
    expect(source).toMatch(/spacing/);
  });

  it("uses Card component for stat cards", () => {
    expect(source).toMatch(/Card/);
  });
});
