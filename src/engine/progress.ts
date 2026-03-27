/**
 * SQLite adapter for Tila learning state.
 * Bridges between the learning engine (plain JS objects) and SQLite tables.
 * All writes are granular INSERT/UPDATE — no blob reassembly.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { SEED_DEFAULTS } from '../db/schema';

// ── State Shape Types ──────────────────────────────────────────────

export interface EntityState {
  correct: number;
  attempts: number;
  lastSeen: string | null;
  nextReview: string | null;
  intervalDays: number;
  sessionStreak: number;
}

export interface SkillState {
  correct: number;
  attempts: number;
  lastSeen: string | null;
}

export interface ConfusionState {
  count: number;
  lastSeen: string | null;
}

export interface HabitState {
  lastPracticeDate: string | null;
  currentWird: number;
  longestWird: number;
  todayLessonCount: number;
}

export interface ProgressState {
  completedLessonIds: number[];
  mastery: {
    entities: Record<string, EntityState>;
    skills: Record<string, SkillState>;
    confusions: Record<string, ConfusionState>;
  };
  habit: HabitState;
  onboarded: boolean;
  onboardingStartingPoint: string | null;
  onboardingMotivation: string | null;
  onboardingDailyGoal: number | null;
  onboardingCommitmentComplete: boolean;
  onboardingVersion: number;
  wirdIntroSeen: boolean;
}

export interface QuestionAttempt {
  questionType: string;
  skillBucket: string | null;
  targetEntity: string | null;
  correct: boolean;
  selectedOption: string | null;
  correctOption: string | null;
  responseTimeMs: number | null;
}

// ── Reads ──────────────────────────────────────────────────────────

export async function loadProgress(db: SQLiteDatabase): Promise<ProgressState> {
  // Completed lessons
  const lessonRows = await db.getAllAsync<{ lesson_id: number }>(
    'SELECT DISTINCT lesson_id FROM lesson_attempts WHERE passed = 1 ORDER BY lesson_id'
  );
  const completedLessonIds = lessonRows.map((r) => r.lesson_id);

  // Mastery entities
  const entityRows = await db.getAllAsync<{
    entity_key: string;
    correct: number;
    attempts: number;
    last_seen: string | null;
    next_review: string | null;
    interval_days: number;
    session_streak: number;
  }>('SELECT entity_key, correct, attempts, last_seen, next_review, interval_days, session_streak FROM mastery_entities');

  const entities: Record<string, EntityState> = {};
  for (const row of entityRows) {
    entities[row.entity_key] = {
      correct: row.correct,
      attempts: row.attempts,
      lastSeen: row.last_seen,
      nextReview: row.next_review,
      intervalDays: row.interval_days,
      sessionStreak: row.session_streak,
    };
  }

  // Mastery skills
  const skillRows = await db.getAllAsync<{
    skill_key: string;
    correct: number;
    attempts: number;
    last_seen: string | null;
  }>('SELECT skill_key, correct, attempts, last_seen FROM mastery_skills');

  const skills: Record<string, SkillState> = {};
  for (const row of skillRows) {
    skills[row.skill_key] = {
      correct: row.correct,
      attempts: row.attempts,
      lastSeen: row.last_seen,
    };
  }

  // Mastery confusions
  const confusionRows = await db.getAllAsync<{
    confusion_key: string;
    count: number;
    last_seen: string | null;
  }>('SELECT confusion_key, count, last_seen FROM mastery_confusions');

  const confusions: Record<string, ConfusionState> = {};
  for (const row of confusionRows) {
    confusions[row.confusion_key] = {
      count: row.count,
      lastSeen: row.last_seen,
    };
  }

  // Habit
  const habitRow = await db.getFirstAsync<{
    last_practice_date: string | null;
    current_wird: number;
    longest_wird: number;
    today_lesson_count: number;
  }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1');

  const habit: HabitState = habitRow
    ? {
        lastPracticeDate: habitRow.last_practice_date,
        currentWird: habitRow.current_wird,
        longestWird: habitRow.longest_wird,
        todayLessonCount: habitRow.today_lesson_count,
      }
    : { lastPracticeDate: null, currentWird: 0, longestWird: 0, todayLessonCount: 0 };

  // User profile
  const profileRow = await db.getFirstAsync<{
    onboarded: number;
    onboarding_version: number;
    starting_point: string | null;
    motivation: string | null;
    daily_goal: number | null;
    commitment_complete: number;
  }>('SELECT onboarded, onboarding_version, starting_point, motivation, daily_goal, commitment_complete FROM user_profile WHERE id = 1');

  const onboarded = profileRow ? profileRow.onboarded === 1 : false;
  const onboardingVersion = profileRow ? profileRow.onboarding_version : 0;
  const onboardingStartingPoint = profileRow ? profileRow.starting_point : null;
  const onboardingMotivation = profileRow ? profileRow.motivation : null;
  const onboardingDailyGoal = profileRow ? profileRow.daily_goal : null;
  const onboardingCommitmentComplete = profileRow ? profileRow.commitment_complete === 1 : false;

  // wirdIntroSeen: true if the user has completed at least one lesson and habit exists
  // This mirrors the web app's behavior where wirdIntroSeen is set after the intro is shown
  const wirdIntroSeen = completedLessonIds.length > 0 && habit.currentWird > 0;

  return {
    completedLessonIds,
    mastery: { entities, skills, confusions },
    habit,
    onboarded,
    onboardingStartingPoint,
    onboardingMotivation,
    onboardingDailyGoal,
    onboardingCommitmentComplete,
    onboardingVersion,
    wirdIntroSeen,
  };
}

// ── Writes ─────────────────────────────────────────────────────────

export async function saveCompletedLesson(
  db: SQLiteDatabase,
  lessonId: number,
  accuracy: number,
  passed: boolean,
  durationSeconds: number | null
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO lesson_attempts (lesson_id, accuracy, passed, duration_seconds) VALUES (?, ?, ?, ?)',
    lessonId,
    accuracy,
    passed ? 1 : 0,
    durationSeconds
  );
  return result.lastInsertRowId;
}

export async function saveQuestionAttempts(
  db: SQLiteDatabase,
  attemptId: number,
  questions: QuestionAttempt[]
): Promise<void> {
  for (const q of questions) {
    await db.runAsync(
      'INSERT INTO question_attempts (attempt_id, question_type, skill_bucket, target_entity, correct, selected_option, correct_option, response_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      attemptId,
      q.questionType,
      q.skillBucket,
      q.targetEntity,
      q.correct ? 1 : 0,
      q.selectedOption,
      q.correctOption,
      q.responseTimeMs
    );
  }
}

export async function saveMasteryEntity(
  db: SQLiteDatabase,
  entityKey: string,
  state: EntityState
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO mastery_entities (entity_key, correct, attempts, last_seen, next_review, interval_days, session_streak, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    entityKey,
    state.correct,
    state.attempts,
    state.lastSeen,
    state.nextReview,
    state.intervalDays,
    state.sessionStreak
  );
}

export async function saveMasterySkill(
  db: SQLiteDatabase,
  skillKey: string,
  state: SkillState
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO mastery_skills (skill_key, correct, attempts, last_seen, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    skillKey,
    state.correct,
    state.attempts,
    state.lastSeen
  );
}

export async function saveMasteryConfusion(
  db: SQLiteDatabase,
  confusionKey: string,
  state: ConfusionState
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO mastery_confusions (confusion_key, count, last_seen)
     VALUES (?, ?, ?)`,
    confusionKey,
    state.count,
    state.lastSeen
  );
}

export async function saveHabit(db: SQLiteDatabase, habit: HabitState): Promise<void> {
  await db.runAsync(
    `UPDATE habit SET last_practice_date = ?, current_wird = ?, longest_wird = ?, today_lesson_count = ?, updated_at = datetime('now') WHERE id = 1`,
    habit.lastPracticeDate,
    habit.currentWird,
    habit.longestWird,
    habit.todayLessonCount
  );
}

export interface UserProfileUpdate {
  onboarded?: boolean;
  onboardingVersion?: number;
  startingPoint?: string | null;
  motivation?: string | null;
  dailyGoal?: number | null;
  commitmentComplete?: boolean;
}

export async function saveUserProfile(
  db: SQLiteDatabase,
  profile: UserProfileUpdate
): Promise<void> {
  const sets: string[] = [];
  const values: any[] = [];

  if (profile.onboarded !== undefined) {
    sets.push('onboarded = ?');
    values.push(profile.onboarded ? 1 : 0);
  }
  if (profile.onboardingVersion !== undefined) {
    sets.push('onboarding_version = ?');
    values.push(profile.onboardingVersion);
  }
  if (profile.startingPoint !== undefined) {
    sets.push('starting_point = ?');
    values.push(profile.startingPoint);
  }
  if (profile.motivation !== undefined) {
    sets.push('motivation = ?');
    values.push(profile.motivation);
  }
  if (profile.dailyGoal !== undefined) {
    sets.push('daily_goal = ?');
    values.push(profile.dailyGoal);
  }
  if (profile.commitmentComplete !== undefined) {
    sets.push('commitment_complete = ?');
    values.push(profile.commitmentComplete ? 1 : 0);
  }

  if (sets.length === 0) return;

  sets.push("updated_at = datetime('now')");
  await db.runAsync(`UPDATE user_profile SET ${sets.join(', ')} WHERE id = 1`, ...values);
}

// ── Reset ──────────────────────────────────────────────────────────

export async function resetProgress(db: SQLiteDatabase): Promise<void> {
  // Delete in FK-safe order
  await db.runAsync('DELETE FROM question_attempts');
  await db.runAsync('DELETE FROM lesson_attempts');
  await db.runAsync('DELETE FROM mastery_entities');
  await db.runAsync('DELETE FROM mastery_skills');
  await db.runAsync('DELETE FROM mastery_confusions');
  await db.runAsync('DELETE FROM habit');
  await db.runAsync('DELETE FROM user_profile');

  // Re-seed defaults
  await db.execAsync(SEED_DEFAULTS);
}

// ── Export / Import ────────────────────────────────────────────────

export async function exportProgress(db: SQLiteDatabase): Promise<object> {
  const [lessonAttempts, questionAttempts, entities, skills, confusions, habit, userProfile] =
    await Promise.all([
      db.getAllAsync('SELECT * FROM lesson_attempts ORDER BY id'),
      db.getAllAsync('SELECT * FROM question_attempts ORDER BY id'),
      db.getAllAsync('SELECT * FROM mastery_entities ORDER BY entity_key'),
      db.getAllAsync('SELECT * FROM mastery_skills ORDER BY skill_key'),
      db.getAllAsync('SELECT * FROM mastery_confusions ORDER BY confusion_key'),
      db.getFirstAsync('SELECT * FROM habit WHERE id = 1'),
      db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1'),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    lessonAttempts,
    questionAttempts,
    masteryEntities: entities,
    masterySkills: skills,
    masteryConfusions: confusions,
    habit,
    userProfile,
  };
}

interface ImportData {
  version?: number;
  lessonAttempts?: Array<Record<string, unknown>>;
  questionAttempts?: Array<Record<string, unknown>>;
  masteryEntities?: Array<Record<string, unknown>>;
  masterySkills?: Array<Record<string, unknown>>;
  masteryConfusions?: Array<Record<string, unknown>>;
  habit?: Record<string, unknown>;
  userProfile?: Record<string, unknown>;
}

export async function importProgress(db: SQLiteDatabase, data: ImportData): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data: expected an object');
  }

  await db.withTransactionAsync(async () => {
    // Clear existing data in FK-safe order
    await db.runAsync('DELETE FROM question_attempts');
    await db.runAsync('DELETE FROM lesson_attempts');
    await db.runAsync('DELETE FROM mastery_entities');
    await db.runAsync('DELETE FROM mastery_skills');
    await db.runAsync('DELETE FROM mastery_confusions');
    await db.runAsync('DELETE FROM habit');
    await db.runAsync('DELETE FROM user_profile');

    // Import lesson attempts
    if (Array.isArray(data.lessonAttempts)) {
      for (const row of data.lessonAttempts) {
        await db.runAsync(
          'INSERT INTO lesson_attempts (id, lesson_id, accuracy, passed, duration_seconds, attempted_at) VALUES (?, ?, ?, ?, ?, ?)',
          row.id as number,
          row.lesson_id as number,
          row.accuracy as number,
          row.passed as number,
          row.duration_seconds as number | null,
          row.attempted_at as string
        );
      }
    }

    // Import question attempts
    if (Array.isArray(data.questionAttempts)) {
      for (const row of data.questionAttempts) {
        await db.runAsync(
          'INSERT INTO question_attempts (id, attempt_id, question_type, skill_bucket, target_entity, correct, selected_option, correct_option, response_time_ms, attempted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          row.id as number,
          row.attempt_id as number,
          row.question_type as string,
          row.skill_bucket as string | null,
          row.target_entity as string | null,
          row.correct as number,
          row.selected_option as string | null,
          row.correct_option as string | null,
          row.response_time_ms as number | null,
          row.attempted_at as string
        );
      }
    }

    // Import mastery entities
    if (Array.isArray(data.masteryEntities)) {
      for (const row of data.masteryEntities) {
        await db.runAsync(
          'INSERT INTO mastery_entities (entity_key, correct, attempts, last_seen, next_review, interval_days, session_streak, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          row.entity_key as string,
          row.correct as number,
          row.attempts as number,
          row.last_seen as string | null,
          row.next_review as string | null,
          row.interval_days as number,
          row.session_streak as number,
          row.created_at as string,
          row.updated_at as string
        );
      }
    }

    // Import mastery skills
    if (Array.isArray(data.masterySkills)) {
      for (const row of data.masterySkills) {
        await db.runAsync(
          'INSERT INTO mastery_skills (skill_key, correct, attempts, last_seen, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          row.skill_key as string,
          row.correct as number,
          row.attempts as number,
          row.last_seen as string | null,
          row.created_at as string,
          row.updated_at as string
        );
      }
    }

    // Import mastery confusions
    if (Array.isArray(data.masteryConfusions)) {
      for (const row of data.masteryConfusions) {
        await db.runAsync(
          'INSERT INTO mastery_confusions (confusion_key, count, last_seen, created_at) VALUES (?, ?, ?, ?)',
          row.confusion_key as string,
          row.count as number,
          row.last_seen as string | null,
          row.created_at as string
        );
      }
    }

    // Import habit
    if (data.habit && typeof data.habit === 'object') {
      const h = data.habit;
      await db.runAsync(
        'INSERT INTO habit (id, last_practice_date, current_wird, longest_wird, today_lesson_count, updated_at) VALUES (1, ?, ?, ?, ?, ?)',
        h.last_practice_date as string | null,
        h.current_wird as number,
        h.longest_wird as number,
        h.today_lesson_count as number,
        h.updated_at as string
      );
    } else {
      await db.execAsync('INSERT OR IGNORE INTO habit (id) VALUES (1)');
    }

    // Import user profile
    if (data.userProfile && typeof data.userProfile === 'object') {
      const p = data.userProfile;
      await db.runAsync(
        'INSERT INTO user_profile (id, onboarded, onboarding_version, starting_point, motivation, daily_goal, commitment_complete, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)',
        p.onboarded as number,
        p.onboarding_version as number,
        p.starting_point as string | null,
        p.motivation as string | null,
        p.daily_goal as number | null,
        p.commitment_complete as number,
        p.created_at as string,
        p.updated_at as string
      );
    } else {
      await db.execAsync('INSERT OR IGNORE INTO user_profile (id) VALUES (1)');
    }
  });
}
