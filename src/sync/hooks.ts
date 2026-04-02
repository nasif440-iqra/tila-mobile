import { useContext } from 'react';
import { SyncContext } from './provider';
import type { SyncContextValue } from './types';

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}
