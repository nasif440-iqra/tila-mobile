// ── LESSON TEMPLATE ──
// Copy this block, fill in the values, and add to LESSONS_V2 array in lessons.ts
// Run `npm run validate-v2` after adding to catch errors.

{
  id: 0,                              // Unique lesson number (1-62, matches curriculum blueprint)
  phase: 1,                           // Phase 1-6
  module: "1.1",                      // Module within phase (e.g., "1.1", "2.3")
  moduleTitle: "",                    // Only set on FIRST lesson of a module (e.g., "First Real Decoding Wins")
  title: "",                          // Lesson title from curriculum blueprint
  description: "",                    // One-line description of what this lesson teaches

  // ── What this lesson teaches and reviews ──
  // Entity IDs use prefix convention:
  //   letter:N     — Arabic letter by ID (1=Alif, 2=Ba, ... 28=Ya)
  //   combo:X-Y    — Letter+harakat (e.g., combo:ba-fatha, combo:ma-kasra)
  //   chunk:X      — Sub-word unit (must exist in chunks.ts)
  //   word:X       — Full word (must exist in words.ts)
  //   pattern:X    — Phonological pattern (must exist in patterns.ts)
  //   rule:X       — Reading rule (must exist in rules.ts)
  //   orthography:X — Quran-script convention (must exist in orthography.ts)
  teachEntityIds: [],                 // NEW entities introduced in this lesson
  reviewEntityIds: [],                // Previously taught entities to review

  // ── Exercise plan (ordered sequence) ──
  // Each step generates N exercise items of the given type.
  // Available types: tap, hear, choose, build, read, fix, check
  exercisePlan: [
    // TAP — visual letter recognition, warm-up
    // { type: "tap", count: 2, target: "letter", source: { from: "teach" } },

    // HEAR — audio-to-script or script-to-audio
    // { type: "hear", count: 2, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },

    // CHOOSE — deliberate discrimination, always 4 options
    // { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },

    // BUILD — assemble from tiles (target must have teachingBreakdownIds)
    // { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },

    // READ — decode Arabic, learner identifies what it says
    // { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },

    // FIX — find and correct an error
    // { type: "fix", count: 2, target: "vowel", source: { from: "teach" } },

    // CHECK — checkpoint assessment (only for end-of-phase lessons)
    // { type: "check", count: 10, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-1-checkpoint" },
  ],

  // ── Pass/fail rules ──
  masteryPolicy: {
    passThreshold: 0.85,              // 85% overall (use 0.90 for checkpoints)
    // decodePassRequired: 2,         // Uncomment: last N decode items must be correct
    // decodeMinPercent: 0.8,         // Uncomment: 80% on read/check items (checkpoints)
  },

  // ── Rendering ──
  renderProfile: "isolated",          // "isolated" | "connected" | "quran-script" | "mushaf"

  // ── Source types for exercisePlan steps ──
  // { from: "teach" }                — only teachEntityIds
  // { from: "review" }               — only reviewEntityIds
  // { from: "mixed", mix: { teach: N, review: M } } — N from teach, M from review
  // { from: "all" }                  — all unlocked entities (for checkpoints)
  // { from: "explicit", entityIds: [...] } — specific entity list
},
