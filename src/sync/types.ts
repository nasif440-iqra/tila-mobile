export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  error: string | null;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
}

export interface TableSyncConfig {
  localTable: string;
  remoteTable: string;
  primaryKey: string;
  columns: string[];
  timestampColumn: string;
  hasAutoIncrement: boolean;
}

export interface SyncContextValue extends SyncState {
  triggerSync: () => Promise<void>;
}
