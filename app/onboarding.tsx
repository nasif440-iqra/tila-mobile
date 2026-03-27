import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useProgress } from "../src/hooks/useProgress";
import { useColors } from "../src/design/theme";
import { ArabicText, Button, HearButton } from "../src/design/components";
import {
  typography,
  spacing,
  radii,
  fontFamilies,
} from "../src/design/tokens";
import { getLetterAsset, getSFXAsset } from "../src/audio/player";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TOTAL_STEPS = 8;

// ── Floating letters data (matches web app exactly) ──

const floatingLetters = [
  { char: "\u0628", top: "3%", left: "8%", size: 30, opacity: 0.09, axis: "y" as const, range: 8, duration: 16000 },
  { char: "\u0646", top: "5%", left: "52%", size: 26, opacity: 0.07, axis: "y" as const, range: -6, duration: 18000 },
  { char: "\u0643", top: "7%", left: "86%", size: 28, opacity: 0.08, axis: "x" as const, range: 6, duration: 20000 },
  { char: "\u0639", top: "22%", left: "3%", size: 24, opacity: 0.08, axis: "y" as const, range: 7, duration: 15000 },
  { char: "\u0642", top: "19%", left: "91%", size: 28, opacity: 0.07, axis: "y" as const, range: -7, duration: 17000 },
  { char: "\u062F", top: "40%", left: "5%", size: 26, opacity: 0.07, axis: "x" as const, range: 5, duration: 19000 },
  { char: "\u0633", top: "44%", left: "89%", size: 24, opacity: 0.08, axis: "y" as const, range: 6, duration: 16000 },
  { char: "\u0631", top: "62%", left: "7%", size: 28, opacity: 0.09, axis: "y" as const, range: -6, duration: 18000 },
  { char: "\u064A", top: "58%", left: "92%", size: 26, opacity: 0.07, axis: "x" as const, range: -5, duration: 20000 },
  { char: "\u0645", top: "78%", left: "10%", size: 24, opacity: 0.08, axis: "y" as const, range: 7, duration: 17000 },
  { char: "\u0647", top: "76%", left: "50%", size: 28, opacity: 0.07, axis: "y" as const, range: -5, duration: 19000 },
  { char: "\u062A", top: "82%", left: "85%", size: 26, opacity: 0.08, axis: "x" as const, range: 6, duration: 16000 },
];

// ── Starting point options (matches web app) ──

const startingPointOptions = [
  { label: "I'm completely new", value: "new" as const },
  { label: "I know a few letters", value: "some_arabic" as const },
  { label: "I used to learn, but forgot a lot", value: "some_arabic" as const },
  { label: "I can read a little, but want stronger basics", value: "can_read" as const },
];

// ── Floating Letter Component ──

function FloatingLetter({
  char,
  top,
  left,
  size,
  opacity,
  axis,
  range,
  duration,
  color,
  index,
}: {
  char: string;
  top: string;
  left: string;
  size: number;
  opacity: number;
  axis: "x" | "y";
  range: number;
  duration: number;
  color: string;
  index: number;
}) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      index * 60,
      withRepeat(
        withSequence(
          withTiming(range, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform:
      axis === "y"
        ? [{ translateY: offset.value }]
        : [{ translateX: offset.value }],
  }));

  const topPercent = parseFloat(top) / 100;
  const leftPercent = parseFloat(left) / 100;

  return (
    <Animated.Text
      entering={FadeInDown.delay(index * 60).duration(800)}
      style={[
        {
          position: "absolute",
          top: topPercent * SCREEN_HEIGHT,
          left: leftPercent * SCREEN_WIDTH,
          fontFamily: fontFamilies.arabicRegular,
          fontSize: size,
          color: color,
          opacity: opacity,
          writingDirection: "rtl",
        },
        animStyle,
      ]}
    >
      {char}
    </Animated.Text>
  );
}

// ── Floating Letters Layer ──

function FloatingLettersLayer({ color }: { color: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {floatingLetters.map((l, i) => (
        <FloatingLetter key={i} {...l} color={color} index={i} />
      ))}
    </View>
  );
}

// ── Progress Bar ──

function ProgressBar({
  current,
  total,
  colors,
}: {
  current: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={progressStyles.bar}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[progressStyles.track, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              progressStyles.fill,
              {
                backgroundColor: colors.primary,
                width: i < current ? "100%" : i === current ? "50%" : "0%",
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});

// ── Option Card ──

function OptionCard({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        optionStyles.card,
        {
          backgroundColor: selected ? colors.primarySoft : colors.bgCard,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          optionStyles.label,
          { color: selected ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const optionStyles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodyLarge,
    textAlign: "center",
  },
});

// ── Warm Glow (approximation of radial-gradient) ──

function WarmGlow({ size = 340, opacity = 0.12 }: { size?: number; opacity?: number }) {
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(196, 164, 100, " + opacity + ")",
      }}
    />
  );
}

// ── Logo SVG (arch + crescent mark) ──

function LogoMark({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Svg width={120} height={160} viewBox="0 0 120 160" fill="none">
      {/* Arch */}
      <Path
        d="M24 148 L24 68 Q24 8 60 2 Q96 8 96 68 L96 148"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M34 148 L34 72 Q34 20 60 12 Q86 20 86 72 L86 148"
        stroke={colors.primary}
        strokeWidth={0.8}
        opacity={0.2}
      />
      {/* Keystone */}
      <Circle cx={60} cy={2} r={3} fill={colors.accent} opacity={0.8} />
      {/* Base dots */}
      <Circle cx={24} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      <Circle cx={96} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      {/* Crescent */}
      <Circle cx={60} cy={62} r={32} fill={colors.primary} />
      <Circle cx={71} cy={52} r={26} fill={colors.bgWarm} />
      {/* Stars */}
      <Circle cx={38} cy={30} r={2} fill={colors.primary} opacity={0.35} />
      <Circle cx={85} cy={36} r={1.6} fill={colors.primary} opacity={0.3} />
      <Circle cx={78} cy={22} r={1.3} fill={colors.primary} opacity={0.25} />
    </Svg>
  );
}

// ── Arch outline for hadith step ──

function ArchOutline({ color }: { color: string }) {
  return (
    <View style={{ position: "absolute", opacity: 0.12 }} pointerEvents="none">
      <Svg width={200} height={260} viewBox="0 0 200 260" fill="none">
        <Path
          d="M30 250 L30 100 Q30 10 100 2 Q170 10 170 100 L170 250"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ── Main Screen ──

export default function OnboardingScreen() {
  const colors = useColors();
  const { updateProfile } = useProgress();

  const [step, setStep] = useState(0);
  const [startingPoint, setStartingPoint] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const letterRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio players
  const alifNameAsset = getLetterAsset(1, "name");
  const alifPlayer = useAudioPlayer(alifNameAsset);
  const advanceSfx = useAudioPlayer(getSFXAsset("onboarding_advance"));
  const completeSfx = useAudioPlayer(getSFXAsset("onboarding_complete"));
  const correctSfx = useAudioPlayer(getSFXAsset("correct"));
  const tapSfx = useAudioPlayer(getSFXAsset("button_tap"));

  function goNext() {
    advanceSfx.seekTo(0);
    advanceSfx.play();
    setStep((s) => s + 1);
  }

  // Letter reveal auto-advance (step 4 -> step 5 after 3.5s)
  useEffect(() => {
    if (step === 4) {
      letterRevealTimerRef.current = setTimeout(() => {
        setStep(5);
      }, 3500);
      return () => {
        if (letterRevealTimerRef.current) clearTimeout(letterRevealTimerRef.current);
      };
    }
  }, [step]);

  const handlePlayAudio = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    alifPlayer.seekTo(0);
    alifPlayer.play();
    setHasPlayedAudio(true);
  }, [alifPlayer]);

  function handleAnswerSelect(name: string) {
    if (answerChecked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    tapSfx.seekTo(0);
    tapSfx.play();
    setSelectedAnswer(name);
  }

  function handleCheckAnswer() {
    const correct = selectedAnswer === "Alif";
    setIsCorrect(correct);
    setAnswerChecked(true);
    if (correct) {
      correctSfx.seekTo(0);
      correctSfx.play();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setAnswerChecked(false);
        setIsCorrect(null);
        setSelectedAnswer(null);
      }, 1200);
    }
  }

  async function handleFinish() {
    completeSfx.seekTo(0);
    completeSfx.play();
    await updateProfile({
      onboarded: true,
      onboardingVersion: 2,
      startingPoint: startingPoint,
      commitmentComplete: true,
    });
    router.replace("/(tabs)");
  }

  // Progress bar visibility: hidden on welcome (0), letter reveal (4), and quiz (6)
  const showProgressBar = step > 0 && step !== 4 && step !== 6 && step < 7;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgWarm }]}>
      {/* Floating Arabic letters — visible on steps 0-2 */}
      {step <= 2 && <FloatingLettersLayer color={colors.primary} />}

      {/* Progress bar */}
      {showProgressBar && (
        <View style={styles.progressContainer}>
          <ProgressBar current={step} total={TOTAL_STEPS} colors={colors} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <Animated.View
            entering={FadeIn.duration(800)}
            style={styles.splashStep}
          >
            {/* Warm ambient glow */}
            <WarmGlow size={360} opacity={0.12} />

            {/* Logo mark */}
            <Animated.View
              entering={FadeIn.delay(200).duration(1200)}
              style={{ marginBottom: 32, zIndex: 1 }}
            >
              <LogoMark colors={colors} />
            </Animated.View>

            {/* App name */}
            <Animated.Text
              entering={FadeInDown.delay(800).duration(800)}
              style={[
                styles.appName,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.headingRegular,
                  zIndex: 1,
                },
              ]}
            >
              tila
            </Animated.Text>

            {/* Brand motto */}
            <Animated.Text
              entering={FadeIn.delay(1100).duration(700)}
              style={[styles.brandMotto, { color: colors.accent, zIndex: 1 }]}
            >
              READ BEAUTIFULLY
            </Animated.Text>

            {/* Tagline */}
            <Animated.Text
              entering={FadeIn.delay(1500).duration(800)}
              style={[styles.tagline, { color: colors.textSoft, zIndex: 1 }]}
            >
              Learn to read the Quran,{"\n"}one letter at a time.
            </Animated.Text>

            <View style={styles.spacerXl} />

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(1800).duration(600)}
              style={[styles.fullWidthBtn, { zIndex: 1 }]}
            >
              <Button title="Get Started" onPress={goNext} style={styles.fullWidthBtn} />
            </Animated.View>
          </Animated.View>
        )}

        {/* ── STEP 1: Tilawat (Sacred) ── */}
        {step === 1 && (
          <Animated.View
            entering={FadeIn.duration(700)}
            style={styles.splashStep}
          >
            {/* Warm glow */}
            <WarmGlow size={300} opacity={0.15} />

            {/* Arabic calligraphy */}
            <Animated.View entering={FadeInDown.delay(150).duration(550)}>
              <ArabicText
                size="display"
                color={colors.primaryDark}
                style={{ fontSize: 72, lineHeight: 100, zIndex: 1 }}
              >
                {"\u062A\u0650\u0644\u0627\u0648\u064E\u0629"}
              </ArabicText>
            </Animated.View>

            <View style={{ height: 28 }} />

            {/* Headline */}
            <Animated.Text
              entering={FadeInDown.delay(350).duration(550)}
              style={[
                styles.sacredHeadline,
                { color: colors.text, zIndex: 1 },
              ]}
            >
              To recite the Quran beautifully is{" "}
              <Text
                style={{
                  fontFamily: fontFamilies.headingItalic,
                  color: colors.accent,
                }}
              >
                Tilawat
              </Text>
            </Animated.Text>

            <View style={{ height: 10 }} />

            {/* Motto */}
            <Animated.Text
              entering={FadeIn.delay(750).duration(500)}
              style={[styles.sacredMotto, { color: colors.textMuted, zIndex: 1 }]}
            >
              Recite. Reflect. Return.
            </Animated.Text>

            <View style={styles.spacerXl} />

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(900).duration(500)}
              style={[styles.fullWidthBtn, { zIndex: 1 }]}
            >
              <Button title="Begin" onPress={goNext} style={styles.fullWidthBtn} />
            </Animated.View>
          </Animated.View>
        )}

        {/* ── STEP 2: Hadith ── */}
        {step === 2 && (
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.splashStep}
          >
            {/* Ambient glow */}
            <WarmGlow size={340} opacity={0.12} />

            {/* Arch outline */}
            <ArchOutline color={colors.accent} />

            {/* Headline */}
            <Animated.Text
              entering={FadeInDown.delay(300).duration(800)}
              style={[
                styles.hadithHeadline,
                { color: colors.text, zIndex: 1 },
              ]}
            >
              Struggling is not failing
            </Animated.Text>

            {/* Gold diamond separator */}
            <Animated.View
              entering={FadeIn.delay(700).duration(400)}
              style={[
                styles.diamond,
                { backgroundColor: colors.accent, zIndex: 1 },
              ]}
            />

            <View style={{ height: spacing.lg }} />

            {/* Hadith quote */}
            <Animated.Text
              entering={FadeIn.delay(900).duration(800)}
              style={[
                styles.hadithQuote,
                { color: colors.textSoft, zIndex: 1 },
              ]}
            >
              {"\u201C"}The one who struggles with the Qur{"\u2019"}an receives
              a double reward.{"\u201D"}
            </Animated.Text>

            <View style={{ height: spacing.lg }} />

            {/* Divider line */}
            <Animated.View
              entering={FadeIn.delay(1600).duration(500)}
              style={[
                styles.dividerLine,
                { backgroundColor: colors.accent, zIndex: 1 },
              ]}
            />

            {/* Source */}
            <Animated.Text
              entering={FadeIn.delay(1600).duration(500)}
              style={[
                styles.hadithSource,
                { color: colors.textMuted, zIndex: 1 },
              ]}
            >
              SAHIH AL-BUKHARI 4937
            </Animated.Text>

            <View style={styles.spacerXl} />

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(1900).duration(500)}
              style={[styles.fullWidthBtn, { zIndex: 1 }]}
            >
              <Button title="Continue" onPress={goNext} style={styles.fullWidthBtn} />
            </Animated.View>
          </Animated.View>
        )}

        {/* ── STEP 3: Starting Point ── */}
        {step === 3 && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.cardStep}
          >
            <Text style={[styles.headline, { color: colors.text }]}>
              Where are you starting from?
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Choose what feels most true right now.
            </Text>

            <View style={styles.spacerMd} />

            {startingPointOptions.map((opt, idx) => (
              <Animated.View
                key={opt.value}
                entering={FadeInDown.delay(300 + idx * 60).duration(400)}
              >
                <OptionCard
                  label={opt.label}
                  selected={startingPoint === opt.value}
                  onPress={() => setStartingPoint(opt.value)}
                  colors={colors}
                />
              </Animated.View>
            ))}

            <View style={styles.spacerMd} />

            <Button
              title="Continue"
              onPress={goNext}
              disabled={!startingPoint}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        )}

        {/* ── STEP 4: Letter Reveal (auto-advance 3.5s) ── */}
        {step === 4 && (
          <Animated.View
            entering={FadeIn.duration(800)}
            style={styles.splashStep}
          >
            {/* Label */}
            <Animated.Text
              entering={FadeInDown.delay(300).duration(500)}
              style={[styles.firstWinLabel, { color: colors.textMuted }]}
            >
              Your first letter
            </Animated.Text>

            <View style={{ height: spacing.xxl }} />

            {/* Warm glow behind Alif */}
            <WarmGlow size={200} opacity={0.18} />

            {/* Large Alif */}
            <Animated.View entering={FadeIn.delay(800).duration(1000)}>
              <ArabicText
                size="display"
                color={colors.primaryDark}
                style={{ fontSize: 120, lineHeight: 170, zIndex: 1 }}
              >
                {"\u0627"}
              </ArabicText>
            </Animated.View>

            <View style={{ height: spacing.lg }} />

            {/* Name */}
            <Animated.Text
              entering={FadeInUp.delay(1800).duration(600)}
              style={[
                styles.letterRevealName,
                { color: colors.text, zIndex: 1 },
              ]}
            >
              Alif
            </Animated.Text>
          </Animated.View>
        )}

        {/* ── STEP 5: Letter Audio ── */}
        {step === 5 && (
          <Animated.View
            entering={FadeIn.duration(700)}
            style={styles.centeredStep}
          >
            {/* Label */}
            <Animated.Text
              entering={FadeInDown.delay(100).duration(500)}
              style={[styles.firstWinLabel, { color: colors.textMuted }]}
            >
              Your first letter
            </Animated.Text>

            <View style={{ height: spacing.xxl }} />

            {/* Letter in circle with glow */}
            <Animated.View
              entering={FadeIn.delay(200).duration(500)}
              style={styles.letterCircleOuter}
            >
              {/* Soft glow behind circle */}
              <View
                style={[
                  styles.letterCircleGlow,
                  { backgroundColor: colors.accentGlow },
                ]}
              />
              {/* Circle */}
              <View
                style={[
                  styles.letterCircle,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ArabicText size="display" color={colors.primary}>
                  {"\u0627"}
                </ArabicText>
              </View>
              {/* Name */}
              <Text
                style={[
                  styles.letterCircleName,
                  { color: colors.text },
                ]}
              >
                Alif
              </Text>
            </Animated.View>

            <View style={{ height: spacing.xxl }} />

            {/* Play button */}
            <Animated.View
              entering={FadeIn.delay(400).duration(500)}
              style={{ alignItems: "center" }}
            >
              <HearButton
                onPlay={handlePlayAudio}
                size={56}
                accessibilityLabel="Hear Alif"
              />
              <Text
                style={[
                  styles.hearLabel,
                  { color: colors.textSoft, marginTop: spacing.sm },
                ]}
              >
                {hasPlayedAudio ? "Hear again" : "Hear it"}
              </Text>
            </Animated.View>

            <View style={styles.spacerXl} />

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(550).duration(500)}
              style={styles.fullWidthBtn}
            >
              <Button title="Continue" onPress={goNext} style={styles.fullWidthBtn} />
            </Animated.View>
          </Animated.View>
        )}

        {/* ── STEP 6: Letter Quiz ── */}
        {step === 6 && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.centeredStep}
          >
            {/* Prompt */}
            <Animated.Text
              entering={FadeInDown.delay(100).duration(500)}
              style={[styles.quizPrompt, { color: colors.text }]}
            >
              Which one is Alif?
            </Animated.Text>

            <View style={{ height: spacing.xxl }} />

            {/* Answer cards */}
            <Animated.View
              entering={FadeIn.delay(200).duration(500)}
              style={styles.answerRow}
            >
              {[
                { name: "Alif", arabic: "\u0627" },
                { name: "Ba", arabic: "\u0628" },
              ].map(({ name, arabic }) => {
                const isThisCorrect = name === "Alif";
                const showCorrectReveal = answerChecked && isThisCorrect && isCorrect;
                const showWrongReveal =
                  answerChecked && name === selectedAnswer && !isCorrect;
                const isSelected = !answerChecked && selectedAnswer === name;

                let bgColor: string = colors.bgCard;
                let borderColor: string = colors.border;

                if (showCorrectReveal) {
                  bgColor = colors.primarySoft;
                  borderColor = colors.primary;
                } else if (showWrongReveal) {
                  bgColor = colors.dangerLight;
                  borderColor = colors.danger;
                } else if (isSelected) {
                  bgColor = colors.primarySoft;
                  borderColor = colors.primary;
                }

                return (
                  <Pressable
                    key={name}
                    onPress={() => handleAnswerSelect(name)}
                    style={[
                      styles.answerBtn,
                      {
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                      },
                    ]}
                  >
                    <ArabicText size="display" color={colors.text} style={{ fontSize: 56, lineHeight: 80 }}>
                      {arabic}
                    </ArabicText>
                    {/* Reveal name on correct */}
                    {answerChecked && isCorrect && isThisCorrect && (
                      <Animated.Text
                        entering={FadeIn.delay(150).duration(300)}
                        style={[
                          styles.answerLabel,
                          { color: colors.primary },
                        ]}
                      >
                        Alif
                      </Animated.Text>
                    )}
                  </Pressable>
                );
              })}
            </Animated.View>

            {/* Feedback */}
            {answerChecked && (
              <Animated.Text
                entering={FadeIn.duration(350)}
                style={[
                  styles.feedbackText,
                  {
                    color: isCorrect ? colors.primary : colors.textSoft,
                    marginTop: spacing.xl,
                  },
                ]}
              >
                {isCorrect
                  ? "Beautiful. You just read your first letter."
                  : "That\u2019s Ba \u2014 try the other one."}
              </Animated.Text>
            )}

            <View style={styles.spacerXl} />

            {/* Check / Continue */}
            {!answerChecked ? (
              <Button
                title="Check"
                onPress={handleCheckAnswer}
                disabled={!selectedAnswer}
                style={styles.fullWidthBtn}
              />
            ) : isCorrect ? (
              <Button title="Continue" onPress={goNext} style={styles.fullWidthBtn} />
            ) : null}
          </Animated.View>
        )}

        {/* ── STEP 7: Finish ── */}
        {step === 7 && (
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.splashStep}
          >
            {/* Ambient Alif watermark */}
            <Animated.View
              entering={FadeIn.duration(1500)}
              style={{
                position: "absolute",
                top: -SCREEN_HEIGHT * 0.05,
              }}
            >
              <ArabicText
                size="display"
                color={colors.text}
                style={{ fontSize: 200, lineHeight: 260, opacity: 0.06 }}
              >
                {"\u0627"}
              </ArabicText>
            </Animated.View>

            {/* Checkmark circle */}
            <Animated.View
              entering={FadeIn.delay(300).duration(400)}
              style={[
                styles.checkCircle,
                {
                  backgroundColor: colors.accentLight,
                  borderColor: "rgba(196,164,100,0.40)",
                },
              ]}
            >
              <Svg
                width={32}
                height={32}
                viewBox="0 0 24 24"
                fill="none"
              >
                <Path
                  d="M20 6L9 17L4 12"
                  stroke={colors.accent}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>

            <View style={{ height: spacing.xl }} />

            {/* Headline */}
            <Animated.Text
              entering={FadeInDown.delay(800).duration(400)}
              style={[
                styles.finishHeadline,
                { color: colors.text, zIndex: 1 },
              ]}
            >
              You've already begun
            </Animated.Text>

            <View style={{ height: spacing.md }} />

            {/* Subtext */}
            <Animated.Text
              entering={FadeIn.delay(1350).duration(400)}
              style={[
                styles.finishBody,
                { color: colors.textSoft, zIndex: 1 },
              ]}
            >
              Now let's take your first real lesson.
            </Animated.Text>

            <View style={styles.spacerXl} />

            {/* CTA */}
            <Animated.View
              entering={FadeIn.delay(1750).duration(400)}
              style={[styles.fullWidthBtn, { zIndex: 1 }]}
            >
              <Button
                title="Start Lesson 1"
                onPress={handleFinish}
                style={styles.fullWidthBtn}
              />
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: 56,
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  splashStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingBottom: spacing.xxxl,
  },
  centeredStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  cardStep: {
    alignItems: "stretch",
    paddingVertical: spacing.xxxl,
  },

  // Welcome
  appName: {
    fontSize: 44,
    letterSpacing: 5.3, // 0.12em at 44px
    textAlign: "center",
    lineHeight: 52,
  },
  brandMotto: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 2, // 0.18em
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  tagline: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 260,
  },

  // Sacred (Tilawat)
  sacredHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 31,
    textAlign: "center",
    maxWidth: 300,
    letterSpacing: -0.2,
  },
  sacredMotto: {
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "center",
  },

  // Hadith
  hadithHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
    fontStyle: "italic",
    marginBottom: 20,
  },
  diamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  hadithQuote: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 29,
    textAlign: "center",
    maxWidth: 280,
  },
  dividerLine: {
    width: 28,
    height: 1,
    opacity: 0.4,
    marginBottom: spacing.sm,
  },
  hadithSource: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // Headlines shared
  headline: {
    ...typography.heading1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
    textAlign: "center",
  },

  // Letter reveal
  firstWinLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterRevealName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // Letter audio — circle
  letterCircleOuter: {
    alignItems: "center",
  },
  letterCircleGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -10,
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  letterCircleName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    marginTop: spacing.md,
    textAlign: "center",
  },
  hearLabel: {
    ...typography.bodySmall,
    textAlign: "center",
  },

  // Quiz
  quizPrompt: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 23,
    lineHeight: 31,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  answerRow: {
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
  },
  answerBtn: {
    width: 130,
    height: 160,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  answerLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  feedbackText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 280,
  },

  // Finish
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  finishHeadline: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  finishBody: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },

  // Shared
  fullWidthBtn: {
    width: "100%",
  },
  spacerSm: { height: spacing.lg },
  spacerMd: { height: spacing.xl },
  spacerLg: { height: spacing.xxl },
  spacerXl: { height: spacing.xxxl },
});
