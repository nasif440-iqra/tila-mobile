import { describe, it, expect, vi } from 'vitest';

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

import { groupReviewsByDay, parseConfusionPairs } from '../engine/insights';

describe('groupReviewsByDay', () => {
  it('puts entity with nextReview === today in today bucket', () => {
    const entities = {
      'letter:1': { nextReview: '2026-04-02', correct: 5, attempts: 10, intervalDays: 1, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
    };
    const result = groupReviewsByDay(entities, '2026-04-02');
    expect(result.today.length).toBe(1);
    expect(result.today[0].entityKey).toBe('letter:1');
    expect(result.today[0].letterName).toBe('Alif');
    expect(result.today[0].letterChar).toBe('\u0627');
  });

  it('puts entity with nextReview === tomorrow in tomorrow bucket', () => {
    const entities = {
      'letter:2': { nextReview: '2026-04-03', correct: 5, attempts: 10, intervalDays: 2, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
    };
    const result = groupReviewsByDay(entities, '2026-04-02');
    expect(result.tomorrow.length).toBe(1);
    expect(result.tomorrow[0].entityKey).toBe('letter:2');
    expect(result.tomorrow[0].letterName).toBe('Ba');
  });

  it('puts entity with nextReview 3 days from now in thisWeek bucket', () => {
    const entities = {
      'letter:3': { nextReview: '2026-04-05', correct: 5, attempts: 10, intervalDays: 3, lastSeen: '2026-04-01', sessionStreak: 1, lastLatencyMs: null },
    };
    const result = groupReviewsByDay(entities, '2026-04-02');
    expect(result.thisWeek.length).toBe(1);
    expect(result.thisWeek[0].entityKey).toBe('letter:3');
    expect(result.thisWeek[0].letterName).toBe('Ta');
  });

  it('ignores entities with null nextReview', () => {
    const entities = {
      'letter:1': { nextReview: null, correct: 0, attempts: 0, intervalDays: 1, lastSeen: null, sessionStreak: 0, lastLatencyMs: null },
    };
    const result = groupReviewsByDay(entities, '2026-04-02');
    expect(result.today.length).toBe(0);
    expect(result.tomorrow.length).toBe(0);
    expect(result.thisWeek.length).toBe(0);
  });
});

describe('parseConfusionPairs', () => {
  it('parses "recognition:2->3" into letter names and Arabic characters', () => {
    const confusions = {
      'recognition:2->3': { count: 5, lastSeen: '2026-04-01' },
    };
    const result = parseConfusionPairs(confusions, 5);
    expect(result.length).toBe(1);
    expect(result[0].letter1Name).toBe('Ba');
    expect(result[0].letter1Char).toBe('\u0628');
    expect(result[0].letter2Name).toBe('Ta');
    expect(result[0].letter2Char).toBe('\u062A');
    expect(result[0].count).toBe(5);
  });

  it('skips harakat confusion keys', () => {
    const confusions = {
      'harakat:ba-fatha->ba-kasra': { count: 3, lastSeen: '2026-04-01' },
      'recognition:2->3': { count: 5, lastSeen: '2026-04-01' },
    };
    const result = parseConfusionPairs(confusions, 5);
    expect(result.length).toBe(1);
    expect(result[0].letter1Name).toBe('Ba');
  });
});
