---
phase: 08-cloud-sync-social
plan: 04
subsystem: sync-infrastructure
tags: [supabase, postgres, rls, migration, privacy]
dependency_graph:
  requires: [08-02]
  provides: [postgres-schema, auth-migration, privacy-manifest]
  affects: [src/sync, app.config.ts]
tech_stack:
  added: []
  patterns: [supabase-rls, anon-to-auth-migration, privacy-manifest-declarations]
key_files:
  created:
    - src/sync/migration.sql
    - src/sync/migration.ts
  modified:
    - app.config.ts
decisions:
  - "SQL file designed for copy-paste into Supabase Dashboard SQL Editor"
  - "RLS uses FOR ALL policies with both USING and WITH CHECK for simplicity"
  - "friend_streaks view joins friendships, user_profiles, habit for streak-only social visibility"
metrics:
  duration: 2m
  completed: "2026-04-02"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 1
---

# Phase 08 Plan 04: Supabase Schema, Migration & Privacy Summary

Supabase Postgres schema with 10 tables, RLS policies enforcing user isolation, anonymous-to-auth migration preserving local progress, and iOS privacy manifest for auth+sync data collection.

## What Was Done

### Task 1: Supabase Postgres Schema, Auth Migration, Privacy Manifest

**migration.sql** -- Complete Supabase Postgres schema ready for deployment:
- 8 data tables mirroring local SQLite (user_profiles, mastery_entities, mastery_skills, mastery_confusions, lesson_attempts, question_attempts, habit, premium_lesson_grants)
- 2 social tables (friendships, invite_codes) for plan 05
- All tables have `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- RLS enabled on all 10 tables (10 ALTER TABLE statements)
- RLS policies enforce `auth.uid() = user_id` for data isolation
- Friendships have granular policies: SELECT for both parties, INSERT for initiator, UPDATE for receiver
- `friend_streaks` view for streak-only social visibility
- `update_updated_at` trigger function on 4 tables with updated_at columns
- Invite codes have 7-day expiry and public read for unexpired codes

**migration.ts** -- Anonymous-to-authenticated migration:
- `migrateToAuthenticated()`: stamps sync_user_id on user_profile, then calls syncAll to push all local data to Supabase
- `getSyncUserId()`: reads sync_user_id from user_profile to check auth state
- Zero data loss: all anonymous progress preserved on first sign-in (per D-05)

**app.config.ts** -- Privacy manifest updated:
- Added NSPrivacyCollectedDataTypeEmailAddress (for auth)
- Added NSPrivacyCollectedDataTypeUserID (for sync)
- Added NSPrivacyCollectedDataTypeOtherUsageData (for learning progress sync)
- All marked as linked, non-tracking, app functionality purpose
- Preserved existing NSPrivacyAccessedAPITypes declarations

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | daf8b44 | feat(08-04): create Supabase Postgres schema, auth migration, and privacy manifest |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all files are complete and functional.

## Self-Check: PASSED
