import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("STATE-01: AppLoadingScreen branded loading", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../components/feedback/AppLoadingScreen.tsx"
  );

  const source = fs.readFileSync(sourcePath, "utf-8");

  it("imports BrandedLogo from onboarding", () => {
    expect(source).toMatch(/import.*BrandedLogo.*from.*onboarding/);
  });

  it("imports WarmGlow from onboarding", () => {
    expect(source).toMatch(/import.*WarmGlow.*from.*onboarding/);
  });

  it("calls useColors for themed background", () => {
    expect(source).toMatch(/useColors\(\)/);
  });

  it("has flex:1 container for full-screen layout", () => {
    expect(source).toMatch(/flex:\s*1/);
  });

  it("has encouraging tagline text", () => {
    expect(source).toMatch(/Preparing your lesson/i);
  });
});
