import type { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  loading: boolean;
  initialized: boolean;
}

export type AuthMethod = 'email' | 'apple' | 'google';

export interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

/** Lesson IDs at which we prompt anonymous users to create an account.
 *  Stubbed empty — no lessons to gate until new curriculum lands. */
export const ACCOUNT_PROMPT_LESSONS = [] as const;
