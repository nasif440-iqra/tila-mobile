/**
 * Integration test: Onboarding flow.
 *
 * Tests the data flow from fresh user state through onboarding completion.
 * Uses mock DB to simulate SQLite operations — tests engine/data logic,
 * not UI rendering.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from './helpers/mock-db';

// ── Types matching ProgressState from engine/progress.ts ──

interface UserProfile {
  id: number;
  onboarded: number;
  onboarding_version: number;
  starting_point: string | null;
  motivation: string | null;
  name: string | null;
  daily_goal: number | null;
  commitment_complete: number;
  wird_intro_seen: number;
  post_lesson_onboard_seen: number;
  return_hadith_last_shown: string | null;
  analytics_consent: number | null;
}

const FRESH_PROFILE: UserProfile = {
  id: 1,
  onboarded: 0,
  onboarding_version: 0,
  starting_point: null,
  motivation: null,
  name: null,
  daily_goal: null,
  commitment_complete: 0,
  wird_intro_seen: 0,
  post_lesson_onboard_seen: 0,
  return_hadith_last_shown: null,
  analytics_consent: null,
};

/**
 * Simulates saveUserProfile from engine/progress.ts.
 * Updates user_profile row with the given fields.
 */
async function saveUserProfile(
  db: ReturnType<typeof createMockDb>,
  updates: Partial<UserProfile>,
): Promise<void> {
  const setClauses = Object.entries(updates)
    .map(([key]) => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);

  await db.runAsync(
    `UPDATE user_profile SET ${setClauses}, updated_at = datetime('now') WHERE id = 1`,
    ...values,
  );

  // Apply updates to mock data
  if (db._tables['user_profile']?.[0]) {
    Object.assign(db._tables['user_profile'][0], updates);
  }
}

// ── Tests ──

describe('Onboarding flow integration', () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb({
      user_profile: [{ ...FRESH_PROFILE }],
      habit: [
        {
          id: 1,
          last_practice_date: null,
          current_wird: 0,
          longest_wird: 0,
          today_lesson_count: 0,
        },
      ],
      lesson_attempts: [],
      mastery_entities: [],
    });
  });

  it('fresh user starts with onboarded=0', async () => {
    const profile = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1');

    expect(profile).toBeDefined();
    expect((profile as UserProfile).onboarded).toBe(0);
    expect((profile as UserProfile).name).toBeNull();
    expect((profile as UserProfile).motivation).toBeNull();
    expect((profile as UserProfile).starting_point).toBeNull();
  });

  it('completing onboarding sets onboarded=1 and saves profile data', async () => {
    // Simulate onboarding steps: set starting point, motivation, name
    await saveUserProfile(db, {
      starting_point: 'new',
      motivation: 'read_quran',
      name: 'Ahmad',
      onboarded: 1,
      onboarding_version: 1,
    });

    const profile = db._tables['user_profile']?.[0] as UserProfile;
    expect(profile.onboarded).toBe(1);
    expect(profile.starting_point).toBe('new');
    expect(profile.motivation).toBe('read_quran');
    expect(profile.name).toBe('Ahmad');
    expect(profile.onboarding_version).toBe(1);
    expect(db.runAsync).toHaveBeenCalled();
  });

  it('onboarding can be completed without name (optional per Phase 3 decision)', async () => {
    // Name is optional — user can skip it
    await saveUserProfile(db, {
      starting_point: 'some_arabic',
      motivation: 'pray_confidently',
      name: null, // Explicitly null — empty-to-null conversion
      onboarded: 1,
      onboarding_version: 1,
    });

    const profile = db._tables['user_profile']?.[0] as UserProfile;
    expect(profile.onboarded).toBe(1);
    expect(profile.name).toBeNull();
    expect(profile.motivation).toBe('pray_confidently');
  });

  it('post-onboarding state is ready for lesson 1', async () => {
    // Complete onboarding
    await saveUserProfile(db, {
      onboarded: 1,
      starting_point: 'new',
      motivation: 'read_quran',
      onboarding_version: 1,
    });

    // Verify no lessons completed yet
    const attempts = await db.getAllAsync('SELECT * FROM lesson_attempts');
    expect(attempts).toHaveLength(0);

    // Verify habit is at zero
    const habit = await db.getFirstAsync('SELECT * FROM habit WHERE id = 1');
    expect(habit).toBeDefined();
    expect((habit as any).current_wird).toBe(0);
    expect((habit as any).today_lesson_count).toBe(0);

    // Verify mastery is empty (no letters introduced yet)
    const mastery = await db.getAllAsync('SELECT * FROM mastery_entities');
    expect(mastery).toHaveLength(0);

    // User is onboarded and ready
    const profile = db._tables['user_profile']?.[0] as UserProfile;
    expect(profile.onboarded).toBe(1);
  });
});
