import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("CONV-09: Support contact link on Progress tab", () => {
  const sourcePath = path.resolve(__dirname, "../../app/(tabs)/progress.tsx");
  const source = fs.readFileSync(sourcePath, "utf-8");

  it("renders a 'Contact Support' text element", () => {
    expect(source).toContain("Contact Support");
  });

  it("calls Linking.openURL with mailto:nasif.c7@gmail.com", () => {
    expect(source).toMatch(/Linking\.openURL\(.*mailto:nasif\.c7@gmail\.com.*\)/);
  });

  it("uses the GitHub Pages privacy policy URL", () => {
    expect(source).toContain("https://tila-app.github.io/privacy/");
  });
});
