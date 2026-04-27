import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../../design/tokens";
import type { TapExercise as TapExerciseData } from "../../types";
import type { EntityAttempt, ScreenOutcome } from "../../runtime/LessonRunner";

interface Props {
  screenId: string;
  exercise: TapExerciseData;
  retryMode: "until-correct" | "one-shot";
  advance: (outcome: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;
  onPlayAudio?: (path: string) => void;
}

type OptionState = "idle" | "correct" | "wrong" | "dim";

const WRONG_FEEDBACK_MS = 400;
const CORRECT_ADVANCE_MS = 900;

export function TapExercise({
  screenId,
  exercise,
  retryMode,
  advance,
  reportAttempt,
  onPlayAudio,
}: Props) {
  const colors = useColors();
  const [optionStates, setOptionStates] = useState<OptionState[]>(
    () => exercise.options.map(() => "idle")
  );
  const [locked, setLocked] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const handleTap = (optionIndex: number) => {
    if (locked) return;
    const opt = exercise.options[optionIndex];
    const attempt: EntityAttempt = {
      entityKey: opt.entityKey,
      itemId: screenId,
      correct: opt.correct,
    };

    if (opt.correct) {
      setLocked(true);
      setOptionStates(exercise.options.map((_, i) => (i === optionIndex ? "correct" : "dim")));
      advanceTimerRef.current = setTimeout(() => {
        advance({
          screenId,
          correct: true,
          entityAttempts: [attempt],
        });
      }, CORRECT_ADVANCE_MS);
      return;
    }

    if (retryMode === "one-shot") {
      setLocked(true);
      setOptionStates(
        exercise.options.map((o, i) =>
          i === optionIndex ? "wrong" : o.correct ? "correct" : "dim"
        )
      );
      advanceTimerRef.current = setTimeout(() => {
        advance({
          screenId,
          correct: false,
          entityAttempts: [attempt],
        });
      }, CORRECT_ADVANCE_MS);
      return;
    }

    // until-correct: flash red, keep options active
    reportAttempt([attempt]);
    setOptionStates((prev) =>
      prev.map((s, i) => (i === optionIndex ? "wrong" : s))
    );
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = setTimeout(() => {
      setOptionStates((prev) => prev.map((s, i) => (i === optionIndex ? "idle" : s)));
    }, WRONG_FEEDBACK_MS);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.text }]}>{exercise.prompt}</Text>
      <View style={styles.options}>
        {exercise.options.map((opt, i) => {
          const state = optionStates[i];
          return (
            <Pressable
              key={i}
              onPress={() => handleTap(i)}
              disabled={locked}
              style={[
                styles.option,
                state === "correct" && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                state === "wrong" && { borderColor: colors.danger, backgroundColor: colors.dangerLight },
                state === "dim" && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={opt.display}
            >
              <Text style={[styles.glyph, { color: colors.text }]}>{opt.display}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.md, gap: spacing.lg },
  prompt: { ...typography.body, textAlign: "center" },
  options: { flexDirection: "row", gap: spacing.sm },
  option: {
    flex: 1, borderWidth: 2, borderColor: "#e8e2cf",
    borderRadius: radii.lg, padding: spacing.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  glyph: { fontFamily: fontFamilies.arabicRegular, fontSize: 44, lineHeight: 56 },
});
