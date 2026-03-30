import { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import Svg, { Path } from "react-native-svg";
import { ArabicText } from "../../design/components";
import { playLetterName, playLetterSound } from "../../audio/player";
import { hapticTap } from "../../design/haptics";
import { deriveMasteryState } from "../../engine/mastery";
import type { EntityState } from "../../types/mastery";

interface LetterData {
  id: number;
  letter: string;
  name: string;
  transliteration: string;
  sound: string;
  tip: string;
  visualRule: string;
  family: string;
  soundHint: string;
  dots: number;
  dotPos: string;
}

interface LetterDetailSheetProps {
  letter: LetterData | null;
  entity: EntityState | null;
  today: string;
  visible: boolean;
  onClose: () => void;
}

const MASTERY_LABELS: Record<string, { label: string; color: "primary" | "accent" | "textMuted" }> = {
  retained: { label: "Retained", color: "primary" },
  accurate: { label: "Accurate", color: "primary" },
  unstable: { label: "Unstable", color: "accent" },
  introduced: { label: "Introduced", color: "textMuted" },
  not_started: { label: "Not Started", color: "textMuted" },
};

export function LetterDetailSheet({
  letter,
  entity,
  today,
  visible,
  onClose,
}: LetterDetailSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handlePlayName = useCallback(() => {
    if (letter) playLetterName(letter.id);
  }, [letter]);

  const handlePlaySound = useCallback(() => {
    if (letter) playLetterSound(letter.id);
  }, [letter]);

  // ── Motion: timing-based, no springs ──
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(20);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset to start position, then animate in
      backdropOpacity.value = 0;
      sheetTranslateY.value = 20;
      sheetOpacity.value = 0;
      backdropOpacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
      sheetTranslateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
      sheetOpacity.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    // Exit animation, then close
    backdropOpacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) });
    sheetOpacity.value = withTiming(0, { duration: 180, easing: Easing.inOut(Easing.cubic) });
    sheetTranslateY.value = withTiming(12, { duration: 180, easing: Easing.inOut(Easing.cubic) }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!letter) return null;

  const state = entity ? deriveMasteryState(entity, today) : "not_started";
  const masteryInfo = MASTERY_LABELS[state] ?? MASTERY_LABELS.not_started;
  const hasStats = entity && entity.attempts > 0;
  const accuracy =
    hasStats ? Math.round((entity.correct / entity.attempts) * 100) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.bgCard,
            paddingBottom: Math.max(insets.bottom, spacing.xl),
          },
          sheetAnimStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header: circle + name */}
        <View style={styles.header}>
          <View
            style={[
              styles.letterCircle,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary,
              },
            ]}
          >
            <ArabicText size="large" color={colors.primaryDark}>
              {letter.letter}
            </ArabicText>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.letterName, { color: colors.text }]}>
              {letter.name}
            </Text>
            <Text style={[styles.letterHint, { color: colors.accent }]}>
              {"\u201C"}{letter.transliteration}{"\u201D"} {"\u2014"} {letter.soundHint}
            </Text>
          </View>
        </View>

        {/* Tip */}
        <Text style={[styles.tip, { color: colors.textSoft }]}>
          {letter.tip}
        </Text>

        {/* Audio buttons */}
        <View style={styles.audioRow}>
          <Pressable
            onPress={() => { hapticTap(); handlePlayName(); }}
            style={[styles.audioButton, { borderColor: colors.border }]}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M11 5L6 9H2v6h4l5 4V5z" fill={colors.primary} />
              <Path d="M15.54 8.46a5 5 0 010 7.07" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={[styles.audioLabel, { color: colors.primary }]}>
              Hear name
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { hapticTap(); handlePlaySound(); }}
            style={[styles.audioButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M11 5L6 9H2v6h4l5 4V5z" fill={colors.white} />
              <Path d="M15.54 8.46a5 5 0 010 7.07" stroke={colors.white} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={[styles.audioLabel, { color: colors.white }]}>
              Hear sound
            </Text>
          </Pressable>
        </View>

        {/* Stats row */}
        {hasStats && (
          <View style={[styles.statsRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {entity.correct}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                /{entity.attempts} correct
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      accuracy! >= 80
                        ? colors.primary
                        : accuracy! >= 50
                        ? colors.accent
                        : colors.danger,
                  },
                ]}
              >
                {accuracy}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {" "}accuracy
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.masteryBadge, { color: colors[masteryInfo.color] }]}>
                {masteryInfo.label}
              </Text>
            </View>
          </View>
        )}

        {/* Visual rule */}
        <View style={[styles.visualRule, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[styles.visualRuleLabel, { color: colors.textMuted }]}>
            VISUAL
          </Text>
          <Text style={[styles.visualRuleText, { color: colors.textSoft }]}>
            {letter.visualRule}
          </Text>
          <Text style={[styles.familyLabel, { color: colors.textMuted }]}>
            Family: {letter.family}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  letterCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  letterName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  letterHint: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  tip: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  audioRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  audioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  audioLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  statLabel: {
    ...typography.caption,
  },
  statDivider: {
    width: 1,
    height: 20,
    marginHorizontal: spacing.sm,
  },
  masteryBadge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  visualRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  visualRuleLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  visualRuleText: {
    ...typography.bodySmall,
    flex: 1,
  },
  familyLabel: {
    ...typography.caption,
    fontSize: 10,
  },
});
