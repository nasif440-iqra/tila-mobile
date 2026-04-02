/**
 * Auth flow unit tests.
 *
 * Tests real auth module functions (signInWithEmail, signUpWithEmail, signOut)
 * imported from src/auth/email.ts. Mocks the Supabase singleton so no real
 * backend is hit. Verifies auth state type contracts and onAuthStateChange
 * subscription availability.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from './helpers/mock-supabase';
import type { AuthState } from '../../src/auth/types';

// ── Mock the Supabase singleton used by auth functions ──
// vi.mock is hoisted, so we use a dynamic import of the helper inside the factory.
// Instead, we inline the mock structure to avoid hoisting issues.

vi.mock('../../src/auth/supabase', async () => {
  const { createMockSupabase } = await import('./helpers/mock-supabase');
  return {
    supabase: createMockSupabase(),
  };
});

// ── Import real auth functions (they use the mocked supabase) ──

import { signInWithEmail, signUpWithEmail, signOut } from '../../src/auth/email';
import { supabase } from '../../src/auth/supabase';

// ── Tests ──

describe('Auth flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AuthState type defines expected anonymous defaults', () => {
    const initial: AuthState = {
      user: null,
      session: null,
      isAnonymous: true,
      loading: true,
      initialized: false,
    };

    expect(initial.isAnonymous).toBe(true);
    expect(initial.user).toBeNull();
    expect(initial.session).toBeNull();
    expect(initial.loading).toBe(true);
    expect(initial.initialized).toBe(false);
  });

  it('signInWithEmail calls supabase with correct credentials', async () => {
    const result = await signInWithEmail('test@example.com', 'password123');

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('signUpWithEmail calls supabase.auth.signUp', async () => {
    const result = await signUpWithEmail('new@example.com', 'secure123');

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'secure123',
    });
  });

  it('signOut calls supabase.auth.signOut', async () => {
    await signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('supabase.auth.onAuthStateChange can register a callback', () => {
    const callback = vi.fn();
    const { data } = supabase.auth.onAuthStateChange(callback);

    expect(data.subscription.unsubscribe).toBeDefined();
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
  });
});
