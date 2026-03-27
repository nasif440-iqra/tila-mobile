import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../src/design/theme";
import { spacing, radii, fontFamilies } from "../src/design/tokens";
import { ArabicText, Button } from "../src/design/components";
import { useProgress } from "../src/hooks/useProgress";

const TOTAL_STEPS = 3;

// ── Progress bar ──

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

// ── Step 1: Hadith ──

function StepHadith({ onNext, colors }: { onNext: () => void; colors: any }) {
  return (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeIn.duration(800)}>
        <Text style={[styles.hadithText, { color: colors.text }]}>
          {'"The most beloved deeds to Allah are those done consistently, even if they are small."'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(500)}>
        <View style={[styles.divider, { backgroundColor: colors.accent }]} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <Text style={[styles.attribution, { color: colors.textMuted }]}>Prophet Muhammad</Text>
        <ArabicText size="large" color={colors.accent} style={{ textAlign: "center", marginTop: 4 }}>
          {"\uFDFA"}
        </ArabicText>
        <Text style={[styles.reference, { color: colors.textMuted }]}>Sahih al-Bukhari 6464</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1200).duration(500)} style={styles.buttonWrap}>
        <Button title="Continue" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ── Step 2: What is Wird? ──

function StepMeaning({ onNext, colors }: { onNext: () => void; colors: any }) {
  return (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeIn.duration(800)}>
        <ArabicText size="display" color={colors.text} style={{ textAlign: "center", fontSize: 72 }}>
          {"\u0648\u0650\u0631\u0652\u062F"}
        </ArabicText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={[styles.transliteration, { color: colors.accent }]}>wird</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(600)}>
        <Text style={[styles.meaningText, { color: colors.textSoft }]}>
          A <Text style={{ fontFamily: fontFamilies.bodyBold, color: colors.accent }}>Wird</Text> is
          a daily spiritual practice {"\u2014"} a portion of worship you return to each day, no
          matter how small.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1000).duration(600)}>
        <Text style={[styles.meaningText, { color: colors.textSoft, marginTop: 14 }]}>
          In Tila, your Wird is your daily streak. Each day you practice, your Wird grows. It
          {"\u2019"}s not about perfection {"\u2014"} it{"\u2019"}s about showing up.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1400).duration(500)} style={styles.buttonWrap}>
        <Button title="Continue" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ── Step 3: Your First Wird ──

function StepFirstWird({ onComplete, colors }: { onComplete: () => void; colors: any }) {
  return (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <Text style={[styles.wirdHeading, { color: colors.text }]}>A Sacred Daily Practice</Text>
      </Animated.View>

      {/* Crescent icon */}
      <Animated.View
        entering={FadeIn.delay(400).duration(800)}
        style={[styles.crescentCircle, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
      >
        <Text style={{ fontSize: 40, color: colors.accent }}>{"☽"}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(800).duration(600)}>
        <Text style={[styles.dayCounter, { color: colors.accent }]}>Day 1</Text>
        <Text style={[styles.dayCaption, { color: colors.textSoft }]}>Your Wird has begun</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(1200).duration(600)}>
        <Text style={[styles.wirdSubtext, { color: colors.textSoft }]}>
          Come back tomorrow to keep it growing.
        </Text>
        <Text style={[styles.quranQuote, { color: colors.textMuted }]}>
          And whoever holds firmly to Allah has been guided to a straight path.
        </Text>
        <Text style={[styles.quranRef, { color: colors.textMuted }]}>{"\u2014"} Quran 3:101</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1600).duration(500)} style={styles.buttonWrap}>
        <Button title="I'm in" onPress={onComplete} />
      </Animated.View>
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
      // Save flag and go home
      progress.updateProfile({ wirdIntroSeen: true });
      router.replace("/(tabs)");
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgWarm }]}>
      {/* Progress bar */}
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
    paddingTop: spacing.md,
  },
  progressBar: {
    flexDirection: "row",
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 320,
    marginTop: spacing.xxl,
  },

  // Step 1: Hadith
  hadithText: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 22,
    lineHeight: 34,
    textAlign: "center",
    maxWidth: 320,
  },
  divider: {
    width: 56,
    height: 2,
    borderRadius: 1,
    marginVertical: spacing.xl,
    opacity: 0.6,
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
  transliteration: {
    fontSize: 16,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  meaningText: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
  },

  // Step 3: First Wird
  wirdHeading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
  crescentCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
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
    marginTop: spacing.lg,
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
