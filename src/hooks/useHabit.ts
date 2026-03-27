import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import { loadProgress, saveHabit, type HabitState } from "../engine/progress";
import { getTodayDateString, getDayDifference } from "../engine/dateUtils";

export function useHabit() {
  const db = useDatabase();
  const [habit, setHabit] = useState<HabitState | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadProgress(db);
    setHabit(data.habit);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordPractice = useCallback(async () => {
    if (!habit) return;

    const today = getTodayDateString();
    const lastDate = habit.lastPracticeDate;
    const gap = lastDate ? getDayDifference(today, lastDate) : -1;

    let newWird = habit.currentWird;
    let newLongest = habit.longestWird;
    let newTodayCount = habit.todayLessonCount;

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

    await saveHabit(db, updated);
    setHabit(updated);
  }, [db, habit]);

  return { habit, recordPractice, refresh };
}
