import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Read barrel export to verify AtmosphereBackground is exported
const barrelPath = path.resolve(__dirname, "../design/atmosphere/index.ts");
const barrelSource = fs.readFileSync(barrelPath, "utf-8");

// Read AtmosphereBackground source to verify presets
const componentPath = path.resolve(
  __dirname,
  "../design/atmosphere/AtmosphereBackground.tsx"
);
const componentSource = fs.readFileSync(componentPath, "utf-8");

describe("AtmosphereBackground", () => {
  it("is exported from atmosphere barrel", () => {
    expect(barrelSource).toContain("AtmosphereBackground");
  });

  it("exports PRESETS from atmosphere barrel", () => {
    expect(barrelSource).toContain("PRESETS");
  });

  it("exports AtmospherePreset type from atmosphere barrel", () => {
    expect(barrelSource).toContain("AtmospherePreset");
  });
});

describe("AtmosphereBackground presets", () => {
  const presetNames = [
    "home",
    "quiz",
    "sacred",
    "celebration",
    "loading",
    "onboarding",
  ];

  for (const name of presetNames) {
    it(`has preset '${name}'`, () => {
      expect(componentSource).toContain(`${name}:`);
    });
  }

  it("quiz preset has floatingLetters === false", () => {
    // Extract the quiz preset block and verify floatingLetters is false
    const quizMatch = componentSource.match(
      /quiz:\s*\{[\s\S]*?floatingLetters:\s*(true|false)/
    );
    expect(quizMatch).not.toBeNull();
    expect(quizMatch![1]).toBe("false");
  });

  it("loading preset has floatingLetters === false", () => {
    const loadingMatch = componentSource.match(
      /loading:\s*\{[\s\S]*?floatingLetters:\s*(true|false)/
    );
    expect(loadingMatch).not.toBeNull();
    expect(loadingMatch![1]).toBe("false");
  });

  it("sacred preset has floatingLetters === true", () => {
    const sacredMatch = componentSource.match(
      /sacred:\s*\{[\s\S]*?floatingLetters:\s*(true|false)/
    );
    expect(sacredMatch).not.toBeNull();
    expect(sacredMatch![1]).toBe("true");
  });

  it("home preset has floatingLetters === true", () => {
    const homeMatch = componentSource.match(
      /home:\s*\{[\s\S]*?floatingLetters:\s*(true|false)/
    );
    expect(homeMatch).not.toBeNull();
    expect(homeMatch![1]).toBe("true");
  });

  it("each preset has required keys", () => {
    const requiredKeys = [
      "linearColors",
      "glowColor",
      "glowOpacity",
      "glowRadius",
      "floatingLetters",
    ];
    for (const key of requiredKeys) {
      // Each key should appear at least 6 times (once per preset)
      const matches = componentSource.match(new RegExp(`${key}:`, "g"));
      expect(
        matches,
        `${key} should appear in presets`
      ).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("uses LinearGradient from expo-linear-gradient", () => {
    expect(componentSource).toContain("LinearGradient");
    expect(componentSource).toContain("expo-linear-gradient");
  });
});
