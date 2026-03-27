import type { SQLiteDatabase } from 'expo-sqlite';
import type { HabitState } from './progress';

/**
 * Load only the habit row. One query instead of the full loadProgress().
 */
export async function loadHabit(db: SQLiteDatabase): Promise<HabitState> {
  const row = await db.getFirstAsync<{
    last_practice_date: string | null;
    current_wird: number;
    longest_wird: number;
    today_lesson_count: number;
  }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1');

  return row
    ? {
        lastPracticeDate: row.last_practice_date,
        currentWird: row.current_wird,
        longestWird: row.longest_wird,
        todayLessonCount: row.today_lesson_count,
      }
    : { lastPracticeDate: null, currentWird: 0, longestWird: 0, todayLessonCount: 0 };
}
