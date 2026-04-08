// ── PATTERN TEMPLATE ──
// Add to src/data/curriculum-v2/patterns.ts → PATTERNS array
// A pattern is a recurring phonological structure learners should recognise across letters.
// Run `npm run validate-v2` after adding to catch errors.

{
  id: "pattern:XXX",                  // Unique ID, prefix with "pattern:" (e.g., "pattern:cv-kasra")
  displayArabic: "",                  // Arabic representation (use placeholder glyph ◌ + mark if needed)
                                      // e.g., "\u25CC\u0650" for ◌ِ (consonant + kasra)
  transliteration: "",                // Short description of the pattern, e.g., "consonant + i"
  capabilities: ["hearable", "readable"],
  // Available capabilities: "tappable" | "hearable" | "readable" | "buildable" | "fixable" | "quran-renderable"
  patternType: "syllable",            // "vowel" | "consonant" | "syllable" | "assimilation"
                                      // "vowel"        — a vowel mark pattern (fatha/kasra/damma)
                                      // "consonant"    — consonant cluster or doubling pattern
                                      // "syllable"     — CV, CVC, or other syllable shape
                                      // "assimilation" — how sounds change when letters join (e.g., shamsiyya/qamariyya)
  description: "",                    // One-sentence explanation of the pattern for the learner
  exampleEntityIds: [],               // 2-4 entity IDs that demonstrate this pattern
                                      // e.g., ["combo:ba-kasra", "combo:ma-kasra", "combo:la-kasra"]
  contrastEntityIds: [],              // (optional) Entity IDs that contrast with this pattern
                                      // Useful for vowel patterns where fatha/kasra/damma are contrasted
},
