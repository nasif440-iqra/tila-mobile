import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

// Lazily configure Google Sign-In — calling configure() at module load
// crashes on iOS with a TurboModule ObjC exception (SIGABRT).
let _configured = false;
function ensureConfigured() {
  if (_configured) return;
  _configured = true;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  });
}

/**
 * Sign in with Google using native credential prompt.
 * Uses signInWithIdToken (no OAuth redirect) for best mobile UX.
 */
export async function signInWithGoogle(): Promise<{
  data: Awaited<ReturnType<typeof supabase.auth.signInWithIdToken>>['data'] | null;
  error: Error | null;
}> {
  try {
    ensureConfigured();
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
