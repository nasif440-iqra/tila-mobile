import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { SyncContextValue, SyncState } from './types';
import { syncAll } from './service';
import { supabase } from '../auth/supabase';
import { useAuth } from '../auth/hooks';
import { useDatabase } from '../db/provider';
import { track } from '../analytics';

export const SyncContext = createContext<SyncContextValue | null>(null);

const INITIAL_STATE: SyncState = {
  status: 'idle',
  lastSyncedAt: null,
  error: null,
};

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_STATE);
  const { user, isAnonymous } = useAuth();
  const db = useDatabase();
  const syncingRef = useRef(false);

  const triggerSync = useCallback(async (): Promise<void> => {
    // Skip sync for anonymous users — no cloud account to sync to
    if (isAnonymous || !user) return;
    // Prevent concurrent sync calls (belt-and-suspenders with service lock)
    if (syncingRef.current) return;

    syncingRef.current = true;
    setSyncState((prev) => ({ ...prev, status: 'syncing', error: null }));

    const startTime = Date.now();

    try {
      const result = await syncAll(db, supabase, user.id);
      const duration = Date.now() - startTime;

      if (result.errors.length > 0) {
        setSyncState({
          status: 'error',
          lastSyncedAt: new Date(),
          error: result.errors.join('; '),
        });
        track('sync_failed', {
          error_message: result.errors[0],
        });
      } else {
        setSyncState({
          status: 'idle',
          lastSyncedAt: new Date(),
          error: null,
        });
        track('sync_completed', {
          pushed: result.pushed,
          pulled: result.pulled,
          errors: result.errors.length,
          duration_ms: duration,
        });
      }
    } catch (err) {
      setSyncState({
        status: 'error',
        lastSyncedAt: syncState.lastSyncedAt,
        error: err instanceof Error ? err.message : String(err),
      });
      track('sync_failed', {
        error_message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      syncingRef.current = false;
    }
  }, [db, user, isAnonymous, syncState.lastSyncedAt]);

  // Trigger sync on mount (if authenticated) and on app foreground
  useEffect(() => {
    // Initial sync on mount
    triggerSync();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        triggerSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [triggerSync]);

  const value: SyncContextValue = {
    ...syncState,
    triggerSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
