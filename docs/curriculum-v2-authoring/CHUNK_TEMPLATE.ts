// ── CHUNK TEMPLATE ──
// Add to src/data/curriculum-v2/chunks.ts → CHUNKS array
// A chunk is a sub-word unit (2-4 syllables) composed of known combos/letters.
// Run `npm run validate-v2` after adding to catch errors.

{
  id: "chunk:XXX",                    // Unique ID, prefix with "chunk:" (e.g., "chunk:ba-ma")
  displayArabic: "",                  // Arabic text of the chunk (right-to-left, use actual Unicode)
  transliteration: "",                // Latin transliteration (optional, e.g., "bama")
  capabilities: ["hearable", "readable", "buildable"],
  // Available capabilities: "tappable" | "hearable" | "readable" | "buildable" | "fixable" | "quran-renderable"
  // Most chunks support hearable + readable + buildable. Add "tappable" only for single-form recognition.
  teachingBreakdownIds: [],           // Ordered combo/letter IDs this chunk decomposes into
                                      // e.g., ["combo:ba-fatha", "combo:ma-fatha"]
                                      // Used by the BUILD exercise to generate tiles
  breakdownType: "teaching",          // "teaching" | "visual" | "phonological"
                                      // "teaching" — pedagogical breakdown (most common)
                                      // "visual"   — by how the letters connect visually
                                      // "phonological" — by syllable boundaries
  syllableCount: 1,                   // Number of syllables (integer, >= 1)
  connectedForm: "",                  // (optional) Arabic text when letters join in connected script
  audioKey: "chunk_XXX",              // Audio file key — match the id with ":" replaced by "_"
                                      // e.g., id "chunk:ba-ma" → audioKey "chunk_ba-ma"
},
