import { View, Text, FlatList, Alert, Pressable, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { typography, spacing, radii } from '../../design/tokens';
import { Card } from '../../design/components/Card';
import { Button } from '../../design/components/Button';
import { useFriends } from '../../social/hooks';
import type { FriendStreak } from '../../social/types';

function FriendRow({ friend, onRemove }: { friend: FriendStreak; onRemove: (id: string) => void }) {
  const colors = useColors();

  const handleLongPress = () => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.friendName ?? 'this friend'} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(friend.friendId),
        },
      ],
    );
  };

  return (
    <Pressable onLongPress={handleLongPress} style={styles.friendRow}>
      <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
        <Text style={[typography.bodyLarge, { color: colors.primary }]}>
          {(friend.friendName ?? 'F').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={[typography.body, { color: colors.text }]}>
          {friend.friendName ?? 'Friend'}
        </Text>
      </View>
      <View style={styles.streakBadge}>
        <Text style={[typography.bodySmall, { color: colors.accent }]}>
          {friend.streakCount} day streak
        </Text>
      </View>
    </Pressable>
  );
}

export function FriendsList() {
  const colors = useColors();
  const { friends, pendingRequests, loading, generateInvite, removeFriend } = useFriends();

  if (loading) {
    return null;
  }

  if (friends.length === 0) {
    return (
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.emptyContainer}>
          <Text style={[typography.heading3, { color: colors.text, textAlign: 'center' }]}>
            Learn Together
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSoft, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Invite a friend to learn together. You&apos;ll see each other&apos;s streaks for motivation.
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <Button title="Invite a Friend" onPress={generateInvite} />
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: spacing.md, paddingHorizontal: 0, paddingBottom: 0 }}>
      {pendingRequests > 0 && (
        <View style={[styles.pendingBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[typography.caption, { color: colors.accent }]}>
            {pendingRequests} pending request{pendingRequests > 1 ? 's' : ''}
          </Text>
        </View>
      )}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.friendId}
        renderItem={({ item }) => (
          <FriendRow friend={item} onRemove={removeFriend} />
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  streakBadge: {
    marginLeft: spacing.sm,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.xl,
  },
});
