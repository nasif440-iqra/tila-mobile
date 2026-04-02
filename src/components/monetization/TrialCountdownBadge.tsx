import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useColors } from '../../design/theme';
import { spacing, fontFamilies } from '../../design/tokens';
import { CrescentIcon } from '../../design/CrescentIcon';

// ── Types ──

interface TrialCountdownBadgeProps {
  daysLeft: number;
}

// ── Component ──

/**
 * Trial countdown pill badge.
 * Displays days remaining in trial period. Parent is responsible for
 * conditional rendering (only when stage === "trial" && trialDaysRemaining !== null).
 */
export function TrialCountdownBadge({ daysLeft }: TrialCountdownBadgeProps) {
  const colors = useColors();

  const label = daysLeft === 0 ? 'Last day!' : `${daysLeft} days left`;

  return (
    <Animated.View entering={FadeIn}>
      <View style={[styles.pill, { borderColor: colors.accent }]}>
        <CrescentIcon size={12} color={colors.accent} />
        <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
  },
});
