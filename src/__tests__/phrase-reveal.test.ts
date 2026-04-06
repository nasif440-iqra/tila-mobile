import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const componentPath = path.resolve(
  __dirname,
  "../design/components/PhraseReveal.tsx"
);
const componentSource = fs.readFileSync(componentPath, "utf-8");

describe("PhraseReveal component", () => {
  it("exists as a file", () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it("exports PhraseReveal function", () => {
    expect(componentSource).toContain("export function PhraseReveal");
  });

  it("uses Animated from react-native-reanimated", () => {
    expect(componentSource).toContain("react-native-reanimated");
  });

  it("accepts a phrases prop", () => {
    expect(componentSource).toContain("phrases");
  });

  it("uses design system tokens for typography", () => {
    expect(componentSource).toMatch(/fontFamilies|typography/);
  });

  it("uses useColors hook for theming", () => {
    expect(componentSource).toContain("useColors");
  });

  it("implements staggered fade-in animation", () => {
    expect(componentSource).toMatch(/delay|stagger/i);
    expect(componentSource).toMatch(/opacity|FadeIn/);
  });

  it("has at least 40 lines of code", () => {
    const lines = componentSource.split("\n").length;
    expect(lines).toBeGreaterThanOrEqual(40);
  });
});
