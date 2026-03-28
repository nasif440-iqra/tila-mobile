import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useProgress } from "../../hooks/useProgress";
import { useColors } from "../../design/theme";
import { spacing } from "../../design/tokens";
import {
  playOnboardingAdvance,
  playOnboardingComplete,
  playLetterName,
  playTap,
} from "../../audio/player";
import type { OnboardingDraft } from "../../types/onboarding";
import { track } from "../../analytics";

import { FloatingLettersLayer } from "./FloatingLettersLayer";
import { ProgressBar } from "./ProgressBar";
import { Welcome } from "./steps/Welcome";
import { Tilawat } from "./steps/Tilawat";
import { Hadith } from "./steps/Hadith";
import { StartingPoint } from "./steps/StartingPoint";
import { LetterReveal } from "./steps/LetterReveal";
import { LetterAudio } from "./steps/LetterAudio";
import { LetterQuiz } from "./steps/LetterQuiz";
import { Finish } from "./steps/Finish";

const TOTAL_STEPS = 8;

const STEP_NAMES = [
  'welcome', 'tilawat', 'hadith', 'starting_point',
  'letter_reveal', 'letter_audio', 'letter_quiz', 'finish',
] as const;

export function OnboardingFlow() {
  const colors = useColors();
  const { updateProfile } = useProgress();

  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({ startingPoint: null });
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const letterRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onboardingStartRef = useRef(Date.now());

  function goNext() {
    playOnboardingAdvance();
    setStep((s) => s + 1);
  }

  useEffect(() => {
    track('onboarding_step_viewed', {
      step_index: step,
      step_name: STEP_NAMES[step],
    });
  }, [step]);

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
    track('letter_audio_played', {
      letter_id: 1,
      audio_type: 'name' as const,
      context: 'onboarding' as const,
    });
    playTap();
    playLetterName(1);
    setHasPlayedAudio(true);
  }, []);

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    try {
      playOnboardingComplete();
    } catch {}

    try {
      await updateProfile({
        onboarded: true,
        onboardingVersion: 2,
        startingPoint: draft.startingPoint,
        commitmentComplete: true,
      });
      track('onboarding_completed', {
        starting_point: draft.startingPoint ?? 'unknown',
        duration_seconds: Math.round((Date.now() - onboardingStartRef.current) / 1000),
      });
      // Only navigate after successful save
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    } catch (err) {
      console.error("Failed to save onboarding profile:", err);
      setFinishing(false);
      setFinishError(true);
    }
  }

  // Progress bar visibility: hidden on welcome (0), letter reveal (4), and quiz (6)
  const showProgressBar = step > 0 && step !== 4 && step !== 6 && step < 7;

  // Fade-out opacity when finishing
  const fadeOpacity = useSharedValue(1);
  useEffect(() => {
    if (finishing) {
      fadeOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [finishing, fadeOpacity]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.bgWarm }, fadeStyle]}>
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
        {step === 0 && <Welcome onNext={goNext} />}
        {step === 1 && <Tilawat onNext={goNext} />}
        {step === 2 && <Hadith onNext={goNext} />}
        {step === 3 && (
          <StartingPoint
            startingPoint={draft.startingPoint}
            onSelectStartingPoint={(value) =>
              setDraft((d) => ({ ...d, startingPoint: value as OnboardingDraft["startingPoint"] }))
            }
            onNext={goNext}
          />
        )}
        {step === 4 && <LetterReveal />}
        {step === 5 && (
          <LetterAudio
            onNext={goNext}
            onPlayAudio={handlePlayAudio}
            hasPlayedAudio={hasPlayedAudio}
          />
        )}
        {step === 6 && <LetterQuiz onNext={goNext} />}
        {step === 7 && (
          <Finish
            onFinish={handleFinish}
            finishing={finishing}
            finishError={finishError}
          />
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: spacing.xxxl + spacing.sm,
    paddingHorizontal: spacing.xl,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
