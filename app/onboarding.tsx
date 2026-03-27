import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { useProgress } from "../src/hooks/useProgress";
import { useColors } from "../src/design/theme";
import { ArabicText, Button, Card } from "../src/design/components";
import { typography, spacing, radii, fontFamilies } from "../src/design/tokens";

// ── Step data ──

const TOTAL_STEPS = 8;

const STARTING_POINT_OPTIONS = [
  { label: "I'm completely new", value: "new" as const },
  { label: "I know some Arabic letters", value: "some_arabic" as const },
  {
    label: "I can read Arabic but want to improve",
    value: "can_read" as const,
  },
];

const MOTIVATION_OPTIONS = [
  { label: "I want to read the Quran", value: "quran" as const },
  { label: "I want to understand my prayers", value: "prayer" as const },
  { label: "General Arabic learning", value: "general" as const },
];

const DAILY_GOAL_OPTIONS = [
  { count: 1, label: "Casual" },
  { count: 2, label: "Steady" },
  { count: 3, label: "Committed" },
  { count: 5, label: "Intensive" },
];

const PREVIEW_LETTERS = [
  { arabic: "\u0627", name: "Alif" },
  { arabic: "\u0628", name: "Ba" },
  { arabic: "\u062A", name: "Ta" },
  { arabic: "\u062B", name: "Tha" },
];

// ── Progress bar ──

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
                width:
                  i < current ? "100%" : i === current ? "50%" : "0%",
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

// ── Selection option card ──

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
      onPress={onPress}
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
          {
            color: selected ? colors.primary : colors.text,
          },
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

// ── Main screen ──

export default function OnboardingScreen() {
  const colors = useColors();
  const { updateProfile } = useProgress();

  const [step, setStep] = useState(0);
  const [startingPoint, setStartingPoint] = useState<
    "new" | "some_arabic" | "can_read" | null
  >(null);
  const [motivation, setMotivation] = useState<
    "quran" | "prayer" | "general" | null
  >(null);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);

  function goNext() {
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    await updateProfile({
      onboarded: true,
      onboardingVersion: 2,
      startingPoint: startingPoint,
      motivation: motivation,
      dailyGoal: dailyGoal,
      commitmentComplete: true,
    });
    router.replace("/(tabs)");
  }

  // Determine whether to show the progress bar (hidden on welcome and ready)
  const showProgressBar = step > 0 && step < 7;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgWarm }]}>
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
            entering={FadeIn.duration(600)}
            style={styles.centeredStep}
          >
            {/* Bismillah */}
            <ArabicText size="display" color={colors.primary}>
              {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0647\u0650"}
            </ArabicText>

            <View style={styles.spacerLg} />

            {/* App name */}
            <Text
              style={[
                styles.appName,
                { color: colors.text, fontFamily: fontFamilies.headingBold },
              ]}
            >
              Welcome to Tila
            </Text>

            {/* Tagline */}
            <Text
              style={[styles.tagline, { color: colors.textSoft }]}
            >
              Learn to read the Quran,{"\n"}one letter at a time.
            </Text>

            <View style={styles.spacerXl} />

            <Button title="Begin" onPress={goNext} style={styles.fullWidthBtn} />
          </Animated.View>
        )}

        {/* ── STEP 1: Starting point ── */}
        {step === 1 && (
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

            {STARTING_POINT_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                selected={startingPoint === opt.value}
                onPress={() => setStartingPoint(opt.value)}
                colors={colors}
              />
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

        {/* ── STEP 2: Motivation ── */}
        {step === 2 && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.cardStep}
          >
            <Text style={[styles.headline, { color: colors.text }]}>
              What brings you to Tila?
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              This helps us personalize your experience.
            </Text>

            <View style={styles.spacerMd} />

            {MOTIVATION_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                selected={motivation === opt.value}
                onPress={() => setMotivation(opt.value)}
                colors={colors}
              />
            ))}

            <View style={styles.spacerMd} />

            <Button
              title="Continue"
              onPress={goNext}
              disabled={!motivation}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        )}

        {/* ── STEP 3: Daily goal ── */}
        {step === 3 && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.cardStep}
          >
            <Text style={[styles.headline, { color: colors.text }]}>
              How many lessons per day?
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              You can always change this later.
            </Text>

            <View style={styles.spacerMd} />

            {DAILY_GOAL_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.count}
                label={`${opt.count} ${opt.count === 1 ? "lesson" : "lessons"} — ${opt.label}`}
                selected={dailyGoal === opt.count}
                onPress={() => setDailyGoal(opt.count)}
                colors={colors}
              />
            ))}

            <View style={styles.spacerMd} />

            <Button
              title="Continue"
              onPress={goNext}
              disabled={dailyGoal === null}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        )}

        {/* ── STEP 4: Commitment ── */}
        {step === 4 && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.centeredStep}
          >
            <Text style={[styles.headline, { color: colors.text }]}>
              Every journey begins with a single step
            </Text>

            <View style={styles.spacerSm} />

            <Text
              style={[styles.body, { color: colors.textSoft, textAlign: "center" }]}
            >
              The Prophet (peace be upon him) said: "The most beloved deeds to
              Allah are those done consistently, even if small."
            </Text>

            <View style={styles.spacerSm} />

            <Text style={[styles.caption, { color: colors.textMuted }]}>
              Sahih al-Bukhari 6464
            </Text>

            <View style={styles.spacerXl} />

            <Button
              title="I'm ready to begin"
              onPress={goNext}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        )}

        {/* ── STEP 5: Letter preview ── */}
        {step === 5 && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.centeredStep}
          >
            <Text style={[styles.headline, { color: colors.text }]}>
              These are your first letters
            </Text>

            <View style={styles.spacerLg} />

            <View style={styles.letterGrid}>
              {PREVIEW_LETTERS.map((letter) => (
                <View key={letter.name} style={styles.letterCell}>
                  <ArabicText size="display" color={colors.primary}>
                    {letter.arabic}
                  </ArabicText>
                  <Text
                    style={[styles.letterName, { color: colors.textSoft }]}
                  >
                    {letter.name}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.spacerLg} />

            <Text
              style={[styles.body, { color: colors.textMuted, textAlign: "center" }]}
            >
              You will learn to recognize each letter by its shape, name, and
              sound.
            </Text>

            <View style={styles.spacerLg} />

            <Button
              title="Continue"
              onPress={goNext}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        )}

        {/* ── STEP 6: Encouragement ── */}
        {step === 6 && (
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.centeredStep}
          >
            <Text
              style={[
                styles.quoteHeadline,
                { color: colors.text, fontStyle: "italic" },
              ]}
            >
              Struggling is not failing
            </Text>

            <View style={styles.spacerSm} />

            {/* Gold diamond separator */}
            <View
              style={[
                styles.diamond,
                { backgroundColor: colors.accent },
              ]}
            />

            <View style={styles.spacerSm} />

            <Text
              style={[
                styles.quoteBody,
                { color: colors.textSoft, fontStyle: "italic" },
              ]}
            >
              {"\u201C"}The one who struggles with the Qur{"\u2019"}an receives
              a double reward.{"\u201D"}
            </Text>

            <View style={styles.spacerSm} />

            {/* Divider line */}
            <View
              style={[styles.dividerLine, { backgroundColor: colors.accent }]}
            />

            <Text style={[styles.caption, { color: colors.textMuted }]}>
              Sahih al-Bukhari 4937
            </Text>

            <View style={styles.spacerXl} />

            <Button
              title="Continue"
              onPress={goNext}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        )}

        {/* ── STEP 7: Ready ── */}
        {step === 7 && (
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.centeredStep}
          >
            <Text style={[styles.readyHeadline, { color: colors.text }]}>
              Your journey begins now
            </Text>

            <View style={styles.spacerSm} />

            <Text
              style={[styles.body, { color: colors.textSoft, textAlign: "center" }]}
            >
              Now let's take your first real lesson.
            </Text>

            <View style={styles.spacerXl} />

            <Button
              title="Start Learning"
              onPress={handleFinish}
              style={styles.fullWidthBtn}
            />
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
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
  appName: {
    fontSize: 36,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  tagline: {
    ...typography.bodyLarge,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 26,
  },
  headline: {
    ...typography.heading1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  caption: {
    ...typography.caption,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },

  // Letter preview
  letterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xl,
  },
  letterCell: {
    alignItems: "center",
    width: 80,
  },
  letterName: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  // Encouragement / hadith
  quoteHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  quoteBody: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 17,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 280,
  },
  diamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  dividerLine: {
    width: 28,
    height: 1,
    opacity: 0.4,
    marginBottom: spacing.sm,
  },

  // Ready
  readyHeadline: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  // Spacers
  spacerSm: { height: spacing.lg },
  spacerMd: { height: spacing.xl },
  spacerLg: { height: spacing.xxl },
  spacerXl: { height: spacing.xxxl },
});
