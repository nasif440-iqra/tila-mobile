import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

/**
 * Sign in with Apple using native credential prompt.
 * Uses signInWithIdToken (no OAuth redirect) for best mobile UX.
 *
 * Important: Apple only sends fullName on the very first authorization.
 * We capture it immediately and persist via supabase.auth.updateUser.
 */
export async function signInWithApple(): Promise<{
  data: Awaited<ReturnType<typeof supabase.auth.signInWithIdToken>>['data'] | null;
  error: Error | null;
}> {
  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
      nonce: rawNonce,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Capture full name on first sign-in (Apple only sends it once -- pitfall #4)
    if (credential.fullName?.givenName) {
      const fullName = `${credential.fullName.givenName} ${credential.fullName.familyName ?? ''}`.trim();
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
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
 * Check if Apple Sign-In is available on this device.
 * Returns false on Android and older iOS versions.
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}
