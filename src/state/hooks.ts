import { useContext } from 'react';
import { AppStateContext } from './provider';
import type { AppStateContextValue } from './types';

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
