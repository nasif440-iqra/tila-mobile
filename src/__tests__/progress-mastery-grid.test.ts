import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PROG-02: LetterMasteryGrid 5-state mastery visualization", () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../components/progress/LetterMasteryGrid.tsx"),
    "utf-8"
  );

  it("contains all 5 mastery state case branches", () => {
    expect(source).toMatch(/not_started/);
    expect(source).toMatch(/introduced/);
    expect(source).toMatch(/unstable/);
    expect(source).toMatch(/accurate/);
    expect(source).toMatch(/retained/);
  });

  it("retained state has different visual treatment from accurate state", () => {
    // Retained must reference at least one distinguishing property not in accurate:
    // shadows, cardLifted, primaryDark background, or elevation
    const retainedBlock = source.match(
      /case\s+["']retained["'][\s\S]*?(?=case\s+["']|default|$)/
    );
    expect(retainedBlock).not.toBeNull();
    const retainedStr = retainedBlock![0];
    // Must have at least one differentiator from accurate
    const hasShadow = /shadows|cardLifted|elevation/.test(retainedStr);
    const hasDarkBg = /primaryDark/.test(retainedStr);
    expect(hasShadow || hasDarkBg).toBe(true);
  });

  it("uses color tokens from design/tokens", () => {
    expect(source).toMatch(/shadows/);
    expect(source).toMatch(/tokens|design\/tokens/);
  });

  it("has border differentiation in mastery styling", () => {
    expect(source).toMatch(/border/);
  });

  it("retained and accurate return different style objects", () => {
    // Extract the return objects for retained and accurate
    const retainedReturn = source.match(
      /case\s+["']retained["'][\s\S]*?return\s*\{([\s\S]*?)\}/
    );
    const accurateReturn = source.match(
      /case\s+["']accurate["'][\s\S]*?return\s*\{([\s\S]*?)\}/
    );
    expect(retainedReturn).not.toBeNull();
    expect(accurateReturn).not.toBeNull();
    // The two return blocks must NOT be identical
    expect(retainedReturn![1].trim()).not.toBe(accurateReturn![1].trim());
  });
});
