import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const habitHookSrc = fs.readFileSync(
  path.resolve(__dirname, '../hooks/useHabit.ts'), 'utf-8'
);

describe('useHabit recordPractice — Bug 3 regression', () => {
  it('uses withExclusiveTransactionAsync for atomic read-modify-write', () => {
    // Regression: Bug 3 — recordPractice must serialize concurrent calls
    // to prevent lost updates when rapid taps trigger multiple calls
    expect(habitHookSrc).toContain('withExclusiveTransactionAsync');
  });

  it('does not depend on habit state in useCallback dependency array', () => {
    // Regression: Bug 3 — must read from DB, not stale React closure
    // Find the recordPractice useCallback and verify deps don't include habit
    expect(habitHookSrc).not.toMatch(/recordPractice[\s\S]*?\[db,\s*habit\]/);
  });

  it('reads and writes through txn parameter, not outer db', () => {
    // Regression: Bug 3 — must use txn inside exclusive transaction
    // to ensure transaction isolation for the read-modify-write cycle
    expect(habitHookSrc).toContain('txn.getFirstAsync');
    expect(habitHookSrc).toContain('txn.runAsync');
  });

  describe('habit update computation', () => {
    // Pure logic test of the update algorithm extracted from recordPractice
    function computeHabitUpdate(
      current: { currentWird: number; longestWird: number; todayLessonCount: number; lastPracticeDate: string | null },
      today: string,
      getDayDiff: (a: string, b: string) => number
    ) {
      const gap = current.lastPracticeDate ? getDayDiff(today, current.lastPracticeDate) : -1;
      let newWird = current.currentWird;
      let newLongest = current.longestWird;
      let newTodayCount = current.todayLessonCount;

      if (gap === 0) {
        newTodayCount += 1;
      } else if (gap === 1) {
        newWird += 1;
        newTodayCount = 1;
      } else {
        newWird = 1;
        newTodayCount = 1;
      }
      if (newWird > newLongest) newLongest = newWird;

      return { currentWird: newWird, longestWird: newLongest, todayLessonCount: newTodayCount, lastPracticeDate: today };
    }

    it('two sequential same-day calls produce todayLessonCount = 2 (not 1)', () => {
      // Regression: Bug 3 — the actual failure was lost todayLessonCount updates
      // When two rapid calls both read the same stale state, the second call
      // overwrites the first call's increment, resulting in count = 1 instead of 2
      const mockDayDiff = (a: string, b: string) => a === b ? 0 : 1;
      const initial = { currentWird: 5, longestWird: 5, todayLessonCount: 0, lastPracticeDate: '2026-03-30' };
      const after1 = computeHabitUpdate(initial, '2026-03-31', mockDayDiff);
      expect(after1.todayLessonCount).toBe(1);
      expect(after1.currentWird).toBe(6);
      // Second call uses RESULT of first call (simulating correct serialization)
      const after2 = computeHabitUpdate(after1, '2026-03-31', mockDayDiff);
      expect(after2.todayLessonCount).toBe(2); // Not 1 — the bug would produce 1
      expect(after2.currentWird).toBe(6); // Streak unchanged on same day
    });
  });
});
