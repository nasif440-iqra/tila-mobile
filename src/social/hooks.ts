import { useContext } from 'react';
import { SocialContext } from './provider';
import type { SocialContextValue } from './types';

export function useFriends(): SocialContextValue {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useFriends must be used within SocialProvider');
  }
  return context;
}
