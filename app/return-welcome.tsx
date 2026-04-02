import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../src/design/theme";
import { spacing, radii, fontFamilies } from "../src/design/tokens";
import { Button, Card } from "../src/design/components";
import { CrescentIcon } from "../src/design/CrescentIcon";
import { useProgress } from "../src/hooks/useProgress";
import { getTodayDateString, getDayDifference } from "../src/engine/dateUtils";
import { track } from "../src/analytics";
import { useHabit } from "../src/hooks/useHabit";

// ── Tiered content based on absence length ──

interface ReturnContent {
  greeting: string;
  hadith: string;
  attribution: string;
  encouragement: string;
  buttonText: string;
}

function getReturnContent(
  daysSince: number,
  streakBroke: boolean,
  longestWird: number
): ReturnContent {
  if (daysSince <= 1) {
    // Yesterday or today — light welcome back
    return {
      greeting: "Welcome back",
      hadith:
        "The most beloved of deeds to Allah are those that are most consistent, even if they are small.",
      attribution: "Prophet Muhammad (peace be upon him)",
      encouragement:
        "Every return is a step forward. Pick up right where you left off.",
      buttonText: "Continue",
    };
  }

  if (daysSince <= 7) {
    // 2-7 days — gentle we missed you
    return {
      greeting: "We missed you",
      hadith:
        "Whoever travels a path in search of knowledge, Allah will make easy for him a path to paradise.",
      attribution: "Prophet Muhammad (peace be upon him)",
      encouragement: streakBroke
        ? `Your ${longestWird}-day streak shows real dedication. Let\u2019s build another one.`
        : `You\u2019ve been away for ${daysSince} days. Your progress is right where you left it.`,
      buttonText: streakBroke ? "Start fresh" : "Continue learning",
    };
  }

  // 8+ days — warm it's never too late
  return {
    greeting: "It\u2019s never too late",
    hadith:
      "The best time to plant a tree was twenty years ago. The second best time is now.",
    attribution: "Islamic proverb",
    encouragement: streakBroke
      ? `You reached a ${longestWird}-day streak before \u2014 that strength is still in you. One lesson is all it takes.`
      : "Every great journey has pauses. Your learning is waiting for you, exactly where you left off.",
    buttonText: "Begin again",
  };
}

function getAbsenceTier(daysSince: number): "short" | "medium" | "long" {
  if (daysSince <= 1) return "short";
  if (daysSince <= 7) return "medium";
  return "long";
}

export default function ReturnWelcomeScreen() {
  const colors = useColors();
  const progress = useProgress();
  const { habit } = useHabit();

  const currentWird = habit?.currentWird ?? 0;
  const longestWird = habit?.longestWird ?? 0;
  const streakBroke = currentWird === 0 && longestWird > 0;

  const lastPractice = habit?.lastPracticeDate;
  const daysSince = lastPractice
    ? getDayDifference(getTodayDateString(), lastPractice)
    : 0;

  const content = useMemo(
    () => getReturnContent(daysSince, streakBroke, longestWird),
    [daysSince, streakBroke, longestWird]
  );

  const absenceTier = getAbsenceTier(daysSince);

  useEffect(() => {
    track("return_welcome_shown", {
      days_since_last_practice: daysSince,
      current_wird: currentWird,
      streak_broke: streakBroke,
      longest_wird: longestWird,
      absence_tier: absenceTier,
    });
  }, []);

  function handleContinue() {
    // Mark today as shown so we don't show again today
    progress.updateProfile({ returnHadithLastShown: getTodayDateString() });
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgWarm }]}
    >
      <View style={styles.content}>
        {/* Decorative crescent circle */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={[
            styles.crescentCircle,
            { backgroundColor: colors.accentLight, borderColor: colors.accent },
          ]}
        >
          <CrescentIcon size={32} color={colors.accent} />
        </Animated.View>

        {/* Greeting label — adapts to absence tier */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={[styles.label, { color: colors.accent }]}>
            {content.greeting}
          </Text>
        </Animated.View>

        {/* Hadith card — adapts to absence tier */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={{ width: "100%" }}
        >
          <Card style={styles.hadithCard}>
            <Text style={[styles.hadithText, { color: colors.text }]}>
              {`\u201C${content.hadith}\u201D`}
            </Text>
            <Text style={[styles.attribution, { color: colors.textMuted }]}>
              {`\u2014 ${content.attribution}`}
            </Text>
          </Card>
        </Animated.View>

        {/* Encouragement — adapts to absence and streak state */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={[styles.encouragement, { color: colors.textSoft }]}>
            {content.encouragement}
          </Text>
        </Animated.View>

        {/* Action button — adapts text to tier */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.buttonWrap}
        >
          <Button title={content.buttonText} onPress={handleContinue} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  crescentCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  hadithCard: {
    maxWidth: 340,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    marginBottom: spacing.xxl,
  },
  hadithText: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  attribution: {
    fontSize: 12,
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  encouragement: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: spacing.xxl,
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 320,
  },
});
