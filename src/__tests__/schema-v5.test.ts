import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION, CREATE_TABLES } from "../db/schema";

describe("Schema v5: premium_lesson_grants", () => {
  it("schema version is at least 5", () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(5);
  });

  it("CREATE_TABLES includes premium_lesson_grants", () => {
    expect(CREATE_TABLES).toContain("premium_lesson_grants");
    expect(CREATE_TABLES).toContain("lesson_id INTEGER NOT NULL PRIMARY KEY");
    expect(CREATE_TABLES).toContain("granted_at TEXT NOT NULL");
  });
});
