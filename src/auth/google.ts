import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

// Configure Google Sign-In at module load.
// Must use the **Web application** OAuth client ID (not iOS/Android) --
// this is required for Supabase signInWithIdToken validation (pitfall #3).
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

/**
 * Sign in with Google using native credential prompt.
 * Uses signInWithIdToken (no OAuth redirect) for best mobile UX.
 */
export async function signInWithGoogle(): Promise<{
  data: Awaited<ReturnType<typeof supabase.auth.signInWithIdToken>>['data'] | null;
  error: Error | null;
}> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      throw new Error('No idToken returned from Google Sign-In');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
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
