import { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withSpring,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Rect, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import {
  spacing,
  radii,
  shadows,
  fontFamilies,
  borderWidths,
} from "../../../design/tokens";
import { springs, pressScale } from "../../../design/animations";
import { hapticTap } from "../../../design/haptics";
import {
  STAGGER_BASE,
  STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MAX_WIDTH = 380;
const CARD_H_PADDING = 28;

// ── Local AudioPill button (screen-specific, does not touch shared HearButton) ──

function AudioPill({
  onPlay,
  hasPlayed,
}: {
  onPlay: () => Promise<void>;
  hasPlayed: boolean;
}) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(pressScale.subtle, springs.press);
  }

  function handlePressOut() {
    scale.value = withSpring(1, springs.press);
  }

  const handlePress = useCallback(async () => {
    if (loading) return;
    hapticTap();
    setLoading(true);
    try {
      await onPlay();
    } finally {
      setLoading(false);
    }
  }, [onPlay, loading]);

  return (
    <Animated.View style={[{ position: "relative", alignItems: "center" }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={[
          pillStyles.button,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            opacity: loading ? 0.7 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={hasPlayed ? "Hear Alif again" : "Hear Alif"}
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.primary}>
          <Path d="M5,3 L19,12 L5,21 Z" />
        </Svg>
        <Text style={[pillStyles.label, { color: colors.primary }]}>
          {hasPlayed ? "Hear again" : "Hear it"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const pillStyles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: radii.full,
    borderWidth: 1.5,
    ...shadows.soft,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
});

// ── Pulse ring (shown before first play) ──

function PulseRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.45);

  // Start pulsing on mount
  scale.value = withRepeat(
    withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
    -1,
    false
  );
  opacity.value = withRepeat(
    withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
    -1,
    false
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// ── Main component ──

export function LetterAudio({
  onNext,
  onPlayAudio,
  hasPlayedAudio,
}: {
  onNext: () => void;
  onPlayAudio: () => Promise<void>;
  hasPlayedAudio: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Floating / breathing animation for the letter circle
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Stagger delays
  const labelDelay = 0;
  const circleDelay = STAGGER_BASE;
  const playDelay = STAGGER_BASE * 2;
  const ctaDelay = STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <Animated.View
      entering={FadeIn.duration(STAGGER_DURATION)}
      style={[styles.root, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
    >
      {/* Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        {/* ── Label ── */}
        <Animated.Text
          entering={FadeInDown.delay(labelDelay).duration(STAGGER_DURATION)}
          style={[styles.firstWinLabel, { color: colors.accent }]}
        >
          YOUR FIRST LETTER
        </Animated.Text>

        {/* ── Letter focal area ── */}
        <Animated.View
          entering={FadeIn.delay(circleDelay).duration(STAGGER_DURATION)}
          style={styles.letterArea}
        >
          {/* Radial glow behind circle — true radial gradient matching web */}
          <View style={styles.letterGlow} pointerEvents="none">
            <Svg width={160} height={160} viewBox="0 0 160 160">
              <Defs>
                <RadialGradient id="letterGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#C4A464" stopOpacity={0.14} />
                  <Stop offset="55%" stopColor="#C4A464" stopOpacity={0.04} />
                  <Stop offset="72%" stopColor="#C4A464" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={160} height={160} fill="url(#letterGlow)" />
            </Svg>
          </View>

          {/* Floating circle */}
          <Animated.View style={[styles.letterCircleWrap, floatStyle]}>
            <View style={styles.letterCircle}>
              <ArabicText
                size="display"
                color={colors.primaryDark}
                style={{ marginTop: 6 }}
              >
                {"\u0627"}
              </ArabicText>
            </View>
          </Animated.View>

          {/* Name */}
          <Text style={[styles.letterName, { color: colors.textMuted }]}>
            Alif
          </Text>
        </Animated.View>

        {/* ── Hear button with pulse ring ── */}
        <Animated.View
          entering={FadeIn.delay(playDelay).duration(STAGGER_DURATION)}
          style={styles.hearArea}
        >
          {/* Pulse hint ring — only before first play */}
          {!hasPlayedAudio && <PulseRing color={colors.accent} />}
          <AudioPill onPlay={onPlayAudio} hasPlayed={hasPlayedAudio} />
        </Animated.View>

        {/* ── CTA inside card ── */}
        <Animated.View
          entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}
          style={styles.ctaArea}
        >
          <Button title="Continue" onPress={onNext} style={styles.ctaButton} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Card ──
  card: {
    width: Math.min(SCREEN_WIDTH - spacing.xl * 2, CARD_MAX_WIDTH),
    borderRadius: radii.xl,
    borderWidth: borderWidths.thin,
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: CARD_H_PADDING,
    alignItems: "center",
    ...shadows.card,
  },

  // ── Label ──
  firstWinLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  // ── Letter focal ──
  letterArea: {
    alignItems: "center",
    marginBottom: spacing.xl,
    position: "relative",
  },
  letterGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    top: -20,
  },
  letterCircleWrap: {
    // Wrapper for floating animation
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F2F5F3",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    // Inner + outer depth matching web
    shadowColor: "#163323",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  letterName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },

  // ── Hear button area ──
  hearArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
    height: 56,
  },

  // ── CTA ──
  ctaArea: {
    width: "100%",
  },
  ctaButton: {
    width: "100%",
  },
});
