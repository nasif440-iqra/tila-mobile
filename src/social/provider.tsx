import { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../auth/supabase';
import { useAuth } from '../auth/hooks';
import { getFriendStreaks, getPendingRequestCount, sendFriendRequest, removeFriend as removeFriendApi } from './friends';
import { generateInviteCode as generateInviteCodeApi, resolveInviteCode, shareInviteLink } from './invite';
import type { SocialContextValue, FriendStreak, InviteCode } from './types';

export const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user, isAnonymous } = useAuth();
  const [friends, setFriends] = useState<FriendStreak[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);

  const userId = user?.id;

  const loadSocialData = useCallback(async () => {
    if (!userId || isAnonymous) {
      setFriends([]);
      setPendingRequests(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [streaks, pending] = await Promise.all([
        getFriendStreaks(supabase, userId),
        getPendingRequestCount(supabase, userId),
      ]);
      setFriends(streaks);
      setPendingRequests(pending);
    } catch (err) {
      console.warn('[social] Failed to load social data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, isAnonymous]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  const generateInvite = useCallback(async (): Promise<InviteCode> => {
    if (!userId) {
      throw new Error('Must be authenticated to generate invite codes');
    }
    const code = await generateInviteCodeApi(supabase, userId);
    setInviteCode(code);
    await shareInviteLink(code.code);
    return code;
  }, [userId]);

  const acceptInvite = useCallback(
    async (code: string): Promise<{ error: Error | null }> => {
      if (!userId) {
        return { error: new Error('Must be authenticated to accept invites') };
      }

      try {
        const inviterId = await resolveInviteCode(supabase, code);
        if (!inviterId) {
          return { error: new Error('Invalid or expired invite code') };
        }

        if (inviterId === userId) {
          return { error: new Error('Cannot add yourself as a friend') };
        }

        // Send friend request from invitee to inviter
        const { error: requestError } = await sendFriendRequest(supabase, userId, inviterId);
        if (requestError) {
          return { error: requestError };
        }

        // Also send reverse request for mutual friendship
        await sendFriendRequest(supabase, inviterId, userId);

        // Refresh social data
        await loadSocialData();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    [userId, loadSocialData],
  );

  const removeFriend = useCallback(
    async (friendId: string): Promise<void> => {
      if (!userId) return;
      await removeFriendApi(supabase, userId, friendId);
      await loadSocialData();
    },
    [userId, loadSocialData],
  );

  const value: SocialContextValue = {
    friends,
    pendingRequests,
    loading,
    inviteCode,
    generateInvite,
    acceptInvite,
    removeFriend,
    refresh: loadSocialData,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}
