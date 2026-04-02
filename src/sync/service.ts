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

  // 3. Build remote lookup by primary key (or remoteKeyColumn if configured)
  const isSingleRowTable = config.onConflictColumns?.length === 1 && config.onConflictColumns[0] === 'user_id';
  const remoteMap = new Map<string, Record<string, unknown>>();
  for (const row of remoteRows) {
    if (isSingleRowTable) {
      // Single-row-per-user tables — only one row, use sentinel key
      remoteMap.set('__single', row);
    } else if (config.remoteKeyColumn) {
      // Tables with remoteKeyColumn — key by that column's value
      const key = String(row[config.remoteKeyColumn] ?? '');
      if (key) remoteMap.set(key, row);
    } else {
      const key = String(row[config.primaryKey] ?? '');
      if (key) remoteMap.set(key, row);
    }
  }

  // 4. Push local-newer rows to Supabase
  const toUpsert: Record<string, unknown>[] = [];
  for (const localRow of localRows) {
    const pk = String(localRow[config.primaryKey] ?? '');
    if (!pk) continue;

    const lookupKey = isSingleRowTable ? '__single' : pk;
    const remoteRow = remoteMap.get(lookupKey);
    const localTs = parseTimestamp(localRow[config.timestampColumn]);
    const remoteTs = remoteRow ? parseTimestamp(remoteRow[config.timestampColumn]) : null;

    if (!remoteRow || (localTs && remoteTs && localTs > remoteTs)) {
      // Build remote record with user_id and configured columns
      const record: Record<string, unknown> = { user_id: userId };

      if (isSingleRowTable) {
        // Single-row tables (user_profile, habit): do NOT include local PK
      } else if (config.remoteKeyColumn) {
        // Map local PK to remote column name (e.g., id -> local_id)
        record[config.remoteKeyColumn] = localRow[config.primaryKey];
      } else {
        record[config.primaryKey] = localRow[config.primaryKey];
      }

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
      const onConflict = config.onConflictColumns
        ? config.onConflictColumns.join(',')
        : `user_id,${config.primaryKey}`;
      const { error } = await supabase
        .from(config.remoteTable)
        .upsert(toUpsert, { onConflict });

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
    if (isSingleRowTable) {
      localMap.set('__single', row);
    } else {
      const key = String(row[config.primaryKey] ?? '');
      if (key) localMap.set(key, row);
    }
  }

  for (const remoteRow of remoteRows) {
    let lookupKey: string;
    if (isSingleRowTable) {
      lookupKey = '__single';
    } else if (config.remoteKeyColumn) {
      lookupKey = String(remoteRow[config.remoteKeyColumn] ?? '');
    } else {
      lookupKey = String(remoteRow[config.primaryKey] ?? '');
    }
    if (!lookupKey) continue;

    const localRow = localMap.get(lookupKey);
    const remoteTs = parseTimestamp(remoteRow[config.timestampColumn]);
    const localTs = localRow ? parseTimestamp(localRow[config.timestampColumn]) : null;

    if (!localRow || (remoteTs && localTs && remoteTs > localTs)) {
      try {
        // For remoteKeyColumn tables, map the remote key back to the local PK column
        const rowToUpsert = { ...remoteRow };
        if (config.remoteKeyColumn && remoteRow[config.remoteKeyColumn] != null) {
          rowToUpsert[config.primaryKey] = remoteRow[config.remoteKeyColumn];
        }
        await upsertLocalRow(db, config, rowToUpsert);
        result.pulled += 1;
      } catch (err) {
        result.errors.push(
          `Pull ${config.localTable} pk=${lookupKey}: ${err instanceof Error ? err.message : String(err)}`,
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
