import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION, CREATE_TABLES } from "../db/schema";
import type { OnboardingDraft } from "../types/onboarding";

describe("Schema v6: name column in user_profile", () => {
  it("schema version is 7", () => {
    expect(SCHEMA_VERSION).toBe(7);
  });

  it("CREATE_TABLES includes name TEXT in user_profile", () => {
    // Extract the user_profile CREATE TABLE block (use [\s\S]+ since table has nested parens in CHECK constraints)
    const userProfileMatch = CREATE_TABLES.match(
      /CREATE TABLE IF NOT EXISTS user_profile \([\s\S]+?\n\);/
    );
    expect(userProfileMatch).not.toBeNull();
    expect(userProfileMatch![0]).toContain("name TEXT");
  });

  it("OnboardingDraft includes userName and motivation fields", () => {
    // Type-level check: assignment test ensures the interface has the expected shape
    const draft: OnboardingDraft = {
      startingPoint: null,
      userName: "test",
      motivation: "read_quran",
    };
    expect(draft.userName).toBe("test");
    expect(draft.motivation).toBe("read_quran");
  });

  it("OnboardingDraft motivation accepts all valid values", () => {
    const validMotivations: OnboardingDraft["motivation"][] = [
      "read_quran",
      "pray_confidently",
      "connect_heritage",
      "teach_children",
      "personal_growth",
      null,
    ];
    expect(validMotivations).toHaveLength(6);
  });
});
