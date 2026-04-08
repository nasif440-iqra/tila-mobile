export const V2_SCHEMA_VERSION = 1;

export const V2_CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS v2_lesson_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL DEFAULT 'local',
  lesson_id INTEGER NOT NULL CHECK (lesson_id >= 1),
  passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
  overall_percent REAL NOT NULL CHECK (overall_percent >= 0.0 AND overall_percent <= 1.0),
  decode_percent REAL CHECK (decode_percent >= 0.0 AND decode_percent <= 1.0),
  final_decode_streak INTEGER CHECK (final_decode_streak >= 0),
  failure_reasons TEXT,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_v2_la_lesson ON v2_lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_v2_la_profile ON v2_lesson_attempts(profile_id);

CREATE TABLE IF NOT EXISTS v2_entity_mastery (
  entity_id TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT 'local',
  state TEXT NOT NULL DEFAULT 'not_started'
    CHECK (state IN ('not_started', 'introduced', 'unstable', 'accurate', 'retained')),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  recent_attempts TEXT NOT NULL DEFAULT '[]',
  interval_days INTEGER NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
  next_review TEXT,
  session_streak INTEGER NOT NULL DEFAULT 0 CHECK (session_streak >= 0),
  confusion_pairs TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entity_id, profile_id)
);

CREATE TABLE IF NOT EXISTS v2_question_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL DEFAULT 'local',
  lesson_id INTEGER NOT NULL,
  entity_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  answer_mode TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  assessment_bucket TEXT,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_v2_qa_lesson ON v2_question_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_v2_qa_entity ON v2_question_attempts(entity_id);
CREATE INDEX IF NOT EXISTS idx_v2_qa_profile ON v2_question_attempts(profile_id);

CREATE TABLE IF NOT EXISTS v2_phase_completion (
  phase INTEGER NOT NULL,
  profile_id TEXT NOT NULL DEFAULT 'local',
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (phase, profile_id)
);

CREATE TABLE IF NOT EXISTS v2_review_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL DEFAULT 'local',
  entity_ids TEXT NOT NULL,
  results TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_v2_rs_profile ON v2_review_sessions(profile_id);

CREATE TABLE IF NOT EXISTS v2_schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
