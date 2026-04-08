// ── RULE TEMPLATE ──
// Add to src/data/curriculum-v2/rules.ts → RULES array
// A rule is a reading/orthography convention the learner must internalise.
// Run `npm run validate-v2` after adding to catch errors.

{
  id: "rule:XXX",                     // Unique ID, prefix with "rule:" (e.g., "rule:kasra", "rule:sukoon")
  displayArabic: "",                  // Visual representation of the rule (Arabic Unicode)
                                      // For marks: the Unicode diacritic itself, e.g., "\u0650" for kasra (ِ)
                                      // For directional: an arrow or symbol, e.g., "\u2190" for RTL
  transliteration: "",                // (optional) Latin name of the rule, e.g., "kasra"
  capabilities: ["tappable", "hearable", "readable", "fixable"],
  // Available capabilities: "tappable" | "hearable" | "readable" | "buildable" | "fixable" | "quran-renderable"
  // Harakat marks typically support: tappable + hearable + readable + fixable
  // Structural rules (e.g., RTL) only need: readable
  ruleType: "mark",                   // "mark" | "joining" | "stopping" | "pronunciation" | "vowel-behavior"
                                      // "mark"          — a diacritic or small sign (harakat, sukoon, shadda)
                                      // "joining"       — how letters connect in words
                                      // "stopping"      — waqf (pause/stop) rules
                                      // "pronunciation" — articulation rules (e.g., RTL reading direction)
                                      // "vowel-behavior"— how vowels interact (e.g., madd elongation)
  description: "",                    // One-sentence plain-language explanation for the learner
  appliesTo: [],                      // Entity types this rule governs
                                      // e.g., ["combo", "chunk", "word"] for a harakat rule
  exampleEntityIds: [],               // 2-3 entity IDs that show this rule in action
                                      // e.g., ["combo:ba-kasra", "combo:ma-kasra"]
  prerequisiteRuleIds: [],            // (optional) Rules that must be taught before this one
                                      // e.g., ["rule:fatha"] if kasra is taught after fatha
},
