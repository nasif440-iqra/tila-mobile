import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import { typography, spacing } from '../../design/tokens';
import { Card } from '../../design/components/Card';
import { Button } from '../../design/components/Button';
import { useFriends } from '../../social/hooks';
import { shareInviteLink } from '../../social/invite';
import { useState } from 'react';

export function InviteCard() {
  const colors = useColors();
  const { inviteCode, generateInvite } = useFriends();
  const [generating, setGenerating] = useState(false);

  const handleInvite = async () => {
    setGenerating(true);
    try {
      await generateInvite();
    } catch (err) {
      console.warn('[social] Failed to generate invite:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (inviteCode) {
      await shareInviteLink(inviteCode.code);
    }
  };

  return (
    <Card style={{ marginTop: spacing.md }}>
      <Text style={[typography.heading3, { color: colors.text }]}>
        Invite a Friend
      </Text>
      <Text style={[typography.body, { color: colors.textSoft, marginTop: spacing.xs }]}>
        Share your invite code so friends can join and learn alongside you.
      </Text>

      {inviteCode ? (
        <View style={styles.codeSection}>
          <View style={[styles.codeBox, { backgroundColor: colors.primarySoft }]}>
            <Text style={[typography.heading2, { color: colors.primary, letterSpacing: 2 }]}>
              {inviteCode.code}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Expires {new Date(inviteCode.expiresAt).toLocaleDateString()}
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <Button title="Share Code" onPress={handleShare} variant="secondary" />
          </View>
        </View>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Invite a Friend"
            onPress={handleInvite}
            disabled={generating}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  codeSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  codeBox: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
});
