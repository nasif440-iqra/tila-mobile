import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '../../design/theme';
import {
  typography,
  fontFamilies,
  spacing,
  radii,
  borderWidths,
  shadows,
} from '../../design/tokens';
import { Button } from '../../design/components/Button';
import { trackScholarshipTapped } from '../../monetization/analytics';

// ── Types ──

interface UpgradeCardProps {
  variant: 'lesson-7-cta' | 'locked-gate';
  onStartTrial: () => void;
  onScholarship?: () => void;
}

// ── Variant Content ──

const VARIANT_CONTENT = {
  'lesson-7-cta': {
    heading: 'Ready to keep going?',
    body: 'Start your free 7-day trial and unlock the full Tila experience.',
  },
  'locked-gate': {
    heading: 'Unlock with Tila Premium',
    body: 'Get full access to all lessons, advanced exercises, and personalized review scheduling.',
  },
} as const;

// ── Component ──

export function UpgradeCard({ variant, onStartTrial, onScholarship }: UpgradeCardProps) {
  const colors = useColors();
  const content = VARIANT_CONTENT[variant];

  function handleScholarshipPress() {
    trackScholarshipTapped(variant);
    onScholarship?.();
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bg,
          borderColor: colors.accent,
          ...shadows.card,
        },
      ]}
    >
      {/* Heading */}
      <Text style={[typography.heading2, { color: colors.text }]}>
        {content.heading}
      </Text>

      {/* Body */}
      <Text style={[typography.body, styles.bodyText, { color: colors.textSoft }]}>
        {content.body}
      </Text>

      {/* Pricing Display */}
      <View style={styles.pricingSection}>
        <Text style={[typography.heading2, { color: colors.text }]}>
          $4.17/mo
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
          billed yearly at $49.99
        </Text>
        <Text
          style={[
            typography.caption,
            styles.monthlyPrice,
            { color: colors.textMuted },
          ]}
        >
          $8.99/mo billed monthly
        </Text>
      </View>

      {/* CTA Button */}
      <Button title="Start Free Trial" onPress={onStartTrial} />

      {/* Scholarship Section */}
      {onScholarship && (
        <View style={styles.scholarshipSection}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text
            style={[
              typography.bodySmall,
              styles.scholarshipCopy,
              { color: colors.textMuted },
            ]}
          >
            Financial hardship should never prevent Quran learning.
          </Text>
          <Pressable onPress={handleScholarshipPress}>
            <Text
              style={[
                typography.bodySmall,
                styles.scholarshipLink,
                { color: colors.accent },
              ]}
            >
              Request a Scholarship
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    borderWidth: borderWidths.normal,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  bodyText: {
    marginTop: spacing.sm,
  },
  pricingSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  monthlyPrice: {
    marginTop: spacing.xs,
  },
  scholarshipSection: {
    marginTop: spacing.lg,
  },
  divider: {
    height: 1,
    marginBottom: spacing.lg,
  },
  scholarshipCopy: {
    fontFamily: fontFamilies.headingItalic,
    fontStyle: 'italic',
  },
  scholarshipLink: {
    marginTop: spacing.sm,
    textDecorationLine: 'underline',
  },
});
