import type { SQLiteDatabase } from 'expo-sqlite';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncAll } from './service';

/**
 * Migrate a previously anonymous user to an authenticated state.
 * Called once when the user signs in for the first time.
 *
 * Steps:
 * 1. Stamp the Supabase user ID on the local user_profile row
 * 2. Push all existing local data to Supabase (preserves anonymous progress per D-05)
 *
 * This ensures zero data loss when transitioning from offline-only to cloud sync.
 */
export async function migrateToAuthenticated(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Step 1: Stamp the sync_user_id on local user_profile
  await db.runAsync(
    "UPDATE user_profile SET sync_user_id = ?, updated_at = datetime('now') WHERE id = 1",
    userId,
  );

  // Step 2: Push all local data to Supabase as initial sync
  // This preserves all anonymous progress (per D-05)
  await syncAll(db, supabase, userId);
}

/**
 * Read the sync_user_id from the local user_profile.
 * Returns null if the user has not yet authenticated (still anonymous).
 */
export async function getSyncUserId(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ sync_user_id: string | null }>(
    'SELECT sync_user_id FROM user_profile WHERE id = 1',
  );
  return row?.sync_user_id ?? null;
}
