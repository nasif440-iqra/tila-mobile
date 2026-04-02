import type { SupabaseClient } from '@supabase/supabase-js';
import type { FriendStreak } from './types';

/**
 * Fetch friend streaks for a user from the friend_streaks view.
 * Returns only streak count per friend (per D-10: minimal visibility).
 */
export async function getFriendStreaks(
  supabase: SupabaseClient,
  userId: string,
): Promise<FriendStreak[]> {
  try {
    const { data, error } = await supabase
      .from('friend_streaks')
      .select('friend_id, friend_name, streak_count')
      .eq('viewer_id', userId);

    if (error) {
      console.warn('[social] Failed to fetch friend streaks:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      friendId: row.friend_id as string,
      friendName: row.friend_name as string | null,
      streakCount: (row.streak_count as number) ?? 0,
    }));
  } catch (err) {
    console.warn('[social] getFriendStreaks error:', err);
    return [];
  }
}

/**
 * Send a friend request (insert pending friendship row).
 */
export async function sendFriendRequest(
  supabase: SupabaseClient,
  userId: string,
  friendId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('friendships').insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
    });

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Accept a friend request by updating the friendship status.
 * Also creates the reverse friendship for mutual visibility.
 */
export async function acceptFriendRequest(
  supabase: SupabaseClient,
  friendshipId: string,
  userId: string,
  friendId: string,
): Promise<{ error: Error | null }> {
  try {
    // Update the existing request to accepted
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (updateError) {
      return { error: new Error(updateError.message) };
    }

    // Create reverse friendship for mutual visibility
    const { error: reverseError } = await supabase.from('friendships').insert({
      user_id: userId,
      friend_id: friendId,
      status: 'accepted',
    });

    if (reverseError && !reverseError.message.includes('duplicate')) {
      console.warn('[social] Reverse friendship insert warning:', reverseError.message);
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Remove a friend (delete both directions of the friendship).
 */
export async function removeFriend(
  supabase: SupabaseClient,
  userId: string,
  friendId: string,
): Promise<void> {
  try {
    // Delete both directions
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
  } catch (err) {
    console.warn('[social] removeFriend error:', err);
  }
}

/**
 * Count pending friend requests received by a user.
 */
export async function getPendingRequestCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.warn('[social] getPendingRequestCount error:', error.message);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.warn('[social] getPendingRequestCount error:', err);
    return 0;
  }
}
