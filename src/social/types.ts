export interface FriendStreak {
  friendId: string;
  friendName: string | null;
  streakCount: number;
}

export interface InviteCode {
  code: string;
  expiresAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface SocialState {
  friends: FriendStreak[];
  pendingRequests: number;
  loading: boolean;
  inviteCode: InviteCode | null;
}

export interface SocialContextValue extends SocialState {
  generateInvite: () => Promise<InviteCode>;
  acceptInvite: (code: string) => Promise<{ error: Error | null }>;
  removeFriend: (friendId: string) => Promise<void>;
  refresh: () => Promise<void>;
}
