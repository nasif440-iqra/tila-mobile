import { supabase } from './supabase';

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{
  data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Create a new account with email and password.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{
  data: Awaited<ReturnType<typeof supabase.auth.signUp>>['data'] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Silent failure -- worst case user stays signed in locally
  }
}

/**
 * Send a password reset email.
 */
export async function resetPassword(
  email: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
