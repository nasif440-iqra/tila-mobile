import type { AnyEntity, EntityCapability, LetterEntity, ComboEntity } from "@/src/types/entity";
import { ARABIC_LETTERS } from "@/src/data/letters";
import { CHUNKS, RULES, PATTERNS, WORDS, ORTHOGRAPHY } from "@/src/data/curriculum-v2";

// ── Letter → LetterEntity adapter ──

// Letters are adapted from ARABIC_LETTERS (src/data/letters.js) at resolution time.
// The adapted entity includes id, displayArabic, transliteration, and capabilities,
// but does NOT include subtype-specific fields like audioKey or teachingBreakdownIds.
// Downstream code that needs letter audio should look up ARABIC_LETTERS directly
// by letter ID, not rely on the entity's audioKey field.
// TODO(Plan 2+): Consider enriching LetterEntity with audioKey from letters.js data.
function letterToEntity(letter: typeof ARABIC_LETTERS[number]): LetterEntity {
  return {
    id: `letter:${letter.id}`,
    displayArabic: letter.letter,
    transliteration: letter.transliteration,
    capabilities: ["tappable", "hearable", "readable"],
  };
}

// ── Combo → ComboEntity adapter ──

const HARAKAT_MAP: Record<string, { mark: string; sound: string }> = {
  fatha: { mark: "\u064E", sound: "a" },
  kasra: { mark: "\u0650", sound: "i" },
  damma: { mark: "\u064F", sound: "u" },
};

// Stable slug → letter ID mapping. Keyed by lowercase slug used in combo IDs.
const COMBO_SLUG_TO_LETTER_ID: Record<string, number> = {
  alif: 1, ba: 2, ta: 3, tha: 4, jeem: 5, haa: 6, khaa: 7,
  daal: 8, dhaal: 9, ra: 10, zay: 11, seen: 12, sheen: 13,
  saad: 14, daad: 15, taa: 16, dhaa: 17, ain: 18, ghain: 19,
  fa: 20, qaf: 21, kaf: 22, la: 23, ma: 24, noon: 25,
  ha: 26, waw: 27, ya: 28,
  // Aliases
  lam: 23, meem: 24, nun: 25,
};

// Combos are synthetic entities derived from letter + harakat at resolution time.
// They are NOT stored in any registry — they are generated dynamically.
// The returned entity includes id, displayArabic, transliteration, and capabilities,
// but does NOT include audioKey or teachingBreakdownIds.
// Downstream generators that need combo audio must derive the audio key from the
// combo ID convention (e.g., "combo:ba-fatha" → audio key "combo_ba-fatha").
// TODO(Plan 2+): Consider adding audioKey to ComboEntity if generators need it.
function resolveCombo(id: string): ComboEntity | undefined {
  const comboKey = id.replace("combo:", "");
  const lastDash = comboKey.lastIndexOf("-");
  if (lastDash === -1) return undefined;

  const slug = comboKey.substring(0, lastDash);
  const harakatName = comboKey.substring(lastDash + 1);

  const letterId = COMBO_SLUG_TO_LETTER_ID[slug];
  const letter = letterId != null
    ? ARABIC_LETTERS.find((l) => l.id === letterId)
    : undefined;
  const harakat = HARAKAT_MAP[harakatName];

  if (!letter || !harakat) return undefined;

  return {
    id,
    displayArabic: `${letter.letter}${harakat.mark}`,
    transliteration: `${letter.transliteration}${harakat.sound}`,
    capabilities: ["hearable", "readable", "buildable", "tappable"],
  };
}

// ── Registry lookup tables (built lazily) ──

let letterMap: Map<string, AnyEntity> | null = null;
let registryMap: Map<string, AnyEntity> | null = null;

function getLetterMap(): Map<string, AnyEntity> {
  if (!letterMap) {
    letterMap = new Map();
    for (const letter of ARABIC_LETTERS) {
      const entity = letterToEntity(letter);
      letterMap.set(entity.id, entity);
    }
  }
  return letterMap;
}

function getRegistryMap(): Map<string, AnyEntity> {
  if (!registryMap) {
    registryMap = new Map();
    for (const entity of [...CHUNKS, ...RULES, ...PATTERNS, ...WORDS, ...ORTHOGRAPHY]) {
      registryMap.set(entity.id, entity);
    }
  }
  return registryMap;
}

// ── Public API ──

export async function resolveEntity(id: string): Promise<AnyEntity | undefined> {
  if (id.startsWith("letter:")) {
    return getLetterMap().get(id);
  }
  if (id.startsWith("combo:")) {
    return resolveCombo(id);
  }
  return getRegistryMap().get(id);
}

export async function resolveAll(ids: string[]): Promise<AnyEntity[]> {
  const results: AnyEntity[] = [];
  for (const id of ids) {
    const entity = await resolveEntity(id);
    if (entity) results.push(entity);
  }
  return results;
}

// Sync: operates on already-resolved entities
export function hasCapability(entity: AnyEntity, cap: EntityCapability): boolean {
  return entity.capabilities.includes(cap);
}

export function filterByCapability(entities: AnyEntity[], cap: EntityCapability): AnyEntity[] {
  return entities.filter((e) => e.capabilities.includes(cap));
}
