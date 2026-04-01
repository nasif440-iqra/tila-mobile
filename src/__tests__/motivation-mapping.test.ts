import { describe, it, expect } from "vitest";
import { MOTIVATION_SUBTITLES } from "../utils/greetingHelpers";

// ── Motivation mapping contract ──
// These tests document the required mapping from display labels
// to stored enum values. The schema CHECK constraint must match
// the values in MOTIVATION_MAP exactly.

const MOTIVATION_MAP: Record<string, string> = {
  "I want to read the Quran confidently": "read_quran",
  "I want to improve my prayer and understanding": "pray_confidently",
  "I want to build a daily Quran habit": "connect_heritage",
  "I want to reconnect properly": "personal_growth",
  "I want to help my child or family learn": "teach_children",
};

const VALID_SCHEMA_VALUES = [
  "read_quran",
  "pray_confidently",
  "connect_heritage",
  "teach_children",
  "personal_growth",
];

describe("MOTIVATION_MAP", () => {
  it("maps every display label to a distinct stored value", () => {
    const values = Object.values(MOTIVATION_MAP);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it("maps 'I want to read the Quran confidently' to 'read_quran'", () => {
    expect(MOTIVATION_MAP["I want to read the Quran confidently"]).toBe("read_quran");
  });

  it("maps 'I want to improve my prayer and understanding' to 'pray_confidently'", () => {
    expect(MOTIVATION_MAP["I want to improve my prayer and understanding"]).toBe("pray_confidently");
  });

  it("maps 'I want to build a daily Quran habit' to 'connect_heritage'", () => {
    expect(MOTIVATION_MAP["I want to build a daily Quran habit"]).toBe("connect_heritage");
  });

  it("maps 'I want to reconnect properly' to 'personal_growth'", () => {
    expect(MOTIVATION_MAP["I want to reconnect properly"]).toBe("personal_growth");
  });

  it("maps 'I want to help my child or family learn' to 'teach_children'", () => {
    expect(MOTIVATION_MAP["I want to help my child or family learn"]).toBe("teach_children");
  });

  it("returns undefined (null fallback) for an unknown option", () => {
    expect(MOTIVATION_MAP["some unknown option"]).toBeUndefined();
  });

  it("every mapped value is accepted by the schema CHECK constraint", () => {
    for (const value of Object.values(MOTIVATION_MAP)) {
      expect(VALID_SCHEMA_VALUES).toContain(value);
    }
  });

  it("schema CHECK values exactly match all possible mapped values", () => {
    const mappedValues = new Set(Object.values(MOTIVATION_MAP));
    const schemaValues = new Set(VALID_SCHEMA_VALUES);
    expect(mappedValues).toEqual(schemaValues);
  });
});

// ── D-09: Motivation subtitle strings ──
// Verifies that every stored motivation value has a corresponding
// home-screen subtitle string in MOTIVATION_SUBTITLES.

describe("MOTIVATION_SUBTITLES (D-09)", () => {
  it("every stored motivation value has a subtitle string", () => {
    for (const value of VALID_SCHEMA_VALUES) {
      expect(MOTIVATION_SUBTITLES[value]).toBeDefined();
      expect(typeof MOTIVATION_SUBTITLES[value]).toBe("string");
    }
  });

  it("read_quran subtitle matches D-09 spec", () => {
    expect(MOTIVATION_SUBTITLES["read_quran"]).toBe("Reading toward the Quran");
  });

  it("pray_confidently subtitle matches D-09 spec", () => {
    expect(MOTIVATION_SUBTITLES["pray_confidently"]).toBe("Building toward confident salah");
  });

  it("connect_heritage subtitle matches D-09 spec", () => {
    expect(MOTIVATION_SUBTITLES["connect_heritage"]).toBe("Connecting to your heritage");
  });

  it("teach_children subtitle matches D-09 spec", () => {
    expect(MOTIVATION_SUBTITLES["teach_children"]).toBe("Learning to teach your children");
  });

  it("personal_growth subtitle matches D-09 spec", () => {
    expect(MOTIVATION_SUBTITLES["personal_growth"]).toBe("Growing in your faith");
  });
});
