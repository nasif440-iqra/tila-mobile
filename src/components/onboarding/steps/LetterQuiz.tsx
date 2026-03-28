import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, radii, fontFamilies } from "../../../design/tokens";
import { playCorrect, playTap, playWrong } from "../../../audio/player";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { STAGGER_BASE, STAGGER_DURATION } from "../animations";

export function LetterQuiz({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  function handleAnswerSelect(name: string) {
    if (answerChecked) return;
    playTap();
    setSelectedAnswer(name);
  }

  function handleCheckAnswer() {
    const correct = selectedAnswer === "Alif";
    setIsCorrect(correct);
    setAnswerChecked(true);
    if (correct) {
      playCorrect();
    } else {
      playWrong();
      setTimeout(() => {
        setAnswerChecked(false);
        setIsCorrect(null);
        setSelectedAnswer(null);
      }, 1200);
    }
  }

  return (
    <OnboardingStepLayout
      variant="centered"
      fadeInDuration={STAGGER_DURATION}
      footer={
        !answerChecked ? (
          <Button
            title="Check"
            onPress={handleCheckAnswer}
            disabled={!selectedAnswer}
            style={styles.fullWidthBtn}
          />
        ) : isCorrect ? (
          <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
        ) : null
      }
    >
      {/* Prompt */}
      <Animated.Text
        entering={FadeInDown.delay(0).duration(STAGGER_DURATION)}
        style={[styles.quizPrompt, { color: colors.brown }]}
      >
        Which one is Alif?
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Answer cards */}
      <Animated.View
        entering={FadeIn.delay(STAGGER_BASE).duration(STAGGER_DURATION)}
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
                  entering={FadeIn.delay(STAGGER_BASE).duration(300)}
                  style={[styles.answerLabel, { color: colors.primary }]}
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
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: 300,
  },
  fullWidthBtn: {
    width: "100%",
  },
});
