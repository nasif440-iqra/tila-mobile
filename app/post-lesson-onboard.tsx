import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "../src/design/theme";
import { spacing, radii, fontFamilies } from "../src/design/tokens";
import { Button } from "../src/design/components";
import { useProgress } from "../src/hooks/useProgress";

const TOTAL_STEPS = 3;

const motivationOptions = [
  "I want to read the Quran confidently",
  "I want to improve my prayer and understanding",
  "I want to build a daily Quran habit",
  "I want to reconnect properly",
  "I want to help my child or family learn",
];

const goalOptions = [
  { label: "3 minutes", value: 3, desc: "A gentle start" },
  { label: "5 minutes", value: 5, desc: "Most popular" },
  { label: "10 minutes", value: 10, desc: "Deep focus" },
];

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
                backgroundColor: i <= current ? colors.primary : "transparent",
                width: i < current ? "100%" : i === current ? "50%" : "0%",
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

// ── Step 0: Motivation ──

function StepMotivation({
  selected,
  onSelect,
  onNext,
  colors,
}: {
  selected: string;
  onSelect: (v: string) => void;
  onNext: () => void;
  colors: any;
}) {
  return (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={[styles.contextLabel, { color: colors.accent }]}>
          You completed your first lesson
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={[styles.headline, { color: colors.text }]}>
          Why does this matter to you?
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Choose what feels closest to your heart.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.optionsWrap}>
        {motivationOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option);
            }}
            style={[
              styles.optionBtn,
              { borderColor: colors.border, backgroundColor: colors.bgCard },
              selected === option && {
                borderColor: colors.primary,
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.text },
                selected === option && { color: colors.primary },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      <View style={styles.buttonWrap}>
        <Button title="Continue" onPress={onNext} disabled={!selected} />
      </View>
    </View>
  );
}

// ── Step 1: Daily Goal ──

function StepGoal({
  selected,
  onSelect,
  onNext,
  colors,
}: {
  selected: number | null;
  onSelect: (v: number) => void;
  onNext: () => void;
  colors: any;
}) {
  return (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={[styles.headline, { color: colors.text }]}>
          How much time feels right?
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Start small. You can always adjust later.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.goalRow}>
        {goalOptions.map((g) => (
          <Pressable
            key={g.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(g.value);
            }}
            style={[
              styles.goalBtn,
              { borderColor: colors.border, backgroundColor: colors.bgCard },
              selected === g.value && {
                borderColor: colors.primary,
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text style={[styles.goalNumber, { color: colors.text }]}>{g.value}</Text>
            <Text style={[styles.goalUnit, { color: colors.textMuted }]}>min</Text>
            <Text style={[styles.goalDesc, { color: colors.textMuted }]}>{g.desc}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <View style={styles.buttonWrap}>
        <Button title="Set my goal" onPress={onNext} disabled={selected === null} />
      </View>
    </View>
  );
}

// ── Step 2: Confirmation ──

function StepConfirmation({ onFinish, colors }: { onFinish: () => void; colors: any }) {
  return (
    <View style={styles.stepContent}>
      {/* Diamond checkmark */}
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.diamondWrap}>
        <View style={[styles.diamond, { backgroundColor: colors.primary }]}>
          <View style={styles.diamondInner}>
            <Text style={{ color: colors.accent, fontSize: 28 }}>{"\u2713"}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(600)}>
        <Text style={[styles.confirmHeadline, { color: colors.text }]}>
          Your journey has started.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <Text style={[styles.confirmBody, { color: colors.textSoft }]}>
          A few sincere minutes each day can take you far.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1000).duration(500)}>
        <Text style={[styles.confirmCloser, { color: colors.textMuted }]}>Welcome home.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1200).duration(500)} style={styles.buttonWrap}>
        <Button title="Go to Home" onPress={onFinish} />
      </Animated.View>
    </View>
  );
}

// ── Main ──

export default function PostLessonOnboardScreen() {
  const colors = useColors();
  const progress = useProgress();
  const [step, setStep] = useState(0);
  const [selectedMotivation, setSelectedMotivation] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const goNext = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  async function handleFinish() {
    // Save motivation, goal, and mark post-lesson onboard as seen
    await progress.updateProfile({
      motivation: selectedMotivation ? "quran" : null, // Simplified mapping
      dailyGoal: selectedGoal,
      postLessonOnboardSeen: true,
      commitmentComplete: true,
    });

    // Navigate to wird-intro if not yet seen
    const wirdSeen = progress.wirdIntroSeen ?? false;
    if (!wirdSeen) {
      router.replace("/wird-intro" as any);
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgWarm }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <ProgressBar current={step} colors={colors} />
      </View>

      {step === 0 && (
        <StepMotivation
          selected={selectedMotivation}
          onSelect={setSelectedMotivation}
          onNext={goNext}
          colors={colors}
        />
      )}
      {step === 1 && (
        <StepGoal
          selected={selectedGoal}
          onSelect={setSelectedGoal}
          onNext={goNext}
          colors={colors}
        />
      )}
      {step === 2 && <StepConfirmation onFinish={handleFinish} colors={colors} />}
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
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 320,
    marginTop: spacing.xl,
  },

  // Labels & text
  contextLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.xl,
  },
  headline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 23,
    lineHeight: 31,
    textAlign: "center",
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: spacing.xxl,
  },

  // Motivation options
  optionsWrap: {
    width: "100%",
    maxWidth: 340,
    gap: 8,
    marginBottom: spacing.xl,
  },
  optionBtn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  optionText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    textAlign: "center",
  },

  // Goal selector
  goalRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.xxl,
  },
  goalBtn: {
    width: 100,
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: "center",
    gap: 2,
  },
  goalNumber: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 32,
    lineHeight: 36,
  },
  goalUnit: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goalDesc: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: 6,
    opacity: 0.7,
  },

  // Confirmation
  diamondWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  diamond: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  diamondInner: {
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  confirmHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  confirmBody: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 6,
  },
  confirmCloser: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
