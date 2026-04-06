import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../data/letters.js', () => ({
  getLetter: vi.fn((id: number) => {
    const letters: Record<number, { id: number; letter: string; name: string }> = {
      1: { id: 1, letter: '\u0627', name: 'Alif' },
      2: { id: 2, letter: '\u0628', name: 'Ba' },
      3: { id: 3, letter: '\u062A', name: 'Ta' },
      4: { id: 4, letter: '\u062B', name: 'Tha' },
      7: { id: 7, letter: '\u062E', name: 'Kha' },
      8: { id: 8, letter: '\u062F', name: 'Dal' },
    };
    return letters[id] || undefined;
  }),
}));

import { generatePostLessonInsights, type LessonInsight } from '../engine/insights';

describe('generatePostLessonInsights', () => {
  // D-06: No scheduling language
  it('never returns a "review" type insight', () => {
    const mastery = {
      entities: {
        'letter:2': { correct: 5, attempts: 10, nextReview: '2026-04-08', intervalDays: 3, lastSeen: '2026-04-01', sessionStreak: 2, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [2];
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    expect(insights.every(i => i.type !== 'review')).toBe(true);
  });

  it('never contains day names or "Review X on" pattern in any message (D-06)', () => {
    const mastery = {
      entities: {
        'letter:1': { correct: 8, attempts: 10, nextReview: '2026-04-10', intervalDays: 14, lastSeen: '2026-04-01', sessionStreak: 5, lastLatencyMs: null },
        'letter:2': { correct: 5, attempts: 10, nextReview: '2026-04-08', intervalDays: 3, lastSeen: '2026-04-01', sessionStreak: 2, lastLatencyMs: null },
      },
      confusions: {
        'recognition:1->2': { count: 3, lastSeen: '2026-04-01' },
      },
    };
    const lessonLetterIds = [1, 2];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 9, total: 10 }],
      [2, { correct: 8, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const dayPattern = /Review\s+\w+\s+on\s+\w+day/i;
    for (const insight of insights) {
      expect(insight.message).not.toMatch(dayPattern);
    }
  });

  // D-07: Mastery celebration
  it('shows "You mastered [name]!" when a letter reaches retained state', () => {
    const mastery = {
      entities: {
        'letter:1': { correct: 12, attempts: 14, nextReview: '2026-04-20', intervalDays: 14, lastSeen: '2026-04-01', sessionStreak: 5, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [1];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 9, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const mastery_ = insights.find(i => i.type === 'mastery');
    expect(mastery_).toBeDefined();
    expect(mastery_!.message).toContain('You mastered Alif');
  });

  it('shows "[name] is getting stronger" when a letter reaches accurate state', () => {
    // accurate: accuracy >= threshold, but not enough streak/interval for retained
    const mastery = {
      entities: {
        'letter:2': { correct: 8, attempts: 10, nextReview: '2026-04-05', intervalDays: 3, lastSeen: '2026-04-01', sessionStreak: 2, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [2];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [2, { correct: 8, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const mastery_ = insights.find(i => i.type === 'mastery');
    expect(mastery_).toBeDefined();
    expect(mastery_!.message).toContain('Ba is getting stronger');
  });

  it('shows "N letters now retained" when multiple letters are retained', () => {
    const mastery = {
      entities: {
        'letter:1': { correct: 12, attempts: 14, nextReview: '2026-04-20', intervalDays: 14, lastSeen: '2026-04-01', sessionStreak: 5, lastLatencyMs: null },
        'letter:2': { correct: 10, attempts: 12, nextReview: '2026-04-18', intervalDays: 14, lastSeen: '2026-04-01', sessionStreak: 4, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [1, 2];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 9, total: 10 }],
      [2, { correct: 8, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const mastery_ = insights.find(i => i.type === 'mastery');
    expect(mastery_).toBeDefined();
    expect(mastery_!.message).toContain('2 letters now retained');
  });

  // D-08: Confusion pairs with warm tone
  it('shows confusion pairs with encouraging tone (D-08)', () => {
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
    expect(confusion!.message).toContain('You sometimes confuse');
    expect(confusion!.message).toContain('Ba');
    expect(confusion!.message).toContain('Ta');
    expect(confusion!.message).toContain('keep practicing');
  });

  // D-09: Encouragement fallback
  it('shows encouraging message when no confusions and accuracy >= 80% (D-09)', () => {
    // Entity has < 3 attempts = "introduced" state, so no mastery insight fires
    const mastery = {
      entities: {
        'letter:1': { correct: 1, attempts: 2, nextReview: null, intervalDays: 1, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [1];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 9, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const encouragement = insights.find(i => i.type === 'encouragement');
    expect(encouragement).toBeDefined();
    expect(encouragement!.message.length).toBeGreaterThan(0);
  });

  it('shows encouragement even for moderate accuracy (50-79%)', () => {
    // Entity has < 3 attempts = "introduced" state, so no mastery insight fires
    const mastery = {
      entities: {
        'letter:1': { correct: 1, attempts: 2, nextReview: null, intervalDays: 1, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [1];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 6, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const encouragement = insights.find(i => i.type === 'encouragement');
    expect(encouragement).toBeDefined();
  });

  it('shows encouragement for low accuracy (< 50%)', () => {
    // Entity has unstable state (low accuracy), but no mastery insight for unstable
    const mastery = {
      entities: {
        'letter:1': { correct: 1, attempts: 4, nextReview: null, intervalDays: 1, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
      },
      confusions: {},
    };
    const lessonLetterIds = [1];
    const sessionResults = new Map<number, { correct: number; total: number }>([
      [1, { correct: 3, total: 10 }],
    ]);

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const encouragement = insights.find(i => i.type === 'encouragement');
    expect(encouragement).toBeDefined();
    expect(encouragement!.message).toContain('Every attempt teaches you something');
  });

  // No confusion insight for unrelated letters
  it('returns no confusion insight when confusions do not involve lesson letters', () => {
    const mastery = {
      entities: {},
      confusions: {
        'recognition:7->8': { count: 3, lastSeen: '2026-04-01' },
      },
    };
    const lessonLetterIds = [1, 2];
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    const confusion = insights.find(i => i.type === 'confusion');
    expect(confusion).toBeUndefined();
  });

  // Max 3 insights, max 1 per type
  it('returns max 1 insight per type, max 3 total', () => {
    const mastery = {
      entities: {
        'letter:1': { correct: 12, attempts: 14, nextReview: '2026-04-20', intervalDays: 14, lastSeen: '2026-04-01', sessionStreak: 5, lastLatencyMs: null },
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
    expect(uniqueTypes.size).toBe(types.length);
  });

  // Empty data
  it('returns encouragement even when no entity data exists (no empty array)', () => {
    const mastery = { entities: {}, confusions: {} };
    const lessonLetterIds = [1, 2];
    const sessionResults = new Map<number, { correct: number; total: number }>();

    const insights = generatePostLessonInsights(mastery, lessonLetterIds, sessionResults);

    // Should have at least an encouragement insight, not an empty array
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].type).toBe('encouragement');
  });
});
