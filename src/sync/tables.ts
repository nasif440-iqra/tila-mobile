import type { TableSyncConfig } from './types';

/**
 * Sync configuration for each local SQLite table that should be synced
 * to Supabase Postgres. Subscription state is NOT included here --
 * RevenueCat handles subscription sync independently.
 */
export const SYNC_TABLE_CONFIGS: TableSyncConfig[] = [
  {
    localTable: 'user_profile',
    remoteTable: 'user_profiles',
    primaryKey: 'id',
    columns: [
      'onboarded',
      'onboarding_version',
      'starting_point',
      'motivation',
      'name',
      'daily_goal',
      'commitment_complete',
      'wird_intro_seen',
      'post_lesson_onboard_seen',
      'return_hadith_last_shown',
      'analytics_consent',
    ],
    timestampColumn: 'updated_at',
    hasAutoIncrement: false,
  },
  {
    localTable: 'mastery_entities',
    remoteTable: 'mastery_entities',
    primaryKey: 'entity_key',
    columns: [
      'entity_key',
      'correct',
      'attempts',
      'last_seen',
      'next_review',
      'interval_days',
      'session_streak',
    ],
    timestampColumn: 'updated_at',
    hasAutoIncrement: false,
  },
  {
    localTable: 'mastery_skills',
    remoteTable: 'mastery_skills',
    primaryKey: 'skill_key',
    columns: [
      'skill_key',
      'correct',
      'attempts',
      'last_seen',
    ],
    timestampColumn: 'updated_at',
    hasAutoIncrement: false,
  },
  {
    localTable: 'mastery_confusions',
    remoteTable: 'mastery_confusions',
    primaryKey: 'confusion_key',
    columns: [
      'confusion_key',
      'count',
      'last_seen',
      'categories',
    ],
    timestampColumn: 'created_at',
    hasAutoIncrement: false,
  },
  {
    localTable: 'lesson_attempts',
    remoteTable: 'lesson_attempts',
    primaryKey: 'id',
    columns: [
      'lesson_id',
      'accuracy',
      'passed',
      'duration_seconds',
      'attempted_at',
    ],
    timestampColumn: 'attempted_at',
    hasAutoIncrement: true,
  },
  {
    localTable: 'question_attempts',
    remoteTable: 'question_attempts',
    primaryKey: 'id',
    columns: [
      'attempt_id',
      'question_type',
      'skill_bucket',
      'target_entity',
      'correct',
      'selected_option',
      'correct_option',
      'response_time_ms',
      'attempted_at',
    ],
    timestampColumn: 'attempted_at',
    hasAutoIncrement: true,
  },
  {
    localTable: 'habit',
    remoteTable: 'habit',
    primaryKey: 'id',
    columns: [
      'last_practice_date',
      'current_wird',
      'longest_wird',
      'today_lesson_count',
    ],
    timestampColumn: 'updated_at',
    hasAutoIncrement: false,
  },
  {
    localTable: 'premium_lesson_grants',
    remoteTable: 'premium_lesson_grants',
    primaryKey: 'lesson_id',
    columns: [
      'lesson_id',
      'granted_at',
    ],
    timestampColumn: 'granted_at',
    hasAutoIncrement: false,
  },
];
