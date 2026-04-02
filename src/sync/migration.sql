-- ============================================
-- Tila Cloud Sync Schema
-- Run in Supabase Dashboard -> SQL Editor
-- ============================================
--
-- This file defines the complete Postgres schema for Tila's cloud sync.
-- It mirrors the local SQLite tables with user_id foreign keys for
-- multi-tenant isolation, adds RLS policies, social tables, and
-- auto-updated timestamps.
--
-- Prerequisites:
--   - Supabase project created
--   - auth.users table exists (Supabase default)
--
-- Usage:
--   1. Open Supabase Dashboard -> SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
-- ============================================

-- ============================================
-- 1. Data Tables (mirror local SQLite)
-- ============================================

-- 1. user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarded BOOLEAN DEFAULT FALSE,
  onboarding_version INT DEFAULT 0,
  starting_point TEXT,
  motivation TEXT,
  name TEXT,
  daily_goal INT,
  commitment_complete BOOLEAN DEFAULT FALSE,
  wird_intro_seen BOOLEAN DEFAULT FALSE,
  post_lesson_onboard_seen BOOLEAN DEFAULT FALSE,
  return_hadith_last_shown TEXT,
  analytics_consent BOOLEAN,
  theme_mode TEXT DEFAULT 'system',
  account_prompt_declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. mastery_entities
CREATE TABLE IF NOT EXISTS mastery_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_key TEXT NOT NULL,
  correct INT DEFAULT 0,
  attempts INT DEFAULT 0,
  last_seen TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  interval_days INT DEFAULT 1,
  session_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_key)
);

-- 3. mastery_skills
CREATE TABLE IF NOT EXISTS mastery_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  correct INT DEFAULT 0,
  attempts INT DEFAULT 0,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_key)
);

-- 4. mastery_confusions
CREATE TABLE IF NOT EXISTS mastery_confusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confusion_key TEXT NOT NULL,
  count INT DEFAULT 0,
  last_seen TIMESTAMPTZ,
  categories TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, confusion_key)
);

-- 5. lesson_attempts
CREATE TABLE IF NOT EXISTS lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id INT,
  lesson_id INT NOT NULL,
  accuracy REAL NOT NULL,
  passed BOOLEAN NOT NULL,
  duration_seconds INT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, local_id)
);

-- 6. question_attempts
CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id INT,
  attempt_id INT NOT NULL,
  question_type TEXT NOT NULL,
  skill_bucket TEXT,
  target_entity TEXT,
  correct BOOLEAN NOT NULL,
  selected_option TEXT,
  correct_option TEXT,
  response_time_ms INT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, local_id)
);

-- 7. habit
CREATE TABLE IF NOT EXISTS habit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_practice_date TEXT,
  current_wird INT DEFAULT 0,
  longest_wird INT DEFAULT 0,
  today_lesson_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 8. premium_lesson_grants
CREATE TABLE IF NOT EXISTS premium_lesson_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id INT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- 2. Row Level Security
-- ============================================

-- Enable RLS on all data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_confusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_lesson_grants ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only CRUD their own data
CREATE POLICY "Users own their profiles" ON user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their mastery entities" ON mastery_entities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their mastery skills" ON mastery_skills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their mastery confusions" ON mastery_confusions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their lesson attempts" ON lesson_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their question attempts" ON question_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their habit" ON habit FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their premium grants" ON premium_lesson_grants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. Social Tables (for Plan 05)
-- ============================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their received friendships" ON friendships FOR UPDATE USING (auth.uid() = friend_id);

CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their invite codes" ON invite_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read unexpired invite codes" ON invite_codes FOR SELECT USING (expires_at > NOW());

-- ============================================
-- 4. Views
-- ============================================

-- Friend streaks view (streak-only visibility per D-10)
CREATE OR REPLACE VIEW friend_streaks AS
  SELECT f.user_id AS viewer_id,
         f.friend_id,
         up.name AS friend_name,
         h.current_wird AS streak_count
  FROM friendships f
  JOIN user_profiles up ON up.user_id = f.friend_id
  JOIN habit h ON h.user_id = f.friend_id
  WHERE f.status = 'accepted';

-- ============================================
-- 5. Triggers
-- ============================================

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_user_profiles BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_mastery_entities BEFORE UPDATE ON mastery_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_mastery_skills BEFORE UPDATE ON mastery_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_habit BEFORE UPDATE ON habit FOR EACH ROW EXECUTE FUNCTION update_updated_at();
