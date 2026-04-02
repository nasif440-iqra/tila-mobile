import { vi } from 'vitest';

interface MockRow {
  [key: string]: unknown;
}

/**
 * Creates a mock SQLite database that simulates in-memory table storage.
 * Supports getAllAsync, getFirstAsync, runAsync, execAsync, and
 * withExclusiveTransactionAsync for testing hooks and engine functions.
 */
export function createMockDb(initialTables: Record<string, MockRow[]> = {}) {
  const tables: Record<string, MockRow[]> = {};
  for (const [key, rows] of Object.entries(initialTables)) {
    tables[key] = rows.map((r) => ({ ...r }));
  }

  const getAllAsync = vi.fn(async (sql: string) => {
    const match = sql.match(/FROM\s+(\w+)/i);
    const table = match?.[1] ?? '';
    return tables[table] ?? [];
  });

  const getFirstAsync = vi.fn(async (sql: string) => {
    const match = sql.match(/FROM\s+(\w+)/i);
    const table = match?.[1] ?? '';
    return (tables[table] ?? [])[0] ?? null;
  });

  const runAsync = vi.fn(async () => ({ changes: 1 }));
  const execAsync = vi.fn(async () => {});

  const withExclusiveTransactionAsync = vi.fn(async (fn: Function) => {
    // Create a transaction mock that mirrors the db interface
    const txn = {
      getAllAsync: vi.fn(async (sql: string) => {
        const match = sql.match(/FROM\s+(\w+)/i);
        const table = match?.[1] ?? '';
        return tables[table] ?? [];
      }),
      getFirstAsync: vi.fn(async (sql: string) => {
        const match = sql.match(/FROM\s+(\w+)/i);
        const table = match?.[1] ?? '';
        return (tables[table] ?? [])[0] ?? null;
      }),
      runAsync: vi.fn(async () => ({ changes: 1 })),
      execAsync: vi.fn(async () => {}),
    };
    await fn(txn);
    return txn;
  });

  return {
    getAllAsync,
    getFirstAsync,
    runAsync,
    execAsync,
    withExclusiveTransactionAsync,
    _tables: tables,
  };
}

export type MockDb = ReturnType<typeof createMockDb>;
