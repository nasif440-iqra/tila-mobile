import type { SQLiteDatabase } from 'expo-sqlite';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TableSyncConfig, SyncResult } from './types';
import { SYNC_TABLE_CONFIGS } from './tables';

let syncInProgress = false;

/**
 * Sync all configured tables between local SQLite and remote Supabase.
 * Uses last-write-wins (LWW) conflict resolution via timestamp comparison.
 * Never throws — returns errors in SyncResult for offline-first safety.
 */
export async function syncAll(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncResult> {
  if (syncInProgress) {
    return { pushed: 0, pulled: 0, errors: ['Sync already in progress'] };
  }
  syncInProgress = true;

  const totalResult: SyncResult = { pushed: 0, pulled: 0, errors: [] };

  try {
    for (const config of SYNC_TABLE_CONFIGS) {
      try {
        const result = await syncTable(db, supabase, userId, config);
        totalResult.pushed += result.pushed;
        totalResult.pulled += result.pulled;
        totalResult.errors.push(...result.errors);
      } catch (err) {
        totalResult.errors.push(
          `${config.localTable}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  } finally {
    syncInProgress = false;
  }

  return totalResult;
}

/**
 * Sync a single table using LWW strategy:
 * 1. Read all local rows
 * 2. Fetch all remote rows for this user
 * 3. Push local-newer rows to Supabase
 * 4. Pull remote-newer rows to local SQLite
 */
export async function syncTable(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
  config: TableSyncConfig,
): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };

  // 1. Read all local rows
  const localRows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM ${config.localTable}`,
  );

  // 2. Fetch remote rows for this user
  let remoteRows: Record<string, unknown>[] = [];
  try {
    const { data, error } = await supabase
      .from(config.remoteTable)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      result.errors.push(`Remote fetch ${config.remoteTable}: ${error.message}`);
      return result;
    }
    remoteRows = data ?? [];
  } catch (err) {
    result.errors.push(
      `Network error ${config.remoteTable}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return result;
  }

  // 3. Build remote lookup by primary key
  const remoteMap = new Map<string, Record<string, unknown>>();
  for (const row of remoteRows) {
    const key = String(row[config.primaryKey] ?? '');
    if (key) remoteMap.set(key, row);
  }

  // 4. Push local-newer rows to Supabase
  const toUpsert: Record<string, unknown>[] = [];
  for (const localRow of localRows) {
    const pk = String(localRow[config.primaryKey] ?? '');
    if (!pk) continue;

    const remoteRow = remoteMap.get(pk);
    const localTs = parseTimestamp(localRow[config.timestampColumn]);
    const remoteTs = remoteRow ? parseTimestamp(remoteRow[config.timestampColumn]) : null;

    if (!remoteRow || (localTs && remoteTs && localTs > remoteTs)) {
      // Build remote record with user_id and configured columns
      const record: Record<string, unknown> = { user_id: userId };
      record[config.primaryKey] = localRow[config.primaryKey];
      for (const col of config.columns) {
        record[col] = localRow[col];
      }
      record[config.timestampColumn] = localRow[config.timestampColumn];
      record['created_at'] = localRow['created_at'] ?? new Date().toISOString();
      toUpsert.push(record);
    }
  }

  if (toUpsert.length > 0) {
    try {
      const { error } = await supabase
        .from(config.remoteTable)
        .upsert(toUpsert, {
          onConflict: `user_id,${config.primaryKey}`,
        });

      if (error) {
        result.errors.push(`Push ${config.remoteTable}: ${error.message}`);
      } else {
        result.pushed += toUpsert.length;
      }
    } catch (err) {
      result.errors.push(
        `Push network ${config.remoteTable}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 5. Pull remote-newer rows to local SQLite
  const localMap = new Map<string, Record<string, unknown>>();
  for (const row of localRows) {
    const key = String(row[config.primaryKey] ?? '');
    if (key) localMap.set(key, row);
  }

  for (const remoteRow of remoteRows) {
    const pk = String(remoteRow[config.primaryKey] ?? '');
    if (!pk) continue;

    const localRow = localMap.get(pk);
    const remoteTs = parseTimestamp(remoteRow[config.timestampColumn]);
    const localTs = localRow ? parseTimestamp(localRow[config.timestampColumn]) : null;

    if (!localRow || (remoteTs && localTs && remoteTs > localTs)) {
      try {
        await upsertLocalRow(db, config, remoteRow);
        result.pulled += 1;
      } catch (err) {
        result.errors.push(
          `Pull ${config.localTable} pk=${pk}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return result;
}

/**
 * Upsert a remote row into the local SQLite table using INSERT OR REPLACE.
 */
async function upsertLocalRow(
  db: SQLiteDatabase,
  config: TableSyncConfig,
  remoteRow: Record<string, unknown>,
): Promise<void> {
  const allColumns = [config.primaryKey, ...config.columns, config.timestampColumn, 'created_at'];
  // Deduplicate columns (timestampColumn or primaryKey might be in columns already)
  const uniqueColumns = [...new Set(allColumns)];

  const placeholders = uniqueColumns.map(() => '?').join(', ');
  const values = uniqueColumns.map((col) => remoteRow[col] ?? null);

  const sql = `INSERT OR REPLACE INTO ${config.localTable} (${uniqueColumns.join(', ')}) VALUES (${placeholders})`;
  await db.runAsync(sql, values);
}

/**
 * Parse a timestamp string into a Date object for comparison.
 * Returns null for falsy/invalid values rather than throwing.
 */
function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return isNaN(date.getTime()) ? null : date;
}
