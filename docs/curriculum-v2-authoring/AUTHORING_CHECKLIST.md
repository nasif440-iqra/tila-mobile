# Curriculum V2 Authoring Checklist

Quick checks before running `npm run validate-v2`.

## For every lesson

- [ ] Lesson ID matches the curriculum blueprint number
- [ ] Phase and module match the blueprint
- [ ] `teachEntityIds` only contains entities NEW to this lesson
- [ ] `reviewEntityIds` only contains entities from PREVIOUS lessons
- [ ] Exercise plan ends with `read` or `check` steps if `decodePassRequired` is set (exit-block rule)
- [ ] `passThreshold` is 0.85 for normal lessons, 0.90 for checkpoints

## When adding a new combo family (new harakat)

Combo IDs follow the pattern `combo:{slug}-{harakat}` (e.g., `combo:ba-fatha`).

The combo resolver in `src/engine/v2/entityRegistry.ts` only supports harakat values listed in `HARAKAT_MAP`:

- `fatha` — short 'a' (ـَ)
- `kasra` — short 'i' (ـِ)
- `damma` — short 'u' (ـُ)
- `sukun` — no vowel / stop (ـْ)

**If you need a new harakat** (e.g., tanween, shaddah), you must add it to `HARAKAT_MAP` in `entityRegistry.ts` AND to `SUPPORTED_HARAKAT` in `validation.ts`. The validator will tell you explicitly if a combo uses an unsupported harakat.

## When adding chunks or words

- [ ] Entity exists in the corresponding registry file (`chunks.ts`, `words.ts`)
- [ ] `teachingBreakdownIds` are ordered (right-to-left reading order)
- [ ] All breakdown IDs are themselves resolvable (letters, combos, or other registered entities)
- [ ] `audioKey` follows the convention: `{type}_{id-suffix}` (e.g., `chunk_bas`, `word_allah`)

## When adding rules, patterns, or orthography

- [ ] Entity exists in the corresponding registry file
- [ ] `prerequisiteRuleIds` list any rules the learner must know first
- [ ] `exampleEntityIds` point to real entities that demonstrate this rule
