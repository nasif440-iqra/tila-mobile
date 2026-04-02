/**
 * Sync service unit tests.
 *
 * Tests the LWW (last-write-wins) sync strategy, concurrency lock,
 * and offline/error handling. Imports real production functions from
 * src/sync/service.ts and mocks only external dependencies (Supabase, SQLite).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from './helpers/mock-supabase';
import { createMockDb } from './helpers/mock-db';
import type { TableSyncConfig } from '../../src/sync/types';

// ── Mock SYNC_TABLE_CONFIGS so syncAll uses only our test config ──

const TEST_CONFIG: TableSyncConfig = {
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
};

vi.mock('../../src/sync/tables', () => ({
  SYNC_TABLE_CONFIGS: [
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
  ],
}));

// ── Import real production functions ──

import { syncAll, syncTable } from '../../src/sync/service';

// ── Tests ──

describe('syncTable', () => {
  it('pushes local-newer rows to remote', async () => {
    const db = createMockDb({
      mastery_entities: [
        {
          entity_key: 'alif',
          correct: 5,
          attempts: 8,
          last_seen: '2026-04-01',
          next_review: '2026-04-03',
          interval_days: 2,
          session_streak: 3,
          updated_at: '2026-04-01T12:00:00Z',
          created_at: '2026-03-20T00:00:00Z',
        },
      ],
    });

    const supabase = createMockSupabase({
      mastery_entities: [
        {
          user_id: 'user-1',
          entity_key: 'alif',
          correct: 3,
          attempts: 5,
          updated_at: '2026-03-30T12:00:00Z',
        },
      ],
    });

    const result = await syncTable(db as any, supabase as any, 'user-1', TEST_CONFIG);

    expect(result.pushed).toBe(1);
    expect(result.errors).toHaveLength(0);
    // Verify the remote data was updated
    const remoteData = supabase._data['mastery_entities'];
    const alif = remoteData?.find((r) => r.entity_key === 'alif');
    expect(alif?.correct).toBe(5);
  });

  it('pulls remote-newer rows to local', async () => {
    const db = createMockDb({
      mastery_entities: [
        {
          entity_key: 'ba',
          correct: 2,
          attempts: 4,
          updated_at: '2026-03-28T12:00:00Z',
        },
      ],
    });

    const supabase = createMockSupabase({
      mastery_entities: [
        {
          user_id: 'user-1',
          entity_key: 'ba',
          correct: 7,
          attempts: 10,
          updated_at: '2026-04-01T12:00:00Z',
        },
      ],
    });

    const result = await syncTable(db as any, supabase as any, 'user-1', TEST_CONFIG);

    expect(result.pulled).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(db.runAsync).toHaveBeenCalled();
  });

  it('skips rows with equal timestamps', async () => {
    const ts = '2026-04-01T12:00:00Z';

    const db = createMockDb({
      mastery_entities: [
        { entity_key: 'ta', correct: 4, attempts: 6, updated_at: ts },
      ],
    });

    const supabase = createMockSupabase({
      mastery_entities: [
        { user_id: 'user-1', entity_key: 'ta', correct: 4, attempts: 6, updated_at: ts },
      ],
    });

    const result = await syncTable(db as any, supabase as any, 'user-1', TEST_CONFIG);

    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles new local rows with no remote match', async () => {
    const db = createMockDb({
      mastery_entities: [
        {
          entity_key: 'tha',
          correct: 1,
          attempts: 2,
          updated_at: '2026-04-01T12:00:00Z',
          created_at: '2026-04-01T00:00:00Z',
        },
      ],
    });

    const supabase = createMockSupabase({
      mastery_entities: [],
    });

    const result = await syncTable(db as any, supabase as any, 'user-1', TEST_CONFIG);

    expect(result.pushed).toBe(1);
    expect(result.pulled).toBe(0);
    // Verify remote now has the row
    const remoteData = supabase._data['mastery_entities'];
    expect(remoteData).toHaveLength(1);
    expect(remoteData?.[0]?.entity_key).toBe('tha');
  });

  it('handles new remote rows with no local match', async () => {
    const db = createMockDb({
      mastery_entities: [],
    });

    const supabase = createMockSupabase({
      mastery_entities: [
        {
          user_id: 'user-1',
          entity_key: 'jim',
          correct: 3,
          attempts: 5,
          updated_at: '2026-04-01T12:00:00Z',
        },
      ],
    });

    const result = await syncTable(db as any, supabase as any, 'user-1', TEST_CONFIG);

    expect(result.pulled).toBe(1);
    expect(result.pushed).toBe(0);
    expect(db.runAsync).toHaveBeenCalled();
  });
});

describe('syncAll', () => {
  it('prevents concurrent sync with lock', async () => {
    const db = createMockDb({ mastery_entities: [] });
    const supabase = createMockSupabase({ mastery_entities: [] });

    // Start first sync but make it slow
    const originalGetAll = db.getAllAsync;
    let resolveFirst: () => void;
    const firstPromise = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    db.getAllAsync = vi.fn(async (sql: string) => {
      await firstPromise;
      return originalGetAll(sql);
    }) as any;

    const sync1 = syncAll(db as any, supabase as any, 'user-1');

    // Start second sync immediately — should return early
    const sync2Result = await syncAll(db as any, supabase as any, 'user-1');

    expect(sync2Result.errors).toContain('Sync already in progress');
    expect(sync2Result.pushed).toBe(0);
    expect(sync2Result.pulled).toBe(0);

    // Release first sync so lock is freed
    resolveFirst!();
    await sync1;
  });

  it('handles network errors gracefully without throwing', async () => {
    const db = createMockDb({
      mastery_entities: [
        { entity_key: 'ha', correct: 1, attempts: 1, updated_at: '2026-04-01T12:00:00Z' },
      ],
    });

    // Create a supabase mock that throws on select
    const supabase = createMockSupabase();
    const originalFrom = supabase.from;
    supabase.from = (table: string) => {
      return {
        ...originalFrom(table),
        select: () => ({
          eq: () => {
            throw new Error('Network request failed');
          },
        }),
      } as any;
    };

    const result = await syncAll(db as any, supabase as any, 'user-1');

    // Should not throw — errors captured in result
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Network request failed');
  });

  it('skips gracefully when offline (Supabase error response)', async () => {
    const db = createMockDb({
      mastery_entities: [
        { entity_key: 'kha', correct: 2, attempts: 3, updated_at: '2026-04-01T12:00:00Z' },
      ],
    });

    // Simulate Supabase returning an error (offline scenario)
    const supabase = createMockSupabase();
    supabase.from = (table: string) =>
      ({
        select: () => ({
          eq: () => ({
            data: null,
            error: { message: 'Failed to fetch' },
          }),
        }),
        upsert: () => ({ data: null, error: { message: 'Failed to fetch' } }),
        insert: () => ({ data: null, error: null }),
        delete: () => ({ eq: () => ({ error: null }) }),
      }) as any;

    const result = await syncAll(db as any, supabase as any, 'user-1');

    // Should not crash, errors should be populated
    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Failed to fetch');
  });
});
