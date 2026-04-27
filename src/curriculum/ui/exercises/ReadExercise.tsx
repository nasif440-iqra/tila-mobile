import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import { useColors } from "../../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../../design/tokens";
import type { ReadExercise as ReadExerciseData } from "../../types";
import type { ScreenOutcome } from "../../runtime/LessonRunner";

interface Props {
  screenId: string;
  exercise: ReadExerciseData;
  advance: (outcome?: ScreenOutcome) => void;
  onPlayAudio?: (path: string) => void;
}

// Single source of truth for the attempt-locked delay.
// SPEC Constraint 2: micro-attempt enforcement.
const READ_ATTEMPT_DELAY_MS = 1500;

// Simulated audio playback duration. Used because the route does not yet
// wire onPlayAudio to a real audio engine. Replace with the audio player's
// playback-end callback when audio plumbing lands.
const READ_AUDIO_DURATION_MS = 800;

const FADE_MS = 240;

type State =
  | "attempt-locked"
  | "attempt-open"
  | "playing"
  | "revealed"
  | "replaying";

export function ReadExercise({ screenId, exercise, advance, onPlayAudio }: Props) {
  const colors = useColors();
  const [state, setState] = useState<State>("attempt-locked");

  const checkOpacity = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock timer — fades Check in after the delay.
  useEffect(() => {
    lockTimer.current = setTimeout(() => {
      setState("attempt-open");
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, READ_ATTEMPT_DELAY_MS);
    return () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [checkOpacity]);

  // Cleanup audio timer on unmount to avoid setState on unmounted component.
  useEffect(() => {
    return () => {
      if (audioTimer.current) clearTimeout(audioTimer.current);
    };
  }, []);

  const playModelAudio = () => {
    onPlayAudio?.(exercise.audioModel);
    if (audioTimer.current) clearTimeout(audioTimer.current);
    audioTimer.current = setTimeout(() => {
      setState("revealed");
    }, READ_AUDIO_DURATION_MS);
  };

  const handleCheck = () => {
    if (state !== "attempt-open") return;
    setState("playing");
    Animated.timing(revealOpacity, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    playModelAudio();
  };

  const handleReplay = () => {
    if (state !== "revealed") return;
    setState("replaying");
    playModelAudio();
  };

  const handleContinue = () => {
    advance();
  };

  // ── Visibility gates ──
  const showCheck = state === "attempt-open" || state === "playing";
  const checkDisabled = state === "playing";
  const showReveal =
    state === "playing" || state === "revealed" || state === "replaying";
  const showReplay = state === "revealed";
  const showContinue = state === "revealed" || state === "replaying";

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.text }]}>{exercise.prompt}</Text>

      <Text style={[styles.glyph, { color: colors.text }]}>{exercise.display}</Text>

      {showReveal && exercise.revealCopy ? (
        <Animated.Text
          style={[styles.reveal, { color: colors.textSoft, opacity: revealOpacity }]}
        >
          {exercise.revealCopy}
        </Animated.Text>
      ) : null}

      <View style={styles.actionRow}>
        {showCheck ? (
          <Animated.View style={{ opacity: checkOpacity }}>
            <Pressable
              onPress={handleCheck}
              disabled={checkDisabled}
              style={[
                styles.check,
                { backgroundColor: colors.primary },
                checkDisabled && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Check"
            >
              <Text style={[styles.checkText, { color: colors.bg }]}>Check</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {showReplay ? (
          <Pressable
            onPress={handleReplay}
            style={styles.replay}
            accessibilityRole="button"
            accessibilityLabel="Replay"
          >
            <Text style={[styles.replayText, { color: colors.textSoft }]}>↺ Replay</Text>
          </Pressable>
        ) : null}
      </View>

      {showContinue ? (
        <Pressable
          onPress={handleContinue}
          style={[styles.continue, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={[styles.continueText, { color: colors.bg }]}>Continue</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  prompt: { ...typography.body, textAlign: "center" },
  glyph: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 96,
    lineHeight: 192,
    writingDirection: "rtl",
    overflow: "visible",
  },
  reveal: { ...typography.body, fontStyle: "italic", textAlign: "center" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
  },
  check: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    minWidth: 160,
    alignItems: "center",
  },
  checkText: { ...typography.body, fontWeight: "600" },
  replay: { padding: spacing.xs },
  replayText: { ...typography.label },
  continue: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignSelf: "stretch",
    alignItems: "center",
  },
  continueText: { ...typography.body, fontWeight: "600" },
});

// Note on `screenId`: not currently used by ReadExercise (Read is unscored
// in A0 and produces no entity attempts). Kept in the props signature for
// dispatcher-call symmetry and future scored-Read variants.
export const __testing = { READ_ATTEMPT_DELAY_MS, READ_AUDIO_DURATION_MS };
