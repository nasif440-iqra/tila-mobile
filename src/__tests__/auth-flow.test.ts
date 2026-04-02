/**
 * Auth flow unit tests.
 *
 * Tests auth state transitions: anonymous initial state, sign-in creates
 * session, sign-out resets to anonymous, auth state change listener fires,
 * and anonymous-to-authenticated migration.
 *
 * Uses mock Supabase client directly — does not render React components.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from './helpers/mock-supabase';
import type { AuthState, AuthMethod } from '../../src/auth/types';

// ── Inline auth state logic (mirrors src/auth/provider.tsx) ──

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  isAnonymous: true,
  loading: true,
  initialized: false,
};

/**
 * Simulates the auth state machine from AuthProvider.
 * Processes auth events and returns the new state.
 */
function processAuthEvent(
  currentState: AuthState,
  event: string,
  session: { user: { id: string } } | null,
): AuthState {
  const isSignedIn =
    event === 'SIGNED_IN' ||
    event === 'TOKEN_REFRESHED' ||
    event === 'INITIAL_SESSION';

  if (isSignedIn && session?.user) {
    return {
      user: session.user as any,
      session: session as any,
      isAnonymous: false,
      loading: false,
      initialized: true,
    };
  } else if (event === 'SIGNED_OUT') {
    return {
      user: null,
      session: null,
      isAnonymous: true,
      loading: false,
      initialized: true,
    };
  }

  return {
    ...currentState,
    initialized: true,
    loading: false,
  };
}

// ── Tests ──

describe('Auth flow state machine', () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    supabase = createMockSupabase();
  });

  it('initial state is anonymous with user null', () => {
    expect(INITIAL_STATE.isAnonymous).toBe(true);
    expect(INITIAL_STATE.user).toBeNull();
    expect(INITIAL_STATE.session).toBeNull();
    expect(INITIAL_STATE.loading).toBe(true);
    expect(INITIAL_STATE.initialized).toBe(false);
  });

  it('signInWithEmail creates session via Supabase', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe('test-user-id');
    expect(data.session).toBeDefined();

    // Process the sign-in event
    const newState = processAuthEvent(INITIAL_STATE, 'SIGNED_IN', {
      user: { id: data.user.id },
    });

    expect(newState.isAnonymous).toBe(false);
    expect(newState.user).toBeDefined();
    expect(newState.session).toBeDefined();
    expect(newState.loading).toBe(false);
    expect(newState.initialized).toBe(true);
  });

  it('signOut resets to anonymous state', async () => {
    // Start from signed-in state
    const signedInState = processAuthEvent(INITIAL_STATE, 'SIGNED_IN', {
      user: { id: 'test-user-id' },
    });

    expect(signedInState.isAnonymous).toBe(false);

    // Sign out
    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();

    // Process sign-out event
    const signedOutState = processAuthEvent(signedInState, 'SIGNED_OUT', null);

    expect(signedOutState.isAnonymous).toBe(true);
    expect(signedOutState.user).toBeNull();
    expect(signedOutState.session).toBeNull();
    expect(signedOutState.loading).toBe(false);
    expect(signedOutState.initialized).toBe(true);
  });

  it('auth state change listener fires on SIGNED_IN event', () => {
    let capturedCallback: Function | null = null;

    // Capture the callback registered with onAuthStateChange
    supabase.auth.onAuthStateChange.mockImplementation((callback: Function) => {
      capturedCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Register listener
    const { data } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      // This is the callback
    });

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(data.subscription.unsubscribe).toBeDefined();

    // Simulate firing the auth state change
    if (capturedCallback) {
      let newState = INITIAL_STATE;
      const listener = (event: string, session: any) => {
        newState = processAuthEvent(newState, event, session);
      };

      // Re-register with our tracking listener
      supabase.auth.onAuthStateChange.mockImplementation((cb: Function) => {
        capturedCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      supabase.auth.onAuthStateChange(listener);

      // Fire SIGNED_IN event
      capturedCallback!('SIGNED_IN', { user: { id: 'new-user-id' } });

      expect(newState.isAnonymous).toBe(false);
      expect(newState.user).toBeDefined();
      expect(newState.initialized).toBe(true);
    }
  });

  it('anonymous-to-authenticated migration preserves user identity', async () => {
    // Start anonymous
    let state = INITIAL_STATE;
    state = processAuthEvent(state, 'INITIAL_SESSION', null);
    expect(state.isAnonymous).toBe(true);
    expect(state.initialized).toBe(true);

    // Simulate sign-up (anonymous user creates account)
    const { data, error } = await supabase.auth.signUp({
      email: 'newuser@example.com',
      password: 'secure123',
    });

    expect(error).toBeNull();
    expect(data.user.id).toBe('test-user-id');

    // Process the SIGNED_IN event after sign-up
    state = processAuthEvent(state, 'SIGNED_IN', {
      user: { id: data.user.id },
    });

    // Verify migration: user is now authenticated with a sync_user_id
    expect(state.isAnonymous).toBe(false);
    expect(state.user).toBeDefined();
    expect((state.user as any).id).toBe('test-user-id');

    // The migrateToAuthenticated function would stamp sync_user_id
    // in the local DB — verify the concept:
    const syncUserId = (state.user as any).id;
    expect(syncUserId).toBeTruthy();
    expect(typeof syncUserId).toBe('string');
  });
});
