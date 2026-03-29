import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("CEL-04: Phase completion milestone celebration", () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../../app/phase-complete.tsx"),
    "utf-8"
  );

  it("imports WarmGlow component", () => {
    expect(source).toMatch(/import.*WarmGlow.*from/);
  });

  it("renders WarmGlow with animated prop and size 200", () => {
    expect(source).toMatch(/WarmGlow/);
    expect(source).toMatch(/size=\{200\}/);
    expect(source).toMatch(/animated/);
  });

  it("calls hapticMilestone on mount", () => {
    expect(source).toMatch(/import.*hapticMilestone.*from/);
    expect(source).toMatch(/hapticMilestone\(\)/);
  });

  it("uses springs.gentle for scale animation", () => {
    expect(source).toMatch(/springs\.gentle/);
  });

  it("has scale animation on Arabic centerpiece", () => {
    expect(source).toMatch(/arabicScale/);
    expect(source).toMatch(/withSpring/);
  });
});
