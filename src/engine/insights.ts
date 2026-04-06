/**
 * Pure engine logic for post-lesson insights and progress tab data.
 * Zero React dependencies — this module is imported by hooks and tested standalone.
 */

import { getTopConfusions } from './selectors';
import { parseEntityKey, deriveMasteryState } from './mastery';
import { getLetter } from '../data/letters.js';

// ── Types ──

export interface LessonInsight {
  type: 'mastery' | 'confusion' | 'encouragement';
  message: string;
}

export interface ReviewGroups {
  today: Array<{ entityKey: string; letterName: string; letterChar: string }>;
  tomorrow: Array<{ entityKey: string; letterName: string; letterChar: string }>;
  thisWeek: Array<{ entityKey: string; letterName: string; letterChar: string }>;
}

export interface ConfusionPairDisplay {
  letter1Name: string;
  letter1Char: string;
  letter2Name: string;
  letter2Char: string;
  count: number;
}

// ── Helpers ──

interface ConfusionKeyParsed {
  type: string;
  id1: number;
  id2: number;
}

function parseConfusionKey(key: string): ConfusionKeyParsed | null {
  const colonIdx = key.indexOf(':');
  if (colonIdx === -1) return null;
  const type = key.slice(0, colonIdx);
  if (type === 'harakat') return null;
  const rest = key.slice(colonIdx + 1);
  const parts = rest.split('->');
  if (parts.length !== 2) return null;
  const id1 = parseInt(parts[0], 10);
  const id2 = parseInt(parts[1], 10);
  if (isNaN(id1) || isNaN(id2)) return null;
  return { type, id1, id2 };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Encouragement messages ──

const ENCOURAGEMENT_HIGH = [
  "Great focus today!",
  "Masha'Allah, well done!",
  "You're building something beautiful",
];

const ENCOURAGEMENT_MID = [
  "Keep going -- every lesson makes you stronger",
  "Practice makes permanent",
];

const ENCOURAGEMENT_LOW = "Every attempt teaches you something. Keep going!";

// ── Post-Lesson Insights ──

interface MasteryData {
  entities: Record<string, any>;
  confusions: Record<string, any>;
}

/**
 * Generate post-lesson insights based on mastery data and session results.
 * Celebrates mastery progress first, surfaces confusion pairs warmly,
 * and always provides encouragement. No scheduling language.
 * Returns max 3 insights (1 per type).
 */
export function generatePostLessonInsights(
  mastery: MasteryData,
  lessonLetterIds: number[],
  sessionResults: Map<number, { correct: number; total: number }>
): LessonInsight[] {
  const insights: LessonInsight[] = [];
  const lessonIdSet = new Set(lessonLetterIds);
  const today = new Date().toISOString().slice(0, 10);

  // Mastery celebration (D-07) — leads insights
  const masteryInsight = buildMasteryInsight(mastery.entities, lessonLetterIds, today);
  if (masteryInsight) insights.push(masteryInsight);

  // Confusion awareness (D-08)
  const confusionInsight = buildConfusionInsight(mastery.confusions, lessonIdSet);
  if (confusionInsight) insights.push(confusionInsight);

  // Encouragement fallback (D-09) — always show if no mastery or confusion
  if (insights.length === 0) {
    const encouragementInsight = buildEncouragementInsight(sessionResults);
    insights.push(encouragementInsight);
  }

  return insights.slice(0, 3);
}

// ── Insight builders ──

function buildMasteryInsight(
  entities: Record<string, any>,
  lessonLetterIds: number[],
  today: string
): LessonInsight | null {
  if (!entities) return null;

  const retainedNames: string[] = [];
  let firstAccurateName: string | null = null;

  for (const id of lessonLetterIds) {
    const entity = entities[`letter:${id}`];
    if (!entity) continue;

    const state = deriveMasteryState(entity, today);
    const letter = getLetter(id);
    if (!letter) continue;

    if (state === 'retained') {
      retainedNames.push(letter.name);
    } else if (state === 'accurate' && !firstAccurateName) {
      firstAccurateName = letter.name;
    }
  }

  // Priority: multiple retained > single retained > accurate
  if (retainedNames.length >= 2) {
    return {
      type: 'mastery',
      message: `${retainedNames.length} letters now retained`,
    };
  }

  if (retainedNames.length === 1) {
    return {
      type: 'mastery',
      message: `You mastered ${retainedNames[0]}!`,
    };
  }

  if (firstAccurateName) {
    return {
      type: 'mastery',
      message: `${firstAccurateName} is getting stronger`,
    };
  }

  return null;
}

function buildConfusionInsight(
  confusions: Record<string, any>,
  lessonIdSet: Set<number>
): LessonInsight | null {
  if (!confusions || Object.keys(confusions).length === 0) return null;

  const topConfusions = getTopConfusions(confusions, 10);
  for (const entry of topConfusions) {
    const parsed = parseConfusionKey(entry.key);
    if (!parsed) continue;
    if (!lessonIdSet.has(parsed.id1) && !lessonIdSet.has(parsed.id2)) continue;

    const letter1 = getLetter(parsed.id1);
    const letter2 = getLetter(parsed.id2);
    if (!letter1 || !letter2) continue;

    return {
      type: 'confusion',
      message: `You sometimes confuse ${letter1.name} and ${letter2.name} \u2014 keep practicing!`,
    };
  }
  return null;
}

function buildEncouragementInsight(
  sessionResults: Map<number, { correct: number; total: number }>
): LessonInsight {
  const accuracy = calculateSessionAccuracy(sessionResults);

  let message: string;
  if (accuracy >= 0.8) {
    message = ENCOURAGEMENT_HIGH[Math.floor(Math.random() * ENCOURAGEMENT_HIGH.length)];
  } else if (accuracy >= 0.5) {
    message = ENCOURAGEMENT_MID[Math.floor(Math.random() * ENCOURAGEMENT_MID.length)];
  } else {
    message = ENCOURAGEMENT_LOW;
  }

  return { type: 'encouragement', message };
}

function calculateSessionAccuracy(
  sessionResults: Map<number, { correct: number; total: number }>
): number {
  let totalCorrect = 0;
  let totalAttempts = 0;
  for (const result of sessionResults.values()) {
    totalCorrect += result.correct;
    totalAttempts += result.total;
  }
  if (totalAttempts === 0) return 0;
  return totalCorrect / totalAttempts;
}

// ── Progress Tab: Review Grouping ──

/**
 * Group mastery entities by their nextReview date relative to today.
 * Only includes letter-type entities.
 */
export function groupReviewsByDay(
  entities: Record<string, any>,
  today: string
): ReviewGroups {
  const result: ReviewGroups = { today: [], tomorrow: [], thisWeek: [] };
  if (!entities) return result;

  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);

  for (const [key, entity] of Object.entries(entities)) {
    if (!entity.nextReview) continue;

    const parsed = parseEntityKey(key);
    if (parsed.type !== 'letter') continue;

    const letterId = typeof parsed.rawId === 'number' ? parsed.rawId : parseInt(parsed.rawId, 10);
    const letter = getLetter(letterId);
    if (!letter) continue;

    const reviewDate = entity.nextReview;
    const item = { entityKey: key, letterName: letter.name, letterChar: letter.letter };

    if (reviewDate <= today) {
      // Overdue or due today
      result.today.push(item);
    } else if (reviewDate === tomorrow) {
      result.tomorrow.push(item);
    } else if (reviewDate <= weekEnd) {
      result.thisWeek.push(item);
    }
  }

  return result;
}

// ── Progress Tab: Confusion Pair Display ──

/**
 * Parse confusion data into display-ready objects with letter names and Arabic characters.
 * Skips harakat confusion keys. Sorted by count descending.
 */
export function parseConfusionPairs(
  confusions: Record<string, any>,
  limit: number = 5
): ConfusionPairDisplay[] {
  const topConfusions = getTopConfusions(confusions, limit);
  const pairs: ConfusionPairDisplay[] = [];

  for (const entry of topConfusions) {
    const parsed = parseConfusionKey(entry.key);
    if (!parsed) continue;

    const letter1 = getLetter(parsed.id1);
    const letter2 = getLetter(parsed.id2);
    if (!letter1 || !letter2) continue;

    pairs.push({
      letter1Name: letter1.name,
      letter1Char: letter1.letter,
      letter2Name: letter2.name,
      letter2Char: letter2.letter,
      count: entry.count,
    });
  }

  return pairs;
}
