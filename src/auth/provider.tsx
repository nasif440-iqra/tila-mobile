import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AuthEvent, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AuthContextValue, AuthMethod, AuthState } from './types';
import { signInWithApple as appleSignIn } from './apple';
import { signInWithGoogle as googleSignIn } from './google';
import {
  signInWithEmail as emailSignIn,
  signUpWithEmail as emailSignUp,
  signOut as doSignOut,
} from './email';
import { track } from '../analytics';

export const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  isAnonymous: true,
  loading: true,
  initialized: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);
  const initializedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthEvent, session: Session | null) => {
        const isSignedIn =
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION';

        if (isSignedIn && session?.user) {
          setAuthState({
            user: session.user,
            session,
            isAnonymous: false,
            loading: false,
            initialized: true,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            isAnonymous: true,
            loading: false,
            initialized: true,
          });
        }

        // Mark initialized after the first event regardless
        if (!initializedRef.current) {
          initializedRef.current = true;
          setAuthState((prev) => ({
            ...prev,
            initialized: true,
            loading: false,
          }));
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      try {
        const { error } = await emailSignIn(email, password);
        if (error) return { error };
        track('auth_sign_in', { method: 'email' as AuthMethod });
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    [],
  );

  const handleSignUpWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      try {
        const { error } = await emailSignUp(email, password);
        if (error) return { error };
        track('auth_sign_in', { method: 'email' as AuthMethod });
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    [],
  );

  const handleSignInWithApple = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await appleSignIn();
      if (error) return { error };
      track('auth_sign_in', { method: 'apple' as AuthMethod });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const handleSignInWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await googleSignIn();
      if (error) return { error };
      track('auth_sign_in', { method: 'google' as AuthMethod });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      track('auth_sign_out', { had_synced_data: authState.session !== null });
      await doSignOut();
    } catch {
      // Silent failure -- worst case user stays signed in locally
    }
  }, [authState.session]);

  // Don't render children until auth state is initialized
  if (!authState.initialized) return null;

  const value: AuthContextValue = {
    ...authState,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signInWithApple: handleSignInWithApple,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
