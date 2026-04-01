import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ── Bug 5 Regression: Migration v2 must not swallow DB errors ──

const clientSrc = fs.readFileSync(
  path.resolve(__dirname, "../db/client.ts"),
  "utf-8"
);

// Extract the v2 migration block for targeted assertions
function extractV2Block(src: string): string {
  const v2Start = src.indexOf("currentVersion < 2");
  if (v2Start === -1) return "";
  // Find the matching closing brace by counting braces from the if statement
  let braceCount = 0;
  let started = false;
  let blockStart = v2Start;
  for (let i = v2Start; i < src.length; i++) {
    if (src[i] === "{") {
      if (!started) blockStart = i;
      started = true;
      braceCount++;
    }
    if (src[i] === "}") {
      braceCount--;
      if (started && braceCount === 0) {
        return src.slice(blockStart, i + 1);
      }
    }
  }
  return src.slice(blockStart);
}

const v2Block = extractV2Block(clientSrc);

describe("Migration v2 — Bug 5 regression", () => {
  it("uses PRAGMA table_info instead of blanket try/catch", () => {
    // Regression: Bug 5 — Migration v2 must check columns before ALTER.
    expect(v2Block).toContain("PRAGMA table_info");
  });

  it("does not swallow errors with blanket catch", () => {
    // Regression: Bug 5 — Real DB errors must propagate, not be silently caught.
    expect(v2Block).not.toMatch(/try\s*\{/);
    expect(v2Block).not.toMatch(/catch\s*[\({]/);
  });

  it("checks each column individually before ALTER", () => {
    // Regression: Bug 5 — Each column must be checked individually.
    expect(v2Block).toMatch(/\.some\(.*wird_intro_seen/s);
    expect(v2Block).toMatch(/\.some\(.*post_lesson_onboard_seen/s);
    expect(v2Block).toMatch(/\.some\(.*return_hadith_last_shown/s);
  });
});
