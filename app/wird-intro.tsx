import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { useColors } from "../src/design/theme";
import { spacing, fontFamilies } from "../src/design/tokens";
import { ArabicText, Button } from "../src/design/components";
import { useProgress } from "../src/hooks/useProgress";

const TOTAL_STEPS = 3;
const REVEAL_DURATION = 600;
const REVEAL_EASE = Easing.out(Easing.cubic);

// ── RevealSlot — always mounted, animates visibility without layout shift ──

function RevealSlot({
  visible,
  delay = 0,
  translateY: ty = 10,
  children,
  style,
}: {
  visible: boolean;
  delay?: number;
  translateY?: number;
  children: React.ReactNode;
  style?: any;
}) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(ty);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(delay, withTiming(1, { duration: REVEAL_DURATION, easing: REVEAL_EASE }));
      y.value = withDelay(delay, withTiming(0, { duration: REVEAL_DURATION, easing: REVEAL_EASE }));
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]} pointerEvents={visible ? "auto" : "none"}>
      {children}
    </Animated.View>
  );
}

// ── Progress bar — accent-colored fills matching web ──

function ProgressBar({ current, colors }: { current: number; colors: any }) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View key={i} style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: i <= current ? colors.accent : "transparent",
                width: i < current ? "100%" : i === current ? "50%" : "0%",
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

// ── Word-by-word text reveal (matches web WordReveal) ──

function WordReveal({
  text,
  baseDelay = 0,
  style,
}: {
  text: string;
  baseDelay?: number;
  style: any;
}) {
  const words = text.split(" ");
  return (
    <View style={styles.wordRevealRow}>
      {words.map((word, i) => (
        <Animated.Text
          key={i}
          entering={FadeInDown.delay(baseDelay + i * 90)
            .duration(500)
            .easing(Easing.out(Easing.cubic))}
          style={[style, { marginRight: 5 }]}
        >
          {word}
        </Animated.Text>
      ))}
    </View>
  );
}

// ── Ring pulse animation (used in Step 3) ──

function RingPulse({ color, size, active }: { color: string; size: number; active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(0.5, { duration: 50 });
      scale.value = withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) });
      opacity.value = withDelay(50, withTiming(0, { duration: 1150, easing: Easing.out(Easing.ease) }));
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// ── Sparkle particles (used in Step 3 moon fill) ──

function Sparkle({
  angle,
  distance,
  sDelay,
  size,
  color,
  active,
}: {
  angle: number;
  distance: number;
  sDelay: number;
  size: number;
  color: string;
  active: boolean;
}) {
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const sparkleScale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: 50 });
      translateX.value = withDelay(sDelay, withTiming(tx, { duration: 600, easing: Easing.out(Easing.ease) }));
      translateY.value = withDelay(sDelay, withTiming(ty, { duration: 600, easing: Easing.out(Easing.ease) }));
      opacity.value = withDelay(sDelay, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
      sparkleScale.value = withDelay(sDelay, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: sparkleScale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// Stable particle data — computed once outside render
const SPARKLE_DATA = Array.from({ length: 8 }, (_, i) => ({
  angle: (i / 8) * 2 * Math.PI,
  distance: 30 + ((i * 7 + 3) % 5) * 5, // deterministic pseudo-random
  sDelay: ((i * 31) % 200),
  size: 3 + ((i * 13) % 4),
}));

function SparkleGroup({ color, active }: { color: string; active: boolean }) {
  return (
    <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
      {SPARKLE_DATA.map((p, i) => (
        <Sparkle key={i} {...p} color={color} active={active} />
      ))}
    </View>
  );
}

// ── Crescent + Arch brand mark SVG (matches web Step 3) ──

function BrandMark({ colors, filled }: { colors: any; filled: boolean }) {
  const accent = colors.accent;
  const bg = colors.bgWarm;

  if (!filled) {
    return (
      <Svg width={130} height={170} viewBox="0 0 130 170" fill="none">
        <Path d="M26 158 L26 72 Q26 8 65 2 Q104 8 104 72 L104 158" stroke={accent} strokeWidth={2} strokeLinecap="round" opacity={0.3} strokeDasharray="4 4" />
        <Circle cx={65} cy={65} r={30} stroke={accent} strokeWidth={1.5} opacity={0.2} strokeDasharray="3 3" />
      </Svg>
    );
  }

  return (
    <Svg width={130} height={170} viewBox="0 0 130 170" fill="none">
      <Path d="M26 158 L26 72 Q26 8 65 2 Q104 8 104 72 L104 158" stroke={accent} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <Path d="M36 158 L36 76 Q36 20 65 12 Q94 20 94 76 L94 158" stroke={accent} strokeWidth={0.8} opacity={0.25} />
      <Circle cx={65} cy={2} r={3} fill={accent} opacity={0.8} />
      <Circle cx={26} cy={158} r={1.5} fill={accent} opacity={0.3} />
      <Circle cx={104} cy={158} r={1.5} fill={accent} opacity={0.3} />
      <Circle cx={65} cy={65} r={30} fill={accent} />
      <Circle cx={74} cy={56} r={24} fill={bg} />
      <Circle cx={42} cy={34} r={2} fill={accent} opacity={0.4} />
      <Circle cx={90} cy={40} r={1.6} fill={accent} opacity={0.35} />
      <Circle cx={82} cy={26} r={1.3} fill={accent} opacity={0.3} />
    </Svg>
  );
}

// ══════════════════════════════════════════════
// Step 1 — Hadith (word-by-word, no layout shift)
// ══════════════════════════════════════════════

function StepHadith({ onNext, colors }: { onNext: () => void; colors: any }) {
  const [phase, setPhase] = useState(0);

  // Glow pulse — builds warmth as hadith reveals
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Glow fades in as hadith starts
    glowOpacity.value = withDelay(200, withTiming(1, { duration: 1200, easing: REVEAL_EASE }));
    glowScale.value = withDelay(200, withTiming(1, { duration: 1500, easing: REVEAL_EASE }));

    const t1 = setTimeout(() => { setPhase(1); }, 2800);
    const t2 = setTimeout(() => setPhase(2), 3800);
    const t3 = setTimeout(() => setPhase(3), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.stepContent}>
      {/* Radial glow background — scale entrance */}
      <Animated.View style={[styles.glowOrbWrap, glowAnimStyle]} pointerEvents="none">
        <Svg width={320} height={320} viewBox="0 0 320 320">
          <Defs>
            <RadialGradient id="hadithGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#C4A464" stopOpacity={0.18} />
              <Stop offset="40%" stopColor="#C4A464" stopOpacity={0.06} />
              <Stop offset="70%" stopColor="#C4A464" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={320} height={320} fill="url(#hadithGlow)" />
        </Svg>
      </Animated.View>

      {/* Word-by-word hadith reveal — slightly slower base delay for gravitas */}
      <WordReveal
        text={"\u201CThe most beloved deeds to Allah are those done consistently, even if they are small.\u201D"}
        baseDelay={500}
        style={[styles.hadithText, { color: colors.text }]}
      />

      {/* Divider — always mounted */}
      <RevealSlot visible={phase >= 1} translateY={0}>
        <View style={[styles.divider, { backgroundColor: colors.accent }]} />
      </RevealSlot>

      {/* Attribution — always mounted */}
      <RevealSlot visible={phase >= 1} delay={150}>
        <Text style={[styles.attribution, { color: colors.textMuted }]}>Prophet Muhammad</Text>
      </RevealSlot>

      {/* Salawat + reference — always mounted */}
      <RevealSlot visible={phase >= 2} delay={50} style={{ alignItems: "center" }}>
        <ArabicText
          size="large"
          color={colors.accent}
          style={{ textAlign: "center", marginTop: 4, fontSize: 42 }}
        >
          {"\uFDFA"}
        </ArabicText>
        <Text style={[styles.reference, { color: colors.textMuted }]}>Sahih al-Bukhari 6464</Text>
      </RevealSlot>

      {/* CTA — always mounted */}
      <RevealSlot visible={phase >= 3} translateY={14} style={styles.buttonWrap}>
        <Button title="Continue" onPress={onNext} />
      </RevealSlot>
    </View>
  );
}

// ══════════════════════════════════════════════
// Step 2 — What is Wird? (no layout shift)
// ══════════════════════════════════════════════

function StepMeaning({ onNext, colors }: { onNext: () => void; colors: any }) {
  // Scale+fade entrance for Arabic — slower, more ceremonial
  const arabicScale = useSharedValue(0.5);
  const arabicOpacity = useSharedValue(0);

  // Subtle glow behind Arabic word
  const arabicGlowOpacity = useSharedValue(0);

  useEffect(() => {
    arabicOpacity.value = withDelay(100, withTiming(1, { duration: 1200, easing: REVEAL_EASE }));
    arabicScale.value = withDelay(100, withTiming(1, { duration: 1200, easing: REVEAL_EASE }));
    arabicGlowOpacity.value = withDelay(300, withTiming(1, { duration: 1000, easing: REVEAL_EASE }));
  }, []);

  const arabicAnimStyle = useAnimatedStyle(() => ({
    opacity: arabicOpacity.value,
    transform: [{ scale: arabicScale.value }],
  }));

  const arabicGlowStyle = useAnimatedStyle(() => ({
    opacity: arabicGlowOpacity.value,
  }));

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => { setPhase(1); }, 1800);
    const t2 = setTimeout(() => setPhase(2), 3200);
    const t3 = setTimeout(() => setPhase(3), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <View style={styles.stepContent}>
      {/* Subtle glow behind Arabic */}
      <Animated.View style={[styles.meaningGlowWrap, arabicGlowStyle]} pointerEvents="none">
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="meaningGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#C4A464" stopOpacity={0.12} />
              <Stop offset="60%" stopColor="#C4A464" stopOpacity={0.02} />
              <Stop offset="80%" stopColor="#C4A464" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={200} height={200} fill="url(#meaningGlow)" />
        </Svg>
      </Animated.View>

      {/* Arabic word — scale+fade entrance */}
      <Animated.View style={[styles.arabicWirdWrap, arabicAnimStyle]}>
        <Text style={[styles.arabicWird, { color: colors.text }]}>
          {"\u0648\u0650\u0631\u0652\u062F"}
        </Text>
      </Animated.View>

      {/* Transliteration */}
      <Animated.View entering={FadeInDown.delay(800).duration(500).easing(REVEAL_EASE)}>
        <Text style={[styles.transliteration, { color: colors.accent }]}>wird</Text>
      </Animated.View>

      {/* First paragraph — always mounted */}
      <RevealSlot visible={phase >= 1}>
        <Text style={[styles.meaningText, { color: colors.textSoft }]}>
          A{" "}
          <Text style={{ fontFamily: fontFamilies.bodyBold, color: colors.accent }}>Wird</Text>{" "}
          is a daily spiritual practice {"\u2014"} a portion of worship you return to each day,
          no matter how small.
        </Text>
      </RevealSlot>

      {/* Second paragraph — always mounted */}
      <RevealSlot visible={phase >= 2}>
        <Text style={[styles.meaningText, { color: colors.textSoft, marginTop: 14 }]}>
          In Tila, your Wird is your daily streak. Each day you practice, your Wird grows. It
          {"\u2019"}s not about perfection {"\u2014"} it{"\u2019"}s about showing up.
        </Text>
      </RevealSlot>

      {/* CTA — always mounted */}
      <RevealSlot visible={phase >= 3} translateY={14} style={styles.buttonWrap}>
        <Button title="Continue" onPress={onNext} />
      </RevealSlot>
    </View>
  );
}

// ══════════════════════════════════════════════
// Step 3 — Your First Wird (no layout shift)
// ══════════════════════════════════════════════

function StepFirstWird({ onComplete, colors }: { onComplete: () => void; colors: any }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => { setPhase(3); }, 3200);
    const t4 = setTimeout(() => setPhase(4), 4200);
    const t5 = setTimeout(() => setPhase(5), 5400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  // Float animation for filled brand mark
  const floatY = useSharedValue(0);
  useEffect(() => {
    if (phase >= 2) {
      floatY.value = withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    }
  }, [phase]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Brand mark cross-fade: empty opacity fades out, filled fades in
  const emptyOpacity = useSharedValue(0);
  const filledOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase >= 1) {
      emptyOpacity.value = withTiming(1, { duration: 600, easing: REVEAL_EASE });
    }
    if (phase >= 2) {
      emptyOpacity.value = withTiming(0, { duration: 400, easing: REVEAL_EASE });
      filledOpacity.value = withTiming(1, { duration: 800, easing: REVEAL_EASE });
    }
  }, [phase]);

  const emptyStyle = useAnimatedStyle(() => ({ opacity: emptyOpacity.value }));
  const filledStyle = useAnimatedStyle(() => ({ opacity: filledOpacity.value }));

  // Glow fade
  const glowOpacity = useSharedValue(0);
  useEffect(() => {
    if (phase >= 1) {
      glowOpacity.value = withTiming(1, { duration: 1000, easing: REVEAL_EASE });
    }
  }, [phase]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={styles.stepContent}>
      {/* Heading — entering animation (first render, no shift) */}
      <Animated.View entering={FadeInDown.delay(100).duration(600).easing(REVEAL_EASE)}>
        <Text style={[styles.wirdHeading, { color: colors.text }]}>A Sacred Daily Practice</Text>
      </Animated.View>

      {/* Brand mark hero — fixed-size container, no layout shift */}
      <View style={styles.brandMarkContainer}>
        {/* Radial glow — always mounted, opacity animated */}
        <Animated.View style={[styles.brandMarkGlow, glowStyle]} pointerEvents="none">
          <Svg width={190} height={230} viewBox="0 0 190 230">
            <Defs>
              <RadialGradient id="moonGlow" cx="50%" cy="45%" r="50%">
                <Stop offset="0%" stopColor="#C4A464" stopOpacity={0.16} />
                <Stop offset="50%" stopColor="#C4A464" stopOpacity={0.05} />
                <Stop offset="70%" stopColor="#C4A464" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={190} height={230} fill="url(#moonGlow)" />
          </Svg>
        </Animated.View>

        {/* Empty state — always mounted, cross-fades out */}
        <Animated.View style={[styles.brandMarkAbsolute, emptyStyle]} pointerEvents="none">
          <BrandMark colors={colors} filled={false} />
        </Animated.View>

        {/* Filled state — always mounted, cross-fades in + floats */}
        <Animated.View style={[styles.brandMarkAbsolute, filledStyle, floatStyle]} pointerEvents="none">
          <BrandMark colors={colors} filled={true} />
        </Animated.View>

        {/* Ring pulse — always mounted, triggers on phase 2 */}
        <View style={styles.ringPulseContainer}>
          <RingPulse color="rgba(196,164,100,0.3)" size={100} active={phase >= 2} />
        </View>

        {/* Sparkle particles — always mounted, triggers on phase 2 */}
        <SparkleGroup color={colors.accent} active={phase >= 2} />
      </View>

      {/* Day counter + caption — always mounted */}
      <RevealSlot visible={phase >= 3} style={{ alignItems: "center", marginBottom: 8 }}>
        <Text style={[styles.dayCounter, { color: colors.accent }]}>Day 1</Text>
        <Text style={[styles.dayCaption, { color: colors.textSoft }]}>Your Wird has begun</Text>
      </RevealSlot>

      {/* Subtext + Quran quote — always mounted */}
      <RevealSlot visible={phase >= 4} style={{ alignItems: "center", marginTop: spacing.lg }}>
        <Text style={[styles.wirdSubtext, { color: colors.textSoft }]}>
          Come back tomorrow to keep it growing.
        </Text>
        <Text style={[styles.quranQuote, { color: colors.textMuted }]}>
          And whoever holds firmly to Allah has been guided to a straight path.
        </Text>
        <Text style={[styles.quranRef, { color: colors.textMuted }]}>
          {"\u2014"} Quran 3:101
        </Text>
      </RevealSlot>

      {/* Button — always mounted */}
      <RevealSlot visible={phase >= 5} translateY={14} style={styles.buttonWrap}>
        <Button title="I\u2019m in" onPress={onComplete} />
      </RevealSlot>
    </View>
  );
}

// ── Main ──

export default function WirdIntroScreen() {
  const colors = useColors();
  const progress = useProgress();
  const [step, setStep] = useState(0);

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      progress.updateProfile({ wirdIntroSeen: true });
      router.replace("/(tabs)");
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgWarm }]}>
      <View style={styles.progressContainer}>
        <ProgressBar current={step} colors={colors} />
      </View>

      {step === 0 && <StepHadith onNext={goNext} colors={colors} />}
      {step === 1 && <StepMeaning onNext={goNext} colors={colors} />}
      {step === 2 && <StepFirstWird onComplete={goNext} colors={colors} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  progressBar: {
    flexDirection: "row",
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 340,
    marginTop: spacing.xxl,
  },

  // Word-by-word reveal
  wordRevealRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 320,
    marginBottom: spacing.sm,
  },

  // Glow orb (hadith step)
  glowOrbWrap: {
    position: "absolute",
    width: 320,
    height: 320,
  },

  // Step 1: Hadith
  hadithText: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 22,
    lineHeight: 34,
    textAlign: "center",
  },
  divider: {
    width: 56,
    height: 2,
    borderRadius: 1,
    marginVertical: 22,
    opacity: 0.6,
    alignSelf: "center",
  },
  attribution: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    textAlign: "center",
    marginBottom: 4,
  },
  reference: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyRegular,
    fontStyle: "italic",
    textAlign: "center",
    opacity: 0.6,
    marginTop: spacing.sm,
  },

  // Step 2: Meaning
  meaningGlowWrap: {
    position: "absolute",
    width: 200,
    height: 200,
    top: "25%",
  },
  arabicWirdWrap: {
    marginBottom: 8,
    alignItems: "center",
  },
  arabicWird: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 80,
    lineHeight: 130,
    textAlign: "center",
    writingDirection: "rtl",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  transliteration: {
    fontSize: 16,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: spacing.xl,
    textTransform: "lowercase",
  },
  meaningText: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 310,
  },

  // Step 3: First Wird
  wirdHeading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  brandMarkContainer: {
    width: 130,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  brandMarkGlow: {
    position: "absolute",
    width: 190,
    height: 230,
    left: -30,
    top: -30,
  },
  brandMarkAbsolute: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringPulseContainer: {
    position: "absolute",
    top: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCounter: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    textAlign: "center",
  },
  dayCaption: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    marginTop: 4,
  },
  wirdSubtext: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 22,
    textAlign: "center",
  },
  quranQuote: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 22,
  },
  quranRef: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.7,
  },
});
