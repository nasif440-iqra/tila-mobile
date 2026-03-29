import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii, fontFamilies } from "../src/design/tokens";
import { ArabicText, Button } from "../src/design/components";
import { WarmGlow } from "../src/components/onboarding/WarmGlow";
import { hapticMilestone } from "../src/design/haptics";
import { springs } from "../src/design/animations";
import { useHabit } from "../src/hooks/useHabit";
import { track } from "../src/analytics";
import { LESSONS } from "../src/data/lessons";

// ── Phase metadata ──

const PHASE_INFO: Record<number, { title: string; affirmation: string }> = {
  1: {
    title: "Phase 1 -- Letter Recognition",
    affirmation: "You now recognize the foundations of the Arabic alphabet.",
  },
  2: {
    title: "Phase 2 -- Letter Sounds",
    affirmation: "You can hear and distinguish the sounds of every letter.",
  },
  3: {
    title: "Phase 3 -- Harakat (Vowels)",
    affirmation: "You've learned how vowel marks shape Arabic words.",
  },
  4: {
    title: "Phase 4 -- Connected Forms",
    affirmation: "You can read Arabic letters in their connected forms.",
  },
};

const NEXT_PHASE: Record<number, string> = {
  1: "Phase 2 -- Letter Sounds",
  2: "Phase 3 -- Harakat (Vowels)",
  3: "Phase 4 -- Connected Forms",
};

export default function PhaseCompleteScreen() {
  const colors = useColors();
  const { phase } = useLocalSearchParams();
  const phaseNum = parseInt(phase as string, 10) || 1;
  const { habit } = useHabit();

  const info = PHASE_INFO[phaseNum] ?? PHASE_INFO[1];
  const nextPhaseTitle = NEXT_PHASE[phaseNum];
  const currentWird = habit?.currentWird ?? 0;

  // Milestone haptic on mount
  useEffect(() => {
    hapticMilestone();
  }, []);

  // Scale entrance for Arabic centerpiece
  const arabicScale = useSharedValue(0.92);

  useEffect(() => {
    arabicScale.value = withSpring(1, springs.gentle);
  }, []);

  const arabicScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arabicScale.value }],
  }));

  useEffect(() => {
    const phaseLessons = LESSONS.filter((l) => l.phase === phaseNum);
    track('phase_completed', {
      phase: phaseNum,
      total_lessons: phaseLessons.length,
    });
  }, [phaseNum]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.content}>
        {/* Arabic centerpiece with milestone WarmGlow */}
        <Animated.View entering={FadeIn.duration(800)} style={[styles.arabicWrap, { alignItems: "center", justifyContent: "center" }]}>
          <Animated.View style={arabicScaleStyle}>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <WarmGlow
                size={200}
                animated
                color="rgba(196,164,100,0.25)"
                pulseMin={0.06}
                pulseMax={0.18}
              />
              <ArabicText size="display" color={colors.accent} style={{ fontSize: 72 }}>
                {"\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647"}
              </ArabicText>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Phase Complete label */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={[styles.label, { color: colors.accent }]}>Phase Complete</Text>
        </Animated.View>

        {/* Phase title */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text style={[styles.title, { color: colors.white }]}>{info.title}</Text>
        </Animated.View>

        {/* Affirmation */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <Text style={[styles.affirmation, { color: "rgba(255,255,255,0.7)" }]}>
            {info.affirmation}
          </Text>
        </Animated.View>

        {/* Wird badge */}
        {currentWird > 0 && (
          <Animated.View
            entering={FadeInDown.delay(900).duration(500)}
            style={[styles.wirdBadge, { borderColor: "rgba(255,255,255,0.12)" }]}
          >
            <Text style={{ fontSize: 13, color: colors.accent }}>{"☽"}</Text>
            <Text style={[styles.wirdCount, { color: "rgba(255,255,255,0.85)" }]}>
              {currentWird} {currentWird === 1 ? "day" : "days"}
            </Text>
            <Text style={[styles.wirdLabel, { color: "rgba(255,255,255,0.5)" }]}>Wird</Text>
          </Animated.View>
        )}

        {/* Next phase unlock card */}
        {nextPhaseTitle ? (
          <Animated.View
            entering={FadeInDown.delay(1100).duration(600)}
            style={styles.unlockCard}
          >
            <Text style={[styles.unlockLabel, { color: colors.accent }]}>Unlocked</Text>
            <Text style={[styles.unlockTitle, { color: colors.white }]}>{nextPhaseTitle}</Text>
            <Text style={styles.unlockSub}>Your next chapter awaits.</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
            <Text style={styles.completionNote}>
              You have completed every phase. May this knowledge stay with you.
            </Text>
          </Animated.View>
        )}

        {/* Continue button */}
        <Animated.View
          entering={FadeInDown.delay(1300).duration(500)}
          style={styles.buttonWrap}
        >
          <Button
            title="Continue"
            onPress={() => router.replace("/(tabs)")}
            style={{ backgroundColor: colors.accent }}
          />
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
  arabicWrap: {
    marginBottom: 40,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 26,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  affirmation: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: spacing.xxl,
  },
  wirdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: spacing.xxl,
  },
  wirdCount: {
    fontSize: 13,
    fontFamily: fontFamilies.bodySemiBold,
  },
  wirdLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
  },
  unlockCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  unlockLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  unlockTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    marginBottom: 6,
  },
  unlockSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontFamily: fontFamilies.bodyRegular,
  },
  completionNote: {
    fontSize: 15,
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 320,
  },
});
