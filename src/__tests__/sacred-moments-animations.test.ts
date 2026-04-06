import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const animationsPath = path.resolve(
  __dirname,
  "../design/animations.ts"
);
const animationsSource = fs.readFileSync(animationsPath, "utf-8");

describe("Sacred moments animation tokens", () => {
  it("has a gentle spring preset", () => {
    expect(animationsSource).toContain("gentle");
  });

  it("gentle spring has higher damping than bouncy for settle effect", () => {
    const gentleMatch = animationsSource.match(
      /gentle:\s*\{[^}]*damping:\s*(\d+)/
    );
    const bouncyMatch = animationsSource.match(
      /bouncy:\s*\{[^}]*damping:\s*(\d+)/
    );
    expect(gentleMatch).not.toBeNull();
    expect(bouncyMatch).not.toBeNull();
    const gentleDamping = parseInt(gentleMatch![1], 10);
    const bouncyDamping = parseInt(bouncyMatch![1], 10);
    expect(gentleDamping).toBeGreaterThan(bouncyDamping);
  });

  it("has durations for content reveal timing", () => {
    expect(animationsSource).toContain("normal");
    expect(animationsSource).toContain("slow");
  });
});
