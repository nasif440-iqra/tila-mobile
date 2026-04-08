// ── ORTHOGRAPHY TEMPLATE ──
// Add to src/data/curriculum-v2/orthography.ts → ORTHOGRAPHY array
// An orthography entity captures Quran-script conventions that differ from standard Arabic.
// These are used in Phase 5+ lessons when learners encounter Mushaf-specific notation.
// Run `npm run validate-v2` after adding to catch errors.

{
  id: "orthography:XXX",              // Unique ID, prefix with "orthography:"
                                      // e.g., "orthography:alif-khanjariyya"
  displayArabic: "",                  // The Quran-script form (Arabic Unicode)
  transliteration: "",                // (optional) Latin name or description
  capabilities: ["readable", "quran-renderable"],
  // Available capabilities: "tappable" | "hearable" | "readable" | "buildable" | "fixable" | "quran-renderable"
  // Most orthography entities need: readable + quran-renderable
  orthographyType: "special-form",    // "special-form" | "small-mark" | "ligature" | "pause-mark"
                                      // "special-form" — a letter that looks different in Quran script
                                      //                  (e.g., alif khanjariyya — a small superscript alif)
                                      // "small-mark"   — a small sign above/below text
                                      //                  (e.g., small waw, small ya)
                                      // "ligature"     — two letters merged into one glyph
                                      //                  (e.g., lam-alif ﻻ)
                                      // "pause-mark"   — waqf marker (e.g., ۞ ۩ ۗ)
  description: "",                    // Plain-language explanation of what this is and when it appears
  standardForm: "",                   // The standard Arabic form this notation replaces or annotates
                                      // e.g., for alif khanjariyya: "\u0627" (standard alif)
  quranForm: "",                      // The Quran-script representation
                                      // e.g., for alif khanjariyya: "\u0670" (the superscript alif mark)
  exampleEntityIds: [],               // 1-3 entity IDs (words or chunks) where this appears in the Quran
},
