import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProgress } from "../../hooks/useProgress";
import { useColors } from "../../design/theme";
import { spacing } from "../../design/tokens";
import { durations } from "../../design/animations";
import {
  playLetterName,
  playOnboardingComplete,
} from "../../audio/player";
import type { OnboardingDraft } from "../../types/onboarding";
import { track } from "../../analytics";

import { FloatingLettersLayer } from "./FloatingLettersLayer";
import { ProgressBar } from "./ProgressBar";
import { Welcome } from "./steps/Welcome";
import { Tilawat } from "./steps/Tilawat";
import { Hadith } from "./steps/Hadith";
import { StartingPoint } from "./steps/StartingPoint";
import { BismillahMoment } from "./steps/BismillahMoment";
import { LetterReveal } from "./steps/LetterReveal";
import { LetterAudio } from "./steps/LetterAudio";
import { LetterQuiz } from "./steps/LetterQuiz";
import { Finish } from "./steps/Finish";
import { NameMotivation } from "./steps/NameMotivation";

const TOTAL_STEPS = 10;

const STEP = {
  WELCOME: 0, TILAWAT: 1, HADITH: 2, STARTING_POINT: 3,
  BISMILLAH: 4, LETTER_REVEAL: 5, LETTER_AUDIO: 6,
  LETTER_QUIZ: 7, NAME_MOTIVATION: 8, FINISH: 9,
} as const;

const STEP_NAMES = [
  'welcome', 'tilawat', 'hadith', 'starting_point', 'bismillah',
  'letter_reveal', 'letter_audio', 'letter_quiz', 'name_motivation', 'finish',
] as const;

export function OnboardingFlow() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useProgress();

  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({ startingPoint: null, userName: '', motivation: null });
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const letterRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onboardingStartRef = useRef(Date.now());

  function goNext() {
    setStep((s) => s + 1);
  }

  // TODO: Update analytics to use STEP_NAMES instead of numeric indices (step indices shifted after Bismillah insertion)
  useEffect(() => {
    track('onboarding_step_viewed', {
      step_index: step,
      step_name: STEP_NAMES[step],
    });
  }, [step]);

  // LetterReveal and Bismillah auto-advance from their own component timers via onNext/goNext.
  // Other steps advance via user button press.
  // LetterReveal auto-advance (STEP.LETTER_REVEAL -> STEP.LETTER_AUDIO after 4.5s, accounts for stillness beat per UI-SPEC)
  useEffect(() => {
    if (step === STEP.LETTER_REVEAL) {
      letterRevealTimerRef.current = setTimeout(() => {
        setStep(STEP.LETTER_AUDIO);
      }, 4500);
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
    playLetterName(1);
    setHasPlayedAudio(true);
  }, []);

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    try {
      await updateProfile({
        onboarded: true,
        onboardingVersion: 2,
        startingPoint: draft.startingPoint,
        commitmentComplete: true,
        name: draft.userName.trim() || null,
        motivation: draft.motivation,
      });
      track('onboarding_completed', {
        starting_point: draft.startingPoint ?? 'unknown',
        motivation: draft.motivation ?? 'skipped',
        has_name: !!draft.userName.trim(),
        duration_seconds: Math.round((Date.now() - onboardingStartRef.current) / 1000),
      });
      playOnboardingComplete();
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

  // Progress bar visibility: hidden on welcome, bismillah, letter reveal, letter quiz, and finish
  const showProgressBar = step > STEP.WELCOME && step !== STEP.LETTER_REVEAL && step !== STEP.LETTER_QUIZ && step !== STEP.BISMILLAH && step < STEP.FINISH;

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
      {/* Floating Arabic letters — visible on steps 0-3 (Welcome through StartingPoint) */}
      {step <= STEP.STARTING_POINT && <FloatingLettersLayer color={colors.primary} />}

      {/* Progress bar — positioned close to top safe area, matching web */}
      {showProgressBar && (
        <View style={[styles.progressContainer, { paddingTop: insets.top + spacing.sm }]}>
          <ProgressBar current={step} total={TOTAL_STEPS} colors={colors} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={step}
          entering={FadeIn.duration(durations.normal + 100)}
          exiting={FadeOut.duration(durations.micro + 50)}
          style={{ flex: 1 }}
        >
          {step === STEP.WELCOME && <Welcome onNext={goNext} />}
          {step === STEP.TILAWAT && <Tilawat onNext={goNext} />}
          {step === STEP.HADITH && <Hadith onNext={goNext} />}
          {step === STEP.STARTING_POINT && (
            <StartingPoint
              startingPoint={draft.startingPoint}
              onSelectStartingPoint={(value) =>
                setDraft((d) => ({ ...d, startingPoint: value as OnboardingDraft["startingPoint"] }))
              }
              onNext={goNext}
            />
          )}
          {step === STEP.BISMILLAH && <BismillahMoment onNext={goNext} />}
          {step === STEP.LETTER_REVEAL && <LetterReveal />}
          {step === STEP.LETTER_AUDIO && (
            <LetterAudio
              onNext={goNext}
              onPlayAudio={handlePlayAudio}
              hasPlayedAudio={hasPlayedAudio}
            />
          )}
          {step === STEP.LETTER_QUIZ && <LetterQuiz onNext={goNext} />}
          {step === STEP.NAME_MOTIVATION && (
            <NameMotivation
              userName={draft.userName}
              motivation={draft.motivation}
              onChangeName={(value) => setDraft((d) => ({ ...d, userName: value }))}
              onSelectMotivation={(value) => setDraft((d) => ({ ...d, motivation: value as OnboardingDraft["motivation"] }))}
              onNext={goNext}
            />
          )}
          {step === STEP.FINISH && (
            <Finish
              onFinish={handleFinish}
              finishing={finishing}
              finishError={finishError}
            />
          )}
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressContainer: {
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

export { STEP };
