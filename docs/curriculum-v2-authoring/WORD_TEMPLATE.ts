// ── WORD TEMPLATE ──
// Add to src/data/curriculum-v2/words.ts → WORDS array
// A word is a complete Arabic word with Quran references and connected forms.
// Run `npm run validate-v2` after adding to catch errors.

{
  id: "word:XXX",                     // Unique ID, prefix with "word:" (e.g., "word:bismillah")
  displayArabic: "",                  // Arabic text in isolated/teaching form
  transliteration: "",                // Latin transliteration (optional, e.g., "bismillah")
  capabilities: ["hearable", "readable"],
  // Available capabilities: "tappable" | "hearable" | "readable" | "buildable" | "fixable" | "quran-renderable"
  // Most words support hearable + readable. Add "buildable" if decomposition is pedagogically useful.
  // Add "quran-renderable" for words used in Quran-script exercises.
  teachingBreakdownIds: [],           // Ordered chunk/combo IDs this word breaks into for teaching
                                      // e.g., ["chunk:bis", "chunk:mil", "chunk:lah"]
  breakdownType: "teaching",          // "teaching" | "visual" | "phonological"
  connectedForm: "",                  // Arabic text in connected (joined) script form (REQUIRED for words)
  quranScriptForm: "",                // (optional) Quran-script orthography variant (use if differs from connectedForm)
  frequency: "high",                  // "high" | "medium" | "low" — how often it appears in the Quran
  teachingPriority: "core",           // "core" | "supporting" | "later"
                                      // "core"       — must be taught in the main sequence
                                      // "supporting" — useful but not critical
                                      // "later"      — post-beginner content
  surahReferences: [],                // (optional) Surah:ayah references, e.g., ["1:1", "2:255"]
  audioKey: "word_XXX",               // Audio file key — match the id with ":" replaced by "_"
},
