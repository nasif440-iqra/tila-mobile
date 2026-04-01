import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import { type HabitState } from "../engine/progress";
import { loadHabit } from "../engine/habit";
import { getTodayDateString, getDayDifference } from "../engine/dateUtils";

export function useHabit() {
  const db = useDatabase();
  const [habit, setHabit] = useState<HabitState | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadHabit(db);
    setHabit(data);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordPractice = useCallback(async () => {
    await db.withExclusiveTransactionAsync(async (txn) => {
      // Read fresh from DB inside transaction — not from stale React closure
      const row = await txn.getFirstAsync<{
        last_practice_date: string | null;
        current_wird: number;
        longest_wird: number;
        today_lesson_count: number;
      }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1');

      if (!row) return;

      const today = getTodayDateString();
      const gap = row.last_practice_date ? getDayDifference(today, row.last_practice_date) : -1;

      let newWird = row.current_wird;
      let newLongest = row.longest_wird;
      let newTodayCount = row.today_lesson_count;

      if (gap === 0) {
        // Same day — increment today's count only
        newTodayCount += 1;
      } else if (gap === 1) {
        // Consecutive day — extend streak
        newWird += 1;
        newTodayCount = 1;
      } else {
        // Gap > 1 or first practice — reset streak
        newWird = 1;
        newTodayCount = 1;
      }

      if (newWird > newLongest) {
        newLongest = newWird;
      }

      const updated: HabitState = {
        lastPracticeDate: today,
        currentWird: newWird,
        longestWird: newLongest,
        todayLessonCount: newTodayCount,
      };

      await txn.runAsync(
        `UPDATE habit SET last_practice_date = ?, current_wird = ?, longest_wird = ?, today_lesson_count = ?, updated_at = datetime('now') WHERE id = 1`,
        updated.lastPracticeDate,
        updated.currentWird,
        updated.longestWird,
        updated.todayLessonCount
      );

      // Sync React state after transaction commits
      setHabit(updated);
    });
  }, [db]); // Note: dependency array is now [db] only — no longer depends on `habit`

  return { habit, recordPractice, refresh };
}
