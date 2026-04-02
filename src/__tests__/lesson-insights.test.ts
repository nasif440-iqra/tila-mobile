import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../data/letters.js', () => ({
  getLetter: vi.fn((id: number) => {
    const letters: Record<number, { id: number; letter: string; name: string }> = {
      1: { id: 1, letter: '\u0627', name: 'Alif' },
      2: { id: 2, letter: '\u0628', name: 'Ba' },
      3: { id: 3, letter: '\u062A', name: 'Ta' },
      7: { id: 7, letter: '\u062E', name: 'Kha' },
      8: { id: 8, letter: '\u062F', name: 'Dal' },
    };
    return letters[id] || undefined;
  }),
}));

import { generatePostLessonInsights } from '../engine/insights';

describe('generatePostLessonInsights', () => {
  it('returns confusion insight with caring teacher tone when confused pairs involve lesson letters', () => {
    const mastery = {
      entities: {},
      confusions: {
        'recognition:2->3': { count: 5, lastSeen: '2026-04-01' },
      },
    };
    const lessonLetterIds = [2, 3];
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const confusion = insights.find(i => i.type === 'confusion');
    expect(confusion).toBeDefined();
    expect(confusion!.message).toContain('Tila noticed you mixed up');
    expect(confusion!.message).toContain('Ba');
    expect(confusion!.message).toContain('Ta');
  });

  it('returns review timing insight with human-readable day name', () => {
    // Use a known date - a Wednesday
    const nextReviewDate = '2026-04-08'; // a Wednesday
    const mastery = {
      entities: {
        'letter:2': { correct: 5, attempts: 10, nextReview: nextReviewDate, intervalDays: 3, lastSeen: '2026-04-01', sessionStreak: 2, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [2];
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const review = insights.find(i => i.type === 'review');
    expect(review).toBeDefined();
    expect(review!.message).toContain('Review');
    expect(review!.message).toContain('Ba');
    expect(review!.message).toMatch(/on\s+\w+day/); // "on Wednesday" or similar day name
  });

  it('returns accuracy trend insight when improvement detected', () => {
    // Entity has 20 attempts, 12 correct (60% prior)
    // Session: 10 attempts, 9 correct (90% this session)
    // Prior was (12-9)/(20-10) = 3/10 = 30%. Current session 90%. Improvement > 10pp.
    const mastery = {
      entities: {
        'letter:1': { correct: 12, attempts: 20, nextReview: null, intervalDays: 1, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [1];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 9, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const trend = insights.find(i => i.type === 'trend');
    expect(trend).toBeDefined();
    expect(trend!.message).toContain('getting stronger');
    expect(trend!.message).toContain('Alif');
  });

  it('returns empty array when no interesting data exists (D-04)', () => {
    const mastery = { entities: {}, confusions: {} };
    const lessonLetterIds = [1, 2];
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    expect(insights).toEqual([]);
  });

  it('returns no confusion insight when confusions do not involve lesson letters', () => {
    const mastery = {
      entities: {},
      confusions: {
        'recognition:7->8': { count: 3, lastSeen: '2026-04-01' },
      },
    };
    const lessonLetterIds = [1, 2]; // letters 7 and 8 are not in this lesson
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const confusion = insights.find(i => i.type === 'confusion');
    expect(confusion).toBeUndefined();
  });

  it('returns max 1 insight per type, max 3 total', () => {
    const mastery = {
      entities: {
        'letter:1': { correct: 12, attempts: 20, nextReview: '2026-04-08', intervalDays: 3, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
        'letter:2': { correct: 15, attempts: 25, nextReview: '2026-04-09', intervalDays: 4, lastSeen: '2026-04-01', sessionStreak: 2, lastLatencyMs: null },
      },
      confusions: {
        'recognition:1->2': { count: 5, lastSeen: '2026-04-01' },
        'recognition:2->3': { count: 3, lastSeen: '2026-04-01' },
      },
    };
    const lessonLetterIds = [1, 2];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 9, total: 10 }],
      [2, { correct: 8, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    expect(insights.length).toBeLessThanOrEqual(3);
    const types = insights.map(i => i.type);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length); // no duplicate types
  });
});
