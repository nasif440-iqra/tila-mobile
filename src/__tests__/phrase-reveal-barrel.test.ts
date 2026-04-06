import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const barrelPath = path.resolve(
  __dirname,
  "../design/components/index.ts"
);
const barrelSource = fs.readFileSync(barrelPath, "utf-8");

describe("PhraseReveal barrel export", () => {
  it("is exported from design components barrel", () => {
    expect(barrelSource).toContain("PhraseReveal");
  });

  it("exports from PhraseReveal file", () => {
    expect(barrelSource).toContain("./PhraseReveal");
  });

  it("exports PhraseWord type", () => {
    expect(barrelSource).toContain("PhraseWord");
  });

  it("exports PhraseRevealProps type", () => {
    expect(barrelSource).toContain("PhraseRevealProps");
  });
});
