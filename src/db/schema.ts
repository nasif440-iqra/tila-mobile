/**
 * SQLite schema for Tila local persistence.
 * Source of truth for all learning state.
 * Single-user design — no user_id columns.
 */

export const SCHEMA_VERSION = 6;

export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  onboarded INTEGER NOT NULL DEFAULT 0 CHECK (onboarded IN (0, 1)),
  onboarding_version INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_version >= 0),
  starting_point TEXT CHECK (starting_point IN ('new', 'some_arabic', 'rusty', 'can_read')),
  motivation TEXT CHECK (motivation IN ('read_quran', 'pray_confidently', 'connect_heritage', 'teach_children', 'personal_growth')),
  name TEXT,
  daily_goal INTEGER CHECK (daily_goal >= 1),
  commitment_complete INTEGER NOT NULL DEFAULT 0 CHECK (commitment_complete IN (0, 1)),
  wird_intro_seen INTEGER NOT NULL DEFAULT 0 CHECK (wird_intro_seen IN (0, 1)),
  post_lesson_onboard_seen INTEGER NOT NULL DEFAULT 0 CHECK (post_lesson_onboard_seen IN (0, 1)),
  return_hadith_last_shown TEXT,
  analytics_consent INTEGER CHECK (analytics_consent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lesson_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL CHECK (lesson_id >= 1),
  accuracy REAL NOT NULL CHECK (accuracy >= 0.0 AND accuracy <= 1.0),
  passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attempts_lesson ON lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attempts_date ON lesson_attempts(attempted_at);

CREATE TABLE IF NOT EXISTS mastery_entities (
  entity_key TEXT NOT NULL PRIMARY KEY,
  correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_seen TEXT,
  next_review TEXT,
  interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  session_streak INTEGER NOT NULL DEFAULT 0 CHECK (session_streak >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mastery_skills (
  skill_key TEXT NOT NULL PRIMARY KEY,
  correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_seen TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mastery_confusions (
  confusion_key TEXT NOT NULL PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  last_seen TEXT,
  categories TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_practice_date TEXT,
  current_wird INTEGER NOT NULL DEFAULT 0 CHECK (current_wird >= 0),
  longest_wird INTEGER NOT NULL DEFAULT 0 CHECK (longest_wird >= 0),
  today_lesson_count INTEGER NOT NULL DEFAULT 0 CHECK (today_lesson_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS question_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL REFERENCES lesson_attempts(id),
  question_type TEXT NOT NULL,
  skill_bucket TEXT,
  target_entity TEXT,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  selected_option TEXT,
  correct_option TEXT,
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_qa_attempt ON question_attempts(attempt_id);
CREATE INDEX IF NOT EXISTS idx_qa_entity ON question_attempts(target_entity);
CREATE INDEX IF NOT EXISTS idx_qa_date ON question_attempts(attempted_at);

CREATE TABLE IF NOT EXISTS premium_lesson_grants (
  lesson_id INTEGER NOT NULL PRIMARY KEY,
  granted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const SEED_DEFAULTS = `
INSERT OR IGNORE INTO user_profile (id) VALUES (1);
INSERT OR IGNORE INTO habit (id) VALUES (1);
`;
