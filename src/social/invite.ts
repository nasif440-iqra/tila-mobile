import { Share } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { InviteCode } from './types';

/**
 * Generate a unique 8-character alphanumeric invite code with 7-day expiry.
 */
export async function generateInviteCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<InviteCode> {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('invite_codes').insert({
    code,
    user_id: userId,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to generate invite code: ${error.message}`);
  }

  return { code, expiresAt };
}

/**
 * Resolve an invite code to the inviter's user ID.
 * Returns null if the code is expired or not found.
 */
export async function resolveInviteCode(
  supabase: SupabaseClient,
  code: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data.user_id as string;
  } catch {
    return null;
  }
}

/**
 * Share an invite code/link using the device's native share sheet.
 */
export async function shareInviteLink(code: string): Promise<void> {
  try {
    await Share.share({
      message: `Learn to read Quran with me on Tila! Use my invite code: ${code} — or open this link: tila://invite/${code}`,
    });
  } catch (err) {
    console.warn('[social] shareInviteLink error:', err);
  }
}
