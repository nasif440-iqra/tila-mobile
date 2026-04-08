import { describe, it, expect } from "vitest";
import { V2_SCHEMA_VERSION, V2_CREATE_TABLES } from "@/src/db/schema-v2";

describe("schema-v2", () => {
  it("exports a schema version", () => {
    expect(V2_SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it("creates v2_lesson_attempts table with profile_id", () => {
    expect(V2_CREATE_TABLES).toContain("v2_lesson_attempts");
    expect(V2_CREATE_TABLES).toContain("profile_id TEXT NOT NULL");
  });

  it("v2_lesson_attempts has LessonResult columns", () => {
    expect(V2_CREATE_TABLES).toContain("bucket_scores TEXT");
    expect(V2_CREATE_TABLES).toContain("total_items INTEGER NOT NULL");
    expect(V2_CREATE_TABLES).toContain("correct_items INTEGER NOT NULL");
    expect(V2_CREATE_TABLES).toContain("decode_items INTEGER NOT NULL");
    expect(V2_CREATE_TABLES).toContain("decode_correct INTEGER NOT NULL");
  });

  it("creates v2_entity_mastery table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_entity_mastery");
    expect(V2_CREATE_TABLES).toContain("entity_id TEXT");
  });

  it("creates v2_question_attempts table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_question_attempts");
    expect(V2_CREATE_TABLES).toContain("exercise_type TEXT NOT NULL");
    expect(V2_CREATE_TABLES).toContain("answer_mode TEXT NOT NULL");
  });

  it("creates v2_phase_completion table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_phase_completion");
  });

  it("creates v2_review_sessions table", () => {
    expect(V2_CREATE_TABLES).toContain("v2_review_sessions");
  });

  it("entity mastery has composite primary key", () => {
    expect(V2_CREATE_TABLES).toContain("PRIMARY KEY (entity_id, profile_id)");
  });
});
