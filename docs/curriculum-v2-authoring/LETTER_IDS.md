# Arabic Letter IDs

| ID | Letter | Name  | Transliteration | Combo slug |
|----|--------|-------|-----------------|------------|
| 1  | ا      | Alif  | aa              | alif       |
| 2  | ب      | Ba    | b               | ba         |
| 3  | ت      | Ta    | t               | ta         |
| 4  | ث      | Tha   | th              | tha        |
| 5  | ج      | Jeem  | j               | jeem       |
| 6  | ح      | Haa   | ḥ               | haa        |
| 7  | خ      | Khaa  | kh              | khaa       |
| 8  | د      | Daal  | d               | daal       |
| 9  | ذ      | Dhaal | dh              | dhaal      |
| 10 | ر      | Ra    | r               | ra         |
| 11 | ز      | Zay   | z               | zay        |
| 12 | س      | Seen  | s               | seen       |
| 13 | ش      | Sheen | sh              | sheen      |
| 14 | ص      | Saad  | ṣ               | saad       |
| 15 | ض      | Daad  | ḍ               | daad       |
| 16 | ط      | Taa   | ṭ               | taa        |
| 17 | ظ      | Dhaa  | ẓ               | dhaa       |
| 18 | ع      | Ain   | 'a              | ain        |
| 19 | غ      | Ghain | gh              | ghain      |
| 20 | ف      | Fa    | f               | fa         |
| 21 | ق      | Qaf   | q               | qaf        |
| 22 | ك      | Kaf   | k               | kaf        |
| 23 | ل      | Lam   | l               | la         |
| 24 | م      | Meem  | m               | ma         |
| 25 | ن      | Noon  | n               | noon       |
| 26 | ه      | Ha    | h               | ha         |
| 27 | و      | Waw   | w               | waw        |
| 28 | ي      | Ya    | y               | ya         |

## Combo ID format

`combo:{slug}-{harakat}` where harakat is `fatha`, `kasra`, or `damma`

Examples: `combo:ba-fatha`, `combo:ma-kasra`, `combo:noon-damma`

## Harakat

- **Fatha** (ـَ U+064E) — short 'a' sound, stroke above the letter
- **Kasra** (ـِ U+0650) — short 'i' sound, stroke below the letter
- **Damma** (ـُ U+064F) — short 'u' sound, small loop above the letter

## Notes

- Letter IDs are stable — they match `ARABIC_LETTERS` in `src/data/letters.js`
- Combo slugs follow the letter name in lowercase (e.g., Meem → `ma`, Lam → `la`, Noon → `noon`)
- Combos are synthetic entities — they do not live in any registry file, they are generated at resolution time from the letter ID + harakat rule
- To reference a rule: use `rule:fatha`, `rule:kasra`, `rule:damma`, `rule:sukoon`, etc.
- To reference a chunk: look up `src/data/curriculum-v2/chunks.ts` for the `id` field
