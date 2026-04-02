/**
 * Pure engine logic for post-lesson insights and progress tab data.
 * Zero React dependencies — this module is imported by hooks and tested standalone.
 */

import { getTopConfusions } from './selectors';
import { parseEntityKey } from './mastery.js';
import { getLetter } from '../data/letters.js';

// ── Types ──

export interface LessonInsight {
  type: 'confusion' | 'review' | 'trend';
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

// ── Post-Lesson Insights ──

interface MasteryData {
  entities: Record<string, any>;
  confusions: Record<string, any>;
}

/**
 * Generate post-lesson insights based on mastery data and session results.
 * Returns max 3 insights (1 per type), empty array if no interesting data (D-04).
 */
export function generatePostLessonInsights(
  mastery: MasteryData,
  lessonLetterIds: number[],
  sessionResults: Map<number, { correct: number; total: number }>
): LessonInsight[] {
  const insights: LessonInsight[] = [];
  const lessonIdSet = new Set(lessonLetterIds);

  // Confusion insight (D-03.1)
  const confusionInsight = buildConfusionInsight(mastery.confusions, lessonIdSet);
  if (confusionInsight) insights.push(confusionInsight);

  // Review insight (D-03.2)
  const reviewInsight = buildReviewInsight(mastery.entities, lessonLetterIds);
  if (reviewInsight) insights.push(reviewInsight);

  // Trend insight (D-03.3)
  const trendInsight = buildTrendInsight(mastery.entities, lessonLetterIds, sessionResults);
  if (trendInsight) insights.push(trendInsight);

  return insights;
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
      message: `Tila noticed you mixed up ${letter1.name} and ${letter2.name} \u2014 we'll practice these together`,
    };
  }
  return null;
}

function buildReviewInsight(
  entities: Record<string, any>,
  lessonLetterIds: number[]
): LessonInsight | null {
  for (const id of lessonLetterIds) {
    const entity = entities[`letter:${id}`];
    if (!entity || !entity.nextReview) continue;

    const letter = getLetter(id);
    if (!letter) continue;

    const dayName = new Date(entity.nextReview).toLocaleDateString('en-US', { weekday: 'long' });
    return {
      type: 'review',
      message: `Review ${letter.name} on ${dayName}`,
    };
  }
  return null;
}

function buildTrendInsight(
  entities: Record<string, any>,
  lessonLetterIds: number[],
  sessionResults: Map<number, { correct: number; total: number }>
): LessonInsight | null {
  for (const id of lessonLetterIds) {
    const session = sessionResults.get(id);
    if (!session || session.total === 0) continue;

    const entity = entities[`letter:${id}`];
    if (!entity || entity.attempts <= session.total) continue;

    const priorCorrect = entity.correct - session.correct;
    const priorTotal = entity.attempts - session.total;
    if (priorTotal <= 0) continue;

    const prevPct = Math.round((priorCorrect / priorTotal) * 100);
    const currPct = Math.round((session.correct / session.total) * 100);

    if (currPct - prevPct >= 10) {
      const letter = getLetter(id);
      if (!letter) continue;

      return {
        type: 'trend',
        message: `You're getting stronger with ${letter.name} (${prevPct}% \u2192 ${currPct}%)`,
      };
    }
  }
  return null;
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
