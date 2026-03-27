/**
 * Mastery tracking helpers.
 *
 * Entity keys:   "letter:2", "combo:ba-fatha"
 * Skill keys:    "visual:2", "sound:2", "contrast:2-3", "harakat:2:fatha-vs-kasra"
 * Confusion keys: "recognition:2->3", "sound:7->8", "harakat:ba-fatha->ba-kasra"
 */

import { getLetter } from "../data/letters.js";

// ── Entity key normalization ──

/**
 * Derive a stable entity key from a quiz result's targetId and question context.
 * Rules:
 *  - If question.isHarakat and targetId is a string like "ba-fatha" → "combo:ba-fatha"
 *  - If targetId is a number → "letter:<id>"
 *  - If targetId is a string that looks like a combo id → "combo:<id>"
 *  - Fallback: "unknown:<targetId>"
 */
export function normalizeEntityKey(targetId, question) {
  if (question?.isHarakat && typeof targetId === "string") {
    return `combo:${targetId}`;
  }
  if (typeof targetId === "number") {
    return `letter:${targetId}`;
  }
  if (typeof targetId === "string") {
    // Combo ids follow pattern "lettername-harakah" e.g. "ba-fatha"
    if (/^[a-z]+-(?:fatha|kasra|damma)$/i.test(targetId)) {
      return `combo:${targetId}`;
    }
    // Could be a harakat mark id like "fatha"
    if (["fatha", "kasra", "damma"].includes(targetId)) {
      return `combo:${targetId}`;
    }
    return `unknown:${targetId}`;
  }
  return `unknown:${String(targetId)}`;
}

/**
 * Parse an entity key back to its type and raw id.
 * Returns { type: "letter"|"combo"|"unknown", rawId: string|number }
 */
export function parseEntityKey(key) {
  const idx = key.indexOf(":");
  if (idx === -1) return { type: "unknown", rawId: key };
  const type = key.slice(0, idx);
  const rawId = type === "letter" ? parseInt(key.slice(idx + 1), 10) : key.slice(idx + 1);
  return { type, rawId };
}

// ── Skill key derivation ──

/**
 * Derive skill keys from a question object.
 * Returns an array of skill key strings.
 */
export function deriveSkillKeysFromQuestion(question) {
  if (!question) return [];
  const keys = [];
  const tid = question.targetId;
  const mode = question.lessonMode;
  const type = question.type;
  const isHarakat = question.isHarakat;
  const hasAudio = question.hasAudio;

  if (isHarakat) {
    // Harakat skill: derive from the combo context
    // We can extract the letter+harakat confusion axis from options
    if (question.options && question.options.length >= 2) {
      const ids = question.options.map(o => String(o.id)).sort();
      // E.g. "harakat:ba-fatha-vs-ba-kasra" — but keep it simpler
      keys.push(`harakat:${ids.join("-vs-")}`);
    }
    return keys;
  }

  if (typeof tid === "number") {
    // Visual recognition
    if (type === "tap" || type === "name_to_letter" || type === "find" || type === "rule") {
      keys.push(`visual:${tid}`);
    }
    // Sound skill
    if (hasAudio || type === "letter_to_sound" || mode === "sound") {
      keys.push(`sound:${tid}`);
    }
    // Letter-to-name
    if (type === "letter_to_name") {
      keys.push(`visual:${tid}`);
    }
    // Contrast skill
    if (mode === "contrast" && question.options) {
      const optIds = question.options.map(o => o.id).filter(id => typeof id === "number" && id !== tid).sort((a, b) => a - b);
      if (optIds.length > 0) {
        keys.push(`contrast:${tid}-${optIds[0]}`);
      }
    }
  }

  return [...new Set(keys)];
}

// ── Entity attempt recording ──

const DEFAULT_ENTITY = {
  correct: 0,
  attempts: 0,
  lastSeen: null,
  nextReview: null,
  intervalDays: 1,
  sessionStreak: 0,
  lastLatencyMs: null,
};

/**
 * Record a single attempt against an entity.
 * @param {object|null} entry - existing entity entry
 * @param {{ correct: boolean, latencyMs?: number }} result
 * @param {string} today - YYYY-MM-DD
 * @returns {object} updated entry
 */
export function recordEntityAttempt(entry, result, today) {
  const e = { ...DEFAULT_ENTITY, ...entry };
  e.attempts += 1;
  if (result.correct) e.correct += 1;
  e.lastSeen = today;
  if (typeof result.latencyMs === "number") {
    e.lastLatencyMs = result.latencyMs;
  }
  return e;
}

// ── Skill attempt recording ──

const DEFAULT_SKILL = {
  correct: 0,
  attempts: 0,
  lastSeen: null,
};

/**
 * Record a single attempt against a skill.
 */
export function recordSkillAttempt(entry, result, today) {
  const s = { ...DEFAULT_SKILL, ...entry };
  s.attempts += 1;
  if (result.correct) s.correct += 1;
  s.lastSeen = today;
  return s;
}

// ── Error categorization ──

/**
 * Valid error categories.
 */
export const ERROR_CATEGORIES = ["visual_confusion", "sound_confusion", "vowel_confusion", "random_miss"];

/**
 * Categorize a wrong answer into one of the error types.
 * Uses the quiz result's question context to classify the miss honestly.
 * If classification is ambiguous, returns "random_miss".
 *
 * @param {object} result - quiz result record from useLessonQuiz
 * @param {object} [letterData] - optional letter metadata lookup (getLetter)
 * @returns {"visual_confusion"|"sound_confusion"|"vowel_confusion"|"random_miss"}
 */
export function categorizeError(result, getLetter) {
  if (!result || result.correct) return "random_miss";

  // Harakat / vowel questions → vowel confusion
  if (result.isHarakat) return "vowel_confusion";

  // Sound questions → sound confusion
  if (result.hasAudio || result.questionType === "letter_to_sound" || result.questionType === "contrast_audio") {
    return "sound_confusion";
  }

  // Recognition questions → check if target and selected are in the same visual family
  if (getLetter && typeof result.targetId === "number" && typeof result.selectedId === "number") {
    const target = getLetter(result.targetId);
    const selected = getLetter(result.selectedId);
    if (target && selected && target.family === selected.family && target.id !== selected.id) {
      return "visual_confusion";
    }
  }

  return "random_miss";
}

// ── Confusion recording ──

/**
 * Record a confusion event (wrong answer).
 * Only called when the user picked a wrong option.
 *
 * @param {object} confusions - existing confusion map
 * @param {string} confusionKey - e.g. "recognition:2->3"
 * @param {string} today
 * @param {string} [errorCategory] - one of ERROR_CATEGORIES
 * @returns {object} updated confusion map
 */
export function recordConfusion(confusions, confusionKey, today, errorCategory) {
  const existing = confusions[confusionKey] || { count: 0, lastSeen: null };
  const categories = { ...(existing.categories || {}) };
  if (errorCategory) {
    categories[errorCategory] = (categories[errorCategory] || 0) + 1;
  }
  return {
    ...confusions,
    [confusionKey]: {
      count: existing.count + 1,
      lastSeen: today,
      categories,
    },
  };
}

/**
 * Derive a stable confusion key from a quiz result.
 * Returns null if no confusion can be identified (e.g. correct answer).
 */
export function deriveConfusionKey(result) {
  if (result.correct) return null;
  if (!result.selectedKey || !result.targetKey) return null;
  if (result.selectedKey === result.targetKey) return null;

  // For harakat: "harakat:ba-fatha->ba-kasra"
  if (result.isHarakat) {
    return `harakat:${result.targetKey.replace("combo:", "")}->` +
           `${result.selectedKey.replace("combo:", "")}`;
  }

  // For sound questions
  if (result.hasAudio || result.questionType === "letter_to_sound") {
    return `sound:${result.targetKey.replace("letter:", "")}->` +
           `${result.selectedKey.replace("letter:", "")}`;
  }

  // For recognition
  return `recognition:${result.targetKey.replace("letter:", "")}->` +
         `${result.selectedKey.replace("letter:", "")}`;
}

// ── Mastery state taxonomy ──
//
// Derives a named mastery state from raw entity data.
// Pure derivation — nothing is stored. Computed from existing fields.
//
// States:
//   "introduced" — seen, but insufficient evidence to judge
//   "unstable"   — enough attempts to judge, but performance is inconsistent
//   "accurate"   — demonstrated reliable recent performance
//   "retained"   — accurate AND has passed spaced reviews over meaningful time
//
// Designed so future states (e.g. "accurate_isolated", "accurate_contrast")
// can be added by extending the rules without changing the function signature.

/** Minimum attempts before we judge accuracy. */
const MASTERY_MIN_ATTEMPTS = 3;

/** Accuracy threshold to move beyond unstable. */
const MASTERY_ACCURACY_THRESHOLD = 0.7;

/** Minimum SRS interval (days) to qualify as retained. */
const MASTERY_RETAINED_INTERVAL = 7;

/** Minimum session streak to qualify as retained. */
const MASTERY_RETAINED_STREAK = 3;

/**
 * Derive the mastery state for a single entity entry.
 *
 * @param {object|null} entry — entity entry from mastery.entities
 * @param {string} today — YYYY-MM-DD, used for retained-state time validation
 * @returns {"introduced"|"unstable"|"accurate"|"retained"}
 */
export function deriveMasteryState(entry, today) {
  if (!entry || !entry.attempts || entry.attempts < MASTERY_MIN_ATTEMPTS) {
    return "introduced";
  }

  const accuracy = entry.correct / entry.attempts;
  const streak = entry.sessionStreak || 0;
  const interval = entry.intervalDays || 1;

  // Below accuracy threshold → unstable regardless of streak
  if (accuracy < MASTERY_ACCURACY_THRESHOLD) {
    return "unstable";
  }

  // Retained requires:
  // 1. High enough streak and interval (SRS has progressed far enough)
  // 2. nextReview exists and is well into the future
  //
  // We use strict greater-than on the interval check: intervalDays must EXCEED
  // the threshold, not just meet it. This means the learner needs sessionStreak >= 4
  // (interval 14 days) rather than 3 (interval 7 days), which makes same-day
  // cramming much harder to exploit. With current SRS intervals {1:1, 2:3, 3:7, 4:14},
  // reaching interval > 7 requires streak 4 = four successful spaced reviews.
  //
  // NOTE: With current stored fields, we cannot perfectly distinguish "4 sessions
  // today" from "4 sessions over 2 weeks." A future `firstSeen` field would
  // enable a true time-elapsed check. For now, requiring streak 4 + interval 14
  // makes the bar high enough to be meaningfully honest.
  if (streak >= MASTERY_RETAINED_STREAK && interval > MASTERY_RETAINED_INTERVAL) {
    if (entry.nextReview && today) {
      const daysUntilReview = getDayDifference(entry.nextReview, today);
      if (daysUntilReview > 0) {
        return "retained";
      }
    }
  }

  return "accurate";
}

// Export thresholds for tests and future tuning
export {
  MASTERY_MIN_ATTEMPTS,
  MASTERY_ACCURACY_THRESHOLD,
  MASTERY_RETAINED_INTERVAL,
  MASTERY_RETAINED_STREAK,
};

// ── SRS scheduling ──

import { addDateDays, getDayDifference } from "./dateUtils.js";

const SRS_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14 };

/**
 * Update SRS scheduling fields on an entity entry.
 * Called after aggregating session outcomes, not per-question.
 */
export function updateEntitySRS(entry, wasCorrectOverall, today) {
  const e = { ...entry };
  if (wasCorrectOverall) {
    e.sessionStreak = (e.sessionStreak || 0) + 1;
    e.intervalDays = SRS_INTERVALS[e.sessionStreak] ?? 30;
    e.nextReview = addDateDays(today, e.intervalDays);
  } else {
    e.sessionStreak = 0;
    e.intervalDays = 1;
    e.nextReview = today;
  }
  e.lastSeen = today;
  return e;
}

// ── Batch merge ──

/**
 * Merge an array of rich quiz results into the mastery object.
 * Returns a new mastery object (does not mutate).
 *
 * @param {{ entities: object, skills: object, confusions: object }} mastery
 * @param {Array} quizResults - rich result records from useLessonQuiz
 * @param {string} today
 * @returns {{ entities: object, skills: object, confusions: object }}
 */
export function mergeQuizResultsIntoMastery(mastery, quizResults, today) {
  const entities = { ...mastery.entities };
  const skills = { ...mastery.skills };
  let confusions = { ...mastery.confusions };

  // Step 1: record per-question entity attempts and skill attempts
  for (const r of quizResults) {
    const eKey = r.targetKey || normalizeEntityKey(r.targetId, r);
    entities[eKey] = recordEntityAttempt(entities[eKey], r, today);

    // Skills
    const sKeys = r.skillKeys || [];
    for (const sk of sKeys) {
      skills[sk] = recordSkillAttempt(skills[sk], r, today);
    }

    // Confusions + error categorization
    if (!r.correct) {
      const cKey = deriveConfusionKey(r);
      if (cKey) {
        const errorCat = categorizeError(r, getLetter);
        confusions = recordConfusion(confusions, cKey, today, errorCat);
      }
    }
  }

  // Step 2: compute per-entity session outcome for SRS
  const entityOutcomes = {};
  for (const r of quizResults) {
    const eKey = r.targetKey || normalizeEntityKey(r.targetId, r);
    if (!entityOutcomes[eKey]) entityOutcomes[eKey] = { correct: 0, total: 0 };
    entityOutcomes[eKey].total++;
    if (r.correct) entityOutcomes[eKey].correct++;
  }
  for (const [eKey, outcome] of Object.entries(entityOutcomes)) {
    const wasCorrect = outcome.correct > outcome.total / 2;
    entities[eKey] = updateEntitySRS(entities[eKey], wasCorrect, today);
  }

  return { entities, skills, confusions };
}

// ── Migration helpers (ported from web progress.js) ──

/**
 * Create the empty v3 mastery shape.
 */
export function emptyMastery() {
  return {
    entities: {},
    skills: {},
    confusions: {},
  };
}

/**
 * Convert flat numeric-keyed progress to entity-keyed progress.
 */
export function migrateFlatProgressToEntities(flatProgress) {
  if (!flatProgress || typeof flatProgress !== "object") return {};
  const entities = {};
  for (const [rawId, entry] of Object.entries(flatProgress)) {
    if (!entry || typeof entry !== "object") continue;
    const numId = parseInt(rawId, 10);
    if (!isNaN(numId)) {
      entities[`letter:${numId}`] = { ...entry };
    } else if (typeof rawId === "string" && rawId.includes("-")) {
      entities[`combo:${rawId}`] = { ...entry };
    }
  }
  return entities;
}

/**
 * Build a flat progress map from mastery.entities for backward-compat consumers.
 * Strips the "letter:" prefix so keys are numeric again.
 */
export function buildLegacyProgressView(entities) {
  const flat = {};
  for (const [key, entry] of Object.entries(entities)) {
    if (key.startsWith("letter:")) {
      const numId = parseInt(key.slice(7), 10);
      if (!isNaN(numId)) flat[numId] = entry;
    }
  }
  return flat;
}
