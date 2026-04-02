import { vi } from 'vitest';

interface MockRow {
  [key: string]: unknown;
}

/**
 * Creates a mock Supabase client that simulates in-memory table storage.
 * Used for testing sync service and auth flows without a real Supabase instance.
 */
export function createMockSupabase(initialData: Record<string, MockRow[]> = {}) {
  const data: Record<string, MockRow[]> = {};
  for (const [key, rows] of Object.entries(initialData)) {
    data[key] = rows.map((r) => ({ ...r }));
  }

  // Track last upsert call for test assertions
  const lastUpsertCall: { table: string; rows: MockRow[]; options?: { onConflict: string } } = {
    table: '',
    rows: [],
    options: undefined,
  };

  const from = (table: string) => {
    const tableData = () => data[table] ?? [];

    return {
      select: (_columns: string = '*') => ({
        eq: (column: string, value: unknown) => ({
          data: tableData().filter((row) => row[column] === value),
          error: null,
        }),
        // Allow chaining without eq
        then: undefined,
        data: tableData(),
        error: null,
      }),
      upsert: (rows: MockRow | MockRow[], options?: { onConflict: string }) => {
        if (!data[table]) data[table] = [];
        const rowArray = Array.isArray(rows) ? rows : [rows];
        const conflictKey = options?.onConflict?.split(',').pop()?.trim() ?? 'id';

        // Record last upsert call for assertions
        lastUpsertCall.table = table;
        lastUpsertCall.rows = rowArray.map((r) => ({ ...r }));
        lastUpsertCall.options = options;

        for (const row of rowArray) {
          const existingIdx = data[table].findIndex(
            (r) => r[conflictKey] === row[conflictKey],
          );
          if (existingIdx >= 0) {
            data[table][existingIdx] = { ...data[table][existingIdx], ...row };
          } else {
            data[table].push({ ...row });
          }
        }
        return { data: rowArray, error: null };
      },
      insert: (rows: MockRow | MockRow[]) => {
        if (!data[table]) data[table] = [];
        const rowArray = Array.isArray(rows) ? rows : [rows];
        data[table].push(...rowArray.map((r) => ({ ...r })));
        return { data: rowArray, error: null };
      },
      delete: () => ({
        eq: (column: string, value: unknown) => {
          if (data[table]) {
            data[table] = data[table].filter((row) => row[column] !== value);
          }
          return { error: null };
        },
      }),
    };
  };

  const auth = {
    onAuthStateChange: vi.fn((callback: Function) => {
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    }),
    signInWithIdToken: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
  };

  return { from, auth, _data: data, _lastUpsertCall: lastUpsertCall };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabase>;
